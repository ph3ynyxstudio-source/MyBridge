import React, { useState, useEffect } from "react";
import { InboxItem } from "../../../../services/storageService";
import { UI_TERMS } from "../../../../theme/UI_TERMS";
import "./InboxDrawer.css";

export interface InboxDrawerProps {
  isOpen: boolean;
  items: InboxItem[];
  projects: string[];
  defaultTargetProject: string;
  availableSubfolders: Record<string, string[]>;
  onClose: () => void;
  onRefreshInbox: () => void;
  onMoveItem: (
    itemName: string,
    targetProject: string,
    targetSubpath?: string
  ) => Promise<void>;
}

function formatByteSize(bytes: number, isDir: boolean): string {
  if (isDir) return UI_TERMS.inboxDrawer.folderBadge;
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export const InboxDrawer: React.FC<InboxDrawerProps> = ({
  isOpen,
  items,
  projects,
  defaultTargetProject,
  availableSubfolders,
  onClose,
  onRefreshInbox,
  onMoveItem,
}) => {
  const [selectedProjects, setSelectedProjects] = useState<Record<string, string>>({});
  const [selectedSubpaths, setSelectedSubpaths] = useState<Record<string, string>>({});
  const [movingItemName, setMovingItemName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const getTargetProjectFor = (itemName: string): string => {
    const chosen = selectedProjects[itemName];
    if (chosen && projects.includes(chosen)) {
      return chosen;
    }
    if (defaultTargetProject && projects.includes(defaultTargetProject)) {
      return defaultTargetProject;
    }
    return projects[0] ?? "";
  };

  const getTargetSubpathFor = (itemName: string): string => {
    return selectedSubpaths[itemName] ?? "";
  };

  const handleMove = async (itemName: string) => {
    const targetProject = getTargetProjectFor(itemName);
    if (!targetProject) return;

    const targetSubpath = getTargetSubpathFor(itemName);
    setMovingItemName(itemName);
    setErrorMsg(null);

    try {
      await onMoveItem(itemName, targetProject, targetSubpath || undefined);
    } catch (err) {
      setErrorMsg(typeof err === "string" ? err : String(err));
    } finally {
      setMovingItemName(null);
    }
  };

  return (
    <div className="inbox-drawer-backdrop" onClick={onClose}>
      <aside
        className="inbox-drawer"
        onClick={(e) => e.stopPropagation()}
        aria-label={UI_TERMS.inboxDrawer.title}
      >
        <header className="inbox-drawer__header">
          <div className="inbox-drawer__title-group">
            <h2 className="inbox-drawer__title">
              {UI_TERMS.inboxDrawer.title}
              {items.length > 0 && (
                <span className="inbox-drawer__count">{items.length}</span>
              )}
            </h2>
            <p className="inbox-drawer__subtitle">{UI_TERMS.inboxDrawer.subtitle}</p>
          </div>

          <div className="inbox-drawer__actions">
            <button
              type="button"
              className="inbox-drawer__btn inbox-drawer__btn--ghost"
              onClick={onRefreshInbox}
            >
              {UI_TERMS.inboxDrawer.refresh}
            </button>
            <button
              type="button"
              className="inbox-drawer__btn inbox-drawer__btn--ghost"
              onClick={onClose}
            >
              {UI_TERMS.inboxDrawer.close}
            </button>
          </div>
        </header>

        {errorMsg && (
          <div className="inbox-drawer__error" role="alert">
            {errorMsg}
          </div>
        )}

        <div className="inbox-drawer__body">
          {items.length === 0 ? (
            <div className="inbox-drawer__empty">
              <p>{UI_TERMS.inboxDrawer.empty}</p>
            </div>
          ) : (
            <ul className="inbox-drawer__list">
              {items.map((item) => {
                const targetProject = getTargetProjectFor(item.nom);
                const targetSubpath = getTargetSubpathFor(item.nom);
                const subfolders = availableSubfolders[targetProject] ?? [];
                const isMoving = movingItemName === item.nom;

                return (
                  <li key={item.nom} className="inbox-drawer__item">
                    <div className="inbox-drawer__item-info">
                      <span className="inbox-drawer__item-badge">
                        {item.est_dossier
                          ? UI_TERMS.inboxDrawer.folderBadge
                          : item.extension
                          ? `.${item.extension}`
                          : UI_TERMS.inboxDrawer.fileBadge}
                      </span>
                      <span className="inbox-drawer__item-name" title={item.nom}>
                        {item.nom}
                      </span>
                      <span className="inbox-drawer__item-size">
                        {formatByteSize(item.taille, item.est_dossier)}
                      </span>
                    </div>

                    {projects.length === 0 ? (
                      <p className="inbox-drawer__no-project">
                        {UI_TERMS.inboxDrawer.noProjectWarning}
                      </p>
                    ) : (
                      <div className="inbox-drawer__controls">
                        <label className="inbox-drawer__field">
                          <span className="inbox-drawer__field-label">
                            {UI_TERMS.inboxDrawer.targetProjectLabel}
                          </span>
                          <select
                            className="inbox-drawer__select"
                            value={targetProject}
                            onChange={(e) => {
                              const nextProj = e.target.value;
                              setSelectedProjects((prev) => ({
                                ...prev,
                                [item.nom]: nextProj,
                              }));
                              setSelectedSubpaths((prev) => ({
                                ...prev,
                                [item.nom]: "",
                              }));
                            }}
                          >
                            {projects.map((proj) => (
                              <option key={proj} value={proj}>
                                {proj}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="inbox-drawer__field">
                          <span className="inbox-drawer__field-label">
                            {UI_TERMS.inboxDrawer.targetSubpathLabel}
                          </span>
                          <select
                            className="inbox-drawer__select"
                            value={targetSubpath}
                            onChange={(e) =>
                              setSelectedSubpaths((prev) => ({
                                ...prev,
                                [item.nom]: e.target.value,
                              }))
                            }
                          >
                            <option value="">
                              {UI_TERMS.inboxDrawer.targetSubpathPlaceholder}
                            </option>
                            {subfolders.map((sub) => (
                              <option key={sub} value={sub}>
                                {sub}
                              </option>
                            ))}
                          </select>
                        </label>

                        <button
                          type="button"
                          className="inbox-drawer__btn inbox-drawer__btn--primary"
                          disabled={isMoving || !targetProject}
                          onClick={() => handleMove(item.nom)}
                        >
                          {isMoving
                            ? UI_TERMS.inboxDrawer.movingButton
                            : UI_TERMS.inboxDrawer.moveButton}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
};
