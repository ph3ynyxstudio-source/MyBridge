import React, { useState, useRef, useCallback } from "react";
import { FolderCard, TileKind } from "../../../../components/FolderCard/FolderCard";
import { Breadcrumb } from "../Breadcrumb/Breadcrumb";
import { PreviewDrawer, PreviewFile } from "../PreviewDrawer/PreviewDrawer";
import { StandardFolderType } from "../../../../services/storageService";
import {
  formatFolderDisplayName,
  getUiTerms,
  LanguageMode,
} from "../../../../theme/UI_TERMS";
import "./GridView.css";

export interface GridEntry {
  id: string;
  label: string;
  kind: TileKind;
  isFolder: boolean;
  folderType?: StandardFolderType | null;
  absolutePath?: string;
  size?: number;
}

export interface GridViewProps {
  hasActiveProject: boolean;
  activeProject?: string;
  currentPathLabel?: string;
  language?: LanguageMode;
  onNavigateBreadcrumb?: (targetSubpath?: string) => void;
  entries: GridEntry[];
  selectedEntryId: string;
  selectedEntryIds?: Set<string>;
  onSelectEntry: (entry: GridEntry, e?: React.MouseEvent) => void;
  onMarqueeSelect?: (selectedIds: string[], additive: boolean) => void;
  onClearSelection?: () => void;
  onOpenFolderEntry?: (entry: GridEntry) => void;
  onOpenFileEntry?: (entry: GridEntry) => void;
  onAddFolderOrFiles: () => void;

  // Clic droit & Glisser-déposer
  onContextMenuCard?: (e: React.MouseEvent, entry: GridEntry) => void;
  onContextMenuGrid?: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent, entry: GridEntry) => void;
  onDropOnFolder?: (e: React.DragEvent, targetFolderEntry: GridEntry) => void;
  onDropOnBreadcrumb?: (e: React.DragEvent, targetSubpath?: string) => void;
  onDropOnGridBackground?: (e: React.DragEvent) => void;

  // Split-View (Double affichage 2 projets distincts)
  isSplitViewActive: boolean;
  projects: string[];
  secondaryProject: string;
  onSelectSecondaryProject: (projectName: string) => void;
  secondaryPathLabel?: string;
  onResetSecondarySubpath?: () => void;
  onNavigateSecondaryBreadcrumb?: (targetSubpath?: string) => void;
  onCloseSecondary?: () => void;
  secondaryEntries?: GridEntry[];
  selectedSecondaryEntryId?: string;
  onSelectSecondaryEntry?: (entry: GridEntry) => void;
  onOpenSecondaryFolderEntry?: (entry: GridEntry) => void;
  onOpenSecondaryFileEntry?: (entry: GridEntry) => void;
  onContextMenuSecondaryCard?: (e: React.MouseEvent, entry: GridEntry) => void;
  onContextMenuSecondaryGrid?: (e: React.MouseEvent) => void;
  onSecondaryDragStart?: (e: React.DragEvent, entry: GridEntry) => void;
  onSecondaryDropOnFolder?: (e: React.DragEvent, targetFolderEntry: GridEntry) => void;
  onDropOnSecondaryBreadcrumb?: (e: React.DragEvent, targetSubpath?: string) => void;
  onDropOnSecondaryGridBackground?: (e: React.DragEvent) => void;

  // Visualiseur bivalent (PreviewDrawer)
  previewFile?: PreviewFile | null;
  onClosePreview?: () => void;
  onOpenInSystem?: (project: string, subpath: string) => void;
  onFileSizeUpdated?: (project: string, subpath: string, newSize: number) => void;
}

