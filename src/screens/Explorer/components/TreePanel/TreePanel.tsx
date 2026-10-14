import React from "react";
import { FileRow } from "../../../../components/FileRow/FileRow";
import { TreePanelSize } from "../../../../theme/config";
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
  isSplitViewActive: boolean;
  onToggleSplitView: (active: boolean) => void;
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
  isSplitViewActive,
  onToggleSplitView,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <aside className={`tree-panel tree-panel--${size}`}>
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
                />

                {isExpanded &&
                  project.children?.map((childFolder) => (
                    <FileRow
                      key={`${project.name}/${childFolder}`}
                      name={childFolder}
                      depth={1}
                      isFolder={false}
                      isActive={
                        activeProject === project.name && activeFolder === childFolder
                      }
                      onClick={() => onSelectFolder(project.name, childFolder)}
                    />
                  ))}
              </div>
            );
          })
        )}
      </div>

      {/* Pied du tree-panel : sélecteur 1 vs 2 dossiers (Split-View 2 projets) */}
      <div className="tree-panel__footer">
        <div className="tree-panel__split-switch">
          {/* Bouton 1 dossier : Mode simple panneau */}
          <button
            type="button"
            className={`tree-panel__mode-pill ${
              !isSplitViewActive ? "tree-panel__mode-pill--active" : ""
            }`}
            onClick={() => onToggleSplitView(false)}
            title="Mode simple panneau (1 projet)"
            aria-label="Mode simple panneau (1 projet)"
          >
            <svg viewBox="0 0 24 20" fill="currentColor">
              <path d="M2 4a2 2 0 0 1 2-2h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4z" />
            </svg>
          </button>

          {/* Bouton 2 dossiers : Mode double panneau (Split-View) */}
          <button
            type="button"
            className={`tree-panel__mode-pill tree-panel__mode-pill--split ${
              isSplitViewActive ? "tree-panel__mode-pill--split-active" : ""
            }`}
            onClick={() => onToggleSplitView(true)}
            title="Mode double panneau / Split-View (2 projets)"
            aria-label="Mode double panneau / Split-View (2 projets)"
          >
            <svg viewBox="0 0 26 22" fill="none">
              <path
                d="M5 2a2 2 0 0 1 2-2h5l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-1V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
                fill="var(--accent-purple)"
                opacity="0.9"
              />
              <path
                d="M1 8a2 2 0 0 1 2-2h6l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8z"
                fill="var(--accent-blue)"
              />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};
