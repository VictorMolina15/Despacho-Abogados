// src/pages/HomePage.tsx
import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Alert, Container } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import type { Cliente } from '../types'; // Importamos el tipo Cliente

// Definimos tipos explícitos para los datos que esperamos del backend
type ExpedientePorTipo = {
  nombre: string | null | undefined;
  count: number;
};

type ExpedientePorEstado = {
  estado: string;
  count: number;
};

type UltimoExpediente = {
  id: number;
  numero_expediente: string;
  fecha_apertura: string;
  nombre_cliente: string;
};

type UltimoCliente = Pick<Cliente, 'id' | 'nombres' | 'apellidos'> & {
  fecha_creacion: string; // La fecha vendrá como string desde la API
};

type DashboardStats = {
  totalClientes: number;
  totalExpedientes: number;
  expedientesPorTipo: ExpedientePorTipo[];
  ultimosClientes: UltimoCliente[];
  expedientesPorEstado: ExpedientePorEstado[];
  ultimosExpedientes: UltimoExpediente[];
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
    return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
  }

  if (!stats) {
    return null; // O un mensaje de que no hay datos
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4, textAlign: 'center' }}>
        Dashboard del Despacho
      </Typography>

      {/* Contenedor principal del Grid */}
      <Grid container spacing={3}>

        <Grid container sx={{ xs: 12, md: 8 }} spacing={3} direction="row" justifyContent="space-between">
          {/* Columna 1: Widgets de Totales */}
          <Grid container sx={{ xs: 12, md: 4 }} spacing={4} direction="column">
            {/* .div1: Total Clientes */}
            <Grid sx={{ xs: 12 }}>
              <Paper elevation={3} sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <Typography variant="h5" color="text.secondary">Total Clientes</Typography>
                <Typography variant="h2" color="primary">{stats.totalClientes}</Typography>
              </Paper>
            </Grid>
            {/* .div2: Total Expedientes */}
            <Grid sx={{ xs: 12 }}>
              <Paper elevation={3} sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <Typography variant="h5" color="text.secondary">Total Expedientes</Typography>
                <Typography variant="h2" color="primary">{stats.totalExpedientes}</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Columna 2: Expedientes por Tipo */}
          {/* .div3 */}
          <Grid sx={{ xs: 12, md: 4 }} >
          <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 1, flexShrink: 0 }}>
              Expedientes por Tipo
            </Typography>

            {stats.expedientesPorTipo.length > 0 ? (
              <Box sx={{
                maxHeight: 245,
                overflowY: 'auto',
                flexGrow: 1,
                '&::-webkit-scrollbar': { width: '8px' },
                '&::-webkit-scrollbar-track': { background: '#b3b3b3ff' },
                '&::-webkit-scrollbar-thumb': { background: '#6e6e6e', borderRadius: '4px' },
                '&::-webkit-scrollbar-thumb:hover': { background: '#555' }
              }}>
                {stats.expedientesPorTipo.map((item) => (
                  <Typography key={item.nombre} variant="body1">
                    {item.nombre}:{' '}
                    <Typography component="span" color="primary" variant="body1" sx={{ fontWeight: 500 }}>
                      {item.count}
                    </Typography>
                  </Typography>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No hay expedientes registrados.
              </Typography>
            )}
          </Paper>
          </Grid>

          {/* Columna 3: Listas de Clientes y Expedientes recientes */}
          <Grid sx={{ xs: 12, md: 4 }} spacing={3} >
            {/* .div4: Últimos Clientes Añadidos */}
            <Grid sx={{ xs: 12, height: '100%' }}>
              <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Últimos Clientes Añadidos</Typography>
                {stats.ultimosClientes.length > 0 ? (
                  stats.ultimosClientes.map((cliente) => (
                    <Box key={cliente.id} sx={{ mb: 1, borderTop: '1px solid #eee', pt: 1 }}>
                      <Typography variant="body1">{`${cliente.nombres} ${cliente.apellidos}`}</Typography>
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
          {/* .div5: Expedientes Recientes */}
          <Grid sx={{ xs: 12 }}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Expedientes Recientes</Typography>
              {stats.ultimosExpedientes.length > 0 ? (
                stats.ultimosExpedientes.map((exp) => (
                  <Box key={exp.id} sx={{ mb: 1, borderTop: '1px solid #eee', pt: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{exp.numero_expediente}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cliente: {exp.nombre_cliente}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Apertura: {new Date(exp.fecha_apertura).toLocaleDateString()}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">No hay expedientes recientes.</Typography>
              )}
            </Paper>
          </Grid>

          {/* Fila Inferior: Gráfico de Estados */}
          {/* .div6 */}
          <Grid sx={{ xs: 12, md: 8 }} >
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Estado de Expedientes
              </Typography>
              {stats.expedientesPorEstado.length > 0 ? (
                <Box sx={{ width: '100%', height: 250 }}>
                  <BarChart
                    sx={{ p: 1 }}
                    dataset={stats.expedientesPorEstado}
                    yAxis={[
                      {
                        scaleType: 'band',
                        dataKey: 'estado',
                        tickLabelStyle: {
                          maxWidth: 37,
                          fontSize: '15px',
                        },
                      },
                    ]}
                    xAxis={[
                      {
                        valueFormatter: (value: unknown) =>
                          Number.isInteger(value as number) ? (value as number).toString() : '',
                      },
                    ]}
                    series={[
                      {
                        dataKey: 'count',
                        label: 'Total Expedientes',
                      },
                    ]}
                    layout="horizontal"
                    colors={['#1976d2']}
                    margin={{ left: 80, top: 40, right: 20, bottom: 30 }}
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay datos de estado de expedientes.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}