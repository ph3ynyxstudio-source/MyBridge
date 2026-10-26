import React, { useMemo, useState } from "react";
import {
  InboxItem,
  ProjectArchiveStatus,
} from "../../../../services/storageService";
import { getUiTerms, LanguageMode } from "../../../../theme/UI_TERMS";
import "./TrashDrawer.css";

export interface TrashDrawerProps {
  isOpen: boolean;
  items: InboxItem[];
  projects: string[];
  archivesStatus: ProjectArchiveStatus[];
  language?: LanguageMode;
  onClose: () => void;
  onRefreshTrash: () => void;
  onEmptyTrash: () => Promise<void>;
  onDeleteTrashItems: (itemNames: string[]) => Promise<void>;
  onArchiveTrashItems: (
    itemNames: string[],
    targetProject?: string
  ) => Promise<void>;
  onCompressArchive: (projectName: string) => Promise<void>;
}

export function formatBytesHuman(bytes: number, isDir = false, folderLabel = "Dossier"): string {
  if (bytes <= 0 && isDir) return folderLabel;
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function formatTimestamp(timestamp: number, lang: LanguageMode): string {
  if (!timestamp) return "-";
  return new Date(timestamp * 1000).toLocaleString(
    lang === "en" ? "en-US" : "fr-FR",
    {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

const UNCLASSIFIED_KEY = "__unclassified__";

export const TrashDrawer: React.FC<TrashDrawerProps> = ({
  isOpen,
  items,
  projects,
  archivesStatus,
  language = "fr",
  onClose,
  onRefreshTrash,
  onEmptyTrash,
  onDeleteTrashItems,
  onArchiveTrashItems,
  onCompressArchive,
}) => {
  const terms = getUiTerms(language);
  const [viewMode, setViewMode] = useState<"grouped" | "list">("grouped");
  const [projectFilter, setProjectFilter] = useState<string>("__all__");
  const [fallbackProjectMap, setFallbackProjectMap] = useState<Record<string, string>>({});

  // État de confirmation explicite (vidage complet ou sélection granulaire)
  const [confirmTarget, setConfirmTarget] = useState<{
    mode: "empty" | "selection";
    itemNames: string[];
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressingProject, setCompressingProject] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Liste des projets présents dans la corbeille pour le filtre
  const availableTrashProjects = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.projet_origine) {
        set.add(item.projet_origine);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  // Filtrage des éléments selon le projet sélectionné
  const filteredItems = useMemo(() => {
    if (projectFilter === "__all__") return items;
    if (projectFilter === UNCLASSIFIED_KEY) {
      return items.filter((i) => !i.projet_origine);
    }
    return items.filter((i) => i.projet_origine === projectFilter);
  }, [items, projectFilter]);

  // Regroupement par projet d'origine
  const groupedItems = useMemo(() => {
    const groups = new Map<string, InboxItem[]>();
    for (const item of filteredItems) {
      const key = item.projet_origine || UNCLASSIFIED_KEY;
      const list = groups.get(key) || [];
      list.push(item);
      groups.set(key, list);
    }
    return Array.from(groups.entries()).sort(([keyA], [keyB]) => {
      if (keyA === UNCLASSIFIED_KEY) return 1;
      if (keyB === UNCLASSIFIED_KEY) return -1;
      return keyA.localeCompare(keyB);
    });
  }, [filteredItems]);

  // Projets ayant des éléments dans 99-Archive (non compressés ou déjà zippés)
  const activeArchiveStatuses = useMemo(
    () =>
      archivesStatus.filter(
        (st) => st.uncompressed_count > 0 || st.zip_count > 0
      ),
    [archivesStatus]
  );

  if (!isOpen) {
    return null;
  }

  const resolveProjectForItem = (item: InboxItem): string => {
    if (item.projet_origine) return item.projet_origine;
    return fallbackProjectMap[item.nom] || projects[0] || "";
  };

  const handleConfirmDeleteAction = async () => {
    if (!confirmTarget) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setFeedbackMsg(null);
    try {
      if (confirmTarget.mode === "empty") {
        await onEmptyTrash();
      } else {
        await onDeleteTrashItems(confirmTarget.itemNames);
      }
      setConfirmTarget(null);
    } catch (err: unknown) {
      setErrorMsg(typeof err === "string" ? err : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchiveAction = async (
    itemNames: string[],
    targetProject?: string
  ) => {
    if (itemNames.length === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setFeedbackMsg(null);
    try {
      await onArchiveTrashItems(itemNames, targetProject);
      setFeedbackMsg(
        language === "en"
          ? `${itemNames.length} item(s) moved to Archives (99-Archive).`
          : `${itemNames.length} élément(s) transféré(s) vers Archives (99-Archive).`
      );
    } catch (err: unknown) {
      setErrorMsg(typeof err === "string" ? err : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTriggerCompress = async (projectName: string) => {
    setCompressingProject(projectName);
    setErrorMsg(null);
    setFeedbackMsg(null);
    try {
      await onCompressArchive(projectName);
      setFeedbackMsg(
        language === "en"
          ? `Archives of "${projectName}" compressed into .zip.`
          : `Dossier d'archives de « ${projectName} » compressé en .zip.`
      );
    } catch (err: unknown) {
      setErrorMsg(typeof err === "string" ? err : String(err));
    } finally {
      setCompressingProject(null);
    }
  };

  const renderItemCard = (item: InboxItem) => {
    const displayName = item.nom_original || item.nom;
    const targetProject = resolveProjectForItem(item);

    return (
      <li key={item.nom} className="trash-drawer__card">
        <div className="trash-drawer__card-info">
          <div className="trash-drawer__card-icon">
            {item.est_dossier ? (
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
            ) : ["zip", "rar", "7z", "tar", "gz"].includes(
                (item.extension || "").toLowerCase()
              ) ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 6a2 2 0 012-2h5l2 2h7a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" />
                <rect x="8" y="6" width="2" height="2" fill="var(--bg-panel)" />
                <rect x="10" y="8" width="2" height="2" fill="var(--bg-panel)" />
                <rect x="8" y="10" width="2" height="2" fill="var(--bg-panel)" />
                <rect x="10" y="12" width="2" height="2" fill="var(--bg-panel)" />
                <rect x="7.5" y="14.5" width="5" height="3.5" rx="0.8" fill="var(--bg-panel)" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 3h8l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" />
              </svg>
            )}
          </div>
          <div className="trash-drawer__card-text">
            <span className="trash-drawer__card-name" title={displayName}>
              {displayName}
            </span>
            <div className="trash-drawer__card-meta">
              {item.projet_origine ? (
                <span className="trash-drawer__origin-badge">
                  {item.projet_origine}
                </span>
              ) : projects.length > 0 ? (
                <select
                  className="trash-drawer__project-select"
                  value={targetProject}
                  onChange={(e) =>
                    setFallbackProjectMap((prev) => ({
                      ...prev,
                      [item.nom]: e.target.value,
                    }))
                  }
                  aria-label={terms.trashDrawer.selectTargetProject}
                >
                  {projects.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              ) : null}
              <span>
                {formatBytesHuman(
                  item.taille,
                  item.est_dossier,
                  terms.inboxDrawer.folderBadge
                )}
              </span>
              <span>•</span>
              <span>{formatTimestamp(item.date_modification, language)}</span>
            </div>
          </div>
        </div>

        <div className="trash-drawer__card-actions">
          <button
            type="button"
            className="trash-drawer__action-btn trash-drawer__action-btn--archive"
            disabled={isProcessing || !targetProject}
            onClick={() => void handleArchiveAction([item.nom], targetProject)}
            title={`${terms.trashDrawer.archiveItemBtn} (${targetProject || "?"}/99-Archive)`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
            <span>{terms.trashDrawer.archiveItemBtn}</span>
          </button>
          <button
            type="button"
            className="trash-drawer__action-btn trash-drawer__action-btn--delete"
            disabled={isProcessing}
            onClick={() =>
              setConfirmTarget({
                mode: "selection",
                itemNames: [item.nom],
              })
            }
            title={terms.trashDrawer.deleteItemBtn}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>{terms.trashDrawer.deleteItemBtn}</span>
          </button>
        </div>
      </li>
    );
  };

  return (
    <div
      className="trash-drawer-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="trash-drawer" onClick={(e) => e.stopPropagation()}>
        <header className="trash-drawer__header">
          <div className="trash-drawer__title-group">
            <h2 className="trash-drawer__title">{terms.trashDrawer.title}</h2>
            <p className="trash-drawer__subtitle">
              {terms.trashDrawer.subtitle}
            </p>
          </div>
          <div className="trash-drawer__header-actions">
            <button
              type="button"
              className="trash-drawer__btn trash-drawer__btn--refresh"
              onClick={onRefreshTrash}
              title={terms.trashDrawer.refresh}
            >
              {terms.trashDrawer.refresh}
            </button>
            {items.length > 0 && (
              <button
                type="button"
                className="trash-drawer__btn trash-drawer__btn--empty"
                onClick={() =>
                  setConfirmTarget({
                    mode: "empty",
                    itemNames: items.map((i) => i.nom),
                  })
                }
                title={terms.trashDrawer.emptyTrashBtn}
              >
                {terms.trashDrawer.emptyTrashBtn}
              </button>
            )}
            <button
              type="button"
              className="trash-drawer__close-btn"
              onClick={onClose}
              title={terms.trashDrawer.close}
              aria-label={terms.trashDrawer.close}
            >
              ✕
            </button>
          </div>
        </header>

        {/* Barre d'outils : Regroupement par projet & Filtre projet */}
        {items.length > 0 && (
          <div className="trash-drawer__toolbar">
            <div className="trash-drawer__mode-switch">
              <button
                type="button"
                className={`trash-drawer__mode-btn ${
                  viewMode === "grouped" ? "trash-drawer__mode-btn--active" : ""
                }`}
                onClick={() => setViewMode("grouped")}
              >
                {terms.trashDrawer.groupModeLabel}
              </button>
              <button
                type="button"
                className={`trash-drawer__mode-btn ${
                  viewMode === "list" ? "trash-drawer__mode-btn--active" : ""
                }`}
                onClick={() => setViewMode("list")}
              >
                {terms.trashDrawer.listModeLabel}
              </button>
            </div>

            <select
              className="trash-drawer__filter-select"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              aria-label={terms.trashDrawer.filterAllProjects}
            >
              <option value="__all__">
                {terms.trashDrawer.filterAllProjects} ({items.length})
              </option>
              {availableTrashProjects.map((proj) => (
                <option key={proj} value={proj}>
                  {proj}
                </option>
              ))}
              {items.some((i) => !i.projet_origine) && (
                <option value={UNCLASSIFIED_KEY}>
                  {terms.trashDrawer.unclassifiedProject}
                </option>
              )}
            </select>
          </div>
        )}

        {feedbackMsg && (
          <div className="trash-drawer__banner trash-drawer__banner--success">
            {feedbackMsg}
          </div>
        )}
        {errorMsg && (
          <div className="trash-drawer__banner trash-drawer__banner--error">
            {errorMsg}
          </div>
        )}

        <div className="trash-drawer__content">
          {/* Section Compression intelligente (Zip) des dossiers 99-Archive */}
          {activeArchiveStatuses.length > 0 && (
            <section className="trash-archive-panel">
              <div className="trash-archive-panel__header">
                <h3 className="trash-archive-panel__title">
                  {terms.trashDrawer.archiveSectionTitle}
                </h3>
                <p className="trash-archive-panel__subtitle">
                  {terms.trashDrawer.archiveSectionSubtitle}
                </p>
              </div>
              <div className="trash-archive-panel__list">
                {activeArchiveStatuses.map((st) => {
                  const isCompressing = compressingProject === st.project_name;
                  return (
                    <div
                      key={st.project_name}
                      className={`trash-archive-row ${
                        st.exceeds_threshold
                          ? "trash-archive-row--warning"
                          : ""
                      }`}
                    >
                      <div className="trash-archive-row__info">
                        <div className="trash-archive-row__title-line">
                          <span className="trash-archive-row__project">
                            {st.project_name}
                          </span>
                          {st.exceeds_threshold && (
                            <span className="trash-archive-row__alert-pill">
                              {terms.trashDrawer.thresholdWarning(
                                formatBytesHuman(st.uncompressed_size)
                              )}
                            </span>
                          )}
                          {st.zip_count > 0 && (
                            <span className="trash-archive-row__zip-pill">
                              {terms.trashDrawer.zipCountBadge(st.zip_count)}
                            </span>
                          )}
                        </div>
                        <span className="trash-archive-row__meta">
                          {terms.trashDrawer.uncompressedStats(
                            st.uncompressed_count,
                            formatBytesHuman(st.uncompressed_size)
                          )}
                        </span>
                      </div>

                      {st.uncompressed_count > 0 && (
                        <button
                          type="button"
                          className="trash-archive-row__zip-btn"
                          disabled={isCompressing}
                          onClick={() => void handleTriggerCompress(st.project_name)}
                        >
                          {isCompressing
                            ? terms.trashDrawer.compressingBtn
                            : terms.trashDrawer.compressBtn}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Liste des éléments de la corbeille */}
          {filteredItems.length === 0 ? (
            <div className="trash-drawer__empty">
              <div className="trash-drawer__empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <h3 className="trash-drawer__empty-title">
                {terms.trashDrawer.emptyTitle}
              </h3>
              <p className="trash-drawer__empty-subtitle">
                {terms.trashDrawer.emptySubtitle}
              </p>
            </div>
          ) : viewMode === "grouped" ? (
            <div className="trash-drawer__groups">
              {groupedItems.map(([groupKey, groupList]) => {
                const isUnclassified = groupKey === UNCLASSIFIED_KEY;
                const groupTitle = isUnclassified
                  ? terms.trashDrawer.unclassifiedProject
                  : groupKey;
                const totalGroupSize = groupList.reduce(
                  (acc, i) => acc + (i.taille || 0),
                  0
                );
                const groupItemNames = groupList.map((i) => i.nom);
                const targetGroupProject = isUnclassified
                  ? projects[0] || ""
                  : groupKey;

                return (
                  <div key={groupKey} className="trash-group">
                    <div className="trash-group__header">
                      <div className="trash-group__title-wrap">
                        <span className="trash-group__badge">{groupTitle}</span>
                        <span className="trash-group__count">
                          {groupList.length} • {formatBytesHuman(totalGroupSize)}
                        </span>
                      </div>

                      <div className="trash-group__actions">
                        {targetGroupProject && (
                          <button
                            type="button"
                            className="trash-drawer__action-btn trash-drawer__action-btn--archive"
                            disabled={isProcessing}
                            onClick={() =>
                              void handleArchiveAction(
                                groupItemNames,
                                targetGroupProject
                              )
                            }
                          >
                            {terms.trashDrawer.archiveGroupBtn}
                          </button>
                        )}
                        <button
                          type="button"
                          className="trash-drawer__action-btn trash-drawer__action-btn--delete"
                          disabled={isProcessing}
                          onClick={() =>
                            setConfirmTarget({
                              mode: "selection",
                              itemNames: groupItemNames,
                            })
                          }
                        >
                          {terms.trashDrawer.deleteGroupBtn}
                        </button>
                      </div>
                    </div>

                    <ul className="trash-drawer__list">
                      {groupList.map((item) => renderItemCard(item))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <ul className="trash-drawer__list">
              {filteredItems.map((item) => renderItemCard(item))}
            </ul>
          )}
        </div>

        {/* Modale de confirmation explicite avant toute suppression définitive */}
        {confirmTarget && (
          <div
            className="trash-confirm-overlay"
            onClick={() => !isProcessing && setConfirmTarget(null)}
          >
            <div
              className="trash-confirm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="trash-confirm-modal__title">
                {confirmTarget.mode === "empty"
                  ? terms.trashDrawer.confirmEmptyTitle
                  : terms.trashDrawer.confirmDeleteSelectionTitle(
                      confirmTarget.itemNames.length
                    )}
              </h3>
              <p className="trash-confirm-modal__text">
                {confirmTarget.mode === "empty"
                  ? terms.trashDrawer.confirmEmptyText
                  : terms.trashDrawer.confirmDeleteSelectionText}
              </p>
              <div className="trash-confirm-modal__actions">
                <button
                  type="button"
                  className="trash-confirm-modal__btn trash-confirm-modal__btn--cancel"
                  onClick={() => setConfirmTarget(null)}
                  disabled={isProcessing}
                >
                  {terms.trashDrawer.cancelBtn}
                </button>
                <button
                  type="button"
                  className="trash-confirm-modal__btn trash-confirm-modal__btn--danger"
                  onClick={() => void handleConfirmDeleteAction()}
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? terms.trashDrawer.deletingBtn
                    : terms.trashDrawer.confirmDeleteBtn}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
