// src/pages/DivorciosPage.tsx
import {
  Typography,
  List,
  ListItem,
  Link,
  Card,
  CardContent,
  Container, // Para organizar secciones
  Paper,
  Grid, // Importa Grid para evitar errores de tipo
} from '@mui/material';


import DownloadIcon from '@mui/icons-material/Download';

export function DivorciosPage() {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        Sección de Divorcios
      </Typography>

      <Grid container spacing={4}>
        {/* Formatos */}
        <Grid >
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Formatos Descargables
            </Typography>
            <List>
              <ListItem>
                <Link
                  href="/path/to/demanda_incausado.docx" // Reemplaza con la ruta real de tu archivo
                  download="Demanda_Divorcio_Incausado.docx"
                  sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                >
                  <DownloadIcon sx={{ mr: 1 }} />
                  Demanda de Divorcio Incausado
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  href="/path/to/convenio_divorcio.docx" // Reemplaza con la ruta real de tu archivo
                  download="Convenio_Divorcio.docx"
                  sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                >
                  <DownloadIcon sx={{ mr: 1 }} />
                  Convenio de Divorcio
                </Link>
              </ListItem>
              {/* Añade más formatos aquí */}
            </List>
          </Paper>
        </Grid>

        {/* Proceso */}
        <Grid >
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Proceso del Divorcio
            </Typography>
            <Card>
              <CardContent>
                {/* Reemplaza 'path/to/tu_mapa_conceptual.jpg' con la URL real de tu imagen */}
                <img
                  src="https://via.placeholder.com/600x400"
                  alt="Mapa Conceptual del Proceso de Divorcio"
                  style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
                />
                <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                  (Haz clic en la imagen para ampliar si es necesario)
                </Typography>
              </CardContent>
            </Card>
          </Paper>
        </Grid>

        {/* Requisitos */}
        <Grid >
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Requisitos de Documentación
            </Typography>
            <Typography variant="body1">
              Para iniciar el proceso de divorcio, se requerirá la siguiente documentación:
            </Typography>
            <List dense>
              <ListItem>Copia certificada del acta de matrimonio.</ListItem>
              <ListItem>Actas de nacimiento de los hijos (si los hay).</ListItem>
              <ListItem>Comprobante de domicilio (no mayor a 3 meses).</ListItem>
              <ListItem>Identificación oficial de ambos cónyuges.</ListItem>
              <ListItem>Acta de nacimiento de ambos cónyuges.</ListItem>
              <ListItem>Inventario de bienes y deudas (si aplica).</ListItem>
              {/* Añade más requisitos aquí */}
            </List>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              * lista es de carácter informativo.
            </Typography>
          </Paper>
        </Grid>

        {/* Contrato */}
        <Grid>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Contrato de Prestación de Servicios
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Descargue nuestro modelo de contrato de prestación de servicios legales para revisión.
            </Typography>
            <Link
              href="/path/to/contrato_servicios.docx" // Reemplaza con la ruta real de tu archivo
              download="Contrato_Prestacion_Servicios.docx"
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            >
              <DownloadIcon sx={{ mr: 1 }} />
              Descargar Contrato
            </Link>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}