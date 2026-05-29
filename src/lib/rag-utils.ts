
export function compactText(text: string, limit = 220) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 1)}…`;
}

export function displayName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

export function formatCurrency(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return 'unpriced';
  return `$${Number(value).toLocaleString('en-US')}`;
}

export function cosineSimilarity(a: number[], b: number[]) {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const valA = a[i] ?? 0;
    const valB = b[i] ?? 0;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Ensure simple data sanitation without external deps for now
export function sanitizeMetadata(metadata: Record<string, unknown>) {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      clean[key] = value;
    } else if (value instanceof Date) {
      clean[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      clean[key] = value.map((v) => String(v));
    } else {
      clean[key] = String(value);
    }
  }
  return clean;
}
