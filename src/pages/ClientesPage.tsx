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
  Pagination,
  Box,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

// Importa las interfaces de tus tipos
import type { Cliente } from '../types';
import React, { useState, useEffect } from 'react';

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
  {
    id: '4',
    nombreCompleto: 'Luis Alberto Hernández Díaz',
    telefono: '555-4444',
    correo: 'luis.hernandez@example.com',
    fechaCreacion: new Date('2023-05-12'),
  },
  {
    id: '5',
    nombreCompleto: 'Ana Gabriela Morales Vega',
    telefono: '555-5555',
    correo: 'ana.morales@example.com',
    fechaCreacion: new Date('2023-05-14'),
  },
  {
    id: '6',
    nombreCompleto: 'Ricardo Pérez Jiménez',
    telefono: '555-6666',
    correo: 'ricardo.perez@example.com',
    fechaCreacion: new Date('2023-05-16'),
  },
  {
    id: '7',
    nombreCompleto: 'Valeria Torres Sánchez',
    telefono: '555-7777',
    correo: 'valeria.torres@example.com',
    fechaCreacion: new Date('2023-05-18'),
  },
  {
    id: '8',
    nombreCompleto: 'Miguel Ángel Vargas Soto',
    telefono: '555-8888',
    correo: 'miguel.vargas@example.com',
    fechaCreacion: new Date('2023-05-20'),
  },
  {
    id: '9',
    nombreCompleto: 'Paola Martínez Ríos',
    telefono: '555-9999',
    correo: 'paola.martinez@example.com',
    fechaCreacion: new Date('2023-05-22'),
  },
  {
    id: '10',
    nombreCompleto: 'Diego Alejandro Cruz León',
    telefono: '555-1010',
    correo: 'diego.cruz@example.com',
    fechaCreacion: new Date('2023-05-24'),
  },
  {
    id: '11',
    nombreCompleto: 'Camila Herrera Ponce',
    telefono: '555-1212',
    correo: 'camila.herrera@example.com',
    fechaCreacion: new Date('2023-05-26'),
  },
  {
    id: '12',
    nombreCompleto: 'Emilio Navarro Salas',
    telefono: '555-1313',
    correo: 'emilio.navarro@example.com',
    fechaCreacion: new Date('2023-05-28'),
  },
  {
    id: '13',
    nombreCompleto: 'Jose Emiliano Loyola Garza',
    telefono: '555-1313',
    correo: 'jose.loyola@example.com',
    fechaCreacion: new Date('2023-05-28'),
  },
  {
    id: '14',
    nombreCompleto: 'Victor Hugo Molina Ruiz',
    telefono: '555-1313',
    correo: 'victor.molina@example.com',
    fechaCreacion: new Date('2023-05-28'),
  },
];

export function ClientesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]); // Estado para los clientes cargados
  const [currentPage, setCurrentPage] = useState(1); // Estado para la página actual
  const [pageSize] = useState(10); // Cantidad de elementos por página
  const [totalItems, setTotalItems] = useState(0); // Total de clientes que coinciden con la búsqueda
  const [loading, setLoading] = useState(false); // Estado de carga

  // Función para cargar los clientes desde la API
  const fetchClientes = async (page: number, term: string) => {
    setLoading(true);
    try {

      // Simula la búsqueda y paginación usando clientesSimulados en lugar de fetch (cambiar esto por tu llamada a la API real)
      const filtered = clientesSimulados.filter((c) =>
        c.nombreCompleto.toLowerCase().includes(term.toLowerCase()) ||
        c.telefono.toLowerCase().includes(term.toLowerCase()) ||
        c.correo.toLowerCase().includes(term.toLowerCase())
      );
      const totalCount = filtered.length;
      const start = (page - 1) * pageSize;
      const paginated = filtered.slice(start, start + pageSize);
      const data = {
        data: paginated,
        totalCount,
        currentPage: page,
      };

      setClientes(data.data.map((c: Cliente) => ({ // Mapea los datos de la API a tu tipo Cliente
        ...c,
        fechaCreacion: new Date(c.fechaCreacion), // Asegúrate de convertir la fecha si viene como string
      })));
      setTotalItems(data.totalCount);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      // Manejar el error, quizás mostrar un mensaje al usuario
    } finally {
      setLoading(false);
    }
  };

  // Cargar clientes al montar el componente o cuando cambie la página/término de búsqueda
  useEffect(() => {
    fetchClientes(currentPage, searchTerm);
  }, [currentPage, searchTerm, pageSize]); // Dependencias del efecto

  const handleClienteClick = (clienteId: string) => {
    navigate(`/clientes/${clienteId}`);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  // Cálculo del total de páginas
  const totalPages = Math.ceil(totalItems / pageSize);

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

      {loading ? (
        <Typography sx={{ textAlign: 'center', mt: 3 }}>Cargando clientes...</Typography>
      ) : (
        <>
          <List>
            {clientes.length > 0 ? (
              clientes.map((cliente) => (
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
          {totalPages > 1 && ( // Mostrar paginación solo si hay más de una página
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}