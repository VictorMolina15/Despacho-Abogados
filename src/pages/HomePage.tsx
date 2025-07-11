// src/pages/HomePage.tsx
import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Alert, Container } from '@mui/material';
import type { Cliente } from '../types'; // Importamos el tipo Cliente

// Definimos tipos explícitos para los datos que esperamos del backend
type ExpedientePorTipo = {
  nombre: string | null | undefined;
  count: number;
};

type UltimoCliente = Pick<Cliente, 'id' | 'nombres' | 'apellidos'> & {
  fecha_creacion: string; // La fecha vendrá como string desde la API
};

type DashboardStats = {
  totalClientes: number;
  totalExpedientes: number;
  expedientesPorTipo: ExpedientePorTipo[];
  ultimosClientes: UltimoCliente[];
};

export function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:3000/api/dashboard-stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error('No se pudieron cargar las estadísticas del dashboard.');
        }
        const data: DashboardStats = await response.json();
        setStats(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error desconocido');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Container sx={{mt: 4}}><Alert severity="error">{error}</Alert></Container>;
  }

  if (!stats) {
    return null; // O un mensaje de que no hay datos
  }
  
  return (
    <Box sx={{ mt: 4, px: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4, textAlign: 'center' }}>
        Dashboard del Despacho
      </Typography>
      <Grid container spacing={3} justifyContent="center">
        {/* Widget: Resumen de Clientes */}
        <Grid>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">Total Clientes</Typography>
            <Typography variant="h3" color="primary">{stats.totalClientes}</Typography>
          </Paper>
        </Grid>
        {/* Widget: Resumen de Expedientes */}
        <Grid>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">Total Expedientes</Typography>
            <Typography variant="h3" color="primary">{stats.totalExpedientes}</Typography>
          </Paper>
        </Grid>
        {/* Widget: Expedientes por Tipo */}
        <Grid>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Expedientes por Tipo</Typography>
            {stats.expedientesPorTipo.length > 0 ? (
              stats.expedientesPorTipo.map((item) => (
                <Typography key={item.nombre} variant="body1">
                  {item.nombre}:{' '}
                  <Typography component="span" color="primary" variant="body1" sx={{ fontWeight: 500 }}>
                  {item.count}
                  </Typography>
                </Typography>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">No hay expedientes registrados.</Typography>
            )}
          </Paper>
        </Grid>
        {/* Widget: Últimos Clientes Añadidos */}
        <Grid>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Últimos Clientes Añadidos</Typography>
            {stats.ultimosClientes.length > 0 ? (
              stats.ultimosClientes.map((cliente) => (
                <Box key={cliente.id} sx={{ mb: 1 }}>
                  <Typography variant="body1" sx={{ borderTop: '1px solid #eee', pt: 1 }}>{`${cliente.nombres} ${cliente.apellidos}`}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Registrado el: {new Date(cliente.fecha_creacion).toLocaleDateString()}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">No hay clientes recientes.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}