// src/components/CitasConfirmadas.tsx

import { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Button, CircularProgress, Alert, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Divider } from '@mui/material';
import React from 'react';
import CloseIcon from '@mui/icons-material/Close';

// ... (El tipo TrelloCard se queda igual)
type TrelloCard = {
  due: string | number | Date; id: string; name: string; desc: string;
};

export function CitasConfirmadas() {
  const [cards, setCards] = useState<TrelloCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<TrelloCard | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [note, setNote] = useState('');

  const fetchConfirmedCards = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/trello/cards?listNames=Confirmadas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Error al cargar citas confirmadas.');
      setCards(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfirmedCards(); }, []);

  const handleOpenNoteDialog = (card: TrelloCard) => {
    setSelectedCard(card);
    setIsNoteDialogOpen(true);
  };

  const handleCloseNoteDialog = () => {
    setIsNoteDialogOpen(false);
    setNote('');
    setSelectedCard(null);
  };

  const handleMarkAsCompleted = async () => {
    if (!selectedCard) return;
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/trello/move-card/${selectedCard.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ targetList: 'completadas', note: note })
      });
      fetchConfirmedCards();
      handleCloseNoteDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Citas Pendientes de Realización
      </Typography>
      {cards.length > 0 ? (
        <List>
          {cards.map(card => (
            <React.Fragment key={card.id}>
              <ListItem secondaryAction={
                <Button variant="outlined" size="small" onClick={() => handleOpenNoteDialog(card)}>
                  Gestionar
                </Button>
              }>
                <ListItemText primary={card.name} secondary={`Cita para: ${new Date(card.due).toLocaleString()}`} />

              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography>No hay citas confirmadas pendientes.</Typography>
      )}

      <Dialog open={isNoteDialogOpen} onClose={handleCloseNoteDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {selectedCard?.name}
          <Button onClick={handleCloseNoteDialog} size="small" sx={{ minWidth: 0, p: 0 }}>
            <CloseIcon />
          </Button>
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>Descripción:</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontStyle: 'italic', color: 'text.secondary', mb: 2 }}>
            {selectedCard?.desc || "Sin descripción."}
          </Typography>
          <TextField
            autoFocus margin="dense" label="Añadir nota de cierre (opcional)" type="text" fullWidth
            multiline rows={4} variant="outlined" value={note} onChange={(e) => setNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNoteDialog}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={handleMarkAsCompleted}>
            Marcar como Completada
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}