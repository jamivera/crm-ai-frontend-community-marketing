// Smart hashtag suggester — uses content metadata to generate relevant hashtags
// When a real API is wired up, replace the body of suggestHashtags() with an API call

interface HashtagSuggestion {
  alcance: string[];   // high-reach, broad
  nicho: string[];     // specific to industry/city
  conversion: string[]; // action-oriented
  marca: string[];     // brand / client
}

interface SuggestInput {
  copy?: string;
  clientNombre: string;
  industria: string;
  tipo: string;         // reel, carrusel, post_imagen, historia, …
  plataforma: string;   // instagram, facebook, tiktok, …
  ciudad?: string;
  pais?: string;
}

// ─── Industry → hashtag banks ─────────────────────────────────────────────────

const INDUSTRY_BANKS: Record<string, { alcance: string[]; nicho: string[] }> = {
  gastronomia: {
    alcance: ['#Gastronomia', '#FoodLovers', '#Foodie', '#ComiendoBien', '#ChefLife'],
    nicho:   ['#CocinaEcuatoriana', '#RestauranteQuito', '#GastronomiaLocal', '#ChefEcuatoriano', '#SaborEcuador'],
  },
  'tecnología': {
    alcance: ['#Tecnologia', '#Tech', '#StartUp', '#Innovation', '#DigitalTransformation'],
    nicho:   ['#TechEcuador', '#StartUpLatam', '#SaaS', '#SoftwareLatam', '#EmprendimientoTech'],
  },
  'belleza': {
    alcance: ['#Belleza', '#Beauty', '#Skincare', '#MakeUp', '#SelfCare'],
    nicho:   ['#BellezaEcuador', '#SkincareMedellin', '#BeautyQuito', '#CuidadoPersonal', '#MakeUpArtist'],
  },
  'moda': {
    alcance: ['#Moda', '#Fashion', '#Style', '#OOTD', '#FashionBlogger'],
    nicho:   ['#ModaEcuador', '#FashionQuito', '#EstiloLatino', '#ModaLatam', '#DiseñadorEcuatoriano'],
  },
  'salud': {
    alcance: ['#Salud', '#Bienestar', '#Wellness', '#HealthyLifestyle', '#Nutricion'],
    nicho:   ['#SaludEcuador', '#BienestarQuito', '#NutricionSana', '#VidaSaludable', '#FitEcuador'],
  },
  'default': {
    alcance: ['#Marketing', '#SocialMedia', '#ContentCreator', '#Emprendimiento', '#Negocios'],
    nicho:   ['#MarketingDigital', '#EmprendedoresEC', '#NegociosEcuador', '#AgenciaDigital', '#PymesEcuador'],
  },
};

const TYPE_HASHTAGS: Record<string, string[]> = {
  reel:          ['#Reels', '#ReelsInstagram', '#VideoMarketing'],
  carrusel:      ['#Carrusel', '#TipsDeMarketing', '#AprendeConNosotros'],
  post_imagen:   ['#Post', '#ContentMarketing', '#VisualesDeCalidad'],
  historia:      ['#Stories', '#InstagramStories', '#BehindTheScenes'],
  historia_video:['#Stories', '#Reels', '#InstagramVideo'],
  tiktok:        ['#TikTok', '#TikTokMarketing', '#ViralTikTok'],
  default:       ['#ContentMarketing', '#SocialMediaMarketing'],
};

const CONVERSION_BANKS = [
  '#LinkEnBio', '#ReservaAhora', '#Contactanos', '#PreguntaNos',
  '#SiguienosParaMas', '#ComparteCon', '#GuardaEstePost',
  '#AprendeConNosotros', '#UneteANosotros', '#DescubreMore',
];

// ─── Main function ─────────────────────────────────────────────────────────────

function normalizeIndustria(industria: string): string {
  const lower = industria.toLowerCase();
  if (lower.includes('gastro') || lower.includes('comida') || lower.includes('restaur')) return 'gastronomia';
  if (lower.includes('tech') || lower.includes('saas') || lower.includes('software')) return 'tecnología';
  if (lower.includes('belleza') || lower.includes('beauty') || lower.includes('cosmé')) return 'belleza';
  if (lower.includes('moda') || lower.includes('fashion') || lower.includes('ropa')) return 'moda';
  if (lower.includes('salud') || lower.includes('health') || lower.includes('bienes')) return 'salud';
  return 'default';
}

function extractCopyKeywords(copy: string): string[] {
  if (!copy) return [];
  // Extract meaningful words (>4 chars, no stopwords)
  const stopwords = new Set(['para', 'este', 'esta', 'como', 'desde', 'hasta', 'cada', 'todo', 'toda', 'nuestro', 'nuestra', 'también', 'pero', 'porque', 'donde', 'cuando', 'sobre', 'entre', 'bajo']);
  return copy
    .replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4 && !stopwords.has(w.toLowerCase()))
    .slice(0, 3)
    .map(w => `#${w.charAt(0).toUpperCase()}${w.slice(1).toLowerCase()}`);
}

function brandHashtags(clientNombre: string): string[] {
  const clean = clientNombre.replace(/\s+/g, '');
  return [
    `#${clean}`,
    `#${clean}EC`,
    `#${clean}Oficial`,
  ];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pick<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

export async function suggestHashtags(input: SuggestInput): Promise<HashtagSuggestion> {
  // Simulate async AI call (replace with real API when ready)
  await new Promise(r => setTimeout(r, 1400 + Math.random() * 600));

  const industryKey = normalizeIndustria(input.industria);
  const bank = INDUSTRY_BANKS[industryKey] ?? INDUSTRY_BANKS['default'];
  const typeHashtags = TYPE_HASHTAGS[input.tipo] ?? TYPE_HASHTAGS['default'];
  const copyKeywords = extractCopyKeywords(input.copy ?? '');

  // Build ciudad/pais nicho tags
  const localTags = [];
  if (input.ciudad) localTags.push(`#${input.ciudad.replace(/\s/g, '')}`);
  if (input.pais)   localTags.push(`#${input.pais.replace(/\s/g, '')}`);

  return {
    alcance:    pick([...bank.alcance, ...typeHashtags, ...copyKeywords], 5),
    nicho:      pick([...bank.nicho, ...localTags], 4),
    conversion: pick(CONVERSION_BANKS, 3),
    marca:      brandHashtags(input.clientNombre),
  };
}
