// src/pages/ClienteDetailPage.tsx (Versión Final y Completa)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Paper, List, ListItemText,
  Divider, Container, IconButton, CircularProgress, Alert,
  Dialog, DialogActions, DialogContent, DialogTitle, Autocomplete, Chip,
  ListItemButton,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import type { Cliente, Documento, Expediente } from '../types';

// Tipos de datos para los formularios
type ClientFormData = { nombres: string; apellidos: string; telefono: string; correo: string; };
type ClientFormErrors = Partial<ClientFormData>;
type ExpedienteFormErrors = { tipo?: string; numero_expediente?: string; estado?: string; };
type PreviewableFile = File | Documento;

export function ClienteDetailPage() {
  const { clienteId } = useParams<{ clienteId: string }>();
  const navigate = useNavigate();

  // Estados generales del componente
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Estados para la edición del cliente
  const [isEditing, setIsEditing] = useState(false);
  const [editedCliente, setEditedCliente] = useState<ClientFormData | null>(null);

  // Estados para la gestión de expedientes
  const [expedientesDelCliente, setExpedientesDelCliente] = useState<Expediente[]>([]);
  const [openExpedienteDialog, setOpenExpedienteDialog] = useState(false);
  const [isNewExpediente, setIsNewExpediente] = useState(false);
  const [currentExpediente, setCurrentExpediente] = useState<Partial<Expediente> | null>(null);
  const [expedienteFormErrors, setExpedienteFormErrors] = useState<ExpedienteFormErrors>({});
  const [tiposExpediente, setTiposExpediente] = useState<string[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);

  // Estados para el diálogo de previsualización 
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fileToPreview, setFileToPreview] = useState<PreviewableFile | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewDownloadUrl, setPreviewDownloadUrl] = useState<string | null>(null);

  // --- Carga de Datos ---
  const fetchClienteData = async () => {
    if (!clienteId) return;
    setLoading(true);
    setApiError(null);
    try {
      const token = localStorage.getItem('authToken');
      const [clienteRes, expedientesRes, tiposRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/clientes/${clienteId}`, { headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' } }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/clientes/${clienteId}/expedientes`, { headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' } }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tipos-expediente`, { headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' } })
      ]);

      if (!clienteRes.ok) throw new Error('No se pudo cargar la información del cliente.');
      if (!expedientesRes.ok) throw new Error('No se pudieron cargar los expedientes.');
      if (!tiposRes.ok) throw new Error('No se pudieron cargar los tipos de expediente.');

      const clienteData = await clienteRes.json();
      const expedientesData = await expedientesRes.json();
      const tiposData = await tiposRes.json();

      setCliente({ ...clienteData, fechaCreacion: new Date(clienteData.fecha_creacion), nombreCompleto: `${clienteData.nombres} ${clienteData.apellidos}` });
      setEditedCliente({ nombres: clienteData.nombres, apellidos: clienteData.apellidos, telefono: clienteData.telefono, correo: clienteData.correo });
      setExpedientesDelCliente(expedientesData);
      setTiposExpediente(tiposData.map((t: { id: number, nombre: string }) => t.nombre));

    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClienteData();

  }, [clienteId]);// eslint-disable-line react-hooks/exhaustive-deps

  // --- Lógica de Validación ---
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'nombres':
      case 'apellidos': {
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/;
        if (!value) return 'Este campo es requerido.';
        return nameRegex.test(value) ? undefined : 'Solo se permiten letras y espacios.';
      }
      case 'correo': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) return 'El correo es requerido.';
        return emailRegex.test(value) ? undefined : 'Introduce un correo válido.';
      }
      case 'telefono': {
        const phoneRegex = /^[0-9]{10}$/;
        if (!value) return 'El teléfono es requerido.';
        return phoneRegex.test(value) ? undefined : 'El teléfono debe tener 10 números.';
      }
      default:
        return undefined;
    }
  };


  const validateExpediente = (): boolean => {
    if (!currentExpediente) return false;
    const errors: ExpedienteFormErrors = {};
    if (!currentExpediente.tipo?.trim()) errors.tipo = "El tipo es requerido.";
    if (!currentExpediente.numero_expediente?.trim()) errors.numero_expediente = "El número de expediente es requerido.";
    if (!currentExpediente.estado?.trim()) errors.estado = "El estado es requerido.";
    setExpedienteFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- Manejadores de Eventos ---
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const error = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: error }));

  };

  // Estados para errores del formulario de cliente
  const [formErrors, setFormErrors] = useState<ClientFormErrors>({});

  // Alternar modo edición y limpiar errores si se cancela
  const handleEditToggle = () => {
    if (isEditing && cliente) {
      setEditedCliente({
        nombres: cliente.nombres ?? '',
        apellidos: cliente.apellidos ?? '',
        telefono: cliente.telefono ?? '',
        correo: cliente.correo ?? ''
      });
      setFormErrors({});
    }
    setIsEditing(!isEditing);
  };

  // Actualizar campos del formulario y limpiar error individual
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedCliente(prev => (prev ? { ...prev, [name]: value } : null));
    if (formErrors[name as keyof ClientFormData]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Guardar cambios del cliente con validación
  const handleSave = async () => {
    if (!editedCliente) return;

    // Validar todos los campos antes de guardar
    const errors: ClientFormErrors = {};
    (Object.keys(editedCliente) as Array<keyof ClientFormData>).forEach(key => {
      const error = validateField(key, editedCliente[key] || '');
      if (error) errors[key] = error;
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/clientes/${clienteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(editedCliente)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar los cambios.");
      }
      setCliente(prev => prev ? { ...prev, ...editedCliente, nombreCompleto: `${editedCliente.nombres} ${editedCliente.apellidos}` } : null);
      setIsEditing(false);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  // manejadores de eventos para editar expedientes
  const handleOpenAddExpediente = () => {
    setIsNewExpediente(true);
    setCurrentExpediente({ tipo: '', numero_expediente: '', estado: 'En Trámite', descripcion: '', documentos: [] });
    setFilesToUpload([]);
    setExpedienteFormErrors({});
    setOpenExpedienteDialog(true);
  };

  const handleOpenEditExpediente = (exp: Expediente) => {
    setIsNewExpediente(false);
    setCurrentExpediente(exp);
    setFilesToUpload([]);
    setExpedienteFormErrors({});
    setOpenExpedienteDialog(true);
  };

  const handleCloseExpedienteDialog = () => {
    if (formLoading) return;
    setOpenExpedienteDialog(false);
    setCurrentExpediente(null);
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const selectedFiles = Array.from(event.target.files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // --- Límites y tipos permitidos ---
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    const ALLOWED_TYPES = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    selectedFiles.forEach(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`El archivo "${file.name}" tiene un formato no permitido. Solo se aceptan PDF, Word y TXT.`);
      } else if (file.size > MAX_SIZE) {
        errors.push(`El archivo "${file.name}" supera el límite de 2MB.`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      alert(errors.join('\n')); // Muestra todos los errores encontrados
    }

    setFilesToUpload(prev => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setFilesToUpload(prev => prev.filter(file => file !== fileToRemove));
  };

  const handleOpenPreview = async (file: PreviewableFile) => {
    setFileToPreview(file);
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewContent(null);
    setPreviewDownloadUrl(null);
    setApiError(null);

    try {
      const fileName = ('name' in file) ? file.name : file.nombre_original as string;
      const isTxt = fileName.toLowerCase().endsWith('.txt');
      const isPdf = fileName.toLowerCase().endsWith('.pdf');

      // Caso 1: Es un documento existente en el bucket
      if ('storage_key' in file && file.storage_key) {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documentos/generate-download-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({ fileKey: file.storage_key })
        });
        if (!response.ok) throw new Error('No se pudo obtener la URL de visualización.');
        const { downloadURL } = await response.json();

        setPreviewDownloadUrl(downloadURL); // Guardamos la URL para el botón de descarga

        if (isTxt) {
          const txtResponse = await fetch(downloadURL);
          setPreviewContent(await txtResponse.text());
        } else if (isPdf) {
          setPreviewContent(downloadURL); // Para el iframe, usamos la misma URL
        }

        // Caso 2: Es un archivo nuevo (File)
      } else if (file instanceof File) {
        const objectUrl = URL.createObjectURL(file);
        setPreviewDownloadUrl(objectUrl); // La URL del objeto sirve para descargar

        if (file.type === 'application/pdf') {
          setPreviewContent(objectUrl);
        } else if (file.type === 'text/plain') {
          setPreviewContent(await file.text());
        }
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Error al cargar la previsualización.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewContent && previewContent.startsWith('blob:')) {
      URL.revokeObjectURL(previewContent);
    }
    setPreviewOpen(false);
    setFileToPreview(null);
    setPreviewContent(null);
    setPreviewDownloadUrl(null);
  };

  const handleSaveExpediente = async () => {
    if (!validateExpediente() || !clienteId || !currentExpediente) return;
    setFormLoading(true);
    setApiError(null);

    try {
      const uploadedDocumentKeys: { nombre_original: string; storage_key: string; }[] = [];
      const token = localStorage.getItem('authToken');
      for (const file of filesToUpload) {
        const urlResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/expedientes/generate-upload-url`, {
          method: 'POST', headers: {
            'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({ fileName: file.name, fileType: file.type })
        });
        if (!urlResponse.ok) throw new Error(`No se pudo obtener URL para ${file.name}`);
        const { uploadURL, fileKey } = await urlResponse.json();
        const uploadResponse = await fetch(uploadURL, { method: 'PUT', body: file });
        if (!uploadResponse.ok) throw new Error(`Falló la subida de ${file.name}`);
        uploadedDocumentKeys.push({ nombre_original: file.name, storage_key: fileKey });
      }

      const payload = { ...currentExpediente, cliente_id: clienteId, documentos: uploadedDocumentKeys };

      const url = isNewExpediente
        ? `${import.meta.env.VITE_API_BASE_URL}/api/expedientes`
        : `${import.meta.env.VITE_API_BASE_URL}/api/expedientes/${currentExpediente.id}`;
      const saveResponse = await fetch(url, {
        method: isNewExpediente ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload)
      });
      if (!saveResponse.ok) throw new Error((await saveResponse.json()).message || 'Error al guardar el expediente.');

      await fetchClienteData(); // Recargar todos los datos de la página
      handleCloseExpedienteDialog();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteExpediente = async (expedienteId: string) => {
    if (window.confirm('¿Estás seguro? Esta acción es irreversible y eliminará todos sus documentos.')) {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/expedientes/${expedienteId}`, {
          method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }
        });
        if (!response.ok) throw new Error('No se pudo eliminar el expediente.');
        await fetchClienteData();
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Error al eliminar.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) return <Container sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Container>;
  if (apiError && !openExpedienteDialog) return <Container sx={{ p: 5 }}><Alert severity="error" onClose={() => setApiError(null)}>{apiError}</Alert></Container>;
  if (!cliente || !editedCliente) return <Container sx={{ p: 5 }}><Alert severity="info">No se encontró información del cliente.</Alert></Container>;

  const renderPreview = () => {
    if (previewLoading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;
    if (apiError) return <Alert severity="error">{apiError}</Alert>;
    if (!fileToPreview) return null;

    const fileName = ('name' in fileToPreview) ? fileToPreview.name : fileToPreview.nombre_original as string;

    if (previewContent) {
      if (fileName.toLowerCase().endsWith('.pdf')) {
        return <iframe src={previewContent} style={{ width: '100%', height: '70vh', border: 'none' }} title={fileName} />;
      }
      if (fileName.toLowerCase().endsWith('.txt')) {
        return <Paper variant="outlined" sx={{ p: 2, maxHeight: '70vh', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{previewContent}</Paper>;
      }
    }

    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h6">Vista previa no disponible</Typography>
        <Typography>
          El archivo "{fileName}" es un documento de Word o de un tipo no soportado para previsualización directa.
        </Typography>
        {previewDownloadUrl && (
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            href={previewDownloadUrl}
            target="_blank"
            rel="noopener"
            sx={{ mt: 2 }}
            download={fileName}
          >
            Descargar archivo
          </Button>
        )}
      </Box>
    );
  };

  const fileName = fileToPreview ? ('name' in fileToPreview ? fileToPreview.name : fileToPreview.nombre_original as string) : '';

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/clientes')} aria-label="back to clients"><ArrowBackIcon /></IconButton>
        <Typography variant="h4" component="h1" sx={{ ml: 1 }}>Detalle del Cliente</Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ mb: 2 }}>Datos Personales</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {isEditing ? (
              <>
                <Button variant="contained" onClick={handleSave} startIcon={<SaveIcon />} disabled={formLoading}>Guardar</Button>
                <Button variant="outlined" onClick={handleEditToggle} startIcon={<CancelIcon />}>Cancelar</Button>
              </>
            ) : (
              <Button variant="contained" onClick={handleEditToggle} startIcon={<EditIcon />}>Editar Datos</Button>
            )}
          </Box>
        </Box>
        <TextField fullWidth label="Nombres" name="nombres" value={editedCliente.nombres} disabled={!isEditing} onChange={handleInputChange}
          onBlur={handleBlur} error={!!formErrors.nombres} helperText={formErrors.nombres} margin="normal" variant="outlined" />
        <TextField fullWidth label="Apellidos" name="apellidos" value={editedCliente.apellidos} disabled={!isEditing} onChange={handleInputChange}
          onBlur={handleBlur} error={!!formErrors.apellidos} helperText={formErrors.apellidos} margin="normal" variant="outlined" />
        <TextField fullWidth label="Número de Teléfono" name="telefono" value={editedCliente.telefono} disabled={!isEditing} onChange={handleInputChange}
          onBlur={handleBlur} error={!!formErrors.telefono} helperText={formErrors.telefono} margin="normal" variant="outlined" />
        <TextField fullWidth label="Correo Electrónico" name="correo" value={editedCliente.correo} disabled={!isEditing} onChange={handleInputChange}
          onBlur={handleBlur} error={!!formErrors.correo} helperText={formErrors.correo} margin="normal" variant="outlined" />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Fecha de Creación: {new Date(cliente.fechaCreacion).toLocaleDateString()}</Typography>
      </Paper>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Expedientes del Cliente</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddExpediente}>Añadir Expediente</Button>
        </Box>
        {expedientesDelCliente.length > 0 ? (
          <List>
            {expedientesDelCliente.map((exp) => (
              <React.Fragment key={exp.id}>
                <ListItemButton onClick={() => handleOpenEditExpediente(exp)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} >
                  <ListItemText
                    primary={`Expediente: ${exp.numero_expediente}`}
                    secondary={`Tipo: ${exp.tipo} | Estado: ${exp.estado}`}
                  />
                  <IconButton edge="end" onClick={e => { e.stopPropagation(); handleDeleteExpediente(exp.id); }} aria-label="delete">
                    <DeleteIcon />
                  </IconButton>
                </ListItemButton>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        ) : (<Typography variant="body1" sx={{ textAlign: 'center', py: 2 }}>No hay expedientes asociados.</Typography>)}
      </Paper>

      <Dialog open={openExpedienteDialog} onClose={handleCloseExpedienteDialog} fullWidth maxWidth="sm">
        <DialogTitle>{isNewExpediente ? 'Añadir Nuevo Expediente' : 'Editar Expediente'}</DialogTitle>
        <DialogContent>
          {apiError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setApiError(null)}>{apiError}</Alert>}
          <Autocomplete freeSolo
            value={currentExpediente?.tipo || ''}
            onChange={(_e, val) => setCurrentExpediente(p => p ? { ...p, tipo: val || '' } : null)}
            onInputChange={(_e, val) => setCurrentExpediente(p => p ? { ...p, tipo: val } : null)}
            options={tiposExpediente}
            renderInput={(params) => <TextField {...params} label="Tipo de Expediente" margin="normal" required error={!!expedienteFormErrors.tipo} helperText={expedienteFormErrors.tipo} />}
          />
          <TextField name="numero_expediente" label="Número de Expediente" fullWidth required margin="normal" value={currentExpediente?.numero_expediente || ''} onChange={(e) => setCurrentExpediente(p => p ? { ...p, numero_expediente: e.target.value } : null)} error={!!expedienteFormErrors.numero_expediente} helperText={expedienteFormErrors.numero_expediente} />
          <TextField name="estado" label="Estado" fullWidth required margin="normal" value={currentExpediente?.estado || ''} onChange={(e) => setCurrentExpediente(p => p ? { ...p, estado: e.target.value } : null)} error={!!expedienteFormErrors.estado} helperText={expedienteFormErrors.estado} />
          <TextField name="descripcion" label="Descripción" fullWidth multiline rows={4} margin="normal" value={currentExpediente?.descripcion || ''} onChange={(e) => setCurrentExpediente(p => p ? { ...p, descripcion: e.target.value } : null)} />

          <Box sx={{ my: 2 }}>
            <Button variant="outlined" component="label" fullWidth startIcon={<AttachFileIcon />}>
              Adjuntar Documentos (PDF, Word, TXT)
              <input type="file" hidden multiple onChange={handleFileSelected} accept='.pdf,.doc,.docx,.txt' />
            </Button>
          </Box>

          {filesToUpload.length > 0 && (
            <Box sx={{ my: 2 }}>
              <Typography variant="subtitle2">Nuevos archivos:</Typography>
              {filesToUpload.map((file, i) => (
                <Chip key={i} label={file.name} onDelete={() => handleRemoveFile(file)} onClick={() => handleOpenPreview(file)} sx={{ mr: 1, mt: 1 }} />
              ))}
            </Box>
          )}

          {!isNewExpediente && Array.isArray(currentExpediente?.documentos) && currentExpediente.documentos.length > 0 && (
            <Box sx={{ my: 2 }}>
              <Typography variant="subtitle2">Documentos existentes:</Typography>
              {currentExpediente.documentos.map((doc) => (
                <Chip key={doc.id} label={doc.nombre_original} component="a" onClick={() => handleOpenPreview(doc)} clickable sx={{ mr: 1, mt: 1 }} />
              ))}
            </Box>
          )}

        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={handleCloseExpedienteDialog} disabled={formLoading}>Cancelar</Button>
          <Button onClick={handleSaveExpediente} variant="contained" disabled={formLoading}>{formLoading ? 'Guardando...' : 'Guardar'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={previewOpen} onClose={handleClosePreview} fullWidth maxWidth="lg">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Vista Previa: {fileName}
          {previewDownloadUrl && (fileName.toLowerCase().endsWith('.pdf') || fileName.toLowerCase().endsWith('.txt')) && (
            <Button
              variant="outlined"
              component="a"
              href={previewDownloadUrl}
              target="_blank"
              rel="noopener"
              download={fileName}
              startIcon={<DownloadIcon />}
            >
              Descargar
            </Button>
          )}
        </DialogTitle>
        <DialogContent>
          {previewLoading ? <CircularProgress /> : renderPreview()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview} sx={{ mx: 2, my: 1 }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
}