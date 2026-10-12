import React from "react";
import { FolderCard, TileKind } from "../../../../components/FolderCard/FolderCard";
import { UI_TERMS } from "../../../../theme/UI_TERMS";
import "./GridView.css";

export interface GridEntry {
  id: string;
  label: string;
  kind: TileKind;
}

export interface GridViewProps {
  entries: GridEntry[];
  selectedEntryId: string;
  onSelectEntry: (id: string) => void;
  onAddFolderOrFiles: () => void;
  subEntries?: GridEntry[];
  selectedSubEntryId?: string;
  onSelectSubEntry?: (id: string) => void;
  isPreviewDrawerOpen: boolean;
  onTogglePreviewDrawer: () => void;
}

export const GridView: React.FC<GridViewProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
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
        <div className="grid-view__tiles">
          {entries.map((entry) => (
            <FolderCard
              key={entry.id}
              label={entry.label}
              kind={entry.kind}
              selected={entry.id === selectedEntryId}
              onClick={() => onSelectEntry(entry.id)}
            />
          ))}

          {/* Tuile "+ add folder/Files" intégrée directement à la grille */}
          <FolderCard
            label={UI_TERMS.gridView.addTileLabel}
            kind="add"
            onClick={onAddFolderOrFiles}
          />
        </div>
      </div>

      {/* Volet secondaire / aperçu du dossier sélectionné (bordure cyan arrondie fidèle au mockup) */}
      {isPreviewDrawerOpen && (
        <aside className="grid-view__secondary">
          <div className="grid-view__secondary-tiles">
            {subEntries.map((sub) => (
              <FolderCard
                key={sub.id}
                label={sub.label}
                kind={sub.kind}
                selected={sub.id === selectedSubEntryId}
                onClick={() => onSelectSubEntry && onSelectSubEntry(sub.id)}
              />
            ))}
          </div>

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
