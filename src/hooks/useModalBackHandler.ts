import { useEffect, useRef } from 'react';

/**
 * PWA hardware back-button / swipe-back modal interceptor.
 *
 * When isOpen becomes true  → pushes a dummy history entry so the
 *   browser back gesture closes the modal instead of exiting the app.
 * When the user presses back → popstate fires → onClose() is called.
 * When the modal is closed normally (X button, save, etc.) → the dummy
 *   history entry is removed via history.back() so the stack stays clean.
 *
 * suppressCount guards against nested-modal cleanup:
 *   When a child modal closes normally it calls history.back() which would
 *   fire the parent modal's popstate listener. The counter lets the parent
 *   skip exactly those synthetic events.
 */
let suppressCount = 0;

export function useModalBackHandler(isOpen: boolean, onClose: () => void): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    let closedByBackButton = false;

    window.history.pushState({ modal: true }, '');

    const handlePopState = () => {
      if (suppressCount > 0) {
        suppressCount--;
        return;
      }
      closedByBackButton = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Modal was closed normally (not by back button) → pop the dummy entry.
      // Increment suppressCount so sibling/parent listeners skip this event.
      if (!closedByBackButton) {
        suppressCount++;
        window.history.back();
      }
    };
  }, [isOpen]);
}
