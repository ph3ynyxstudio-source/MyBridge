import React, { useState, useEffect, useCallback, useMemo } from "react";
import { TileKind } from "../../components/FolderCard/FolderCard";
import {
  copyItem,
  createProject,
  emptyTrash,
  getInboxItems,
  getTrashItems,
  InboxItem,
  listProjects,
  moveInboxItem,
  moveItem,
  moveToTrash,
  openFileInSystem,
  ProjectFolder,
  readProjectContents,
} from "../../services/storageService";
import { APP_CONFIG, TreePanelSize } from "../../theme/config";
import { Topbar } from "./components/Topbar/Topbar";
import { TreePanel, ProjectTreeNode } from "./components/TreePanel/TreePanel";
import { GridView, GridEntry } from "./components/GridView/GridView";
import { InboxDrawer } from "./components/InboxDrawer/InboxDrawer";
import {
  ShortcutsPanel,
  MAX_SHORTCUTS,
} from "./components/ShortcutsPanel/ShortcutsPanel";
import { EcosystemSidebar } from "./components/EcosystemSidebar/EcosystemSidebar";
import { ContextMenu } from "./components/ContextMenu/ContextMenu";
import { TrashDrawer } from "./components/TrashDrawer/TrashDrawer";
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

  // Presse-papier virtuel pour Copier / Couper / Coller
  const [clipboard, setClipboard] = useState<VirtualClipboard | null>(null);

  // Menu contextuel (clic droit)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Corbeille locale sécurisée
  const [trashItems, setTrashItems] = useState<InboxItem[]>([]);
  const [isTrashDrawerOpen, setIsTrashDrawerOpen] = useState<boolean>(false);

  const [projectSubfoldersMap, setProjectSubfoldersMap] = useState<
    Record<string, string[]>
  >({});
  const [activeProject, setActiveProject] = useState<string>("");
  const [currentSubpath, setCurrentSubpath] = useState<string | undefined>(undefined);

  const [projectContents, setProjectContents] = useState<ProjectFolder[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string>("");

  // Mode Split-View (Deuxième projet simultané)
  const [isSplitViewActive, setIsSplitViewActive] = useState<boolean>(false);
  const [secondaryProject, setSecondaryProject] = useState<string>("");
  const [secondarySubpath, setSecondarySubpath] = useState<string | undefined>(undefined);
  const [secondaryContents, setSecondaryContents] = useState<ProjectFolder[]>([]);
  const [selectedSecondaryEntryId, setSelectedSecondaryEntryId] = useState<string>("");

  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [isInboxDrawerOpen, setIsInboxDrawerOpen] = useState<boolean>(false);

  const [isTreeOpen, setIsTreeOpen] = useState<boolean>(
    APP_CONFIG.defaults.treePanelOpen
  );
  const [treeSize] = useState<TreePanelSize>(
    APP_CONFIG.defaults.treePanelSize
  );
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
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

  /**
   * Charge le contenu d'un projet (et d'un sous-dossier éventuel) depuis Rust.
   */
  /**
   * Charge le contenu d'un projet (et d'un sous-dossier éventuel) depuis Rust.
   */
  const loadProjectFolder = useCallback(
    async (projectName: string, subpath?: string) => {
      if (!projectName) {
        setProjectContents([]);
        setSelectedEntryId("");
        return;
      }

      try {
        const contents = await readProjectContents(projectName, subpath);
        setProjectContents(contents);

        // Si on lit la racine du projet, on met aussi à jour les sous-dossiers pour l'arbre et l'Inbox
        if (!subpath) {
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
          setSelectedEntryId(first.chemin_relatif || first.nom);
        } else {
          setSelectedEntryId("");
        }
      } catch (err) {
        console.error("Erreur lors de la lecture du projet :", err);
        setProjectContents([]);
      }
    },
    []
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

      try {
        const contents = await readProjectContents(projectName, subpath);
        setSecondaryContents(contents);
        if (contents.length > 0) {
          const first = contents[0];
          setSelectedSecondaryEntryId(first.chemin_relatif || first.nom);
        } else {
          setSelectedSecondaryEntryId("");
        }
      } catch (err) {
        console.error("Erreur lors de la lecture du second projet :", err);
        setSecondaryContents([]);
        setSelectedSecondaryEntryId("");
      }
    },
    []
  );

  /**
   * Charge la liste des projets depuis `projects/` et précharge leurs sous-dossiers racines.
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
          setProjectContents([]);
          setSecondaryProject("");
          setSecondaryContents([]);
          return;
        }

        // Précharger les sous-dossiers de chaque projet pour le TreePanel et le sélecteur Inbox
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

        const targetProject =
          preferredProject && list.includes(preferredProject)
            ? preferredProject
            : activeProject && list.includes(activeProject)
            ? activeProject
            : list[0];

        setActiveProject(targetProject);
        setExpandedProjects((prev) =>
          prev.includes(targetProject) ? prev : [...prev, targetProject]
        );

        // Sélection intelligente du second projet pour le Split-View
        const defaultSecondary =
          list.find((p) => p !== targetProject) || list[0] || "";
        setSecondaryProject((prev) => {
          if (prev && list.includes(prev) && prev !== targetProject) {
            return prev;
          }
          return defaultSecondary;
        });

        await loadProjectFolder(targetProject, preferredSubpath);
        setNavHistory((prev) => {
          if (prev.length === 0) {
            return [{ project: targetProject, subpath: preferredSubpath }];
          }
          return prev;
        });
        setHistoryIndex((prev) => (prev === -1 ? 0 : prev));
      } catch (err) {
        console.error("Erreur lors du chargement des projets :", err);
      }
    },
    [activeProject, loadProjectFolder]
  );

  /**
   * Initialisation au montage de l'écran Explorer.
   */
  useEffect(() => {
    void refreshInbox();
    void refreshProjects();
    void refreshTrash();
  }, [refreshInbox, refreshProjects, refreshTrash]);

  /**
   * Construction des noeuds de l'arbre latéral gauche (`TreePanel`).
   */
  const treeNodes: ProjectTreeNode[] = useMemo(() => {
    return projects.map((projName) => ({
      name: projName,
      children: projectSubfoldersMap[projName] ?? [],
    }));
  }, [projects, projectSubfoldersMap]);

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
   * Bascule du mode Split-View (1 projet vs 2 projets simultanés).
   */
  const handleToggleSplitView = (active: boolean) => {
    setIsSplitViewActive(active);
    if (active) {
      const projToLoad =
        secondaryProject ||
        projects.find((p) => p !== activeProject) ||
        projects[0] ||
        "";
      if (projToLoad) {
        setSecondaryProject(projToLoad);
        void loadSecondaryProjectFolder(projToLoad, secondarySubpath);
      }
    }
  };

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
   */
  const navigateTo = useCallback(
    (projectName: string, subpath?: string, replace = false) => {
      if (!projectName) return;
      setActiveProject(projectName);
      setCurrentSubpath(subpath);
      setExpandedProjects((prev) =>
        prev.includes(projectName) ? prev : [...prev, projectName]
      );
      void loadProjectFolder(projectName, subpath);

      setNavHistory((prev) => {
        const current = prev[historyIndex];
        if (
          current &&
          current.project === projectName &&
          current.subpath === subpath
        ) {
          return prev;
        }

        if (replace || historyIndex === -1) {
          return [{ project: projectName, subpath }];
        }

        const next = [
          ...prev.slice(0, historyIndex + 1),
          { project: projectName, subpath },
        ];
        return next;
      });

      if (replace || historyIndex === -1) {
        setHistoryIndex(0);
      } else {
        setHistoryIndex((prev) => prev + 1);
      }
    },
    [historyIndex, loadProjectFolder]
  );

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex >= 0 && historyIndex < navHistory.length - 1;

  const handleGoBack = useCallback(() => {
    if (!canGoBack) return;
    const targetIdx = historyIndex - 1;
    const target = navHistory[targetIdx];
    if (target) {
      setHistoryIndex(targetIdx);
      setActiveProject(target.project);
      setCurrentSubpath(target.subpath);
      void loadProjectFolder(target.project, target.subpath);
    }
  }, [canGoBack, historyIndex, navHistory, loadProjectFolder]);

  const handleGoForward = useCallback(() => {
    if (!canGoForward) return;
    const targetIdx = historyIndex + 1;
    const target = navHistory[targetIdx];
    if (target) {
      setHistoryIndex(targetIdx);
      setActiveProject(target.project);
      setCurrentSubpath(target.subpath);
      void loadProjectFolder(target.project, target.subpath);
    }
  }, [canGoForward, historyIndex, navHistory, loadProjectFolder]);

  /**
   * Sélection d'un projet depuis la Topbar.
   */
  const handleSelectProject = (projectName: string) => {
    navigateTo(projectName, undefined);

    // Si le second projet est identique, on bascule le second sur un autre si possible
    if (secondaryProject === projectName) {
      const other = projects.find((p) => p !== projectName);
      if (other) {
        setSecondaryProject(other);
        setSecondarySubpath(undefined);
        void loadSecondaryProjectFolder(other, undefined);
      }
    }
  };

  /**
   * Sélection d'un projet ou d'un sous-dossier depuis le `TreePanel`.
   */
  const handleSelectFolderFromTree = (
    projectName: string,
    folderName?: string
  ) => {
    navigateTo(projectName, folderName);
  };

  /**
   * Clic simple sur une tuile de la grille principale : met en surbrillance.
   */
  const handleSelectGridEntry = (entry: GridEntry) => {
    setSelectedEntryId(entry.id);
  };

  /**
   * Double-clic sur un dossier de la grille : entre dans ce sous-dossier.
   */
  const handleOpenFolderEntry = (entry: GridEntry) => {
    if (!activeProject || !entry.isFolder) return;
    navigateTo(activeProject, entry.id);
  };

  /**
   * Navigation via le fil d'Ariane (Breadcrumb) du panneau principal.
   */
  const handleNavigateBreadcrumb = (targetSubpath?: string) => {
    if (!activeProject) return;
    navigateTo(activeProject, targetSubpath);
  };

  /**
   * Double-clic sur un fichier de la grille : ouverture dans l'application par défaut de Windows.
   */
  const handleOpenFileEntry = async (entry: GridEntry) => {
    if (!activeProject || entry.isFolder) return;
    try {
      await openFileInSystem(activeProject, entry.id);
    } catch (err: unknown) {
      const errorMsg = typeof err === "string" ? err : String(err);
      console.error(
        `[Explorer] Erreur lors de l'ouverture du fichier '${entry.label}' :`,
        errorMsg
      );
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
   * Double-clic sur un fichier du second volet : ouverture dans le système hôte.
   */
  const handleOpenSecondaryFileEntry = async (entry: GridEntry) => {
    if (!secondaryProject || entry.isFolder) return;
    try {
      await openFileInSystem(secondaryProject, entry.id);
    } catch (err: unknown) {
      const errorMsg = typeof err === "string" ? err : String(err);
      console.error(
        `[Explorer] Erreur ouverture fichier second volet '${entry.label}' :`,
        errorMsg
      );
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

  const handleToggleProjectExpand = (projectName: string) => {
    setExpandedProjects((prev) =>
      prev.includes(projectName)
        ? prev.filter((p) => p !== projectName)
        : [...prev, projectName]
    );
  };

  const handleRefreshAll = () => {
    void refreshInbox();
    void refreshProjects(activeProject, currentSubpath);
  };

  const handleGoHome = () => {
    if (!activeProject) return;
    navigateTo(activeProject, undefined);
  };

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
   * Copier l'élément ciblé vers le presse-papier virtuel.
   */
  const handleCopy = () => {
    if (!contextMenu?.targetEntry) return;
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
    if (!contextMenu?.targetEntry) return;
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
    if (!entry || !proj) return;

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
   * Début du glisser-déposer d'un fichier ou sous-dossier.
   */
  const handleDragStart = (
    e: React.DragEvent,
    entry: GridEntry,
    project: string
  ) => {
    const payload = JSON.stringify({
      project,
      subpath: entry.id,
      isFolder: entry.isFolder,
      label: entry.label,
    });
    e.dataTransfer.setData("application/json", payload);
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "move";
  };

  /**
   * Dépôt d'un élément sur une tuile dossier.
   */
  const handleDropOnFolder = async (
    e: React.DragEvent,
    targetFolderEntry: GridEntry,
    targetProject: string
  ) => {
    e.preventDefault();
    const raw =
      e.dataTransfer.getData("application/json") ||
      e.dataTransfer.getData("text/plain");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.project === targetProject && data.subpath === targetFolderEntry.id) {
        return;
      }
      // targetFolderEntry.id est le dossier cible, on y ajoute le nom de l'élément
      const destSubpath = `${targetFolderEntry.id}/${data.label}`;
      await moveItem(data.project, data.subpath, targetProject, destSubpath);
      await loadProjectFolder(activeProject, currentSubpath);
      if (isSplitViewActive && secondaryProject) {
        await loadSecondaryProjectFolder(secondaryProject, secondarySubpath);
      }
    } catch (err) {
      console.error("Erreur glisser-déposer sur dossier :", err);
    }
  };

  /**
   * Dépôt d'un élément sur un segment du fil d'Ariane (Breadcrumb).
   */
  const handleDropOnBreadcrumb = async (
    e: React.DragEvent,
    targetSubpath: string | undefined,
    targetProject: string
  ) => {
    e.preventDefault();
    const raw =
      e.dataTransfer.getData("application/json") ||
      e.dataTransfer.getData("text/plain");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      // targetSubpath est le sous-chemin du dossier parent (ou undefined pour la racine du projet)
      const destSubpath = targetSubpath
        ? `${targetSubpath}/${data.label}`
        : data.label;
      if (data.project === targetProject && data.subpath === destSubpath) {
        return;
      }
      await moveItem(data.project, data.subpath, targetProject, destSubpath);
      await loadProjectFolder(activeProject, currentSubpath);
      if (isSplitViewActive && secondaryProject) {
        await loadSecondaryProjectFolder(secondaryProject, secondarySubpath);
      }
    } catch (err) {
      console.error("Erreur glisser-déposer sur fil d'Ariane :", err);
    }
  };

  /**
   * Dépôt direct d'un élément dans la corbeille (barre latérale droite).
   */
  const handleDropOnTrash = async (e: React.DragEvent) => {
    e.preventDefault();
    const raw =
      e.dataTransfer.getData("application/json") ||
      e.dataTransfer.getData("text/plain");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      await moveToTrash(data.project, data.subpath);
      await refreshTrash();
      await loadProjectFolder(activeProject, currentSubpath);
      if (isSplitViewActive && secondaryProject) {
        await loadSecondaryProjectFolder(secondaryProject, secondarySubpath);
      }
    } catch (err) {
      console.error("Erreur glisser-déposer vers la corbeille :", err);
    }
  };

  return (
    <div className="explorer-screen">
      <Topbar
        pinnedProjects={pinnedProjects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        isTreeOpen={isTreeOpen}
        onToggleTree={() => setIsTreeOpen((prev) => !prev)}
        inboxCount={inboxItems.length}
        onOpenInbox={() => setIsInboxDrawerOpen((prev) => !prev)}
        onOpenProjectManager={() => setIsShortcutsOpen((prev) => !prev)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onGoHome={handleGoHome}
        onRefresh={handleRefreshAll}
        canGoBack={canGoBack}
        onGoBack={handleGoBack}
        canGoForward={canGoForward}
        onGoForward={handleGoForward}
      />

      {/* Panneau contextuel de raccourcis ancré sous le bouton (+) */}
      <ShortcutsPanel
        isOpen={isShortcutsOpen}
        projects={projects}
        pinnedProjects={pinnedProjects}
        onTogglePinProject={handleTogglePinProject}
        onCreateProject={handleCreateProject}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <main className="explorer-screen__body">
        <TreePanel
          isOpen={isTreeOpen}
          size={treeSize}
          projects={treeNodes}
          expandedProjects={expandedProjects}
          onToggleProjectExpand={handleToggleProjectExpand}
          activeProject={activeProject}
          activeFolder={currentSubpath || selectedEntryId}
          onSelectFolder={handleSelectFolderFromTree}
          isSplitViewActive={isSplitViewActive}
          onToggleSplitView={handleToggleSplitView}
        />

        <GridView
          hasActiveProject={Boolean(activeProject)}
          activeProject={activeProject}
          currentPathLabel={currentSubpath}
          onNavigateBreadcrumb={handleNavigateBreadcrumb}
          entries={primaryGridEntries}
          selectedEntryId={selectedEntryId}
          onSelectEntry={handleSelectGridEntry}
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
    </div>
  );
};
