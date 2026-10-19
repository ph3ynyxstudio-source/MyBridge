import React from "react";
import { FileRow } from "../../../../components/FileRow/FileRow";
import { TreePanelSize } from "../../../../theme/config";
import { NavigationMode } from "../../../../theme/navigationMode";
import { UI_TERMS } from "../../../../theme/UI_TERMS";
import "./TreePanel.css";

export interface ProjectTreeNode {
  name: string;
  children?: string[];
}

export interface TreePanelProps {
  isOpen: boolean;
  size: TreePanelSize;
  projects: ProjectTreeNode[];
  expandedProjects: string[];
  onToggleProjectExpand: (projectName: string) => void;
  activeProject: string;
  activeFolder: string;
  onSelectFolder: (projectName: string, folderName?: string) => void;
  navigationMode: NavigationMode;
  onToggleNavigationMode: (mode: NavigationMode) => void;
  onContextMenuProject?: (e: React.MouseEvent, projectName: string) => void;
  onContextMenuFolder?: (
    e: React.MouseEvent,
    projectName: string,
    folderName: string
  ) => void;
  onContextMenuTreeBg?: (e: React.MouseEvent) => void;
}

export const TreePanel: React.FC<TreePanelProps> = ({
  isOpen,
  size,
  projects,
  expandedProjects,
  onToggleProjectExpand,
  activeProject,
  activeFolder,
  onSelectFolder,
  navigationMode,
  onToggleNavigationMode,
  onContextMenuProject,
  onContextMenuFolder,
  onContextMenuTreeBg,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <aside
      className={`tree-panel tree-panel--${size}`}
      onContextMenu={(e) => {
        if (onContextMenuTreeBg) {
          e.preventDefault();
          onContextMenuTreeBg(e);
        }
      }}
    >
      <div className="tree-panel__list">
        {projects.length === 0 ? (
          <div className="tree-panel__empty">{UI_TERMS.treePanel.emptyState}</div>
        ) : (
          projects.map((project) => {
            const isExpanded = expandedProjects.includes(project.name);
            const isProjectActive = activeProject === project.name && !activeFolder;

            return (
              <div key={project.name} className="tree-panel__group">
                <FileRow
                  name={project.name}
                  depth={0}
                  isFolder={true}
                  isExpanded={isExpanded}
                  isActive={isProjectActive}
                  onClick={() => {
                    onToggleProjectExpand(project.name);
                    onSelectFolder(project.name);
                  }}
                  onContextMenu={(e) => {
                    if (onContextMenuProject) {
                      e.preventDefault();
                      e.stopPropagation();
                      onContextMenuProject(e, project.name);
                    }
                  }}
                />

                {isExpanded &&
                  project.children?.map((childFolder) => (
                    <FileRow
                      key={`${project.name}/${childFolder}`}
                      name={childFolder}
                      depth={1}
                      isFolder={true}
                      isActive={
                        activeProject === project.name && activeFolder === childFolder
                      }
                      onClick={() => onSelectFolder(project.name, childFolder)}
                      onContextMenu={(e) => {
                        if (onContextMenuFolder) {
                          e.preventDefault();
                          e.stopPropagation();
                          onContextMenuFolder(e, project.name, childFolder);
                        }
                      }}
                    />
                  ))}
              </div>
            );
          })
        )}
      </div>

      {/* Pied du tree-panel : Toggle de Mode de Navigation (Split-Folder vs Preview-Focus) */}
      <div className="tree-panel__footer">
        <div
          className="tree-panel__split-switch"
          role="group"
          aria-label="Mode de navigation"
        >
          {/* Mode 'split-folder' (Par défaut) : Icône double dossier / vue scindée active */}
          <button
            type="button"
            className={`tree-panel__mode-pill ${
              navigationMode === "split-folder" ? "tree-panel__mode-pill--active" : ""
            }`}
            onClick={() => onToggleNavigationMode("split-folder")}
            title="Mode Navigation Scindée : double-cliquer un dossier l'ouvre dans le panneau secondaire"
            aria-label="Mode Navigation Scindée (dossiers dans le panneau secondaire)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="9" height="16" rx="2" />
              <rect x="13" y="4" width="9" height="16" rx="2" />
              <line x1="6.5" y1="9" x2="6.5" y2="15" />
              <line x1="17.5" y1="9" x2="17.5" y2="15" />
            </svg>
          </button>

          {/* Mode 'preview-focus' : Icône explorateur + aperçu (œil / loupe) */}
          <button
            type="button"
            className={`tree-panel__mode-pill ${
              navigationMode === "preview-focus" ? "tree-panel__mode-pill--active" : ""
            }`}
            onClick={() => onToggleNavigationMode("preview-focus")}
            title="Mode Focus & Prévisualisation : navigation directe dans la grille centrale et prévisualisation à droite"
            aria-label="Mode Focus & Prévisualisation (visualiseur à droite)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};
