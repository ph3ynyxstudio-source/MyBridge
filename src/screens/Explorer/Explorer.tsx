import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { TileKind } from "../../components/FolderCard/FolderCard";
import {
  convertInboxFolderToProject,
  copyItem,
  createProject,
  deleteProject,
  emptyTrash,
  getInboxItems,
  getTrashItems,
  importExternalPath,
  InboxItem,
  listProjects,
  moveInboxItem,
  moveItem,
  moveToTrash,
  openFileInSystem,
  ProjectFolder,
  readProjectContents,
  renameProject,
  saveFileBytes,
  StandardFolderType,
  STANDARD_FOLDER_MAP,
} from "../../services/storageService";
import { APP_CONFIG } from "../../theme/config";
import { ThemeMode } from "../../theme/design_tokens";
import { Topbar } from "./components/Topbar/Topbar";
import { GridView, GridEntry } from "./components/GridView/GridView";
import { InboxDrawer } from "./components/InboxDrawer/InboxDrawer";
import {
  ShortcutsPanel,
  MAX_SHORTCUTS,
} from "./components/ShortcutsPanel/ShortcutsPanel";
import { EcosystemSidebar } from "./components/EcosystemSidebar/EcosystemSidebar";
import { ContextMenu } from "./components/ContextMenu/ContextMenu";
import { TrashDrawer } from "./components/TrashDrawer/TrashDrawer";
import { PreviewFile } from "./components/PreviewDrawer/PreviewDrawer";
import "./Explorer.css";

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "svg",
  "webp",
  "gif",
  "bmp",
  "ico",
]);

const PREVIEWABLE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "svg",
  "webp",
  "gif",
  "bmp",
  "ico",
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
]);

function resolveTileKind(folder: ProjectFolder): TileKind {
  if (folder.est_dossier) return "folder";
  const dotIdx = folder.nom.lastIndexOf(".");
  if (dotIdx > 0) {
    const ext = folder.nom.slice(dotIdx + 1).toLowerCase();
    if (IMAGE_EXTENSIONS.has(ext)) {
      return "image";
    }
  }
  return "file";
}

function toGridEntry(folder: ProjectFolder): GridEntry {
  return {
    id: folder.chemin_relatif || folder.nom,
    label: folder.nom,
    kind: resolveTileKind(folder),
    isFolder: folder.est_dossier,
    folderType: folder.folder_type,
    absolutePath: folder.chemin_absolu,
    size: folder.taille,
  };
}

interface VirtualClipboard {
  op: "copy" | "cut";
  project: string;
  subpath: string;
  entry: GridEntry;
}

interface ContextMenuState {
  x: number;
  y: number;
  targetEntry?: GridEntry;
  targetProject: string;
  targetSubpath?: string;
}

const PINNED_STORAGE_KEY = "mybridge_pinned_projects";

