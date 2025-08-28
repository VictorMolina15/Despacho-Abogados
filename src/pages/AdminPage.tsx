// src/pages/AdminPage.tsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Container, Typography, List, ListItem, ListItemText, IconButton, TextField, Button,
  Dialog, DialogActions, DialogContent, DialogTitle, Select, MenuItem, InputLabel,
  FormControl, Divider, Box, Paper, Alert, CircularProgress, InputAdornment, Pagination,
  debounce
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { Usuario } from '../types';

// Un tipo para el formulario, incluyendo la contraseña opcional
type UserFormData = Omit<Usuario, 'id' | 'fechaRegistro'> & { id?: string; contrasena?: string };

type FormErrors = {
  nombres?: string;
  apellidos?: string;
  correo?: string;
  telefono?: string;
  contrasena?: string;
};

export function AdminPage() {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<UserFormData> | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  // Estados para el campo de contraseña del diálogo
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(3); // Cantidad de usuarios por página
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = async (page: number, search: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/usuarios?page=${page}&pageSize=${pageSize}&searchTerm=${search}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (!response.ok) throw new Error('Error al cargar usuarios.');
      const data = await response.json();
      setUsers(data.data);
      setTotalCount(data.totalCount);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    }
    finally { setLoading(false); }
  };

  // Usamos useMemo y debounce para la búsqueda, es una optimización.
  const debouncedFetch = useMemo(() =>
    debounce((page, search) => fetchUsers(page, search), 300),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );


  useEffect(() => {
    debouncedFetch(currentPage, searchTerm);
  }, [currentPage, searchTerm, debouncedFetch]);

  useEffect(() => {
    if (document.activeElement === searchInputRef.current && !loading) {
      // Guardamos la posición del cursor antes de que React pueda moverlo.
      const cursorPosition = searchInputRef.current?.selectionStart;
      searchInputRef.current?.focus();
      // Restauramos la posición del cursor, para que no salte al final.
      if (typeof cursorPosition === 'number') {
        searchInputRef.current?.setSelectionRange(cursorPosition, cursorPosition);
      }
    }
  }, [users, loading]); // Se ejecuta cuando los usuarios cambian (después de la carga)

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (e: React.ChangeEvent<unknown>, value: number) => {
    e.preventDefault();
    setCurrentPage(value);
  };

  const handleOpenAddDialog = () => {
    setIsNewUser(true);
    setCurrentUser({ nombres: '', apellidos: '', telefono: '', correo: '', rol: 'Usuario', contrasena: '' });
    setOpenDialog(true);
    setFormErrors({});
  };

  const handleOpenEditDialog = (user: Usuario) => {
    setIsNewUser(false);
    setCurrentUser({ ...user, contrasena: '' }); // Contraseña vacía para no mostrarla
    setOpenDialog(true);
    setFormErrors({});
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentUser(null);
    setShowPassword(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setCurrentUser(prev => (prev ? { ...prev, [name]: value } : null));
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'nombres':
      case 'apellidos': { // Misma lógica para ambos campos
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/; // Letras, espacios, acentos, diéresis y ñ
        if (!value) return 'Este campo es requerido.';
        return nameRegex.test(value) ? undefined : 'Solo se permiten letras y espacios.';
      }
      case 'correo':
        {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value) ? undefined : 'Introduce un correo válido.';
        }
      case 'telefono':
        {
          const phoneRegex = /^[0-9]{10}$/; // Ejemplo: 10 dígitos exactos
          return phoneRegex.test(value) || value === '' ? undefined : 'El teléfono debe tener 10 números.';
        }
      case 'contrasena':
        if (isNewUser && value.length === 0) return 'La contraseña es obligatoria.';
        if (value.length > 0) {
          const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          return passRegex.test(value) ? undefined : '8+ caracteres, mayúscula, minúscula, número y símbolo.';
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSaveUser = async () => {
    if (!currentUser) return;

    const errors: FormErrors = {};
    Object.keys(currentUser).forEach(key => {
      const value = (currentUser as Record<string, string | undefined>)[key] || '';
      const error = validateField(key, value);
      if (error) {
        errors[key as keyof FormErrors] = error;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return; // Detiene el guardado si hay errores
    }

    const token = localStorage.getItem('authToken');
    const method = isNewUser ? 'POST' : 'PUT';
    const url = isNewUser ? `${import.meta.env.VITE_API_BASE_URL}/api/usuarios` : `${import.meta.env.VITE_API_BASE_URL}/api/usuarios/${currentUser.id}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(currentUser)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al guardar el usuario.');

      handleCloseDialog();
      fetchUsers(currentPage, searchTerm);// Recargar la lista de usuarios
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      } else {
        alert(`Error desconocido: ${String(err)}`);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/usuarios/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al eliminar el usuario.');

        fetchUsers(currentPage, searchTerm); // Recargar la lista
      } catch (err: unknown) {
        if (err instanceof Error) {
          alert(`Error: ${err.message}`);
        } else {
          alert(`Error desconocido: ${String(err)}`);
        }
      }
    }
  };

  if (error) return <Container sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Container>;

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 4 }}>
        <Typography variant="h4" component="h1">Gestión de Usuarios</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDialog} disabled={loading}>Añadir Usuario</Button>
      </Box>
      <TextField fullWidth label="Buscar usuario por Nombre(s), Correo o Teléfono" value={searchTerm} onChange={handleSearchChange} inputRef={searchInputRef} sx={{ mb: 3 }} />
      {error && <Alert severity="error">{error}</Alert>}
      <Paper elevation={3} sx={{ position: 'relative', opacity: loading ? 0.7 : 1, transition: 'opacity 300ms' }}>
        {/* El spinner se superpone y solo aparece cuando `loading` es true */}
        {loading && (
          <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
            <CircularProgress />
          </Box>
        )}
        <List>
          {users.length > 0 ? (
            users.map(user => (
              <React.Fragment key={user.id}>
                <ListItem secondaryAction={
                  <Box>
                    <IconButton onClick={() => handleOpenEditDialog(user)}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDeleteUser(user.id)}><DeleteIcon /></IconButton>
                  </Box>
                }>
                  <AccountCircleIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  <ListItemText
                    primary={`${user.nombres} ${user.apellidos} (${user.rol})`}
                    secondary={`Correo: ${user.correo} | Teléfono: ${user.telefono || 'N/A'}`}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))
          ) : (
            <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
              No se encontraron usuarios que coincidan con la búsqueda.
            </Typography>
          )}
        </List>
      </Paper>
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

      {/* DIÁLOGO CONECTADO Y CON VALIDACIÓN */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{isNewUser ? 'Añadir Nuevo Usuario' : 'Editar Usuario'}</DialogTitle>
        <DialogContent>
          <TextField
            name="nombres"
            label="Nombres"
            fullWidth required
            margin="normal"
            value={currentUser?.nombres || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            error={!!formErrors.nombres}
            helperText={formErrors.nombres}
          />
          <TextField
            name="apellidos"
            label="Apellidos"
            fullWidth required
            margin="normal"
            value={currentUser?.apellidos || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            error={!!formErrors.apellidos}
            helperText={formErrors.apellidos}
          />
          <TextField margin="dense" name="telefono" label="Teléfono"
            fullWidth variant="outlined" value={currentUser?.telefono || ''} onChange={handleChange}
            onBlur={handleBlur} error={!!formErrors.telefono} helperText={formErrors.telefono} />
          <TextField margin="dense" name="correo" label="Correo Electrónico" type="email" required
            fullWidth variant="outlined" value={currentUser?.correo || ''} onChange={handleChange}
            onBlur={handleBlur} error={!!formErrors.correo} helperText={formErrors.correo} />
          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel>Rol</InputLabel>
            <Select name="rol" label="Rol" value={currentUser?.rol || 'Usuario'} onChange={handleChange}>
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Usuario">Usuario</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="contrasena"
            required
            label={isNewUser ? "Contraseña" : "Nueva Contraseña"}
            type={showPassword ? 'text' : 'password'}
            fullWidth
            variant="outlined"
            value={currentUser?.contrasena || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            error={!!formErrors.contrasena}
            helperText={formErrors.contrasena || (isNewUser ? 'Mínimo 8+ caracteres, una mayúscula, una minúscula, un número y un símbolo (@$!%*?&).'
              : 'Dejar en blanco para no cambiar')}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveUser}
            disabled={Object.values(formErrors).some(Boolean)}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}


