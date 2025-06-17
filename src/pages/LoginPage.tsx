// src/pages/LoginPage.tsx
import { Box, Button, Container, TextField, Typography } from '@mui/material';

export function LoginPage() {
  return (

    <Container maxWidth="xs">
      {/* Box es como un <div> pero con superpoderes para estilos */}
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Typography es para todo el texto. Es mejor que usar h1, p, etc. */}
        <Typography component="h1" variant="h5">
          Iniciar Sesión
        </Typography>

        <Box component="form" sx={{ mt: 1 }}>
          {/* TextField es un campo de texto con muchas opciones */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Correo Electrónico"
            name="email"
            autoComplete="email"
            autoFocus
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
          />
          {/* Button, el componente de botón */}
          <Button
            type="submit"
            fullWidth
            variant="contained" 
            sx={{ mt: 3, mb: 2 }}
          >
            Entrar
          </Button>
        </Box>
      </Box>
    </Container>
  );
}