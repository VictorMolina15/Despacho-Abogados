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
  useTheme,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useThemeContext } from '../ThemeContext';
import { Outlet, useNavigate, useLocation } from 'react-router-dom'; // Outlet para renderizar rutas hijas

export function AppLayout() {
  const { toggleColorMode, mode } = useThemeContext();
  const navigate = useNavigate(); // Hook para la navegación
  const location = useLocation(); // Hook para obtener la ubicación actual
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // Para el menú de usuario
  const theme = useTheme(); 

  // Función para determinar si un enlace está activo
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

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
      <AppBar position="static" elevation={0} color='transparent' sx={{ backgroundColor: theme.palette.toolbar.main }}>
        <Toolbar sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')} // Navegar a la página principal al hacer clic en el título
          >
            <img
              src={mode === 'dark' ? '/assets/Logo(2)_crop.png' : '/assets/Logo(1)_crop.png'}
              alt="Logo"
              style={{ height: '80px', marginTop: '5px' }} // Ajusta el estilo según tus necesidades
            />
          </Typography>
          <Button color={isActive('/') ? 'primary' : 'inherit'} onClick={() => navigate('/')} sx={{ borderRadius:'0', p:'30px 15px',fontSize: '18px',
            borderBottom: isActive('/') ? `2px solid ${theme.palette.primary.main}` : 'none', }} >
            Inicio
          </Button>
          <Button color={isActive('/clientes') ? 'primary' : 'inherit'}  onClick={() => navigate('/clientes')} sx={{ borderRadius:'0', p:'30px 15px',fontSize: '18px',
            borderBottom: isActive('/clientes') ? `2px solid ${theme.palette.primary.main}` : 'none', }} >
            Clientes
          </Button>
          <Button color={isActive('/divorcios') ? 'primary' : 'inherit'} onClick={() => navigate('/divorcios')} sx={{ borderRadius:'0', p:'30px 15px',fontSize: '18px',
            borderBottom: isActive('/divorcios') ? `2px solid ${theme.palette.primary.main}` : 'none', }} >
            Divorcios
          </Button>
          {/* Aquí puedes añadir más botones para otras secciones del Navbar */}

          {/* Botón de Dark/Light Mode */}
          <IconButton sx={{ ml: 1, height:'50px',width:'50px'}} onClick={toggleColorMode} color="inherit">
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
            sx={{
              mt: '45px',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>Mi Cuenta</MenuItem>
            <MenuItem onClick={handleLogout}>Salir</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ p: 1 }}>
        <Outlet /> {/* Aquí se renderizarán las rutas anidadas */}
      </Box>
    </Box>
  );
}