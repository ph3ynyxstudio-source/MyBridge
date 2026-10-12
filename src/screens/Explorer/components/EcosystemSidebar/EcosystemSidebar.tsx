import React from "react";
import { UI_TERMS } from "../../../../theme/UI_TERMS";
import "./EcosystemSidebar.css";

export interface EcosystemSidebarProps {
  onLaunchApp?: (appName: "vesper" | "chronosvers") => void;
}

export const EcosystemSidebar: React.FC<EcosystemSidebarProps> = ({
  onLaunchApp,
}) => {
  return (
    <aside
      className="ecosystem-sidebar"
      aria-label={UI_TERMS.ecosystem.sectionLabel}
    >
      <div className="ecosystem-sidebar__shortcuts">
        {/* Raccourci VespΣr (Emblème cosmique / étoile violette & cyan) */}
        <button
          type="button"
          className="ecosystem-sidebar__tile ecosystem-sidebar__tile--vesper"
          onClick={() => onLaunchApp && onLaunchApp("vesper")}
          title={UI_TERMS.ecosystem.vesper}
          aria-label={UI_TERMS.ecosystem.vesper}
        >
          <svg viewBox="0 0 48 48" className="ecosystem-sidebar__svg">
            <defs>
              <radialGradient id="vesperGlow" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.45" />
                <stop offset="60%" stopColor="var(--accent-purple)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--bg-app)" stopOpacity="0.95" />
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
          className="ecosystem-sidebar__tile ecosystem-sidebar__tile--chronos"
          onClick={() => onLaunchApp && onLaunchApp("chronosvers")}
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
  );
};
