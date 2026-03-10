import { useEffect, useRef } from 'react';

/**
 * PWA hardware back-button / swipe-back modal interceptor.
 *
 * Supports arbitrarily nested modals (Hub → sub-modal → inner-modal).
 *
 * HOW IT WORKS
 * ─────────────
 * modalDepth   – counts how many modal layers are currently open.
 *                Each call to the hook increments it on open and
 *                decrements it on close (cleanup).
 * myDepthRef   – records the depth at which *this* modal opened.
 *                The popstate handler only fires when this modal IS
 *                the deepest layer (myDepth === modalDepth), so a
 *                parent modal's listener is silently skipped while a
 *                child is open and automatically re-activates the
 *                moment the child closes.
 * suppressCount – guards the one remaining edge case: when a modal
 *                closes normally (X button) it calls history.back()
 *                to clean up its dummy history entry. That navigation
 *                fires a popstate which must be ignored by the parent.
 *                suppressCount is incremented only when a parent
 *                actually exists (modalDepth > 0 after decrement) to
 *                prevent the counter from leaking when the top-level
 *                modal closes.
 */
let modalDepth = 0;
let suppressCount = 0;

export function useModalBackHandler(isOpen: boolean, onClose: () => void): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Capture the depth at which this modal instance opened.
  const myDepthRef = useRef(0);

  useEffect(() => {
    if (!isOpen) return;

    modalDepth++;
    myDepthRef.current = modalDepth;

    let closedByBackButton = false;

    window.history.pushState({ modal: true }, '');

    const handlePopState = () => {
      // Skip events produced by a child modal's normal-close cleanup.
      if (suppressCount > 0) {
        suppressCount--;
        return;
      }
      // Only the deepest open modal should react to the back gesture.
      if (myDepthRef.current !== modalDepth) return;

      closedByBackButton = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      modalDepth = Math.max(0, modalDepth - 1);

      if (!closedByBackButton) {
        // Modal closed programmatically → pop the dummy history entry.
        // Only signal the parent to suppress the resulting popstate when
        // a parent actually exists; otherwise suppressCount would leak.
        if (modalDepth > 0) suppressCount++;
        window.history.back();
      }
    };
  }, [isOpen]);
}
