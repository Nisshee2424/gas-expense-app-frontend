import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { PrimeReactProvider } from 'primereact/api';

import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";

import './index.css'
import App from './App.tsx'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

if (!CLIENT_ID) {
  console.warn('VITE_GOOGLE_CLIENT_ID is not defined');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <PrimeReactProvider>
        <App />
      </PrimeReactProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
