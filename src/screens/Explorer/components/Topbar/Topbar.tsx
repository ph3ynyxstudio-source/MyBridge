import React, { useState, useRef, useEffect } from "react";
import { getUiTerms, LanguageMode } from "../../../../theme/UI_TERMS";
import { ThemeMode } from "../../../../theme/design_tokens";
import {
  SearchCategoryFilter,
  StandardFolderType,
} from "../../../../services/storageService";
import { NewProjectInput } from "../NewProjectInput/NewProjectInput";
import { ProjectTabPopover } from "./ProjectTabPopover";
import "./Topbar.css";

export interface TopbarProps {
  projects: string[];
  pinnedProjects: string[];
  activeProject: string;
  isInboxActive?: boolean;
  language?: LanguageMode;
  onSelectProject: (project: string) => void;
  inboxCount: number;
  onOpenInbox: () => void;
  onCreateProject: (projectName: string) => Promise<void>;
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchCategory?: SearchCategoryFilter;
  onSearchCategoryChange?: (cat: SearchCategoryFilter) => void;
  onRefresh: () => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  canGoForward?: boolean;
  onGoForward?: () => void;
  canUndo?: boolean;
  undoLabel?: string | null;
  onUndo?: () => void;
  canRedo?: boolean;
  redoLabel?: string | null;
  onRedo?: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;

