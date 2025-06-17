// src/pages/ClientesPage.tsx
import { Link as RouterLink } from 'react-router-dom'; // Renombramos el Link para evitar conflictos
import { Container, Typography, List, ListItem, ListItemButton, ListItemText, ListItemIcon } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // Importamos un ícono

// Simulamos los datos que vendrían de tu API
const clientes = [
  { id: '1', nombreCompleto: 'Juan Pérez López' },
  { id: '2', nombreCompleto: 'Ana García Martínez' },
  { id: '3', nombreCompleto: 'Carlos Sánchez Rodríguez' },
];

export function ClientesPage() {
  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" sx={{ my: 4 }}>
        Listado de Clientes
      </Typography>

      <List>
        {clientes.map((cliente) => (
          // El componente Link de Router envuelve al ListItemButton de MUI
          <RouterLink 
            to={`/clientes/${cliente.id}`} 
            key={cliente.id} 
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <AccountCircleIcon />
                </ListItemIcon>
                <ListItemText primary={cliente.nombreCompleto} />
              </ListItemButton>
            </ListItem>
          </RouterLink>
        ))}
      </List>
    </Container>
  );
}