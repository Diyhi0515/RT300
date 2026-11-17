# Otra laptop: Docker con SQL Server local

Esta modalidad ejecuta **solamente RT300 en Docker**. SQL Server y `tbpos_new` permanecen instalados en Windows, fuera de Docker. No se empaqueta, copia ni restaura ningún `.bak`.

## Requisitos

- Windows 10/11 o Windows Server con Docker Desktop configurado para contenedores Linux.
- SQL Server local con la base `tbpos_new` ya restaurada.
- TCP/IP habilitado en SQL Server y un puerto fijo, normalmente `1433`.
- Git, o una copia ZIP de este repositorio sin `.env` ni backups.

> En Windows Server 2016, Docker Desktop no está soportado como en Windows 10/11. Si esa es la máquina definitiva, use el instalador nativo descrito en `installer/windows/README.md`. Esta guía es apropiada para otra laptop compatible con Docker Desktop.

## 1. Preparar SQL Server local

En **SQL Server Configuration Manager**:

1. Habilite `TCP/IP` para la instancia.
2. Asigne el puerto TCP fijo `1433` (o anote el puerto elegido).
3. Reinicie el servicio de SQL Server.
4. Permita el puerto solo para la red privada en Windows Firewall.

Compruebe desde PowerShell:

```powershell
Test-NetConnection localhost -Port 1433
```

El backend necesita autenticación SQL, no autenticación integrada de Windows. Este despliegue reutiliza el login existente indicado en `DB_USER`; no crea usuarios, no modifica el esquema y no restaura la base.

## 2. Copiar la configuración

Desde la raíz del proyecto:

```powershell
Copy-Item .env.local-db.example .env.local-db
notepad .env.local-db
```

Cambie obligatoriamente:

- `SECRET_KEY` y `JWT_SECRET_KEY` por valores aleatorios distintos.
- `DB_USER` y `DB_PASSWORD` por las credenciales existentes de SQL Server.
- Si se reutiliza `sa`, mantener `ALLOW_PRIVILEGED_DB_USER=true`. Esta opción es una aceptación explícita del riesgo; no concede permisos nuevos.
- La IP dentro de `CORS_ORIGINS` por la IP de la laptop.
- `GATEWAY_WSDL_URL` y `GATEWAY_PASSWORD` si utilizará el SOAP real.

Para obtener la IP:

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object AddressState -eq Preferred
```

Docker accede al SQL Server de Windows usando `DB_HOST=host.docker.internal`. No cambie ese valor por `localhost`: dentro del contenedor, `localhost` sería el propio contenedor.

## 3. Construir y levantar

```powershell
docker compose --env-file .env.local-db -f docker-compose.local-db.yml up -d --build
```

La primera construcción descarga las imágenes y dependencias. Las siguientes reutilizan la caché.

Compruebe el estado:

```powershell
docker compose --env-file .env.local-db -f docker-compose.local-db.yml ps
docker compose --env-file .env.local-db -f docker-compose.local-db.yml logs --tail=100 backend
```

Abra en la misma laptop:

```text
http://localhost:8080
```

Desde otra tablet o PC de la LAN:

```text
http://IP-DE-LA-LAPTOP:8080
```

Si no abre desde otro equipo, permita el puerto `8080` únicamente en el perfil privado/dominio del Firewall:

```powershell
New-NetFirewallRule -DisplayName "RT300 Docker" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow -Profile Private,Domain
```

## 4. Operación habitual

```powershell
# Ver logs
docker compose --env-file .env.local-db -f docker-compose.local-db.yml logs -f

# Reiniciar
docker compose --env-file .env.local-db -f docker-compose.local-db.yml restart

# Actualizar después de copiar cambios
docker compose --env-file .env.local-db -f docker-compose.local-db.yml up -d --build

# Detener sin borrar datos internos de sesión/caché
docker compose --env-file .env.local-db -f docker-compose.local-db.yml down
```

No use `down -v` salvo que quiera eliminar la caché y el registro local de tokens revocados. Ese comando **no borra SQL Server ni `tbpos_new`**, porque la base está fuera de Docker.

## Diagnóstico

### El backend aparece `unhealthy`

```powershell
docker compose --env-file .env.local-db -f docker-compose.local-db.yml logs backend
```

Revise que SQL Server escuche en TCP, acepte autenticación SQL y que `DB_USER`/`DB_PASSWORD` sean correctos. Si SQL usa otro puerto, cambie `DB_PORT`.

### El SOAP no responde

Pruebe primero desde Windows:

```powershell
Invoke-WebRequest "http://192.168.0.2/RT300WS/RT300.asmx?WSDL"
```

Para validar el resto del sistema sin imprimir comandas, cambie temporalmente `GATEWAY_MODE=fake` y vuelva a ejecutar `docker compose ... up -d`.

## Seguridad

Este perfil publica HTTP para una LAN confiable. No reenvíe el puerto `8080` desde el router ni lo exponga a Internet. Para acceso externo debe configurarse HTTPS con un certificado válido o una VPN.
