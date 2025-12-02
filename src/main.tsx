import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initNativeEvents } from './services/vpnBridge';

initNativeEvents();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
