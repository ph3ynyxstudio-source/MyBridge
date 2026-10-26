import React, { useEffect, useRef } from "react";
import {
  formatFolderDisplayName,
  getUiTerms,
  LanguageMode,
} from "../../../../theme/UI_TERMS";
import "./ContextMenu.css";

export interface ContextMenuProps {
  x: number;
  y: number;
  language?: LanguageMode;
  targetEntry?: { id: string; label: string; isFolder: boolean };
  hasClipboard: boolean;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  onClose: () => void;
  onOpenInSecondary?: () => void;
  onOpenInSystem?: () => void;
  onPreview?: () => void;
  onRenameItem?: () => void;
  onRenameProject?: () => void;
  onDeleteProject?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  language = "fr",
  targetEntry,
  hasClipboard,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onRefresh,
  onClose,
  onOpenInSecondary,
  onOpenInSystem,
  onPreview,
  onRenameItem,
  onRenameProject,
  onDeleteProject,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const terms = getUiTerms(language);

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

  // Calcul adaptatif des dimensions selon le nombre d'actions
  const menuWidth = 220;
  const menuHeight = targetEntry ? (targetEntry.isFolder ? 220 : 210) : 95;
  const adjustedX = Math.max(10, Math.min(x, window.innerWidth - menuWidth - 10));
  const adjustedY = Math.max(10, Math.min(y, window.innerHeight - menuHeight - 10));

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px`, width: `${menuWidth}px` }}
      role="menu"
      onContextMenu={(e) => e.preventDefault()}
    >
      {targetEntry ? (
        <>
          <div className="context-menu__header">
            <span className="context-menu__target-name">
              {targetEntry.isFolder
                ? formatFolderDisplayName(targetEntry.label, undefined, language)
                : targetEntry.label}
            </span>
          </div>
          <div className="context-menu__divider" />

          {/* Action explicite : Ouvrir dans le panneau secondaire (pour les dossiers / projets) */}
          {targetEntry.isFolder && onOpenInSecondary && (
            <button
              type="button"
              className="context-menu__item context-menu__item--accent"
              onClick={() => {
                onOpenInSecondary();
                onClose();
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="12" y1="3" x2="12" y2="21" />
                <polyline points="15 9 18 12 15 15" />
              </svg>
              <span>{terms.contextMenu.openInSecondary}</span>
            </button>
          )}

          {/* Action explicite : Aperçu / Visualiser (pour les fichiers pris en charge) */}
          {!targetEntry.isFolder && onPreview && (
            <button
              type="button"
              className="context-menu__item context-menu__item--accent"
              onClick={() => {
                onPreview();
                onClose();
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>{terms.contextMenu.previewFile}</span>
            </button>
          )}

          {/* Action : Ouvrir avec le système hôte Windows (pour les fichiers) */}
          {!targetEntry.isFolder && onOpenInSystem && (
            <button
              type="button"
              className="context-menu__item"
              onClick={() => {
                onOpenInSystem();
                onClose();
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>{terms.contextMenu.openInSystem}</span>
            </button>
          )}

          {/* Copier / Couper / Renommer / Supprimer uniquement sur les éléments manipulables (id non vide) */}
          {targetEntry.id ? (
            <>
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
                <span>{terms.contextMenu.copy}</span>
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
                <span>{terms.contextMenu.cut}</span>
              </button>

              {onRenameItem && (
                <button
                  type="button"
                  className="context-menu__item"
                  onClick={() => {
                    onRenameItem();
                    onClose();
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>{terms.contextMenu.rename}</span>
                </button>
              )}

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
                <span>{terms.contextMenu.delete}</span>
              </button>
            </>
          ) : (
            <>
              {onRenameProject && (
                <button
                  type="button"
                  className="context-menu__item"
                  onClick={() => {
                    onRenameProject();
                    onClose();
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>{terms.contextMenu.renameProject}</span>
                </button>
              )}

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
                <span>{terms.contextMenu.refresh}</span>
              </button>

              {onDeleteProject && (
                <>
                  <div className="context-menu__divider" />
                  <button
                    type="button"
                    className="context-menu__item context-menu__item--danger"
                    onClick={() => {
                      onDeleteProject();
                      onClose();
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>{terms.contextMenu.deleteProject}</span>
                  </button>
                </>
              )}
            </>
          )}
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
            <span>{terms.contextMenu.paste}</span>
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
            <span>{terms.contextMenu.refresh}</span>
          </button>
        </>
      )}
    </div>
  );
};
