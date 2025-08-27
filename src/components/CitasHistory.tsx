// src/components/CitasHistory.tsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Pagination,
  debounce,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale';
import CloseIcon from '@mui/icons-material/Close';

type TrelloCard = {
  id: string;
  name: string;
  desc: string;
  due: string | null;
  listName: string;
};

const PAGE_SIZE = 10;

export function CitasHistory() {
  const [allCards, setAllCards] = useState<TrelloCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<TrelloCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de los filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCard, setSelectedCard] = useState<TrelloCard | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchHistory = async (search: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');

      const listNames = 'Confirmadas,Canceladas,Completadas';
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/trello/cards?listNames=${listNames}&searchTerm=${search}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Error al cargar el historial.');
      const data = await response.json();
      setAllCards(data);
      setFilteredCards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useMemo(() => debounce(fetchHistory, 500), []);

  useEffect(() => {
    debouncedFetch(searchTerm);
  }, [searchTerm, debouncedFetch]);

  // Lógica de filtrado
  useEffect(() => {
    let result = allCards;

    if (searchTerm) {
      result = result.filter(card => card.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (statusFilter !== 'all') {
      result = result.filter(card => card.listName === statusFilter);
    }
    if (startDate) {
      result = result.filter(card => card.due && new Date(card.due) >= startDate);
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      result = result.filter(card => card.due && new Date(card.due) <= endOfDay);
    }

    setFilteredCards(result);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, startDate, endDate, allCards]);


  const handleOpenDialog = (card: TrelloCard) => {
    setSelectedCard(card);
    setIsDialogOpen(true);
  };


  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const paginatedCards = filteredCards.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalPages = Math.ceil(filteredCards.length / PAGE_SIZE);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Grid container spacing={2} sx={{ mb: 2 }} alignItems="center" wrap="nowrap">
          <Grid sx={{ xs: 12, md: 6, width: '35%' }}>
            <TextField fullWidth label="Buscar por nombre..." variant="outlined" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </Grid>
          <Grid sx={{ xs: 12, sm: 6, md: 2, width: '18%' }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select value={statusFilter} label="Estado" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="Completadas">Completadas</MenuItem>
                <MenuItem value="Confirmadas">Confirmadas</MenuItem>
                <MenuItem value="Canceladas">Canceladas</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid sx={{ xs: 12, sm: 6, md: 2, width: '21%' }}>
            <DatePicker label="Desde" value={startDate} onChange={setStartDate} slotProps={{ textField: { fullWidth: true } }} />
          </Grid>
          <Grid sx={{ xs: 12, sm: 6, md: 2, width: '21%' }}>
            <DatePicker label="Hasta" value={endDate} onChange={setEndDate} slotProps={{ textField: { fullWidth: true } }} />
          </Grid>
        </Grid>
        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '60%' }}>Nombre de la Cita</TableCell>
                    <TableCell sx={{ width: '20%' }}>Fecha</TableCell>
                    <TableCell sx={{ width: '20%' }}>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCards.map((card) => (
                    <TableRow key={card.id} sx={{ cursor: 'pointer' }} onClick={() => handleOpenDialog(card)} hover>
                      <TableCell
                        sx={{
                          width: '60%',
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {card.name}
                      </TableCell>
                      <TableCell sx={{ width: '20%' }}>{card.due ? new Date(card.due).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell sx={{ width: '20%' }}>
                        <Chip
                          label={card.listName.slice(0, -1)}
                          color={
                            card.listName.toLowerCase().includes('completada') ? 'success' :
                              card.listName.toLowerCase().includes('cancelada') ? 'error' : 'info'
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} />
              </Box>
            )}
          </>
        )}
        <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {selectedCard?.name}
            <Button onClick={() => setIsDialogOpen(false)} size="small" sx={{ minWidth: 0, p: 0 }}>
              <CloseIcon />
            </Button>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedCard?.desc || "Sin descripción."}</Typography>
          </DialogContent>
          <DialogActions><Button onClick={() => setIsDialogOpen(false)}>Cerrar</Button></DialogActions>
        </Dialog>
      </Paper>
    </LocalizationProvider>
  );
}