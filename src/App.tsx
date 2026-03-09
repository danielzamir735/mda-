import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { useSettingsStore } from './store/settingsStore';
import LegalDisclaimerModal from './components/LegalDisclaimerModal';

export default function App() {
  const theme = useSettingsStore((s) => s.theme);
  const language = useSettingsStore((s) => s.language);
  const [legalOpen, setLegalOpen] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

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
        <div className="fixed z-[100] bottom-20 left-4 right-4 bg-blue-600 text-white p-4 rounded-2xl shadow-xl flex justify-between items-center gap-3">
          <span className="text-sm font-medium">גרסה חדשה זמינה!</span>
          <button
            onClick={() => updateServiceWorker(true)}
            className="shrink-0 bg-white text-blue-600 text-sm font-bold px-4 py-1.5 rounded-xl hover:bg-blue-50 transition-colors"
          >
            רענן לעדכון
          </button>
        </div>
      )}
    </BrowserRouter>
  );
}
