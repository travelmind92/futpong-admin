import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type AppVersion = 'v2' | 'v3';

export type AppVersionContextValue = {
  appVersion: AppVersion;
  setAppVersion: (version: AppVersion) => void;
};

const AppVersionContext = createContext<AppVersionContextValue | null>(null);

export function AppVersionProvider({ children }: { children: ReactNode }) {
  const [appVersion, setAppVersion] = useState<AppVersion>('v3');

  const value = useMemo(
    (): AppVersionContextValue => ({
      appVersion,
      setAppVersion,
    }),
    [appVersion]
  );

  return (
    <AppVersionContext.Provider value={value}>{children}</AppVersionContext.Provider>
  );
}

export function useAppVersion(): AppVersionContextValue {
  const value = useContext(AppVersionContext);
  if (!value) {
    throw new Error('useAppVersion must be used within AppVersionProvider');
  }
  return value;
}

export function defaultPathForVersion(version: AppVersion): string {
  return version === 'v3' ? '/routines2' : '/routines';
}

export function isV2Path(pathname: string): boolean {
  return (
    pathname === '/routines' ||
    pathname.startsWith('/routines/') ||
    pathname === '/exercises' ||
    pathname.startsWith('/exercises/') ||
    pathname === '/mappings' ||
    pathname.startsWith('/mappings/')
  );
}

export function isV3Path(pathname: string): boolean {
  return (
    pathname === '/exercises2' ||
    pathname.startsWith('/exercises2/') ||
    pathname === '/routines2' ||
    pathname.startsWith('/routines2/') ||
    pathname === '/mappings2' ||
    pathname.startsWith('/mappings2/')
  );
}
