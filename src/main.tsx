// src/main.tsx
import React from 'react';
import './assets/index.css';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom'; // Importa Navigate
import { LoginPage } from './pages/LoginPage';
import { ClientesPage, ClientListPage } from './pages/ClientesPage';
import { ClienteDetailPage } from './pages/ClienteDetailPage';
import { DivorciosPage } from './pages/DivorciosPage'; // Importa la página de divorcios
import { ThemeProvider } from './ThemeContext';
import CssBaseline from '@mui/material/CssBaseline';
import { AppLayout } from './components/AppLayout'; // Importa el nuevo layout
import { HomePage } from './pages/HomePage'; // Importa la página de inicio
import { AdminPage } from './pages/AdminPage';
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleGuard } from './components/RoleGuard'


const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />, // El guardián protege a todas sus rutas hijas.
    children: [
      {
        path: '/', // Esta será la ruta principal (dashboard)
        element: <AppLayout />, // Usa el layout para estas rutas
        children: [
          {
            // --- Rutas para Admin y Usuario ---
            element: <RoleGuard allowedRoles={['Admin', 'Usuario']} />,
            children: [
              { index: true, element: <HomePage /> },
              {
                path: 'clientes', element: <ClientesPage />, children: [
                  {
                    index: true,
                    element: <ClientListPage />
                  },
                  {
                    path: ':clienteId',
                    element: <ClienteDetailPage />
                  },
                ]
              },
              { path: 'divorcios', element: <DivorciosPage /> },
            ],
          },
          // --- Rutas solo para SuperAdmin ---
          {
            element: <RoleGuard allowedRoles={['SuperAdmin']} />,
            children: [
              { path: 'admin', element: <AdminPage /> },
            ],
          },
        ],
      },
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