import React, { useState, useEffect, useCallback } from 'react';
import { CableRoute, ElectricalComponent, ElectricalComponentType, Floor, PathwayPreference, ProjectData, SwitchboardEnclosure, Wall, WorkflowStep } from './types/cad';
import { DEMO_PROJECT, EMPTY_PROJECT, INITIAL_PROJECT } from './constants/initialProject';
import { Header } from './components/Header';
import { WorkflowStepper } from './components/WorkflowStepper';
import { LeftSidebar } from './components/LeftSidebar';
import { CADCanvas2D } from './components/CADCanvas2D';
import { CADViewer3D } from './components/CADViewer3D';
import { ComponentPropertiesPanel } from './components/ComponentPropertiesPanel';
import { WallPropertiesPanel } from './components/WallPropertiesPanel';
import { SwitchboardDesigner } from './components/SwitchboardDesigner';
import { SchematicViewer } from './components/SchematicViewer';
import { BOMReport } from './components/BOMReport';
import { PDFImportModal } from './components/PDFImportModal';
import { CollaborationModal } from './components/CollaborationModal';
import { collabManager, CollaboratorUser } from './services/collaborationService';
import { ParsedPDFResult } from './services/pdfPlanParser';
import { calculateComponentRoute } from './services/routingService';
import { generateSTNInstallationZones } from './services/installationZonesService';

const STORAGE_KEY = 'elektro_cad_sr_project_v2';
const MAX_HISTORY = 50;

interface HistoryState {
  past: ProjectData[];
  present: ProjectData;
  future: ProjectData[];
}

function getInitialProject(): ProjectData {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.id !== 'proj-demo-1') {
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved project', e);
    }
  }
  return EMPTY_PROJECT; // Začíname s čistou prázdnou scénou!
}

