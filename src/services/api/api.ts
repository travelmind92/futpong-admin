import { ENV } from "../../constants/env";
import { apiFetch } from "./fetch";

export const exchangeCode = async (code: string) => {
  const res = await fetch(`${ENV.AWS_API_GATEWAY_URL}/auth/exchange-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  const data = await res.json();

  if (!data.ok) {
    throw new Error("Failed to exchange code");
  }

  return data.data;
};

function parseListBody<T>(body: unknown, resource: string): T[] {
  if (Array.isArray(body)) {
    return body as T[];
  }
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const list = record.data ?? record[resource];
    if (Array.isArray(list)) {
      return list as T[];
    }
  }
  throw new Error(`Unexpected response for /public/${resource}`);
}

export async function getAll<T>(
  resource: string,
  auth: boolean = false
): Promise<T[]> {
  const segment = resource.replace(/^\/+/, "").replace(/\/+$/, "");
  const path = `/public/${segment}`;
  const res = await apiFetch(path, auth, { method: "GET" });
  if (!res.ok) {
    throw new Error(`Failed to load ${segment} (${res.status})`);
  }
  return parseListBody<T>(await res.json(), segment);
}

export async function save(
  resource: string,
  id: string,
  payload: unknown,
  auth: boolean = true
): Promise<void> {
  const segment = resource.replace(/^\/+/, "").replace(/\/+$/, "");
  const path = `/${segment}/${encodeURIComponent(id)}`;
  const res = await apiFetch(path, auth, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to save ${segment} (${res.status})`);
  }
}
