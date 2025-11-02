import React, { useState, useEffect } from 'react';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { Store } from './components/Store';
import { Home } from './components/Home';
import { VendorAuthForm } from './components/VendorAuthForm';
import { VendorDashboard } from './components/VendorDashboard';
import { AdminPanel } from './components/AdminPanel';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { Settings, Store as StoreIcon, ShieldCheck } from 'lucide-react';

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [view, setView] = useState<'auth' | 'store' | 'dashboard' | 'home' | 'vendor-auth' | 'vendor-dashboard' | 'admin'>('home');

  useEffect(() => {
    // Check for existing session
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { getSupabaseClient } = await import('./utils/supabase/client');
      const supabase = getSupabaseClient();

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        setAccessToken(session.access_token);
        setUserId(session.user.id);
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  };

  const handleAuthSuccess = (token: string, id: string) => {
    setAccessToken(token);
    setUserId(id);
    setView('home');
  };

  const handleLogout = async () => {
    try {
      const { getSupabaseClient } = await import('./utils/supabase/client');
      const supabase = getSupabaseClient();

      await supabase.auth.signOut();
      setAccessToken(null);
      setUserId(null);
      setView('home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (view === 'auth') {
    return (
      <>
        <AuthForm onAuthSuccess={handleAuthSuccess} />
        <Toaster />
      </>
    );
  }

  if (view === 'vendor-auth') {
    return (
      <>
        <VendorAuthForm onAuthSuccess={(token, id) => {
          setAccessToken(token);
          setUserId(id);
          setView('vendor-dashboard');
        }} />
        <Toaster />
      </>
    );
  }

  if (view === 'vendor-dashboard') {
    return (
      <>
        <VendorDashboard 
          accessToken={accessToken!} 
          onLogout={handleLogout} 
        />
        <Button
          className="fixed bottom-6 right-6"
          onClick={() => setView('home')}
        >
          Voltar à Home
        </Button>
        <Toaster />
      </>
    );
  }

  if (view === 'admin') {
    return (
      <>
        <AdminPanel 
          accessToken={accessToken!} 
          onLogout={handleLogout} 
        />
        <Button
          className="fixed bottom-6 right-6"
          onClick={() => setView('home')}
        >
          Voltar à Home
        </Button>
        <Toaster />
      </>
    );
  }

  return (
    <>
      {view === 'home' && (
        <div className="relative">
          <Home
            onNavigate={(newView) => setView(newView)}
            accessToken={accessToken}
            onLogout={handleLogout}
            onShowAuth={() => setView('auth')}
          />
          {accessToken && (
            <Button
              className="fixed bottom-6 right-6 rounded-full h-14 w-14"
              onClick={() => setView('dashboard')}
            >
              <Settings className="h-6 w-6" />
            </Button>
          )}
        </div>
      )}

      {view === 'store' && (
        <div className="relative">
          <Store
            accessToken={accessToken}
            onLogout={handleLogout}
            onShowAuth={() => setView('auth')}
            onNavigateHome={() => setView('home')}
          />
          {accessToken && (
            <Button
              className="fixed bottom-6 right-6 rounded-full h-14 w-14"
              onClick={() => setView('dashboard')}
            >
              <Settings className="h-6 w-6" />
            </Button>
          )}
        </div>
      )}

      {view === 'dashboard' && (
        <div className="relative">
          <Dashboard accessToken={accessToken!} onLogout={handleLogout} />
          <div className="fixed bottom-6 right-6 flex gap-2">
            <Button onClick={() => setView('vendor-dashboard')}>
              <StoreIcon className="h-4 w-4 mr-2" />
              Vendedor
            </Button>
            <Button onClick={() => setView('admin')}>
              <ShieldCheck className="h-4 w-4 mr-2" />
              Admin
            </Button>
            <Button onClick={() => setView('home')}>
              Voltar à Home
            </Button>
          </div>
        </div>
      )}

      <Toaster />
    </>
  );
}
