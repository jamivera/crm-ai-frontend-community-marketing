// =====================================================================
// N8N WORKFLOW INTEGRATION SERVICE - FPLUS AGENCYOS
// Handles automation triggers, publishing pipelines & instant alerts
// =====================================================================

import type { ContentPiece } from '../types';

const N8N_PUBLISH_WEBHOOK_URL = import.meta.env.VITE_N8N_PUBLISH_WEBHOOK_URL || 'https://n8n.fplus.agency/webhook/publish-trigger';
const N8N_NOTIFICATION_WEBHOOK_URL = import.meta.env.VITE_N8N_NOTIFICATION_WEBHOOK_URL || 'https://n8n.fplus.agency/webhook/client-notification';

/**
 * 1. Triggers the n8n publication pipeline (calls Instagram/Facebook Graph APIs to publish)
 */
export async function triggerPublicationPipeline(piece: ContentPiece): Promise<boolean> {
  const payload = {
    event: 'publication.scheduled_reached',
    piece_id: piece.id,
    nombre: piece.nombre,
    tipo: piece.tipo,
    plataforma: piece.plataforma,
    copy: piece.copy_activo,
    hashtags: piece.hashtags,
    media_url: piece.archivos?.[0]?.url || '',
    client_id: piece.client_id,
    client_nombre: piece.client_nombre,
    fecha_publicacion: piece.fecha_publicacion
  };

  try {
    const res = await fetch(N8N_PUBLISH_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`n8n Publish Webhook rejected payload: ${res.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error triggering publication workflow in n8n:', error);
    return false;
  }
}

/**
 * 2. Triggers the n8n notification pipeline (sends Slack/WhatsApp/Email to client for review)
 */
export async function notifyClientApprovalRequest(piece: ContentPiece): Promise<boolean> {
  const payload = {
    event: 'piece.needs_review',
    piece_id: piece.id,
    nombre: piece.nombre,
    tipo: piece.tipo,
    plataforma: piece.plataforma,
    client_id: piece.client_id,
    client_nombre: piece.client_nombre,
    review_url: `http://localhost:5173/fplus/portal/${piece.client_id}/approvals/${piece.id}`
  };

  try {
    const res = await fetch(N8N_NOTIFICATION_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`n8n Notification Webhook rejected payload: ${res.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error triggering approval notification workflow in n8n:', error);
    return false;
  }
}
