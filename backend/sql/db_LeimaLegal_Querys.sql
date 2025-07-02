USE bd_LeimaLegal;

DELIMITER $$

-- 1. Login: Obtiene un usuario por su correo.
CREATE PROCEDURE sp_GetUserForLogin(
    IN p_Correo VARCHAR(100)
)
BEGIN
    SELECT id, correo, contrasena_hash, rol 
    FROM Usuario 
    WHERE correo = p_Correo;
END$$

-- 2. Lista de Clientes: Busca y pagina clientes.
CREATE PROCEDURE sp_GetClients(
    IN p_SearchTerm VARCHAR(255),
    IN p_PageSize INT,
    IN p_Offset INT
)
BEGIN
    -- Consulta para los datos paginados
    SELECT id, nombres, apellidos, telefono, correo, fecha_creacion 
    FROM Cliente 
    WHERE 
        -- CAMBIO CLAVE: Buscamos en la concatenación de nombre y apellido
        (
            CONCAT(nombres, ' ', apellidos) LIKE p_SearchTerm
            OR telefono LIKE p_SearchTerm 
            OR correo LIKE p_SearchTerm
        )
    ORDER BY nombres, apellidos ASC
    LIMIT p_PageSize OFFSET p_Offset;

    -- Consulta para el conteo total (con la misma corrección)
    SELECT COUNT(*) as totalCount 
    FROM Cliente 
    WHERE 
        (
            CONCAT(nombres, ' ', apellidos) LIKE p_SearchTerm
            OR telefono LIKE p_SearchTerm 
            OR correo LIKE p_SearchTerm
        );
END$$

-- 3. Crear un nuevo usuario
CREATE PROCEDURE sp_CreateUser(
    IN p_Nombres VARCHAR(100),
    IN p_Apellidos VARCHAR(100),
    IN p_Telefono VARCHAR(20),
    IN p_Correo VARCHAR(100),
    IN p_ContrasenaHash VARCHAR(255),
    IN p_Rol ENUM('SuperAdmin', 'Admin', 'Usuario')
)
BEGIN
    INSERT INTO Usuario (nombres, apellidos, telefono, correo, contrasena_hash, rol) 
    VALUES (p_Nombres, p_Apellidos, p_Telefono, p_Correo, p_ContrasenaHash, p_Rol);
    SELECT LAST_INSERT_ID() as userId;
END$$

-- 4. Para obtener el perfil de un usuario por su ID
CREATE PROCEDURE sp_GetUserById(
    IN p_UserId INT
)
BEGIN
    SELECT id, nombres, apellidos, telefono, correo, rol 
    FROM Usuario 
    WHERE id = p_UserId;
END$$

-- 5. Actualizar un usuario
CREATE PROCEDURE sp_UpdateUser(
    IN p_UserId INT,
    IN p_Nombres VARCHAR(100),
    IN p_Apellidos VARCHAR(100),
    IN p_Telefono VARCHAR(20),
    IN p_Correo VARCHAR(100),
    IN p_Rol ENUM('SuperAdmin', 'Admin', 'Usuario'),
    IN p_ContrasenaHash VARCHAR(255)
)
BEGIN
    UPDATE Usuario SET
        nombres = COALESCE(p_Nombres, nombres),
        apellidos = COALESCE(p_Apellidos, apellidos),
        telefono = COALESCE(p_Telefono, telefono),
        correo = COALESCE(p_Correo, correo),
        rol = COALESCE(p_Rol, rol),
        contrasena_hash = COALESCE(p_ContrasenaHash, contrasena_hash)
    WHERE id = p_UserId;
END$$

-- 6. Eliminar un usuario
CREATE PROCEDURE sp_DeleteUser(
    IN p_UserId INT
)
BEGIN
    DELETE FROM Usuario WHERE id = p_UserId;
END$$

DELIMITER ;

DELIMITER $$
-- 7. Obtener Usuarios
CREATE PROCEDURE sp_GetUsers(
    IN p_SearchTerm VARCHAR(255),
    IN p_LoggedInUserId INT,
    IN p_PageSize INT,
    IN p_Offset INT
)
BEGIN
    -- Consulta para los datos
    SELECT id, nombres, apellidos, telefono, correo, rol, fecha_registro 
    FROM Usuario 
    WHERE 
        (
            nombres LIKE p_SearchTerm
            OR apellidos LIKE p_SearchTerm
            OR correo LIKE p_SearchTerm
            OR telefono LIKE p_SearchTerm
            OR CONCAT(nombres, ' ', apellidos) LIKE p_SearchTerm
        ) 
        AND id != p_LoggedInUserId
    ORDER BY nombres ASC
    LIMIT p_PageSize OFFSET p_Offset;

    -- Consulta para el conteo total
    SELECT COUNT(*) as totalCount 
    FROM Usuario 
    WHERE 
        (
            nombres LIKE p_SearchTerm
            OR apellidos LIKE p_SearchTerm
            OR correo LIKE p_SearchTerm
            OR telefono LIKE p_SearchTerm
            OR CONCAT(nombres, ' ', apellidos) LIKE p_SearchTerm
        ) 
        AND id != p_LoggedInUserId;
END$$
DELIMITER ;

DELIMITER $$

-- Obtiene un cliente específico por su ID
CREATE PROCEDURE sp_GetClientById(
    IN p_ClientId INT
)
BEGIN
    SELECT id, nombres, apellidos, telefono, correo, fecha_creacion
    FROM Cliente
    WHERE id = p_ClientId;
END$$

-- Actualiza los datos de un cliente
CREATE PROCEDURE sp_UpdateClient(
    IN p_ClientId INT,
    IN p_Nombres VARCHAR(100),
    IN p_Apellidos VARCHAR(100),
    IN p_Telefono VARCHAR(20),
    IN p_Correo VARCHAR(100)
)
BEGIN
    UPDATE Cliente SET
        nombres = p_Nombres,
        apellidos = p_Apellidos,
        telefono = p_Telefono,
        correo = p_Correo
    WHERE id = p_ClientId;
END$$

DELIMITER ;

DELIMITER $$
-- Obtener todas las estadísticas del Dashboard ( experimental)
CREATE PROCEDURE sp_GetDashboardStats()
BEGIN
    -- 1. Total de Clientes
    SELECT COUNT(*) as totalClientes FROM Cliente;

    -- 2. Total de Expedientes
    SELECT COUNT(*) as totalExpedientes FROM Expediente;

    -- 3. Conteo de Expedientes por tipo
    SELECT tipo, COUNT(*) as count FROM Expediente GROUP BY tipo;

    -- 4. Últimos 3 clientes registrados
    SELECT id, nombres, apellidos, fecha_creacion 
    FROM Cliente 
    ORDER BY fecha_creacion DESC 
    LIMIT 3;
END$$

DELIMITER ;

DELIMITER $$
-- Añadir Cliente
CREATE PROCEDURE sp_CreateClient(
    IN p_Nombres VARCHAR(100),
    IN p_Apellidos VARCHAR(100),
    IN p_Telefono VARCHAR(20),
    IN p_Correo VARCHAR(100)
)
BEGIN
    INSERT INTO Cliente (nombres, apellidos, telefono, correo)
    VALUES (p_Nombres, p_Apellidos, p_Telefono, p_Correo);
    
    -- Devolvemos el ID del cliente recién creado
    SELECT LAST_INSERT_ID() as clienteId;
END$$

DELIMITER ;