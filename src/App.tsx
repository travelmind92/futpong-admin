import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ExerciseForm } from './components/ExerciseForm';
import { ExercisesLayout } from './panels/ExercisesLayout';
import { ExercisesListPage } from './panels/ExercisesListPage';
import { Exercises2Panel } from './panels/Exercises2Panel';
import { MappingsPanel } from './panels/MappingsPanel';
import { RoutineForm } from './components/RoutineForm';
import { RoutinesLayout } from './panels/RoutinesLayout';
import { RoutinesListPage } from './panels/RoutinesListPage';
import './App.css';
import { buildCognitoLoginUrl, buildCognitoLogoutUrl } from './services/api/cognito';
import { clearSession, getEmailFromIdToken, isAuthenticated } from './auth/auth';
import { AuthProvider } from './context/AuthContext';
import {
  AppVersionProvider,
  defaultPathForVersion,
  isV2Path,
  isV3Path,
  useAppVersion,
  type AppVersion,
} from './context/AppVersionContext';
import { ExercisesProvider } from './context/ExercisesContext';
import { RoutinesProvider } from './context/RoutinesContext';
import { exchangeCode } from './services/api/api';

const menuItems: {
  to: string;
  labelKey: string;
  version: AppVersion;
  icon: React.ReactNode;
}[] = [
  {
    to: '/routines',
    labelKey: 'nav.routines',
    version: 'v2',
    icon: (
      <svg
        className="nav-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    to: '/exercises',
    labelKey: 'nav.exercises',
    version: 'v2',
    icon: (
      <svg
        className="nav-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 7v10M3.5 8.5v7M8.5 8.5v7M18 7v10M15.5 8.5v7M20.5 8.5v7M8.5 12h7" />
      </svg>
    ),
  },
  {
    to: '/exercises2',
    labelKey: 'nav.exercises2',
    version: 'v3',
    icon: (
      <svg
        className="nav-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 7v10M3.5 8.5v7M8.5 8.5v7M18 7v10M15.5 8.5v7M20.5 8.5v7M8.5 12h7" />
      </svg>
    ),
  },
  {
    to: '/mappings',
    labelKey: 'nav.mappings',
    version: 'v2',
    icon: (
      <svg
        className="nav-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
];

function AppShell({ onLogout }: { onLogout: () => void }) {
  const { t } = useTranslation();
  const userEmail = getEmailFromIdToken();
  const { appVersion, setAppVersion } = useAppVersion();
  const location = useLocation();
  const navigate = useNavigate();

  const visibleMenuItems = menuItems.filter((item) => item.version === appVersion);
  const defaultPath = defaultPathForVersion(appVersion);

  useEffect(() => {
    if (appVersion === 'v3' && isV2Path(location.pathname)) {
      navigate('/exercises2', { replace: true });
      return;
    }
    if (appVersion === 'v2' && isV3Path(location.pathname)) {
      navigate('/routines', { replace: true });
    }
  }, [appVersion, location.pathname, navigate]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-start">
          <h1 className="app-title">
            <span className="app-title-brand">
              <span className="app-title-brand-fut">FUT</span>
              <span className="app-title-brand-rest">PONG APP</span>
            </span>
            <span className="app-title-admin">{t('common.admin')}</span>
          </h1>

          <label className="app-version-select-wrap">
            <select
              className="app-version-select"
              value={appVersion}
              onChange={(e) => setAppVersion(e.target.value as AppVersion)}
              aria-label={t('common.version')}
            >
              <option value="v3">v3</option>
              <option value="v2">v2</option>
            </select>
          </label>
        </div>

        <div className="app-header-actions">
          {userEmail ? (
            <span className="app-header-user-email" title={userEmail}>
              {userEmail}
            </span>
          ) : null}
          <button
            type="button"
            className="app-header-auth-btn app-header-auth-btn--logout"
            onClick={onLogout}
          >
            {t('auth.logout')}
          </button>
        </div>
      </header>

      <div className="app-body">
        <aside className="app-sidebar" aria-label={t('nav.main')}>
          <nav className="app-nav">
            <ul className="app-nav-list">
              {visibleMenuItems.map(({ to, labelKey, icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `app-nav-item${isActive ? ' is-active' : ''}`
                    }
                  >
                    {icon}
                    <span>{t(labelKey)}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to={defaultPath} replace />} />
            <Route path="/routines" element={<RoutinesLayout />}>
              <Route index element={<RoutinesListPage />} />
              <Route path="new" element={<RoutineForm />} />
              <Route path=":id/edit" element={<RoutineForm />} />
            </Route>
            <Route path="/exercises" element={<ExercisesLayout />}>
              <Route index element={<ExercisesListPage />} />
              <Route path="new" element={<ExerciseForm />} />
              <Route path=":id/edit" element={<ExerciseForm />} />
            </Route>
            <Route path="/exercises2" element={<Exercises2Panel />} />
            <Route path="/mappings" element={<MappingsPanel />} />
            <Route path="*" element={<Navigate to={defaultPath} replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const cognitoOauthCodeRef = useRef<string | null | undefined>(undefined);
  if (cognitoOauthCodeRef.current === undefined) {
    cognitoOauthCodeRef.current = new URLSearchParams(window.location.search).get(
      'code'
    );
  }

  const oauthCode = cognitoOauthCodeRef.current;
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated());
  const [authLoading, setAuthLoading] = useState(
    () => Boolean(oauthCode) && !isAuthenticated()
  );

  const handleLogout = () => {
    clearSession();
    setAuthenticated(false);
    window.location.href = buildCognitoLogoutUrl();
  };

  useEffect(() => {
    if (authenticated || authLoading) {
      return;
    }
    window.location.replace(buildCognitoLoginUrl());
  }, [authenticated, authLoading]);

  useEffect(() => {
    const code = oauthCode;
    if (!code || authenticated) {
      return;
    }

    const exchangeKey = `cognito_code_used_${code}`;
    if (sessionStorage.getItem(exchangeKey)) {
      return;
    }

    sessionStorage.setItem(exchangeKey, 'true');
    setAuthLoading(true);

    const stripOAuthParamsFromUrl = () => {
      window.history.replaceState({}, document.title, window.location.pathname || '/');
    };

    exchangeCode(code)
      .then((tokens) => {
        localStorage.setItem('id_token', tokens.id_token);
        localStorage.setItem('access_token', tokens.access_token);
        setAuthenticated(true);
        stripOAuthParamsFromUrl();
      })
      .catch((err) => {
        console.error(err);
        stripOAuthParamsFromUrl();
        window.location.replace(buildCognitoLoginUrl());
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, [oauthCode, authenticated]);

  if (!authenticated) {
    return null;
  }

  return (
    <AuthProvider isAuthenticated>
      <AppVersionProvider>
        <RoutinesProvider>
          <ExercisesProvider>
            <AppShell onLogout={handleLogout} />
          </ExercisesProvider>
        </RoutinesProvider>
      </AppVersionProvider>
    </AuthProvider>
  );
}

export default App;
