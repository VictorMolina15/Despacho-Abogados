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
    SELECT te.nombre, COUNT(*) as count FROM Expediente e
    JOIN Tipo_Expediente te ON e.tipo_id = te.id
    GROUP BY te.nombre;

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

DELIMITER $$

CREATE PROCEDURE sp_CreateExpedienteConDocumentos(
    IN p_cliente_id INT,
    IN p_tipo_nombre VARCHAR(100), -- Recibimos el nombre del tipo
    IN p_numero_expediente VARCHAR(150),
    IN p_estado VARCHAR(50),
    IN p_descripcion TEXT,
    IN p_usuario_id INT,
    IN p_documentos_json JSON -- Recibimos los documentos como un array JSON
)
BEGIN
    DECLARE v_tipo_id INT;
    DECLARE v_expediente_id INT;
    DECLARE i INT DEFAULT 0;
    DECLARE doc_count INT;
    DECLARE v_nombre_original VARCHAR(255);
    DECLARE v_storage_key VARCHAR(500);

    -- Iniciar transacción
    START TRANSACTION;

    -- Buscar o crear el Tipo de Expediente
    SELECT id INTO v_tipo_id FROM Tipo_Expediente WHERE nombre = p_tipo_nombre;
    IF v_tipo_id IS NULL THEN
        INSERT INTO Tipo_Expediente (nombre) VALUES (p_tipo_nombre);
        SET v_tipo_id = LAST_INSERT_ID();
    END IF;

    -- Crear el Expediente
    INSERT INTO Expediente (cliente_id, tipo_id, numero_expediente, estado, descripcion)
    VALUES (p_cliente_id, v_tipo_id, p_numero_expediente, p_estado, p_descripcion);
    SET v_expediente_id = LAST_INSERT_ID();

    -- Insertar los documentos si el array no está vacío
    IF JSON_LENGTH(p_documentos_json) > 0 THEN
        SET doc_count = JSON_LENGTH(p_documentos_json);
        WHILE i < doc_count DO
            SET v_nombre_original = JSON_UNQUOTE(JSON_EXTRACT(p_documentos_json, CONCAT('$[', i, '].nombre_original')));
            SET v_storage_key = JSON_UNQUOTE(JSON_EXTRACT(p_documentos_json, CONCAT('$[', i, '].storage_key')));
            
            INSERT INTO Documento (expediente_id, nombre_original, storage_key, usuario_subida_id)
            VALUES (v_expediente_id, v_nombre_original, v_storage_key, p_usuario_id);
            
            SET i = i + 1;
        END WHILE;
    END IF;

    -- Confirmar transacción
    COMMIT;

    -- Devolver el ID del expediente creado
    SELECT v_expediente_id as expedienteId;

END$$

DELIMITER ;

DELIMITER $$

-- Obtener todos los tipos de expediente
CREATE PROCEDURE sp_GetTiposExpediente()
BEGIN
    SELECT id, nombre FROM Tipo_Expediente ORDER BY nombre ASC;
END$$


-- Obtener todos los expedientes de un cliente específico
-- Este SP une las tablas para devolver la información completa.
CREATE PROCEDURE sp_GetExpedientesByCliente(
    IN p_cliente_id INT
)
BEGIN
    SELECT 
        e.id,
        e.cliente_id,
        te.nombre as tipo, -- Obtenemos el nombre del tipo
        e.numero_expediente,
        e.estado,
        e.descripcion,
        -- Agrupamos los documentos de cada expediente en un array JSON
        (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', d.id, 
                'nombre_original', d.nombre_original, 
                'storage_key', d.storage_key, 
                'fecha_subida', d.fecha_subida
            )
        ) FROM Documento d WHERE d.expediente_id = e.id) as documentos
    FROM Expediente e
    JOIN Tipo_Expediente te ON e.tipo_id = te.id
    WHERE e.cliente_id = p_cliente_id
    ORDER BY e.fecha_apertura DESC;
END$$

DELIMITER ;

DELIMITER $$

-- Actualizar un expediente existente
DELIMITER $$

CREATE PROCEDURE sp_UpdateExpedienteAndAddDocuments(
    IN p_expediente_id INT,
    IN p_tipo_nombre VARCHAR(100),
    IN p_numero_expediente VARCHAR(150),
    IN p_estado VARCHAR(50),
    IN p_descripcion TEXT,
    IN p_usuario_id INT, -- Necesitamos saber quién sube los nuevos archivos
    IN p_documentos_json JSON -- Recibimos los nuevos documentos como un array JSON
)
BEGIN
    DECLARE v_tipo_id INT;
    DECLARE i INT DEFAULT 0;
    DECLARE doc_count INT;
    DECLARE v_nombre_original VARCHAR(255);
    DECLARE v_storage_key VARCHAR(500);

    -- Iniciar transacción para que todas las operaciones sean atómicas
    START TRANSACTION;

    -- 1. Buscar o crear el Tipo de Expediente
    SELECT id INTO v_tipo_id FROM Tipo_Expediente WHERE nombre = p_tipo_nombre;
    IF v_tipo_id IS NULL THEN
        INSERT INTO Tipo_Expediente (nombre) VALUES (p_tipo_nombre);
        SET v_tipo_id = LAST_INSERT_ID();
    END IF;

    -- 2. Actualizar la información principal del Expediente
    UPDATE Expediente SET
        tipo_id = v_tipo_id,
        numero_expediente = p_numero_expediente,
        estado = p_estado,
        descripcion = p_descripcion
    WHERE id = p_expediente_id;

    -- 3. Insertar los nuevos documentos si el array JSON no está vacío
    IF JSON_LENGTH(p_documentos_json) > 0 THEN
        SET doc_count = JSON_LENGTH(p_documentos_json);
        WHILE i < doc_count DO
            -- Extraer la información de cada documento del array JSON
            SET v_nombre_original = JSON_UNQUOTE(JSON_EXTRACT(p_documentos_json, CONCAT('$[', i, '].nombre_original')));
            SET v_storage_key = JSON_UNQUOTE(JSON_EXTRACT(p_documentos_json, CONCAT('$[', i, '].storage_key')));
            
            INSERT INTO Documento (expediente_id, nombre_original, storage_key, usuario_subida_id)
            VALUES (p_expediente_id, v_nombre_original, v_storage_key, p_usuario_id);
            
            SET i = i + 1;
        END WHILE;
    END IF;

    -- Confirmar la transacción
    COMMIT;
END$$

DELIMITER ;

DELIMITER $$
-- Eliminar Expediente y Obtener llaves para eliminarlos tambíen en el Bucket
CREATE PROCEDURE sp_DeleteExpedienteAndGetKeys(
    IN p_expediente_id INT
)
BEGIN
    -- Primero, obtenemos las llaves de almacenamiento de los archivos que vamos a borrar.
    SELECT storage_key FROM Documento WHERE expediente_id = p_expediente_id;

    -- Iniciar transacción para asegurar que todo se elimine correctamente
    START TRANSACTION;
    
    -- Eliminar los registros de los documentos
    DELETE FROM Documento WHERE expediente_id = p_expediente_id;
    
    -- Eliminar el registro del expediente
    DELETE FROM Expediente WHERE id = p_expediente_id;
    
    -- Confirmar la transacción
    COMMIT;
END$$

DELIMITER ;