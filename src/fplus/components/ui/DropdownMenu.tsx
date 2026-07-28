import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  widthClass?: string;
}

export function DropdownMenu({
  trigger,
  children,
  align = 'right',
  widthClass = 'w-44',
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    
    // Calculate vertical position
    const top = rect.bottom + window.scrollY;
    
    // Calculate horizontal position based on alignment
    const left = align === 'right'
      ? rect.right + window.scrollX
      : rect.left + window.scrollX;

    setCoords({ top, left });
  };

  useEffect(() => {
    if (!isOpen) return;

    updateCoords();

    // Close dropdown on click outside, scroll, resize or escape key
    const handleClose = (e: Event) => {
      // If clicking the trigger itself, let the click handler handle toggle
      if (triggerRef.current?.contains(e.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        // Return focus to the trigger element
        const focusable = triggerRef.current?.querySelector('button, [tabindex="0"]');
        if (focusable) (focusable as HTMLElement).focus();
      }
    };

    window.addEventListener('scroll', handleClose, { passive: true });
    window.addEventListener('resize', handleClose);
    document.addEventListener('click', handleClose);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleClose);
      window.removeEventListener('resize', handleClose);
      document.removeEventListener('click', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updateCoords();
    }
    setIsOpen(!isOpen);
  };

  // Extract menu width in pixels for exact placement if aligned right
  const widthPx = widthClass === 'w-44' ? 176 : widthClass === 'w-48' ? 192 : widthClass === 'w-56' ? 224 : 176;

  return (
    <div ref={triggerRef} className="inline-block relative">
      <div onClick={handleTriggerClick} className="inline-block focus:outline-none">
        {trigger}
      </div>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: `${coords.top + 4}px`,
            left: align === 'right' ? `${coords.left - widthPx}px` : `${coords.left}px`,
          }}
          className={`z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1 ${widthClass} focus:outline-none animate-in fade-in slide-in-from-top-1 duration-100`}
          role="menu"
          tabIndex={-1}
        >
          {children}
        </div>,
        document.body
      )}
    </div>
  );
}
