import { useEffect, type RefObject } from 'react';

import { getFocusableElements } from '../utils/keyboardNavigation';

interface UseModalKeyboardNavigationArgs {
  isOpen: boolean;
  containerRef: RefObject<HTMLElement>;
  onClose?: () => void;
  initialFocusRef?: RefObject<HTMLElement>;
  restoreFocus?: boolean;
}

export function useModalKeyboardNavigation({
  isOpen,
  containerRef,
  onClose,
  initialFocusRef,
  restoreFocus = true,
}: UseModalKeyboardNavigationArgs) {
  useEffect(() => {
    if (!isOpen) return;

    const previousActiveElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const focusInitialElement = () => {
      const target = initialFocusRef?.current || getFocusableElements(containerRef.current)[0] || containerRef.current;
      target?.focus({ preventScroll: true });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length === 0) {
        event.preventDefault();
        containerRef.current?.focus({ preventScroll: true });
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      const activeElementIsInsideModal =
        activeElement instanceof Node && Boolean(containerRef.current?.contains(activeElement));

      if (!activeElementIsInsideModal) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus({ preventScroll: true });
        return;
      }

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.setTimeout(focusInitialElement, 0);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (restoreFocus && previousActiveElement?.isConnected) {
        previousActiveElement.focus({ preventScroll: true });
      }
    };
  }, [containerRef, initialFocusRef, isOpen, onClose, restoreFocus]);
}
