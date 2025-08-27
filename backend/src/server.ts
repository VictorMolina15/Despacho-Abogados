// src/server.ts
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import mysql, { RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken'; 
import { S3Client, PutObjectCommand, DeleteObjectsCommand,  GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import cors from 'cors';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import multer from 'multer';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';


dotenv.config(); // Carga las variables de entorno desde .env
const app = express();
const port = process.env.PORT || 3000; // Puerto del servidor, o 3000 por defecto

// Middleware para habilitar CORS
app.use(cors());

// Middleware para parsear JSON en el cuerpo de las peticiones
app.use(express.json());

// --- Definiciones de Interfaces ---

// 1. Tipos para los roles de usuario (ya los tienes como ENUM, lo reusamos)
type UserRole = 'SuperAdmin' | 'Admin' | 'Usuario';

interface AugmentedRequest extends Request {
  user?: UserJWTPayload; // Aquí definimos la propiedad 'user'
}

// 2. Interfaz para los datos del Usuario tal como vienen de la DB
interface DbUser extends RowDataPacket {
  id: number;
  nombres: string;
  apellidos: string;
  telefono?: string; // Opcional, ya que puede ser NULL
  correo: string;
  contrasena_hash: string;
  rol: UserRole;
  fecha_registro: Date; // O Date | string si el formato no es consistente al leerlo
}

// 3. Interfaz para el payload de JWT (lo que guardas en el token)
interface UserJWTPayload extends JwtPayload {
  id: number;
  correo: string;
  rol: UserRole;
}


// 4. Interfaz para los datos del Cliente tal como vienen de la DB
interface DbCliente extends RowDataPacket {
  id: number;
  nombres: string;
  apellidos: string;
  telefono?: string;
  correo?: string;
  fecha_creacion: Date; // O Date | string
}

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'bd_LeimaLegal',
};

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '587', 10),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

let connection: mysql.Connection;

async function connectToDatabase(): Promise<mysql.Connection> { // Tipado de retorno
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Conectado a la base de datos MySQL exitosamente!'); // eslint-disable-line no-console
    return connection;
  } catch (error: unknown) { // Error ahora es 'unknown' para seguridad
    // Puedes usar un 'type guard' o un 'instanceof' si sabes el tipo de error
    if (error instanceof Error) {
      console.error('Error al conectar a la base de datos:', error.message); // eslint-disable-line no-console
    } else {
      console.error('Error desconocido al conectar a la base de datos:', error); // eslint-disable-line no-console
    }
    process.exit(1);
  }
}


// --- Configuración del Cliente S3 ---
const s3Client = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true, // ¡Importante para MinIO!
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ''
  }
});

// Configuración de Multer para manejar el archivo en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware para verificar la autenticación y el rol
const authenticateToken = (req: AugmentedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).json({ message: 'Token no proporcionado.' });

  // jwt.verify puede retornar JwtPayload | string.
  // Lo asumimos como UserJWTPayload, pero podrías añadir validación.
  jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
    if (err) {
      console.error('Error al verificar token:', err.message); // eslint-disable-line no-console
      return res.status(403).json({ message: 'Token inválido o expirado.' });
    }
    // Asignamos el user tipado a req.user (gracias a 'declare global')
    req.user = user as UserJWTPayload;
    next();
  });
};

const authorizeRoles = (roles: UserRole[]) => { // Tipado de roles
  return (req: AugmentedRequest, res: Response, next: NextFunction) => {
    // Ahora req.user ya está tipado gracias al declare global y al middleware previo
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tienes permisos para realizar esta acción.' });
    }
    next();
  };
};

// --- RUTAS API ---

// Ruta de prueba
app.get('/', (req: Request, res: Response) => {
  res.send('Backend del Despacho de Abogados funcionando!');
});

