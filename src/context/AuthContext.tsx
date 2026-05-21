import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

export type AuthContextValue = {
  isAuthenticated: boolean;
  readOnly: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  isAuthenticated,
}: {
  children: ReactNode;
  isAuthenticated: boolean;
}) {
  const value = useMemo(
    (): AuthContextValue => ({
      isAuthenticated,
      readOnly: !isAuthenticated,
    }),
    [isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return value;
}