export function App() {
  const [history, setHistory] = useState<HistoryState>(() => ({
    past: [],
    present: getInitialProject(),
    future: [],
  }));

  const project = history.present;

  const [activeView, setActiveView] = useState<'2d' | '3d' | 'schematics' | 'switchboard' | 'bom'>('2d');
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState<WorkflowStep>(1);
  const [activeTool, setActiveTool] = useState<string>('wall'); // Nástroj stena pripravený na kreslenie!
  const [selectedComponentType, setSelectedComponentType] = useState<ElectricalComponentType | undefined>('socket_230');
  const [selectedComponentId, setSelectedComponentId] = useState<string | undefined>(undefined);
  const [selectedWallId, setSelectedWallId] = useState<string | undefined>(undefined);
  const [selectedOpeningId, setSelectedOpeningId] = useState<string | undefined>(undefined);
  const [defaultDoorSize, setDefaultDoorSize] = useState<{ width: number; height: number }>({ width: 0.9, height: 2.0 });
  const [defaultWindowSize, setDefaultWindowSize] = useState<{ width: number; height: number; elevation: number }>({ width: 1.2, height: 1.4, elevation: 0.9 });
  const [defaultWallThickness, setDefaultWallThickness] = useState<number>(0.15); // Predvolená hrúbka steny v metroch (0.15 m = 15 cm)
  const [selectedSwitchboardKind, setSelectedSwitchboardKind] = useState<'main' | 'sub'>('main');
  const [selectedSwitchboardId, setSelectedSwitchboardId] = useState<string | undefined>(undefined);
  const [isCalibratingScale, setIsCalibratingScale] = useState<boolean>(false); // Režim kalibrácie mierky z kóty
  const [isLinkingMode, setIsLinkingMode] = useState<boolean>(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);

  // Multi-device real-time collaboration state
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [roomId, setRoomId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('room');
      if (r && r.trim()) return r.trim().toLowerCase();
    }
    return 'projekt-elektro-1';
  });
  const [collaborators, setCollaborators] = useState<CollaboratorUser[]>([collabManager.getCurrentUser()]);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, { x: number; y: number; floorId: string; user?: CollaboratorUser }>>({});

  // Connect to P2P WebRTC room
  useEffect(() => {
    collabManager.connect(roomId, {
      onProjectSync: (syncedProject) => {
        setHistory((h) => ({
          past: [...h.past.slice(-MAX_HISTORY), h.present],
          present: syncedProject,
          future: [],
        }));
      },
      onFloorSync: (syncedFloor) => {
        setHistory((h) => {
          const exists = h.present.floors.some((f) => f.id === syncedFloor.id);
          const nextFloors = exists
            ? h.present.floors.map((f) => (f.id === syncedFloor.id ? syncedFloor : f))
            : [...h.present.floors, syncedFloor];
          return {
            ...h,
            present: {
              ...h.present,
              floors: nextFloors,
            },
          };
        });
      },
      onPeersChange: (peers) => {
        setCollaborators(peers);
      },
      onRemoteCursor: (peerId, cursor, peer) => {
        setRemoteCursors((prev) => ({
          ...prev,
          [peerId]: {
            ...cursor,
            user: peer,
          },
        }));
      },
      getCurrentProject: () => history.present,
    });

    return () => {
      collabManager.disconnect();
    };
  }, [roomId]);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  }, [project]);

  // Central history-aware project updater
  const updateProject = useCallback(
    (updater: (prev: ProjectData) => ProjectData, recordHistory = true) => {
      setHistory((h) => {
        const nextPresent = updater(h.present);
        if (nextPresent === h.present) return h;
        if (!recordHistory) {
          return {
            ...h,
            present: nextPresent,
          };
        }
        return {
          past: [...h.past.slice(-MAX_HISTORY), h.present],
          present: nextPresent,
          future: [],
        };
      });
    },
    []
  );

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      const newPast = h.past.slice(0, h.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [h.present, ...h.future.slice(0, MAX_HISTORY)],
      };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      const newFuture = h.future.slice(1);
      return {
        past: [...h.past.slice(-MAX_HISTORY), h.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // Current floor
  const currentFloor = project.floors.find((f) => f.id === project.currentFloorId) || project.floors[0];

  const handleUpdateCurrentFloor = useCallback(
    (updater: (prev: Floor) => Floor, recordHistory = true) => {
      updateProject((prev) => {
        const floorToUpdate = prev.floors.find((f) => f.id === prev.currentFloorId) || prev.floors[0];
        const nextFloor = updater(floorToUpdate);
        if (recordHistory) {
          collabManager.broadcastFloor(nextFloor);
        }
        return {
          ...prev,
          floors: prev.floors.map((f) => (f.id === floorToUpdate.id ? nextFloor : f)),
        };
      }, recordHistory);
    },
    [updateProject]
  );

  const handleGenerateInstallationZones = useCallback(() => {
    handleUpdateCurrentFloor((prev) => ({
      ...prev,
      installationZones: generateSTNInstallationZones(prev),
    }));
  }, [handleUpdateCurrentFloor]);

  const handleClearInstallationZones = useCallback(() => {
    handleUpdateCurrentFloor((prev) => ({
      ...prev,
      installationZones: [],
    }));
  }, [handleUpdateCurrentFloor]);

  // Switch tools and presets when advancing through workflow steps 1 to 9
  const handleSelectStep = (step: WorkflowStep) => {
    setCurrentWorkflowStep(step);
    if (activeView !== '2d' && activeView !== '3d') {
      setActiveView('2d');
    }
    switch (step) {
      case 1:
        setActiveTool('wall');
        setIsLinkingMode(false);
        break;
      case 2:
        setActiveTool('door');
        setIsLinkingMode(false);
        break;
      case 3:
        setActiveTool('select');
        setIsLinkingMode(false);
        // Ak ešte nie sú vygenerované zóny, automaticky ich vygenerujeme pri vstupe do kroku 3
        handleUpdateCurrentFloor((prev) => {
          if (!prev.installationZones || prev.installationZones.length === 0) {
            return {
              ...prev,
              installationZones: generateSTNInstallationZones(prev),
            };
          }
          return prev;
        });
        break;
      case 4:
        setActiveTool('component');
        setSelectedComponentType('switchboard');
        setIsLinkingMode(false);
        break;
      case 5:
        setActiveTool('component');
        setSelectedComponentType('light_ceiling');
        setIsLinkingMode(false);
        break;
      case 6:
        setActiveTool('component');
        setSelectedComponentType('socket_230');
        setIsLinkingMode(false);
        break;
      case 7:
        setActiveTool('component');
        setSelectedComponentType('electric_heating');
        setIsLinkingMode(false);
        break;
      case 8:
        setActiveTool('select');
        setIsLinkingMode(true);
        break;
      case 9:
        setActiveTool('select');
        setIsLinkingMode(false);
        break;
    }
  };

  const handleUpdateFloorHeight = (height: number) => {
    handleUpdateCurrentFloor((prev) => ({
      ...prev,
      height,
      walls: prev.walls.map((w) => ({ ...w, height })),
    }));
  };

  const handleAddFloor = () => {
    const newLevel = project.floors.length;
    const newFloorId = `floor-${Date.now()}`;
    const newFloor: Floor = {
      id: newFloorId,
      name: `${newLevel + 1}. NP (Poschodie)`,
      level: newLevel,
      height: 2.70,
      walls: [],
      rooms: [],
      components: [],
      routes: [],
      switchboards: [
        {
          id: `sb-rp-${Date.now()}`,
          name: `Podružný rozvádzač RP${newLevel} (${newLevel + 1}.NP)`,
          type: 'Legrand Practibox S 24M pod omietku',
          floorId: newFloorId,
          position: { x: 1.2, y: 1.0, z: 1.5 },
          rowsCount: 2,
          modulesPerRow: 12,
          totalModules: 24,
          modules: [
            { id: `m-main-${Date.now()}`, type: 'main_switch', name: 'Hlavný vypínač 25A', widthDIN: 3, rating: '25A / 3P', brand: 'Legrand', modelCode: '406439' },
            { id: `m-spd-${Date.now()}`, type: 'spd', name: 'Zvodič prepätia T2', widthDIN: 4, rating: '20kA / 4P', brand: 'Legrand', modelCode: '412224' },
            { id: `m-rcd-${Date.now()}`, type: 'rcd', name: 'RCD Chránič', widthDIN: 4, rating: '40A / 30mA typ A', brand: 'Legrand', modelCode: '411505' },
            { id: `m-mcb1-${Date.now()}`, type: 'mcb', name: 'Svetlá poschodie', widthDIN: 1, rating: 'B10A / 1P', brand: 'Legrand', modelCode: '403356' },
            { id: `m-mcb2-${Date.now()}`, type: 'mcb', name: 'Zásuvky poschodie', widthDIN: 1, rating: 'B16A / 1P', brand: 'Legrand', modelCode: '403358' },
          ],
        },
      ],
    };

    updateProject((prev) => {
      const next = {
        ...prev,
        floors: [...prev.floors, newFloor],
        currentFloorId: newFloor.id,
      };
      collabManager.broadcastProject(next);
      return next;
    });
  };

  const selectedComponent = currentFloor.components.find((c) => c.id === selectedComponentId);
  const selectedWall = currentFloor.walls.find((w) => w.id === selectedWallId);
  const activeSwitchboard = currentFloor.switchboards.find((sb) => sb.id === selectedSwitchboardId) || currentFloor.switchboards[0];
  const switchboard = activeSwitchboard || currentFloor.switchboards[0];

  const handleUpdateComponent = (updated: ElectricalComponent) => {
    handleUpdateCurrentFloor((prev) => {
      const nextComponents = prev.components.map((c) => (c.id === updated.id ? updated : c));
      let nextSwitchboards = prev.switchboards;
      if (updated.type === 'switchboard') {
        const matchingIndex = prev.switchboards.findIndex(
          (sb) =>
            sb.id === updated.id ||
            sb.name === updated.label ||
            (sb.name.includes('RH') && (updated.switchboardKind === 'main' || updated.label.includes('RH')))
        );
        if (matchingIndex !== -1) {
          nextSwitchboards = prev.switchboards.map((sb, idx) =>
            idx === matchingIndex
              ? {
                  ...sb,
                  position: { x: updated.position.x, y: updated.position.y, z: updated.position.z },
                  name: updated.label || sb.name,
                }
              : sb
          );
        }
      }
      return {
        ...prev,
        components: nextComponents,
        switchboards: nextSwitchboards,
      };
    });
  };

  const handleDeleteComponent = useCallback((id: string) => {
    handleUpdateCurrentFloor((prev) => ({
      ...prev,
      components: prev.components.filter((c) => c.id !== id),
      routes: prev.routes.filter((r) => r.sourceComponentId !== id && r.targetComponentId !== id),
    }));
    setSelectedComponentId((curr) => (curr === id ? undefined : curr));
  }, [handleUpdateCurrentFloor]);

  const handleUpdateWall = (updated: Wall) => {
    handleUpdateCurrentFloor((prev) => ({
      ...prev,
      walls: prev.walls.map((w) => (w.id === updated.id ? updated : w)),
    }));
  };

  const handleDeleteWall = useCallback((id: string) => {
    handleUpdateCurrentFloor((prev) => ({
      ...prev,
      walls: prev.walls.filter((w) => w.id !== id),
      components: prev.components.map((c) => (c.wallId === id ? { ...c, wallId: undefined } : c)),
    }));
    setSelectedWallId((curr) => (curr === id ? undefined : curr));
  }, [handleUpdateCurrentFloor]);

  const handleUpdateSwitchboard = (updater: (prev: SwitchboardEnclosure) => SwitchboardEnclosure) => {
    handleUpdateCurrentFloor((prev) => ({
      ...prev,
      switchboards: prev.switchboards.map((sb) =>
        sb.id === (activeSwitchboard?.id || prev.switchboards[0]?.id) ? updater(sb) : sb
      ),
    }));
  };

  // Keyboard shortcuts: Delete/Backspace to delete selected; Ctrl+Z to Undo; Ctrl+Y or Ctrl+Shift+Z to Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable);

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (isInput) return;
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      // Redo: Ctrl+Y or Cmd+Y
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        if (isInput) return;
        e.preventDefault();
        handleRedo();
        return;
      }

      // Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isInput) return; // Do not delete canvas elements when editing input fields!
        if (selectedOpeningId && selectedWallId) {
          e.preventDefault();
          const targetWall = currentFloor.walls.find((w) => w.id === selectedWallId);
          if (targetWall) {
            handleUpdateWall({
              ...targetWall,
              openings: targetWall.openings.filter((o) => o.id !== selectedOpeningId),
            });
            setSelectedOpeningId(undefined);
            return;
          }
        }
        if (selectedWallId) {
          e.preventDefault();
          handleDeleteWall(selectedWallId);
        } else if (selectedComponentId) {
          e.preventDefault();
          handleDeleteComponent(selectedComponentId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWallId, selectedOpeningId, selectedComponentId, handleDeleteWall, handleDeleteComponent, handleUpdateWall, handleUndo, handleRedo, currentFloor.walls]);

  // Clean up selected IDs if undone/redone away
  useEffect(() => {
    if (selectedWallId && !currentFloor.walls.some((w) => w.id === selectedWallId)) {
      setSelectedWallId(undefined);
    }
  }, [currentFloor.walls, selectedWallId]);

  useEffect(() => {
    if (selectedComponentId && !currentFloor.components.some((c) => c.id === selectedComponentId)) {
      setSelectedComponentId(undefined);
    }
  }, [currentFloor.components, selectedComponentId]);

  // Export & Import project JSON
  const handleExportProject = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `${project.name.replace(/\s+/g, '_')}.ele`);
    dlAnchorElem.click();
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        updateProject(() => parsed);
        collabManager.broadcastProject(parsed);
        setSelectedComponentId(undefined);
        setSelectedWallId(undefined);
      } catch (err) {
        alert('Chyba pri načítaní súboru projektu!');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDemo = () => {
    if (confirm('Chcete načítať vzorový dom pre tutoriál?')) {
      updateProject(() => DEMO_PROJECT);
      collabManager.broadcastProject(DEMO_PROJECT);
      setSelectedComponentId('comp-kitchen-counter');
      setSelectedWallId(undefined);
    }
  };

  const handleNewCleanProject = () => {
    if (confirm('Chcete začať nový čistý projekt s prázdnou scénou?')) {
      updateProject(() => EMPTY_PROJECT);
      collabManager.broadcastProject(EMPTY_PROJECT);
      setSelectedComponentId(undefined);
      setSelectedWallId(undefined);
    }
  };

  const handleJoinRoom = (newRoomId: string) => {
    setRoomId(newRoomId.trim().toLowerCase());
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.set('room', newRoomId.trim().toLowerCase());
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleCollabImportProject = (imported: ProjectData) => {
    updateProject(() => imported);
    collabManager.broadcastProject(imported);
    setSelectedComponentId(undefined);
    setSelectedWallId(undefined);
  };

  const handleApplyParsedFloor = (
    parsedResult: ParsedPDFResult,
    keepUnderlay: boolean,
    underlayOpacity: number
  ) => {
    handleUpdateCurrentFloor((prev) => ({
      ...prev,
      walls: parsedResult.walls.length > 0 ? parsedResult.walls : prev.walls,
      blueprintUnderlay: keepUnderlay
        ? {
            imageUrl: parsedResult.blueprintImageDataUrl,
            opacity: underlayOpacity,
            widthMeters: Number((parsedResult.pageWidth * parsedResult.scaleMetersPerUnit).toFixed(2)),
            heightMeters: Number((parsedResult.pageHeight * parsedResult.scaleMetersPerUnit).toFixed(2)),
            x: 0,
            y: 0,
            scaleMultiplier: 1.0,
            isCalibrated: false,
          }
        : undefined,
    }));
    setActiveView('2d');
  };

  const handleTriggerAutoRouteAll = () => {
    const sb = currentFloor.switchboards[0];
    if (!sb) {
      alert('Najskôr umiestnite rozvádzač na stenu v Kroku 3!');
      return;
    }

    handleUpdateCurrentFloor((prev) => {
      const newRoutes: CableRoute[] = prev.components
        .filter((c) => c.type !== 'switchboard')
        .map((comp) => {
          const calc = calculateComponentRoute(comp, sb, prev.height, comp.pathwayPreference);
          return {
            ...calc.route,
            id: `route-${comp.id}`,
            circuitId: comp.circuitId || 'S1',
          };
        });

      return {
        ...prev,
        routes: newRoutes,
      };
    });
  };

  const handleCalibrateUnderlayWithWall = (wall: Wall, targetLen: number, rescaleAll: boolean = true) => {
    if (targetLen <= 0.1) return;
    const currentLen = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
    if (currentLen <= 0.05) return;

    const factor = targetLen / currentLen;
    const anchor = wall.start;

    handleUpdateCurrentFloor((prev) => {
      if (!prev.blueprintUnderlay) return prev;

      const oldUnderlay = prev.blueprintUnderlay;
      const oldUx = oldUnderlay.x || 0;
      const oldUy = oldUnderlay.y || 0;

      const newWidth = Number((oldUnderlay.widthMeters * factor).toFixed(3));
      const newHeight = Number((oldUnderlay.heightMeters * factor).toFixed(3));
      const newUx = Number((anchor.x + (oldUx - anchor.x) * factor).toFixed(3));
      const newUy = Number((anchor.y + (oldUy - anchor.y) * factor).toFixed(3));

      const newWalls = prev.walls.map((w) => {
        if (w.id === wall.id) {
          return {
            ...w,
            end: {
              x: Number((w.start.x + (w.end.x - w.start.x) * factor).toFixed(2)),
              y: Number((w.start.y + (w.end.y - w.start.y) * factor).toFixed(2)),
            },
          };
        } else if (rescaleAll) {
          return {
            ...w,
            start: {
              x: Number((anchor.x + (w.start.x - anchor.x) * factor).toFixed(2)),
              y: Number((anchor.y + (w.start.y - anchor.y) * factor).toFixed(2)),
            },
            end: {
              x: Number((anchor.x + (w.end.x - anchor.x) * factor).toFixed(2)),
              y: Number((anchor.y + (w.end.y - anchor.y) * factor).toFixed(2)),
            },
          };
        }
        return w;
      });

      const newComponents = rescaleAll
        ? prev.components.map((c) => ({
            ...c,
            position: {
              ...c.position,
              x: Number((anchor.x + (c.position.x - anchor.x) * factor).toFixed(2)),
              y: Number((anchor.y + (c.position.y - anchor.y) * factor).toFixed(2)),
            },
          }))
        : prev.components;

      return {
        ...prev,
        blueprintUnderlay: {
          ...oldUnderlay,
          widthMeters: newWidth,
          heightMeters: newHeight,
          x: newUx,
          y: newUy,
          scaleMultiplier: (oldUnderlay.scaleMultiplier || 1.0) * factor,
          isCalibrated: true,
          referenceWallLength: targetLen,
        },
        walls: newWalls,
        components: newComponents,
      };
    });
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Application Header */}
      <Header
        project={project}
        activeView={activeView}
        setActiveView={setActiveView}
        currentFloor={currentFloor}
        onChangeFloor={(id) => updateProject((prev) => ({ ...prev, currentFloorId: id }), false)}
        onAddFloor={handleAddFloor}
        onUpdateFloorHeight={handleUpdateFloorHeight}
        defaultPathway={project.globalDefaultPathway}
        onChangeDefaultPathway={(pw) => updateProject((prev) => ({ ...prev, globalDefaultPathway: pw }))}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExportProject={handleExportProject}
        onImportProject={handleImportProject}
        onResetToDemo={handleResetToDemo}
        onNewCleanProject={handleNewCleanProject}
        onOpenPDFImport={() => setIsPDFModalOpen(true)}
        onOpenCollaboration={() => setIsCollabModalOpen(true)}
        collaboratorCount={collaborators.length}
      />

      {/* 8-Step Workflow Stepper Bar (visible in 2D and 3D modes) */}
      {(activeView === '2d' || activeView === '3d') && (
        <WorkflowStepper
          currentStep={currentWorkflowStep}
          onSelectStep={handleSelectStep}
          floor={currentFloor}
        />
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Toolbar (only visible in 2D / 3D design modes) */}
        {(activeView === '2d' || activeView === '3d') && (
          <LeftSidebar
            currentStep={currentWorkflowStep}
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            selectedComponentType={selectedComponentType}
            onSelectComponentType={setSelectedComponentType}
            isLinkingMode={isLinkingMode}
            onToggleLinkingMode={() => setIsLinkingMode(!isLinkingMode)}
            onTriggerAutoRouteAll={handleTriggerAutoRouteAll}
            defaultWallThickness={defaultWallThickness}
            onChangeDefaultWallThickness={setDefaultWallThickness}
            isCalibratingScale={isCalibratingScale}
            onStartCalibration={() => setIsCalibratingScale((prev) => !prev)}
            hasBlueprintUnderlay={Boolean(currentFloor.blueprintUnderlay)}
            defaultDoorSize={defaultDoorSize}
            onChangeDefaultDoorSize={setDefaultDoorSize}
            defaultWindowSize={defaultWindowSize}
            onChangeDefaultWindowSize={setDefaultWindowSize}
            selectedSwitchboardKind={selectedSwitchboardKind}
            onSelectSwitchboardKind={setSelectedSwitchboardKind}
            onGenerateZones={handleGenerateInstallationZones}
            onClearZones={handleClearInstallationZones}
            zoneCount={currentFloor.installationZones?.length || 0}
          />
        )}

        {/* Central Viewport */}
        <main className="flex-1 h-full relative overflow-hidden">
          {activeView === '2d' && (
            <CADCanvas2D
              floor={currentFloor}
              activeTool={activeTool}
              selectedComponentType={selectedComponentType}
              selectedComponentId={selectedComponentId}
              onSelectComponent={setSelectedComponentId}
              selectedWallId={selectedWallId}
              onSelectWall={(id) => {
                setSelectedWallId(id);
                if (!id) setSelectedOpeningId(undefined);
              }}
              selectedOpeningId={selectedOpeningId}
              onSelectOpening={setSelectedOpeningId}
              defaultDoorSize={defaultDoorSize}
              defaultWindowSize={defaultWindowSize}
              selectedSwitchboardKind={selectedSwitchboardKind}
              onUpdateFloor={handleUpdateCurrentFloor}
              defaultPathway={project.globalDefaultPathway}
              onSwitchTo3D={() => setActiveView('3d')}
              currentStep={currentWorkflowStep}
              isLinkingMode={isLinkingMode}
              onToggleLinkingMode={() => setIsLinkingMode(!isLinkingMode)}
              defaultWallThickness={defaultWallThickness}
              isCalibratingScale={isCalibratingScale}
              onToggleCalibratingScale={setIsCalibratingScale}
              remoteCursors={remoteCursors}
              onCursorMove={(pos) => {
                collabManager.broadcastCursor({ ...pos, floorId: currentFloor.id });
              }}
            />
          )}

          {activeView === '3d' && (
            <CADViewer3D
              floor={currentFloor}
              selectedComponentId={selectedComponentId}
              onSelectComponent={setSelectedComponentId}
              onSwitchTo2D={() => setActiveView('2d')}
            />
          )}

          {(activeView === 'schematics' || activeView === 'switchboard') && currentFloor.switchboards.length > 1 && (
            <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Vyberte rozvádzač:</span>
                <div className="flex items-center gap-1.5">
                  {currentFloor.switchboards.map((sb) => {
                    const isCurrent = (activeSwitchboard?.id || currentFloor.switchboards[0]?.id) === sb.id;
                    const isSub = sb.name.includes('RP');
                    return (
                      <button
                        key={sb.id}
                        onClick={() => setSelectedSwitchboardId(sb.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                          isCurrent
                            ? isSub
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50'
                              : 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-1 ring-red-400/50'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isSub ? 'bg-blue-300' : 'bg-red-300'}`}></span>
                        <span>{sb.name}</span>
                        <span className="text-[10px] opacity-75 font-mono">({sb.totalModules}M)</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeView === 'schematics' && switchboard && (
            <SchematicViewer
              switchboard={switchboard}
              components={currentFloor.components}
              circuits={project.circuits}
            />
          )}

          {activeView === 'switchboard' && switchboard && (
            <SwitchboardDesigner
              switchboard={switchboard}
              onUpdateSwitchboard={handleUpdateSwitchboard}
            />
          )}

          {activeView === 'bom' && (
            <BOMReport
              project={project}
              floor={currentFloor}
              switchboards={currentFloor.switchboards}
            />
          )}
        </main>

        {/* Right Properties Panel: Wall Properties OR Component Properties */}
        {(activeView === '2d' || activeView === '3d') && selectedWall && (
          <WallPropertiesPanel
            wall={selectedWall}
            allWalls={currentFloor.walls}
            floorHeight={currentFloor.height}
            hasBlueprintUnderlay={Boolean(currentFloor.blueprintUnderlay)}
            selectedOpeningId={selectedOpeningId}
            onSelectOpening={setSelectedOpeningId}
            onUpdateWall={handleUpdateWall}
            onDeleteWall={handleDeleteWall}
            onCalibrateUnderlayWithWall={handleCalibrateUnderlayWithWall}
            onClose={() => {
              setSelectedWallId(undefined);
              setSelectedOpeningId(undefined);
            }}
          />
        )}

        {(activeView === '2d' || activeView === '3d') && !selectedWall && selectedComponent && (
          <ComponentPropertiesPanel
            component={selectedComponent}
            floorComponents={currentFloor.components}
            allWalls={currentFloor.walls}
            switchboard={switchboard}
            floorHeight={currentFloor.height}
            circuits={project.circuits}
            onUpdateComponent={handleUpdateComponent}
            onDeleteComponent={handleDeleteComponent}
            onClose={() => setSelectedComponentId(undefined)}
          />
        )}
      </div>

      {/* PDF Floorplan Import Modal */}
      <PDFImportModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        onApplyParsedFloor={handleApplyParsedFloor}
      />

      {/* Real-time Multi-device Collaboration Modal */}
      <CollaborationModal
        isOpen={isCollabModalOpen}
        onClose={() => setIsCollabModalOpen(false)}
        currentRoomId={roomId}
        onJoinRoom={handleJoinRoom}
        collaborators={collaborators}
        projectData={project}
        onImportProject={handleCollabImportProject}
      />
    </div>
  );
}

export default App;
