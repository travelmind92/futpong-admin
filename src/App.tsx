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
      <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
        />
      </svg>
    ),
  },
  {
    to: '/exercises',
    label: 'Exercises',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M20.57 14.86 22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 5.57 2 7.71 3.43 9.14 2 10.57 3.43 12 7 8.43 15.57 12 19.14 13.43 20.57 12 22 13.43 20.57 14.86 22 16.29 20.57 17.71 19.14 19.14 17.71 20.57 16.29 22 14.86zM7 7c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"
        />
      </svg>
    ),
  },
  {
    to: '/mappings',
    label: 'Mappings',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"
        />
      </svg>
    ),
  },
];

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">FUTPONG APP ADMIN</h1>
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
