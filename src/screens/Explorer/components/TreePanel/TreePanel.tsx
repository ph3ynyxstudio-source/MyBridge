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
  onToggleSize: () => void;
  projects: ProjectTreeNode[];
  expandedProjects: string[];
  onToggleProjectExpand: (projectName: string) => void;
  activeProject: string;
  activeFolder: string;
  onSelectFolder: (projectName: string, folderName?: string) => void;
}

export const TreePanel: React.FC<TreePanelProps> = ({
  isOpen,
  size,
  onToggleSize,
  projects,
  expandedProjects,
  onToggleProjectExpand,
  activeProject,
  activeFolder,
  onSelectFolder,
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

      {/* Pied du tree-panel : sélecteur de taille fixe Compact / Large */}
      <div className="tree-panel__footer">
        <button
          type="button"
          className="tree-panel__mode-switch"
          onClick={onToggleSize}
          title={
            size === "compact"
              ? UI_TERMS.treePanel.sizeToggleCompact
              : UI_TERMS.treePanel.sizeToggleLarge
          }
        >
          <span
            className={`tree-panel__mode-pill ${
              size === "compact" ? "tree-panel__mode-pill--active" : ""
            }`}
          >
            <svg viewBox="0 0 24 20" fill="currentColor">
              <path d="M2 4a2 2 0 0 1 2-2h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4z" />
            </svg>
          </span>
          <span
            className={`tree-panel__mode-pill tree-panel__mode-pill--purple ${
              size === "large" ? "tree-panel__mode-pill--active" : ""
            }`}
          >
            <svg viewBox="0 0 24 20" fill="currentColor">
              <path d="M2 4a2 2 0 0 1 2-2h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4z" />
            </svg>
          </span>
        </button>
      </div>
    </aside>
  );
};
