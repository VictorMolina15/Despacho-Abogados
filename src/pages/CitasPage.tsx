// src/pages/CitasPage.tsx

import { Box, Container, Tab, Tabs, Typography } from '@mui/material';
import { CitasManagement } from '../components/CitasManagement';
import { CitasHistory } from '../components/CitasHistory';
import { CitasConfirmadas } from '../components/CitasConfirmadas'
import { useState } from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`citas-tabpanel-${index}`}
      aria-labelledby={`citas-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export function CitasPage() {
  const [value, setValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Gestión de Citas
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="pestañas de gestión de citas">
          <Tab label="Nuevas Solicitudes" id="citas-tab-0" />
          <Tab label="Citas Confirmadas" id="citas-tab-1" />
          <Tab label="Historial" id="citas-tab-2" />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        <CitasManagement />
      </TabPanel>
       <TabPanel value={value} index={1}>
        <CitasConfirmadas />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <CitasHistory />
      </TabPanel>

    </Container>
  );
}