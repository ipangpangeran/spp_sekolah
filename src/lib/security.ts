/**
 * Cyber Security Utility Helpers for Input Sanitization & Anti-XSS Protection
 */

// Sanitize text inputs from malicious HTML/JS injections
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/javascript:/gi, '')
    .replace(/onerror/gi, '')
    .replace(/onload/gi, '')
    .trim();
}

// Clean alphanumeric for NIS/NISN identifiers
export function sanitizeIdentifier(id: string | null | undefined): string {
  if (!id) return '';
  return String(id).replace(/[^a-zA-Z0-9_-]/g, '').trim();
}
