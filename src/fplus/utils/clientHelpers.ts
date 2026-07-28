import type { Client, ContentPiece } from '../types';

/**
 * Determina si el contrato o servicios de un cliente incluyen gestión de redes (orgánico).
 */
export function clientIncludesRedes(client: Client): boolean {
  if (!client) return false;
  
  // Si el plan es uno de los estándar tradicionales, incluye redes por defecto.
  if (client.plan_contratado && ['plata', 'oro', 'platinum', 'basico', 'estandar', 'premium', 'enterprise'].includes(client.plan_contratado)) {
    return true;
  }
  
  // Si es un plan personalizado, buscamos si tiene contratado algún servicio de redes/sociales.
  if (client.plan_contratado === 'personalizado') {
    return !!client.servicios_contratados?.some(s => {
      const cat = (s.categoria || '').toLowerCase();
      const nom = (s.nombre || '').toLowerCase();
      return cat.includes('redes') || cat.includes('social') || nom.includes('redes') || nom.includes('social') || nom.includes('post');
    });
  }
  
  return false;
}

/**
 * Determina si el contrato o servicios de un cliente incluyen pauta publicitaria (Ads).
 */
export function clientIncludesPauta(client: Client): boolean {
  if (!client) return false;

  // Si tiene pauta publicitaria explícita distinta de "no_incluye", tiene pauta.
  if (client.pauta_publicitaria && client.pauta_publicitaria !== 'no_incluye') {
    return true;
  }

  // Si es personalizado, evaluamos los servicios contratados de pauta/ads.
  if (client.plan_contratado === 'personalizado') {
    return !!client.servicios_contratados?.some(s => {
      const cat = (s.categoria || '').toLowerCase();
      const nom = (s.nombre || '').toLowerCase();
      return cat.includes('pauta') || cat.includes('ads') || cat.includes('publicidad') || nom.includes('ads') || nom.includes('pauta') || nom.includes('publicidad');
    });
  }

  return false;
}

/**
 * Determina si el contrato o servicios de un cliente incluyen desarrollo web o landing pages.
 */
export function clientIncludesWeb(client: Client): boolean {
  if (!client) return false;

  if (client.plan_contratado === 'personalizado') {
    return !!client.servicios_contratados?.some(s => {
      const cat = (s.categoria || '').toLowerCase();
      const nom = (s.nombre || '').toLowerCase();
      return cat.includes('web') || cat.includes('landing') || cat.includes('desarrollo') || nom.includes('web') || nom.includes('landing') || nom.includes('desarrollo');
    });
  }

  return false;
}

/**
 * Valida la completitud de una pieza de contenido según su tipo/formato.
 */
export function validatePieceCompleteness(piece: ContentPiece): { isComplete: boolean; missing: string[] } {
  const missing: string[] = [];

  // 1. Validar copy (obligatorio para todas las piezas)
  if (!piece.copy_activo || !piece.copy_activo.trim()) {
    missing.push('el texto / copy activo');
  }

  // 2. Validar archivos multimedia (imágenes/videos) según el formato
  const hasFiles = !!piece.archivos && piece.archivos.length > 0 && piece.archivos.some(a => a.url);

  if (!hasFiles) {
    if (piece.tipo === 'reel' || piece.tipo === 'tiktok' || piece.tipo === 'post_video' || piece.tipo === 'historia_video' || piece.tipo === 'short' || piece.tipo === 'video_youtube') {
      missing.push('el archivo de video principal');
    } else if (piece.tipo === 'carrusel') {
      missing.push('las imágenes del carrusel (al menos 1 archivo)');
    } else {
      missing.push('el diseño o imagen principal');
    }
  }

  return {
    isComplete: missing.length === 0,
    missing
  };
}
