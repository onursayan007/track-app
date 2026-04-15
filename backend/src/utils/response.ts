// ════════════════════════════════════════════════════════════════════
// Standardized HTTP Response Helpers
// Every API response follows { success, data?, message?, meta? }
// ════════════════════════════════════════════════════════════════════

import { Response } from 'express';

/** Envelope returned by every endpoint */
export interface ApiEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: Record<string, unknown>;
}

// ─── Success helpers ─────────────────────────────────────────────

export function ok<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  const body: ApiEnvelope<T> = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(200).json(body);
}

export function created<T>(res: Response, data: T) {
  return res.status(201).json({ success: true, data } as ApiEnvelope<T>);
}

export function noContent(res: Response) {
  return res.status(204).send();
}

// ─── Error helpers ───────────────────────────────────────────────

export function badRequest(res: Response, message = 'Bad request') {
  return res.status(400).json({ success: false, message } as ApiEnvelope);
}

export function unauthorized(res: Response, message = 'Authentication required') {
  return res.status(401).json({ success: false, message } as ApiEnvelope);
}

export function forbidden(res: Response, message = 'Access denied') {
  return res.status(403).json({ success: false, message } as ApiEnvelope);
}

export function notFound(res: Response, message = 'Resource not found') {
  return res.status(404).json({ success: false, message } as ApiEnvelope);
}

export function conflict(res: Response, message = 'Resource already exists') {
  return res.status(409).json({ success: false, message } as ApiEnvelope);
}

export function serverError(res: Response, message = 'Internal server error') {
  return res.status(500).json({ success: false, message } as ApiEnvelope);
}
