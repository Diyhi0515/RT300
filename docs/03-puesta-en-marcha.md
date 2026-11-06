# Puesta en marcha — crear los proyectos

Monorepo con una sola carpeta y un solo Git. Comandos para **PowerShell** (Windows).
Versiones detectadas en esta máquina: Python 3.13, Node 20.20, npm 10.8, Git 2.45.

```
D:\Proyectos\RT300\
├── api\                # Flask
├── web\                # React
├── docs\               # estos documentos
└── docker-compose.yml  # api + web + SQL Server (fase posterior)
```

## 0. Requisito para conectar a SQL Server desde Windows

Verifica que esté instalado el driver ODBC 18 (el contenedor de pruebas expone `localhost:1433`):

```powershell
Get-OdbcDriver | Where-Object Name -like "*SQL Server*" | Select-Object Name
```

Si no aparece `ODBC Driver 18 for SQL Server`, instálalo desde Microsoft.

## 1. Carpeta raíz y Git

```powershell
mkdir D:\Proyectos\RT300
cd D:\Proyectos\RT300
git init
mkdir docs
Copy-Item D:\Proyectos\RT-300WEB\docs\nuevo-sistema\*.md .\docs\
```

## 2. Backend (Flask)

```powershell
mkdir api
cd api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip

pip install flask flask-openapi3 pydantic flask-jwt-extended flask-cors flask-limiter `
            sqlalchemy pyodbc zeep pillow python-dotenv waitress `
            pytest pytest-cov ruff

pip freeze > requirements.txt
```

Estructura inicial de carpetas:

```powershell
$mods = "auth","salon","clientes","menu","comandas","cuentas"
New-Item -ItemType Directory -Force app\core, app\integrations\comandas, tests\unit, tests\integration | Out-Null
foreach ($m in $mods) {
  New-Item -ItemType Directory -Force "app\modules\$m" | Out-Null
  foreach ($f in "__init__.py","routes.py","schemas.py","service.py","repository.py") {
    New-Item -ItemType File -Force "app\modules\$m\$f" | Out-Null
  }
}
foreach ($f in "base.py","soap_gateway.py","dll_gateway.py","http_gateway.py","fake_gateway.py","factory.py","__init__.py") {
  New-Item -ItemType File -Force "app\integrations\comandas\$f" | Out-Null
}
foreach ($f in "db.py","errors.py","error_handlers.py","security.py","legacy_password.py","text.py","logging.py","__init__.py") {
  New-Item -ItemType File -Force "app\core\$f" | Out-Null
}
foreach ($f in "app\__init__.py","app\config.py","app\extensions.py","wsgi.py",".env.example") {
  New-Item -ItemType File -Force $f | Out-Null
}
New-Item -ItemType File -Force .gitignore | Out-Null
Add-Content .gitignore ".venv/`n__pycache__/`n.env`n.cache/`n.pytest_cache/"
```

`.env.example` (copiar a `.env` y ajustar): ver [01-backend-flask.md §9](01-backend-flask.md).

Arranque (cuando exista `wsgi.py`):

```powershell
$env:FLASK_APP = "wsgi:app"
flask run --debug --port 5000
```

## 3. Frontend (React + Vite + TypeScript)

```powershell
cd D:\Proyectos\RT300
npm create vite@latest web -- --template react-ts
cd web
npm install

# Navegación, datos, estado, formularios y validación
npm install react-router-dom @tanstack/react-query axios zustand zod react-hook-form @hookform/resolvers

# Estilos (Tailwind v4) e iconos
npm install tailwindcss @tailwindcss/vite lucide-react

# Pruebas y calidad
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event msw prettier

# Tipos desde OpenAPI del backend (opcional, fase 1)
npm install -D openapi-typescript
```

Estructura de carpetas:

```powershell
$dirs = "app\layouts","features\auth","features\salon","features\clientes","features\menu","features\comanda","features\cuentas","shared\ui","shared\hooks","shared\utils","lib","api-types","styles"
foreach ($d in $dirs) { New-Item -ItemType Directory -Force "src\$d" | Out-Null }
```

Configuración mínima de Tailwind v4 (`vite.config.ts`):

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:5000' } },
})
```

En `src/styles/index.css` (tokens del tema, ver [02-frontend-react.md §7](02-frontend-react.md)):

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

Scripts útiles en `package.json`: `"gen:api": "openapi-typescript http://localhost:5000/api/openapi.json -o src/api-types/api.d.ts"`, `"test": "vitest"`.

Arranque:

```powershell
npm run dev
```

## 4. Primer commit

```powershell
cd D:\Proyectos\RT300
git add .
git commit -m "chore: esqueleto inicial api + web + docs"
```

## 5. Orden de trabajo recomendado (Fase 0 y 1)

1. `create_app()`, config, errores, logging.
2. Conexión SQL Server (`core/db.py`) y prueba de `SELECT 1`.
3. `auth`: login con `clave_calcular` portada + JWT.
4. `salon` y `menu` en **solo lectura**.
5. Frontend: tema + AppLayout + Login + Mesas + Comanda (solo lectura de menú).
6. `FakeGateway` y guardar comanda (Fase 3).