export const Explorer: React.FC = () => {
  const [projects, setProjects] = useState<string[]>([]);
  const [pinnedProjects, setPinnedProjects] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(PINNED_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, MAX_SHORTCUTS);
        }
      }
    } catch {
      // fallback
    }
    return [];
  });
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

  // Gestion du thème (Sombre / Aube - Palette 1: Brume Matinale)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(APP_CONFIG.defaults.themeStorageKey);
      if (saved === "dark" || saved === "dawn") {
        return saved;
      }
    } catch {
      // fallback
    }
    return APP_CONFIG.defaults.defaultTheme;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(APP_CONFIG.defaults.themeStorageKey, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "dawn" : "dark"));
  }, []);

  // Interception globale du menu contextuel Chromium / WebView2
  useEffect(() => {
    const handleGlobalContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener("contextmenu", handleGlobalContextMenu);
    return () => {
      window.removeEventListener("contextmenu", handleGlobalContextMenu);
    };
  }, []);

  // Fichier en cours de prévisualisation dans le panneau droit (Visualiseur)
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);

  const handleClosePreview = useCallback(() => {
    setPreviewFile(null);
  }, []);

  // Détection de glisser-déposer de fichiers externes depuis Windows
  const [isExternalDragOver, setIsExternalDragOver] = useState<boolean>(false);

  // Presse-papier virtuel pour Copier / Couper / Coller
  const [clipboard, setClipboard] = useState<VirtualClipboard | null>(null);

  // Menu contextuel (clic droit)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Corbeille locale sécurisée
  const [trashItems, setTrashItems] = useState<InboxItem[]>([]);
  const [isTrashDrawerOpen, setIsTrashDrawerOpen] = useState<boolean>(false);

  // Modale de confirmation de suppression d'un projet (avec avertissement sous-dossiers en archive)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState<boolean>(false);

  // Modale de renommage d'un projet
  const [projectToRename, setProjectToRename] = useState<string | null>(null);
  const [renameInputValue, setRenameInputValue] = useState<string>("");
  const [renameError, setRenameError] = useState<string | null>(null);

  const [projectSubfoldersMap, setProjectSubfoldersMap] = useState<
    Record<string, string[]>
  >({});
  const [activeProject, setActiveProject] = useState<string>("");
  const [currentSubpath, setCurrentSubpath] = useState<string | undefined>(undefined);
  const [currentFolderType, setCurrentFolderType] = useState<StandardFolderType | null>(null);

  const [projectContents, setProjectContents] = useState<ProjectFolder[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string>("");
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());
  const [lastSelectedEntryId, setLastSelectedEntryId] = useState<string>("");

  // Référence mémoire du payload glissé (fallback fiable WebView2 lors du Drag & Drop interne)
  const draggedPayloadRef = useRef<{
    project: string;
    subpath: string;
    isFolder: boolean;
    label: string;
    items?: Array<{
      project: string;
      subpath: string;
      isFolder: boolean;
      label: string;
    }>;
  } | null>(null);

  // Mode Split-View (Deuxième projet simultané)
  const [isSplitViewActive, setIsSplitViewActive] = useState<boolean>(false);
  const [secondaryProject, setSecondaryProject] = useState<string>("");
  const [secondarySubpath, setSecondarySubpath] = useState<string | undefined>(undefined);
  const [secondaryContents, setSecondaryContents] = useState<ProjectFolder[]>([]);
  const [selectedSecondaryEntryId, setSelectedSecondaryEntryId] = useState<string>("");

  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [isInboxDrawerOpen, setIsInboxDrawerOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Barre latérale droite (Raccourcis d'applications VespΣr, Chr0nosV3rs)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(true);

  // Historique de navigation (précédent / suivant)
  const [navHistory, setNavHistory] = useState<
    Array<{ project: string; subpath?: string }>
  >([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  /**
   * Charge les éléments en attente dans la Boîte de dépôt (`inbox/`).
   */
  const refreshInbox = useCallback(async () => {
    try {
      const items = await getInboxItems();
      setInboxItems(items);
    } catch (err) {
      console.error("Erreur lors du chargement de l'Inbox :", err);
    }
  }, []);

  /**
   * Charge les éléments présents dans la Corbeille (`trash/`).
   */
  const refreshTrash = useCallback(async () => {
    try {
      const items = await getTrashItems();
      setTrashItems(items);
    } catch (err) {
      console.error("Erreur lors du chargement de la Corbeille :", err);
    }
  }, []);

  // Références de séquence pour annuler les retours asynchrones obsolètes
  const loadSeqRef = useRef<number>(0);
  const loadSecondarySeqRef = useRef<number>(0);
  const hasInitializedRef = useRef<boolean>(false);

  // Références synchronisées avec l'état de navigation actif pour éviter les fermetures obsolètes (stale closures)
  // et empêcher que refreshProjects ne se redéclenche à chaque changement de projet/sous-dossier
  const activeProjectRef = useRef<string>(activeProject);
  activeProjectRef.current = activeProject;

  const currentSubpathRef = useRef<string | undefined>(currentSubpath);
  currentSubpathRef.current = currentSubpath;

  const currentFolderTypeRef = useRef<StandardFolderType | null>(currentFolderType);
  currentFolderTypeRef.current = currentFolderType;

  /**
   * Résout le code technique ('docs', 'assets', etc.) depuis un chemin ou identifiant de dossier.
   */
  const resolveFolderTypeFromPath = useCallback((path?: string): StandardFolderType | null => {
    if (!path) return null;
    const trimmed = path.trim().toLowerCase().replace(/\\/g, "/");
    if (trimmed === "docs" || trimmed === "01-docs" || trimmed.startsWith("01-docs/") || trimmed.endsWith("/01-docs")) return "docs";
    if (trimmed === "assets" || trimmed === "02-assets" || trimmed.startsWith("02-assets/") || trimmed.endsWith("/02-assets")) return "assets";
    if (trimmed === "sessions" || trimmed === "03-sessions" || trimmed.startsWith("03-sessions/") || trimmed.endsWith("/03-sessions")) return "sessions";
    if (trimmed === "archive" || trimmed === "99-archive" || trimmed.startsWith("99-archive/") || trimmed.endsWith("/99-archive")) return "archive";
    return null;
  }, []);

  /**
   * Normalise un sous-chemin ou code technique en chemin de sous-dossier canonique (ex: 'assets' -> '02-Assets').
   * Renvoie undefined uniquement lorsqu'on cible explicitement la racine du projet.
   */
  const resolveCanonicalSubpath = useCallback(
    (subpath?: string, folderType?: StandardFolderType | null): string | undefined => {
      const trimmed = subpath?.trim();
      if (trimmed) {
        const lower = trimmed.toLowerCase();
        if (lower in STANDARD_FOLDER_MAP) {
          return STANDARD_FOLDER_MAP[lower as StandardFolderType];
        }
        return trimmed;
      }
      if (folderType && folderType in STANDARD_FOLDER_MAP) {
        return STANDARD_FOLDER_MAP[folderType];
      }
      return undefined;
    },
    []
  );

  /**
   * Charge le contenu d'un projet (et d'un sous-dossier spécifique) depuis Rust.
   */
  const loadProjectFolder = useCallback(
    async (projectName: string, subpath?: string, folderType?: StandardFolderType | null) => {
      if (!projectName) {
        setProjectContents([]);
        setSelectedEntryId("");
        return;
      }

      const targetSubpath = resolveCanonicalSubpath(subpath, folderType);
      const seq = ++loadSeqRef.current;
      try {
        const contents = await readProjectContents(projectName, targetSubpath);
        if (seq !== loadSeqRef.current) return;
        setProjectContents(contents);

        // Si on lit la racine du projet, on met aussi à jour les sous-dossiers pour l'arbre et l'Inbox
        if (!targetSubpath) {
          const rootDirs = contents
            .filter((item) => item.est_dossier)
            .map((item) => item.nom);
          setProjectSubfoldersMap((prev) => ({
            ...prev,
            [projectName]: rootDirs,
          }));
        }

        if (contents.length > 0) {
          const first = contents[0];
          const firstId = first.chemin_relatif || first.nom;
          setSelectedEntryId(firstId);
          setSelectedEntryIds(new Set([firstId]));
          setLastSelectedEntryId(firstId);
        } else {
          setSelectedEntryId("");
          setSelectedEntryIds(new Set());
          setLastSelectedEntryId("");
        }
      } catch (err) {
        if (seq !== loadSeqRef.current) return;
        console.error("Erreur lors de la lecture du projet :", err);
        setProjectContents([]);
        setSelectedEntryIds(new Set());
      }
    },
    [resolveCanonicalSubpath]
  );

  /**
   * Charge le contenu du second projet affiché en Split-View.
   */
  const loadSecondaryProjectFolder = useCallback(
    async (projectName: string, subpath?: string) => {
      if (!projectName) {
        setSecondaryContents([]);
        setSelectedSecondaryEntryId("");
        return;
      }

      const targetSubpath = resolveCanonicalSubpath(subpath);
      const seq = ++loadSecondarySeqRef.current;
      try {
        const contents = await readProjectContents(projectName, targetSubpath);
        if (seq !== loadSecondarySeqRef.current) return;
        setSecondaryContents(contents);
        if (contents.length > 0) {
          const first = contents[0];
          setSelectedSecondaryEntryId(first.chemin_relatif || first.nom);
        } else {
          setSelectedSecondaryEntryId("");
        }
      } catch (err) {
        if (seq !== loadSecondarySeqRef.current) return;
        console.error("Erreur lors de la lecture du second projet :", err);
        setSecondaryContents([]);
        setSelectedSecondaryEntryId("");
      }
    },
    [resolveCanonicalSubpath]
  );

  /**
   * Charge la liste des projets depuis `projects/` et précharge leurs sous-dossiers racines.
   * Ne réinitialise jamais le sous-dossier actif sur la racine par erreur.
   */
  const refreshProjects = useCallback(
    async (preferredProject?: string, preferredSubpath?: string) => {
      try {
        const list = await listProjects();
        setProjects(list);

        // Synchronisation des favoris épinglés avec les projets existants
        setPinnedProjects((prev) => {
          const valid = prev.filter((p) => list.includes(p));
          if (valid.length === 0 && list.length > 0) {
            const initial = list.slice(0, MAX_SHORTCUTS);
            try {
              localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(initial));
            } catch {
              // ignore
            }
            return initial;
          }
          if (valid.length !== prev.length) {
            try {
              localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(valid));
            } catch {
              // ignore
            }
          }
          return valid;
        });

        if (list.length === 0) {
          setActiveProject("");
          setCurrentSubpath(undefined);
          setCurrentFolderType(null);
          setProjectContents([]);
          setSecondaryProject("");
          setSecondaryContents([]);
          return;
        }

        // Précharger les sous-dossiers de chaque projet pour le sélecteur Inbox
        const subMapEntries = await Promise.all(
          list.map(async (proj) => {
            try {
              const rootItems = await readProjectContents(proj);
              const subDirs = rootItems
                .filter((i) => i.est_dossier)
                .map((i) => i.nom);
              return [proj, subDirs] as const;
            } catch {
              return [proj, [] as string[]] as const;
            }
          })
        );
        setProjectSubfoldersMap(Object.fromEntries(subMapEntries));

        const currentActive = activeProjectRef.current;
        const targetProject =
          preferredProject && list.includes(preferredProject)
            ? preferredProject
            : currentActive && list.includes(currentActive)
            ? currentActive
            : list[0];

        // Préserve le sous-dossier actif si on actualise le projet en cours
        const effectiveSubpath =
          preferredSubpath !== undefined
            ? resolveCanonicalSubpath(preferredSubpath)
            : targetProject === currentActive
            ? resolveCanonicalSubpath(currentSubpathRef.current, currentFolderTypeRef.current)
            : undefined;

        const effectiveFolderType = resolveFolderTypeFromPath(effectiveSubpath);

        setActiveProject(targetProject);
        setCurrentSubpath(effectiveSubpath);
        setCurrentFolderType(effectiveFolderType);

        // Sélection intelligente du second projet pour le Split-View
        const defaultSecondary =
          list.find((p) => p !== targetProject) || list[0] || "";
        setSecondaryProject((prev) => {
          if (prev && list.includes(prev) && prev !== targetProject) {
            return prev;
          }
          return defaultSecondary;
        });

        await loadProjectFolder(targetProject, effectiveSubpath, effectiveFolderType);
        setNavHistory((prev) => {
          if (prev.length === 0) {
            return [{ project: targetProject, subpath: effectiveSubpath }];
          }
          return prev;
        });
        setHistoryIndex((prev) => (prev === -1 ? 0 : prev));
      } catch (err) {
        console.error("Erreur lors du chargement des projets :", err);
      }
    },
    [loadProjectFolder, resolveCanonicalSubpath, resolveFolderTypeFromPath]
  );

  /**
   * Initialisation unique au montage de l'écran Explorer.
   * Ne se redéclenche pas lors des changements de projet ou de sous-dossier.
   */
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    void refreshInbox();
    void refreshProjects();
    void refreshTrash();
  }, [refreshInbox, refreshProjects, refreshTrash]);

  /**
   * Synchronisation réactive de la grille principale avec le chemin actif
   * (activeProject + currentSubpath + currentFolderType).
   * Garantit que le contenu affiché correspond toujours au fil d'Ariane.
   */
  useEffect(() => {
    if (!activeProject) return;
    const targetSubpath = resolveCanonicalSubpath(currentSubpath, currentFolderType);
    void loadProjectFolder(activeProject, targetSubpath, currentFolderType);
  }, [activeProject, currentSubpath, currentFolderType, loadProjectFolder, resolveCanonicalSubpath]);


  /**
   * Entrées de la grille principale filtrées par la recherche.
   */
  const primaryGridEntries: GridEntry[] = useMemo(() => {
    const all = projectContents.map(toGridEntry);
    const query = searchQuery.trim().toLowerCase();
    if (!query) return all;
    return all.filter((entry) => entry.label.toLowerCase().includes(query));
  }, [projectContents, searchQuery]);

  /**
   * Entrées du second volet (Split-View projet 2).
   */
  const secondaryGridEntries: GridEntry[] = useMemo(() => {
    return secondaryContents.map(toGridEntry);
  }, [secondaryContents]);

  /**
   * Fermeture du panneau secondaire Split-View.
   */
  const handleCloseSecondary = useCallback(() => {
    setIsSplitViewActive(false);
  }, []);

  /**
   * Sélection d'un projet pour le volet Split-View secondaire.
   */
  const handleSelectSecondaryProject = (projectName: string) => {
    setSecondaryProject(projectName);
    setSecondarySubpath(undefined);
    void loadSecondaryProjectFolder(projectName, undefined);
  };

  /**
   * Navigation double-clic dans un dossier du second volet Split-View.
   */
  const handleOpenSecondaryFolderEntry = (entry: GridEntry) => {
    if (!secondaryProject || !entry.isFolder) return;
    setSecondarySubpath(entry.id);
    void loadSecondaryProjectFolder(secondaryProject, entry.id);
  };

  /**
   * Retour à la racine du second projet en Split-View.
   */
  const handleResetSecondarySubpath = () => {
    if (!secondaryProject) return;
    setSecondarySubpath(undefined);
    void loadSecondaryProjectFolder(secondaryProject, undefined);
  };

  /**
   * Navigue vers un projet et un sous-dossier, en alimentant l'historique de navigation.
   * Accepte un sous-chemin relatif, un chemin absolu, ou un code technique ('docs', 'assets', etc.).
   */
  const navigateTo = useCallback(
    (
      projectName: string,
      subpath?: string,
      folderType?: StandardFolderType,
      replace = false
    ) => {
      if (!projectName) return;

      const resolvedType = folderType || resolveFolderTypeFromPath(subpath);
      const canonicalSubpath = resolveCanonicalSubpath(subpath, resolvedType);

      setActiveProject(projectName);
      setCurrentSubpath(canonicalSubpath);
      setCurrentFolderType(resolvedType || null);

      // Charge immédiatement le dossier cible en transmettant le sous-chemin canonique exact
      void loadProjectFolder(projectName, canonicalSubpath, resolvedType);

      // Si le second projet est identique, on bascule le second sur un autre si possible
      if (secondaryProject === projectName) {
        const other = projects.find((p) => p !== projectName);
        if (other) {
          setSecondaryProject(other);
          setSecondarySubpath(undefined);
          void loadSecondaryProjectFolder(other, undefined);
        }
      }

      setNavHistory((prev) => {
        const current = prev[historyIndex];
        if (
          current &&
          current.project === projectName &&
          current.subpath === canonicalSubpath
        ) {
          return prev;
        }

        if (replace || historyIndex === -1) {
          return [{ project: projectName, subpath: canonicalSubpath }];
        }

        const next = [
          ...prev.slice(0, historyIndex + 1),
          { project: projectName, subpath: canonicalSubpath },
        ];
        return next;
      });

      if (replace || historyIndex === -1) {
        setHistoryIndex(0);
      } else {
        setHistoryIndex((prev) => prev + 1);
      }
    },
    [
      historyIndex,
      loadProjectFolder,
      loadSecondaryProjectFolder,
      projects,
      resolveCanonicalSubpath,
      resolveFolderTypeFromPath,
      secondaryProject,
    ]
  );

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex >= 0 && historyIndex < navHistory.length - 1;

  const handleGoBack = useCallback(() => {
    if (!canGoBack) return;
    const targetIdx = historyIndex - 1;
    const target = navHistory[targetIdx];
    if (target) {
      const folderType = resolveFolderTypeFromPath(target.subpath);
      const canonicalSubpath = resolveCanonicalSubpath(target.subpath, folderType);
      setHistoryIndex(targetIdx);
      setActiveProject(target.project);
      setCurrentSubpath(canonicalSubpath);
      setCurrentFolderType(folderType);
      void loadProjectFolder(target.project, canonicalSubpath, folderType);
    }
  }, [canGoBack, historyIndex, navHistory, loadProjectFolder, resolveCanonicalSubpath, resolveFolderTypeFromPath]);

  const handleGoForward = useCallback(() => {
    if (!canGoForward) return;
    const targetIdx = historyIndex + 1;
    const target = navHistory[targetIdx];
    if (target) {
      const folderType = resolveFolderTypeFromPath(target.subpath);
      const canonicalSubpath = resolveCanonicalSubpath(target.subpath, folderType);
      setHistoryIndex(targetIdx);
      setActiveProject(target.project);
      setCurrentSubpath(canonicalSubpath);
      setCurrentFolderType(folderType);
      void loadProjectFolder(target.project, canonicalSubpath, folderType);
    }
  }, [canGoForward, historyIndex, navHistory, loadProjectFolder, resolveCanonicalSubpath, resolveFolderTypeFromPath]);

  /**
   * Sélection d'un projet depuis la Topbar (navigation à la racine).
   */
  const handleSelectProject = (projectName: string) => {
    navigateTo(projectName, undefined);
  };

  /**
   * Sélection d'une tuile de la grille principale avec gestion des modificateurs clavier :
   * - Shift + Clic : sélectionne la plage continue entre le dernier élément sélectionné (ancre) et l'élément cliqué.
   * - Ctrl / Meta + Clic : ajoute ou retire l'élément de la sélection existante.
   * - Clic simple : sélectionne uniquement cet élément.
   */
  const handleSelectGridEntry = useCallback(
    (entry: GridEntry, e?: React.MouseEvent) => {
      const isShift = Boolean(e?.shiftKey);
      const isCtrl = Boolean(e?.ctrlKey || e?.metaKey);

      if (isShift) {
        const anchorId = lastSelectedEntryId || selectedEntryId;
        const anchorIdx = primaryGridEntries.findIndex((item) => item.id === anchorId);
        const targetIdx = primaryGridEntries.findIndex((item) => item.id === entry.id);

        if (anchorIdx !== -1 && targetIdx !== -1) {
          const start = Math.min(anchorIdx, targetIdx);
          const end = Math.max(anchorIdx, targetIdx);
          const rangeIds = primaryGridEntries.slice(start, end + 1).map((item) => item.id);

          setSelectedEntryIds((prev) => {
            const next = isCtrl ? new Set(prev) : new Set<string>();
            for (const id of rangeIds) {
              next.add(id);
            }
            return next;
          });
          setSelectedEntryId(entry.id);
          return;
        }
      }

      if (isCtrl) {
        setSelectedEntryIds((prev) => {
          const next = new Set(prev);
          if (next.has(entry.id)) {
            next.delete(entry.id);
          } else {
            next.add(entry.id);
          }
          return next;
        });
        setSelectedEntryId(entry.id);
        setLastSelectedEntryId(entry.id);
        return;
      }

      setSelectedEntryId(entry.id);
      setSelectedEntryIds(new Set([entry.id]));
      setLastSelectedEntryId(entry.id);
    },
    [lastSelectedEntryId, primaryGridEntries, selectedEntryId]
  );

  /**
   * Mise à jour de la sélection par rectangle visuel (Marquee Selection).
   */
  const handleMarqueeSelect = useCallback(
    (intersectedIds: string[], additive: boolean) => {
      setSelectedEntryIds((prev) => {
        const next = additive ? new Set(prev) : new Set<string>();
        for (const id of intersectedIds) {
          next.add(id);
        }
        return next;
      });
      if (intersectedIds.length > 0) {
        const lastId = intersectedIds[intersectedIds.length - 1];
        setSelectedEntryId(lastId);
        setLastSelectedEntryId(lastId);
      } else if (!additive) {
        setSelectedEntryId("");
      }
    },
    []
  );

  /**
   * Effacement de la sélection active au clic sur le fond vide de la grille.
   */
  const handleClearSelection = useCallback(() => {
    setSelectedEntryId("");
    setSelectedEntryIds(new Set());
  }, []);

  /**
   * Vérifie si un fichier dispose d'une extension prise en charge par le visualiseur (PreviewDrawer).
   */
  const isPreviewableFile = (filename: string): boolean => {
    const dotIdx = filename.lastIndexOf(".");
    if (dotIdx > 0) {
      const ext = filename.slice(dotIdx + 1).toLowerCase();
      return PREVIEWABLE_EXTENSIONS.has(ext);
    }
    return false;
  };

  /**
   * Double-clic sur un dossier de la grille centrale :
   * Navigue directement à l'intérieur du dossier sélectionné.
   */
  const handleOpenFolderEntry = (entry: GridEntry) => {
    if (!activeProject || !entry.isFolder) return;
    navigateTo(activeProject, entry.id, entry.folderType || undefined);
  };

  /**
   * Navigation via le fil d'Ariane (Breadcrumb) du panneau principal.
   */
  const handleNavigateBreadcrumb = (targetSubpath?: string) => {
    if (!activeProject) return;
    navigateTo(activeProject, targetSubpath);
  };

  /**
   * Double-clic sur un fichier de la grille centrale :
   * - Si fichier pris en charge (.png, .jpg, .svg, .txt, .md, .pdf, etc.) :
   *   ouvre le panneau droit en mode Visualiseur (PreviewDrawer).
   * - Sinon : ouverture directe dans l'application système par défaut (Windows).
   */
  const handleOpenFileEntry = async (entry: GridEntry) => {
    if (!activeProject || entry.isFolder) return;

    if (isPreviewableFile(entry.label)) {
      setIsSplitViewActive(false);
      setPreviewFile({
        project: activeProject,
        subpath: entry.id,
        label: entry.label,
        size: entry.size,
      });
    } else {
      try {
        await openFileInSystem(activeProject, entry.id);
      } catch (err: unknown) {
        const errorMsg = typeof err === "string" ? err : String(err);
        console.error(
          `[Explorer] Erreur lors de l'ouverture du fichier '${entry.label}' :`,
          errorMsg
        );
      }
    }
  };

  /**
   * Navigation via le fil d'Ariane du second panneau en Split-View.
   */
  const handleNavigateSecondaryBreadcrumb = (targetSubpath?: string) => {
    if (!secondaryProject) return;
    setSecondarySubpath(targetSubpath);
    void loadSecondaryProjectFolder(secondaryProject, targetSubpath);
  };

  /**
   * Double-clic sur un fichier du second volet :
   * - Si pris en charge : bascule vers le visualiseur.
   * - Sinon : ouverture dans le système hôte Windows.
   */
  const handleOpenSecondaryFileEntry = async (entry: GridEntry) => {
    if (!secondaryProject || entry.isFolder) return;

    if (isPreviewableFile(entry.label)) {
      setIsSplitViewActive(false);
      setPreviewFile({
        project: secondaryProject,
        subpath: entry.id,
        label: entry.label,
        size: entry.size,
      });
    } else {
      try {
        await openFileInSystem(secondaryProject, entry.id);
      } catch (err: unknown) {
        const errorMsg = typeof err === "string" ? err : String(err);
        console.error(
          `[Explorer] Erreur ouverture fichier second volet '${entry.label}' :`,
          errorMsg
        );
      }
    }
  };

  /**
   * Déplacement validé d'un élément de la Boîte de dépôt (`inbox/`) vers un projet cible.
   */
  const handleMoveInboxItem = async (
    itemName: string,
    targetProject: string,
    targetSubpath?: string
  ) => {
    await moveInboxItem(itemName, targetProject, targetSubpath);
    await refreshInbox();
    await refreshProjects(targetProject, currentSubpath);
  };

  const handleRefreshAll = () => {
    void refreshInbox();
    void refreshProjects(activeProject, currentSubpath);
  };

  /**
   * Synchronise en mémoire la taille réelle d'un fichier après lecture ou édition dans le visualiseur.
   */
  const handleFileSizeUpdated = useCallback(
    (project: string, subpath: string, newSize: number) => {
      if (project === activeProject) {
        setProjectContents((prev) =>
          prev.map((item) =>
            (item.chemin_relatif || item.nom) === subpath && item.taille !== newSize
              ? { ...item, taille: newSize }
              : item
          )
        );
      }
      if (isSplitViewActive && project === secondaryProject) {
        setSecondaryContents((prev) =>
          prev.map((item) =>
            (item.chemin_relatif || item.nom) === subpath && item.taille !== newSize
              ? { ...item, taille: newSize }
              : item
          )
        );
      }
      setPreviewFile((prev) =>
        prev && prev.project === project && prev.subpath === subpath && prev.size !== newSize
          ? { ...prev, size: newSize }
          : prev
      );
    },
    [activeProject, isSplitViewActive, secondaryProject]
  );

  /**
   * Création d'un nouveau projet via Rust.
   */
  const handleCreateProject = async (newProjectName: string) => {
    const created = await createProject(newProjectName);
    await refreshProjects(created, undefined);

    setPinnedProjects((prev) => {
      if (prev.length < MAX_SHORTCUTS && !prev.includes(created)) {
        const next = [...prev, created];
        try {
          localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      }
      return prev;
    });
  };

  /**
   * Conversion d'un dossier de la Boîte de dépôt en nouveau projet structuré via Rust.
   */
  const handleConvertInboxFolderToProject = async (
    folderPath: string,
    projectName: string
  ) => {
    const created = await convertInboxFolderToProject(folderPath, projectName);
    await refreshInbox();
    await refreshProjects(created, undefined);

    setPinnedProjects((prev) => {
      if (prev.length < MAX_SHORTCUTS && !prev.includes(created)) {
        const next = [...prev, created];
        try {
          localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      }
      return prev;
    });
  };

  /**
   * Bascule d'épinglage d'un projet dans les favoris Topbar (1 à 4 max).
   */
  const handleTogglePinProject = (projectName: string) => {
    setPinnedProjects((prev) => {
      let next: string[];
      if (prev.includes(projectName)) {
        next = prev.filter((p) => p !== projectName);
      } else {
        if (prev.length >= MAX_SHORTCUTS) return prev;
        next = [...prev, projectName];
      }
      try {
        localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  /**
   * Confirmation de suppression d'un projet :
   * Déplace l'ensemble du projet (et tous ses sous-dossiers et fichiers) vers la corbeille / archives.
   */
  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return;
    const target = projectToDelete;
    setIsDeletingProject(true);
    try {
      await deleteProject(target);
      await refreshTrash();
      setProjectToDelete(null);

      // Si le projet supprimé était épinglé
      setPinnedProjects((prev) => {
        const next = prev.filter((p) => p !== target);
        try {
          localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });

      const nextProjects = projects.filter((p) => p !== target);
      setProjects(nextProjects);

      if (activeProject === target) {
        const nextActive = nextProjects[0] || "";
        setActiveProject(nextActive);
        setCurrentSubpath(undefined);
        if (nextActive) {
          void loadProjectFolder(nextActive, undefined);
        } else {
          setProjectContents([]);
        }
      }
      if (secondaryProject === target) {
        const nextSec = nextProjects.find((p) => p !== activeProject) || nextProjects[0] || "";
        setSecondaryProject(nextSec);
        setSecondarySubpath(undefined);
        if (nextSec && isSplitViewActive) {
          void loadSecondaryProjectFolder(nextSec, undefined);
        } else {
          setSecondaryContents([]);
        }
      }
      void refreshProjects();
    } catch (err: unknown) {
      console.error(`[Explorer] Erreur lors de la suppression du projet '${target}' :`, err);
    } finally {
      setIsDeletingProject(false);
    }
  };

  /**
   * Ouvre la modale de renommage pour un projet sélectionné.
   */
  const handleStartRenameProject = (projectName: string) => {
    setProjectToRename(projectName);
    setRenameInputValue(projectName);
    setRenameError(null);
  };

  /**
   * Confirmation du renommage d'un projet.
   */
  const handleConfirmRenameProject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!projectToRename) return;

    const oldName = projectToRename;
    const newName = renameInputValue.trim();

    if (!newName) {
      setRenameError("Le nom du projet ne peut pas être vide.");
      return;
    }
    if (newName === oldName) {
      setProjectToRename(null);
      return;
    }
    if (projects.includes(newName)) {
      setRenameError("Un projet portant ce nom existe déjà.");
      return;
    }

    try {
      await renameProject(oldName, newName);

      // Mise à jour des favoris épinglés
      setPinnedProjects((prev) => {
        const next = prev.map((p) => (p === oldName ? newName : p));
        try {
          localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });

      // Mise à jour de l'historique de navigation
      setNavHistory((prev) =>
        prev.map((item) =>
          item.project === oldName ? { ...item, project: newName } : item
        )
      );

      // Mise à jour du projet actif / secondaire
      if (activeProject === oldName) {
        setActiveProject(newName);
      }
      if (secondaryProject === oldName) {
        setSecondaryProject(newName);
      }

      setProjectToRename(null);
      await refreshProjects(newName, currentSubpath);
    } catch (err: unknown) {
      const msg = typeof err === "string" ? err : String(err);
      setRenameError(msg);
    }
  };

  /**
   * Ouverture du menu contextuel sur une tuile (carte de fichier ou dossier).
   */
  const handleOpenCardContextMenu = (
    e: React.MouseEvent,
    entry: GridEntry,
    project: string,
    subpath?: string
  ) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetEntry: entry,
      targetProject: project,
      targetSubpath: subpath,
    });
  };

  /**
   * Ouverture du menu contextuel sur le fond de la grille.
   */
  const handleOpenGridContextMenu = (
    e: React.MouseEvent,
    project: string,
    subpath?: string
  ) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetProject: project,
      targetSubpath: subpath,
    });
  };

  /**
   * Action contextuelle : Ouvrir le projet ou sous-dossier dans le panneau secondaire.
   */
  const handleOpenInSecondary = (overrideProject?: string) => {
    const proj = overrideProject || contextMenu?.targetProject;
    if (!proj) return;
    const sub = overrideProject ? undefined : (contextMenu?.targetEntry?.id || undefined);
    setPreviewFile(null);
    setIsSplitViewActive(true);
    setSecondaryProject(proj);
    setSecondarySubpath(sub);
    void loadSecondaryProjectFolder(proj, sub);
  };

  /**
   * Action contextuelle : Aperçu / Visualiser le fichier dans le panneau droit.
   */
  const handlePreviewContextMenu = () => {
    if (!contextMenu?.targetEntry || contextMenu.targetEntry.isFolder) return;
    const { targetProject, targetEntry } = contextMenu;
    setIsSplitViewActive(false);
    setPreviewFile({
      project: targetProject,
      subpath: targetEntry.id,
      label: targetEntry.label,
      size: targetEntry.size,
    });
  };

  /**
   * Action contextuelle : Ouvrir le fichier dans l'application par défaut de Windows.
   */
  const handleOpenInSystemContextMenu = async () => {
    if (!contextMenu?.targetEntry || contextMenu.targetEntry.isFolder) return;
    const { targetProject, targetEntry } = contextMenu;
    try {
      await openFileInSystem(targetProject, targetEntry.id);
    } catch (err: unknown) {
      console.error(
        `[Explorer] Erreur lors de l'ouverture système de '${targetEntry.label}' :`,
        err
      );
    }
  };

  /**
   * Copier l'élément ciblé vers le presse-papier virtuel.
   */
  const handleCopy = () => {
    if (!contextMenu?.targetEntry || !contextMenu.targetEntry.id) return;
    setClipboard({
      op: "copy",
      project: contextMenu.targetProject,
      subpath: contextMenu.targetEntry.id,
      entry: contextMenu.targetEntry,
    });
  };

  /**
   * Couper l'élément ciblé vers le presse-papier virtuel.
   */
  const handleCut = () => {
    if (!contextMenu?.targetEntry || !contextMenu.targetEntry.id) return;
    setClipboard({
      op: "cut",
      project: contextMenu.targetProject,
      subpath: contextMenu.targetEntry.id,
      entry: contextMenu.targetEntry,
    });
  };

  /**
   * Coller l'élément du presse-papier virtuel dans le projet / sous-dossier actuel.
   */
  const handlePaste = async () => {
    if (!clipboard || !contextMenu) return;
    const destProject = contextMenu.targetProject;
    // On transmet le chemin complet incluant le nom de l'élément
    const destSubpath = contextMenu.targetSubpath
      ? `${contextMenu.targetSubpath}/${clipboard.entry.label}`
      : clipboard.entry.label;

    try {
      if (clipboard.op === "copy") {
        await copyItem(
          clipboard.project,
          clipboard.subpath,
          destProject,
          destSubpath
        );
      } else if (clipboard.op === "cut") {
        await moveItem(
          clipboard.project,
          clipboard.subpath,
          destProject,
          destSubpath
        );
        setClipboard(null);
      }
      await loadProjectFolder(activeProject, currentSubpath);
      if (isSplitViewActive && secondaryProject) {
        await loadSecondaryProjectFolder(secondaryProject, secondarySubpath);
      }
    } catch (err) {
      console.error("Erreur lors du collage :", err);
    }
  };

  /**
   * Déplacement sécurisé vers la corbeille.
   */
  const handleDeleteToTrash = async (
    targetEntry?: GridEntry,
    targetProject?: string
  ) => {
    const entry = targetEntry || contextMenu?.targetEntry;
    const proj = targetProject || contextMenu?.targetProject || activeProject;
    if (!entry || !proj || !entry.id) return;

    try {
      await moveToTrash(proj, entry.id);
      await refreshTrash();
      await loadProjectFolder(activeProject, currentSubpath);
      if (isSplitViewActive && secondaryProject) {
        await loadSecondaryProjectFolder(secondaryProject, secondarySubpath);
      }
    } catch (err) {
      console.error("Erreur déplacement vers la corbeille :", err);
    }
  };

  /**
   * Vidage définitif de la corbeille (après confirmation explicite utilisateur).
   */
  const handleEmptyTrash = async () => {
    try {
      await emptyTrash();
      await refreshTrash();
    } catch (err) {
      console.error("Erreur vidage de la corbeille :", err);
    }
  };

  /**
   * Début du glisser-déposer d'un ou plusieurs fichiers / sous-dossiers.
   * Si l'élément glissé fait partie d'une multisélection active, tous les éléments sélectionnés sont déplacés ensemble.
   */
  const handleDragStart = (
    e: React.DragEvent,
    entry: GridEntry,
    project: string
  ) => {
    let itemsToDrag: Array<{
      project: string;
      subpath: string;
      isFolder: boolean;
      label: string;
    }>;

    if (project === activeProject && selectedEntryIds.has(entry.id) && selectedEntryIds.size > 1) {
      itemsToDrag = primaryGridEntries
        .filter((item) => selectedEntryIds.has(item.id))
        .map((item) => ({
          project,
          subpath: item.id,
          isFolder: item.isFolder,
          label: item.label,
        }));
    } else {
      if (project === activeProject) {
        setSelectedEntryId(entry.id);
        setSelectedEntryIds(new Set([entry.id]));
        setLastSelectedEntryId(entry.id);
      }
      itemsToDrag = [
        {
          project,
          subpath: entry.id,
          isFolder: entry.isFolder,
          label: entry.label,
        },
      ];
    }

    const payloadObj = {
      project,
      subpath: entry.id,
      isFolder: entry.isFolder,
      label: entry.label,
      items: itemsToDrag,
    };

    draggedPayloadRef.current = payloadObj;

    const payload = JSON.stringify(payloadObj);
    e.dataTransfer.setData("application/json", payload);
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "move";
  };

  /**
   * Importation de fichiers externes (glissés depuis Windows)
   * vers l'Inbox (par défaut) ou vers un projet cible.
   */
  const handleImportExternalFiles = async (
    files: FileList | File[],
    targetProject?: string,
    targetSubpath?: string
  ) => {
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const nativePath = (file as unknown as { path?: string }).path;
        if (nativePath) {
          await importExternalPath(nativePath, targetProject, targetSubpath);
        } else {
          const buffer = await file.arrayBuffer();
          const bytes = Array.from(new Uint8Array(buffer));
          await saveFileBytes(file.name, bytes, targetProject, targetSubpath);
        }
      }
      await refreshInbox();
      if (targetProject) {
        await loadProjectFolder(targetProject, targetSubpath);
        if (isSplitViewActive && secondaryProject === targetProject) {
          await loadSecondaryProjectFolder(secondaryProject, targetSubpath);
        }
      }
    } catch (err) {
      console.error("[Explorer] Erreur lors de l'importation de fichiers externes :", err);
    }
  };

  /**
   * Dépôt d'un ou plusieurs éléments sur une tuile dossier de la grille.
   */
  const handleDropOnFolder = async (
    e: React.DragEvent,
    targetFolderEntry: GridEntry,
    targetProject: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Dépôt de fichiers externes depuis l'OS Windows
    if (
      e.dataTransfer.files &&
      e.dataTransfer.files.length > 0 &&
      !e.dataTransfer.types.includes("application/json") &&
      !draggedPayloadRef.current
    ) {
      await handleImportExternalFiles(
        e.dataTransfer.files,
        targetProject,
        targetFolderEntry.id
      );
      return;
    }

    const raw =
      e.dataTransfer.getData("application/json") ||
      e.dataTransfer.getData("text/plain");

    try {
      let data = raw ? JSON.parse(raw) : null;
      if (!data && draggedPayloadRef.current) {
        data = draggedPayloadRef.current;
      }
      if (!data) return;

      // Cas 1 : Dépôt d'éléments provenant de la Boîte de dépôt (Inbox)
      if (data.source === "inbox" && Array.isArray(data.items)) {
        for (const itemName of data.items) {
          await moveInboxItem(itemName, targetProject, targetFolderEntry.id);
        }
        await refreshInbox();
        await loadProjectFolder(activeProject, currentSubpath, currentFolderType);
        if (isSplitViewActive && secondaryProject) {
          await loadSecondaryProjectFolder(secondaryProject, secondarySubpath);
        }
        return;
      }

      // Cas 2 : Dépôt d'un ou plusieurs éléments de la grille vers le dossier cible
      const itemsToMove: Array<{
        project: string;
        subpath: string;
        label: string;
        isFolder?: boolean;
      }> = Array.isArray(data.items) && data.items.length > 0
        ? data.items
        : data.subpath
        ? [
            {
              project: data.project,
              subpath: data.subpath,
              label: data.label,
              isFolder: data.isFolder,
            },
          ]
        : [];

      if (itemsToMove.length === 0) return;

      let movedCount = 0;
      for (const item of itemsToMove) {
        if (!item.project || !item.subpath || !item.label) continue;
        // Interdire le déplacement d'un dossier dans lui-même ou dans l'un de ses sous-dossiers
        if (
          item.project === targetProject &&
          (item.subpath === targetFolderEntry.id ||
            targetFolderEntry.id.startsWith(`${item.subpath}/`))
        ) {
          continue;
        }
        const destSubpath = `${targetFolderEntry.id}/${item.label}`;
        if (item.project === targetProject && item.subpath === destSubpath) {
          continue;
        }
        await moveItem(item.project, item.subpath, targetProject, destSubpath);
        movedCount++;
      }

      if (movedCount > 0) {
        await loadProjectFolder(activeProject, currentSubpath, currentFolderType);
        if (isSplitViewActive && secondaryProject) {
          await loadSecondaryProjectFolder(secondaryProject, secondarySubpath);
        }
      }
    } catch (err) {
      console.error("Erreur glisser-déposer sur dossier :", err);
    } finally {
      draggedPayloadRef.current = null;
    }
  };

  /**
   * Dépôt d'un ou plusieurs éléments sur un segment du fil d'Ariane (Breadcrumb)
   * ou directement sur le fond vide d'un panneau (déplacement à la racine du répertoire courant).
   */
  const handleDropOnBreadcrumb = async (
    e: React.DragEvent,
    targetSubpath: string | undefined,
    targetProject: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExternalDragOver(false);

    if (!targetProject) return;

    // Dépôt de fichiers externes depuis l'OS Windows
    if (
      e.dataTransfer.files &&
      e.dataTransfer.files.length > 0 &&
      !e.dataTransfer.types.includes("application/json") &&
      !draggedPayloadRef.current
    ) {
      await handleImportExternalFiles(
        e.dataTransfer.files,
        targetProject,
        targetSubpath
      );
      return;
    }

    const raw =
      e.dataTransfer.getData("application/json") ||
      e.dataTransfer.getData("text/plain");

    try {
      let data = raw ? JSON.parse(raw) : null;
      if (!data && draggedPayloadRef.current) {
        data = draggedPayloadRef.current;
      }
      if (!data) return;

      // Cas 1 : Dépôt d'éléments provenant de la Boîte de dépôt (Inbox)
      if (data.source === "inbox" && Array.isArray(data.items)) {
        for (const itemName of data.items) {
          await moveInboxItem(itemName, targetProject, targetSubpath);
        }
        await refreshInbox();
        await loadProjectFolder(activeProject, currentSubpath, currentFolderType);
        if (isSplitViewActive && secondaryProject) {
          await loadSecondaryProjectFolder(secondaryProject, secondarySubpath);
        }
        return;
      }

      // Cas 2 : Dépôt d'un ou plusieurs éléments de la grille vers la racine du répertoire cible
      const itemsToMove: Array<{
        project: string;
        subpath: string;
        label: string;
      }> = Array.isArray(data.items) && data.items.length > 0
        ? data.items
        : data.subpath
        ? [{ project: data.project, subpath: data.subpath, label: data.label }]
        : [];

      let movedCount = 0;
      for (const item of itemsToMove) {
        if (!item.project || !item.subpath || !item.label) continue;
        // Interdire le déplacement d'un dossier dans lui-même ou dans l'un de ses sous-dossiers
        if (
          item.project === targetProject &&
          targetSubpath &&
          (item.subpath === targetSubpath ||
            targetSubpath.startsWith(`${item.subpath}/`))
        ) {
          continue;
        }
        const destSubpath = targetSubpath
          ? `${targetSubpath}/${item.label}`
          : item.label;
        if (item.project === targetProject && item.subpath === destSubpath) {
          continue;
        }
        await moveItem(item.project, item.subpath, targetProject, destSubpath);
        movedCount++;
      }

      if (movedCount > 0) {
        await loadProjectFolder(activeProject, currentSubpath, currentFolderType);
        if (isSplitViewActive && secondaryProject) {
          await loadSecondaryProjectFolder(secondaryProject, secondarySubpath);
        }
      }
    } catch (err) {
      console.error("Erreur glisser-déposer sur le répertoire :", err);
    } finally {
      draggedPayloadRef.current = null;
    }
  };

  /**
   * Dépôt direct d'un ou plusieurs éléments dans la corbeille (barre latérale droite).
   */
  const handleDropOnTrash = async (e: React.DragEvent) => {
    e.preventDefault();
    const raw =
      e.dataTransfer.getData("application/json") ||
      e.dataTransfer.getData("text/plain");
    try {
      let data = raw ? JSON.parse(raw) : null;
      if (!data && draggedPayloadRef.current) {
        data = draggedPayloadRef.current;
      }
      if (!data) return;

      const itemsToTrash: Array<{ project: string; subpath: string }> =
        Array.isArray(data.items) && data.items.length > 0
          ? data.items
          : data.subpath
          ? [{ project: data.project, subpath: data.subpath }]
          : [];

      for (const item of itemsToTrash) {
        await moveToTrash(item.project, item.subpath);
      }
      await refreshTrash();
      await loadProjectFolder(activeProject, currentSubpath, currentFolderType);
      if (isSplitViewActive && secondaryProject) {
        await loadSecondaryProjectFolder(secondaryProject, secondarySubpath);
      }
    } catch (err) {
      console.error("Erreur glisser-déposer vers la corbeille :", err);
    } finally {
      draggedPayloadRef.current = null;
    }
  };

  return (
    <div
      className={`explorer-screen ${isExternalDragOver ? "explorer-screen--external-drag" : ""}`}
      onDragOver={(e) => {
        if (e.dataTransfer && e.dataTransfer.types.includes("Files")) {
          const isInternal = e.dataTransfer.types.includes("application/json");
          if (!isInternal) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            setIsExternalDragOver(true);
          }
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsExternalDragOver(false);
        }
      }}
      onDrop={async (e) => {
        if (e.dataTransfer && e.dataTransfer.types.includes("Files")) {
          const isInternal = e.dataTransfer.types.includes("application/json");
          if (!isInternal) {
            e.preventDefault();
            setIsExternalDragOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              await handleImportExternalFiles(e.dataTransfer.files, undefined, undefined);
            }
          }
        }
      }}
    >
      {/* Overlay visuel lors du survol de fichiers externes Windows */}
      {isExternalDragOver && (
        <div className="explorer-screen__drop-overlay">
          <svg
            className="explorer-screen__drop-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="explorer-screen__drop-text">
            Déposez vos fichiers pour les ajouter à la Boîte de dépôt
          </span>
          <span className="explorer-screen__drop-subtext">
            Les éléments importés apparaîtront instantanément dans l'Inbox
          </span>
        </div>
      )}

      <Topbar
        projects={projects}
        pinnedProjects={pinnedProjects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        inboxCount={inboxItems.length}
        onOpenInbox={() => setIsInboxDrawerOpen((prev) => !prev)}
        onCreateProject={handleCreateProject}
        isSettingsOpen={isShortcutsOpen}
        onToggleSettings={() => setIsShortcutsOpen((prev) => !prev)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={handleRefreshAll}
        canGoBack={canGoBack}
        onGoBack={handleGoBack}
        canGoForward={canGoForward}
        onGoForward={handleGoForward}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        activeSubpath={currentSubpath}
        activeFolderType={currentFolderType}
        onNavigateSubfolder={(project, subfolder, folderType) =>
          navigateTo(project, subfolder, folderType)
        }
        onOpenInSecondary={handleOpenInSecondary}
        onRenameProject={(project) => handleStartRenameProject(project)}
        onDeleteProject={(project) => setProjectToDelete(project)}
      />

      {/* Panneau d'options (icône engrenage) : configuration des projets épinglés / favoris */}
      <ShortcutsPanel
        isOpen={isShortcutsOpen}
        projects={projects}
        pinnedProjects={pinnedProjects}
        onTogglePinProject={handleTogglePinProject}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <main className="explorer-screen__body">
        {/* TreePanel retiré : GridView s'étend sur tout l'espace disponible */}

        <GridView
          hasActiveProject={Boolean(activeProject)}
          activeProject={activeProject}
          currentPathLabel={currentSubpath}
          onNavigateBreadcrumb={handleNavigateBreadcrumb}
          entries={primaryGridEntries}
          selectedEntryId={selectedEntryId}
          selectedEntryIds={selectedEntryIds}
          onSelectEntry={handleSelectGridEntry}
          onMarqueeSelect={handleMarqueeSelect}
          onClearSelection={handleClearSelection}
          onOpenFolderEntry={handleOpenFolderEntry}
          onOpenFileEntry={handleOpenFileEntry}
          onAddFolderOrFiles={() => setIsInboxDrawerOpen(true)}
          onContextMenuCard={(e, entry) =>
            handleOpenCardContextMenu(e, entry, activeProject, currentSubpath)
          }
          onContextMenuGrid={(e) =>
            handleOpenGridContextMenu(e, activeProject, currentSubpath)
          }
          onDragStart={(e, entry) => handleDragStart(e, entry, activeProject)}
          onDropOnFolder={(e, target) =>
            handleDropOnFolder(e, target, activeProject)
          }
          onDropOnBreadcrumb={(e, targetSubpath) =>
            handleDropOnBreadcrumb(e, targetSubpath, activeProject)
          }
          onDropOnGridBackground={(e) =>
            handleDropOnBreadcrumb(e, currentSubpath, activeProject)
          }
          isSplitViewActive={isSplitViewActive}
          projects={projects}
          secondaryProject={secondaryProject}
          onSelectSecondaryProject={handleSelectSecondaryProject}
          secondaryPathLabel={secondarySubpath}
          onResetSecondarySubpath={handleResetSecondarySubpath}
          onNavigateSecondaryBreadcrumb={handleNavigateSecondaryBreadcrumb}
          secondaryEntries={secondaryGridEntries}
          selectedSecondaryEntryId={selectedSecondaryEntryId}
          onSelectSecondaryEntry={(entry) => setSelectedSecondaryEntryId(entry.id)}
          onOpenSecondaryFolderEntry={handleOpenSecondaryFolderEntry}
          onOpenSecondaryFileEntry={handleOpenSecondaryFileEntry}
          onContextMenuSecondaryCard={(e, entry) =>
            handleOpenCardContextMenu(e, entry, secondaryProject, secondarySubpath)
          }
          onContextMenuSecondaryGrid={(e) =>
            handleOpenGridContextMenu(e, secondaryProject, secondarySubpath)
          }
          onSecondaryDragStart={(e, entry) =>
            handleDragStart(e, entry, secondaryProject)
          }
          onSecondaryDropOnFolder={(e, target) =>
            handleDropOnFolder(e, target, secondaryProject)
          }
          onDropOnSecondaryBreadcrumb={(e, targetSubpath) =>
            handleDropOnBreadcrumb(e, targetSubpath, secondaryProject)
          }
          onDropOnSecondaryGridBackground={(e) =>
            handleDropOnBreadcrumb(e, secondarySubpath, secondaryProject)
          }
          previewFile={previewFile}
          onClosePreview={handleClosePreview}
          onCloseSecondary={handleCloseSecondary}
          onOpenInSystem={(project, subpath) => {
            void openFileInSystem(project, subpath);
          }}
          onFileSizeUpdated={handleFileSizeUpdated}
        />

        <EcosystemSidebar
          isOpen={isRightSidebarOpen}
          onToggle={() => setIsRightSidebarOpen((prev) => !prev)}
          trashCount={trashItems.length}
          onOpenTrash={() => setIsTrashDrawerOpen(true)}
          onDropToTrash={handleDropOnTrash}
        />
      </main>

      <InboxDrawer
        isOpen={isInboxDrawerOpen}
        items={inboxItems}
        projects={projects}
        defaultTargetProject={activeProject}
        availableSubfolders={projectSubfoldersMap}
        onClose={() => setIsInboxDrawerOpen(false)}
        onRefreshInbox={refreshInbox}
        onMoveItem={handleMoveInboxItem}
        onCreateProject={handleCreateProject}
        onConvertFolderToProject={handleConvertInboxFolderToProject}
      />

      {/* Menu contextuel au clic droit */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetEntry={contextMenu.targetEntry}
          hasClipboard={Boolean(clipboard)}
          onCopy={handleCopy}
          onCut={handleCut}
          onPaste={() => void handlePaste()}
          onDelete={() => void handleDeleteToTrash()}
          onRefresh={handleRefreshAll}
          onClose={() => setContextMenu(null)}
          onOpenInSecondary={handleOpenInSecondary}
          onPreview={
            contextMenu.targetEntry &&
            !contextMenu.targetEntry.isFolder &&
            isPreviewableFile(contextMenu.targetEntry.label)
              ? handlePreviewContextMenu
              : undefined
          }
          onOpenInSystem={
            contextMenu.targetEntry && !contextMenu.targetEntry.isFolder
              ? handleOpenInSystemContextMenu
              : undefined
          }
          onRenameProject={
            contextMenu.targetEntry?.isFolder && !contextMenu.targetEntry.id
              ? () => handleStartRenameProject(contextMenu.targetProject)
              : undefined
          }
          onDeleteProject={
            contextMenu.targetEntry?.isFolder && !contextMenu.targetEntry.id
              ? () => setProjectToDelete(contextMenu.targetProject)
              : undefined
          }
        />
      )}

      {/* Volet Corbeille sécurisé avec confirmation explicite */}
      <TrashDrawer
        isOpen={isTrashDrawerOpen}
        items={trashItems}
        onClose={() => setIsTrashDrawerOpen(false)}
        onRefreshTrash={refreshTrash}
        onEmptyTrash={handleEmptyTrash}
      />

      {/* Modale de confirmation : Suppression d'un projet avec avertissement sous-dossiers en archive */}
      {projectToDelete && (
        <div
          className="project-modal-overlay"
          onClick={() => !isDeletingProject && setProjectToDelete(null)}
        >
          <div
            className="project-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
          >
            <div className="project-modal__header">
              <div className="project-modal__icon project-modal__icon--danger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 id="delete-project-title" className="project-modal__title">
                Supprimer le projet « {projectToDelete} » ?
              </h3>
            </div>

            <div className="project-modal__body">
              <div className="project-modal__warning-box">
                <p className="project-modal__warning-text">
                  <strong>Avertissement :</strong> La suppression de ce projet déplacera l’ensemble de ses <strong>sous-dossiers et fichiers</strong> vers la corbeille locale (archives).
                </p>
              </div>
              <p className="project-modal__hint-text">
                Les éléments resteront consultables et restaurables depuis la corbeille tant que celle-ci n'est pas définitivement vidée.
              </p>
            </div>

            <div className="project-modal__footer">
              <button
                type="button"
                className="project-modal__btn project-modal__btn--secondary"
                onClick={() => setProjectToDelete(null)}
                disabled={isDeletingProject}
              >
                Annuler
              </button>
              <button
                type="button"
                className="project-modal__btn project-modal__btn--danger"
                onClick={handleConfirmDeleteProject}
                disabled={isDeletingProject}
              >
                {isDeletingProject ? "Déplacement..." : "Mettre en archive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de renommage d'un projet */}
      {projectToRename && (
        <div
          className="project-modal-overlay"
          onClick={() => setProjectToRename(null)}
        >
          <div
            className="project-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-project-title"
          >
            <form onSubmit={handleConfirmRenameProject}>
              <div className="project-modal__header">
                <div className="project-modal__icon project-modal__icon--accent">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <h3 id="rename-project-title" className="project-modal__title">
                  Renommer le projet « {projectToRename} »
                </h3>
              </div>

              <div className="project-modal__body">
                <label className="project-modal__label">Nouveau nom du projet</label>
                <input
                  type="text"
                  className="project-modal__input"
                  value={renameInputValue}
                  onChange={(e) => setRenameInputValue(e.target.value)}
                  autoFocus
                  placeholder="Entrez le nouveau nom..."
                />
                {renameError && (
                  <span className="project-modal__error">{renameError}</span>
                )}
              </div>

              <div className="project-modal__footer">
                <button
                  type="button"
                  className="project-modal__btn project-modal__btn--secondary"
                  onClick={() => setProjectToRename(null)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="project-modal__btn project-modal__btn--primary"
                >
                  Renommer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
