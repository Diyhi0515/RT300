FROM python:3.13-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# ODBC Driver 18 para SQL Server (Debian 12)
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl gnupg2 ca-certificates unixodbc-dev \
 && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
 && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/mssql-release.list \
 && apt-get update \
 && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 \
 && rm -rf /var/lib/apt/lists/*

# El servicio no corre como root: si lo comprometen, no tiene privilegios sobre el contenedor.
RUN groupadd --system app \
 && useradd --system --gid app --home-dir /app --shell /usr/sbin/nologin app \
 && mkdir -p /app /data/cache /data/imagenes /data/app \
 && chown -R app:app /app /data

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=app:app . .

USER app

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import sys, urllib.request; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:5000/api/v1/health', timeout=4).status == 200 else 1)"

# Por defecto: servidor de producción (waitress). En desarrollo el compose lo reemplaza por `flask run --debug`.
CMD ["waitress-serve", "--listen=0.0.0.0:5000", "wsgi:app"]
