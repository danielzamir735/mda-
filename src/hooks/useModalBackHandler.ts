import { useEffect, useRef } from 'react';

/**
 * PWA hardware back-button / swipe-back modal interceptor.
 *
 * When isOpen becomes true  → pushes a dummy history entry so the
 *   browser back gesture closes the modal instead of exiting the app.
 * When the user presses back → popstate fires → onClose() is called.
 * When the modal is closed normally (X button, save, etc.) → the dummy
 *   history entry is removed via history.back() so the stack stays clean.
 */
export function useModalBackHandler(isOpen: boolean, onClose: () => void): void {
  // Keep a ref to the latest onClose so we never need it in the dep array.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    let closedByBackButton = false;

    window.history.pushState({ modal: true }, '');

    const handlePopState = () => {
      closedByBackButton = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Modal was closed normally (not by back button) → pop the dummy entry.
      if (!closedByBackButton) {
        window.history.back();
      }
    };
  }, [isOpen]);
}
