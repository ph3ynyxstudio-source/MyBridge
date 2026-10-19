import React, { useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
  getFileAbsolutePath,
  readFileText,
} from "../../../../services/storageService";
import "./PreviewDrawer.css";

export interface PreviewFile {
  project: string;
  subpath: string;
  label: string;
  size?: number;
}

export interface PreviewDrawerProps {
  file: PreviewFile;
  onClose: () => void;
  onOpenInSystem: (project: string, subpath: string) => void;
}

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "svg",
  "gif",
  "bmp",
  "ico",
]);

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "log",
  "json",
  "toml",
  "yaml",
  "yml",
  "rs",
  "ts",
  "tsx",
  "js",
  "jsx",
  "css",
  "html",
]);

function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null || bytes === 0) return "0 o";
  const k = 1024;
  const sizes = ["o", "Ko", "Mo", "Go"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const PreviewDrawer: React.FC<PreviewDrawerProps> = ({
  file,
  onClose,
  onOpenInSystem,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fileSrc, setFileSrc] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  const dotIdx = file.label.lastIndexOf(".");
  const ext = dotIdx > 0 ? file.label.slice(dotIdx + 1).toLowerCase() : "";
  const isImage = IMAGE_EXTENSIONS.has(ext);
  const isPdf = ext === "pdf";
  const isText = TEXT_EXTENSIONS.has(ext);
  const isSupported = isImage || isPdf || isText;

  useEffect(() => {
    let active = true;

    const loadContent = async () => {
      setLoading(true);
      setError(null);
      setFileSrc(null);
      setTextContent(null);

      try {
        if (isImage || isPdf) {
          const absPath = await getFileAbsolutePath(file.project, file.subpath);
          if (active) {
            setFileSrc(convertFileSrc(absPath));
          }
        } else if (isText) {
          const text = await readFileText(file.project, file.subpath);
          if (active) {
            setTextContent(text);
          }
        }
      } catch (err: unknown) {
        if (active) {
          const msg = typeof err === "string" ? err : String(err);
          setError(msg);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadContent();

    return () => {
      active = false;
    };
  }, [file.project, file.subpath, isImage, isPdf, isText]);

  return (
    <aside className="preview-drawer" role="region" aria-label="Visualiseur de document">
      {/* En-tête du Visualiseur */}
      <div className="preview-drawer__header">
        <div className="preview-drawer__info">
          <span className="preview-drawer__badge">{ext || "FICHIER"}</span>
          <div className="preview-drawer__title-meta">
            <span className="preview-drawer__title" title={file.label}>
              {file.label}
            </span>
            <span className="preview-drawer__meta">
              {file.project} / {file.subpath} • {formatBytes(file.size)}
            </span>
          </div>
        </div>

        <div className="preview-drawer__actions">
          <button
            type="button"
            className="preview-drawer__system-btn"
            onClick={() => onOpenInSystem(file.project, file.subpath)}
            title="Ouvrir dans l'application par défaut Windows"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span>Ouvrir dans Windows</span>
          </button>

          <button
            type="button"
            className="preview-drawer__close-btn"
            onClick={onClose}
            title="Fermer le visualiseur"
            aria-label="Fermer le visualiseur"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Contenu de la prévisualisation */}
      <div className="preview-drawer__body">
        {loading ? (
          <div className="preview-drawer__state">
            <svg
              className="preview-drawer__state-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
            </svg>
            <span className="preview-drawer__state-title">Chargement de l'aperçu...</span>
          </div>
        ) : error ? (
          <div className="preview-drawer__state">
            <span className="preview-drawer__state-title">Impossible de charger l'aperçu</span>
            <span className="preview-drawer__state-desc">{error}</span>
            <button
              type="button"
              className="preview-drawer__system-btn"
              onClick={() => onOpenInSystem(file.project, file.subpath)}
            >
              Ouvrir avec le système hôte
            </button>
          </div>
        ) : !isSupported ? (
          <div className="preview-drawer__state">
            <span className="preview-drawer__state-title">Aperçu non disponible</span>
            <span className="preview-drawer__state-desc">
              Le type de fichier (.{ext}) ne prend pas en charge la prévisualisation intégrée.
            </span>
            <button
              type="button"
              className="preview-drawer__system-btn"
              onClick={() => onOpenInSystem(file.project, file.subpath)}
            >
              Ouvrir dans l'application par défaut Windows
            </button>
          </div>
        ) : isImage && fileSrc ? (
          <div className="preview-drawer__image-container">
            <img src={fileSrc} alt={file.label} className="preview-drawer__image" />
          </div>
        ) : isPdf && fileSrc ? (
          <div className="preview-drawer__pdf-container">
            <iframe
              src={fileSrc}
              className="preview-drawer__pdf"
              title={file.label}
            />
          </div>
        ) : isText && textContent !== null ? (
          <div className="preview-drawer__text-container">
            <pre className="preview-drawer__text-pre">{textContent}</pre>
          </div>
        ) : null}
      </div>
    </aside>
  );
};

