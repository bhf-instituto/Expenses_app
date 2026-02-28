# Frontend Mobile PWA (Vite + React + Bulma)

Primera version mobile de la app de gastos.

## Stack
- Vite + React
- Bulma CSS
- vite-plugin-pwa

## Correr local
```bash
cd frontend
npm install
npm run dev
```

Variables:
- `VITE_API_BASE_URL` (default: `http://localhost:3000`)

## Flujo implementado (mobile)
- Login/Register en un solo formulario
- Home con modos **Crear** y **Ver**
- Crear grupo
- Seleccion de tipo de gasto (FIJO/VARIABLE/PROVEEDOR)
- Lista de categorias/proveedores por tipo
- Crear categoria/proveedor
- Formulario de carga de gasto rapido
- Vista basica de gastos con filtros de tipo y pago

## Offline-lite
- Si no hay conexion, el formulario de gasto guarda operaciones en `localStorage`.
- Al recuperar conexion, la cola se sincroniza automaticamente.
