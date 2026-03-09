import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { useSettingsStore } from './store/settingsStore';
import LegalDisclaimerModal from './components/LegalDisclaimerModal';

const UPDATE_INTERVAL_MS = 60 * 60 * 1000; // 60 minutes

export default function App() {
  const theme = useSettingsStore((s) => s.theme);
  const language = useSettingsStore((s) => s.language);
  const [legalOpen, setLegalOpen] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) registrationRef.current = r;
    },
  });

  // Check for SW update on visibility restore and on a 60-min interval
  useEffect(() => {
    const checkUpdate = () => {
      if (document.visibilityState === 'visible') {
        registrationRef.current?.update();
      }
    };

    document.addEventListener('visibilitychange', checkUpdate);
    const interval = setInterval(() => {
      registrationRef.current?.update();
    }, UPDATE_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', checkUpdate);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') html.classList.add('dark');
    else html.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', language);
    html.setAttribute('dir', language === 'en' ? 'ltr' : 'rtl');
  }, [language]);

  useEffect(() => {
    if (!localStorage.getItem('hasAcceptedLegal_v2')) {
      setLegalOpen(true);
    }
  }, []);

  const handleLegalAccept = () => {
    localStorage.setItem('hasAcceptedLegal_v2', '1');
    setLegalOpen(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Analytics />
      <LegalDisclaimerModal isOpen={legalOpen} onAccept={handleLegalAccept} />
      {needRefresh && (
        <div
          className="fixed inset-x-0 top-0 z-[9999] flex items-center justify-between gap-4 bg-red-600 px-5 py-4 shadow-2xl"
          style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
        >
          <span className="text-base font-bold text-white drop-shadow">
            🔄 עדכון זמין — יש גרסה חדשה!
          </span>
          <button
            onClick={() => updateServiceWorker(true)}
            className="shrink-0 rounded-xl bg-white px-5 py-2 text-sm font-extrabold text-red-600 shadow-lg active:scale-95"
          >
            לחץ כאן לעדכון
          </button>
        </div>
      )}
    </BrowserRouter>
  );
}
