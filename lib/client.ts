export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "Не удалось выполнить запрос. Попробуйте ещё раз.");
  return data as T;
}
export const rubles = (value: number) => `${value.toLocaleString("ru-RU")} ₽`;
export const walkText = (minutes: number) => `≈ ${minutes} мин пешком`;
