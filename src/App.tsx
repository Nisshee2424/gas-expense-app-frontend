import { useState, useEffect } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { ProgressSpinner } from 'primereact/progressspinner';

import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { MonthlyPage } from './pages/MonthlyPage';
import { AnnualPage } from './pages/AnnualPage';
import { getItems } from './api/client';
import type { Item } from './types';

// pull request練習用のコメント

import './index.css'; // App固有のCSSがあれば

type PageType = 'home' | 'monthly' | 'annual';

function App() {
  // localStorageからセッション復元
  const [user, setUser] = useState<any>(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      try {
        return jwtDecode(savedToken);
      } catch {
        localStorage.removeItem('auth_token');
        return null;
      }
    }
    return null;
  });
  const [token, setToken] = useState<string>(() => {
    return localStorage.getItem('auth_token') || '';
  });
  const [activePage, setActivePage] = useState<PageType>('home');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ログイン成功時
  const handleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      const decoded = jwtDecode(credentialResponse.credential);
      setUser(decoded);
      setToken(credentialResponse.credential);
      // localStorageに保存
      localStorage.setItem('auth_token', credentialResponse.credential);
      setError(null);
    }
  };

  // トークンセット後にマスタ取得
  useEffect(() => {
    if (token) {
      fetchMasterData();
    }
  }, [token]);

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const fetchedItems = await getItems();
      setItems(fetchedItems || []);
    } catch (e: any) {
      setError('マスタデータ取得エラー: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    setItems([]);
    setActivePage('home');
    // localStorageからも削除
    localStorage.removeItem('auth_token');
  };

  // 未ログイン時
  if (!user) {
    return (
      <div className="flex flex-column align-items-center justify-content-center h-screen surface-ground p-3">
        <h1 className="text-4xl mb-5">家計簿アプリ</h1>
        <div className="surface-card p-5 border-round shadow-3 login-card">
          <h2 className="text-xl mb-4">Googleでログイン</h2>
          {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <p className="text-red-500 font-bold">
              Error: VITE_GOOGLE_CLIENT_ID が設定されていません。
            </p>
          )}
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => {
              setError('Login Failed');
            }}
          />
          <p className="text-sm mt-3 text-500">
            (Googleログインボタンが表示されない場合は、広告ブロッカー等を無効にしてください)
          </p>
          {error && <p className="text-red-500 mt-3">Error: {error}</p>}
        </div>
      </div>
    );
  }

  // ログイン済み
  return (
    <Layout
      activePage={activePage}
      onNavigate={setActivePage}
      user={user}
      onLogout={handleLogout}
    >
      {loading && (
        <div className="flex justify-content-center p-5">
          <ProgressSpinner />
        </div>
      )}
      {error && <div className="p-3 bg-red-100 text-red-700 border-round mb-3">{error}</div>}

      {!loading && activePage === 'home' && <HomePage items={items} token={token} />}
      {!loading && activePage === 'monthly' && <MonthlyPage items={items} token={token} />}
      {!loading && activePage === 'annual' && <AnnualPage token={token} />}
    </Layout>
  );
}

export default App;
