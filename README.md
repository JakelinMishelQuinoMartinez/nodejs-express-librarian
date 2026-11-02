# Librarian API

API REST para administrar una biblioteca desarrollada con Node.js, Express y MySQL. Permite gestionar usuarios, libros, préstamos, devoluciones, ventas, inventario e historial.

## Funcionalidades

### Administrador

- Crear, editar, listar, buscar y desactivar libros.
- Consultar los préstamos registrados.
- Administrar el inventario mediante el stock de los libros.

### Usuario

- Registrarse, iniciar sesión y cerrar sesión.
- Consultar y actualizar su perfil sin modificar su identificación.
- Solicitar préstamos de uno o varios libros.
- Devolver préstamos.
- Comprar libros.
- Consultar su historial de préstamos y compras.

## Tecnologías

- Node.js
- Express
- MySQL 2
- Express Validator
- bcrypt
- cookie-parser
- dotenv

## Requisitos

- Node.js 18 o superior.
- MySQL 8 o superior.
- npm.

## Instalación

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Crea un archivo `.env` en la raíz del proyecto:

   ```env
   SERVER_PORT=3000
   COOKIE_SECRET=tu_clave_secreta
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=tu_password
   DB_NAME=librarian
   ```

3. Importa el esquema SQL:

   ```bash
   mysql -u root -p < src/database/schema.sql
   ```

   Como alternativa, puedes ejecutar el contenido de [src/database/schema.sql](./src/database/schema.sql) desde MySQL Workbench o phpMyAdmin.

4. Inicia la API:

   ```bash
   npm start
   ```

   Para desarrollo con recarga automática:

   ```bash
   npm run dev
   ```

La API estará disponible en `http://localhost:3000`.

## Variables de entorno

| Variable | Descripción | Valor de ejemplo |
|---|---|---|
| `SERVER_PORT` | Puerto del servidor HTTP | `3000` |
| `COOKIE_SECRET` | Clave usada para firmar cookies | `clave-segura` |
| `DB_HOST` | Host de MySQL | `localhost` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | `tu_password` |
| `DB_NAME` | Nombre de la base de datos | `librarian` |

No subas el archivo `.env` al repositorio.

## Usuarios administradores

El registro público crea únicamente usuarios con el rol `usuario`. Para crear un administrador, inserta el usuario por medio de SQL y genera primero la contraseña con bcrypt.

Ejemplo para consultar los usuarios:

```sql
SELECT id, identificacion, nombre, email, rol, activo
FROM librarian.usuarios;
```

Los recursos administrativos requieren iniciar sesión con una cookie válida y usar una cuenta cuyo campo `rol` sea `admin`.

## Endpoints

### Estado

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/` | Público | Información básica de la API |

### Usuarios

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/usuarios` | Público | Registrar usuario |
| `POST` | `/usuarios/login` | Público | Iniciar sesión |
| `POST` | `/usuarios/logout` | Público | Cerrar sesión |
| `GET` | `/usuarios/perfil` | Autenticado | Consultar perfil |
| `PUT` | `/usuarios/perfil` | Autenticado | Actualizar perfil |
| `GET` | `/usuarios/:id` | Autenticado | Consultar un usuario |
| `GET` | `/usuarios/:id/historial` | Autenticado | Consultar préstamos y compras |

### Libros

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/libros` | Público | Listar libros activos |
| `GET` | `/libros?buscar=termino` | Público | Buscar por título, autor o código |
| `GET` | `/libros/:id` | Público | Consultar un libro |
| `POST` | `/libros` | Administrador | Registrar libro |
| `PUT` | `/libros/:id` | Administrador | Actualizar libro |
| `DELETE` | `/libros/:id` | Administrador | Desactivar libro |

### Préstamos

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/prestamos` | Administrador | Listar préstamos |
| `POST` | `/prestamos` | Autenticado | Registrar préstamo |
| `PATCH` | `/prestamos/:id/devolver` | Autenticado | Registrar devolución y restaurar stock |

### Ventas

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/ventas` | Autenticado | Registrar venta y descontar stock |
| `GET` | `/ventas` | Autenticado | Listar ventas propias; los administradores ven todas |

## Ejemplos de solicitudes

### Registrar usuario

```json
POST /usuarios
Content-Type: application/json

{
  "identificacion": "1001234567",
  "nombre": "Ana Pérez",
  "telefono": "3001234567",
  "direccion": "Calle 10 # 20-30",
  "email": "ana@example.com",
  "password": "clave123"
}
```

### Iniciar sesión

```json
POST /usuarios/login
Content-Type: application/json

{
  "email": "ana@example.com",
  "password": "clave123"
}
```

El servidor establece una cookie firmada llamada `auth`. Las solicitudes posteriores deben enviarla junto con el cliente HTTP.

### Crear libro como administrador

```json
POST /libros
Content-Type: application/json

{
  "codigo": "LIB-001",
  "titulo": "Cien años de soledad",
  "autor": "Gabriel García Márquez",
  "descripcion": "Novela de realismo mágico",
  "categoria": "Novela",
  "precio": 65000,
  "stock": 8
}
```

### Registrar préstamo

```json
POST /prestamos
Content-Type: application/json

{
  "libros": [
    {
      "id": 1,
      "cantidad": 1
    }
  ],
  "fechaPrestamo": "2026-11-02",
  "fechaDevolucionTentativa": "2026-11-16"
}
```

### Registrar venta

```json
POST /ventas
Content-Type: application/json

{
  "libros": [
    {
      "id": 1,
      "cantidad": 2
    }
  ],
  "fecha": "2026-11-02"
}
```

## Respuestas de error

Los errores se devuelven como JSON:

```json
{
  "mensaje": "Errores de validación",
  "errores": []
}
```

Rutas inexistentes responden con estado `404`.

## Modelo de datos

El esquema crea estas tablas:

- `usuarios`
- `libros`
- `prestamos`
- `prestamo_libros`
- `ventas`
- `venta_libros`

Las operaciones de préstamo y venta utilizan transacciones para mantener el stock y los registros relacionados consistentes.

## Estructura principal

```text
app.js
src/
  config/
    db.js
  database/
    schema.sql
  dto/
    usuario.dto.js
  middleware/
    validation.middleware.js
  routes/
    libros.router.js
    prestamos.router.js
    usuarios.router.js
    ventas.router.js
  util/
    autorizar-usuario.js
  validations/
    usuario.validations.js
```