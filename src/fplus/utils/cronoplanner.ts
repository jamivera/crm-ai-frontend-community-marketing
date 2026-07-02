// ─── Planificación Inteligente Asistida del Cronopost ──────────────────────────
// El motor PROPONE una planificación estratégica basada en reglas por industria;
// el estratega de Primero Digital siempre tiene la decisión final.
//
// V1: reglas de buenas prácticas por industria + calendario de eventos.
// Futuro: el parámetro `historial` (PublicationMetric[]) permitirá pesar los
// días según rendimiento real por cliente sin cambiar esta interfaz.

import type {
  Client, ContentType, Platform, MarketingObjective,
  SmartEvent, PublicationMetric,
} from '../types';

// ─── Perfil estratégico por industria ───────────────────────────────────────────
// dayScores: puntaje base por día de semana (0=Dom … 6=Sáb) para cada formato.
// Mayor puntaje = mejor día para publicar ese formato en esa industria.

interface IndustryProfile {
  match: string[]; // substrings (lowercase) que identifican la industria
  dayScores: Partial<Record<ContentType, number[]>>; // índice 0=Dom…6=Sáb
  horaSugerida: Partial<Record<ContentType, string>>;
  notas: Partial<Record<ContentType, string>>; // razón estratégica base
}

const GENERIC_PROFILE: IndustryProfile = {
  match: [],
  dayScores: {
    reel:        [2, 4, 6, 4, 6, 4, 5],
    carrusel:    [1, 4, 5, 6, 6, 4, 2],
    historia:    [2, 4, 4, 5, 5, 5, 3],
    post_imagen: [1, 6, 4, 6, 4, 4, 2],
    post_video:  [2, 4, 5, 5, 5, 4, 3],
    tiktok:      [3, 3, 5, 4, 6, 5, 5],
  },
  horaSugerida: { reel: '19:00', carrusel: '12:00', historia: '09:00', post_imagen: '11:00' },
  notas: {
    reel: 'mayor alcance del formato video corto entre semana y fines de semana',
    carrusel: 'los carruseles retienen más a mitad de semana',
    historia: 'las historias mantienen presencia diaria de la marca',
    post_imagen: 'los posts informativos rinden mejor al inicio de semana',
  },
};

