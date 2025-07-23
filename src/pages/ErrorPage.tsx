// src/pages/ErrorPage.tsx
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { Typography, Button, Paper, Container } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

export function ErrorPage() {
  const error = useRouteError(); // Hook que captura el error
  const navigate = useNavigate();
  let errorMessage: string;
  let errorStatus: number | undefined;

  // Verificamos el tipo de error para mostrar un mensaje más útil
  if (isRouteErrorResponse(error)) {
    // Error de respuesta de ruta (ej. 404 No Encontrado)
    errorStatus = error.status;
    errorMessage = error.statusText || 'Ha ocurrido un error en la ruta.';
  } else if (error instanceof Error) {
    // Error estándar de JavaScript
    errorMessage = error.message;
  } else {
    // Otro tipo de error
    errorMessage = 'Ha ocurrido un error inesperado.';
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', height: '100vh' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
        <Typography variant="h3" component="h1" color="primary" gutterBottom>
          ¡Ups!
        </Typography>
        {errorStatus && (
          <Typography variant="h5" color="error">
            Error {errorStatus}
          </Typography>
        )}
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 4 }}>
          {errorMessage}
        </Typography>
        <Button
          variant="contained"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')} // Botón para volver al inicio
        >
          Volver al Inicio
        </Button>
      </Paper>
    </Container>
  );
}