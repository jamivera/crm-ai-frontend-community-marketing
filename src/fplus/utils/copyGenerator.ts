// ─── Generador de Copy — Metodología Andrómeda ─────────────────────────────────
// V1: motor determinístico de plantillas estratégicas por industria/objetivo.
// Misma arquitectura que hashtagSuggester: cuando se conecte la IA real,
// esta función se reemplaza manteniendo la firma (drop-in).

import { suggestHashtags } from './hashtagSuggester';
import type { ContentType, Platform, MarketingObjective } from '../types';

export interface CopyInput {
  clientNombre: string;
  industria: string;
  ciudad?: string;
  tipo: ContentType;
  plataforma: Platform;
  objetivo: MarketingObjective;
  tema?: string; // nombre/tema de la pieza si existe
}

export interface GeneratedCopy {
  hook: string;
  copy: string;
  cta: string;
  hashtags: string[];
  angulo_venta: string;
  objetivo_contenido: string;
}

// Bancos Andrómeda: hook (atención) → cuerpo (deseo) → CTA (acción)
const HOOKS: Record<string, string[]> = {
  alcance: [
    'Esto es lo que nadie te cuenta sobre {tema} 👀',
    '¿Sabías que {tema} puede cambiar tu día? ✨',
    'Para de hacer scroll: esto te interesa 🔥',
  ],
  conversion: [
    'Última oportunidad para aprovechar {tema} ⏰',
    'El momento que esperabas llegó: {tema} 🎯',
    'Solo por tiempo limitado: {tema} 💥',
  ],
  comunidad: [
    'Cuéntanos en los comentarios: ¿tú qué opinas de {tema}? 👇',
    'Etiqueta a esa persona que necesita ver {tema} 💬',
    'Somos más que una marca — esto es {tema} 🤝',
  ],
  lanzamiento: [
    'Llegó lo nuevo: {tema} 🚀',
    'Lo pediste, lo hicimos: {tema} ✨',
    'Hoy presentamos {tema} — y va a encantarte 🎉',
  ],
};

const BODIES: Record<string, string> = {
  alcance: 'En {cliente} creemos que {industria_frase}. Por eso preparamos {tema} pensando en ti. Descúbrelo y vive la experiencia completa.',
  conversion: '{tema} de {cliente} está disponible ahora mismo. Cupos y disponibilidad limitados — quienes llegan primero, ganan. Da el paso hoy.',
  comunidad: 'Detrás de {cliente} hay un equipo que vive {industria_frase}. {tema} es nuestra forma de compartirlo contigo. Tu opinión construye lo que viene.',
  lanzamiento: 'Después de meses de trabajo, {cliente} presenta {tema}. Diseñado para quienes buscan más de {industria_frase}. Sé de los primeros en probarlo.',
};

const CTAS: Record<string, string[]> = {
  alcance: ['Síguenos para más contenido como este →', 'Comparte esta publicación con quien la necesite 📲'],
  conversion: ['Reserva ahora → link en bio', 'Escríbenos por WhatsApp y asegura el tuyo 📩'],
  comunidad: ['Déjanos tu comentario 👇', 'Únete a nuestra comunidad — link en bio 🤝'],
  lanzamiento: ['Descúbrelo hoy → link en bio', 'Agenda tu cita de lanzamiento 🚀'],
};

const INDUSTRY_PHRASES: [string[], string][] = [
  [['gastro', 'restaur'], 'la buena mesa se disfruta mejor acompañada'],
  [['belleza', 'estetic', 'spa'], 'sentirte bien empieza por cuidarte'],
  [['salud', 'clinic', 'medic'], 'tu bienestar merece atención de primera'],
  [['inmobiliar', 'construc'], 'encontrar tu espacio ideal lo cambia todo'],
  [['retail', 'moda', 'tienda'], 'tu estilo habla por ti'],
  [['educa', 'academ'], 'aprender es la mejor inversión'],
  [['legal', 'abogad', 'seguros', 'servicios'], 'la tranquilidad viene de estar bien asesorado'],
  [['b2b', 'industrial', 'tecnolog'], 'la eficiencia marca la diferencia'],
];

const ANGLES: Record<string, string> = {
  alcance: 'Descubrimiento — despertar curiosidad y maximizar el compartido orgánico',
  conversion: 'Urgencia y escasez — impulsar la decisión inmediata',
  comunidad: 'Pertenencia — convertir seguidores en comunidad activa',
  lanzamiento: 'Novedad — capitalizar la expectativa del lanzamiento',
};

const CONTENT_GOALS: Record<string, string> = {
  alcance: 'Maximizar alcance e impresiones del contenido',
  conversion: 'Generar consultas, reservas o ventas directas',
  comunidad: 'Aumentar interacción, comentarios y guardados',
  lanzamiento: 'Comunicar la novedad y generar primeras conversiones',
};

function industriaFrase(industria: string): string {
  const key = industria.toLowerCase();
  return INDUSTRY_PHRASES.find(([m]) => m.some(x => key.includes(x)))?.[1]
    ?? 'los detalles hacen la diferencia';
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export async function generateCopy(input: CopyInput): Promise<GeneratedCopy> {
  // Simula latencia de IA (1.2–1.8s)
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 600));

  const seed = Date.now();
  const tema = input.tema?.trim() || `lo nuevo de ${input.clientNombre}`;
  const frase = industriaFrase(input.industria);

  const fill = (t: string) =>
    t.split('{tema}').join(tema)
     .split('{cliente}').join(input.clientNombre)
     .split('{industria_frase}').join(frase);

  const hook = fill(pick(HOOKS[input.objetivo], seed));
  const body = fill(BODIES[input.objetivo]);
  const cta = pick(CTAS[input.objetivo], seed);

  const tags = await suggestHashtags({
    copy: `${hook} ${body}`,
    clientNombre: input.clientNombre,
    industria: input.industria,
    ciudad: input.ciudad ?? 'Quito',
    pais: 'Ecuador',
    tipo: input.tipo,
    plataforma: input.plataforma,
  });

  return {
    hook,
    copy: `${hook}\n\n${body}\n\n${cta}`,
    cta,
    hashtags: [...tags.alcance.slice(0, 3), ...tags.nicho.slice(0, 3), ...tags.conversion.slice(0, 2), ...tags.marca.slice(0, 2)],
    angulo_venta: ANGLES[input.objetivo],
    objetivo_contenido: CONTENT_GOALS[input.objetivo],
  };
}