const INDUSTRY_PROFILES: IndustryProfile[] = [
  {
    match: ['gastro', 'restaur', 'comida', 'food'],
    dayScores: {
      reel:        [3, 2, 5, 4, 7, 7, 6],
      carrusel:    [2, 3, 5, 6, 6, 5, 3],
      historia:    [3, 3, 4, 5, 7, 7, 5],
      post_imagen: [2, 4, 5, 5, 5, 6, 3],
    },
    horaSugerida: { reel: '18:30', carrusel: '11:30', historia: '10:30', post_imagen: '12:00' },
    notas: {
      reel: 'mayor rendimiento del formato en Instagram para gastronomía hacia el fin de semana',
      carrusel: 'los menús y platos en carrusel funcionan mejor jueves y viernes, antes de decidir dónde comer',
      historia: 'las historias cercanas al fin de semana impulsan reservas',
      post_imagen: 'posts de platos al mediodía captan a la audiencia con hambre',
    },
  },
  {
    match: ['belleza', 'bienestar', 'estetic', 'spa', 'beauty'],
    dayScores: {
      reel:        [3, 4, 6, 5, 6, 5, 5],
      carrusel:    [2, 5, 5, 6, 5, 4, 3],
      historia:    [3, 5, 5, 5, 5, 4, 4],
      post_imagen: [2, 5, 4, 5, 4, 4, 3],
    },
    horaSugerida: { reel: '20:00', carrusel: '13:00', historia: '09:30', post_imagen: '15:00' },
    notas: {
      reel: 'los tutoriales y antes/después rinden mejor en horario nocturno',
      carrusel: 'los carruseles de tips retienen a la audiencia de belleza a mitad de semana',
      historia: 'historias matutinas acompañan la rutina de la audiencia',
      post_imagen: 'los resultados visuales funcionan en tarde-noche',
    },
  },
  {
    match: ['b2b', 'industrial', 'servicios profesionales', 'legal', 'abogad', 'consultor', 'tecnolog', 'saas', 'seguros'],
    dayScores: {
      reel:        [0, 4, 6, 5, 6, 3, 1],
      carrusel:    [0, 5, 6, 6, 5, 3, 0],
      historia:    [0, 4, 4, 5, 4, 3, 1],
      post_imagen: [0, 6, 5, 6, 4, 3, 0],
    },
    horaSugerida: { reel: '08:30', carrusel: '10:00', historia: '08:00', post_imagen: '09:00' },
    notas: {
      reel: 'video corto en horario laboral matutino para audiencia profesional',
      carrusel: 'los carruseles educativos rinden en LinkedIn entre martes y jueves',
      historia: 'presencia de marca al inicio de la jornada laboral',
      post_imagen: 'los posts institucionales rinden al inicio de semana laboral',
    },
  },
  {
    match: ['retail', 'tienda', 'moda', 'ecommerce'],
    dayScores: {
      reel:        [4, 3, 5, 5, 6, 7, 6],
      carrusel:    [3, 4, 5, 6, 6, 6, 4],
      historia:    [4, 4, 4, 5, 6, 6, 5],
      post_imagen: [3, 5, 4, 5, 5, 6, 4],
    },
    horaSugerida: { reel: '19:00', carrusel: '12:30', historia: '10:00', post_imagen: '17:00' },
    notas: {
      reel: 'los reels de producto rinden más cerca del fin de semana, cuando se decide la compra',
      carrusel: 'los catálogos en carrusel funcionan jueves-sábado',
      historia: 'historias de novedades sostienen el interés previo al fin de semana',
      post_imagen: 'posts de producto en horario de salida laboral',
    },
  },
  {
    match: ['salud', 'clinic', 'medic', 'dental'],
    dayScores: {
      reel:        [1, 5, 5, 6, 5, 4, 2],
      carrusel:    [1, 5, 6, 6, 5, 3, 1],
      historia:    [2, 5, 4, 5, 4, 4, 2],
      post_imagen: [1, 6, 5, 5, 4, 3, 1],
    },
    horaSugerida: { reel: '18:00', carrusel: '10:30', historia: '08:30', post_imagen: '09:30' },
    notas: {
      reel: 'contenido educativo en video rinde entre semana para salud',
      carrusel: 'los carruseles informativos de salud funcionan a mitad de semana',
      historia: 'historias matutinas para recordatorios y agenda',
      post_imagen: 'posts educativos al inicio de la semana',
    },
  },
  {
    match: ['inmobiliar', 'construc', 'real estate'],
    dayScores: {
      reel:        [3, 4, 5, 5, 6, 5, 5],
      carrusel:    [2, 5, 5, 6, 5, 4, 3],
      historia:    [3, 4, 4, 5, 5, 5, 4],
      post_imagen: [2, 5, 5, 5, 4, 4, 3],
    },
    horaSugerida: { reel: '17:30', carrusel: '11:00', historia: '09:00', post_imagen: '10:00' },
    notas: {
      reel: 'los recorridos en video rinden hacia el fin de semana, cuando se agendan visitas',
      carrusel: 'los carruseles de propiedades funcionan a mitad de semana',
      historia: 'historias de avance de obra mantienen la confianza',
      post_imagen: 'posts de proyectos al inicio de semana',
    },
  },
  {
    match: ['educa', 'academ', 'escuela', 'universidad'],
    dayScores: {
      reel:        [2, 5, 5, 6, 5, 4, 3],
      carrusel:    [1, 5, 6, 5, 5, 3, 2],
      historia:    [2, 5, 5, 5, 5, 4, 3],
      post_imagen: [1, 6, 5, 5, 4, 3, 2],
    },
    horaSugerida: { reel: '16:00', carrusel: '10:00', historia: '08:00', post_imagen: '09:00' },
    notas: {
      reel: 'video educativo en horario post-clases',
      carrusel: 'los carruseles académicos rinden entre martes y jueves',
      historia: 'historias matutinas acompañan la rutina académica',
      post_imagen: 'posts informativos al inicio de semana',
    },
  },
];

