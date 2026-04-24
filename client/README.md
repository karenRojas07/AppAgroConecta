# AgroConecta — Cliente React

Interfaz SPA construida con React 18 + Vite + React Router + Leaflet para consumir la API REST de AgroConecta.

## Cómo ejecutarlo

### 1. Levanta el backend

Desde la raíz del proyecto (`AppAgroConecta/`):

```bash
npm install
npm run dev
```

El servidor Express queda en `http://localhost:3000`.

### 2. Levanta el cliente

En otra terminal, dentro de `client/`:

```bash
cd client
npm install
npm run dev
```

El cliente queda en `http://localhost:5173` y proxy-ea `/api` al backend (ver `vite.config.js`).

Si quieres apuntar a otro host, copia `.env.example` a `.env` y edita `VITE_API_URL`.

## Endpoints cubiertos

| Recurso | Ruta | Pantalla |
|---------|------|----------|
| Health | `GET /health` | — |
| Auth | `POST /auth/register/productor` · `POST /auth/register/consumidor` · `POST /auth/login` · `GET /auth/me` · `POST /auth/logout` | `/login`, `/registro` |
| Productores | `GET /productores` · `GET /productores/:id` · `PATCH /productores/:id` | `/productores`, `/productores/:id`, `/perfil` |
| Consumidores | `GET /consumidores` · `GET /consumidores/:id` · `PATCH /consumidores/:id` | `/perfil` |
| Productos | `GET /productos` · `GET /productos/:id` · `POST /productos` · `PATCH /productos/:id` · `DELETE /productos/:id` | `/productos`, `/productos/:id`, `/dashboard` |
| Pedidos | `GET /pedidos` · `GET /pedidos/:id` · `POST /pedidos` · `PATCH /pedidos/:id/estado` | `/carrito`, `/pedidos`, `/pedidos/:id` |
| Reseñas | `GET /resenas` · `GET /resenas/:id` · `POST /resenas` | `/resenas`, `/pedidos/:id`, `/productores/:id` |
| Ubicaciones | `GET /ubicaciones` | `/mapa` |

## Roles

- **CONSUMIDOR** · ve catálogo, agrega al carrito, crea pedidos, deja reseñas, edita dirección/ubicación.
- **PRODUCTOR** · publica/edita/elimina productos desde `/dashboard`, cambia estado de pedidos recibidos, edita datos de finca.

## Estructura

```
client/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx             # Providers (Router, Auth, Toast, Cart)
    ├── App.jsx              # Rutas
    ├── api/client.js        # Cliente HTTP con JWT
    ├── context/             # AuthContext, ToastContext, CartContext
    ├── components/          # Navbar, Footer, ProductCard, ProtectedRoute, etc.
    ├── pages/               # Home, Login, Register, Productos, Pedidos, etc.
    ├── utils/format.js
    └── styles/index.css
```
