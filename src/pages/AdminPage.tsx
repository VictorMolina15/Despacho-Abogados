// src/pages/AdminPage.tsx
import React, { useState } from 'react';
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Divider,
  Box,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { Usuario } from '../types';

// Simulación de datos de usuarios (en un entorno real, vendrían de una API)
const usuariosSimulados: Usuario[] = [
  {
    id: 'user1',
    nombres: 'Admin',
    apellidos: 'Principal',
    telefono: '555-0001',
    correo: 'superadmin@example.com',
    rol: 'SuperAdmin',
    fechaRegistro: new Date('2023-01-01'),
  },
  {
    id: 'user2',
    nombres: 'Juan',
    apellidos: 'Pérez',
    telefono: '555-0002',
    correo: 'juan.perez@example.com',
    rol: 'Admin',
    fechaRegistro: new Date('2023-02-10'),
  },
  {
    id: 'user3',
    nombres: 'María',
    apellidos: 'González',
    telefono: '555-0003',
    correo: 'maria.gonzalez@example.com',
    rol: 'Usuario',
    fechaRegistro: new Date('2023-03-05'),
  },
];

export function AdminPage() {
  const [users, setUsers] = useState<Usuario[]>(usuariosSimulados);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  const filteredUsers = users.filter((user) =>
    user.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.correo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddDialog = () => {
    setIsNewUser(true);
    setCurrentUser({
      id: '', // Se generaría en el backend
      nombres: '',
      apellidos: '',
      telefono: '',
      correo: '',
      rol: 'Usuario', // Rol por defecto
      fechaRegistro: new Date(),
    });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (user: Usuario) => {
    setIsNewUser(false);
    setCurrentUser({ ...user });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentUser(null);
  };

   const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string> // Añade SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    setCurrentUser((prevUser) => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        [name as string]: value, // TypeScript inferirá el tipo correcto si 'name' es de tipo string
      };
    });
  };

  const handleSaveUser = () => {
    if (currentUser) {
      if (isNewUser) {
        // Lógica para añadir un nuevo usuario (enviar a la API)
        console.log('Añadir nuevo usuario:', currentUser);
        // Simulación de adición:
        setUsers([...users, { ...currentUser, id: `user${users.length + 1}` }]);
      } else {
        // Lógica para actualizar un usuario existente (enviar a la API)
        console.log('Actualizar usuario:', currentUser);
        setUsers(users.map((user) => (user.id === currentUser.id ? currentUser : user)));
      }
      handleCloseDialog();
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      // Lógica para eliminar usuario (enviar a la API)
      console.log('Eliminar usuario con ID:', userId);
      setUsers(users.filter((user) => user.id !== userId));
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" sx={{ my: 4 }}>
        Gestión de Usuarios
      </Typography>

      <TextField
        fullWidth
        label="Buscar Usuario por Nombre, Apellido o Correo"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleOpenAddDialog}
        sx={{ mb: 3 }}
      >
        Añadir Nuevo Usuario
      </Button>

      <Paper elevation={3}>
        <List>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <React.Fragment key={user.id}>
                <ListItem
                  secondaryAction={
                    <Box>
                      <IconButton edge="end" aria-label="edit" onClick={() => handleOpenEditDialog(user)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteUser(user.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <AccountCircleIcon sx={{ mr: 2 }} />
                  <ListItemText
                    primary={
                      <>
                        {user.nombres} {user.apellidos}{' '}
                        <b>({user.rol})</b>
                      </>
                    }
                    secondary={`Correo: ${user.correo} | Teléfono: ${user.telefono || 'N/A'} | Registrado: ${user.fechaRegistro.toLocaleDateString()}`}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))
          ) : (
            <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
              No se encontraron usuarios.
            </Typography>
          )}
        </List>
      </Paper>

      {/* Dialogo para Añadir/Editar Usuario */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{isNewUser ? 'Añadir Nuevo Usuario' : 'Editar Usuario'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="nombres"
            label="Nombres"
            type="text"
            fullWidth
            variant="outlined"
            value={currentUser?.nombres || ''}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="apellidos"
            label="Apellidos"
            type="text"
            fullWidth
            variant="outlined"
            value={currentUser?.apellidos || ''}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="telefono"
            label="Teléfono"
            type="text"
            fullWidth
            variant="outlined"
            value={currentUser?.telefono || ''}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="correo"
            label="Correo Electrónico"
            type="email"
            fullWidth
            variant="outlined"
            value={currentUser?.correo || ''}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel id="rol-label">Rol</InputLabel>
            <Select
              labelId="rol-label"
              id="rol"
              name="rol"
              value={currentUser?.rol || 'Usuario'}
              label="Rol"
              onChange={handleChange}
            >
              <MenuItem value="SuperAdmin">SuperAdmin</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Usuario">Usuario</MenuItem>
            </Select>
          </FormControl>
          {isNewUser && (
            <TextField
              margin="dense"
              name="contrasena_hash" // En una aplicación real, esto se manejaría con un campo de contraseña y luego se hashearía
              label="Contraseña"
              type="password"
              fullWidth
              variant="outlined"
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleSaveUser} color="primary" variant="contained">
            {isNewUser ? 'Añadir' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}