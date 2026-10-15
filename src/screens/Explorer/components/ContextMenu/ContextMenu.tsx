import React, { useEffect, useRef } from "react";
import "./ContextMenu.css";

export interface ContextMenuProps {
  x: number;
  y: number;
  targetEntry?: { id: string; label: string; isFolder: boolean };
  hasClipboard: boolean;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  targetEntry,
  hasClipboard,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onRefresh,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Ajustement pour ne pas déborder des bords de l'écran
  const menuWidth = 180;
  const menuHeight = targetEntry ? 150 : 95;
  const adjustedX = Math.max(10, Math.min(x, window.innerWidth - menuWidth - 10));
  const adjustedY = Math.max(10, Math.min(y, window.innerHeight - menuHeight - 10));

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      role="menu"
      onContextMenu={(e) => e.preventDefault()}
    >
      {targetEntry ? (
        <>
          <div className="context-menu__header">
            <span className="context-menu__target-name">{targetEntry.label}</span>
          </div>
          <div className="context-menu__divider" />
          <button
            type="button"
            className="context-menu__item"
            onClick={() => {
              onCopy();
              onClose();
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>Copier</span>
          </button>
          <button
            type="button"
            className="context-menu__item"
            onClick={() => {
              onCut();
              onClose();
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="6" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <line x1="20" y1="4" x2="8.12" y2="15.88" />
              <line x1="14.47" y1="14.48" x2="20" y2="20" />
              <line x1="8.12" y1="8.12" x2="12" y2="12" />
            </svg>
            <span>Couper</span>
          </button>
          <div className="context-menu__divider" />
          <button
            type="button"
            className="context-menu__item context-menu__item--danger"
            onClick={() => {
              onDelete();
              onClose();
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>Supprimer</span>
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className={`context-menu__item ${
              !hasClipboard ? "context-menu__item--disabled" : ""
            }`}
            disabled={!hasClipboard}
            onClick={() => {
              if (hasClipboard) {
                onPaste();
                onClose();
              }
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
            <span>Coller</span>
          </button>
          <div className="context-menu__divider" />
          <button
            type="button"
            className="context-menu__item"
            onClick={() => {
              onRefresh();
              onClose();
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 0 0-15.5-6.3L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 15.5 6.3L21 16" />
              <path d="M16 16h5v5" />
            </svg>
            <span>Actualiser</span>
          </button>
        </>
      )}
    </div>
  );
};
