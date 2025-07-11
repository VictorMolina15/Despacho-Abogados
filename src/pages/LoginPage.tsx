// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Grid, // Cambiamos Container por Grid para el layout de dos paneles
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

  // --- Tu lógica de estado y manejo de formulario se mantiene intacta ---
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión.');
      }
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        if (data.userRole === 'SuperAdmin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setLoading(false);
    }
  };
  // --- Fin de la lógica ---

  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      <Grid sx={{
        backgroundImage: `url('/assets/${mode === 'dark' ? 'LoginBG(2).png' : 'LoginBG(1).png'}')`,
        backgroundRepeat: 'no-repeat',
        backgroundColor: (t) =>
          t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
      }} />
      {/* Botón para cambiar tema (esquina superior derecha) */}
      <IconButton
        sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1300 }}
        onClick={toggleColorMode}
        color="inherit"
      >
        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        sx={{
          position: 'relative',
          height: '100vh',
          width: '100vw',
          zIndex: 1,
        }}
      >
        <Grid
          container
          sx={{
            height: { xs: '100vh', md: '80vh' },
            width: { xs: '100vw', md: '80vw' },
            minWidth: 320,
            minHeight: 400,
            borderRadius: { xs: 0, md: 4 },
            overflow: 'hidden',
            boxShadow: 6,
            position: 'relative',
            background: 'transparent',
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          {/* Panel Imagen */}
          <Grid
            sx={{
              width: { xs: '100%', md: '55%' },
              height: { xs: '20vh', sm: '30vh', md: '100%' },
              maxHeight: { xs: '20%', sm: '20%', md: '100%' },
              backgroundImage: `url('/assets/Background(crop).jpg')`,
              backgroundRepeat: 'no-repeat',
              backgroundColor: (t) =>
                t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',

            }}
          />

          {/* Panel Formulario */}
          <Grid
            component={Paper}
            elevation={6}
            square
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: '100%', md: '45%' },
              height: { xs: 0, md: '100%' },
              minHeight: { xs: '80%', md: 'auto' },
              position: 'relative',
            }}
          >
            <Box
              sx={{
                my: 8,
                mx: { xs: 2, sm: 4 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                maxWidth: '90%',
                maxHeight: '100%',
                position: 'relative',
              }}
            >
              {/* Logo y Título */}
              <Box
                component="img" 
                sx={{
                  // Aplicamos estilos responsivos
                  height: {
                    xs: '80px',  
                    sm: '85px', 
                    md: '85px',
                    lg: '100px',
                  },
                  marginBottom:{ xs: '1rem', sm: '1.5rem', md: '0.5rem', lg: '3rem' },                 
                }}
                alt="Logo Leima Legal"
                src={mode === 'dark' ? '/assets/Logo(2)_noBG.png' : '/assets/Logo(1)_crop.png'}
              />
              <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                Bienvenido de Vuelta
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: {xs: 2, sm: 3, md:0, lg:2}}}>
                Inicia sesión para continuar
              </Typography>

              {/* Formulario */}
              <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '90%' }}>
                {error && (
                  <Alert severity="error" sx={{ width: '100%', mb: {xs: 2, sm: 3, md:0, lg:2} }}>
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
                  variant="standard"
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
                  variant="standard"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  disabled={loading}
                />
                <Box sx={{ textAlign: 'center', width: '100%', mt: 1 }}>
                  <Link href="#" variant="body2">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: '8px' }}
                  disabled={loading}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}