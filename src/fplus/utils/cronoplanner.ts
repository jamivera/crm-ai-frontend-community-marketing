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

export function getIndustryProfile(industria?: string): IndustryProfile {
  if (!industria) return GENERIC_PROFILE;
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
  year: number, month: number, industria?: string, clientId?: string,
  extraEvents: SmartEvent[] = [],
): SmartEvent[] {
  const key = (industria ?? '').toLowerCase();
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
  // Campos estratégicos (Andrómeda AI)
  objetivo_marketing?: string;
  etapa_embudo?: 'reconocimiento' | 'consideracion' | 'conversion' | 'remarketing';
  cta_propuesto?: string;
  tono_sugerido?: string;
  explicacion_estrategica?: string;
  copy_sugerido?: string;
  hashtags_sugeridos?: string[];
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

function getIndustrySuggestions(industria: string, tipo: ContentType, objetivo: MarketingObjective): { copy: string; hashtags: string[] } {
  const ind = (industria || '').toLowerCase();
  const isGastro = ind.includes('gastro') || ind.includes('restaur') || ind.includes('comida') || ind.includes('food');
  const isBelleza = ind.includes('belleza') || ind.includes('beauty') || ind.includes('bienestar') || ind.includes('spa') || ind.includes('estetic');
  const isProfessional = ind.includes('legal') || ind.includes('abogad') || ind.includes('b2b') || ind.includes('consult') || ind.includes('tecnolog') || ind.includes('saas') || ind.includes('seguros');
  const isRetail = ind.includes('retail') || ind.includes('tienda') || ind.includes('moda') || ind.includes('ecommerce');
  const isInmob = ind.includes('inmobiliar') || ind.includes('real estate') || ind.includes('construc');

  let copy = '';
  let hashtags: string[] = [];

  if (isGastro) {
    hashtags = ['#Gastronomia', '#Foodies', '#Restaurante', '#SaborUnico'];
    if (tipo === 'reel' || tipo === 'tiktok') {
      copy = `🎬 [REEL/TIKTOK] GANCHO (3s): ¿El plato que cura cualquier mal día? Te lo mostramos en cámara lenta. 🤤\n\nCONTENIDO: Detrás de cámaras en la cocina de Primero Digital. La textura crujiente de nuestro plato estrella.\n\nCTA: Comenta tu ingrediente favorito y te enviamos un descuento especial por DM.`;
    } else if (tipo === 'carrusel') {
      copy = `📸 [CARRUSEL] Desliza para conocer el proceso de 5 pasos para lograr la cocción perfecta en casa. 🍽️\n\nSlide 1: El secreto de nuestro chef\nSlide 2: Selección del ingrediente premium\nSlide 3: Temperatura exacta\nSlide 4: El emplatado final\nSlide 5: ¡Disfrútalo hoy!\n\nCTA: Guarda este carrusel para tu próxima cena.`;
    } else if (tipo === 'historia') {
      copy = `📱 [HISTORIA INTERACTIVA] ¿Almuerzo ligero o banquete completo? 🥗vs🍔\n\nIdea: Inserta sticker de encuesta.\n\nCopy: Recuerda que puedes pedir tu favorito a domicilio haciendo clic en el enlace.`;
    } else {
      copy = `🖼️ [POST] El ingrediente secreto del sabor único de Primero Digital. Cuidamos cada detalle desde el huerto hasta tu mesa. 🍽️\n\nCTA: Cuéntanos, ¿con quién compartirías este plato hoy?`;
    }
  } else if (isBelleza) {
    hashtags = ['#BeautyTips', '#SkincareEcuador', '#SpaDay', '#CuidadoPersonal'];
    if (tipo === 'reel' || tipo === 'tiktok') {
      copy = `🎬 [REEL/TIKTOK] GANCHO (3s): 3 errores en tu rutina de skincare que están resecando tu piel. 🧴\n\nCONTENIDO: Tutorial rápido aplicando el serum nutritivo de Primero Digital.\n\nCTA: Comparte esto con una amiga que necesite cuidar su piel hoy.`;
    } else if (tipo === 'carrusel') {
      copy = `📸 [CARRUSEL] Rutina nocturna paso a paso para un cutis radiante. ✨\n\nSlide 1: Limpieza profunda\nSlide 2: Tónico equilibrante\nSlide 3: Serum de ácido hialurónico\nSlide 4: Crema hidratante selladora\n\nCTA: Toca dos veces si te sirvió esta rutina.`;
    } else if (tipo === 'historia') {
      copy = `📱 [HISTORIA] ¡Últimos turnos disponibles para este fin de semana en spa! 💆‍♀️\n\nIdea: Sticker de enlace "Agendar Cita".\n\nCopy: Consiéntete como te lo mereces.`;
    } else {
      copy = `🖼️ [POST] Regálate un momento de bienestar absoluto. En Primero Digital cuidamos tu belleza natural con tratamientos personalizados. ✨\n\nCTA: Escríbenos por mensaje directo para una evaluación gratuita de tu tipo de piel.`;
    }
  } else if (isProfessional) {
    hashtags = ['#ConsultoriaB2B', '#EstrategiaLegal', '#ServiciosProfesionales', '#LiderazgoEmpresarial'];
    if (tipo === 'reel' || tipo === 'tiktok') {
      copy = `🎬 [REEL/TIKTOK] GANCHO (3s): La cláusula oculta que podría anular tu contrato de servicios profesionales. 📝\n\nCONTENIDO: Explicación de experto sobre validez contractual y protección de propiedad intelectual.\n\nCTA: Envíanos un DM para asesorarte en la redacción de contratos.`;
    } else if (tipo === 'carrusel') {
      copy = `📸 [CARRUSEL] Guía práctica: 3 indicadores clave de rendimiento (KPIs) en tu negocio. 📊\n\nSlide 1: Margen bruto por cliente\nSlide 2: Costo de Adquisición de Clientes (CAC)\nSlide 3: Tasa de Retención de Clientes\n\nCTA: Desliza y guarda esta información clave para tu junta directiva.`;
    } else if (tipo === 'historia') {
      copy = `📱 [HISTORIA] ¿Conoces el porcentaje de riesgo fiscal de tu empresa este año? 💼\n\nIdea: Sticker de barra interactiva.\n\nCopy: Conversa con uno de nuestros consultores haciendo clic aquí.`;
    } else {
      copy = `🖼️ [POST] Evita contingencias y multas innecesarias en tu operación. Nuestro equipo legal y corporativo audita y protege tu negocio paso a paso. 💼\n\nCTA: Agenda una llamada de diagnóstico sin costo tocando el enlace del perfil.`;
    }
  } else if (isRetail) {
    hashtags = ['#EcommerceEcuador', '#ModaTendencia', '#TiendaOnline', '#EstiloUnico'];
    if (tipo === 'reel' || tipo === 'tiktok') {
      copy = `🎬 [REEL/TIKTOK] GANCHO (3s): ¿Cómo combinar nuestro abrigo estrella para 3 ocasiones distintas? 🧥\n\nCONTENIDO: Oufits de oficina, casual y noche.\n\nCTA: Comenta tu favorito (1, 2 o 3) y te enviamos la guía de precios.`;
    } else if (tipo === 'carrusel') {
      copy = `📸 [CARRUSEL] Desliza para ver la nueva colección de temporada de Primero Digital. 🛍️\n\nSlide 1: Paleta de colores cálidos\nSlide 2: Prendas esenciales de algodón\nSlide 3: Accesorios sugeridos\n\nCTA: Compra en línea con envío gratuito por esta semana.`;
    } else if (tipo === 'historia') {
      copy = `📱 [HISTORIA] ¡Últimos turnos disponibles de nuestra mochila impermeable! 🎒\n\nIdea: Sticker de cuenta regresiva.\n\nCopy: Toca el enlace para ordenar antes de que se agoten.`;
    } else {
      copy = `🖼️ [POST] Diseños exclusivos pensados para durar. Fabricamos cada prenda con materiales sustentables y acabados premium. 🛍️\n\nCTA: Haz clic en nuestra biografía para explorar toda la tienda.`;
    }
  } else if (isInmob) {
    hashtags = ['#BienesRaices', '#InversionesInmobiliarias', '#CasaPropia', '#HogarDigital'];
    if (tipo === 'reel' || tipo === 'tiktok') {
      copy = `🎬 [REEL/TIKTOK] GANCHO (3s): ¿Buscas un departamento con esta espectacular terraza en la ciudad? 🏢\n\nCONTENIDO: Tour rápido mostrando las amenidades y acabados de lujo.\n\nCTA: Envíanos un mensaje directo para cotizar y ver planes de financiamiento.`;
    } else if (tipo === 'carrusel') {
      copy = `📸 [CARRUSEL] 3 factores clave para calcular la plusvalía de tu próxima inversión. 🏠\n\nSlide 1: Ubicación y vías de acceso\nSlide 2: Proyectos comerciales cercanos\nSlide 3: Tasa de arriendo promedio de la zona\n\nCTA: Guarda este carrusel estratégico antes de comprar.`;
    } else if (tipo === 'historia') {
      copy = `📱 [HISTORIA] ¿Prefieres vivir en el norte o en los valles? 🌳vs🏢\n\nIdea: Encuesta interactiva.\n\nCopy: Conoce nuestros proyectos activos haciendo clic en el enlace.`;
    } else {
      copy = `🖼️ [POST] Tu próximo hogar te está esperando. Primero Digital presenta el nuevo complejo residencial con facilidades de entrega. 🏠\n\nCTA: Agenda una visita presencial este fin de semana escribiéndonos por DM.`;
    }
  } else {
    hashtags = ['#EstrategiaDigital', '#PrimeroDigital', '#ContenidoDeValor', '#MarketingDigital'];
    if (tipo === 'reel' || tipo === 'tiktok') {
      copy = `🎬 [REEL/TIKTOK] GANCHO (3s): El gran error de marketing que te cuesta clientes todos los días. 📉\n\nCONTENIDO: Análisis estratégico de embudo de ventas y CTA confuso.\n\nCTA: Comparte esto para que otros emprendedores eviten este error.`;
    } else if (tipo === 'carrusel') {
      copy = `📸 [CARRUSEL] Desliza para aprender cómo estructurar una oferta de alto valor. 🚀\n\nSlide 1: Identificación del problema real\nSlide 2: Transformación del cliente\nSlide 3: Entrega y bonos estratégicos\n\nCTA: Guarda este post y empieza a vender más hoy.`;
    } else if (tipo === 'historia') {
      copy = `📱 [HISTORIA] ¿Tienes clara tu meta de ventas para este mes? 📈\n\nIdea: Encuesta de barra.\n\nCopy: Descubre cómo te ayudamos a lograrla tocando aquí.`;
    } else {
      copy = `🖼️ [POST] Creamos y optimizamos el ecosistema digital de tu marca. Primero Digital te ayuda a automatizar procesos y escalar tu visibilidad. 🚀\n\nCTA: Escríbenos para conversar sobre tu estrategia digital.`;
    }
  }

  if (objetivo === 'conversion') {
    copy += `\n\n🎯 OFERTA POR TIEMPO LIMITADO: Obtén un diagnóstico gratis haciendo clic en el link de la biografía.`;
  }

  return { copy, hashtags };
}

function getFunnelStage(tipo: ContentType, objetivo: MarketingObjective | undefined, idx: number): 'reconocimiento' | 'consideracion' | 'conversion' | 'remarketing' {
  if (objetivo === 'alcance' || objetivo === 'lanzamiento') {
    if (tipo === 'reel' || tipo === 'tiktok') return 'reconocimiento';
    if (tipo === 'carrusel') return 'consideracion';
    if (tipo === 'historia') return 'consideracion';
    return idx % 3 === 0 ? 'conversion' : 'reconocimiento';
  }
  if (objetivo === 'conversion') {
    if (tipo === 'carrusel' || tipo === 'post_imagen') {
      return idx % 2 === 0 ? 'conversion' : 'remarketing';
    }
    if (tipo === 'reel' || tipo === 'tiktok') return 'consideracion';
    return 'conversion';
  }
  if (objetivo === 'comunidad') {
    if (tipo === 'historia') return 'consideracion';
    if (tipo === 'carrusel') return 'consideracion';
    if (tipo === 'reel' || tipo === 'tiktok') return 'reconocimiento';
    return 'consideracion';
  }
  // Fallback
  if (tipo === 'reel' || tipo === 'tiktok') return 'reconocimiento';
  if (tipo === 'carrusel') return 'consideracion';
  return idx % 2 === 0 ? 'conversion' : 'consideracion';
}

function getCTA(stage: string): string {
  switch (stage) {
    case 'reconocimiento': return 'Guarda este post o compártelo con alguien que lo necesite';
    case 'consideracion': return 'Cuéntanos en los comentarios: ¿cuál ha sido tu experiencia con este tema?';
    case 'conversion': return 'Haz clic en el enlace de nuestro perfil para agendar tu asesoría o cotizar';
    case 'remarketing': return 'Envíanos un mensaje directo ahora para asegurar tu cupo especial';
    default: return 'Síguenos para no perderte las próximas actualizaciones';
  }
}

// Ajuste de puntaje por objetivo de marketing
function objectiveBoost(objetivo?: MarketingObjective, tipo?: ContentType, dow?: number): number {
  if (!objetivo || !tipo || dow === undefined) return 0;
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

function generateStrategicExplanation(
  tipo: ContentType,
  stage: string,
  objetivo: MarketingObjective,
  dow: number,
  hora: string,
  plataforma: Platform,
  industria: string
): string {
  const dowName = DAY_NAMES[dow];
  const ind = (industria || '').toLowerCase();
  
  let targetAudience = 'los usuarios';
  let platformReason = '';
  
  if (ind.includes('gastro') || ind.includes('food') || ind.includes('restaur')) {
    targetAudience = 'comensales hambrientos buscando opciones locales';
    if (plataforma === 'instagram') {
      platformReason = 'El algoritmo de Instagram favorece el antojo gastronómico visual en formato vertical.';
    } else if (plataforma === 'tiktok') {
      platformReason = 'La sección "Para ti" de TikTok impulsa la virilidad de platos preparados y recetas rápidas.';
    }
  } else if (ind.includes('b2b') || ind.includes('saas') || ind.includes('legal') || ind.includes('consult') || ind.includes('servicios')) {
    targetAudience = 'tomadores de decisión y profesionales corporativos';
    if (plataforma === 'linkedin') {
      platformReason = 'LinkedIn premia carruseles nativos en formato PDF por su alto tiempo de permanencia (dwell time).';
    } else if (plataforma === 'instagram') {
      platformReason = 'Instagram humaniza la marca corporativa mostrando el equipo y los procesos operativos.';
    }
  } else if (ind.includes('retail') || ind.includes('moda') || ind.includes('ecommerce') || ind.includes('tienda')) {
    targetAudience = 'compradores buscando inspiración y tendencias';
    platformReason = 'Las plataformas premian los carruseles de productos porque permiten la doble visualización en el feed principal.';
  }

  let stageGoal = '';
  if (stage === 'reconocimiento') {
    stageGoal = 'captar la atención de audiencias frías y expandir el alcance de la marca';
  } else if (stage === 'consideracion') {
    stageGoal = 'generar confianza, educar sobre tus diferenciales y retener al prospecto';
  } else if (stage === 'conversion') {
    stageGoal = 'incentivar el contacto directo o la compra inmediata con un CTA explícito';
  } else {
    stageGoal = 'reactivar y recordar el valor de tu oferta a usuarios templados que ya mostraron interés';
  }

  const timeReason = dow >= 5 
    ? 'aprovechando el mayor ocio y desconexión del fin de semana' 
    : 'capturando el tráfico de alta atención durante la semana laboral';

  return `Programado el ${dowName} a las ${hora} vía ${plataforma} alineado al objetivo de ${objetivo}. Este formato de ${tipo} se enfoca en la etapa de ${stage} para dirigir la comunicación a ${targetAudience} y ${stageGoal}. ${platformReason} Publicación oportuna ${timeReason}.`;
}

export function generatePlan(input: PlanInput): PlanResult {
  const { client, year, month, objetivo, extraEvents = [] } = input;
  const profile = getIndustryProfile(client.tipo_mercado ?? client.industria);
  const redes = client.redes_contratadas ?? ['instagram'];
  const distribucion = client.distribucion_piezas ?? {};
  
  const todayVal = new Date();
  const isCurrentMonth = todayVal.getFullYear() === year && todayVal.getMonth() === month;

  // Cargar eventos del mes y el siguiente si es móvil
  let events = getMonthEvents(year, month, client.industria ?? 'General', client.id, extraEvents);
  if (isCurrentMonth) {
    const nextMonthVal = month === 11 ? 0 : month + 1;
    const nextYearVal = month === 11 ? year + 1 : year;
    const nextEvents = getMonthEvents(nextYearVal, nextMonthVal, client.industria ?? 'General', client.id, extraEvents);
    events = [...events, ...nextEvents];
  }
  const eventByDateStr = new Map<string, SmartEvent>();
  events.forEach(ev => eventByDateStr.set(ev.fecha, ev));

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Generar rango de fechas a planificar
  const rawDates: { year: number; month: number; day: number; dateStr: string }[] = [];
  if (isCurrentMonth) {
    for (let i = 0; i < 30; i++) {
      const d = new Date(year, month, todayVal.getDate() + i);
      rawDates.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        day: d.getDate(),
        dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      });
    }
  } else {
    for (let d = 1; d <= daysInMonth; d++) {
      rawDates.push({
        year,
        month,
        day: d,
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      });
    }
  }

  // Filtrar para planificar estrictamente desde hoy en adelante (sin generar hacia el pasado)
  const todayZero = new Date();
  todayZero.setHours(0, 0, 0, 0);
  const datesToPlan = rawDates.filter(d => {
    const target = new Date(d.year, d.month, d.day);
    return target >= todayZero;
  });

  const queue: ContentType[] = [];
  const strongOrder: ContentType[] = ['reel', 'post_video', 'tiktok', 'carrusel', 'post_imagen', 'historia', 'historia_video'];
  const sortedTypes = (Object.entries(distribucion) as [ContentType, number][])
    .sort((a, b) => strongOrder.indexOf(a[0]) - strongOrder.indexOf(b[0]));
  
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

  const piecesPerDateStr = new Map<string, ContentType[]>();
  const proposed: ProposedPiece[] = [];

  const scoreDay = (targetDate: typeof datesToPlan[number], tipo: ContentType, pieceIndex: number): number => {
    const dateObj = new Date(targetDate.year, targetDate.month, targetDate.day);
    const dow = dateObj.getDay();
    const base = (profile.dayScores[tipo] ?? GENERIC_PROFILE.dayScores[tipo] ?? [3,3,3,3,3,3,3])[dow];
    let score = base + objectiveBoost(objetivo, tipo, dow);
    
    // Penalización para domingos (relegar a menor prioridad editorial)
    if (dow === 0) {
      score -= 4.0;
    }
    
    const dateStr = targetDate.dateStr;
    const ev = eventByDateStr.get(dateStr);
    if (ev) score += 3.5;
    
    const used = piecesPerDateStr.get(dateStr)?.length ?? 0;
    score -= used * 4.5;
    
    if (tipo !== 'historia' && tipo !== 'historia_video') {
      const prevDate = new Date(targetDate.year, targetDate.month, targetDate.day - 1);
      const prevDateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;
      const nextDate = new Date(targetDate.year, targetDate.month, targetDate.day + 1);
      const nextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
      
      const prev = piecesPerDateStr.get(prevDateStr) ?? [];
      const next = piecesPerDateStr.get(nextDateStr) ?? [];
      if (prev.includes(tipo) || next.includes(tipo)) score -= 3.5;
    }
    
    const index = datesToPlan.findIndex(d => d.dateStr === dateStr);
    const week = Math.floor(index / 7);
    const inWeek = proposed.filter((p, pIdx) => Math.floor(pIdx / 7) === week && p.tipo === tipo).length;
    score -= inWeek * 2.0;

    const sameDowPrevWeeks = proposed.some(p => {
      const pDate = new Date(p.fecha + 'T12:00:00');
      const pDow = pDate.getDay();
      const diffMs = Math.abs(dateObj.getTime() - pDate.getTime());
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return p.tipo === tipo && pDow === dow && diffDays <= 7;
    });
    if (sameDowPrevWeeks) score -= 3.0;

    // Distribución Uniforme Slot-Balancing
    const idealIndex = Math.floor((pieceIndex * datesToPlan.length) / queue.length);
    const distance = Math.abs(index - idealIndex);
    score -= distance * 0.25;

    const jitter = Math.sin(targetDate.day * 13 + tipo.charCodeAt(0)) * 1.5;
    score += jitter;

    return score;
  };

  let pieceIndex = 0;
  for (const tipo of queue) {
    let bestDate = datesToPlan[0];
    let bestScore = -Infinity;
    const maxPerDay = queue.length > datesToPlan.length ? 2 : 1;

    for (const targetDate of datesToPlan) {
      if ((piecesPerDateStr.get(targetDate.dateStr)?.length ?? 0) >= maxPerDay) continue;
      const s = scoreDay(targetDate, tipo, pieceIndex);
      if (s > bestScore) {
        bestScore = s;
        bestDate = targetDate;
      }
    }
    
    const date = new Date(bestDate.year, bestDate.month, bestDate.day);
    const dow = date.getDay();
    const evento = eventByDateStr.get(bestDate.dateStr);
    const notaBase = profile.notas[tipo] ?? GENERIC_PROFILE.notas[tipo] ?? 'distribución estratégica del formato';
    const stage = getFunnelStage(tipo, objetivo, pieceIndex);
    const cta = getCTA(stage);
    const textSuggest = getIndustrySuggestions(client.tipo_mercado ?? client.industria, tipo, objetivo);
    const toneString = client.color_corporativo ? 'Dinámico y corporativo' : 'Profesional y persuasivo';

    const razon = evento
      ? `${cap(tipoLabel(tipo))} el ${DAY_NAMES[dow]} ${bestDate.day}: coincide con ${evento.nombre} — oportunidad de contenido temático.`
      : `${cap(tipoLabel(tipo))} el ${DAY_NAMES[dow]}: ${notaBase}.`;

    const explicacion = generateStrategicExplanation(
      tipo,
      stage,
      objetivo,
      dow,
      profile.horaSugerida[tipo] ?? '12:00',
      pickPlatform(tipo, redes),
      client.tipo_mercado ?? client.industria
    );

    proposed.push({
      tempId: `prop-${proposed.length + 1}`,
      tipo,
      fecha: bestDate.dateStr,
      hora: profile.horaSugerida[tipo] ?? '12:00',
      plataforma: pickPlatform(tipo, redes),
      razon_estrategica: razon,
      evento,
      objetivo_marketing: objetivo,
      etapa_embudo: stage,
      cta_propuesto: cta,
      tono_sugerido: toneString,
      explicacion_estrategica: explicacion,
      copy_sugerido: textSuggest.copy,
      hashtags_sugeridos: textSuggest.hashtags
    });
    
    const arr = piecesPerDateStr.get(bestDate.dateStr) ?? [];
    arr.push(tipo);
    piecesPerDateStr.set(bestDate.dateStr, arr);
    pieceIndex++;
  }

  proposed.sort((a, b) => a.fecha.localeCompare(b.fecha));

  const emptyDays: number[] = [];
  datesToPlan.forEach(d => {
    if (!piecesPerDateStr.has(d.dateStr)) {
      emptyDays.push(d.day);
    }
  });

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
