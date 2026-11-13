/* ============================================
   useDialogA11y — modal semantics for dialogs & sheets
   Adds Escape-to-close, focus restoration, a focus
   trap for Tab/Shift+Tab, and initial focus, so any
   overlay behaves like a real modal for keyboard and
   screen-reader users.
   ============================================ */

import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * @param isOpen  whether the overlay is currently rendered
 * @param onClose called on Escape (and used to restore focus on close)
 * @param containerRef  ref to the focusable container (dialog / sheet)
 */
export function useDialogA11y(
  isOpen: boolean,
  onClose: () => void,
  containerRef: React.RefObject<HTMLElement>
): void {
  // Keep the latest onClose without re-running the effect on every render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Restore focus to the previously focused element when the overlay closes.
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const node = containerRef.current;

    // Move initial focus into the dialog (first focusable, else the container).
    if (node) {
      const first = node.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? node).focus();
    }

    return () => {
      // Return focus to whatever opened the dialog.
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen, containerRef]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab') return;
      const node = containerRef.current;
      if (!node) return;

      const focusables = Array.from(
        node.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || active === node || !node.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !node.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, containerRef]);
}
