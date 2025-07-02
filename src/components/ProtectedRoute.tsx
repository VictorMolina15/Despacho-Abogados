// src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';

export function ProtectedRoute() {
  const token = localStorage.getItem('authToken');

  // Si hay token, renderiza el componente hijo (la ruta solicitada).
  // Si no, lo redirige a la página de login.
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}