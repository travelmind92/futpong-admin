import { apiFetch } from './fetch';

export type User = {
  id: string;
  email: string;
};

function normalizeUser(raw: unknown): User | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const id = record.id;
  const email = record.email;
  if (typeof id !== 'string' || !id || typeof email !== 'string' || !email) {
    return null;
  }
  return { id, email };
}

function parseUsersBody(body: unknown): User[] {
  let list: unknown[] = [];
  if (Array.isArray(body)) {
    list = body;
  } else if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const data = record.data ?? record.users;
    if (Array.isArray(data)) {
      list = data;
    }
  }
  return list
    .map(normalizeUser)
    .filter((user): user is User => user !== null);
}

export async function getUsersByIds(userIds: string[]): Promise<User[]> {
  const ids = Array.from(new Set(userIds.filter((id) => id)));
  if (ids.length === 0) {
    return [];
  }
  const params = new URLSearchParams({ userIds: ids.join(',') });
  const res = await apiFetch(`/users?${params.toString()}`, true, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Failed to load users (${res.status})`);
  }
  return parseUsersBody(await res.json());
}
