import { Component, useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { useSettingsStore } from './store/settingsStore';
import LegalDisclaimerModal from './components/LegalDisclaimerModal';
import { PwaInstallProvider } from './features/pwa/PwaInstallContext';
import FullInstallModal from './features/pwa/FullInstallModal';
import MigrationBanner from './components/MigrationBanner';
import HapticButton from './components/HapticButton';
import { isSentryEnabled, reportError } from './lib/sentry';

function CrashFallback() {
  // Independent of AppInner's tree, so this still reflects the user's real
  // language/direction even though AppInner (which threw) never rendered.
  const language = useSettingsStore((s) => s.language);
  const isEnglish = language === 'en';
  const knownAboutIt = isSentryEnabled();

  const message = isEnglish
    ? `Oops, something went wrong.${knownAboutIt ? " We already know about it." : ''}`
    : `אופס, משהו השתבש.${knownAboutIt ? ' אנחנו כבר יודעים על זה.' : ''}`;
  const buttonLabel = isEnglish ? 'Reload the page' : 'רענן את הדף';

  return (
    <div dir={isEnglish ? 'ltr' : 'rtl'} className="p-6 text-center">
      <p className="mb-4">{message}</p>
      <HapticButton
        onClick={() => window.location.reload()}
        className="px-4 py-2 rounded-xl font-bold text-white bg-rose-600"
      >
        {buttonLabel}
      </HapticButton>
    </div>
  );
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: { componentStack: string | null }) {
    reportError(error, info);
  }

  render() {
    if (this.state.hasError) return <CrashFallback />;
    return this.props.children;
  }
}

function AppInner() {
  const theme = useSettingsStore((s) => s.theme);
  const language = useSettingsStore((s) => s.language);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const [legalOpen, setLegalOpen] = useState(false);

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
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Analytics />
        <LegalDisclaimerModal isOpen={legalOpen} onAccept={handleLegalAccept} />
        {/* PWA modals only after legal disclaimer is dismissed */}
        {!legalOpen && <FullInstallModal />}
        <MigrationBanner />
      </BrowserRouter>
    </PwaInstallProvider>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppInner />
    </AppErrorBoundary>
  );
}
