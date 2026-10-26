import React, { useRef, useEffect } from "react";
import { getUiTerms, LanguageMode } from "../../../../theme/UI_TERMS";
import "./ShortcutsPanel.css";

export const MAX_SHORTCUTS = 4;

export interface ShortcutsPanelProps {
  isOpen: boolean;
  projects: string[];
  pinnedProjects: string[];
  language?: LanguageMode;
  onChangeLanguage?: (lang: LanguageMode) => void;
  onTogglePinProject: (projectName: string) => void;
  onClose: () => void;
}

export const ShortcutsPanel: React.FC<ShortcutsPanelProps> = ({
  isOpen,
  projects,
  pinnedProjects,
  language = "fr",
  onChangeLanguage,
  onTogglePinProject,
  onClose,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const terms = getUiTerms(language);

  // Fermeture automatique au clic à l'extérieur ou touche Échap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // Ignorer si le clic provient du bouton Options (engrenage) de la Topbar
        const target = e.target as HTMLElement | null;
        if (target && target.closest(".topbar__settings-btn")) {
          return;
        }
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const isLimitReached = pinnedProjects.length >= MAX_SHORTCUTS;

  return (
    <div
      ref={panelRef}
      className="shortcuts-panel"
      role="menu"
      aria-label={terms.shortcutsPanel.title}
    >
      <header className="shortcuts-panel__header">
        <div className="shortcuts-panel__title-row">
          <h3 className="shortcuts-panel__title">
            {terms.shortcutsPanel.title}
          </h3>
        </div>
      </header>

      {/* Sélecteur de langue (Français / Anglais) */}
      <div className="shortcuts-panel__lang-section">
        <span className="shortcuts-panel__section-label">
          {terms.shortcutsPanel.languageLabel}
        </span>
        <div
          className="shortcuts-panel__lang-segmented"
          role="group"
          aria-label={terms.shortcutsPanel.languageLabel}
        >
          <button
            type="button"
            className={`shortcuts-panel__lang-btn ${
              language === "fr" ? "shortcuts-panel__lang-btn--active" : ""
            }`}
            onClick={() => onChangeLanguage?.("fr")}
          >
            <span className="shortcuts-panel__lang-code">FR</span>
            <span>Français</span>
          </button>
          <button
            type="button"
            className={`shortcuts-panel__lang-btn ${
              language === "en" ? "shortcuts-panel__lang-btn--active" : ""
            }`}
            onClick={() => onChangeLanguage?.("en")}
          >
            <span className="shortcuts-panel__lang-code">EN</span>
            <span>English</span>
          </button>
        </div>
      </div>

      {/* En-tête de section Raccourcis de projets */}
      <div className="shortcuts-panel__section-header">
        <div className="shortcuts-panel__title-row">
          <span className="shortcuts-panel__section-label">
            {terms.shortcutsPanel.shortcutsSection}
          </span>
          <span className="shortcuts-panel__count">
            {pinnedProjects.length}/{MAX_SHORTCUTS}
          </span>
        </div>
        <span className="shortcuts-panel__notice">
          ({terms.shortcutsPanel.maxNotice})
        </span>
      </div>

      {/* Légende */}
      <div className="shortcuts-panel__legend">
        <span className="shortcuts-panel__legend-item">
          <svg
            className="shortcuts-panel__star-icon"
            viewBox="0 0 24 24"
            fill="var(--accent-warning)"
            stroke="var(--accent-warning)"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {terms.shortcutsPanel.legendStar}
        </span>
        <span className="shortcuts-panel__legend-item">
          <span className="shortcuts-panel__check-symbol" aria-hidden="true">
            ✓
          </span>
          {terms.shortcutsPanel.legendCheck}
        </span>
      </div>

      {/* Liste des projets */}
      <div className="shortcuts-panel__list-container">
        {projects.length === 0 ? (
          <p className="shortcuts-panel__empty">
            {terms.shortcutsPanel.empty}
          </p>
        ) : (
          <ul className="shortcuts-panel__list">
            {projects.map((project) => {
              const isPinned = pinnedProjects.includes(project);
              const isDisabled = !isPinned && isLimitReached;

              return (
                <li
                  key={project}
                  className={`shortcuts-panel__item ${
                    isPinned ? "shortcuts-panel__item--active" : ""
                  } ${isDisabled ? "shortcuts-panel__item--disabled" : ""}`}
                >
                  <label className="shortcuts-panel__label">
                    <input
                      type="checkbox"
                      className="shortcuts-panel__checkbox"
                      checked={isPinned}
                      disabled={isDisabled}
                      onChange={() => onTogglePinProject(project)}
                    />
                    <span className="shortcuts-panel__name">{project}</span>
                  </label>

                  {isPinned && (
                    <span
                      className="shortcuts-panel__star-wrapper"
                      title={terms.shortcutsPanel.legendStar}
                    >
                      <svg
                        className="shortcuts-panel__star-icon shortcuts-panel__star-icon--active"
                        viewBox="0 0 24 24"
                        fill="var(--accent-warning)"
                        stroke="var(--accent-warning)"
                        strokeWidth="1.5"
                        aria-hidden="true"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
