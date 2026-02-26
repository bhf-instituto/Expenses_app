# Expenses Frontend

Frontend React + Vite + PWA para flujo base de autenticacion:

- `register`
- `login`
- `logout`
- `health/me` (sesion)

## Ejecutar

```bash
npm install
npm run dev
```

## Variables de entorno

Crear `.env` usando `.env.example`:

```bash
VITE_API_BASE_URL=https://bbhhffexpensesapp.dpdns.org
VITE_AUTH_REGISTER_PATH=/auth/register
VITE_AUTH_LOGIN_PATH=/auth/login
VITE_AUTH_LOGOUT_PATH=/auth/logout
VITE_AUTH_ME_PATH=/health/me
VITE_HEALTH_PATH=/health/me
```

El backend responde errores en `data.message`; el frontend ya lo interpreta.
