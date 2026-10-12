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
  subEntries?: GridEntry[];
  selectedSubEntryId?: string;
  onSelectSubEntry?: (entry: GridEntry) => void;
  isPreviewDrawerOpen: boolean;
  onTogglePreviewDrawer: () => void;
}

export const GridView: React.FC<GridViewProps> = ({
  hasActiveProject,
  entries,
  selectedEntryId,
  onSelectEntry,
  onOpenFolderEntry,
  onAddFolderOrFiles,
  subEntries = [],
  selectedSubEntryId = "",
  onSelectSubEntry,
  isPreviewDrawerOpen,
  onTogglePreviewDrawer,
}) => {
  return (
    <section className="grid-view">
      {/* Grille principale du projet courant sur fond texturé carbone */}
      <div className="grid-view__primary">
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

      {/* Volet secondaire / aperçu du dossier sélectionné (bordure cyan arrondie fidèle au mockup) */}
      {hasActiveProject && isPreviewDrawerOpen && (
        <aside className="grid-view__secondary">
          {subEntries.length === 0 ? (
            <div className="grid-view__secondary-empty">
              {UI_TERMS.gridView.emptySecondary}
            </div>
          ) : (
            <div className="grid-view__secondary-tiles">
              {subEntries.map((sub) => (
                <FolderCard
                  key={sub.id}
                  label={sub.label}
                  kind={sub.kind}
                  selected={sub.id === selectedSubEntryId}
                  onClick={() => onSelectSubEntry && onSelectSubEntry(sub)}
                />
              ))}
            </div>
          )}

          {/* Poignée latérale droite (pilule cyan avec flèche) */}
          <button
            type="button"
            className="grid-view__drawer-handle"
            onClick={onTogglePreviewDrawer}
            title={UI_TERMS.gridView.previewDrawerToggle}
            aria-label={UI_TERMS.gridView.previewDrawerToggle}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </button>
        </aside>
      )}
    </section>
  );
};
