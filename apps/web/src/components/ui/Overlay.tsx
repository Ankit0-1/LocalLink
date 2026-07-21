import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../lib/cx';

interface OverlayProps {
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
  align?: 'center' | 'right' | 'left';
}

export function Overlay({ onClose, children, panelClassName, align = 'center' }: OverlayProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className={cx(
        'fixed inset-0 z-50 flex bg-slate-950/40 backdrop-blur-[2px] animate-fade-in',
        align === 'center' && 'items-center justify-center p-4',
        align === 'right' && 'justify-end',
        align === 'left' && 'justify-start',
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={panelClassName}>{children}</div>
    </div>,
    document.body,
  );
}
