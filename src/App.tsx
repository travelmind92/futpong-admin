import React from 'react';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { ExerciseForm } from './components/ExerciseForm';
import { ExercisesLayout } from './panels/ExercisesLayout';
import { ExercisesListPage } from './panels/ExercisesListPage';
import { MappingsPanel } from './panels/MappingsPanel';
import { RoutineForm } from './components/RoutineForm';
import { RoutinesLayout } from './panels/RoutinesLayout';
import { RoutinesListPage } from './panels/RoutinesListPage';
import './App.css';

const menuItems: { to: string; label: string; icon: React.ReactNode }[] = [
  {
    to: '/routines',
    label: 'Routines',
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
    label: 'Exercises',
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
        <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
  },
  {
    to: '/mappings',
    label: 'Mappings',
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

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">
          <span className="app-title-brand">
            <span className="app-title-brand-fut">FUT</span>
            <span className="app-title-brand-rest">PONG APP</span>
          </span>
          <span className="app-title-admin">Admin</span>
        </h1>
      </header>

      <div className="app-body">
        <aside className="app-sidebar" aria-label="Main navigation">
          <nav className="app-nav">
            <ul className="app-nav-list">
              {menuItems.map(({ to, label, icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `app-nav-item${isActive ? ' is-active' : ''}`
                    }
                  >
                    {icon}
                    <span>{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/routines" replace />} />
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
            <Route path="/mappings" element={<MappingsPanel />} />
            <Route path="*" element={<Navigate to="/routines" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
