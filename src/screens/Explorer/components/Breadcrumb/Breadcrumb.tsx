import React, { useMemo } from "react";
import "./Breadcrumb.css";

export interface BreadcrumbProps {
  projectName: string;
  subpath?: string;
  onNavigate: (targetSubpath?: string) => void;
}

interface BreadcrumbSegment {
  label: string;
  subpath?: string;
  isCurrent: boolean;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  projectName,
  subpath,
  onNavigate,
}) => {
  const segments: BreadcrumbSegment[] = useMemo(() => {
    if (!projectName) return [];

    const list: BreadcrumbSegment[] = [];
    const parts = subpath ? subpath.split("/").filter(Boolean) : [];

    // Racine du projet
    list.push({
      label: projectName,
      subpath: undefined,
      isCurrent: parts.length === 0,
    });

    // Sous-dossiers successifs
    let accum = "";
    parts.forEach((part, idx) => {
      accum = accum ? `${accum}/${part}` : part;
      list.push({
        label: part,
        subpath: accum,
        isCurrent: idx === parts.length - 1,
      });
    });

    return list;
  }, [projectName, subpath]);

  if (!projectName || segments.length === 0) {
    return null;
  }

  return (
    <nav className="breadcrumb" aria-label="Fil d'Ariane de navigation">
      <div className="breadcrumb__list">
        {segments.map((seg, index) => (
          <React.Fragment key={seg.subpath ?? "__root__"}>
            {index > 0 && (
              <span className="breadcrumb__separator" aria-hidden="true">
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 3l5 5-5 5" />
                </svg>
              </span>
            )}
            {seg.isCurrent ? (
              <span
                className="breadcrumb__item breadcrumb__item--current"
                aria-current="page"
              >
                {index === 0 && (
                  <svg
                    className="breadcrumb__icon"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                )}
                <span className="breadcrumb__label">{seg.label}</span>
              </span>
            ) : (
              <button
                type="button"
                className="breadcrumb__item breadcrumb__item--btn"
                onClick={() => onNavigate(seg.subpath)}
                title={`Revenir à ${seg.label}`}
              >
                {index === 0 && (
                  <svg
                    className="breadcrumb__icon"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                )}
                <span className="breadcrumb__label">{seg.label}</span>
              </button>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};
