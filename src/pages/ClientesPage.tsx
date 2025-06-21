/* eslint-disable react-refresh/only-export-components */
// src/pages/ClientesPage.tsx
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  TextField,
  Divider,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

// Importa las interfaces de tus tipos
import type { Cliente } from '../types';
import React from 'react';

// Simulamos los datos que vendrían de tu API (usamos la interfaz Cliente)
export const clientesSimulados: Cliente[] = [
  {
    id: '1',
    nombreCompleto: 'Carlos Enrique Luevano Aguirre',
    telefono: '555-1234',
    correo: 'Gunsdead666@example.com',
    fechaCreacion: new Date('2023-01-15'),
  },
  {
    id: '2',
    nombreCompleto: 'Antino Rodriguez',
    telefono: '555-5678',
    correo: 'antinoxd@example.com',
    fechaCreacion: new Date('2023-03-20'),
  },
  {
    id: '3',
    nombreCompleto: 'Oliver Leonardo García Montoya',
    telefono: '555-9012',
    correo: 'hermitoli@example.com',
    fechaCreacion: new Date('2023-05-10'),
  },
];

export function ClientesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleClienteClick = (clienteId: string) => {
    navigate(`/clientes/${clienteId}`);
  };

  const filteredClientes = clientesSimulados.filter((cliente) =>
    cliente.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefono.includes(searchTerm) ||
    cliente.correo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" sx={{ my: 4 }}>
        Listado de Clientes
      </Typography>

      <TextField
        fullWidth
        label="Buscar Cliente por Nombre, Teléfono o Correo"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      <List>
        {filteredClientes.length > 0 ? (
          filteredClientes.map((cliente) => (
            <React.Fragment key={cliente.id}>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleClienteClick(cliente.id)}>
                  <ListItemIcon>
                    <AccountCircleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={cliente.nombreCompleto}
                    secondary={`Teléfono: ${cliente.telefono} | Correo: ${cliente.correo}`}
                  />
                </ListItemButton>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))
        ) : (
          <Typography variant="body1" sx={{ textAlign: 'center', mt: 3 }}>
            No se encontraron clientes.
          </Typography>
        )}
      </List>
    </Container>
  );
}