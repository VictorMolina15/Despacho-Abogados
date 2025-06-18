// src/pages/LoginPage.tsx
import { Box, Button, Container, TextField, Typography, Link, Paper, IconButton } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Icono para Dark Mode
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Icono para Light Mode
import { useThemeContext } from '../ThemeContext'; // Importa tu hook de contexto

export function LoginPage() {
  const { toggleColorMode, mode } = useThemeContext(); // Usa el contexto del tema

  return (
    <Container maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', alignContent: 'center', justifyContent: 'center', height: '100vh' }}>
      <IconButton
          sx={{ position: 'absolute', top: 16, right: 16 }} // Posiciona el botón en la esquina superior derecha
          onClick={toggleColorMode}
          color="inherit" // Hereda el color del texto
        >
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      <Paper
        elevation={6}
        sx={{
          margin: 0,
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: (theme) => theme.palette.background.paper,
          borderRadius: 2,
          position: 'relative', // Para posicionar el botón de tema
          top: 0,
          left: 0,

        }}
      >
        
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          Iniciar Sesión
        </Typography>
        
        <Box component="form" method="get" action="/clientes" noValidate sx={{ mt: 1 }}>
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
            sx={{ mb: 2 }}
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
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2, mb: 2 }}
          >
            Entrar
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