import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { DynamoServicesProvider } from './context/DynamoServicesProvider';
import { ExercisesProvider } from './context/ExercisesContext';
import { RoutinesProvider } from './context/RoutinesContext';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <DynamoServicesProvider>
        <RoutinesProvider>
          <ExercisesProvider>
            <App />
          </ExercisesProvider>
        </RoutinesProvider>
      </DynamoServicesProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
