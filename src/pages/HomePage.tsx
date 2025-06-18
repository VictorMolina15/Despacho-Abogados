import { Box, Typography } from '@mui/material';

export function HomePage() {
  return (
    <Box sx={{ mt: 4, textAlign: 'center' }}>
      <Typography variant="h4" component="h1">
        Bienvenido al Despacho de Abogados
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Selecciona una opción del menú superior para comenzar.
      </Typography>
    </Box>
  );
}