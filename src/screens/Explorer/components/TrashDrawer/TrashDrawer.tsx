import React, { useState } from "react";
import { InboxItem } from "../../../../services/storageService";
import "./TrashDrawer.css";

export interface TrashDrawerProps {
  isOpen: boolean;
  items: InboxItem[];
  onClose: () => void;
  onRefreshTrash: () => void;
  onEmptyTrash: () => Promise<void>;
}

function formatByteSize(bytes: number, isDir: boolean): string {
  if (isDir) return "Dossier";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatTimestamp(timestamp: number): string {
  if (!timestamp) return "-";
  return new Date(timestamp * 1000).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const TrashDrawer: React.FC<TrashDrawerProps> = ({
  isOpen,
  items,
  onClose,
  onRefreshTrash,
  onEmptyTrash,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleConfirmEmpty = async () => {
    setIsDeleting(true);
    try {
      await onEmptyTrash();
      setIsConfirmOpen(false);
    } catch (err) {
      console.error("Erreur vidage corbeille :", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="trash-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="trash-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="trash-drawer__header">
          <div className="trash-drawer__title-group">
            <h2 className="trash-drawer__title">Corbeille</h2>
            <p className="trash-drawer__subtitle">
              Éléments supprimés temporairement. Aucune suppression définitive sans confirmation explicite.
            </p>
          </div>
          <div className="trash-drawer__header-actions">
            <button
              type="button"
              className="trash-drawer__btn trash-drawer__btn--refresh"
              onClick={onRefreshTrash}
              title="Rafraîchir"
            >
              Rafraîchir
            </button>
            {items.length > 0 && (
              <button
                type="button"
                className="trash-drawer__btn trash-drawer__btn--empty"
                onClick={() => setIsConfirmOpen(true)}
                title="Vider définitivement la corbeille"
              >
                Vider la corbeille
              </button>
            )}
            <button
              type="button"
              className="trash-drawer__close-btn"
              onClick={onClose}
              title="Fermer"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="trash-drawer__content">
          {items.length === 0 ? (
            <div className="trash-drawer__empty">
              <div className="trash-drawer__empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <h3 className="trash-drawer__empty-title">La corbeille est vide</h3>
              <p className="trash-drawer__empty-subtitle">
                Glissez des fichiers ou utilisez le clic droit pour envoyer des éléments ici.
              </p>
            </div>
          ) : (
            <ul className="trash-drawer__list">
              {items.map((item) => (
                <li key={item.nom} className="trash-drawer__card">
                  <div className="trash-drawer__card-info">
                    <div className="trash-drawer__card-icon">
                      {item.est_dossier ? (
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M4 3h8l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" />
                        </svg>
                      )}
                    </div>
                    <div className="trash-drawer__card-text">
                      <span className="trash-drawer__card-name" title={item.nom}>
                        {item.nom}
                      </span>
                      <span className="trash-drawer__card-meta">
                        {formatByteSize(item.taille, item.est_dossier)} • {formatTimestamp(item.date_modification)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Modal de confirmation explicite pour vider la corbeille (règle gouvernance) */}
        {isConfirmOpen && (
          <div className="trash-confirm-overlay" onClick={() => setIsConfirmOpen(false)}>
            <div className="trash-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="trash-confirm-modal__title">Vider la corbeille ?</h3>
              <p className="trash-confirm-modal__text">
                Cette action supprimera <strong>définitivement</strong> l’ensemble des éléments de la corbeille du stockage local. Cette opération est irréversible.
              </p>
              <div className="trash-confirm-modal__actions">
                <button
                  type="button"
                  className="trash-confirm-modal__btn trash-confirm-modal__btn--cancel"
                  onClick={() => setIsConfirmOpen(false)}
                  disabled={isDeleting}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="trash-confirm-modal__btn trash-confirm-modal__btn--danger"
                  onClick={() => void handleConfirmEmpty()}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Suppression en cours..." : "Confirmer la suppression"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
