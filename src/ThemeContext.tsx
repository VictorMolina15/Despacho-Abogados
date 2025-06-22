// src/themeContext.tsx
import { createContext, useMemo, useState, useContext, type ReactNode } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

declare module '@mui/material/styles' {
  interface Palette {
    toolbar: Palette['primary']; 
  }

  interface PaletteOptions {
    toolbar?: PaletteOptions['primary']; 
  }
}

// 1. Definir el tipo del contexto
interface ThemeContextType {
  toggleColorMode: () => void;
  mode: 'light' | 'dark';
}

// 2. Crear el contexto
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 3. Crear el proveedor del tema
interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setMode] = useState<'light' | 'dark'>('light'); // Estado para el modo actual

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
      mode, // Exponemos el modo actual también
    }),
    [mode],
  );

  // 4. Crear el tema de Material-UI
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode, // Esto es clave: 'light' o 'dark'
          ...(mode === 'light'
            ? {
              toolbar: {
                main: '#ffffff',
              },
              primary: {
                main: '#1976d2', // Un azul estándar de Material-UI
              },
              secondary: {
                main: '#dc004e',
              },
              background: {
                default: '#f5f5f5', // Un gris claro para el fondo
                paper: '#ffffff', // Blanco para las superficies de Paper
              },
            }
            : {
              toolbar: {
                main: '#283b5d', 
              },
              primary: {
                main: '#90caf9', // Azul claro para el modo oscuro
              },
              secondary: {
                main: '#f48fb1',
              },
              background: {
                default: '#121212', // Un gris muy oscuro
                paper: '#1d1d1d', // Un gris oscuro para las superficies de Paper
              },
            }),
        },
        typography: {
          fontFamily: 'Roboto, sans-serif', // Asegúrate de usar la fuente que importas en index.html
        },
        components: { // <-- Sección para sobrescribir estilos de componentes
          MuiButton: {
            styleOverrides: {
              root: {
                '&.Mui-focusVisible': {
                  outline: 'none', // Asegura que no haya outline al enfocar
                  boxShadow: 'none', // Asegura que no haya box-shadow al enfocar
                },
              },
            },
          },
        },
      }),
    [mode],
  );

  return (
    <ThemeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline /> {/* Aplica estilos CSS base y reinicios que respetan el tema */}
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

// 5. Hook personalizado para usar el contexto del tema
// eslint-disable-next-line react-refresh/only-export-components
export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}