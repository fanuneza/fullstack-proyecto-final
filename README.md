# Mercado Verde

Requisitos: Node.js, npm y PostgreSQL.

## Frontend

Desde la raíz del proyecto:

```sh
npm ci
npm run dev
```

Abre la dirección que muestra Vite. Por defecto usa datos simulados.

## Backend

Necesitas PostgreSQL en ejecución y un usuario con contraseña y permiso para crear bases de datos. En otra terminal, desde la raíz del proyecto:

```sh
cd backend
npm ci
createdb -h localhost -U TU_USUARIO mercado_verde
psql -h localhost -U TU_USUARIO -v ON_ERROR_STOP=1 -d mercado_verde -f schema.sql
export DATABASE_URL='postgresql://usuario:contraseña@localhost:5432/mercado_verde'
export JWT_SECRET="$(openssl rand -hex 32)"
npm start
```

Reemplaza `TU_USUARIO`, `usuario` y `contraseña` por tus credenciales de PostgreSQL. Los comandos pedirán la contraseña. Si contiene caracteres especiales como `@`, `:` o `#`, codifícalos en la URL. Crea la base y aplica el esquema solo la primera vez, sobre una base vacía.

Las variables exportadas duran solo en esa terminal; `.env.example` es una referencia y no se carga automáticamente. La API escucha en el puerto 3000.

Para conectar el frontend, crea `.env.local` en la raíz del proyecto:

```env
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:3000/api
```

Reinicia el frontend y registra una cuenta nueva.

## Pruebas del backend

Desde `backend`, ejecuta las pruebas con la base de datos local:

```sh
export TEST_DATABASE_URL='postgresql://usuario:contraseña@localhost:5432/mercado_verde'
npm test
```

Reemplaza las credenciales por las de PostgreSQL. El usuario debe tener permiso para crear esquemas en la base de datos. Las pruebas crean y eliminan su propio esquema; no necesitan que el servidor esté en ejecución.
