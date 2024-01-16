export async function fetchJSON<T>(
  resource: RequestInfo,
  init?: RequestInit | undefined
): Promise<T> {
  const response = await fetch(resource, init);
  const data = (await response.json()) as T;

  return data;
}
