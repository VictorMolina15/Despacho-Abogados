// src/AppLayout.tsx
import React, { useEffect, useState } from 'react';
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
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import { useThemeContext } from '../ThemeContext';
import { Outlet, useNavigate, useLocation, useMatch } from 'react-router-dom'; // Outlet para renderizar rutas hijas
import { decodeJwt } from '../utils/auth';
import { VisibilityOff, Visibility } from '@mui/icons-material';
import { Chatbot } from './Chatbot';

type UserRole = 'SuperAdmin' | 'Admin' | 'Usuario';
type UserProfileData = { nombres: string; apellidos: string; telefono: string; correo: string; contrasena: string; };

type FormErrors = {
  nombres?: string;
  apellidos?: string;
  correo?: string;
  telefono?: string;
  contrasena?: string;
};


export function AppLayout() {
  const { toggleColorMode, mode } = useThemeContext();
  const navigate = useNavigate(); // Hook para la navegación
  const location = useLocation(); // Hook para obtener la ubicación actual
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // Para el menú de usuario
  const theme = useTheme();

  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<UserProfileData>({
    nombres: '', apellidos: '', telefono: '', correo: '', contrasena: '',
  });

  // --- LÓGICA PARA RESPONSIVIDAD ---
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // DETECTAR SI ES MÓVIL
 
  // --- FIN LÓGICA RESPONSIVIDAD ---

  // --- MANEJADORES PARA LOS MENÚS ---
  const [navMenuAnchorEl, setNavMenuAnchorEl] = useState<null | HTMLElement>(null); 

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => { 
    setNavMenuAnchorEl(event.currentTarget);
  };
  const handleCloseNavMenu = () => { 
    setNavMenuAnchorEl(null);
  };


  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = token ? decodeJwt(token) : null;
    setCurrentUserRole(userData?.rol || null);
  }, []);

  // Función para determinar si un enlace está activo
  const isClientesActive = useMatch('/clientes/*');
  const isActive = (path: string) => location.pathname === path;
  const isCitasActive = useMatch('/citas/*');

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Eliminar el token de autenticación
    console.log('Cerrar sesión');
    navigate('/login'); // Redirigir al login
    handleClose();
  };

  // --- Lógica del Modal (ahora centralizada aquí) ---
  const handleOpenModal = async () => {
    handleClose();
    setIsModalOpen(true);
    setModalLoading(true);
    setModalError(null);
    const token = localStorage.getItem('authToken');
    const decoded = token ? decodeJwt(token) : null;
    if (!token || !decoded) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/usuarios/${decoded.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (!response.ok) throw new Error('No se pudo cargar tu perfil.');
      const data = await response.json();
      setProfileData({ ...data, contrasena: '' });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setModalError(error.message);
      } else {
        setModalError('Error desconocido');
      }
    } finally {
      setModalLoading(false);
    }
  };

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'nombres':
      case 'apellidos': {
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/;
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormErrors({});
    setShowPassword(false);
  }
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleProfileSave = async () => {
    // Re-validamos todos los campos del formulario actual antes de intentar guardar.
    const validationErrors: FormErrors = {};
    if (currentUserRole !== 'SuperAdmin') {
      validationErrors.telefono = validateField('telefono', profileData.telefono);
    }
    validationErrors.correo = validateField('correo', profileData.correo);

    // Para la contraseña, solo validamos si se ha escrito algo.
    if (profileData.contrasena.length > 0) {
      validationErrors.contrasena = validateField('contrasena', profileData.contrasena);
    }

    // Filtramos los errores que no son undefined
    const finalErrors = Object.entries(validationErrors).reduce((acc, [key, value]) => {
      if (value) acc[key as keyof FormErrors] = value;
      return acc;
    }, {} as FormErrors);

    // Si después de validar hay algún error, actualizamos el estado y detenemos la ejecución.
    if (Object.keys(finalErrors).length > 0) {
      setFormErrors(finalErrors);
      setModalError("Por favor, llene correctamente el formulario.");
      return;
    }

    setModalLoading(true);
    setModalError(null);

    const token = localStorage.getItem('authToken');
    const decoded = token ? decodeJwt(token) : null;
    if (!token || !decoded) return;

    const updatePayload: Partial<UserProfileData> = {
      nombres: profileData.nombres,
      apellidos: profileData.apellidos,
      telefono: profileData.telefono,
      correo: profileData.correo,
    };

    if (profileData.contrasena.trim() !== '') {
      updatePayload.contrasena = profileData.contrasena;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/usuarios/${decoded.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(updatePayload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al guardar.');

      // --- 3. MANEJO DE ESTADO PARA EVITAR PARPADEO ---
      // Si todo fue exitoso, cerramos el modal. No necesitamos tocar el `modalLoading`.
      handleCloseModal();

    } catch (error: unknown) {
      if (error instanceof Error) {
        setModalError(error.message);
      } else {
        setModalError('Error desconocido.');
      }
      // Solo si hay un error, detenemos el spinner para que el usuario pueda ver el mensaje.
      setModalLoading(false);
    }
    // Se elimina el `finally` para tener un control más preciso del estado de carga.
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

          {/* === RENDERIZADO CONDICIONAL DE PESTAÑAS === */}
          {!isMobile && currentUserRole !== 'SuperAdmin' && (
            <>
              <Button color={isActive('/') ? 'primary' : 'inherit'} onClick={() => navigate('/')} sx={{
                borderRadius: '0', p: '30px 15px', fontSize: '18px',
                borderBottom: isActive('/') ? `2px solid ${theme.palette.primary.main}` : 'none',
              }} >
                Inicio
              </Button>
              <Button color={isClientesActive ? 'primary' : 'inherit'} onClick={() => navigate('/clientes')} sx={{
                borderRadius: '0', p: '30px 15px', fontSize: '18px',
                borderBottom: isClientesActive ? `2px solid ${theme.palette.primary.main}` : 'none',
              }} >
                Clientes
              </Button>
              <Button
                color={isCitasActive ? 'primary' : 'inherit'} onClick={() => navigate('/citas')} sx={{
                  borderRadius: '0', p: '30px 15px', fontSize: '18px',
                  borderBottom: isCitasActive ? `2px solid ${theme.palette.primary.main}` : 'none',
                }}
              >
                Citas
              </Button>
              <Button color={isActive('/divorcios') ? 'primary' : 'inherit'} onClick={() => navigate('/divorcios')} sx={{
                borderRadius: '0', p: '30px 15px', fontSize: '18px',
                borderBottom: isActive('/divorcios') ? `2px solid ${theme.palette.primary.main}` : 'none',
              }} >
                Divorcios
              </Button>
            </>
          )}
          {/* Aquí puedes añadir más botones para otras secciones del Navbar */}

          {/* Botón de Dark/Light Mode */}
          <IconButton sx={{ ml: 1, height: '50px', width: '50px' }} onClick={toggleColorMode} color="inherit">
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
            <MenuItem onClick={handleOpenModal}>Mi Cuenta</MenuItem>
            <MenuItem onClick={handleLogout}>Salir</MenuItem>
          </Menu>

          {/* MENÚ PARA MÓVIL (ICONOS A LA DERECHA) */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* ÍCONO DE MENÚ HAMBURGUESA A LA DERECHA, SOLO EN MÓVIL */}
            {isMobile && currentUserRole !== 'SuperAdmin' && (
              <IconButton size="large" aria-label="navigation menu" onClick={handleOpenNavMenu} color="inherit">
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* --- MENÚS DESPLEGABLES --- */}

      {/* MENÚ DE NAVEGACIÓN MÓVIL */}
      <Menu
        id="menu-nav"
        anchorEl={navMenuAnchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        keepMounted
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={Boolean(navMenuAnchorEl)}
        onClose={handleCloseNavMenu}
      >
        <MenuItem onClick={() => { navigate('/'); handleCloseNavMenu(); }}>Inicio</MenuItem>
        <MenuItem onClick={() => { navigate('/clientes'); handleCloseNavMenu(); }}>Clientes</MenuItem>
        <MenuItem onClick={() => { navigate('/citas'); handleCloseNavMenu(); }}>Citas</MenuItem>
        <MenuItem onClick={() => { navigate('/divorcios'); handleCloseNavMenu(); }}>Divorcios</MenuItem>
      </Menu>


      <Box component="main" sx={{ p: 1 }}>
        <Outlet /> {/* Aquí se renderizarán las rutas anidadas */}
      </Box>
      <Chatbot />

      <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Perfil</DialogTitle>
        <DialogContent>
          {modalLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box component="form" noValidate>
              {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}
              {currentUserRole === 'SuperAdmin' ? (
                <>
                  <TextField
                    name="correo"
                    label="Correo Electrónico"
                    type="email"
                    value={profileData.correo}
                    onChange={handleProfileChange}
                    onBlur={handleBlur}
                    error={!!formErrors.correo}
                    helperText={formErrors.correo}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    name="contrasena"
                    label="Nueva Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    value={profileData.contrasena}
                    onChange={handleProfileChange}
                    onBlur={handleBlur}
                    fullWidth
                    margin="normal"
                    error={!!formErrors.contrasena}
                    helperText={formErrors.contrasena || "Dejar en blanco para no cambiar."}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            onMouseDown={(event) => event.preventDefault()}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </>
              ) : (
                <>
                  <TextField
                    name="nombres"
                    label="Nombres"
                    value={profileData.nombres}
                    onChange={handleProfileChange}
                    onBlur={handleBlur}
                    error={!!formErrors.nombres}
                    helperText={formErrors.nombres}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    name="apellidos"
                    label="Apellidos"
                    value={profileData.apellidos}
                    onChange={handleProfileChange}
                    onBlur={handleBlur}
                    error={!!formErrors.apellidos}
                    helperText={formErrors.apellidos}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    name="telefono"
                    label="Teléfono"
                    value={profileData.telefono}
                    onChange={handleProfileChange}
                    onBlur={handleBlur}
                    error={!!formErrors.telefono}
                    helperText={formErrors.telefono}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    name="correo"
                    label="Correo Electrónico"
                    type="email"
                    value={profileData.correo}
                    onChange={handleProfileChange}
                    onBlur={handleBlur}
                    error={!!formErrors.correo}
                    helperText={formErrors.correo}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    name="contrasena"
                    label="Nueva Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    value={profileData.contrasena}
                    onChange={handleProfileChange}
                    onBlur={handleBlur}
                    fullWidth
                    margin="normal"
                    error={!!formErrors.contrasena}
                    helperText={formErrors.contrasena || "Dejar en blanco para no cambiar."}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            onMouseDown={(event) => event.preventDefault()}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleProfileSave}
            disabled={
              Object.values(formErrors).some(Boolean) ||
              modalLoading
            }
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}