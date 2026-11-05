CREATE TABLE usuarios (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre varchar(100) NOT NULL,
  correo varchar(255) NOT NULL UNIQUE,
  password_hash text NOT NULL
);

CREATE TABLE publicaciones (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id integer NOT NULL REFERENCES usuarios(id),
  nombre varchar(100) NOT NULL,
  descripcion text NOT NULL,
  modalidad varchar(20) NOT NULL CHECK (modalidad IN ('venta', 'intercambio', 'ambas')),
  precio_clp integer,
  condiciones_intercambio text,
  ubicacion varchar(150) NOT NULL,
  imagen_url text NOT NULL,
  contacto_url text NOT NULL,
  CHECK ((modalidad = 'venta' AND precio_clp >= 0 AND condiciones_intercambio IS NULL)
    OR (modalidad = 'intercambio' AND precio_clp IS NULL AND condiciones_intercambio IS NOT NULL)
    OR (modalidad = 'ambas' AND precio_clp >= 0 AND condiciones_intercambio IS NOT NULL)),
  CHECK (precio_clp IS NOT NULL OR modalidad = 'intercambio')
);
