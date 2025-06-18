// src/AppLayout.tsx
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useThemeContext } from '../ThemeContext';
import { Outlet, useNavigate } from 'react-router-dom'; // Outlet para renderizar rutas hijas

export function AppLayout() {
  const { toggleColorMode, mode } = useThemeContext();
  const navigate = useNavigate(); // Hook para la navegación
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // Para el menú de usuario

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // Aquí iría tu lógica para cerrar sesión
    console.log('Cerrar sesión');
    navigate('/login'); // Redirigir al login
    handleClose();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')} // Navegar a la página principal al hacer clic en el título
          >
            <img src="../assets/Logo(1).jpg" alt="Logo" style={{ height: '40px', marginRight: '10px' }} />
          </Typography>

          <Button color="inherit" onClick={() => navigate('/clientes')}>
            Clientes
          </Button>
          <Button color="inherit" onClick={() => navigate('/divorcios')}>
            Divorcios
          </Button>
          {/* Aquí puedes añadir más botones para otras secciones del Navbar */}

          {/* Botón de Dark/Light Mode */}
          <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

          {/* Menú de Usuario */}
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>Mi Cuenta</MenuItem>
            <MenuItem onClick={handleLogout}>Salir</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ p: 3 }}>
        <Outlet /> {/* Aquí se renderizarán las rutas anidadas */}
      </Box>
    </Box>
  );
}