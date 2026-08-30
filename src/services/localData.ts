import type { Invoice } from "./invoice";
const prefix = "nexus-tools-";
export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(prefix + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
export function saveLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(prefix + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function removeLocal(key: string) {
  try {
    localStorage.removeItem(prefix + key);
    return true;
  } catch {
    return false;
  }
}
export function readDraft(): Invoice | null {
  const v = readLocal<Partial<Invoice> | null>("invoice-draft", null);
  if (
    !v ||
    !["seller", "customer", "number", "date", "currency", "tax"].every(
      (k) => typeof v[k as keyof Invoice] === "string",
    ) ||
    !Array.isArray(v.items) ||
    v.items.length < 1 ||
    v.items.length > 30 ||
    v.items.some(
      (i) =>
        !i ||
        !["description", "quantity", "price"].every(
          (k) => typeof i[k as keyof typeof i] === "string",
        ),
    ) ||
    !["THB", "USD", "EUR"].includes(v.currency!)
  )
    return null;
  return {
    ...v,
    logo:
      typeof v.logo === "string" &&
      /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(v.logo) &&
      v.logo.length < 1000000
        ? v.logo
        : undefined,
  } as Invoice;
}
