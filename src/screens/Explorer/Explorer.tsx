import React, { useState, useEffect, useCallback, useMemo } from "react";
import { TileKind } from "../../components/FolderCard/FolderCard";
import {
  createProject,
  getInboxItems,
  InboxItem,
  listProjects,
  moveInboxItem,
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
  }, [refreshInbox, refreshProjects]);

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
   * Sélection d'un projet depuis la Topbar.
   */
  const handleSelectProject = (projectName: string) => {
    setActiveProject(projectName);
    setCurrentSubpath(undefined);
    setExpandedProjects((prev) =>
      prev.includes(projectName) ? prev : [...prev, projectName]
    );
    void loadProjectFolder(projectName, undefined);

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
    setActiveProject(projectName);
    setCurrentSubpath(folderName);
    void loadProjectFolder(projectName, folderName);
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
    setCurrentSubpath(entry.id);
    void loadProjectFolder(activeProject, entry.id);
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
    setCurrentSubpath(undefined);
    void loadProjectFolder(activeProject, undefined);
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
          currentPathLabel={currentSubpath}
          entries={primaryGridEntries}
          selectedEntryId={selectedEntryId}
          onSelectEntry={handleSelectGridEntry}
          onOpenFolderEntry={handleOpenFolderEntry}
          onAddFolderOrFiles={() => setIsInboxDrawerOpen(true)}
          isSplitViewActive={isSplitViewActive}
          projects={projects}
          secondaryProject={secondaryProject}
          onSelectSecondaryProject={handleSelectSecondaryProject}
          secondaryPathLabel={secondarySubpath}
          onResetSecondarySubpath={handleResetSecondarySubpath}
          secondaryEntries={secondaryGridEntries}
          selectedSecondaryEntryId={selectedSecondaryEntryId}
          onSelectSecondaryEntry={(entry) => setSelectedSecondaryEntryId(entry.id)}
          onOpenSecondaryFolderEntry={handleOpenSecondaryFolderEntry}
        />

        <EcosystemSidebar
          isOpen={isRightSidebarOpen}
          onToggle={() => setIsRightSidebarOpen((prev) => !prev)}
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
    </div>
  );
};
