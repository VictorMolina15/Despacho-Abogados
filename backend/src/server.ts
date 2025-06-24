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
interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

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

// Ruta de Login
app.post('/api/login', async (req: Request<object, object, LoginRequestBody>,  res: Response<LoginSuccessResponse | ErrorMessageResponse>) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ message: 'Correo y contraseña son requeridos.' });
  }

  try {
    // Especificamos el tipo de retorno para 'rows'
    const [rows] = await connection.execute<DbUser[]>('SELECT id, correo, contrasena_hash, rol FROM Usuario WHERE correo = ?', [correo]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const user = rows[0]; // user ahora es de tipo DbUser

    // Comparar la contraseña proporcionada con el hash almacenado
    const isMatch = await bcrypt.compare(contrasena, user.contrasena_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, correo: user.correo, rol: user.rol },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' } // Token expira en 1 hora
    );

    res.json({ message: 'Inicio de sesión exitoso.', token, userRole: user.rol });

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error en el login:', error.message); // eslint-disable-line no-console
    } else {
      console.error('Error desconocido en el login:', error); // eslint-disable-line no-console
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


// Ruta para obtener clientes (ejemplo de ruta protegida y paginada)
app.get('/api/clientes', authenticateToken, async (req: Request<object, object, object, { page?: string; pageSize?: string; searchTerm?: string }>,
   res: Response<PaginatedResponse<DbCliente> | ErrorMessageResponse>) => {
    // req.user está disponible y tipado aquí
    // console.log('Usuario autenticado:', req.user); // eslint-disable-line no-console

    const page = parseInt(req.query.page || '1');
    const pageSize = parseInt(req.query.pageSize || '10');
    const searchTerm = req.query.searchTerm || '';
    const offset = (page - 1) * pageSize;

    try {
        let query = `SELECT * FROM Cliente`;
        let countQuery = `SELECT COUNT(*) as total FROM Cliente`;
        const queryParams: (string | number)[] = []; // Array de parámetros tipado
        const countQueryParams: (string | number)[] = [];

        if (searchTerm) {
            const searchPattern = `%${searchTerm}%`;
            query += ` WHERE nombres LIKE ? OR apellidos LIKE ? OR correo LIKE ? OR telefono LIKE ?`;
            countQuery += ` WHERE nombres LIKE ? OR apellidos LIKE ? OR correo LIKE ? OR telefono LIKE ?`;
            queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
            countQueryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(pageSize, offset);

        // Tipamos el resultado de clientes
        const [clientes] = await connection.execute<DbCliente[]>(query, queryParams);
        // Tipamos el resultado de totalRows
        const [totalRows] = await connection.execute<({ total: number } & RowDataPacket)[]>(countQuery, countQueryParams);
        const totalCount = totalRows[0].total;

        res.json({
            data: clientes,
            totalCount: totalCount,
            currentPage: page,
            pageSize: pageSize
        });

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Error al obtener clientes:', error.message); // eslint-disable-line no-console
        } else {
            console.error('Error desconocido al obtener clientes:', error); // eslint-disable-line no-console
        }
        res.status(500).json({ message: 'Error al obtener clientes.' });
    }
});


// Ruta para añadir un nuevo usuario (solo para SuperAdmin)
app.post('/api/usuarios', authenticateToken, authorizeRoles(['SuperAdmin']), async (req: Request<object, object, CreateUserRequestBody>, 
 res: Response<CreateUserSuccessResponse | ErrorMessageResponse>) => {
  const { nombres, apellidos, telefono, correo, contrasena, rol } = req.body;

  if (!nombres || !apellidos || !correo || !contrasena || !rol) {
    return res.status(400).json({ message: 'Todos los campos requeridos.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(contrasena, 10); // Hashear la contraseña

    // Tipamos el resultado de la inserción
    const [result] = await connection.execute<ResultSetHeader>(
      'INSERT INTO Usuario (nombres, apellidos, telefono, correo, contrasena_hash, rol) VALUES (?, ?, ?, ?, ?, ?)',
      [nombres, apellidos, telefono, correo, hashedPassword, rol]
    );

    res.status(201).json({ message: 'Usuario creado exitosamente.', userId: result.insertId });

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error al crear usuario:', error.message); // eslint-disable-line no-console
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
      }
    } else {
        console.error('Error desconocido al crear usuario:', error); // eslint-disable-line no-console
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Ruta para eliminar un usuario (solo para SuperAdmin)
app.delete('/api/usuarios/:id', authenticateToken, authorizeRoles(['SuperAdmin']), async (req: Request<{ id: string }>, 
  res: Response<DeleteUserSuccessResponse | ErrorMessageResponse>) => {
  const userId = req.params.id;

  try {
    // Tipamos el resultado de la eliminación
    const [result] = await connection.execute<ResultSetHeader>('DELETE FROM Usuario WHERE id = ?', [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.json({ message: 'Usuario eliminado exitosamente.' });

  } catch (error: unknown) {
    if (error instanceof Error) {
        console.error('Error al eliminar usuario:', error.message); // eslint-disable-line no-console
    } else {
        console.error('Error desconocido al eliminar usuario:', error); // eslint-disable-line no-console
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Iniciar el servidor solo después de conectar a la base de datos
connectToDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`); // eslint-disable-line no-console
  });
});