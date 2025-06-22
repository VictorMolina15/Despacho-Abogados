/* eslint-disable react-refresh/only-export-components */
// src/pages/ClienteDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Container,
  IconButton,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { clientesSimulados } from './ClientesPage';

// Importa las interfaces de tus tipos
import type { Cliente, Expediente } from '../types';


export const expedientesSimulados: Expediente[] = [
  { id: 'exp1', clienteId: '1', tipo: 'Divorcio', documentos: [] },
  { id: 'exp2', clienteId: '1', tipo: 'Mercantil', documentos: [] },
  { id: 'exp3', clienteId: '2', tipo: 'Penal', documentos: [] },
];

export function ClienteDetailPage() {
  const { clienteId } = useParams<{ clienteId: string }>();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCliente, setEditedCliente] = useState<Cliente | null>(null);
  const [expedientesDelCliente, setExpedientesDelCliente] = useState<Expediente[]>([]);

  useEffect(() => {
    // Simular carga de datos del cliente y sus expedientes
    const foundCliente = clientesSimulados.find((c) => c.id === clienteId);
    if (foundCliente) {
      setCliente(foundCliente);
      setEditedCliente({ ...foundCliente }); // Copia para la edición
      const relatedExpedientes = expedientesSimulados.filter(
        (exp) => exp.clienteId === foundCliente.id,
      );
      setExpedientesDelCliente(relatedExpedientes);
    } else {
      // Manejar caso donde el cliente no existe
      navigate('/clientes'); // O mostrar un mensaje de error
    }
  }, [clienteId, navigate]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    // Si se cancela la edición, revertir a los datos originales del cliente
    if (isEditing && cliente) {
      setEditedCliente({ ...cliente });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editedCliente) {
      setEditedCliente({
        ...editedCliente,
        [name]: value,
      });
    }
  };

  const handleSave = () => {
    // Aquí iría la lógica para guardar los datos actualizados del cliente en tu API
    console.log('Guardando cliente:', editedCliente);
    if (editedCliente) {
      setCliente({ ...editedCliente }); // Actualiza el estado del cliente principal
    }
    setIsEditing(false);
    // Aquí podrías mostrar una notificación de éxito o redirigir
  };

  if (!cliente) {
    return <Typography>Cargando detalles del cliente...</Typography>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/clientes')} aria-label="back to clients">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ ml: 1 }}>
          Detalle del Cliente
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Datos Personales
        </Typography>
        <TextField
          fullWidth
          label="Nombre Completo"
          name="nombreCompleto"
          value={editedCliente?.nombreCompleto || ''}
          onChange={handleInputChange}
          disabled={!isEditing}
          margin="normal"
          variant="outlined"
        />
        <TextField
          fullWidth
          label="Número de Teléfono"
          name="telefono"
          value={editedCliente?.telefono || ''}
          onChange={handleInputChange}
          disabled={!isEditing}
          margin="normal"
          variant="outlined"
        />
        <TextField
          fullWidth
          label="Correo Electrónico"
          name="correo"
          value={editedCliente?.correo || ''}
          onChange={handleInputChange}
          disabled={!isEditing}
          margin="normal"
          variant="outlined"
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Fecha de Creación: {cliente.fechaCreacion.toLocaleDateString()}
        </Typography>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          {isEditing ? (
            <>
              <Button
                variant="contained"
                onClick={handleSave}
                startIcon={<SaveIcon />}
              >
                Guardar
              </Button>
              <Button
                variant="outlined"
                onClick={handleEditToggle}
                startIcon={<CancelIcon />}
              >
                Cancelar
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={handleEditToggle}
              startIcon={<EditIcon />}
            >
              Editar Datos
            </Button>
          )}
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Expedientes del Cliente
        </Typography>
        {expedientesDelCliente.length > 0 ? (
          <List>
            {expedientesDelCliente.map((expediente) => (
              <React.Fragment key={expediente.id}>
                <ListItem>
                  <ListItemText
                    primary={`Expediente: ${expediente.id}`}
                    secondary={`Tipo: ${expediente.tipo}`}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography variant="body1">
            No hay expedientes asociados a este cliente.
          </Typography>
        )}
      </Paper>
    </Container>
  );
}