import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useSettingsStore } from './store/settingsStore';
import { PwaInstallProvider } from './features/pwa/PwaInstallContext';
import MigrationBanner from './components/MigrationBanner';

const LoginPage          = lazy(() => import('./pages/LoginPage'));
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const LegalDisclaimerModal = lazy(() => import('./components/LegalDisclaimerModal'));
const UpdateModal        = lazy(() => import('./components/UpdateModal'));
const FullInstallModal   = lazy(() => import('./features/pwa/FullInstallModal'));

const AppLoader = () => <div style={{ position: 'fixed', inset: 0, backgroundColor: '#09090B' }} />;

const UPDATE_INTERVAL_MS = 60 * 60 * 1000; // 60 minutes

export default function App() {
  const theme = useSettingsStore((s) => s.theme);
  const language = useSettingsStore((s) => s.language);
  const fontSize = useSettingsStore((s) => s.fontSize);
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

  // Redirect old domain users to new domain
  useEffect(() => {
    if (window.location.hostname === 'mda-phi.vercel.app') {
      window.location.replace('https://hovesh-plus.vercel.app' + window.location.pathname + window.location.search);
    }
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
    document.documentElement.style.fontSize = fontSize + 'px';
  }, [fontSize]);

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
    <PwaInstallProvider>
      <BrowserRouter>
        <Suspense fallback={<AppLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<DashboardPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <Analytics />
          <LegalDisclaimerModal isOpen={legalOpen} onAccept={handleLegalAccept} />
          {needRefresh && <UpdateModal onUpdate={() => updateServiceWorker(true)} />}
          {/* PWA modals only after legal disclaimer is dismissed */}
          {!legalOpen && <FullInstallModal />}
        </Suspense>
        <MigrationBanner />
      </BrowserRouter>
    </PwaInstallProvider>
  );
}
