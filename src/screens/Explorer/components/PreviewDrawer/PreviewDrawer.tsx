import React, { useEffect, useState, useRef, useCallback } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
  getFileAbsolutePath,
  getFileMetadata,
  readFileText,
  writeTextFile,
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

/**
 * Rendu sécurisé et léger du Markdown sans dépendance externe
 */
function renderMarkdown(content: string): React.ReactNode {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockBuffer: string[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${key++}`} className="preview-md-code-block">
            <code>{codeBlockBuffer.join("\n")}</code>
          </pre>
        );
        codeBlockBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      continue;
    }

    if (line.startsWith("# ")) {
      elements.push(<h1 key={key++} className="preview-md-h1">{line.slice(2)}</h1>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={key++} className="preview-md-h2">{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={key++} className="preview-md-h3">{line.slice(4)}</h3>);
    } else if (line.startsWith("> ")) {
      elements.push(<blockquote key={key++} className="preview-md-quote">{line.slice(2)}</blockquote>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(<li key={key++} className="preview-md-li">{line.slice(2)}</li>);
    } else if (line.trim() === "") {
      elements.push(<div key={key++} className="preview-md-spacer" />);
    } else {
      elements.push(<p key={key++} className="preview-md-p">{line}</p>);
    }
  }

  if (inCodeBlock && codeBlockBuffer.length > 0) {
    elements.push(
      <pre key={`code-${key++}`} className="preview-md-code-block">
        <code>{codeBlockBuffer.join("\n")}</code>
      </pre>
    );
  }

  return <div className="preview-drawer__markdown-rendered">{elements}</div>;
}

export const PreviewDrawer: React.FC<PreviewDrawerProps> = ({
  file,
  onClose,
  onOpenInSystem,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fileSrc, setFileSrc] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | undefined>(file.size);

  // Mini-éditeur texte / Markdown
  const [textContent, setTextContent] = useState<string>("");
  const [draftContent, setDraftContent] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "dirty" | "error">("saved");

  const saveTimerRef = useRef<number | null>(null);
  const lastSavedRef = useRef<string>("");

  const dotIdx = file.label.lastIndexOf(".");
  const ext = dotIdx > 0 ? file.label.slice(dotIdx + 1).toLowerCase() : "";
  const isImage = IMAGE_EXTENSIONS.has(ext);
  const isPdf = ext === "pdf";
  const isText = TEXT_EXTENSIONS.has(ext);
  const isMarkdown = ext === "md";
  const isSupported = isImage || isPdf || isText;

  // Récupération de la taille réelle si manquante
  useEffect(() => {
    let active = true;
    if (file.size === undefined || file.size === 0) {
      getFileMetadata(file.project, file.subpath)
        .then((meta) => {
          if (active && meta.size > 0) {
            setFileSize(meta.size);
          }
        })
        .catch(() => {
          // ignore fallback
        });
    } else {
      setFileSize(file.size);
    }
    return () => {
      active = false;
    };
  }, [file.project, file.subpath, file.size]);

  // Chargement du fichier
  useEffect(() => {
    let active = true;

    const loadContent = async () => {
      setLoading(true);
      setError(null);
      setFileSrc(null);
      setTextContent("");
      setDraftContent("");
      setIsEditMode(false);
      setSaveStatus("saved");

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
            setDraftContent(text);
            lastSavedRef.current = text;
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
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [file.project, file.subpath, isImage, isPdf, isText]);

  // Sauvegarde sécurisée
  const handleSave = useCallback(
    async (contentToSave: string) => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      setSaveStatus("saving");
      try {
        await writeTextFile(file.project, file.subpath, contentToSave);
        lastSavedRef.current = contentToSave;
        setTextContent(contentToSave);
        setSaveStatus("saved");
        // Mettre à jour la taille du fichier
        setFileSize(new Blob([contentToSave]).size);
      } catch (err) {
        console.error("Erreur lors de la sauvegarde du fichier :", err);
        setSaveStatus("error");
      }
    },
    [file.project, file.subpath]
  );

  // Modification du texte avec debounce 600ms
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    setDraftContent(nextVal);

    if (nextVal !== lastSavedRef.current) {
      setSaveStatus("dirty");

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = window.setTimeout(() => {
        void handleSave(nextVal);
      }, 600);
    } else {
      setSaveStatus("saved");
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    }
  };

  // Raccourci clavier Ctrl + S / Cmd + S
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      void handleSave(draftContent);
    }
  };

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
              {file.project} / {file.subpath} • {formatBytes(fileSize)}
            </span>
          </div>
        </div>

        <div className="preview-drawer__actions">
          {/* Indicateur de sauvegarde en mode édition */}
          {isText && isEditMode && (
            <div className={`preview-drawer__status-pill preview-drawer__status-pill--${saveStatus}`}>
              {saveStatus === "saving" && "Enregistrement..."}
              {saveStatus === "dirty" && "Modification en cours..."}
              {saveStatus === "saved" && "Enregistré"}
              {saveStatus === "error" && "Erreur d'enregistrement"}
            </div>
          )}

          {/* Bouton de bascule Aperçu (œil) <-> Édition (crayon) */}
          {isText && (
            <button
              type="button"
              className={`preview-drawer__mode-btn ${isEditMode ? "preview-drawer__mode-btn--active" : ""}`}
              onClick={() => {
                if (isEditMode && draftContent !== lastSavedRef.current) {
                  void handleSave(draftContent);
                }
                setIsEditMode((prev) => !prev);
              }}
              title={isEditMode ? "Mode Aperçu (lecture seule)" : "Mode Édition (crayon)"}
            >
              {isEditMode ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>Aperçu</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>Modifier</span>
                </>
              )}
            </button>
          )}

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
        ) : isText ? (
          isEditMode ? (
            <div className="preview-drawer__editor-container">
              <textarea
                className="preview-drawer__editor-textarea"
                value={draftContent}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder="Rédigez ou éditez du contenu ici... (Sauvegarde automatique ou Ctrl+S)"
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="preview-drawer__text-container">
              {isMarkdown ? (
                renderMarkdown(draftContent || textContent)
              ) : (
                <pre className="preview-drawer__text-pre">{draftContent || textContent}</pre>
              )}
            </div>
          )
        ) : null}
      </div>
    </aside>
  );
};
