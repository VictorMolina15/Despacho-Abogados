// src/pages/ClientesPage.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import {
  Container, Typography, List, ListItemButton, ListItemText,
  ListItemIcon, TextField, Divider, Pagination, Box, Alert, CircularProgress, Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material';
import debounce from 'lodash/debounce';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AddIcon from '@mui/icons-material/Add';
import type { Cliente } from '../types';

// Tipos para el nuevo formulario
type NewClientFormData = {
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
};
type FormErrors = Partial<NewClientFormData>;

// Este es el componente que muestra la lista de clientes
export function ClientListPage() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Estados para el diálogo de añadir cliente
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogLoading,setDialogLoading] = useState(false)
  const [newClient, setNewClient] = useState<NewClientFormData>({ nombres: '', apellidos: '', telefono: '', correo: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // --- Manejadores para el Diálogo ---
  const handleOpenDialog = () => {
    setNewClient({ nombres: '', apellidos: '', telefono: '', correo: '' });
    setOpenDialog(true);
    setFormErrors({});
  };
  const handleCloseDialog = () => setOpenDialog(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as { name: keyof NewClientFormData; value: string };
    setNewClient(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target as { name: keyof NewClientFormData; value: string };
    const error = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: error }));
  };

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

  const fetchClientes = async (page: number, search: string) => {
    setLoading(true);
    setApiError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/clientes?page=${page}&pageSize=${pageSize}&searchTerm=${search}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar los clientes.');
      }
      const data = await response.json();
      setClientes(data.data.map((c: {
        id: string;
        nombres: string;
        apellidos: string;
        correo: string;
        telefono?: string;
        fecha_creacion: string;
      }) => ({
        ...c,
        fechaCreacion: new Date(c.fecha_creacion),
        nombreCompleto: `${c.nombres} ${c.apellidos}`
      })));
      setTotalCount(data.totalCount);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClient = async () => {
    const errors: FormErrors = {};
    (Object.keys(newClient) as Array<keyof NewClientFormData>).forEach(key => {
      const error = validateField(key, newClient[key]);
      if (error) errors[key] = error;
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setDialogLoading(true);
    setFormErrors({});
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3000/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newClient)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al guardar el cliente.');
      }
      handleCloseDialog();
      fetchClientes(1, ''); // Refrescar la lista volviendo a la página 1
    } catch (err: unknown) {
      setFormErrors({ correo: err instanceof Error ? err.message : 'Error desconocido' }); // Mostrar el error de la API en el formulario
    } finally {
      setDialogLoading(false);
    }
  };

  const debouncedFetch = useMemo(() => debounce(fetchClientes, 300), []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    debouncedFetch(currentPage, searchTerm);
    return () => debouncedFetch.cancel();
  }, [currentPage, searchTerm, debouncedFetch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const handleClienteClick = (clienteId: string) => {
    navigate(`${clienteId}`);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 4 }}>
        <Typography variant="h4" component="h1">Listado de Clientes</Typography>
        <Button variant="contained" sx={{ whiteSpace: 'nowrap' }} startIcon={<AddIcon />} onClick={handleOpenDialog}>
          Añadir Cliente
        </Button>
      </Box>
      <TextField
        fullWidth
        label="Buscar Cliente por Nombre, Teléfono o Correo"
        value={searchTerm}
        onChange={handleSearchChange}
        inputRef={searchInputRef}
        sx={{ mb: 3 }}
      />
      {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}

      {loading && clientes.length === 0 ? (
        // Muestra el spinner solo en la carga inicial
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        // Una vez cargado, la lista se mantiene y solo se actualiza
        <Paper elevation={3}>
          <List>
            {clientes.length > 0 ? (
              clientes.map((cliente) => (
                <React.Fragment key={cliente.id}>
                  <ListItemButton onClick={() => handleClienteClick(cliente.id)}>
                    <ListItemIcon><AccountCircleIcon /></ListItemIcon>
                    <ListItemText
                      primary={cliente.nombreCompleto}
                      secondary={`Correo: ${cliente.correo} | Teléfono: ${cliente.telefono || 'N/A'}`}
                    />
                  </ListItemButton>
                  <Divider />
                </React.Fragment>
              ))
            ) : (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
                No se encontraron clientes.
              </Typography>
            )}
          </List>
        </Paper>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            disabled={loading}
          />
        </Box>
      )}
      {/* --- Diálogo para Añadir Cliente --- */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Añadir Nuevo Cliente</DialogTitle>
        <DialogContent>
          <TextField name="nombres" label="Nombres" required fullWidth margin="normal" value={newClient.nombres} onChange={handleChange} 
          onBlur={handleBlur} error={!!formErrors.nombres} helperText={formErrors.nombres} />
          <TextField name="apellidos" label="Apellidos" required fullWidth margin="normal" value={newClient.apellidos} onChange={handleChange} 
          onBlur={handleBlur} error={!!formErrors.apellidos} helperText={formErrors.apellidos} />
          <TextField name="telefono" label="Teléfono" fullWidth margin="normal" value={newClient.telefono} onChange={handleChange} 
          onBlur={handleBlur} error={!!formErrors.telefono} helperText={formErrors.telefono} />
          <TextField name="correo" label="Correo Electrónico" required type="email" fullWidth margin="normal" value={newClient.correo} onChange={handleChange} 
          onBlur={handleBlur} error={!!formErrors.correo} helperText={formErrors.correo} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={dialogLoading}>Cancelar</Button>
          <Button onClick={handleSaveClient} variant="contained" disabled={dialogLoading || Object.values(formErrors).some(Boolean)}>
            {dialogLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

// El componente layout principal no cambia, sigue siendo correcto.
export function ClientesPage() {
  return <Outlet />;
}