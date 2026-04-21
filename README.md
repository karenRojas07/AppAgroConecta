# AgroConecta Backend API
las clases:

- Usuario 
- Productor
- Consumidor
- Producto
- Pedido
- DetallePedido
- Resena

## Enums del modelo

- TipoEntrega: RECOGIDA_FINCA, DOMICILIO
- EstadoPedido: PENDIENTE, CONFIRMADO, EN_PREPARACION, LISTO, ENTREGADO, CANCELADO

## Relacion UML implementada

- Usuario <|-- Productor
- Usuario <|-- Consumidor
- Productor 1 --- 0..* Producto
- Consumidor 1 --- 0..* Pedido
- Pedido 1 *--- 1..* DetallePedido
- DetallePedido * ---> 1 Producto
- Consumidor 1 --- 0..* Resena
- Productor 1 --- 0..* Resena
- Resena * ---> 1 Pedido

## Stack

- Node.js + Express
- Sequelize ORM
- MySQL
- JWT
- Zod

## Endpoints

### Auth

- POST /api/v1/auth/register/productor
- POST /api/v1/auth/register/consumidor
- POST /api/v1/auth/login
- GET /api/v1/auth/me
- POST /api/v1/auth/logout

### Productores

- GET /api/v1/productores
- GET /api/v1/productores/:idUsuario
- PATCH /api/v1/productores/:idUsuario

### Consumidores

- GET /api/v1/consumidores
- GET /api/v1/consumidores/:idUsuario
- PATCH /api/v1/consumidores/:idUsuario

### Productos

- GET /api/v1/productos
- GET /api/v1/productos/:idProducto
- POST /api/v1/productos
- PATCH /api/v1/productos/:idProducto
- DELETE /api/v1/productos/:idProducto

### Pedidos

- GET /api/v1/pedidos
- GET /api/v1/pedidos/:idPedido
- POST /api/v1/pedidos
- PATCH /api/v1/pedidos/:idPedido/estado

### Resenas

- GET /api/v1/resenas
- GET /api/v1/resenas/:idResena
- POST /api/v1/resenas

## Notas de negocio

- El pedido calcula total con la suma de subtotales + costoEnvio.
- Al crear un pedido se descuenta inventario del producto.
- Solo se puede crear resena para pedidos ENTREGADOS.
- Cada pedido solo permite una resena.

## Inicio rapido

```bash
npm install
copy .env.example .env
npm run dev
```

Credenciales por defecto configuradas:

- DB_USER=root
- DB_PASSWORD=root
- DB_NAME=AgroConectaProyectoFinal

Health check:

```http
GET /api/v1/health
```