  // Navigation contextuelle et gestion des onglets
  activeSubpath?: string;
  activeFolderType?: StandardFolderType | null;
  onNavigateSubfolder?: (
    project: string,
    subfolder?: string,
    folderType?: StandardFolderType
  ) => void;
  onOpenInSecondary?: (project: string) => void;
  onRenameProject?: (project: string) => void;
  onDeleteProject?: (project: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  projects,
  pinnedProjects,
  activeProject,
  isInboxActive = false,
  language = "fr",
  onSelectProject,
  inboxCount,
  onOpenInbox,
  onCreateProject,
  isSettingsOpen,
  onToggleSettings,
  searchQuery,
  onSearchChange,
  searchCategory = "all",
  onSearchCategoryChange,
  onRefresh,
  canGoBack = false,
  onGoBack,
  canGoForward = false,
  onGoForward,
  canUndo = false,
  undoLabel,
  onUndo,
  canRedo = false,
  redoLabel,
  onRedo,
  theme,
  onToggleTheme,
  activeSubpath,
  activeFolderType,
  onNavigateSubfolder,
  onOpenInSecondary,
  onRenameProject,
  onDeleteProject,
}) => {
  const terms = getUiTerms(language);
  const [popoverProject, setPopoverProject] = useState<{
    project: string;
    x: number;
  } | null>(null);

  const [createPopoverX, setCreatePopoverX] = useState<number | null>(null);
  const createPopoverRef = useRef<HTMLDivElement>(null);

  const clickTimerRef = useRef<number | null>(null);

  // Fermeture du popover de création (+) au clic extérieur ou touche Échap
  useEffect(() => {
    if (createPopoverX === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCreatePopoverX(null);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        createPopoverRef.current &&
        !createPopoverRef.current.contains(e.target as Node)
      ) {
        const target = e.target as HTMLElement | null;
        if (target && target.closest(".topbar__add-shortcut")) {
          return;
        }
        setCreatePopoverX(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [createPopoverX]);

  const handleTabClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    project: string
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left;

    setCreatePopoverX(null);

    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      // Double-clic détecté : navigation immédiate à la racine du projet
      setPopoverProject(null);
      onSelectProject(project);
      onNavigateSubfolder?.(project, undefined);
      return;
    }

    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      // Clic simple : bascule du popover de navigation des sous-dossiers
      setPopoverProject((prev) =>
        prev?.project === project ? null : { project, x }
      );
    }, 220);
  };

  const handleTabDoubleClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    project: string
  ) => {
    e.preventDefault();
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    setPopoverProject(null);
    setCreatePopoverX(null);
    onSelectProject(project);
    onNavigateSubfolder?.(project, undefined);
  };

  const handleToggleCreatePopover = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverProject(null);
    setCreatePopoverX((prev) => (prev !== null ? null : rect.left));
  };

  const createPopoverWidth = 280;
  const adjustedCreateX =
    createPopoverX !== null
      ? Math.max(10, Math.min(createPopoverX, window.innerWidth - createPopoverWidth - 10))
      : 0;

  return (
    <header className="topbar">
      {/* ZONE GAUCHE : Bouton MyBr|dge (Accueil / Inbox), Onglets projets, Bouton (+) */}
      <div className="topbar__zone topbar__zone--left">
        {/* Raccourci Accueil / Inbox : Bouton MyBr|dge en première position à gauche */}
        <button
          type="button"
          className={`topbar__brand ${isInboxActive ? "topbar__brand--active" : ""}`}
          onClick={() => {
            setPopoverProject(null);
            setCreatePopoverX(null);
            onOpenInbox();
          }}
          title={terms.topbar.inboxTitle}
          aria-label={terms.topbar.inboxTitle}
        >
          <img
            src="/icon.png"
            alt=""
            className="topbar__brand-icon"
            aria-hidden="true"
          />
          <span className="topbar__brand-title">{terms.appTitle}</span>
          {inboxCount > 0 && (
            <span
              className="topbar__inbox-badge"
              aria-label={terms.topbar.inboxAlertAlt}
            >
              !
            </span>
          )}
        </button>

        <span className="topbar__divider" aria-hidden="true" />

        {/* Onglets de projets épinglés suivis du bouton (+) */}
        <nav className="topbar__tabs" aria-label={terms.shortcutsPanel.shortcutsSection}>
          {pinnedProjects.map((project) => {
            const isActive = !isInboxActive && project === activeProject;
            return (
              <React.Fragment key={project}>
                <button
                  type="button"
                  className={`topbar__tab ${isActive ? "topbar__tab--active" : ""}`}
                  onClick={(e) => handleTabClick(e, project)}
                  onDoubleClick={(e) => handleTabDoubleClick(e, project)}
                  title={terms.topbar.tabTooltip(project)}
                >
                  {project}
                </button>
                <span className="topbar__divider" aria-hidden="true" />
              </React.Fragment>
            );
          })}

          {/* Bouton (+) placé juste après le dernier onglet de projet */}
          <button
            type="button"
            className={`topbar__icon-btn topbar__add-shortcut ${
              createPopoverX !== null ? "topbar__icon-btn--active" : ""
            }`}
            onClick={handleToggleCreatePopover}
            title={terms.topbar.addShortcut}
            aria-label={terms.topbar.addShortcut}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="4" x2="12" y2="20" />
              <line x1="4" y1="12" x2="20" y2="12" />
            </svg>
          </button>
        </nav>
      </div>

      {/* Popover contextuel ancré sous l'onglet de projet cliqué */}
      {popoverProject && (
        <ProjectTabPopover
          project={popoverProject.project}
          x={popoverProject.x}
          language={language}
          activeSubpath={
            popoverProject.project === activeProject ? activeSubpath : undefined
          }
          activeFolderType={
            popoverProject.project === activeProject ? activeFolderType : undefined
          }
          onNavigateSubfolder={(project, subfolder, folderType) => {
            onNavigateSubfolder?.(project, subfolder, folderType);
            setPopoverProject(null);
          }}
          onOpenInSecondary={onOpenInSecondary}
          onRename={onRenameProject}
          onDelete={onDeleteProject}
          onClose={() => setPopoverProject(null)}
        />
      )}

      {/* Popover allégé de création de projet (+) : saisie du nom + bouton Créer */}
      {createPopoverX !== null && (
        <div
          ref={createPopoverRef}
          className="topbar__create-popover"
          style={{ left: `${adjustedCreateX}px` }}
          role="dialog"
          aria-label="Nouveau projet"
        >
          <NewProjectInput
            existingProjects={projects}
            onCreateProject={async (projectName) => {
              await onCreateProject(projectName);
              setCreatePopoverX(null);
            }}
          />
        </div>
      )}

      {/* ZONE DROITE : Navigation Arrière/Avant, Undo/Redo, Recherche Globale + Filtre Dossier, Actualiser, Sélecteur de Thème, Options */}
      <div className="topbar__zone topbar__zone--right">
        <div className="topbar__nav-arrows">
          <button
            type="button"
            className={`topbar__icon-btn ${
              !canGoBack ? "topbar__icon-btn--disabled" : ""
            }`}
            disabled={!canGoBack}
            onClick={onGoBack}
            title={terms.topbar.navBack}
            aria-label={terms.topbar.navBack}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            className={`topbar__icon-btn ${
              !canGoForward ? "topbar__icon-btn--disabled" : ""
            }`}
            disabled={!canGoForward}
            onClick={onGoForward}
            title={terms.topbar.navForward}
            aria-label={terms.topbar.navForward}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <span className="topbar__divider" aria-hidden="true" />

        {/* Boutons discrets Undo / Redo (5 dernières actions de fichiers) */}
        <div className="topbar__undo-group" role="group" aria-label="Undo / Redo">
          <button
            type="button"
            className={`topbar__icon-btn ${
              !canUndo ? "topbar__icon-btn--disabled" : "topbar__icon-btn--accent"
            }`}
            disabled={!canUndo}
            onClick={onUndo}
            title={
              undoLabel
                ? `${terms.topbar.undo} — ${undoLabel}`
                : terms.topbar.undo
            }
            aria-label={
              undoLabel
                ? `${terms.topbar.undo} — ${undoLabel}`
                : terms.topbar.undo
            }
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
          </button>
          <button
            type="button"
            className={`topbar__icon-btn ${
              !canRedo ? "topbar__icon-btn--disabled" : "topbar__icon-btn--accent"
            }`}
            disabled={!canRedo}
            onClick={onRedo}
            title={
              redoLabel
                ? `${terms.topbar.redo} — ${redoLabel}`
                : terms.topbar.redo
            }
            aria-label={
              redoLabel
                ? `${terms.topbar.redo} — ${redoLabel}`
                : terms.topbar.redo
            }
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 7v6h-6" />
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
            </svg>
          </button>
        </div>

        {/* Barre de recherche globale combinée avec présélection de catégorie de dossier */}
        <div className="topbar__search-group">
          <select
            className={`topbar__search-category ${
              searchCategory !== "all" ? "topbar__search-category--active" : ""
            }`}
            value={searchCategory}
            onChange={(e) =>
              onSearchCategoryChange?.(e.target.value as SearchCategoryFilter)
            }
            title={terms.topbar.searchCategoryLabel}
            aria-label={terms.topbar.searchCategoryLabel}
          >
            <option value="all">{terms.standardFolders.all}</option>
            <option value="docs">{terms.standardFolders.docs}</option>
            <option value="assets">{terms.standardFolders.assets}</option>
            <option value="sessions">{terms.standardFolders.sessions}</option>
            <option value="archive">{terms.standardFolders.archive}</option>
          </select>

          <div className="topbar__search-wrapper">
            <input
              type="search"
              className="topbar__search-input"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={terms.topbar.searchPlaceholder}
              aria-label={terms.topbar.searchPlaceholder}
            />
          </div>
        </div>

        <button
          type="button"
          className="topbar__icon-btn topbar__icon-btn--accent"
          onClick={onRefresh}
          title={terms.topbar.refresh}
          aria-label={terms.topbar.refresh}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
            <path d="M21 12a9 9 0 0 0-15.5-6.3L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 15.5 6.3L21 16" />
            <path d="M16 16h5v5" />
          </svg>
        </button>

        {/* Sélecteur de Thème Sombre / Aube (Brume Matinale) */}
        <button
          type="button"
          className={`topbar__theme-toggle topbar__theme-toggle--${theme}`}
          onClick={onToggleTheme}
          title={terms.topbar.themeToggle}
          aria-label={terms.topbar.themeToggle}
        >
          <span
            className={`topbar__theme-icon ${theme === "dark" ? "topbar__theme-icon--active" : ""}`}
            title="Dark"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </span>
          <span
            className={`topbar__theme-icon ${theme === "dawn" ? "topbar__theme-icon--active" : ""}`}
            title="Dawn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          </span>
          <span className="topbar__theme-thumb" aria-hidden="true" />
        </button>

        {/* Bouton Options (icône engrenage) : configuration des projets épinglés & langue */}
        <button
          type="button"
          className={`topbar__icon-btn topbar__icon-btn--accent topbar__settings-btn ${
            isSettingsOpen ? "topbar__icon-btn--active" : ""
          }`}
          onClick={() => {
            setPopoverProject(null);
            setCreatePopoverX(null);
            onToggleSettings();
          }}
          title={terms.topbar.settings}
          aria-label={terms.topbar.settings}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </header>
  );
};