export function getIndustryProfile(industria: string): IndustryProfile {
  const key = industria.toLowerCase();
  return INDUSTRY_PROFILES.find(p => p.match.some(m => key.includes(m))) ?? GENERIC_PROFILE;
}

// ─── Calendario inteligente de eventos (banco inicial Ecuador) ──────────────────

export const SMART_EVENTS: SmartEvent[] = [
  { id: 'ev-anio-nuevo',     fecha: '2026-01-01', nombre: 'Año Nuevo',                    tipo: 'feriado',   recurrente_anual: true },
  { id: 'ev-carnaval',       fecha: '2026-02-16', nombre: 'Carnaval',                     tipo: 'feriado',   recurrente_anual: false },
  { id: 'ev-san-valentin',   fecha: '2026-02-14', nombre: 'San Valentín',                 tipo: 'comercial', recurrente_anual: true },
  { id: 'ev-dia-mujer',      fecha: '2026-03-08', nombre: 'Día de la Mujer',              tipo: 'efemeride', recurrente_anual: true },
  { id: 'ev-viernes-santo',  fecha: '2026-04-03', nombre: 'Viernes Santo',                tipo: 'feriado',   recurrente_anual: false },
  { id: 'ev-dia-trabajo',    fecha: '2026-05-01', nombre: 'Día del Trabajo',              tipo: 'feriado',   recurrente_anual: true },
  { id: 'ev-dia-madre',      fecha: '2026-05-10', nombre: 'Día de la Madre',              tipo: 'comercial', recurrente_anual: false },
  { id: 'ev-batalla-pichincha', fecha: '2026-05-24', nombre: 'Batalla de Pichincha',      tipo: 'feriado',   recurrente_anual: true },
  { id: 'ev-dia-padre',      fecha: '2026-06-21', nombre: 'Día del Padre',                tipo: 'comercial', recurrente_anual: false },
  { id: 'ev-independencia',  fecha: '2026-08-10', nombre: 'Independencia de Ecuador',     tipo: 'feriado',   recurrente_anual: true },
  { id: 'ev-indep-guayaquil', fecha: '2026-10-09', nombre: 'Independencia de Guayaquil',  tipo: 'feriado',   recurrente_anual: true },
  { id: 'ev-dia-difuntos',   fecha: '2026-11-02', nombre: 'Día de los Difuntos',          tipo: 'feriado',   recurrente_anual: true },
  { id: 'ev-indep-cuenca',   fecha: '2026-11-03', nombre: 'Independencia de Cuenca',      tipo: 'feriado',   recurrente_anual: true },
  { id: 'ev-black-friday',   fecha: '2026-11-27', nombre: 'Black Friday',                 tipo: 'comercial', recurrente_anual: false },
  { id: 'ev-fundacion-quito', fecha: '2026-12-06', nombre: 'Fundación de Quito',          tipo: 'feriado',   recurrente_anual: true },
  { id: 'ev-navidad',        fecha: '2026-12-25', nombre: 'Navidad',                      tipo: 'feriado',   recurrente_anual: true },
  { id: 'ev-dia-gastronomia', fecha: '2026-06-18', nombre: 'Día de la Gastronomía Sostenible', tipo: 'sector', recurrente_anual: true, industrias_relevantes: ['gastro', 'restaur'] },
  { id: 'ev-dia-salud',      fecha: '2026-04-07', nombre: 'Día Mundial de la Salud',      tipo: 'sector',    recurrente_anual: true, industrias_relevantes: ['salud', 'clinic', 'medic'] },
  { id: 'ev-dia-abogado',    fecha: '2026-02-28', nombre: 'Día del Abogado (Ecuador)',    tipo: 'sector',    recurrente_anual: true, industrias_relevantes: ['legal', 'abogad'] },
];