export const GridView: React.FC<GridViewProps> = ({
  hasActiveProject,
  activeProject,
  currentPathLabel,
  language = "fr",
  onNavigateBreadcrumb,
  entries,
  selectedEntryId,
  selectedEntryIds,
  onSelectEntry,
  onMarqueeSelect,
  onClearSelection,
  onOpenFolderEntry,
  onOpenFileEntry,
  onAddFolderOrFiles,
  onContextMenuCard,
  onContextMenuGrid,
  onDragStart,
  onDropOnFolder,
  onDropOnBreadcrumb,
  onDropOnGridBackground,
  isSplitViewActive,
  projects,
  secondaryProject,
  onSelectSecondaryProject,
  secondaryPathLabel,
  onResetSecondarySubpath,
  onNavigateSecondaryBreadcrumb,
  onCloseSecondary,
  secondaryEntries = [],
  selectedSecondaryEntryId = "",
  onSelectSecondaryEntry,
  onOpenSecondaryFolderEntry,
  onOpenSecondaryFileEntry,
  onContextMenuSecondaryCard,
  onContextMenuSecondaryGrid,
  onSecondaryDragStart,
  onSecondaryDropOnFolder,
  onDropOnSecondaryBreadcrumb,
  onDropOnSecondaryGridBackground,
  previewFile,
  onClosePreview,
  onOpenInSystem,
  onFileSizeUpdated,
}) => {
  const isRightPanelOpen = Boolean(previewFile || isSplitViewActive);
  const primaryContainerRef = useRef<HTMLDivElement>(null);
  const terms = getUiTerms(language);

  // États de retour visuel lors du survol en Glisser-Déposer sur le fond vide des panneaux
  const [isPrimaryDragOver, setIsPrimaryDragOver] = useState(false);
  const [isSecondaryDragOver, setIsSecondaryDragOver] = useState(false);

  // État visuel du rectangle de sélection (Marquee Selection type Explorateur Windows)
  const [marqueeRect, setMarqueeRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const handlePrimaryMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Uniquement clic gauche
      if (e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        target.closest(".folder-card, .breadcrumb, button, input, select, a")
      ) {
        return;
      }

      const container = primaryContainerRef.current;
      if (!container) return;

      const isAdditive = e.ctrlKey || e.metaKey || e.shiftKey;
      const containerRect = container.getBoundingClientRect();
      const startX = e.clientX - containerRect.left + container.scrollLeft;
      const startY = e.clientY - containerRect.top + container.scrollTop;
      const startClientX = e.clientX;
      const startClientY = e.clientY;

      let hasDragged = false;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const currentContainerRect = container.getBoundingClientRect();
        const currentX =
          moveEvent.clientX - currentContainerRect.left + container.scrollLeft;
        const currentY =
          moveEvent.clientY - currentContainerRect.top + container.scrollTop;

        const dist = Math.hypot(
          moveEvent.clientX - startClientX,
          moveEvent.clientY - startClientY
        );

        if (!hasDragged && dist < 4) return;
        hasDragged = true;

        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        setMarqueeRect({ left, top, width, height });

        // Calcul d'intersection en coordonnées viewport avec chaque tuile de la grille
        const boxLeft = Math.min(startClientX, moveEvent.clientX);
        const boxRight = Math.max(startClientX, moveEvent.clientX);
        const boxTop = Math.min(startClientY, moveEvent.clientY);
        const boxBottom = Math.max(startClientY, moveEvent.clientY);

        const cardNodes = container.querySelectorAll<HTMLElement>(
          ".folder-card[data-entry-id]"
        );
        const intersectedIds: string[] = [];

        cardNodes.forEach((node) => {
          const id = node.getAttribute("data-entry-id");
          if (!id) return;
          const cardRect = node.getBoundingClientRect();
          const intersects =
            boxLeft < cardRect.right &&
            boxRight > cardRect.left &&
            boxTop < cardRect.bottom &&
            boxBottom > cardRect.top;
          if (intersects) {
            intersectedIds.push(id);
          }
        });

        onMarqueeSelect?.(intersectedIds, isAdditive);
      };

      const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        setMarqueeRect(null);

        if (!hasDragged && !isAdditive) {
          onClearSelection?.();
        }
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [onMarqueeSelect, onClearSelection]
  );

  const selectedCount = selectedEntryIds ? selectedEntryIds.size : selectedEntryId ? 1 : 0;

  return (
    <section className={`grid-view ${isRightPanelOpen ? "grid-view--split-active" : ""}`}>
      {/* PANNEAU PRINCIPAL (PROJET 1) */}
      <div
        ref={primaryContainerRef}
        className={`grid-view__primary ${
          isRightPanelOpen ? "grid-view__primary--split" : ""
        } ${marqueeRect ? "grid-view__primary--selecting" : ""} ${
          isPrimaryDragOver ? "grid-view__primary--drag-over" : ""
        }`}
        onMouseDown={handlePrimaryMouseDown}
        onDragOver={(e) => {
          if (!hasActiveProject || !onDropOnGridBackground) return;
          const target = e.target as HTMLElement | null;
          if (target && target.closest('.folder-card[data-folder="true"], .breadcrumb')) {
            if (isPrimaryDragOver) setIsPrimaryDragOver(false);
            return;
          }
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (!isPrimaryDragOver) {
            setIsPrimaryDragOver(true);
          }
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsPrimaryDragOver(false);
          }
        }}
        onDrop={(e) => {
          if (!hasActiveProject || !onDropOnGridBackground) return;
          const target = e.target as HTMLElement | null;
          if (target && target.closest('.folder-card[data-folder="true"], .breadcrumb')) {
            setIsPrimaryDragOver(false);
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          setIsPrimaryDragOver(false);
          onDropOnGridBackground(e);
        }}
        onContextMenu={(e) => {
          if (onContextMenuGrid) {
            e.preventDefault();
            onContextMenuGrid(e);
          }
        }}
      >
        {!hasActiveProject ? (
          <div className="grid-view__empty-card">
            <h3 className="grid-view__empty-title">
              {terms.gridView.noProjectsTitle}
            </h3>
            <p className="grid-view__empty-subtitle">
              {terms.gridView.noProjectsSubtitle}
            </p>
          </div>
        ) : (
          <>
            {/* Barre supérieure : Fil d'Ariane + Indicateur de multisélection */}
            <div className="grid-view__top-row">
              <Breadcrumb
                projectName={activeProject || ""}
                subpath={currentPathLabel}
                language={language}
                onNavigate={onNavigateBreadcrumb || (() => {})}
                onDropOnSegment={onDropOnBreadcrumb}
              />
              {selectedCount > 1 && (
                <div className="grid-view__selection-badge">
                  <span>{terms.gridView.selectedCount(selectedCount)}</span>
                  {onClearSelection && (
                    <button
                      type="button"
                      className="grid-view__selection-clear"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearSelection();
                      }}
                      title={terms.gridView.clearSelection}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Contenu du répertoire : Tuiles de dossiers, fichiers et tuile d'action (+) */}
            {entries.length === 0 ? (
              <div className="grid-view__empty-banner">
                <h4 className="grid-view__empty-title">
                  {terms.gridView.emptyProjectTitle}
                </h4>
                <p className="grid-view__empty-subtitle">
                  {terms.gridView.emptyProjectSubtitle}
                </p>
              </div>
            ) : (
              <div className="grid-view__tiles">
                {entries.map((entry) => {
                  const isSelected = selectedEntryIds
                    ? selectedEntryIds.has(entry.id)
                    : entry.id === selectedEntryId;
                  const displayLabel = entry.isFolder
                    ? formatFolderDisplayName(entry.label, entry.folderType, language)
                    : entry.label;
                  return (
                    <FolderCard
                      key={entry.id}
                      entryId={entry.id}
                      label={displayLabel}
                      kind={entry.kind}
                      selected={isSelected}
                      onClick={(e) => onSelectEntry(entry, e)}
                      onDoubleClick={() => {
                        if (entry.isFolder) {
                          onOpenFolderEntry?.(entry);
                        } else {
                          onOpenFileEntry?.(entry);
                        }
                      }}
                      draggable={true}
                      onDragStart={(e) => onDragStart?.(e, entry)}
                      onDragOver={() => {
                        if (entry.isFolder && isPrimaryDragOver) {
                          setIsPrimaryDragOver(false);
                        }
                      }}
                      onDrop={(e) => {
                        if (entry.isFolder && onDropOnFolder) {
                          setIsPrimaryDragOver(false);
                          onDropOnFolder(e, entry);
                        }
                      }}
                      onContextMenu={(e) => {
                        if (onContextMenuCard) {
                          e.preventDefault();
                          onContextMenuCard(e, entry);
                        }
                      }}
                    />
                  );
                })}

                {/* Tuile d'action « Ajouter dossier / fichiers » alignée dans la grille */}
                <FolderCard
                  label={terms.gridView.addTileLabel}
                  kind="add"
                  selected={false}
                  onClick={() => onAddFolderOrFiles()}
                  onDoubleClick={onAddFolderOrFiles}
                />
              </div>
            )}

            {/* Rectangle visuel de sélection (Marquee Selection) */}
            {marqueeRect && (
              <div
                className="grid-view__marquee"
                style={{
                  left: `${marqueeRect.left}px`,
                  top: `${marqueeRect.top}px`,
                  width: `${marqueeRect.width}px`,
                  height: `${marqueeRect.height}px`,
                }}
                aria-hidden="true"
              />
            )}
          </>
        )}
      </div>

      {/* PANNEAU DROIT BIVALENT : Visualiseur OU Explorateur secondaire */}
      {previewFile ? (
        <PreviewDrawer
          file={previewFile}
          onClose={onClosePreview || (() => {})}
          onOpenInSystem={onOpenInSystem || (() => {})}
          onFileSizeUpdated={onFileSizeUpdated}
        />
      ) : isSplitViewActive ? (
        <aside
          className={`grid-view__secondary ${
            isSecondaryDragOver ? "grid-view__secondary--drag-over" : ""
          }`}
          onDragOver={(e) => {
            if (!secondaryProject || !onDropOnSecondaryGridBackground) return;
            const target = e.target as HTMLElement | null;
            if (target && target.closest('.folder-card[data-folder="true"], .breadcrumb')) {
              if (isSecondaryDragOver) setIsSecondaryDragOver(false);
              return;
            }
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (!isSecondaryDragOver) {
              setIsSecondaryDragOver(true);
            }
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsSecondaryDragOver(false);
            }
          }}
          onDrop={(e) => {
            if (!secondaryProject || !onDropOnSecondaryGridBackground) return;
            const target = e.target as HTMLElement | null;
            if (target && target.closest('.folder-card[data-folder="true"], .breadcrumb')) {
              setIsSecondaryDragOver(false);
              return;
            }
            e.preventDefault();
            e.stopPropagation();
            setIsSecondaryDragOver(false);
            onDropOnSecondaryGridBackground(e);
          }}
          onContextMenu={(e) => {
            if (onContextMenuSecondaryGrid) {
              e.preventDefault();
              onContextMenuSecondaryGrid(e);
            } else if (onContextMenuGrid) {
              e.preventDefault();
              onContextMenuGrid(e);
            }
          }}
        >
          {/* En-tête du second projet */}
          <div className="grid-view__secondary-header">
            <div className="grid-view__secondary-title-group">
              <span className="grid-view__secondary-badge">PROJET 2</span>
              {projects.length > 0 ? (
                <select
                  className="grid-view__secondary-select"
                  value={secondaryProject}
                  onChange={(e) => onSelectSecondaryProject(e.target.value)}
                  aria-label={terms.gridView.splitViewSelectProject}
                >
                  {projects.map((proj) => (
                    <option key={proj} value={proj}>
                      {proj}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="grid-view__secondary-name">Aucun</span>
              )}
            </div>

            <div className="grid-view__secondary-actions">
              {secondaryPathLabel && onResetSecondarySubpath && (
                <button
                  type="button"
                  className="grid-view__secondary-back-btn"
                  onClick={onResetSecondarySubpath}
                  title="Retour à la racine du second projet"
                >
                  ← Racine
                </button>
              )}
              {onCloseSecondary && (
                <button
                  type="button"
                  className="grid-view__secondary-close-btn"
                  onClick={onCloseSecondary}
                  title="Fermer le panneau secondaire"
                  aria-label="Fermer le panneau secondaire"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Fil d'Ariane du second projet */}
          {secondaryProject && (
            <Breadcrumb
              projectName={secondaryProject}
              subpath={secondaryPathLabel}
              language={language}
              onNavigate={(target) => {
                if (onNavigateSecondaryBreadcrumb) {
                  onNavigateSecondaryBreadcrumb(target);
                } else if (!target && onResetSecondarySubpath) {
                  onResetSecondarySubpath();
                }
              }}
              onDropOnSegment={onDropOnSecondaryBreadcrumb}
            />
          )}

          {/* Grille du second projet */}
          {secondaryEntries.length === 0 ? (
            <div className="grid-view__secondary-empty">
              {terms.gridView.emptySecondary}
            </div>
          ) : (
            <div className="grid-view__secondary-tiles">
              {secondaryEntries.map((sub) => {
                const subDisplayLabel = sub.isFolder
                  ? formatFolderDisplayName(sub.label, sub.folderType, language)
                  : sub.label;
                return (
                <FolderCard
                  key={sub.id}
                  label={subDisplayLabel}
                  kind={sub.kind}
                  selected={sub.id === selectedSecondaryEntryId}
                  onClick={() => onSelectSecondaryEntry && onSelectSecondaryEntry(sub)}
                  onDoubleClick={() => {
                    if (sub.isFolder) {
                      if (onOpenSecondaryFolderEntry) onOpenSecondaryFolderEntry(sub);
                    } else {
                      if (onOpenSecondaryFileEntry) onOpenSecondaryFileEntry(sub);
                    }
                  }}
                  draggable={true}
                  onDragStart={(e) => {
                    if (onSecondaryDragStart) {
                      onSecondaryDragStart(e, sub);
                    } else {
                      onDragStart?.(e, sub);
                    }
                  }}
                  onDragOver={() => {
                    if (sub.isFolder && isSecondaryDragOver) {
                      setIsSecondaryDragOver(false);
                    }
                  }}
                  onDrop={(e) => {
                    if (sub.isFolder) {
                      setIsSecondaryDragOver(false);
                      if (onSecondaryDropOnFolder) {
                        onSecondaryDropOnFolder(e, sub);
                      } else if (onDropOnFolder) {
                        onDropOnFolder(e, sub);
                      }
                    }
                  }}
                  onContextMenu={(e) => {
                    if (onContextMenuSecondaryCard) {
                      onContextMenuSecondaryCard(e, sub);
                    } else {
                      onContextMenuCard?.(e, sub);
                    }
                  }}
                />
                );
              })}
            </div>
          )}
        </aside>
      ) : null}
    </section>
  );
};
