import '@fontsource-variable/inter/opsz.css';
import '@fontsource-variable/jetbrains-mono';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { applyTheme, useSettingsStore } from '@/features/settings';
import './index.css';

// Before anything is drawn: a dark app must not flash white while it starts
applyTheme(useSettingsStore.getState().theme);

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