// Eventos del mes relevantes para un cliente (feriados/comerciales para todos;
// sectoriales solo si coincide la industria; 'cliente' solo si coincide el id).
export function getMonthEvents(
  year: number, month: number, industria: string, clientId?: string,
  extraEvents: SmartEvent[] = [],
): SmartEvent[] {
  const key = industria.toLowerCase();
  return [...SMART_EVENTS, ...extraEvents].filter(ev => {
    const d = new Date(ev.fecha + 'T12:00:00');
    if (d.getFullYear() !== year || d.getMonth() !== month) return false;
    if (ev.tipo === 'cliente') return ev.client_id === clientId;
    if (ev.industrias_relevantes?.length) {
      return ev.industrias_relevantes.some(m => key.includes(m));
    }
    return true;
  });
}

// ─── Propuesta de planificación ─────────────────────────────────────────────────

export interface ProposedPiece {
  tempId: string;
  tipo: ContentType;
  fecha: string;       // YYYY-MM-DD
  hora: string;        // HH:mm
  plataforma: Platform;
  razon_estrategica: string;
  evento?: SmartEvent; // si la pieza coincide con un evento del calendario
}

export interface PlanInput {
  client: Client;
  year: number;
  month: number; // 0-11
  objetivo: MarketingObjective;
  extraEvents?: SmartEvent[];
  // V1: sin uso. Futuro: pesar días según rendimiento real del cliente.
  historial?: PublicationMetric[];
}

export interface PlanResult {
  pieces: ProposedPiece[];
  events: SmartEvent[];       // eventos del mes para mostrar alertas
  emptyDays: number[];        // días del mes que quedaron sin publicaciones
}

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

// Ajuste de puntaje por objetivo de marketing
function objectiveBoost(objetivo: MarketingObjective, tipo: ContentType, dow: number): number {
  switch (objetivo) {
    case 'alcance':
      return tipo === 'reel' || tipo === 'tiktok' ? 2 : 0;
    case 'conversion':
      // días de mayor intención de compra/contacto: mar-jue
      return dow >= 2 && dow <= 4 && (tipo === 'carrusel' || tipo === 'post_imagen') ? 2 : 0;
    case 'comunidad':
      return tipo === 'historia' ? 2 : 0;
    case 'lanzamiento':
      return tipo === 'reel' || tipo === 'historia' ? 1.5 : 0;
  }
}

// Plataforma preferida por formato dentro de las redes contratadas
function pickPlatform(tipo: ContentType, redes: Platform[]): Platform {
  const pref: Partial<Record<ContentType, Platform[]>> = {
    reel:        ['instagram', 'tiktok', 'facebook'],
    tiktok:      ['tiktok', 'instagram'],
    carrusel:    ['instagram', 'linkedin', 'facebook'],
    historia:    ['instagram', 'facebook'],
    post_imagen: ['instagram', 'linkedin', 'facebook'],
    post_video:  ['instagram', 'facebook', 'youtube'],
  };
  for (const p of pref[tipo] ?? []) if (redes.includes(p)) return p;
  return redes[0] ?? 'instagram';
}

