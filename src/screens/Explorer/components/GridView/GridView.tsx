import React from "react";
import { FolderCard, TileKind } from "../../../../components/FolderCard/FolderCard";
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
  currentPathLabel?: string;
  entries: GridEntry[];
  selectedEntryId: string;
  onSelectEntry: (entry: GridEntry) => void;
  onOpenFolderEntry?: (entry: GridEntry) => void;
  onAddFolderOrFiles: () => void;

  // Split-View (Double affichage 2 projets distincts)
  isSplitViewActive: boolean;
  projects: string[];
  secondaryProject: string;
  onSelectSecondaryProject: (projectName: string) => void;
  secondaryPathLabel?: string;
  onResetSecondarySubpath?: () => void;
  secondaryEntries?: GridEntry[];
  selectedSecondaryEntryId?: string;
  onSelectSecondaryEntry?: (entry: GridEntry) => void;
  onOpenSecondaryFolderEntry?: (entry: GridEntry) => void;
}

export const GridView: React.FC<GridViewProps> = ({
  hasActiveProject,
  entries,
  selectedEntryId,
  onSelectEntry,
  onOpenFolderEntry,
  onAddFolderOrFiles,
  isSplitViewActive,
  projects,
  secondaryProject,
  onSelectSecondaryProject,
  secondaryPathLabel,
  onResetSecondarySubpath,
  secondaryEntries = [],
  selectedSecondaryEntryId = "",
  onSelectSecondaryEntry,
  onOpenSecondaryFolderEntry,
}) => {
  return (
    <section className={`grid-view ${isSplitViewActive ? "grid-view--split-active" : ""}`}>
      {/* PANNEAU PRINCIPAL (PROJET 1) */}
      <div className={`grid-view__primary ${isSplitViewActive ? "grid-view__primary--split" : ""}`}>
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
                    if (entry.isFolder && onOpenFolderEntry) {
                      onOpenFolderEntry(entry);
                    }
                  }}
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
        <aside className="grid-view__secondary">
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
                    if (sub.isFolder && onOpenSecondaryFolderEntry) {
                      onOpenSecondaryFolderEntry(sub);
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
