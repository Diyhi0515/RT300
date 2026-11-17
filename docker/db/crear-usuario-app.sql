-- Ejecutar una sola vez contra el SQL Server LOCAL, usando sqlcmd o SSMS en modo SQLCMD.
-- Ejemplo: sqlcmd -S localhost,1433 -E -v APP_PASSWORD="UnaClavePropia" -i docker/db/crear-usuario-app.sql
-- No crea ni restaura la base y no cambia su esquema; solo crea el login de mínimos permisos.

IF DB_ID('tbpos_new') IS NULL
    THROW 50001, 'La base local tbpos_new no existe.', 1;
GO

IF SUSER_ID('rt300_app') IS NULL
    CREATE LOGIN rt300_app
        WITH PASSWORD = '$(APP_PASSWORD)', CHECK_POLICY = ON,
             CHECK_EXPIRATION = OFF, DEFAULT_DATABASE = tbpos_new;
GO

USE tbpos_new;
GO

IF USER_ID('rt300_app') IS NULL
    CREATE USER rt300_app FOR LOGIN rt300_app;
GO

ALTER ROLE db_datareader ADD MEMBER rt300_app;
ALTER ROLE db_datawriter ADD MEMBER rt300_app;
GO
