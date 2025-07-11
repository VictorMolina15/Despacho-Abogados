// En un archivo como src/types.ts

import type { ReactNode } from "react";

export interface Usuario {
  id: string; // O number, si tu API lo maneja así
  nombres: string;
  apellidos: string;
  telefono?: string; // Opcional
  correo: string;
  rol: 'SuperAdmin' | 'Admin' | 'Usuario';
  fechaRegistro: Date; // Usaremos camelCase en frontend para consistencia
}

export interface Cliente {
  apellidos: string | undefined;
  nombres: string | undefined;
  id: string;
  nombreCompleto: string;
  telefono: string;
  correo: string; // Añadido para la búsqueda y detalle
  fechaCreacion: Date; // Añadido para el detalle
}

export type Expediente = {
  id: string;
  clienteId: string;
  tipo: string;
  numero_expediente?: string;
  estado?: string;
  descripcion?: string;
  documentos: Documento[];
};

export interface Documento {
  nombre_original: ReactNode;
  id: string;
  nombre: string;
  urlDescarga: string;
  fechaSubida: Date;
}