export function generatePlan(input: PlanInput): PlanResult {
  const { client, year, month, objetivo, extraEvents = [] } = input;
  // tipo_mercado (asistente de creación) tiene prioridad sobre industria libre
  const profile = getIndustryProfile(client.tipo_mercado ?? client.industria);
  const redes = client.redes_contratadas ?? ['instagram'];
  const distribucion = client.distribucion_piezas ?? {};
  const events = getMonthEvents(year, month, client.industria, client.id, extraEvents);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventByDay = new Map<number, SmartEvent>();
  events.forEach(ev => eventByDay.set(new Date(ev.fecha + 'T12:00:00').getDate(), ev));

  // Cola de piezas a colocar: formatos "fuertes" primero para que tomen los mejores días.
  const queue: ContentType[] = [];
  const strongOrder: ContentType[] = ['reel', 'post_video', 'tiktok', 'carrusel', 'post_imagen', 'historia', 'historia_video'];
  const sortedTypes = (Object.entries(distribucion) as [ContentType, number][])
    .sort((a, b) => strongOrder.indexOf(a[0]) - strongOrder.indexOf(b[0]));
  // Intercalado round-robin para favorecer la alternancia natural
  const counters = sortedTypes.map(([, qty]) => qty);
  let remaining = counters.reduce((a, b) => a + b, 0);
  while (remaining > 0) {
    for (let i = 0; i < sortedTypes.length; i++) {
      if (counters[i] > 0) {
        queue.push(sortedTypes[i][0]);
        counters[i]--;
        remaining--;
      }
    }
  }

  const piecesPerDay = new Map<number, ContentType[]>();
  const proposed: ProposedPiece[] = [];

  // Máximo de piezas por día: mantener respiración en el mes.
  const maxPerDay = queue.length > daysInMonth ? 2 : 1;

  const scoreDay = (day: number, tipo: ContentType): number => {
    const dow = new Date(year, month, day).getDay();
    const base = (profile.dayScores[tipo] ?? GENERIC_PROFILE.dayScores[tipo] ?? [3,3,3,3,3,3,3])[dow];
    let score = base + objectiveBoost(objetivo, tipo, dow);
    // Bonificar días con eventos relevantes
    if (eventByDay.has(day)) score += 3;
    // Penalizar saturación del día
    const used = piecesPerDay.get(day)?.length ?? 0;
    score -= used * 4;
    // Alternancia: penalizar mismo formato en días consecutivos (regla blanda,
    // las historias son formato ligero y quedan exentas)
    if (tipo !== 'historia' && tipo !== 'historia_video') {
      const prev = piecesPerDay.get(day - 1) ?? [];
      const next = piecesPerDay.get(day + 1) ?? [];
      if (prev.includes(tipo) || next.includes(tipo)) score -= 3;
    }
    // Distribución temporal: penalizar aglomeración en la misma semana
    const week = Math.floor((day - 1) / 7);
    const inWeek = proposed.filter(p => Math.floor((new Date(p.fecha + 'T12:00:00').getDate() - 1) / 7) === week && p.tipo === tipo).length;
    score -= inWeek * 1.5;
    return score;
  };

  for (const tipo of queue) {
    let bestDay = 1;
    let bestScore = -Infinity;
    for (let day = 1; day <= daysInMonth; day++) {
      if ((piecesPerDay.get(day)?.length ?? 0) >= maxPerDay) continue;
      const s = scoreDay(day, tipo);
      if (s > bestScore) { bestScore = s; bestDay = day; }
    }
    const date = new Date(year, month, bestDay);
    const dow = date.getDay();
    const evento = eventByDay.get(bestDay);
    const notaBase = profile.notas[tipo] ?? GENERIC_PROFILE.notas[tipo] ?? 'distribución estratégica del formato';
    const razon = evento
      ? `${cap(tipoLabel(tipo))} el ${DAY_NAMES[dow]} ${bestDay}: coincide con ${evento.nombre} — oportunidad de contenido temático.`
      : `${cap(tipoLabel(tipo))} el ${DAY_NAMES[dow]}: ${notaBase}.`;

    proposed.push({
      tempId: `prop-${proposed.length + 1}`,
      tipo,
      fecha: `${year}-${String(month + 1).padStart(2, '0')}-${String(bestDay).padStart(2, '0')}`,
      hora: profile.horaSugerida[tipo] ?? '12:00',
      plataforma: pickPlatform(tipo, redes),
      razon_estrategica: razon,
      evento,
    });
    const arr = piecesPerDay.get(bestDay) ?? [];
    arr.push(tipo);
    piecesPerDay.set(bestDay, arr);
  }

  proposed.sort((a, b) => a.fecha.localeCompare(b.fecha));

  const emptyDays: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) if (!piecesPerDay.has(d)) emptyDays.push(d);

  return { pieces: proposed, events, emptyDays };
}

function tipoLabel(tipo: ContentType): string {
  const m: Partial<Record<ContentType, string>> = {
    reel: 'reel', carrusel: 'carrusel', historia: 'historia',
    historia_video: 'historia en video', post_imagen: 'post', post_video: 'video', tiktok: 'tiktok',
  };
  return m[tipo] ?? tipo;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
