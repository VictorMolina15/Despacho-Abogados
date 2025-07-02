// src/utils/auth.ts

interface DecodedToken {
  id: number;
  correo: string;
  rol: 'SuperAdmin' | 'Admin' | 'Usuario';
  iat: number;
  exp: number;
}

/**
 * Decodifica un token JWT para extraer su payload.
 * Nota: Esto no verifica la firma del token. La verificación
 * siempre debe hacerse en el backend.
 * @param token El token JWT a decodificar.
 * @returns El payload del token decodificado o null si el token es inválido.
 */
export function decodeJwt(token: string): DecodedToken | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      return null;
    }
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error al decodificar el token:", error);
    return null;
  }
}