import React, { useState, useEffect } from "react";
import { launchExternalApp } from "../../../../services/storageService";
import { UI_TERMS } from "../../../../theme/UI_TERMS";
import "./EcosystemSidebar.css";

export interface EcosystemSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onLaunchApp?: (appName: "vesper" | "chronosvers") => void;
}

interface ToastNotification {
  type: "success" | "error";
  appName: string;
  message: string;
}

export const EcosystemSidebar: React.FC<EcosystemSidebarProps> = ({
  isOpen,
  onToggle,
  onLaunchApp,
}) => {
  const [activeLaunching, setActiveLaunching] = useState<
    "vesper" | "chronosvers" | null
  >(null);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Fermeture automatique du toast au bout de 5 secondes
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleLaunch = async (appId: "vesper" | "chronosvers") => {
    const appDisplayName =
      appId === "vesper"
        ? UI_TERMS.ecosystem.vesper
        : UI_TERMS.ecosystem.chronosvers;

    setActiveLaunching(appId);

    if (onLaunchApp) {
      onLaunchApp(appId);
    }

    try {
      await launchExternalApp(appId);
      setToast({
        type: "success",
        appName: appDisplayName,
        message: "Application démarrée avec succès.",
      });
    } catch (err: unknown) {
      const errorMsg = typeof err === "string" ? err : String(err);
      console.warn(
        `[EcosystemSidebar] Échec du lancement de ${appDisplayName} :`,
        errorMsg
      );
      setToast({
        type: "error",
        appName: appDisplayName,
        message: errorMsg,
      });
    } finally {
      setTimeout(() => {
        setActiveLaunching((curr) => (curr === appId ? null : curr));
      }, 600);
    }
  };

  return (
    <>
      <aside
        className={`ecosystem-sidebar ${
          isOpen ? "ecosystem-sidebar--open" : "ecosystem-sidebar--collapsed"
        }`}
        aria-label={UI_TERMS.ecosystem.sectionLabel}
      >
        {/* Poignée latérale droite de repli/dépli de la barre d'applications */}
        <button
          type="button"
          className="ecosystem-sidebar__toggle-handle"
          onClick={onToggle}
          title={
            isOpen
              ? UI_TERMS.ecosystem.toggleCollapse
              : UI_TERMS.ecosystem.toggleExpand
          }
          aria-label={
            isOpen
              ? UI_TERMS.ecosystem.toggleCollapse
              : UI_TERMS.ecosystem.toggleExpand
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isOpen ? (
              /* Flèche vers la droite (▶) pour replier vers la droite */
              <path d="M9 18l6-6-6-6" />
            ) : (
              /* Flèche vers la gauche (◀) pour faire ressortir vers la gauche */
              <path d="M15 18l-6-6 6-6" />
            )}
          </svg>
        </button>

        <div className="ecosystem-sidebar__shortcuts">
          {/* Raccourci VespΣr (Emblème cosmique / étoile violette & cyan) */}
          <button
            type="button"
            className={`ecosystem-sidebar__tile ecosystem-sidebar__tile--vesper ${
              activeLaunching === "vesper"
                ? "ecosystem-sidebar__tile--launching"
                : ""
            }`}
            onClick={() => void handleLaunch("vesper")}
            title={UI_TERMS.ecosystem.vesper}
            aria-label={UI_TERMS.ecosystem.vesper}
          >
            <svg viewBox="0 0 48 48" className="ecosystem-sidebar__svg">
              <defs>
                <radialGradient id="vesperGlow" cx="50%" cy="50%" r="55%">
                  <stop
                    offset="0%"
                    stopColor="var(--accent-blue)"
                    stopOpacity="0.45"
                  />
                  <stop
                    offset="60%"
                    stopColor="var(--accent-purple)"
                    stopOpacity="0.35"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--bg-app)"
                    stopOpacity="0.95"
                  />
                </radialGradient>
              </defs>
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="url(#vesperGlow)"
                stroke="var(--accent-purple)"
                strokeWidth="1.5"
              />
              {/* Silhouette renard/étoile cosmique VespΣr */}
              <path
                d="M13 13L20 21L24 16L28 21L35 13L32 29L24 37L16 29L13 13Z"
                fill="none"
                stroke="var(--accent-purple)"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M24 12V22M19 17H29"
                stroke="var(--accent-blue)"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <circle cx="20" cy="26" r="1.4" fill="var(--accent-blue)" />
              <circle cx="28" cy="26" r="1.4" fill="var(--accent-blue)" />
            </svg>
          </button>

          {/* Raccourci Chr0nosV3rs (Sablier néon cyan & violet) */}
          <button
            type="button"
            className={`ecosystem-sidebar__tile ecosystem-sidebar__tile--chronos ${
              activeLaunching === "chronosvers"
                ? "ecosystem-sidebar__tile--launching"
                : ""
            }`}
            onClick={() => void handleLaunch("chronosvers")}
            title={UI_TERMS.ecosystem.chronosvers}
            aria-label={UI_TERMS.ecosystem.chronosvers}
          >
            <svg viewBox="0 0 48 48" className="ecosystem-sidebar__svg">
              <path
                d="M15 10H33M15 38H33"
                stroke="var(--text-primary)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M17 10C17 17 24 21 24 24C24 27 17 31 17 38H31C31 31 24 27 24 24C24 21 31 17 31 10H17Z"
                fill="rgba(84, 214, 255, 0.14)"
                stroke="var(--accent-blue)"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M20 15H28L24 21L20 15Z"
                fill="var(--accent-blue)"
              />
              <path
                d="M19 35H29L24 28L19 35Z"
                fill="var(--accent-purple)"
              />
              {/* Orbite violette autour du sablier */}
              <ellipse
                cx="24"
                cy="24"
                rx="16"
                ry="7"
                transform="rotate(-24 24 24)"
                fill="none"
                stroke="var(--accent-purple)"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>
      </aside>

      {/* Toast d'alerte / notification de lancement */}
      {toast && (
        <div
          className={`ecosystem-toast ecosystem-toast--${toast.type} ${
            !isOpen ? "ecosystem-toast--collapsed-anchor" : ""
          }`}
          role="alert"
        >
          <div className="ecosystem-toast__icon">
            {toast.type === "error" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div className="ecosystem-toast__body">
            <strong className="ecosystem-toast__title">{toast.appName}</strong>
            <span className="ecosystem-toast__message">{toast.message}</span>
          </div>
          <button
            type="button"
            className="ecosystem-toast__close"
            onClick={() => setToast(null)}
            title="Fermer"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
};
