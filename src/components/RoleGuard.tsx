// src/components/RoleGuard.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { decodeJwt } from '../utils/auth';

type RoleGuardProps = {
  allowedRoles: Array<'SuperAdmin' | 'Admin' | 'Usuario'>;
};

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const token = localStorage.getItem('authToken');
  const userData = token ? decodeJwt(token) : null;

  if (!userData) {
    // Si por alguna razón no hay datos de usuario, lo mandamos al login.
    return <Navigate to="/login" replace />;
  }

  // Comprobamos si el rol del usuario está en la lista de roles permitidos.
  const isAuthorized = allowedRoles.includes(userData.rol);

  if (isAuthorized) {
    // Si está autorizado, renderizamos la página que corresponde.
    return <Outlet />;
  } else {
    // Si no está autorizado, lo redirigimos a su página principal.
    // Para el SuperAdmin, es '/admin'. Para otros, podría ser '/'.
    const homePath = userData.rol === 'SuperAdmin' ? '/admin' : '/';
    return <Navigate to={homePath} replace />;
  }
}