CREATE DATABASE IF NOT EXISTS bd_LeimaLegal;
USE bd_LeimaLegal;

-- 1. Tabla de Usuarios (Abogados y Personal del Despacho)
-- Almacena la información de quienes usarán la plataforma con sus roles.
CREATE TABLE Usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(100) NOT NULL UNIQUE, -- El correo debe ser único para el login
    contrasena_hash VARCHAR(255) NOT NULL, -- Suficientemente largo para almacenar hashes de contraseñas
    rol ENUM('SuperAdmin', 'Admin', 'Usuario') NOT NULL, -- Roles definidos
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Fecha de creación del usuario
);

-- 2. Tabla de Clientes
-- Almacena la información de los clientes del despacho.
CREATE TABLE Cliente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(100) UNIQUE, -- El correo del cliente debe ser único
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Fecha en que el cliente fue registrado
);

-- 3. Tabla de Expedientes (Casos Legales)
-- Almacena los detalles de cada caso y los enlaza a un cliente.
CREATE TABLE Expediente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL, -- Clave foránea para enlazar con la tabla Clientes
    tipo_id INT NOT NULL, -- Tipos de expedientes iniciales
    numero_expediente VARCHAR(150), -- Número completo del expediente (ej. "254/2023 juzgado...")
    estado VARCHAR(50) DEFAULT 'En Trámite', -- Estado actual del expediente (se puede hacer ENUM si los estados son fijos)
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Fecha de apertura del caso
    fecha_cierre TIMESTAMP NULL, -- Fecha de cierre del caso (puede ser nula si el caso está abierto)
    descripcion TEXT, -- Descripción general del expediente
    FOREIGN KEY (cliente_id) REFERENCES Cliente(id), -- Define la relación 1:N con Clientes
    FOREIGN KEY (tipo_id) REFERENCES Tipo_Expediente(id)
);

-- 4. Tabla de Documentos Generales (Formatos)
-- Almacena documentos y formatos que son de uso general para el despacho y subidos por admins.
CREATE TABLE Documento_General (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_documento VARCHAR(255) NOT NULL,
    url_descarga VARCHAR(500) NOT NULL, -- URL o ruta al archivo almacenado (ej. en la nube)
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Fecha de subida del documento
    usuario_subida_id INT NOT NULL, -- Clave foránea para enlazar con el Usuario que subió el documento
    FOREIGN KEY (usuario_subida_id) REFERENCES Usuario(id) -- Define la relación 1:N con Usuarios
);

-- 5. Tabla de Historial de Clientes (Auditoría de Cambios)
-- Registra cada modificación importante en los datos de un cliente.
CREATE TABLE Historial_Cliente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL, -- Clave foránea para enlazar con el Cliente modificado
    usuario_cambio_id INT NOT NULL, -- Clave foránea para enlazar con el Usuario que realizó el cambio
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora del cambio
    detalle_cambio TEXT NOT NULL, -- Descripción textual del cambio realizado (ej. "Teléfono actualizado")
    FOREIGN KEY (cliente_id) REFERENCES Cliente(id), -- Define la relación 1:N con Clientes
    FOREIGN KEY (usuario_cambio_id) REFERENCES Usuario(id) -- Define la relación 1:N con Usuarios
);

-- 6. Tabla de Tipos de Expediente
-- Almacena los diferentes tipos de casos para que sean dinámicos.
CREATE TABLE Tipo_Expediente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE, -- El nombre del tipo debe ser único
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla para Tokens de Restablecimiento de Contraseña
CREATE TABLE PasswordResetToken (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    fecha_expiracion TIMESTAMP NOT NULL,
    utilizado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES Usuario(id) ON DELETE CASCADE
);

-- 8. Tabla de Historial de Acciones (Auditoría de Tareas)
CREATE TABLE Historial_Acciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_tarjeta_trello VARCHAR(255) NOT NULL,
    accion_realizada VARCHAR(255) NOT NULL,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id)
);