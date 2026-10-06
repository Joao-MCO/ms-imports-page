export async function getApiErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.error === "string" && data.error.trim()) return data.error;
  } catch {
    // resposta sem corpo JSON
  }
  return fallback;
}