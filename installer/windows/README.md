# Instalador nativo para Windows Server 2016+

El servidor final no necesita Docker, Python, Node.js ni Linux. Solo requiere:

- Windows Server 2016 de 64 bits o posterior.
- Microsoft ODBC Driver 18 for SQL Server instalado.
- Conectividad hacia SQL Server y el servicio SOAP.

## Compilar

La compilación se hace en una máquina Windows x64, no necesariamente en el servidor:

1. Instalar Python 3.13 x64, Node.js LTS, compilador C de Visual Studio Build Tools e Inno Setup 6.
2. Descargar **WinSW x64 2.12.0** desde su repositorio oficial, verificar el hash/firma y guardarlo como `installer/windows/RT300.Service.exe`.
3. Ejecutar como PowerShell normal:

```powershell
.\installer\windows\build.ps1
```

El resultado queda en `release/RT300-Setup-1.0.0-x64.exe`.

## Instalación

Ejecutar el instalador como administrador. Al terminar se abre el asistente que solicita puerto, SQL Server, URL SOAP y carpetas. El asistente:

- genera claves aleatorias de aplicación;
- escribe `C:\ProgramData\RT300\config.env` con ACL restringida;
- comprueba SQL Server y SOAP antes de iniciar;
- registra `RT300` como servicio automático bajo `LocalService`;
- abre el puerto únicamente en perfiles de red Dominio y Privado.

La configuración y las imágenes se conservan al actualizar o desinstalar. Caché y logs sí se eliminan al desinstalar.

La primera versión publica HTTP dentro de la LAN. Para exponerlo fuera de una red interna debe agregarse HTTPS con un certificado confiable; no se debe publicar directamente a Internet.
