// src/main.tsx
import React from 'react';
import './assets/index.css';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom'; // Importa Navigate
import { LoginPage } from './pages/LoginPage';
import { ClientesPage } from './pages/ClientesPage'; // Esta ahora será la lista de clientes
import { ClienteDetailPage } from './pages/ClienteDetailPage'; // Nuevo/modificado para el detalle del cliente
import { DivorciosPage } from './pages/DivorciosPage'; // Importa la página de divorcios
import { ThemeProvider } from './ThemeContext';
import CssBaseline from '@mui/material/CssBaseline';
import { AppLayout } from './components/AppLayout'; // Importa el nuevo layout
import { HomePage } from './pages/HomePage'; // Importa la página de inicio

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/', // Esta será la ruta principal (dashboard)
    element: <AppLayout />, // Usa el layout para estas rutas
    children: [
      {
        index: true, // Esto hace que HomePage se renderice en la ruta '/'
        element: <HomePage />,
      },
      {
        path: 'clientes', // Ruta para la lista de clientes
        element: <ClientesPage />,
      },
      {
        path: 'clientes/:clienteId', // Ruta para el detalle de un cliente específico
        element: <ClienteDetailPage />,
      },
      {
        path: 'divorcios', // Ruta para la sección de divorcios
        element: <DivorciosPage />,
      },
      // Puedes añadir una redirección a '/login' si no hay un usuario autenticado
      // {
      //   path: '*',
      //   element: <Navigate to="/login" replace />,
      // },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
);