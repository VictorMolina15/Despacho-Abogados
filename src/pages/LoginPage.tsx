// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Link,
  Paper,
  IconButton,
  Alert,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeContext } from '../ThemeContext';

export function LoginPage() {
  const { toggleColorMode, mode } = useThemeContext();
  const navigate = useNavigate();

  // Estados para controlar los campos del formulario y los errores
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Previene el comportamiento por defecto del formulario
    setError(null); // Limpia errores anteriores
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo, contrasena }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Si la respuesta no es exitosa (ej. 401, 400, 500), lanza un error
        throw new Error(data.message || 'Error al iniciar sesión.');
      }

      // Si el login es exitoso, guarda el token
      if (data.token) {
        localStorage.setItem('authToken', data.token); // Guardamos el token en localStorage

        // Redirección basada en el rol del usuario
        if (data.userRole === 'SuperAdmin') {
          navigate('/admin');
        } else {
          // Para 'Admin' y 'Usuario'
          navigate('/');
        }
      }
    } catch (err: unknown) {
      // Manejo de errores de la petición o del backend
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      maxWidth="xs"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignContent: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <IconButton
        sx={{ position: 'absolute', top: 16, right: 16 }}
        onClick={toggleColorMode}
        color="inherit"
      >
        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
      <Paper
        elevation={6}
        sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 2,
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 1 }}>
          Iniciar Sesión
        </Typography>

        {/* El formulario ahora llama a handleSubmit */}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          {/* Mostramos el error aquí si existe */}
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2, backgroundColor: 'rgba(248, 215, 218, 0.7)', color: '#721c24' }}>
              {error}
            </Alert>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Correo Electrónico"
            name="email"
            autoComplete="email"
            autoFocus
            variant="outlined"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="current-password"
            variant="outlined"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Link href="#" variant="body2">
              ¿Olvidaste tu contraseña?
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}