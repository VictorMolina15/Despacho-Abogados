// src/components/CitasManagement.tsx

import { useState, useEffect } from 'react';
import {
  Box, Typography, List, ListItem, ListItemText, Button, CircularProgress, Divider,
  DialogTitle, DialogContent, DialogActions, Alert, Paper, Dialog, useTheme, alpha,
  TextField
} from '@mui/material';
import React from 'react';
import CloseIcon from '@mui/icons-material/Close';

type TrelloCard = {
  id: string;
  name: string;
  desc: string;
};

export function CitasManagement() {
  const [cards, setCards] = useState<TrelloCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  // Estados para el Dialog
  const [selectedCard, setSelectedCard] = useState<TrelloCard | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Estados para el nuevo Dialog de Notas
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [note, setNote] = useState('');
  const [actionTarget, setActionTarget] = useState<'confirmadas' | 'canceladas' | null>(null);


  const fetchCards = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const listNames = 'Nuevas solicitudes';
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/trello/cards?listNames=${listNames}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Error al cargar las citas.');
      const data = await response.json();
      setCards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleOpenDetailsDialog = (card: TrelloCard) => {
    setSelectedCard(card);
    setIsDetailsDialogOpen(true);
  };
  const handleCloseDetailsDialog = () => setIsDetailsDialogOpen(false);


  // Abre el dialog para añadir una nota
  const handleOpenNoteDialog = (action: 'confirmadas' | 'canceladas') => {
    setActionTarget(action); // Guardamos la acción que se va a realizar
    setIsNoteDialogOpen(true);
    setIsDetailsDialogOpen(false); // Cerramos el dialog de detalles
  };

  const handleCloseNoteDialog = () => {
    setIsNoteDialogOpen(false);
    setNote('');
    setActionTarget(null);
    setSelectedCard(null); // Limpiamos la tarjeta seleccionada
  };

  const handleConfirmActionWithNote = async () => {
    if (!selectedCard || !actionTarget) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/trello/move-card/${selectedCard.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ targetList: actionTarget, note: note }) // Enviamos la nota al backend
      });
      if (!response.ok) throw new Error('No se pudo actualizar el estado de la cita.');

      fetchCards(); // Refresca la lista de pendientes
      handleCloseNoteDialog(); // Cierra el dialog de notas

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Nuevas Solicitudes de Cita
      </Typography>
      {cards.length > 0 ? (
        <List sx={{
          maxHeight: '16rem', overflow: 'auto',
          scrollbarWidth: 'thin', // Para Firefox
          scrollbarColor: `${theme.palette.grey[400]} ${alpha(theme.palette.background.default, 0.5)}`, // Para Firefox
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: alpha(theme.palette.grey[400], 0.1),
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.grey[400],
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: theme.palette.grey[500],
          }
        }}>
          {cards.map(card => (
            <React.Fragment>
              <ListItem
                key={card.id}
                secondaryAction={
                  <Button variant="outlined" size="small" onClick={() => handleOpenDetailsDialog(card)}>
                    Ver Detalles
                  </Button>
                }
              >

                <ListItemText primary={card.name} />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography>No hay nuevas solicitudes de cita pendientes.</Typography>
      )}
      {/* Dialog para VER DETALLES */}
      <Dialog open={isDetailsDialogOpen} onClose={handleCloseDetailsDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {selectedCard?.name}
          <Button onClick={handleCloseDetailsDialog} size="small" sx={{ minWidth: 0, p: 0 }}>
            <CloseIcon />
          </Button>
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>Descripción Original:</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontStyle: 'italic', color: 'text.secondary' }}>
            {selectedCard?.desc || "Esta cita no tiene una descripción detallada."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => handleOpenNoteDialog('canceladas')}>
            Cancelar Cita
          </Button>
          <Button color="success" onClick={() => handleOpenNoteDialog('confirmadas')}>
            Confirmar Cita
          </Button>
        </DialogActions>
      </Dialog>
      {/* Dialog para AÑADIR NOTA */}
      <Dialog open={isNoteDialogOpen} onClose={handleCloseNoteDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Añadir Nota a "{selectedCard?.name}"
          <Button onClick={handleCloseDetailsDialog} size="small" sx={{ minWidth: 0, p: 0 }}>
            <CloseIcon />
          </Button>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nota (opcional)"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNoteDialog}>Cerrar</Button>
          <Button
            variant="contained"
            onClick={handleConfirmActionWithNote}
            color={actionTarget === 'confirmadas' ? 'success' : 'error'}
          >
            {actionTarget === 'confirmadas' ? 'Confirmar y Guardar Nota' : 'Cancelar y Guardar Nota'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}