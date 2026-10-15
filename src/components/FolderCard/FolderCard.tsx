import React, { useState } from "react";
import "./FolderCard.css";

export type TileKind = "folder" | "image" | "file" | "add";

export interface FolderCardProps {
  label: string;
  kind?: TileKind;
  selected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  label,
  kind = "folder",
  selected = false,
  onClick,
  onDoubleClick,
  onContextMenu,
  draggable = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const isAddTile = kind === "add";
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      className={[
        "folder-card",
        selected ? "folder-card--selected" : "",
        isAddTile ? "folder-card--add" : "",
        isDragOver ? "folder-card--drag-over" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      onDoubleClick={onDoubleClick}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e);
        }
      }}
      draggable={draggable && !isAddTile}
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart?.(e);
      }}
      onDragOver={(e) => {
        if (kind === "folder") {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = "move";
          setIsDragOver(true);
        }
        onDragOver?.(e);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        onDragLeave?.(e);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        onDrop?.(e);
      }}
      title={label}
    >
      <div className="folder-card__icon-wrapper">
        {kind === "folder" && (
          <svg
            className="folder-card__svg folder-card__svg--folder"
            viewBox="0 0 80 64"
            aria-hidden="true"
          >
            <path
              d="M6 10C6 6.686 8.686 4 12 4H30L37 12H68C71.314 12 74 14.686 74 18V54C74 57.314 71.314 60 68 60H12C8.686 60 6 57.314 6 54V10Z"
              fill="currentColor"
            />
          </svg>
        )}

        {kind === "add" && (
          <svg
            className="folder-card__svg folder-card__svg--add"
            viewBox="0 0 80 64"
            aria-hidden="true"
          >
            <path
              d="M6 10C6 6.686 8.686 4 12 4H30L37 12H68C71.314 12 74 14.686 74 18V54C74 57.314 71.314 60 68 60H12C8.686 60 6 57.314 6 54V10Z"
              fill="currentColor"
            />
            <path
              d="M40 22V48M27 35H53"
              stroke="var(--text-primary)"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          </svg>
        )}

        {kind === "image" && (
          <svg
            className="folder-card__svg folder-card__svg--image"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2.5" />
            <circle cx="9" cy="8.5" r="1.8" />
            <path d="M21 16L15.5 10.5L6 20" />
            <path d="M13 18L9 14L3 20" />
          </svg>
        )}

        {kind === "file" && (
          <svg
            className="folder-card__svg folder-card__svg--file"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        )}
      </div>

      <span className="folder-card__label">{label}</span>
    </div>
  );
};
