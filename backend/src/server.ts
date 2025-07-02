// src/server.ts
import express, { Request, Response, NextFunction } from 'express'; // Importa Request, Response, NextFunction
import dotenv from 'dotenv';
import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2/promise'; // Importa RowDataPacket y ResultSetHeader
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken'; // Importa JwtPayload
import cors from 'cors';


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


// 5. Interfaz para los datos del Cliente tal como vienen de la DB
interface DbCliente extends RowDataPacket {
  id: number;
  nombres: string;
  apellidos: string;
  telefono?: string;
  correo?: string;
  fecha_creacion: Date; // O Date | string
}

// 6. Interfaz para el cuerpo de la solicitud de Login
interface LoginRequestBody {
  correo: string;
  contrasena: string;
}

// 7. Interfaz para el cuerpo de la solicitud de creación de Usuario
interface CreateUserRequestBody {
  nombres: string;
  apellidos: string;
  telefono?: string;
  correo: string;
  contrasena: string; // Contraseña en texto plano para el hash
  rol: UserRole;
}

// 8. Interfaz para la respuesta de APIs paginadas
// interface PaginatedResponse<T> {
//   data: T[];
//   totalCount: number;
//   currentPage: number;
//   pageSize: number;
// }

// 9. Interfaz para la respuesta de error genérica
interface ErrorMessageResponse {
  message: string;
}

// 10. Interfaz para la respuesta de éxito del Login
interface LoginSuccessResponse {
  message: string;
  token: string;
  userRole: UserRole;
}

// Interfaz para la respuesta exitosa de eliminación
interface DeleteUserSuccessResponse {
  message: string;
}

// Interfaz para la respuesta exitosa de creación de usuario
interface CreateUserSuccessResponse {
  message: string;
  userId: number;
}

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'bd_LeimaLegal',
};

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

        const token = jwt.sign({ id: user.id, correo: user.correo, rol: user.rol }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
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
            ultimosClientes: (results as any)[3]
        };
        
        res.json(stats);

    } catch (error) {
        console.error('Error al obtener estadísticas del dashboard:', error); // eslint-disable-line no-console
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Iniciar el servidor solo después de conectar a la base de datos
connectToDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`); // eslint-disable-line no-console
  });
});