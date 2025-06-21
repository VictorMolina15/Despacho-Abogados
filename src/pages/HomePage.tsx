// src/pages/HomePage.tsx
import { Box, Typography, Paper, Grid } from '@mui/material';
// Podrías necesitar importar los datos simulados aquí o centralizarlos
import { clientesSimulados } from './ClientesPage'; // O mejor, desde un archivo de mocks centralizado
import { expedientesSimulados } from './ClienteDetailPage'; // Similarmente, centralizar esto

export function HomePage() {
  // Cálculos básicos (ejemplos con datos simulados)
  const totalClientes = clientesSimulados.length;
  const totalExpedientes = expedientesSimulados.length;

  // Expedientes por tipo (ejemplo básico)
  type Expediente = typeof expedientesSimulados[number];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expedientesPorTipo = expedientesSimulados.reduce((acc: { [x: string]: any; }, exp: Expediente) => {
    acc[exp.tipo] = (acc[exp.tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Últimos 3 clientes
  const ultimosClientes = [...clientesSimulados]
    .sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime())
    .slice(0, 3);

  return (
    <Box sx={{ mt: 4, px: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4, textAlign: 'center' }}>
        Dashboard del Despacho
      </Typography>

      <Grid container spacing={3}>
        {/* Widget: Resumen de Clientes */}
        <Grid sx={{ md: 2 }} >
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Total Clientes
            </Typography>
            <Typography variant="h3" color="primary">
              {totalClientes}
            </Typography>
          </Paper>
        </Grid>

        {/* Widget: Resumen de Expedientes */}
        <Grid sx={{ md: 2 }} >
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Total Expedientes
            </Typography>
            <Typography variant="h3" color="primary">
              {totalExpedientes}
            </Typography>
          </Paper>
        </Grid>

        {/* Widget: Expedientes por Tipo */}
        <Grid sx={{ md: 4 }} >
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Expedientes por Tipo
            </Typography>
            {(Object.entries(expedientesPorTipo) as [string, number][]).map(([tipo, count]) => (
              <Typography key={tipo} variant="body1">
                {tipo}: {count}
              </Typography>
            ))}
          </Paper>
        </Grid>

        {/* Widget: Últimos Clientes Añadidos */}
        <Grid sx={{ md: 6 }} >
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Últimos Clientes Añadidos
            </Typography>
            {ultimosClientes.length > 0 ? (
              ultimosClientes.map((cliente) => (
                <Box key={cliente.id} sx={{ mb: 1 }}>
                  <Typography variant="body1">
                    **{cliente.nombreCompleto}**
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Registrado el: {cliente.fechaCreacion.toLocaleDateString()}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No hay clientes recientes.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Puedes añadir más widgets aquí, como los últimos expedientes, o accesos rápidos */}
      </Grid>
    </Box>
  );
}