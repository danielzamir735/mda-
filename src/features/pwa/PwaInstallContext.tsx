import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaInstallContextType {
  showFullModal: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  installPromptEvent: BeforeInstallPromptEvent | null;
  openFullModal: () => void;
  closeFullModal: () => void;
  handleInstall: () => Promise<void>;
}

const PwaInstallContext = createContext<PwaInstallContextType | null>(null);

const KEYS = {
  visitCount: 'hoveshPlus_visitCount',
  installIgnored: 'hoveshPlus_installIgnored',
  isInstalled: 'hoveshPlus_isInstalled',
} as const;

const SESSION_KEY = 'hoveshPlus_session_started';

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [showFullModal, setShowFullModal] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const initialized = useRef(false);

  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);

  // Capture native install prompt (Android Chrome) — never cleared on modal close
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Mark installed when app is added to home screen
  useEffect(() => {
    const handler = () => {
      localStorage.setItem(KEYS.isInstalled, 'true');
      setShowFullModal(false);
      setInstallPromptEvent(null);
    };
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  // Mount logic — run once, StrictMode-safe via sessionStorage guard
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Already running as standalone PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      localStorage.setItem(KEYS.isInstalled, 'true');
    }

    const isInstalled = localStorage.getItem(KEYS.isInstalled) === 'true';
    const installIgnored = localStorage.getItem(KEYS.installIgnored) === 'true';

    // Visit count logic — sessionStorage prevents StrictMode double-counts
    const hasSession = sessionStorage.getItem(SESSION_KEY);
    const prev = parseInt(localStorage.getItem(KEYS.visitCount) || '0', 10);
    let visitCount = prev;

    if (!hasSession) {
      if (prev === 0) {
        // First ever visit: set to 1
        visitCount = 1;
      } else {
        // Returning visit: increment
        visitCount = prev + 1;
      }
      localStorage.setItem(KEYS.visitCount, String(visitCount));
      sessionStorage.setItem(SESSION_KEY, 'true');
    }

    // Auto-open only on visits 2 and 3; never on first visit
    if (isInstalled || installIgnored) return;

    if (visitCount === 2 || visitCount === 3) {
      setTimeout(() => setShowFullModal(true), 2500);
    }
  }, []);

  const openFullModal = () => setShowFullModal(true);

  // Close modal but NEVER clear installPromptEvent — must remain ready for Tools menu
  const closeFullModal = () => {
    localStorage.setItem(KEYS.installIgnored, 'true');
    setShowFullModal(false);
  };

  const handleInstall = async () => {
    if (!installPromptEvent) return;
    await installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(KEYS.isInstalled, 'true');
      setShowFullModal(false);
    }
    // Clear only after the native prompt has been consumed
    setInstallPromptEvent(null);
  };

  return (
    <PwaInstallContext.Provider
      value={{
        showFullModal,
        isIOS,
        isAndroid,
        installPromptEvent,
        openFullModal,
        closeFullModal,
        handleInstall,
      }}
    >
      {children}
    </PwaInstallContext.Provider>
  );
}

export function usePwaInstall() {
  const ctx = useContext(PwaInstallContext);
  if (!ctx) throw new Error('usePwaInstall must be used within PwaInstallProvider');
  return ctx;
}
