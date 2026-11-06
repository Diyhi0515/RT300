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
