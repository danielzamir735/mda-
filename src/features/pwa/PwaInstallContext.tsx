import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaInstallContextType {
  showFullModal: boolean;
  showBottomBanner: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  openFullModal: () => void;
  closeFullModal: () => void;
  closeBanner: () => void;
  handleInstall: () => Promise<void>;
}

const PwaInstallContext = createContext<PwaInstallContextType | null>(null);

const KEYS = {
  visitCount: 'hoveshPlus_visitCount',
  installIgnored: 'hoveshPlus_installIgnored',
  isInstalled: 'hoveshPlus_isInstalled',
} as const;

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [showFullModal, setShowFullModal] = useState(false);
  const [showBottomBanner, setShowBottomBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const initialized = useRef(false);

  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);

  // Capture native install prompt (Android Chrome)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Mark installed when app is added to home screen
  useEffect(() => {
    const handler = () => {
      localStorage.setItem(KEYS.isInstalled, 'true');
      setShowFullModal(false);
      setShowBottomBanner(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  // Mount logic — run once
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

    const prev = parseInt(localStorage.getItem(KEYS.visitCount) || '0', 10);
    const visitCount = prev + 1;
    localStorage.setItem(KEYS.visitCount, String(visitCount));

    if (isInstalled || installIgnored) return;

    if (visitCount === 2 || visitCount === 3) {
      // Slight delay so the app finishes rendering first
      setTimeout(() => setShowFullModal(true), 1200);
    } else if (visitCount > 3 && (visitCount - 3) % 5 === 0) {
      setTimeout(() => setShowBottomBanner(true), 1500);
    }
  }, []);

  const openFullModal = () => setShowFullModal(true);

  const closeFullModal = () => {
    localStorage.setItem(KEYS.installIgnored, 'true');
    setShowFullModal(false);
  };

  const closeBanner = () => {
    localStorage.setItem(KEYS.installIgnored, 'true');
    setShowBottomBanner(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(KEYS.isInstalled, 'true');
      setShowFullModal(false);
      setShowBottomBanner(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <PwaInstallContext.Provider
      value={{
        showFullModal,
        showBottomBanner,
        isIOS,
        isAndroid,
        deferredPrompt,
        openFullModal,
        closeFullModal,
        closeBanner,
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
