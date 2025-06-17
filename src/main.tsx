
import React from 'react';
import './assets/index.css'
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ClientesPage } from './pages/ClientesPage';

function ClienteDetailPage() {
  return <h1>Detalle de un Cliente</h1>;
}


const router = createBrowserRouter([
  {
    path: '/login', // La URL que verá el usuario
    element: <LoginPage />, // El componente que se mostrará
  },
  {
    path: '/clientes',
    element: <ClientesPage />,
  },
  {
    path: '/clientes/:clienteId', // ":clienteId" es un parámetro dinámico
    element: <ClienteDetailPage />,
  },
  {
    path: '/', // La ruta principal
    element: <h1>Página de Inicio (Dashboard)</h1>
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);