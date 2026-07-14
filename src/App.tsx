import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { ExerciseV3Form } from './components/ExerciseV3Form';
import { ExercisesV3Layout } from './panels/ExercisesV3Layout';
import { ExercisesV3ListPage } from './panels/ExercisesV3ListPage';
import { RoutinesV3Layout } from './panels/RoutinesV3Layout';
import { RoutinesV3ListPage } from './panels/RoutinesV3ListPage';
import { MappingsV3ListPage } from './panels/MappingsV3ListPage';
import { RoutineV3DetailPanel } from './components/RoutineV3DetailPanel';
import './App.css';
import { buildCognitoLoginUrl, buildCognitoLogoutUrl } from './services/api/cognito';
import { clearSession, getEmailFromIdToken, isAuthenticated } from './auth/auth';
import { AuthProvider } from './context/AuthContext';
import { exchangeCode } from './services/api/api';

const DEFAULT_PATH = '/routines2';

const menuItems: {
  to: string;
  labelKey: string;
  icon: React.ReactNode;
}[] = [
  {
    to: '/routines2',
    labelKey: 'nav.routines2',
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
    to: '/exercises2',
    labelKey: 'nav.exercises2',
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
    to: '/mappings2',
    labelKey: 'nav.mappings2',
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
        <path d="M16 3h5v5" />
        <path d="M4 20 21 3" />
        <path d="M21 16v5h-5" />
        <path d="M15 15l6 6" />
        <path d="M4 4l5 5" />
      </svg>
    ),
  },
];

function AppShell({ onLogout }: { onLogout: () => void }) {
  const { t } = useTranslation();
  const userEmail = getEmailFromIdToken();

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
              {menuItems.map(({ to, labelKey, icon }) => (
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
            <Route path="/" element={<Navigate to={DEFAULT_PATH} replace />} />
            <Route path="/routines2" element={<RoutinesV3Layout />}>
              <Route index element={<RoutinesV3ListPage />} />
              <Route path=":id" element={<RoutineV3DetailPanel />} />
            </Route>
            <Route path="/exercises2" element={<ExercisesV3Layout />}>
              <Route index element={<ExercisesV3ListPage />} />
              <Route path=":id/edit" element={<ExerciseV3Form />} />
            </Route>
            <Route path="/mappings2" element={<RoutinesV3Layout />}>
              <Route index element={<MappingsV3ListPage />} />
            </Route>
            <Route path="/routines/*" element={<Navigate to={DEFAULT_PATH} replace />} />
            <Route path="/exercises/*" element={<Navigate to="/exercises2" replace />} />
            <Route path="/mappings/*" element={<Navigate to="/mappings2" replace />} />
            <Route path="*" element={<Navigate to={DEFAULT_PATH} replace />} />
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
      <AppShell onLogout={handleLogout} />
    </AuthProvider>
  );
}

export default App;
