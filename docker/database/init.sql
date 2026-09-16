-- Creates the application database plus a dedicated, least-privilege login
-- for the API to use at runtime instead of the sa account.
-- Expects sqlcmd scripting variables: AppDbName, AppLogin, AppPassword.

IF DB_ID(N'$(AppDbName)') IS NULL
BEGIN
    PRINT 'Creando base de datos ' + N'$(AppDbName)';
    EXEC('CREATE DATABASE [$(AppDbName)]');
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'$(AppLogin)')
BEGIN
    PRINT 'Creando login ' + N'$(AppLogin)';
    EXEC('CREATE LOGIN [$(AppLogin)] WITH PASSWORD = N''$(AppPassword)'', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF');
END
GO

USE [$(AppDbName)];
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'$(AppLogin)')
BEGIN
    PRINT 'Creando usuario ' + N'$(AppLogin)' + ' en $(AppDbName)';
    EXEC('CREATE USER [$(AppLogin)] FOR LOGIN [$(AppLogin)]');
END
GO

-- db_owner is scoped to this single database only (not sysadmin/server-wide),
-- which is what the API needs to run EF Core migrations and read/write data.
IF IS_ROLEMEMBER('db_owner', '$(AppLogin)') = 0
BEGIN
    ALTER ROLE db_owner ADD MEMBER [$(AppLogin)];
END
GO
