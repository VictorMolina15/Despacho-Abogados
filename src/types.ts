// En un archivo como src/types.ts

export interface Cliente {
  id: string;
  nombreCompleto: string;
  telefono: string;
  correo: string;
  fechaCreacion: Date;
}

export interface Expediente {
  id: string;
  clienteId: string;
  tipo: 'Divorcio' | 'Mercantil' | 'Penal'; // Usar uniones de tipos es muy potente
  documentos: Documento[];
}

export interface Documento {
  id: string;
  nombre: string;
  urlDescarga: string;
  fechaSubida: Date;
}