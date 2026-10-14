import React from "react";
import { UI_TERMS } from "../../../../theme/UI_TERMS";
import "./Topbar.css";

export interface TopbarProps {
  pinnedProjects: string[];
  activeProject: string;
  onSelectProject: (project: string) => void;
  isTreeOpen: boolean;
  onToggleTree: () => void;
  inboxCount: number;
  onOpenInbox: () => void;
  onOpenProjectManager: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onGoHome: () => void;
  onRefresh: () => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  canGoForward?: boolean;
  onGoForward?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  pinnedProjects,
  activeProject,
  onSelectProject,
  isTreeOpen,
  onToggleTree,
  inboxCount,
  onOpenInbox,
  onOpenProjectManager,
  searchQuery,
  onSearchChange,
  onGoHome,
  onRefresh,
  canGoBack = false,
  onGoBack,
  canGoForward = false,
  onGoForward,
}) => {
  return (
    <header className="topbar">
      {/* ZONE GAUCHE : Menu ☰, Boîte de dépôt (Inbox + badge jaune), (+), Onglets projets */}
      <div className="topbar__zone topbar__zone--left">
        <button
          type="button"
          className={`topbar__icon-btn ${isTreeOpen ? "topbar__icon-btn--active" : ""}`}
          onClick={onToggleTree}
          title={UI_TERMS.topbar.toggleTree}
          aria-label={UI_TERMS.topbar.toggleTree}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Bouton Boîte de dépôt (Inbox locale) avec badge d'alerte jaune */}
        <button
          type="button"
          className="topbar__inbox-btn"
          onClick={onOpenInbox}
          title={UI_TERMS.topbar.inboxTitle}
          aria-label={UI_TERMS.topbar.inboxTitle}
        >
          <svg
            className="topbar__inbox-svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
            <path d="M4 13h4.5l1.5 2.5h4L15.5 13H20" />
            <path d="M12 3v8" />
            <path d="M8.5 7.5L12 11l3.5-3.5" />
          </svg>
          {inboxCount > 0 && (
            <span
              className="topbar__inbox-badge"
              aria-label={UI_TERMS.topbar.inboxAlertAlt}
            >
              !
            </span>
          )}
        </button>

        {/* Bouton (+) pour ouvrir la gestion des projets */}
        <button
          type="button"
          className="topbar__icon-btn topbar__add-shortcut"
          onClick={onOpenProjectManager}
          title={UI_TERMS.topbar.addShortcut}
          aria-label={UI_TERMS.topbar.addShortcut}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="4" x2="12" y2="20" />
            <line x1="4" y1="12" x2="20" y2="12" />
          </svg>
        </button>

        <span className="topbar__divider" aria-hidden="true" />

        {/* Onglets de projets épinglés (scroll horizontal si débordement) */}
        <nav className="topbar__tabs" aria-label="Projets épinglés">
          {pinnedProjects.map((project) => {
            const isActive = project === activeProject;
            return (
              <React.Fragment key={project}>
                <button
                  type="button"
                  className={`topbar__tab ${isActive ? "topbar__tab--active" : ""}`}
                  onClick={() => onSelectProject(project)}
                >
                  {project}
                </button>
                <span className="topbar__divider" aria-hidden="true" />
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* ZONE CENTRE : Accueil, Identité MyBr|dge & Indicateur Split-view (V2+) */}
      <div className="topbar__zone topbar__zone--center">
        <button
          type="button"
          className="topbar__brand"
          onClick={onGoHome}
          title={UI_TERMS.topbar.home}
        >
          <svg
            className="topbar__brand-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 18h20" />
            <path d="M6 18V7" />
            <path d="M18 18V7" />
            <path d="M2 14c2.5-1.5 4-4 4-7 2.5 4.5 9.5 4.5 12 0 0 3 1.5 5.5 4 7" />
          </svg>
          <span className="topbar__brand-title">{UI_TERMS.appTitle}</span>
        </button>
      </div>

      {/* ZONE DROITE : Navigation Arrière/Avant, Recherche, Actualiser, Réglages */}
      <div className="topbar__zone topbar__zone--right">
        <div className="topbar__nav-arrows">
          <button
            type="button"
            className={`topbar__icon-btn ${
              !canGoBack ? "topbar__icon-btn--disabled" : ""
            }`}
            disabled={!canGoBack}
            onClick={onGoBack}
            title={UI_TERMS.topbar.navBack}
            aria-label={UI_TERMS.topbar.navBack}
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
            title={UI_TERMS.topbar.navForward}
            aria-label={UI_TERMS.topbar.navForward}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="topbar__search-wrapper">
          <input
            type="search"
            className="topbar__search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={UI_TERMS.topbar.searchPlaceholder}
            aria-label={UI_TERMS.topbar.searchPlaceholder}
          />
        </div>

        <button
          type="button"
          className="topbar__icon-btn topbar__icon-btn--accent"
          onClick={onRefresh}
          title={UI_TERMS.topbar.refresh}
          aria-label={UI_TERMS.topbar.refresh}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
            <path d="M21 12a9 9 0 0 0-15.5-6.3L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 15.5 6.3L21 16" />
            <path d="M16 16h5v5" />
          </svg>
        </button>

        <button
          type="button"
          className="topbar__icon-btn topbar__icon-btn--accent"
          title={UI_TERMS.topbar.settings}
          aria-label={UI_TERMS.topbar.settings}
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
