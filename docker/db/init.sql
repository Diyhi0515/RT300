-- Si no existe la BD, se restaura desde el backup montado en /backup
IF DB_ID('tbpos_new') IS NULL
    RESTORE DATABASE tbpos_new FROM DISK = '/backup/tbpos_new.bak'
    WITH MOVE 'tbpos_rt'     TO '/var/opt/mssql/data/tbpos_new.mdf',
         MOVE 'tbpos_rt_LDF' TO '/var/opt/mssql/data/tbpos_new_log.ldf',
         STATS = 10;
ELSE
    PRINT 'tbpos_new ya existe, no se restaura.';
GO
IF SUSER_ID('prueba') IS NULL
    CREATE LOGIN prueba WITH PASSWORD = 'prueba', CHECK_POLICY = OFF, CHECK_EXPIRATION = OFF, DEFAULT_DATABASE = tbpos_new;
ALTER SERVER ROLE sysadmin ADD MEMBER prueba;
GO
-- Usuario de la aplicación con permisos mínimos: solo lee y escribe datos (sin DDL, sin sysadmin).
-- Contraseña por variable de sqlcmd (-v APP_PASSWORD=...), nunca fija en el repositorio.
IF SUSER_ID('rt300_app') IS NULL
    CREATE LOGIN rt300_app WITH PASSWORD = '$(APP_PASSWORD)', CHECK_POLICY = OFF, CHECK_EXPIRATION = OFF, DEFAULT_DATABASE = tbpos_new;
GO
USE tbpos_new;
GO
IF USER_ID('rt300_app') IS NULL
    CREATE USER rt300_app FOR LOGIN rt300_app;
ALTER ROLE db_datareader ADD MEMBER rt300_app;
ALTER ROLE db_datawriter ADD MEMBER rt300_app;
GO
