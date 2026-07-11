import { useEffect, useMemo, useState } from 'react';
import { getUsersByIds, User } from '../services/api/users';

export function useUsersByIds(userIds: string[]): {
  usersById: Map<string, User>;
  loading: boolean;
} {
  const idsKey = useMemo(
    () => Array.from(new Set(userIds.filter((id) => id))).sort().join(','),
    [userIds]
  );
  const [usersById, setUsersById] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',') : [];
    if (ids.length === 0) {
      setUsersById(new Map());
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const users = await getUsersByIds(ids);
        if (!cancelled) {
          setUsersById(new Map(users.map((user) => [user.id, user])));
        }
      } catch {
        if (!cancelled) {
          setUsersById(new Map());
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  return { usersById, loading };
}
