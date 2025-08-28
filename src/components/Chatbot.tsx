// src/components/Chatbot.tsx
import { useEffect, useRef, useState } from 'react';
import { Box, Fab, Paper, TextField, IconButton, Typography, CircularProgress, Chip,useTheme, alpha } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import OpenInNew from '@mui/icons-material/OpenInNew';
import MinimizeIcon from '@mui/icons-material/Remove';

type Message = {
  sender: 'user' | 'bot';
  text: string;
  fileName?: string; 
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme(); 

  // Función para hacer scroll automático al final del chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]); // Se ejecuta cada vez que hay un nuevo mensaje

  const handleSendMessage = async () => {
    const messageText = input.trim();
    if (!messageText && !fileToUpload) return;

    const userMessage: Message = { 
      sender: 'user', 
      text: messageText, 
      fileName: fileToUpload ? fileToUpload.name : undefined 
    };
    
    if (messageText || fileToUpload) {
        setMessages(prev => [...prev, userMessage]);
    }

    setLoading(true);
    setInput('');

    const formData = new FormData();
    formData.append('message', messageText);
    if (fileToUpload) {
      formData.append('file', fileToUpload);
    }

    setFileToUpload(null); // Limpiamos el archivo después de prepararlo

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chatbot/interaction`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error((await response.json()).message || 'Error al conectar con el chatbot.');
      }

      const botResponseData = await response.json();
      const botMessage: Message = { sender: 'bot', text: botResponseData.reply };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      const errorMessageText = error instanceof Error ? error.message : 'Lo siento, no pude procesar tu solicitud.';
      const errorMessage: Message = { sender: 'bot', text: errorMessageText };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isMaximized && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 32, right: 20, zIndex: 1100 }}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <CloseIcon /> : <ChatIcon />}
        </Fab>
      )}
      {isOpen && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            zIndex: 1000,
            transition: 'all 0.3s ease-in-out',
            transformOrigin: 'bottom right',
            ...(isMaximized
              ? { bottom: 0, right: 0, width: '100vw', height: '100vh', borderRadius: 0 }
              : { bottom: 112, right: 20, width: 350, height: 500, borderRadius: '16px' }
            ),
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden' 
          }}
        >
          {/* Cabecera del Chat */}
          <Box sx={{ p: 1, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', background: (theme) => theme.palette.toolbar.main }}>
            <Typography variant="h6" sx={{ flexGrow: 1, ml: 1 }}>
              Asistente Leima Legal
            </Typography>
            <IconButton onClick={() => setIsMaximized(!isMaximized)}>
              {isMaximized ? <MinimizeIcon /> : <OpenInNew />}
            </IconButton>
            {isMaximized && (
              <IconButton onClick={() => { setIsOpen(false); setIsMaximized(false); }}>
                <CloseIcon />
              </IconButton>
            )}
          </Box>
          
          {/* Cuerpo del Chat */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1,
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
            {messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                }}
              >
                <Paper
                  elevation={2}
                  sx={{
                    p: 1.5,
                    borderRadius: msg.sender === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                    bgcolor: msg.sender === 'user' ? 'primary.main' : 'background.paper',
                    color: msg.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                  }}
                >
                  {msg.text && (
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                      {msg.text}
                    </Typography>
                  )}
                    {msg.fileName && (
                    <Chip 
                      label={msg.fileName} 
                      size="small"
                      sx={theme => ({
                      mt: msg.text ? 1 : 0,
                      color: theme.palette.mode === 'dark' ? '#222' : '#fff',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(34,34,34,0.7)':'rgba(255,255,255,0.7)' ,
                      //backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#fff'
                      })}
                      variant="outlined" 
                    />
                    )}
                </Paper>
              </Box>
            ))}
            {loading && (
              <Box sx={{ alignSelf: 'flex-start' }}>
                <CircularProgress size={24} sx={{ m: 1 }} />
              </Box>
            )}
            <div ref={chatEndRef} />
          </Box>

          {/* Pie de página del Chat (Input) */}
          <Box>
            {fileToUpload && (
              <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
                <Chip
                  label={fileToUpload.name}
                  onDelete={() => setFileToUpload(null)}
                  icon={<AttachFileIcon />}
                />
              </Box>
            )}
            <Box sx={{ p: 1, display: 'flex', alignItems: 'center', borderTop: 1, borderColor: 'divider' }}>
              <IconButton color="primary" component="label" disabled={!!fileToUpload}>
                <AttachFileIcon />
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setFileToUpload(e.target.files[0]);
                    }
                  }}
                />
              </IconButton>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribe un mensaje..."
              />
              <IconButton color="primary" onClick={handleSendMessage} disabled={!input.trim() && !fileToUpload}>
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      )}
    </>
  );
}