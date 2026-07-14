import { ENV } from "../../constants/env";
import { apiFetch } from "./fetch";

export const exchangeCode = async (code: string) => {
  const res = await fetch(`${ENV.API_BASE_URL}/auth/exchange-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      redirectUri: ENV.AWS_COGNITO_REDIRECT_URI,
    })
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
  const params = new URLSearchParams({ version: "v3" });
  const path = `/public/${segment}?${params.toString()}`;
  const res = await apiFetch(path, auth, { method: "GET" });
  if (!res.ok) {
    throw new Error(`Failed to load ${segment} (${res.status})`);
  }
  return parseListBody<T>(await res.json(), segment);
}

export async function getTrainingBlocksByDayIds<T>(
  dayIds: string[],
  auth: boolean = true
): Promise<T[]> {
  const ids = dayIds.filter((id) => id);
  if (ids.length === 0) {
    return [];
  }
  const params = new URLSearchParams({
    trainingDayIds: ids.join(','),
  });
  const path = `/public/training-blocks?${params.toString()}`;
  const res = await apiFetch(path, auth, { method: "GET" });
  if (!res.ok) {
    throw new Error(`Failed to load training blocks (${res.status})`);
  }
  return parseListBody<T>(await res.json(), "training-blocks");
}

export async function getTrainingDaysByRoutineId<T>(
  routineId: string,
  auth: boolean = true
): Promise<T[]> {
  if (!routineId) {
    return [];
  }
  const params = new URLSearchParams({ routineId });
  const path = `/public/training-days?${params.toString()}`;
  const res = await apiFetch(path, auth, { method: "GET" });
  if (!res.ok) {
    throw new Error(`Failed to load training days (${res.status})`);
  }
  return parseListBody<T>(await res.json(), "training-days");
}

export async function save(
  resource: string,
  id: string,
  payload: unknown | FormData,
  auth: boolean = true
): Promise<unknown> {
  const segment = resource.replace(/^\/+/, "").replace(/\/+$/, "");
  const path = `/${segment}/${encodeURIComponent(id)}`;
  const body =
    payload instanceof FormData ? payload : JSON.stringify(payload);
  const res = await apiFetch(path, auth, {
    method: "PUT",
    body,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `Failed to save ${segment} (${res.status})`);
  }
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export async function remove(
  resource: string,
  id: string,
  auth: boolean = true
): Promise<void> {
  const segment = resource.replace(/^\/+/, "").replace(/\/+$/, "");
  const path = `/${segment}/${encodeURIComponent(id)}`;
  const res = await apiFetch(path, auth, { method: "DELETE" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to remove ${segment} (${res.status})`);
  }
}

async function parseMutationResponse(
  res: Response,
  segment: string,
  action: string
): Promise<unknown> {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `Failed to ${action} ${segment} (${res.status})`);
  }
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export async function bulkSave(
  resource: string,
  items: unknown[],
  auth: boolean = true
): Promise<unknown> {
  const segment = resource.replace(/^\/+/, "").replace(/\/+$/, "");
  if (items.length === 0) {
    return undefined;
  }
  const path = `/${segment}/bulk`;
  const res = await apiFetch(path, auth, {
    method: "PUT",
    body: JSON.stringify(items),
  });
  return parseMutationResponse(res, segment, "bulk save");
}

export async function bulkRemove(
  resource: string,
  ids: string[],
  auth: boolean = true
): Promise<void> {
  const segment = resource.replace(/^\/+/, "").replace(/\/+$/, "");
  if (ids.length === 0) {
    return;
  }
  const path = `/${segment}/bulk`;
  const res = await apiFetch(path, auth, {
    method: "DELETE",
    body: JSON.stringify(ids),
  });
  await parseMutationResponse(res, segment, "bulk remove");
}
