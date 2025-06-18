// En un archivo como src/types.ts

export interface Cliente {
  id: string;
  nombreCompleto: string;
  telefono: string;
  correo: string; // Añadido para la búsqueda y detalle
  fechaCreacion: Date; // Añadido para el detalle
}

export interface Expediente {
  id: string;
  clienteId: string;
  tipo: 'Divorcio' | 'Mercantil' | 'Penal'; // Usar uniones de tipos es muy potente
  // Considera añadir un campo para el "numero de expediente" completo, ej:
  // numeroCompleto: string; // "254/2023 juzgado 2 familiar oral mty-juicio alimentos"
  documentos: Documento[];
}

export interface Documento {
  id: string;
  nombre: string;
  urlDescarga: string;
  fechaSubida: Date;
}