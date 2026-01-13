import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { PrimeReactProvider } from 'primereact/api';
import { registerSW } from 'virtual:pwa-register';

import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";

import './index.css'
import App from './App.tsx'

// PWAのサービスワーカーを登録
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('新しいバージョンが利用可能です。更新しますか？')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('アプリをオフラインで使用できます');
  },
});

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
