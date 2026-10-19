import React, { useEffect, useRef } from "react";
import "./ProjectTabPopover.css";

export const STANDARD_SUBFOLDERS = [
  "01-Docs",
  "02-Assets",
  "03-Sessions",
  "99-Archive",
];

export interface ProjectTabPopoverProps {
  project: string;
  x: number;
  availableSubfolders: string[];
  activeSubpath?: string;
  onNavigateSubfolder: (project: string, subfolder?: string) => void;
  onOpenInSecondary?: (project: string) => void;
  onRename?: (project: string) => void;
  onDelete?: (project: string) => void;
  onClose: () => void;
}

function getFolderIcon(folderName: string) {
  if (folderName.startsWith("01-Docs") || folderName.toLowerCase().includes("doc")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="popover-folder-icon popover-folder-icon--docs">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    );
  }
  if (folderName.startsWith("02-Assets") || folderName.toLowerCase().includes("asset")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="popover-folder-icon popover-folder-icon--assets">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }
  if (folderName.startsWith("03-Sessions") || folderName.toLowerCase().includes("session")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="popover-folder-icon popover-folder-icon--sessions">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );
  }
  if (folderName.startsWith("99-Archive") || folderName.toLowerCase().includes("archive")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="popover-folder-icon popover-folder-icon--archive">
        <polyline points="21 8 21 21 3 21 3 8" />
        <rect x="1" y="3" width="22" height="5" />
        <line x1="10" y1="12" x2="14" y2="12" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="popover-folder-icon">
      <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
    </svg>
  );
}

export const ProjectTabPopover: React.FC<ProjectTabPopoverProps> = ({
  project,
  x,
  availableSubfolders,
  activeSubpath,
  onNavigateSubfolder,
  onOpenInSecondary,
  onRename,
  onDelete,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
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

  // Combine standard folders with any existing custom folders
  const allFoldersSet = new Set<string>([...STANDARD_SUBFOLDERS, ...availableSubfolders]);
  const foldersList = Array.from(allFoldersSet);

  const popoverWidth = 260;
  const adjustedX = Math.max(10, Math.min(x, window.innerWidth - popoverWidth - 10));

  return (
    <div
      ref={popoverRef}
      className="project-tab-popover"
      style={{ left: `${adjustedX}px` }}
      role="menu"
      aria-label={`Navigation ${project}`}
    >
      <header className="project-tab-popover__header">
        <div className="project-tab-popover__title-row">
          <svg viewBox="0 0 24 24" fill="currentColor" className="project-tab-popover__project-icon">
            <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
          </svg>
          <span className="project-tab-popover__title" title={project}>
            {project}
          </span>
        </div>
        <button
          type="button"
          className="project-tab-popover__root-btn"
          onClick={() => {
            onNavigateSubfolder(project, undefined);
            onClose();
          }}
          title="Aller à la racine du projet"
        >
          Racine
        </button>
      </header>

      <div className="project-tab-popover__section">
        <span className="project-tab-popover__section-title">Sous-dossiers structurels</span>
        <div className="project-tab-popover__folder-list">
          {foldersList.map((folder) => {
            const isActive = activeSubpath === folder;
            return (
              <button
                key={folder}
                type="button"
                className={`project-tab-popover__folder-item ${isActive ? "project-tab-popover__folder-item--active" : ""}`}
                onClick={() => {
                  onNavigateSubfolder(project, folder);
                  onClose();
                }}
              >
                {getFolderIcon(folder)}
                <span className="project-tab-popover__folder-name">{folder}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="project-tab-popover__divider" />

      {/* Actions de gestion du projet */}
      <div className="project-tab-popover__actions">
        {onOpenInSecondary && (
          <button
            type="button"
            className="project-tab-popover__action-btn"
            onClick={() => {
              onOpenInSecondary(project);
              onClose();
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="3" x2="12" y2="21" />
              <polyline points="15 9 18 12 15 15" />
            </svg>
            <span>Ouvrir dans panneau secondaire</span>
          </button>
        )}

        {onRename && (
          <button
            type="button"
            className="project-tab-popover__action-btn"
            onClick={() => {
              onRename(project);
              onClose();
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span>Renommer le projet</span>
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            className="project-tab-popover__action-btn project-tab-popover__action-btn--danger"
            onClick={() => {
              onDelete(project);
              onClose();
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>Supprimer le projet</span>
          </button>
        )}
      </div>
    </div>
  );
};