// Ruta para obtener todos los usuarios (solo para SuperAdmin)
app.get('/api/usuarios', authenticateToken, authorizeRoles(['SuperAdmin']), async (req: Request, res: Response) => {
  try {
    // 1. Sanitizamos y aseguramos que los valores de paginación sean números
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const pageSize = Math.max(1, parseInt(req.query.pageSize as string || '10'));
    const searchTerm = req.query.searchTerm as string || '';
    const offset = (page - 1) * pageSize;

    const loggedInUserId = (req as AugmentedRequest).user?.id || 0;

    // 2. Construimos la consulta con LIMIT y OFFSET como valores directos (es seguro)
    const searchPattern = `%${searchTerm}%`;
    const [results]: any = await connection.query(
      'CALL sp_GetUsers(?, ?, ?, ?)',
      [searchPattern, loggedInUserId, pageSize, offset]
    );

    // `results` contendría dos arrays: el primero con los usuarios y el segundo con el conteo.
    const users = results[0];
    const totalCount = results[1][0].totalCount;

    res.json({ data: users, totalCount });

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error al obtener usuarios:', error.message); // eslint-disable-line no-console
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Ruta de Login
app.post('/api/login', async (req, res) => {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) return res.status(400).json({ message: 'Correo y contraseña son requeridos.' });

    try {
        const [rows] = await connection.query<DbUser[]>('CALL sp_GetUserForLogin(?)', [correo]);
        const user = rows[0]?.[0];

        if (!user) return res.status(401).json({ message: 'Credenciales inválidas.' });

        const isMatch = await bcrypt.compare(contrasena, user.contrasena_hash);
        if (!isMatch) return res.status(401).json({ message: 'Credenciales inválidas.' });

        const token = jwt.sign({ id: user.id, correo: user.correo, rol: user.rol }, process.env.JWT_SECRET as string);
        res.json({ message: 'Inicio de sesión exitoso.', token, userRole: user.rol });
    } catch (error) {
        console.error('Error en el login:', error); // eslint-disable-line no-console
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Ruta para obtener clientes paginados
app.get('/api/clientes', authenticateToken, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string || '1'));
        const pageSize = Math.max(1, parseInt(req.query.pageSize as string || '10'));
        const searchTerm = req.query.searchTerm as string || '';
        const offset = (page - 1) * pageSize;
        const searchPattern = `%${searchTerm}%`;

        const [results] = await connection.query('CALL sp_GetClients(?, ?, ?)', [searchPattern, pageSize, offset]);
        const clientes = (results as any)[0];
        const totalCount = (results as any)[1][0].totalCount;
        
        res.json({ data: clientes, totalCount });
    } catch (error) {
        console.error('Error al obtener clientes:', error); // eslint-disable-line no-console
        res.status(500).json({ message: 'Error al obtener clientes.' });
    }
});

// Ruta para obtener un cliente específico por su ID
app.get('/api/clientes/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await connection.query<DbCliente[]>('CALL sp_GetClientById(?)', [id]);
        const cliente = (rows as any)[0]?.[0];

        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }
        res.json(cliente);
    } catch (error) {
        console.error('Error al obtener cliente:', error);// eslint-disable-line no-console
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Ruta para actualizar un cliente
app.put('/api/clientes/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { nombres, apellidos, telefono, correo } = req.body;

    if (!nombres || !apellidos || !correo) {
        return res.status(400).json({ message: 'Nombres, apellidos y correo son requeridos.' });
    }

    try {
        await connection.query('CALL sp_UpdateClient(?, ?, ?, ?, ?)', [id, nombres, apellidos, telefono, correo]);
        res.json({ message: 'Cliente actualizado exitosamente.' });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });
        }
        console.error('Error al actualizar cliente:', error); // eslint-disable-line no-console
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Ruta para AÑADIR un nuevo cliente
app.post('/api/clientes', authenticateToken, async (req, res) => {
    const { nombres, apellidos, telefono, correo } = req.body;

    // Validación básica en el backend
    if (!nombres || !apellidos || !correo) {
        return res.status(400).json({ message: 'Nombres, apellidos y correo son requeridos.' });
    }

    try {
        // Llamamos al nuevo Stored Procedure
        const [result] = await connection.query<any>(
            'CALL sp_CreateClient(?, ?, ?, ?)', 
            [nombres, apellidos, telefono || null, correo]
        );
        
        res.status(201).json({ 
            message: 'Cliente creado exitosamente.', 
            clienteId: result[0][0].clienteId 
        });

    } catch (error: any) {
        // Manejo de errores, como un correo duplicado
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El correo electrónico ya está en uso por otro cliente.' });
        }
        console.error('Error al crear cliente:', error); // eslint-disable-line no-console
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Ruta para añadir un nuevo usuario (solo para SuperAdmin)
app.post('/api/usuarios', authenticateToken, authorizeRoles(['SuperAdmin']), async (req, res) => {
    const { nombres, apellidos, telefono, correo, contrasena, rol } = req.body;
    if (!nombres || !apellidos || !correo || !contrasena || !rol) return res.status(400).json({ message: 'Todos los campos son requeridos.' });

    try {
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        const [result] = await connection.query<any>('CALL sp_CreateUser(?, ?, ?, ?, ?, ?)', [nombres, apellidos, telefono, correo, hashedPassword, rol]);
        res.status(201).json({ message: 'Usuario creado exitosamente.', userId: result[0][0].userId });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
        console.error('Error al crear usuario:', error); // eslint-disable-line no-console
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Ruta para obtener un usuario por ID (solo para SuperAdmin)
app.get('/api/usuarios/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const loggedInUser = (req as AugmentedRequest).user;
    if (loggedInUser?.rol !== 'SuperAdmin' && Number(id) !== loggedInUser?.id) return res.status(403).json({ message: 'No autorizado.' });
    
    try {
        const [rows] = await connection.query<DbUser[]>('CALL sp_GetUserById(?)', [id]);
        const user = rows[0]?.[0];
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
        res.json(user);
    } catch (error) {
        console.error('Error al obtener usuario:', error); // eslint-disable-line no-console
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Ruta para actualizar un usuario (autorizado para el usuario mismo o SuperAdmin)
app.put('/api/usuarios/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const loggedInUser = (req as AugmentedRequest).user;
    if (Number(id) !== loggedInUser?.id && loggedInUser?.rol !== 'SuperAdmin') return res.status(403).json({ message: 'No autorizado.' });

    try {
        const { nombres, apellidos, telefono, correo, rol, contrasena } = req.body;
        const hashedPassword = contrasena ? await bcrypt.hash(contrasena, 10) : null;
        
        // El SP usará COALESCE, por lo que pasamos null para los campos que no queremos actualizar
        await connection.query('CALL sp_UpdateUser(?, ?, ?, ?, ?, ?, ?)', [
            id,
            nombres ?? null,
            apellidos ?? null,
            telefono ?? null,
            correo ?? null,
            loggedInUser?.rol === 'SuperAdmin' ? rol : null, // Solo SuperAdmin puede cambiar rol
            hashedPassword
        ]);
        res.json({ message: 'Usuario actualizado exitosamente.' });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'El correo ya está en uso.' });
        console.error('Error al actualizar usuario:', error); // eslint-disable-line no-console
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Ruta para eliminar un usuario (solo para SuperAdmin)
app.delete('/api/usuarios/:id', authenticateToken, authorizeRoles(['SuperAdmin']), async (req, res) => {
    const { id } = req.params;
    try {
        await connection.query('CALL sp_DeleteUser(?)', [id]);
        res.json({ message: 'Usuario eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error); // eslint-disable-line no-console
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.get('/api/dashboard-stats', authenticateToken, async (req, res) => {
    try {
        const [results] = await connection.query('CALL sp_GetDashboardStats()');
        
        // El resultado es un array de arrays, cada uno corresponde a un SELECT del SP
        const stats = {
            totalClientes: (results as any)[0][0].totalClientes,
            totalExpedientes: (results as any)[1][0].totalExpedientes,
            expedientesPorTipo: (results as any)[2],
            ultimosClientes: (results as any)[3],
            expedientesPorEstado: (results as any)[4],
            ultimosExpedientes: (results as any)[5]
        };
        
        res.json(stats);

    } catch (error) {
        console.error('Error al obtener estadísticas del dashboard:', error); // eslint-disable-line no-console
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Ruta para generar una URL pre-firmada para subir un archivo
app.post('/api/expedientes/generate-upload-url', authenticateToken, async (req, res) => {
  const { fileName, fileType } = req.body;
  
  if (!fileName || !fileType) {
    return res.status(400).json({ message: 'fileName y fileType son requeridos.' });
  }

  const fileKey = `expedientes/${Date.now()}_${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
  });

  try {
    const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL válida por 1 hora
    res.json({ uploadURL, fileKey });
  } catch (error) {
    console.error('Error generando URL pre-firmada:', error); // eslint-disable-line no-console
    res.status(500).json({ message: 'No se pudo generar la URL de subida.' });
  }
});

// OBTENER todos los expedientes de un cliente específico
app.get('/api/clientes/:clienteId/expedientes', authenticateToken, async (req, res) => {
    const { clienteId } = req.params;
    try {
        // Asumimos un SP que obtiene los expedientes por cliente
        const [expedientes] = await connection.query('CALL sp_GetExpedientesByCliente(?)', [clienteId]);
        res.json((expedientes as any)[0]);
    } catch (error) {
        console.error('Error al obtener expedientes:', error); // eslint-disable-line no-console
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// CREAR un nuevo expediente (con documentos)
app.post('/api/expedientes', authenticateToken, async (req, res) => {
    const { cliente_id, tipo, numero_expediente, estado, descripcion, documentos } = req.body;
    const usuario_id = (req as AugmentedRequest).user?.id; // Obtenemos el ID del usuario logueado

    if (!cliente_id || !tipo || !numero_expediente || !estado || !usuario_id) {
        return res.status(400).json({ message: 'Faltan campos requeridos.' });
    }

    try {
        // Llamamos a un nuevo Stored Procedure que manejará la transacción
        const [result] = await connection.query<any>(
            'CALL sp_CreateExpedienteConDocumentos(?, ?, ?, ?, ?, ?, ?)',
            [cliente_id, tipo, numero_expediente, estado, descripcion, usuario_id, JSON.stringify(documentos)]
        );

        res.status(201).json({ message: 'Expediente creado exitosamente.', expedienteId: result[0][0].expedienteId });

    } catch (error) {
        console.error('Error al crear expediente:', error); // eslint-disable-line no-console
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// OBTENER todos los tipos de expediente
app.get('/api/tipos-expediente', authenticateToken, async (req, res) => {
    try {
        const [tipos] = await connection.query('CALL sp_GetTiposExpediente()');
        res.json((tipos as any)[0]);
    } catch (error) {
        console.error('Error al obtener tipos de expediente:', error); // eslint-disable-line no-console
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// ACTUALIZAR un expediente existente
app.put('/api/expedientes/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    // Extraemos el array de nuevos documentos del cuerpo de la petición
    const { tipo, numero_expediente, estado, descripcion, documentos } = req.body;
    const usuario_id = (req as AugmentedRequest).user?.id;

    if (!id || !tipo || !numero_expediente || !estado || !usuario_id) {
        return res.status(400).json({ message: 'Faltan campos requeridos.' });
    }

    try {
        // Llamamos al nuevo SP y le pasamos los nuevos documentos como un string JSON
        await connection.query(
            'CALL sp_UpdateExpedienteAndAddDocuments(?, ?, ?, ?, ?, ?, ?)',
            [id, tipo, numero_expediente, estado, descripcion, usuario_id, JSON.stringify(documentos || [])]
        );
        res.json({ message: 'Expediente actualizado exitosamente.' });
    } catch (error) {
        console.error('Error al actualizar expediente:', error); // eslint-disable-line no-console
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Ruta para generar una URL pre-firmada para DESCARGAR/VER un archivo
app.post('/api/documentos/generate-download-url', authenticateToken, async (req, res) => {
  const { fileKey } = req.body; // Recibimos el 'storage_key' del documento

  if (!fileKey) {
    return res.status(400).json({ message: 'El fileKey es requerido.' });
  }

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileKey,
  });

  try {
    // Genera una URL que expira en 1 hora (3600). 
    const downloadURL = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); 
    res.json({ downloadURL });
  } catch (error) {
    console.error('Error generando URL de descarga pre-firmada:', error); // eslint-disable-line no-console
    res.status(500).json({ message: 'No se pudo generar la URL de descarga.' });
  }
});

// ELIMINAR un expediente y sus archivos asociados en S3/MinIO
app.delete('/api/expedientes/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Llamar al SP para borrar en la DB y obtener las llaves de los archivos
        const [results] = await connection.query<any>('CALL sp_DeleteExpedienteAndGetKeys(?)', [id]);
        const filesToDelete = results[0];

        // 2. Si hay archivos asociados, borrarlos del bucket
        if (filesToDelete && filesToDelete.length > 0) {
            const deleteParams = {
                Bucket: process.env.S3_BUCKET_NAME,
                Delete: {
                    Objects: filesToDelete.map((file: { storage_key: string }) => ({ Key: file.storage_key }))
                }
            };

            // Creamos y enviamos el comando para borrar múltiples objetos
            const deleteCommand = new DeleteObjectsCommand(deleteParams);
            await s3Client.send(deleteCommand);
        }

        res.json({ message: 'Expediente y documentos asociados eliminados exitosamente.' });

    } catch (error) {
        console.error('Error al eliminar expediente:', error); // eslint-disable-line no-console
        res.status(500).json({ message: 'Error interno del servidor al eliminar.' });
    }
});

app.post('/api/request-password-reset', async (req, res) => {
  const { correo } = req.body;
  if (!correo) {
    return res.status(400).json({ message: 'El correo es requerido.' });
  }

  try {
    const [rows] = await connection.query<DbUser[]>('SELECT id FROM Usuario WHERE correo = ?', [correo]);
    const user = rows[0];

    if (user) {
      // 1. Generar un token seguro
      const resetToken = crypto.randomBytes(32).toString('hex');
      // 2. Hashear el token antes de guardarlo en la BD (¡importante!)
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

      // 3. Guardar el token hasheado en la BD
      await connection.query('CALL sp_SaveResetToken(?, ?, ?)', [user.id, tokenHash, 60]); // 60 minutos de expiración

      // 4. Construir el enlace de restablecimiento (apuntando a tu frontend)
      const resetUrl = `http://localhost:5174/reset-password/${resetToken}`;

      // 5. Enviar el correo
      const info = await transporter.sendMail({
        from: `Leima Legal <${process.env.MAIL_FROM}>`,
        to: correo,
        subject: 'Restablecimiento de Contraseña',
        html: `
          <img src="https://leimalegal.com/wp-content/uploads/2025/01/Leima-despacho-juridico.webp" alt="Leima Legal Logo" style="width:250px;float:right;margin-bottom:10px;" />
          <p>Has solicitado restablecer tu contraseña.</p>
          <p>Haz clic en el siguiente enlace para continuar:</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p>Si no solicitaste esto, ignora este correo.</p>
          <br><br><br>
          <p>*<i>Este es un mensaje automático, por favor no responda.</i></p>
        `,
      });

      // Nodemailer con Ethereal te da una URL para ver el correo enviado
      console.log("Correo de prueba enviado. Vista previa disponible en: %s", nodemailer.getTestMessageUrl(info)); // eslint-disable-line no-console
    }

    // Siempre enviamos una respuesta positiva para evitar que se pueda saber qué correos existen
    res.json({ message: 'Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.' });

  } catch (error) {
    console.error('Error en la solicitud de reseteo:', error); // eslint-disable-line no-console
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA PARA ESTABLECER LA NUEVA CONTRASEÑA
app.post('/api/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'El token y la nueva contraseña son requeridos.' });
  }

  try {
    // 1. Hashear el token recibido para buscarlo en la BD
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Validar el token y obtener el ID del usuario
    const [rows] = await connection.query<any>('CALL sp_ValidateAndUseToken(?)', [tokenHash]);
    const result = rows[0]?.[0];

    if (!result || !result.user_id) {
      return res.status(400).json({ message: 'El token es inválido, ha expirado o ya fue utilizado.' });
    }

    const userId = result.user_id;

    // 3. Hashear la nueva contraseña
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 4. Actualizar la contraseña del usuario en la tabla Usuario
    await connection.query('UPDATE Usuario SET contrasena_hash = ? WHERE id = ?', [newPasswordHash, userId]);

    res.json({ message: 'Contraseña actualizada exitosamente.' });

  } catch (error) {
    console.error('Error al restablecer la contraseña:', error); // eslint-disable-line no-console
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// ------------------- RUTA PARA TRELLO -------------------------

app.get('/api/trello-stats', authenticateToken, async (req, res) => {
  const { TRELLO_API_KEY, TRELLO_API_TOKEN, TRELLO_BOARD_ID } = process.env;

  if (!TRELLO_API_KEY || !TRELLO_API_TOKEN || !TRELLO_BOARD_ID) {
    return res.status(500).json({ message: 'La configuración de Trello no está completa en el servidor.' });
  }

  const url = `https://api.trello.com/1/boards/${TRELLO_BOARD_ID}/lists?cards=open&key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}`;

  try {
    const trelloResponse = await fetch(url);
    if (!trelloResponse.ok) throw new Error('No se pudo obtener la información de Trello.');
    const listsData = await trelloResponse.json();

    // --- LÓGICA DE FECHAS CORREGIDA ---
    const today = new Date(); // Nuestra fecha base, que no modificaremos
    today.setHours(0, 0, 0, 0); // Estandarizamos a la medianoche para evitar problemas de hora

    // "Esta semana" (de domingo a sábado)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999); // Final del día sábado

    // "Este mes"
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999); // Final del último día del mes

    const stats = {
      nuevasSolicitudes: 0,
      confirmadasEstaSemana: 0,
      completadasEsteMes: 0,
      canceladasEsteMes: 0,
    };

    for (const list of listsData) {
      if (list.name.toLowerCase().includes('nuevas')) {
        stats.nuevasSolicitudes = list.cards.length;
      } else if (list.name.toLowerCase().includes('confirmada')) {
        stats.confirmadasEstaSemana = list.cards.filter((card: any) => {
          if (!card.due) return false;
          const dueDate = new Date(card.due);
          return dueDate >= startOfWeek && dueDate <= endOfWeek;
        }).length;
      } else if (list.name.toLowerCase().includes('completada')) {
        stats.completadasEsteMes = list.cards.filter((card: any) => {
          if (!card.due) return false; // Solo contamos las que tienen fecha de cita
          const dueDate = new Date(card.due);
          return dueDate >= startOfMonth && dueDate <= endOfMonth;
        }).length;
      } else if (list.name.toLowerCase().includes('cancelada')) {
        stats.canceladasEsteMes = list.cards.length; 
      }
    }

    res.json(stats);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error al obtener estadísticas de Trello:', message); //eslint-disable-line no-console
    res.status(500).json({ message });
  }
});

// RUTA PARA OBTENER TARJETAS DE TRELLO (CON FILTROS Y MÚLTIPLES LISTAS)
app.get('/api/trello/cards', authenticateToken, async (req, res) => {
  const { listNames, searchTerm } = req.query; 
  const { TRELLO_API_KEY, TRELLO_API_TOKEN, TRELLO_BOARD_ID } = process.env;

  if (!TRELLO_API_KEY || !TRELLO_API_TOKEN || !TRELLO_BOARD_ID || !listNames) {
    return res.status(500).json({ message: 'La configuración de Trello o los parámetros son incorrectos.' });
  }
  
  const listNamesArray = (listNames as string).split(',');
  try {
    // 1. Obtenemos todas las listas del tablero para encontrar sus IDs
    const listsUrl = `https://api.trello.com/1/boards/${TRELLO_BOARD_ID}/lists?key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}`;
    const listsResponse = await fetch(listsUrl);
    if (!listsResponse.ok) throw new Error('No se pudieron obtener las listas de Trello.');
    const allLists = await listsResponse.json();

    const targetLists = allLists.filter((list: any) => listNamesArray.includes(list.name));

    if (targetLists.length === 0) {
      return res.json([]); // Si no se encuentran las listas, devolver un array vacío
    }

    // 2. Por cada lista encontrada, obtenemos sus tarjetas
    let allCards: any[] = [];
    for (const list of targetLists) {
      const cardsUrl = `https://api.trello.com/1/lists/${list.id}/cards?key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}`;
      const cardsResponse = await fetch(cardsUrl);
      const cards = await cardsResponse.json();
      // Añadimos el nombre de la lista a cada tarjeta para saber su estado
      cards.forEach((card: any) => card.listName = list.name);
      allCards = allCards.concat(cards);
    }
    
    // 3. Filtramos por el término de búsqueda si existe
    if (searchTerm) {
      allCards = allCards.filter((card: any) => 
        card.name.toLowerCase().includes((searchTerm as string).toLowerCase())
      );
    }

    // 4. Mapeamos para enviar solo los datos necesarios
    const cleanCards = allCards.map((card: any) => ({
      id: card.id,
      name: card.name,
      desc: card.desc,
      due: card.due, // La fecha de la cita
      listName: card.listName // El estado de la cita
    }));

    res.json(cleanCards);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ message });
  }
});


// RUTA PARA MOVER UNA TARJETA A OTRA LISTA Y AÑADIR NOTA
app.post('/api/trello/move-card/:cardId', authenticateToken, async (req: AugmentedRequest, res: Response) => {
  const { cardId } = req.params;
  const { targetList, note } = req.body; // Recibimos la nota opcional
  const userId = req.user?.id;

  if (!targetList || !userId) {
    return res.status(400).json({ message: 'Faltan parámetros requeridos.' });
  }
  
  const { TRELLO_API_KEY, TRELLO_API_TOKEN, TRELLO_LIST_ID_CONFIRMADAS, TRELLO_LIST_ID_CANCELADAS, TRELLO_LIST_ID_COMPLETADAS } = process.env;

  // Mapeamos el string del target a la variable de entorno correcta
  const listIdMap = {
    confirmadas: TRELLO_LIST_ID_CONFIRMADAS,
    canceladas: TRELLO_LIST_ID_CANCELADAS,
    completadas: TRELLO_LIST_ID_COMPLETADAS
  };

  const targetListId = listIdMap[targetList as keyof typeof listIdMap];

  if (!targetListId) {
    return res.status(500).json({ message: `La lista de destino '${targetList}' no está configurada.` });
  }

  const authQuery = `key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}`;

  try {
    // 1. OBTENEMOS la tarjeta actual para leer su descripción
    const getCardUrl = `https://api.trello.com/1/cards/${cardId}?${authQuery}`;
    const getResponse = await fetch(getCardUrl);
    if (!getResponse.ok) throw new Error('No se pudo encontrar la tarjeta en Trello.');
    const cardData = await getResponse.json();
    const currentDesc = cardData.desc || '';

    // 2. CONSTRUIMOS la nueva descripción
    let newDesc = currentDesc;
    if (note && note.trim() !== '') {
      const noteTimestamp = new Date().toLocaleString('es-MX');
      newDesc += `\n\n-[Nota del ${noteTimestamp}]-\n${note}`;
    }

    // 3. ACTUALIZAMOS la tarjeta con la nueva lista Y la nueva descripción
    const updateCardUrl = `https://api.trello.com/1/cards/${cardId}?idList=${targetListId}&desc=${encodeURIComponent(newDesc)}&${authQuery}`;
    const updateResponse = await fetch(updateCardUrl, { method: 'PUT' });
    if (!updateResponse.ok) throw new Error('No se pudo mover la tarjeta en Trello.');
    
    const accion = `Cita movida a ${targetList}` + (note ? ` con nota.` : '.');
    await connection.query('CALL sp_LogTrelloAction(?, ?, ?)', [userId, cardId, accion]);

    res.json({ message: 'Tarjeta actualizada exitosamente.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ message });
  }
});

// ------------------- RUTA DEL CHATBOT -------------------------

app.post('/api/chatbot/interaction', authenticateToken, upload.single('file'), async (req: AugmentedRequest, res: Response) => {
  const message = req.body.message;
  const file = req.file; // El archivo subido por el usuario
  const userId = req.user?.id;

  try {
    let responseText = '';

    // CASO 1: El usuario adjuntó un archivo. 
    if (file) {
      let extractedText = '';

      // Identificamos el tipo de archivo y usamos la librería correcta
      if (file.mimetype === 'application/pdf') {
        const data = await pdf(file.buffer);
        extractedText = data.text;
      } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // .docx
        const { value } = await mammoth.extractRawText({ buffer: file.buffer });
        extractedText = value;
      } else if (file.mimetype === 'text/plain') { // .txt
        extractedText = file.buffer.toString('utf8');
      } else {
        throw new Error('Formato de archivo no soportado. Por favor, sube un PDF, DOCX o TXT.');
      }

      if (!extractedText.trim()) {
        throw new Error('El documento parece estar vacío o no se pudo leer su contenido.');
      }

      // Llamamos a un webhook de Make para resumir el texto extraído
      const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL_SUMMARIZE; 
      if (!makeWebhookUrl) throw new Error('Webhook de resumen no configurado.');

      const makeResponse = await fetch(makeWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          textContent: extractedText, // <-- Se envía el texto extraído
          originalMessage: message,
          userId
        })
      });

      if (!makeResponse.ok) throw new Error('El servicio de resúmenes no respondió correctamente.');

      const chatbotResponse = await makeResponse.json();
      responseText = chatbotResponse.reply;

    } 
    // CASO 2: El usuario solo envió texto (lógica anterior).
    else {
      if (!message) {
        return res.status(400).json({ message: 'El mensaje es requerido.' });
      }

      const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;
      if (!makeWebhookUrl) throw new Error('Webhook de conversación no configurado.');

      const makeResponse = await fetch(makeWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, userId })
      });

      if (!makeResponse.ok) throw new Error('El servicio de chatbot no respondió correctamente.');

      const chatbotResponse = await makeResponse.json();
      responseText = chatbotResponse.reply;
    }

    // Enviamos la respuesta final unificada al frontend
    res.json({ reply: responseText });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor.';
    console.error('Error en /api/chatbot/interaction:', errorMessage); // eslint-disable-line no-console
    res.status(500).json({ message: errorMessage });
  }
});

// Iniciar el servidor solo después de conectar a la base de datos
connectToDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`); // eslint-disable-line no-console
  });
});