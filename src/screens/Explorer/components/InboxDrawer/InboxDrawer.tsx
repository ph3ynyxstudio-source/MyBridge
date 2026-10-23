import React, { useState, useEffect, useCallback, useMemo } from "react";
import { InboxItem, getInboxItems } from "../../../../services/storageService";
import "./InboxDrawer.css";

export type InboxSortOption = "date-desc" | "date-asc" | "name-asc" | "name-desc";
export type InboxFilterType = "all" | "images" | "texts" | "folders";

export interface InboxDrawerProps {
  isOpen: boolean;
  items: InboxItem[];
  projects: string[];
  defaultTargetProject: string;
  availableSubfolders: Record<string, string[]>;
  onClose: () => void;
  onRefreshInbox: () => void;
  onMoveItem: (
    itemName: string,
    targetProject: string,
    targetSubpath?: string
  ) => Promise<void>;
  onCreateProject?: (projectName: string) => Promise<void>;
}

function formatByteSize(bytes: number, isDir: boolean): string {
  if (isDir) return "Dossier";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} Ko`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} Mo`;
}

function formatTimestamp(sec: number): string {
  if (!sec) return "";
  const d = new Date(sec * 1000);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getItemIcon(item: InboxItem) {
  if (item.est_dossier) {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="inbox-item__icon inbox-item__icon--folder">
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      </svg>
    );
  }
  const ext = (item.extension || "").toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "svg", "gif"].includes(ext)) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inbox-item__icon inbox-item__icon--image">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }
  if (ext === "pdf") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inbox-item__icon inbox-item__icon--pdf">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="13" y2="17" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inbox-item__icon inbox-item__icon--doc">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export const InboxDrawer: React.FC<InboxDrawerProps> = ({
  isOpen,
  items,
  projects,
  availableSubfolders,
  onClose,
  onRefreshInbox,
  onMoveItem,
  onCreateProject,
}) => {
  // Sélection multiple des éléments de l'inbox
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [dragOverProject, setDragOverProject] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtrage et Tri dans la Boîte de dépôt
  const [sortOption, setSortOption] = useState<InboxSortOption>("date-desc");
  const [filterType, setFilterType] = useState<InboxFilterType>("all");

  // État d'expansion en accordéon des dossiers de la liste
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderChildren, setFolderChildren] = useState<Record<string, InboxItem[]>>({});
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());

  // Création de nouveau projet inline dans la grille des drop zones
  const [isCreatingProject, setIsCreatingProject] = useState<boolean>(false);
  const [newProjectInput, setNewProjectInput] = useState<string>("");
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedItems(new Set());
      setExpandedFolders(new Set());
      setFolderChildren({});
      setLoadingFolders(new Set());
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsCreatingProject(false);
      setNewProjectInput("");
      setCreateError(null);
    }
  }, [isOpen]);

  // Bascule de dépliage / repliage d'un dossier (accordéon)
  const toggleFolderExpansion = useCallback(
    async (folderPath: string) => {
      const isCurrentlyExpanded = expandedFolders.has(folderPath);

      setExpandedFolders((prev) => {
        const next = new Set(prev);
        if (isCurrentlyExpanded) {
          next.delete(folderPath);
        } else {
          next.add(folderPath);
        }
        return next;
      });

      if (!isCurrentlyExpanded) {
        setLoadingFolders((prev) => new Set(prev).add(folderPath));
        try {
          const children = await getInboxItems(folderPath);
          setFolderChildren((prev) => ({ ...prev, [folderPath]: children }));
        } catch (err) {
          console.error(`Erreur lecture sous-dossier inbox '${folderPath}' :`, err);
          setFolderChildren((prev) => ({ ...prev, [folderPath]: [] }));
        } finally {
          setLoadingFolders((prev) => {
            const next = new Set(prev);
            next.delete(folderPath);
            return next;
          });
        }
      }
    },
    [expandedFolders]
  );

  // Rafraîchir les sous-dossiers ouverts lorsque le contenu de l'inbox est actualisé
  const refreshExpandedFolders = useCallback(async () => {
    if (expandedFolders.size === 0) return;
    for (const folderPath of Array.from(expandedFolders)) {
      try {
        const children = await getInboxItems(folderPath);
        setFolderChildren((prev) => ({ ...prev, [folderPath]: children }));
      } catch {
        // ignore
      }
    }
  }, [expandedFolders]);

  useEffect(() => {
    void refreshExpandedFolders();
  }, [items, refreshExpandedFolders]);

  // Nettoyer les éléments sélectionnés qui n'existent plus dans items
  useEffect(() => {
    const existing = new Set(items.map((i) => i.nom));
    setSelectedItems((prev) => {
      const next = new Set<string>();
      for (const nom of prev) {
        if (existing.has(nom)) next.add(nom);
      }
      return next;
    });
  }, [items]);

  const toggleSelectItem = useCallback((nom: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(nom)) {
        next.delete(nom);
      } else {
        next.add(nom);
      }
      return next;
    });
  }, []);

  const IMAGE_EXTS = useMemo(
    () => new Set(["png", "jpg", "jpeg", "webp", "svg", "gif", "bmp", "ico"]),
    []
  );
  const TEXT_EXTS = useMemo(
    () =>
      new Set([
        "txt",
        "md",
        "markdown",
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
        "pdf",
      ]),
    []
  );

  const processedItems = useMemo(() => {
    let list = [...items];

    if (filterType === "images") {
      list = list.filter(
        (i) => !i.est_dossier && i.extension && IMAGE_EXTS.has(i.extension.toLowerCase())
      );
    } else if (filterType === "texts") {
      list = list.filter(
        (i) => !i.est_dossier && i.extension && TEXT_EXTS.has(i.extension.toLowerCase())
      );
    } else if (filterType === "folders") {
      list = list.filter((i) => i.est_dossier);
    }

    list.sort((a, b) => {
      switch (sortOption) {
        case "date-desc":
          return (b.date_modification || 0) - (a.date_modification || 0);
        case "date-asc":
          return (a.date_modification || 0) - (b.date_modification || 0);
        case "name-asc":
          return a.nom.localeCompare(b.nom, undefined, { numeric: true, sensitivity: "base" });
        case "name-desc":
          return b.nom.localeCompare(a.nom, undefined, { numeric: true, sensitivity: "base" });
        default:
          return 0;
      }
    });

    return list;
  }, [items, filterType, sortOption, IMAGE_EXTS, TEXT_EXTS]);

  const isAllSelected =
    processedItems.length > 0 &&
    processedItems.every((i) => selectedItems.has(i.nom));

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedItems((prev) => {
        const next = new Set(prev);
        for (const item of processedItems) {
          next.delete(item.nom);
        }
        return next;
      });
    } else {
      setSelectedItems((prev) => {
        const next = new Set(prev);
        for (const item of processedItems) {
          next.add(item.nom);
        }
        return next;
      });
    }
  }, [isAllSelected, processedItems]);

  // Glisser-déposer depuis la liste vers un projet
  const handleDragStart = (e: React.DragEvent, _item: InboxItem, path: string) => {
    let itemsToDrag: string[];
    if (selectedItems.has(path)) {
      itemsToDrag = Array.from(selectedItems);
    } else {
      itemsToDrag = [path];
      setSelectedItems(new Set([path]));
    }

    const payload = JSON.stringify({
      source: "inbox",
      items: itemsToDrag,
    });
    e.dataTransfer.setData("application/json", payload);
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "move";
  };

  // Dépôt d'éléments sur un projet cible
  const handleDropOnProject = async (e: React.DragEvent, targetProject: string) => {
    e.preventDefault();
    setDragOverProject(null);
    setErrorMsg(null);
    setSuccessMsg(null);

    let itemsToMove: string[] = [];
    const raw = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.items)) {
          itemsToMove = parsed.items;
        } else if (Array.isArray(parsed)) {
          itemsToMove = parsed;
        }
      } catch {
        // Fallback
      }
    }

    if (itemsToMove.length === 0 && selectedItems.size > 0) {
      itemsToMove = Array.from(selectedItems);
    }

    if (itemsToMove.length === 0) return;

    setIsMoving(true);
    try {
      for (const itemName of itemsToMove) {
        await onMoveItem(itemName, targetProject, undefined);
      }
      setSuccessMsg(
        `${itemsToMove.length} élément(s) déplacé(s) avec succès dans « ${targetProject} »`
      );
      setSelectedItems(new Set());
      onRefreshInbox();
    } catch (err: unknown) {
      setErrorMsg(typeof err === "string" ? err : String(err));
    } finally {
      setIsMoving(false);
    }
  };

  // Soumission de la création d'un projet inline
  const handleCreateProjectSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newProjectInput.trim();
    if (!trimmed) {
      setCreateError("Le nom du projet ne peut pas être vide.");
      return;
    }
    if (projects.includes(trimmed)) {
      setCreateError("Un projet portant ce nom existe déjà.");
      return;
    }
    if (!onCreateProject) return;

    try {
      setCreateError(null);
      await onCreateProject(trimmed);
      setNewProjectInput("");
      setIsCreatingProject(false);
      setSuccessMsg(`Projet « ${trimmed} » créé avec succès.`);
    } catch (err: unknown) {
      setCreateError(typeof err === "string" ? err : String(err));
    }
  };

  // Rendu récursif d'un élément (fichier ou dossier avec accordéon extensible)
  const renderInboxItem = (
    item: InboxItem,
    parentPath = "",
    depth = 0
  ): React.ReactNode => {
    const itemPath = parentPath ? `${parentPath}/${item.nom}` : item.nom;
    const isSelected = selectedItems.has(itemPath);
    const isFolder = item.est_dossier;
    const isExpanded = expandedFolders.has(itemPath);
    const isLoading = loadingFolders.has(itemPath);
    const children = folderChildren[itemPath];

    return (
      <React.Fragment key={itemPath}>
        <li
          className={`inbox-workspace__item ${
            isSelected ? "inbox-workspace__item--selected" : ""
          } ${depth > 0 ? "inbox-workspace__item--child" : ""} ${
            isFolder ? "inbox-workspace__item--folder" : ""
          }`}
          draggable={true}
          onDragStart={(e) => handleDragStart(e, item, itemPath)}
          onClick={() => toggleSelectItem(itemPath)}
          onDoubleClick={(e) => {
            if (isFolder) {
              e.stopPropagation();
              void toggleFolderExpansion(itemPath);
            }
          }}
          title={
            isFolder
              ? "Double-clic pour ouvrir / fermer le dossier"
              : item.nom
          }
        >
          <div
            className="inbox-workspace__item-checkbox"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelectItem(itemPath)}
              aria-label={`Sélectionner ${item.nom}`}
            />
          </div>

          <div className="inbox-workspace__item-icon">
            {isFolder && (
              <span
                className={`inbox-workspace__folder-chevron ${
                  isExpanded ? "inbox-workspace__folder-chevron--expanded" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  void toggleFolderExpansion(itemPath);
                }}
                title={isExpanded ? "Replier" : "Déplier"}
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            )}
            {getItemIcon(item)}
          </div>

          <div className="inbox-workspace__item-details">
            <span className="inbox-workspace__item-name" title={item.nom}>
              {item.nom}
            </span>
            <div className="inbox-workspace__item-meta">
              <span>{formatByteSize(item.taille, item.est_dossier)}</span>
              {item.date_modification > 0 && (
                <>
                  <span>•</span>
                  <span>{formatTimestamp(item.date_modification)}</span>
                </>
              )}
            </div>
          </div>

          <div
            className="inbox-workspace__item-drag-handle"
            title="Glissez cet élément"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="1.5" />
              <circle cx="15" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" />
              <circle cx="15" cy="18" r="1.5" />
            </svg>
          </div>
        </li>

        {/* Contenu enfant en accordéon (flux naturel repoussant les éléments suivants) */}
        {isFolder && isExpanded && (
          <li
            key={`${itemPath}__accordion`}
            className="inbox-workspace__accordion-row"
          >
            {isLoading ? (
              <div className="inbox-workspace__accordion-loading">
                <svg
                  className="inbox-workspace__spinner"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span>Chargement du contenu...</span>
              </div>
            ) : !children || children.length === 0 ? (
              <div className="inbox-workspace__accordion-empty">
                Dossier vide
              </div>
            ) : (
              <ul className="inbox-workspace__sublist">
                {children.map((child) =>
                  renderInboxItem(child, itemPath, depth + 1)
                )}
              </ul>
            )}
          </li>
        )}
      </React.Fragment>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="inbox-workspace-backdrop" onClick={onClose}>
      <div className="inbox-workspace" onClick={(e) => e.stopPropagation()}>
        {/* PANNEAU GAUCHE : VUE EN LISTE AVEC MULTI-SÉLECTION */}
        <aside className="inbox-workspace__sidebar">
          <header className="inbox-workspace__header">
            <div className="inbox-workspace__title-group">
              <div className="inbox-workspace__title-row">
                <span className="inbox-workspace__badge-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </span>
                <h2 className="inbox-workspace__title">Boîte de dépôt</h2>
                {items.length > 0 && (
                  <span className="inbox-workspace__count">{items.length}</span>
                )}
              </div>
              <p className="inbox-workspace__subtitle">
                Glissez les éléments sélectionnés sur un projet cible
              </p>
            </div>

            <div className="inbox-workspace__header-actions">
              <button
                type="button"
                className="inbox-workspace__btn inbox-workspace__btn--ghost"
                onClick={onRefreshInbox}
                title="Actualiser la liste"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 0 0-15.5-6.3L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 15.5 6.3L21 16" />
                  <path d="M16 16h5v5" />
                </svg>
              </button>
              <button
                type="button"
                className="inbox-workspace__btn inbox-workspace__btn--close"
                onClick={onClose}
                title="Fermer"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
          </header>

          {/* Barre de contrôle rapide : Filtres par type & Tri */}
          {items.length > 0 && (
            <div className="inbox-workspace__controls">
              <div className="inbox-workspace__filter-pills">
                <button
                  type="button"
                  className={`inbox-workspace__filter-pill ${filterType === "all" ? "inbox-workspace__filter-pill--active" : ""}`}
                  onClick={() => setFilterType("all")}
                >
                  Tous ({items.length})
                </button>
                <button
                  type="button"
                  className={`inbox-workspace__filter-pill ${filterType === "images" ? "inbox-workspace__filter-pill--active" : ""}`}
                  onClick={() => setFilterType("images")}
                >
                  Images
                </button>
                <button
                  type="button"
                  className={`inbox-workspace__filter-pill ${filterType === "texts" ? "inbox-workspace__filter-pill--active" : ""}`}
                  onClick={() => setFilterType("texts")}
                >
                  Markdown / Textes
                </button>
                <button
                  type="button"
                  className={`inbox-workspace__filter-pill ${filterType === "folders" ? "inbox-workspace__filter-pill--active" : ""}`}
                  onClick={() => setFilterType("folders")}
                >
                  Dossiers
                </button>
              </div>

              <div className="inbox-workspace__sort-row">
                <span className="inbox-workspace__sort-label">Trier :</span>
                <select
                  className="inbox-workspace__sort-select"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as InboxSortOption)}
                >
                  <option value="date-desc">Date (récents)</option>
                  <option value="date-asc">Date (anciens)</option>
                  <option value="name-asc">Nom (A - Z)</option>
                  <option value="name-desc">Nom (Z - A)</option>
                </select>
              </div>
            </div>
          )}

          {/* Barre d'outils de multi-sélection */}
          {items.length > 0 && (
            <div className="inbox-workspace__toolbar">
              <label className="inbox-workspace__select-all">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                />
                <span>Tout sélectionner ({processedItems.length})</span>
              </label>
              {selectedItems.size > 0 && (
                <div className="inbox-workspace__selection-pill">
                  {selectedItems.size} sélectionné(s)
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="inbox-workspace__alert inbox-workspace__alert--danger">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="inbox-workspace__alert inbox-workspace__alert--success">
              {successMsg}
            </div>
          )}

          {/* Liste des éléments */}
          <div className="inbox-workspace__list-container">
            {items.length === 0 ? (
              <div className="inbox-workspace__empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                <h4>Boîte de dépôt vide</h4>
                <p>Déposez des fichiers dans le dossier 00-Dropbox de votre machine pour les classer ici.</p>
              </div>
            ) : processedItems.length === 0 ? (
              <div className="inbox-workspace__empty">
                <h4>Aucun élément correspondant</h4>
                <p>Aucun fichier ne correspond au filtre sélectionné.</p>
              </div>
            ) : (
              <ul className="inbox-workspace__list">
                {processedItems.map((item) => renderInboxItem(item))}
              </ul>
            )}
          </div>
        </aside>

        {/* PANNEAU DROIT : ZONE DE DÉPÔT SUR LES PROJETS (CARRÉS ROUGES) */}
        <section className="inbox-workspace__canvas">
          <header className="inbox-workspace__canvas-header">
            <div>
              <h3 className="inbox-workspace__canvas-title">Projets de destination</h3>
              <p className="inbox-workspace__canvas-subtitle">
                Glissez-déposez vos fichiers sélectionnés directement sur la carte du projet souhaité
              </p>
            </div>

            {isMoving ? (
              <div className="inbox-workspace__drag-notice inbox-workspace__drag-notice--moving">
                <span>Déplacement en cours...</span>
              </div>
            ) : selectedItems.size > 0 ? (
              <div className="inbox-workspace__drag-notice">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span><strong>{selectedItems.size}</strong> élément(s) prêt(s) à être glissé(s)</span>
              </div>
            ) : null}
          </header>

          <div className="inbox-workspace__grid">
            {projects.map((proj) => {
              const subfolders = availableSubfolders[proj] || [];
              const isOver = dragOverProject === proj;

              return (
                <div
                  key={proj}
                  className={`inbox-drop-card ${isOver ? "inbox-drop-card--over" : ""} ${isMoving ? "inbox-drop-card--disabled" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragOverProject(proj);
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    setDragOverProject(null);
                  }}
                  onDrop={(e) => void handleDropOnProject(e, proj)}
                >
                  <div className="inbox-drop-card__icon-wrapper">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="inbox-drop-card__folder-svg">
                      <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
                    </svg>
                  </div>

                  <div className="inbox-drop-card__content">
                    <h4 className="inbox-drop-card__name" title={proj}>
                      {proj}
                    </h4>
                    <span className="inbox-drop-card__sub-count">
                      {subfolders.length > 0
                        ? `${subfolders.length} sous-dossier(s)`
                        : "Racine du projet"}
                    </span>
                  </div>

                  <div className="inbox-drop-card__zone">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14" />
                      <path d="M19 12l-7 7-7-7" />
                    </svg>
                    <span>{isOver ? `Déposer dans « ${proj} »` : "Déposer les fichiers ici"}</span>
                  </div>
                </div>
              );
            })}

            {/* CARTE : CRÉER UN NOUVEAU PROJET */}
            <div className={`inbox-drop-card inbox-drop-card--create ${isCreatingProject ? "inbox-drop-card--creating" : ""}`}>
              {isCreatingProject ? (
                <form
                  className="inbox-drop-card__form"
                  onSubmit={(e) => void handleCreateProjectSubmit(e)}
                >
                  <h4 className="inbox-drop-card__form-title">Nouveau projet</h4>
                  <input
                    type="text"
                    className="inbox-drop-card__input"
                    placeholder="Nom du projet..."
                    value={newProjectInput}
                    onChange={(e) => setNewProjectInput(e.target.value)}
                    autoFocus
                  />
                  {createError && (
                    <span className="inbox-drop-card__form-error">{createError}</span>
                  )}
                  <div className="inbox-drop-card__form-actions">
                    <button
                      type="button"
                      className="inbox-workspace__btn inbox-workspace__btn--ghost"
                      onClick={() => {
                        setIsCreatingProject(false);
                        setNewProjectInput("");
                        setCreateError(null);
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="inbox-workspace__btn inbox-workspace__btn--primary"
                    >
                      Créer
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  className="inbox-drop-card__create-btn"
                  onClick={() => setIsCreatingProject(true)}
                  title="Créer un nouveau projet"
                >
                  <div className="inbox-drop-card__create-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <span className="inbox-drop-card__create-label">Créer un nouveau projet</span>
                  <span className="inbox-drop-card__create-hint">
                    Ajoutez un projet pour recevoir des dépôts
                  </span>
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
