export function getApiErrorMessage(error: unknown, fallback: string): string {
  const err = error as any;
  const payload = err?.error;

  if (typeof payload === 'string' && payload.trim()) return payload;
  if (payload?.message) return payload.message;
  if (payload?.title) return payload.title;

  const errors = payload?.errors;
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors).flat().find(Boolean);
    if (first) return String(first);
  }

  if (err?.message) return err.message;
  return fallback;
}
