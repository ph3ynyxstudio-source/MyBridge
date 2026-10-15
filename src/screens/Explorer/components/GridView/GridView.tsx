import React from "react";
import { FolderCard, TileKind } from "../../../../components/FolderCard/FolderCard";
import { Breadcrumb } from "../Breadcrumb/Breadcrumb";
import { UI_TERMS } from "../../../../theme/UI_TERMS";
import "./GridView.css";

export interface GridEntry {
  id: string;
  label: string;
  kind: TileKind;
  isFolder: boolean;
}

export interface GridViewProps {
  hasActiveProject: boolean;
  activeProject?: string;
  currentPathLabel?: string;
  onNavigateBreadcrumb?: (targetSubpath?: string) => void;
  entries: GridEntry[];
  selectedEntryId: string;
  onSelectEntry: (entry: GridEntry) => void;
  onOpenFolderEntry?: (entry: GridEntry) => void;
  onOpenFileEntry?: (entry: GridEntry) => void;
  onAddFolderOrFiles: () => void;

  // Clic droit & Glisser-déposer
  onContextMenuCard?: (e: React.MouseEvent, entry: GridEntry) => void;
  onContextMenuGrid?: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent, entry: GridEntry) => void;
  onDropOnFolder?: (e: React.DragEvent, targetFolderEntry: GridEntry) => void;
  onDropOnBreadcrumb?: (e: React.DragEvent, targetSubpath?: string) => void;

  // Split-View (Double affichage 2 projets distincts)
  isSplitViewActive: boolean;
  projects: string[];
  secondaryProject: string;
  onSelectSecondaryProject: (projectName: string) => void;
  secondaryPathLabel?: string;
  onResetSecondarySubpath?: () => void;
  onNavigateSecondaryBreadcrumb?: (targetSubpath?: string) => void;
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
}

export const GridView: React.FC<GridViewProps> = ({
  hasActiveProject,
  activeProject,
  currentPathLabel,
  onNavigateBreadcrumb,
  entries,
  selectedEntryId,
  onSelectEntry,
  onOpenFolderEntry,
  onOpenFileEntry,
  onAddFolderOrFiles,
  onContextMenuCard,
  onContextMenuGrid,
  onDragStart,
  onDropOnFolder,
  onDropOnBreadcrumb,
  isSplitViewActive,
  projects,
  secondaryProject,
  onSelectSecondaryProject,
  secondaryPathLabel,
  onResetSecondarySubpath,
  onNavigateSecondaryBreadcrumb,
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
}) => {
  return (
    <section className={`grid-view ${isSplitViewActive ? "grid-view--split-active" : ""}`}>
      {/* PANNEAU PRINCIPAL (PROJET 1) */}
      <div
        className={`grid-view__primary ${isSplitViewActive ? "grid-view__primary--split" : ""}`}
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
              {UI_TERMS.gridView.noProjectsTitle}
            </h3>
            <p className="grid-view__empty-subtitle">
              {UI_TERMS.gridView.noProjectsSubtitle}
            </p>
          </div>
        ) : (
          <>
            {/* Fil d'Ariane de navigation dans le projet principal */}
            {activeProject && (
              <Breadcrumb
                projectName={activeProject}
                subpath={currentPathLabel}
                onNavigate={(target) => {
                  if (onNavigateBreadcrumb) onNavigateBreadcrumb(target);
                }}
                onDropOnSegment={onDropOnBreadcrumb}
              />
            )}

            {entries.length === 0 && (
              <div className="grid-view__empty-banner">
                <h3 className="grid-view__empty-title">
                  {UI_TERMS.gridView.emptyProjectTitle}
                </h3>
                <p className="grid-view__empty-subtitle">
                  {UI_TERMS.gridView.emptyProjectSubtitle}
                </p>
              </div>
            )}

            <div className="grid-view__tiles">
              {entries.map((entry) => (
                <FolderCard
                  key={entry.id}
                  label={entry.label}
                  kind={entry.kind}
                  selected={entry.id === selectedEntryId}
                  onClick={() => onSelectEntry(entry)}
                  onDoubleClick={() => {
                    if (entry.isFolder) {
                      if (onOpenFolderEntry) onOpenFolderEntry(entry);
                    } else {
                      if (onOpenFileEntry) onOpenFileEntry(entry);
                    }
                  }}
                  draggable={true}
                  onDragStart={(e) => onDragStart?.(e, entry)}
                  onDrop={(e) => {
                    if (entry.isFolder && onDropOnFolder) {
                      onDropOnFolder(e, entry);
                    }
                  }}
                  onContextMenu={(e) => onContextMenuCard?.(e, entry)}
                />
              ))}

              {/* Tuile "+ add folder/Files" intégrée directement à la grille */}
              <FolderCard
                label={UI_TERMS.gridView.addTileLabel}
                kind="add"
                onClick={onAddFolderOrFiles}
              />
            </div>
          </>
        )}
      </div>

      {/* SECOND PANNEAU (SPLIT-VIEW : PROJET 2 DISTINCT) */}
      {isSplitViewActive && (
        <aside
          className="grid-view__secondary"
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
                  aria-label={UI_TERMS.gridView.splitViewSelectProject}
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
          </div>

          {/* Fil d'Ariane du second projet */}
          {secondaryProject && (
            <Breadcrumb
              projectName={secondaryProject}
              subpath={secondaryPathLabel}
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
              {UI_TERMS.gridView.emptySecondary}
            </div>
          ) : (
            <div className="grid-view__secondary-tiles">
              {secondaryEntries.map((sub) => (
                <FolderCard
                  key={sub.id}
                  label={sub.label}
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
                  onDrop={(e) => {
                    if (sub.isFolder) {
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
              ))}
            </div>
          )}
        </aside>
      )}
    </section>
  );
};
