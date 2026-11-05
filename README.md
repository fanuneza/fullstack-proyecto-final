# Mercado Verde

Requisitos: Node.js, npm y PostgreSQL.

## Frontend

Desde la raíz del proyecto:

```sh
npm ci
npm run dev
```

Por defecto usa datos simulados. Para conectar la API, crea `.env.local` en la raíz:

```env
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:3000/api
```

## Backend

Con PostgreSQL en ejecución, desde la raíz del proyecto:

```sh
cd backend
npm ci
createdb -h localhost -U TU_USUARIO mercado_verde
psql -h localhost -U TU_USUARIO -v ON_ERROR_STOP=1 -d mercado_verde -f schema.sql
export DATABASE_URL='postgresql://usuario:contraseña@localhost:5432/mercado_verde'
export JWT_SECRET="$(openssl rand -hex 32)"
npm start
```

Reemplaza el usuario y la contraseña con tus credenciales. Crea la base y aplica el esquema solo la primera vez. Las variables deben configurarse en la terminal donde se inicia el servidor.

## Pruebas

Desde `backend`, con una base de datos disponible y permiso para crear esquemas:

```sh
TEST_DATABASE_URL='postgresql://usuario:contraseña@localhost:5432/mercado_verde' npm test
```
