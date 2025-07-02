// src/pages/ClienteDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Paper, List, ListItem, ListItemText,
  Divider, Container, IconButton, CircularProgress, Alert
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import type { Cliente, Expediente } from '../types';

// La sección de expedientes seguirá siendo simulada por ahora.
export const expedientesSimulados: Expediente[] = [
  { id: 'exp1', clienteId: '1', tipo: 'Divorcio', documentos: [] },
  { id: 'exp2', clienteId: '1', tipo: 'Mercantil', documentos: [] },
  { id: 'exp3', clienteId: '2', tipo: 'Penal', documentos: [] },
];

// Tipo para los datos del formulario de edición
type ClientFormData = {
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
};

// Tipo para los errores del formulario
type FormErrors = {
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  correo?: string;
};

export function ClienteDetailPage() {
  const { clienteId } = useParams<{ clienteId: string }>();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedCliente, setEditedCliente] = useState<ClientFormData | null>(null);
  const [expedientesDelCliente, setExpedientesDelCliente] = useState<Expediente[]>([]);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    const fetchClienteDetalle = async () => {
      setLoading(true);
      setApiError(null);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:3000/api/clientes/${clienteId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error('No se pudo cargar la información del cliente.');
        }
        const data = await response.json();
        const fullCliente = {
            ...data,
            fechaCreacion: new Date(data.fecha_creacion),
            nombreCompleto: `${data.nombres} ${data.apellidos}`
        };
        setCliente(fullCliente);
        setEditedCliente({
            nombres: data.nombres,
            apellidos: data.apellidos,
            telefono: data.telefono,
            correo: data.correo
        });

        // Lógica simulada para expedientes
        const relatedExpedientes = expedientesSimulados.filter(exp => exp.clienteId === clienteId);
        setExpedientesDelCliente(relatedExpedientes);

      } catch (err: unknown) {
        setApiError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
      } finally {
        setLoading(false);
      }
    };

    if (clienteId) {
      fetchClienteDetalle();
    }
  }, [clienteId]);

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'nombres':
      case 'apellidos': {
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/;
        if (!value) return 'Este campo es requerido.';
        return nameRegex.test(value) ? undefined : 'Solo se permiten letras y espacios.';
      }
      case 'correo': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) return 'El correo es requerido.';
        return emailRegex.test(value) ? undefined : 'Introduce un correo válido.';
      }
      case 'telefono': {
        const phoneRegex = /^[0-9]{10}$/;
        return !value || phoneRegex.test(value) ? undefined : 'El teléfono debe tener 10 números.';
      }
      default:
        return undefined;
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleEditToggle = () => {
    if (isEditing && cliente) {
      setEditedCliente({ 
        nombres: cliente.nombres ?? '', 
        apellidos: cliente.apellidos ?? '', 
        telefono: cliente.telefono ?? '', 
        correo: cliente.correo ?? '' 
      });
      setFormErrors({}); // Limpiar errores al cancelar
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedCliente(prev => (prev ? { ...prev, [name]: value } : null));
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSave = async () => {
    if (!editedCliente) return;
    
    // Validar todos los campos antes de guardar
    const errors: FormErrors = {};
    (Object.keys(editedCliente) as Array<keyof ClientFormData>).forEach(key => {
      const error = validateField(key, editedCliente[key] || '');
      if (error) errors[key] = error;
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/clientes/${clienteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editedCliente)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar los cambios.");
      }
      setCliente(prev => prev ? { ...prev, ...editedCliente, nombreCompleto: `${editedCliente.nombres} ${editedCliente.apellidos}` } : null);
      setIsEditing(false);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !cliente) return <Container sx={{p: 5, textAlign: 'center'}}><CircularProgress /></Container>;
  if (apiError) return <Container sx={{p: 5}}><Alert severity="error">{apiError}</Alert></Container>;
  if (!cliente || !editedCliente) return null;

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
        <Typography variant="h5" sx={{ mb: 2 }}>Datos Personales</Typography>
        <TextField fullWidth label="Nombres" name="nombres" value={editedCliente.nombres} onChange={handleInputChange} onBlur={handleBlur} error={!!formErrors.nombres} helperText={formErrors.nombres} disabled={!isEditing} margin="normal" variant="outlined" />
        <TextField fullWidth label="Apellidos" name="apellidos" value={editedCliente.apellidos} onChange={handleInputChange} onBlur={handleBlur} error={!!formErrors.apellidos} helperText={formErrors.apellidos} disabled={!isEditing} margin="normal" variant="outlined" />
        <TextField fullWidth label="Número de Teléfono" name="telefono" value={editedCliente.telefono} onChange={handleInputChange} onBlur={handleBlur} error={!!formErrors.telefono} helperText={formErrors.telefono} disabled={!isEditing} margin="normal" variant="outlined" />
        <TextField fullWidth label="Correo Electrónico" name="correo" value={editedCliente.correo} onChange={handleInputChange} onBlur={handleBlur} error={!!formErrors.correo} helperText={formErrors.correo} disabled={!isEditing} margin="normal" variant="outlined" />
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Fecha de Creación: {new Date(cliente.fechaCreacion).toLocaleDateString()}
        </Typography>
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          {isEditing ? (
            <>
              <Button variant="contained" onClick={handleSave} startIcon={<SaveIcon />} disabled={loading}>Guardar</Button>
              <Button variant="outlined" onClick={handleEditToggle} startIcon={<CancelIcon />}>Cancelar</Button>
            </>
          ) : (
            <Button variant="contained" onClick={handleEditToggle} startIcon={<EditIcon />}>Editar Datos</Button>
          )}
        </Box>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Expedientes del Cliente</Typography>
        {expedientesDelCliente.length > 0 ? (
          <List>
            {expedientesDelCliente.map((expediente) => (
              <React.Fragment key={expediente.id}>
                <ListItem><ListItemText primary={`Expediente: ${expediente.id}`} secondary={`Tipo: ${expediente.tipo}`} /></ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography variant="body1">No hay expedientes asociados a este cliente.</Typography>
        )}
      </Paper>
    </Container>
  );
}
