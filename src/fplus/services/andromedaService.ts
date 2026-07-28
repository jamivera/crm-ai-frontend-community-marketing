// =====================================================================
// ANDROMEDA AI SERVICE - FPLUS AGENCYOS
// Handles Brand Strategy Generation & Automated Piece Copies / Hashtags
// =====================================================================

import type { Client, ContentPiece } from '../types';
import type { ProposedPiece } from '../utils/cronoplanner';

export interface StrategicBrandPlan {
  pilares: string[];
  tonoRecomendado: string;
  explicacion: string;
  propuestas: ProposedPiece[];
}

export interface GeneratedContentCopy {
  copy: string;
  hashtags: string[];
  cta: string;
}

const ANDROMEDA_API_URL = import.meta.env.VITE_ANDROMEDA_API_URL || 'https://api.andromeda.fplus.agency/v1';
const ANDROMEDA_API_KEY = import.meta.env.VITE_ANDROMEDA_API_KEY || '';

/**
 * 1. Request Andrómeda AI to design the entire monthly strategic calendar based on the client brief
 */
export async function generateBrandStrategyPlan(
  client: Client,
  month: number,
  year: number
): Promise<StrategicBrandPlan> {
  const url = `${ANDROMEDA_API_URL}/generate-plan`;
  const payload = {
    client_id: client.id,
    nombre: client.nombre,
    industria: client.industria,
    tipo_mercado: client.tipo_mercado,
    objetivo_marketing: client.objetivo_marketing,
    redes: client.redes_contratadas,
    piezas_mensuales: client.piezas_mensuales,
    distribucion: client.distribucion_piezas,
    month,
    year
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANDROMEDA_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Andromeda Strategy Plan generation failed: ${res.status}`);
    }

    const data = await res.json();
    return {
      pilares: data.pilares || ['Valor', 'Educativo', 'Conexión', 'Venta'],
      tonoRecomendado: data.tonoRecomendado || 'Profesional y Cercano',
      explicacion: data.explicacion || 'Plan de contenido estructurado para potenciar el alcance de la marca.',
      propuestas: data.propuestas || []
    };
  } catch (error) {
    console.error('Error generating plan with Andromeda AI:', error);
    // Safe offline fallback (simulates local offline execution)
    return {
      pilares: ['Crecimiento', 'Educación', 'Detrás de Escena', 'Promocional'],
      tonoRecomendado: 'Enérgico y Empático',
      explicacion: 'Planificación optimizada basada en el Brief corporativo.',
      propuestas: []
    };
  }
}

/**
 * 2. Request Andrómeda AI to generate high-converting copy and strategically relevant hashtags for a piece
 */
export async function generatePieceCopy(
  piece: ContentPiece,
  client: Client
): Promise<GeneratedContentCopy> {
  const url = `${ANDROMEDA_API_URL}/generate-copy`;
  const payload = {
    piece_id: piece.id,
    nombre: piece.nombre,
    tipo: piece.tipo,
    pilar: piece.pilar,
    objetivo: piece.objetivo_marketing,
    plataforma: piece.plataforma,
    marca: client.nombre,
    industria: client.industria,
    tono: piece.tono || 'profesional'
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANDROMEDA_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Andromeda Copy generation failed: ${res.status}`);
    }

    const data = await res.json();
    return {
      copy: data.copy || '',
      hashtags: data.hashtags || [],
      cta: data.cta || ''
    };
  } catch (error) {
    console.error('Error generating copy with Andromeda AI:', error);
    // Safe offline fallback (simulates local copywriting copy)
    const mockCopy = `¡Descubre una nueva forma de optimizar tu negocio con ${client.nombre}! 🚀\n\n` +
      `Diseñado estratégicamente para resolver tus mayores desafíos en el sector de ${client.industria}.\n\n` +
      `¿Listo para dar el siguiente paso? Escríbenos por DM para agendar una sesión.`;

    return {
      copy: mockCopy,
      hashtags: ['innovacion', client.nombre.toLowerCase().replace(/\s+/g, ''), 'desarrollo', 'estrategia'],
      cta: 'Regístrate hoy mismo'
    };
  }
}
