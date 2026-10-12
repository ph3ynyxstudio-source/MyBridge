import React from "react";
import "./FileRow.css";

export interface FileRowProps {
  name: string;
  depth?: number;
  isFolder?: boolean;
  isExpanded?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

export const FileRow: React.FC<FileRowProps> = ({
  name,
  depth = 0,
  isFolder = false,
  isExpanded = false,
  isActive = false,
  onClick,
}) => {
  return (
    <button
      type="button"
      className={[
        "file-row",
        depth > 0 ? "file-row--child" : "file-row--root",
        isActive ? "file-row--active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ paddingLeft: `${12 + depth * 14}px` }}
      onClick={onClick}
    >
      {isFolder && (
        <span className="file-row__chevron" aria-hidden="true">
          {isExpanded ? "v" : ">"}
        </span>
      )}
      <span className="file-row__label">{name}</span>
    </button>
  );
};
