import React, { useState, useMemo } from "react";
import { APP_CONFIG, TreePanelSize } from "../../theme/config";
import { Topbar } from "./components/Topbar/Topbar";
import { TreePanel, ProjectTreeNode } from "./components/TreePanel/TreePanel";
import { GridView, GridEntry } from "./components/GridView/GridView";
import { EcosystemSidebar } from "./components/EcosystemSidebar/EcosystemSidebar";
import "./Explorer.css";

/**
 * Données de maquette statiques (Étape 1 — aucun accès direct au disque).
 * Sera remplacé par les appels Tauri invoke() vers la couche Rust à l'Étape 2.
 */
const MOCK_PINNED_PROJECTS = ["LunarMood", "Chr0nosVers", "Vesper"];

const MOCK_PROJECT_TREE: ProjectTreeNode[] = [
  {
    name: "LunarMood",
    children: ["01-Assets", "02-Docs", "03-Features", "04-Sessions", "05-Archives"],
  },
  {
    name: "Chr0nosVers",
    children: ["01-Assets", "02-Docs", "03-Features", "04-Sessions", "05-Archives"],
  },
  {
    name: "Vesper",
    children: ["01-Assets", "02-Docs", "03-Features"],
  },
  {
    name: "Symbiose",
    children: ["01-Assets", "02-Docs"],
  },
];

const MOCK_PRIMARY_ENTRIES: GridEntry[] = [
  { id: "01-Assets", label: "01-Assets", kind: "folder" },
  { id: "03-Features", label: "03-Features", kind: "folder" },
  { id: "05-Archives", label: "05-Archives", kind: "folder" },
  { id: "02-Docs", label: "02-Docs", kind: "folder" },
  { id: "04-Sessions", label: "04-Sessions", kind: "folder" },
];

const MOCK_SUB_ENTRIES: Record<string, GridEntry[]> = {
  "01-Assets": [
    { id: "v1", label: "V1", kind: "folder" },
    { id: "v2", label: "V2", kind: "folder" },
    { id: "maquette-sombre", label: "Maquette Sombre", kind: "image" },
    { id: "maquette-clair", label: "Maquette Clair", kind: "image" },
  ],
  "02-Docs": [
    { id: "arch", label: "architecture.md", kind: "file" },
    { id: "gov", label: "governance.md", kind: "file" },
  ],
};

export const Explorer: React.FC = () => {
  const [activeProject, setActiveProject] = useState<string>("LunarMood");
  const [isTreeOpen, setIsTreeOpen] = useState<boolean>(APP_CONFIG.defaults.treePanelOpen);
  const [treeSize, setTreeSize] = useState<TreePanelSize>(APP_CONFIG.defaults.treePanelSize);
  const [expandedProjects, setExpandedProjects] = useState<string[]>(["Chr0nosVers"]);
  const [selectedEntryId, setSelectedEntryId] = useState<string>("01-Assets");
  const [selectedSubEntryId, setSelectedSubEntryId] = useState<string>("");
  const [isPreviewDrawerOpen, setIsPreviewDrawerOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [inboxCount] = useState<number>(APP_CONFIG.defaults.inboxPendingCount);

  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return MOCK_PRIMARY_ENTRIES;
    return MOCK_PRIMARY_ENTRIES.filter((entry) =>
      entry.label.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const currentSubEntries = useMemo(() => {
    return MOCK_SUB_ENTRIES[selectedEntryId] ?? [];
  }, [selectedEntryId]);

  const handleToggleProjectExpand = (projectName: string) => {
    setExpandedProjects((prev) =>
      prev.includes(projectName)
        ? prev.filter((p) => p !== projectName)
        : [...prev, projectName]
    );
  };

  const handleSelectFolderFromTree = (projectName: string, folderName?: string) => {
    setActiveProject(projectName);
    if (folderName) {
      setSelectedEntryId(folderName);
      setIsPreviewDrawerOpen(true);
    }
  };

  const handleToggleTreeSize = () => {
    setTreeSize((prev) => (prev === "compact" ? "large" : "compact"));
  };

  return (
    <div className="explorer-screen">
      <Topbar
        pinnedProjects={MOCK_PINNED_PROJECTS}
        activeProject={activeProject}
        onSelectProject={setActiveProject}
        isTreeOpen={isTreeOpen}
        onToggleTree={() => setIsTreeOpen((prev) => !prev)}
        inboxCount={inboxCount}
        onOpenInbox={() => {
          /* Sera branché sur l'Inbox Rust à l'Étape 2 */
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onGoHome={() => setSelectedEntryId("01-Assets")}
        onRefresh={() => {
          /* Sera branché sur Rust à l'Étape 2 */
        }}
      />

      <main className="explorer-screen__body">
        <TreePanel
          isOpen={isTreeOpen}
          size={treeSize}
          onToggleSize={handleToggleTreeSize}
          projects={MOCK_PROJECT_TREE}
          expandedProjects={expandedProjects}
          onToggleProjectExpand={handleToggleProjectExpand}
          activeProject={activeProject}
          activeFolder={selectedEntryId}
          onSelectFolder={handleSelectFolderFromTree}
        />

        <GridView
          entries={filteredEntries}
          selectedEntryId={selectedEntryId}
          onSelectEntry={(id) => {
            setSelectedEntryId(id);
            setIsPreviewDrawerOpen(true);
          }}
          onAddFolderOrFiles={() => {
            /* Sera branché sur l'ingestion Rust à l'Étape 2 */
          }}
          subEntries={currentSubEntries}
          selectedSubEntryId={selectedSubEntryId}
          onSelectSubEntry={setSelectedSubEntryId}
          isPreviewDrawerOpen={isPreviewDrawerOpen}
          onTogglePreviewDrawer={() => setIsPreviewDrawerOpen((prev) => !prev)}
        />

        <EcosystemSidebar />
      </main>
    </div>
  );
};
