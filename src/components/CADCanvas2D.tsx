import React, { useRef, useState, useEffect } from 'react';
import { ElectricalComponent, ElectricalComponentType, Floor, InstallationZone, InstallationZoneType, Opening, PathwayPreference, Point2D, Point3D, SwitchboardEnclosure, Wall, WorkflowStep } from '../types/cad';
import { getRecommendedHeight, STN_HEIGHT_RECOMMENDATIONS } from '../constants/stnStandards';
import { getDefaultCatalogItem, recommendShellyModule } from '../constants/catalog';
import { renderSTNSymbol } from '../services/schematicService';
import {
  generateSTNInstallationZones,
  toggleKitchenZoneOnWall,
  addVerticalZoneOnWall,
  addBathroomSafetyZone,
  addCeilingCorridor,
  addWallZoneSegment,
  updateInstallationZone,
  deleteInstallationZone,
} from '../services/installationZonesService';
import {
  findWallSnapCandidate,
  resolveAllFloorWallIntersections,
  resolveWallIntersections,
} from '../services/wallIntersectionService';
import { Eye, EyeOff, Box, Compass, Navigation, Magnet, GitFork, Ruler, CheckCircle2, GripHorizontal, Minimize2, ShieldCheck, Sparkles, Columns, BookOpen } from 'lucide-react';

interface CADCanvas2DProps {
  floor: Floor;
  activeTool: string;
  selectedComponentType?: ElectricalComponentType;
  selectedComponentId?: string;
  onSelectComponent: (id?: string) => void;
  selectedWallId?: string;
  onSelectWall: (id?: string) => void;
  onUpdateFloor: (updater: (prev: Floor) => Floor, recordHistory?: boolean) => void;
  defaultPathway: PathwayPreference;
  onSwitchTo3D?: () => void;
  currentStep?: WorkflowStep;
  isLinkingMode?: boolean;
  onToggleLinkingMode?: () => void;
  defaultWallThickness?: number;
  isCalibratingScale?: boolean;
  onToggleCalibratingScale?: (active: boolean) => void;
  selectedOpeningId?: string;
  onSelectOpening?: (id: string | undefined) => void;
  defaultDoorSize?: { width: number; height: number };
  defaultWindowSize?: { width: number; height: number; elevation: number };
  selectedSwitchboardKind?: 'main' | 'sub';
  remoteCursors?: Record<string, { x: number; y: number; floorId: string; user?: any }>;
  onCursorMove?: (pos: Point2D) => void;
  selectedZoneId?: string;
  onSelectZone?: (id: string | undefined) => void;
  onOpenZoneGuide?: () => void;
}

export const CADCanvas2D: React.FC<CADCanvas2DProps> = ({
  floor,
  activeTool,
  selectedComponentType,
  selectedComponentId,
  onSelectComponent,
  selectedWallId,
  onSelectWall,
  onUpdateFloor,
  defaultPathway,
  onSwitchTo3D,
  currentStep = 1,
  isLinkingMode = false,
  onToggleLinkingMode,
  defaultWallThickness = 0.15,
  isCalibratingScale = false,
  onToggleCalibratingScale,
  selectedOpeningId,
  onSelectOpening,
  defaultDoorSize,
  defaultWindowSize,
  selectedSwitchboardKind = 'main',
  remoteCursors,
  onCursorMove,
  selectedZoneId: externalSelectedZoneId,
  onSelectZone,
  onOpenZoneGuide,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom (SolidWorks style)
  const [scale, setScale] = useState(65); // 65 pixels per meter
  const [pan, setPan] = useState({ x: 180, y: 120 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Interactive wall drawing state
  const [wallStart, setWallStart] = useState<Point2D | null>(null);
  const [cursorPos, setCursorPos] = useState<Point2D>({ x: 0, y: 0 });
  const [snappedAngleInfo, setSnappedAngleInfo] = useState<{ angleDeg: number; isOrthogonal: boolean } | null>(null);

  // Interactive wall and vertex drag state (Move whole wall or individual endpoints)
  const [wallDragState, setWallDragState] = useState<{
    wallId: string;
    mode: 'wall' | 'start' | 'end';
    startMouseWorld: Point2D;
    initialStart: Point2D;
    initialEnd: Point2D;
    hasMoved: boolean;
    currentDelta?: { dx: number; dy: number };
  } | null>(null);

  // Interactive opening drag state (slide door/window along wall)
  const [openingDragState, setOpeningDragState] = useState<{
    wallId: string;
    openingId: string;
    startMouseWorld: Point2D;
    initialRatio: number;
    hasMoved: boolean;
  } | null>(null);

  // Interactive component drag state (Move switchboard or any electrical component)
  const [componentDragState, setComponentDragState] = useState<{
    componentId: string;
    startMouseWorld: Point2D;
    initialPos: Point3D;
    hasMoved: boolean;
  } | null>(null);

  // Manual routing mode state
  const [isManualRouting, setIsManualRouting] = useState(false);
  const [manualWaypoints, setManualWaypoints] = useState<Point2D[]>([]);

  // Step 3: Installation Zones State
  const [ceilingZoneStart, setCeilingZoneStart] = useState<Point2D | null>(null);
  const [internalSelectedZoneId, setInternalSelectedZoneId] = useState<string | undefined>(undefined);
  const activeSelectedZoneId = externalSelectedZoneId !== undefined ? externalSelectedZoneId : internalSelectedZoneId;
  const setEffectiveSelectedZoneId = (id: string | undefined) => {
    setInternalSelectedZoneId(id);
    if (onSelectZone) onSelectZone(id);
  };

  // Interactive Installation Zone drag state (Move along wall, resize start/end handles, or drag area/bathroom zones)
  const [zoneDragState, setZoneDragState] = useState<{
    zoneId: string;
    mode: 'move' | 'start' | 'end' | 'area_center' | 'area_corner';
    wallId?: string;
    startMouseWorld: Point2D;
    initialDist: number;
    initialLength: number;
    initialWidth: number;
    initialCenter?: Point2D;
    initialDimensions?: { width: number; height: number };
    cornerIndex?: number;
    hasMoved: boolean;
  } | null>(null);

  // Drawing new zone sub-segment along a wall (e.g. kitchen counter 2.4m, not entire wall)
  const [zoneDrawState, setZoneDrawState] = useState<{
    wallId: string;
    startDist: number;
    currentDist: number;
    type: InstallationZoneType;
  } | null>(null);

  // Display toggles
  const [showZones, setShowZones] = useState(true);
  const [showCableRoutes, setShowCableRoutes] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);

  // Blueprint scale calibration state (drawing a standard dimension line on blueprint kóta, NOT a wall)
  const [internalCalibrating, setInternalCalibrating] = useState(false);
  const isCalibActive = isCalibratingScale || internalCalibrating;
  const calibActivatedAtRef = useRef<number>(0);

  const setCalibActive = (active: boolean) => {
    if (active) {
      calibActivatedAtRef.current = Date.now();
      setCalibStart(null);
      setCalibEnd(null);
      setWallStart(null);
    }
    setInternalCalibrating(active);
    if (onToggleCalibratingScale) {
      onToggleCalibratingScale(active);
    }
  };

  useEffect(() => {
    if (isCalibratingScale) {
      calibActivatedAtRef.current = Date.now();
      setCalibStart(null);
      setCalibEnd(null);
      setWallStart(null);
    }
  }, [isCalibratingScale]);

  const [calibStart, setCalibStart] = useState<Point2D | null>(null);
  const [calibEnd, setCalibEnd] = useState<Point2D | null>(null);
  const [calibUnit, setCalibUnit] = useState<'mm' | 'm'>('mm');
  const [calibInputRaw, setCalibInputRaw] = useState<string>('3800');
  const [calibRescaleAll, setCalibRescaleAll] = useState<boolean>(true);
  const [calibOrtho, setCalibOrtho] = useState<boolean>(true); // 90° Ortho snap for calibration
  const [activeCalibHandleDrag, setActiveCalibHandleDrag] = useState<'start' | 'end' | null>(null);
  const [hoveredCorner, setHoveredCorner] = useState<Point2D | null>(null); // Hovered wall corner for drawing chain
  const [hoveredSnapTarget, setHoveredSnapTarget] = useState<{
    pt: Point2D;
    type: 'corner' | 'intersection' | 'wall_body';
    label: string;
  } | null>(null);
  const [newJunctionPulse, setNewJunctionPulse] = useState<Point2D | null>(null);
  const [calibrationSuccessToast, setCalibrationSuccessToast] = useState<string | null>(null);
  const [calibPanelPos, setCalibPanelPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingCalibPanel, setIsDraggingCalibPanel] = useState(false);
  const [calibPanelDragStart, setCalibPanelDragStart] = useState<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const [isCalibMinimized, setIsCalibMinimized] = useState(false);

  // Convert screen coordinates to world (meter) coordinates with sub-millimeter precision
  const screenToWorld = (screenX: number, screenY: number): Point2D => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (screenX - rect.left - pan.x) / scale;
    const y = (screenY - rect.top - pan.y) / scale;
    return {
      x: Number(x.toFixed(4)), // 4 decimal places = 0.1 mm precision
      y: Number(y.toFixed(4)),
    };
  };

  // Snap to grid (default 0.05m = 5cm, or precise 0.01m = 1cm)
  const snapToGrid = (pt: Point2D, snapInterval: number = 0.05): Point2D => {
    return {
      x: Number((Math.round(pt.x / snapInterval) * snapInterval).toFixed(3)),
      y: Number((Math.round(pt.y / snapInterval) * snapInterval).toFixed(3)),
    };
  };

  // Dedicated endpoint calculation for calibration measurement line (NEVER jumps to wall vertices; keeps exact mouse position)
  const getCalibrationEndpoint = (
    start: Point2D,
    exactPt: Point2D,
    enableOrtho: boolean = true
  ): { pt: Point2D; angleDeg: number; isOrthogonal: boolean } => {
    const dx = exactPt.x - start.x;
    const dy = exactPt.y - start.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.005) return { pt: exactPt, angleDeg: 0, isOrthogonal: false };

    let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angleDeg < 0) angleDeg += 360;

    if (enableOrtho) {
      const snapTolerance = 12; // degrees
      // Horizontal snap (0° or 180°): keep exact X of cursor, lock Y to start.y
      if (Math.abs(angleDeg - 0) < snapTolerance || Math.abs(angleDeg - 360) < snapTolerance) {
        return { pt: { x: exactPt.x, y: start.y }, angleDeg: 0, isOrthogonal: true };
      }
      if (Math.abs(angleDeg - 180) < snapTolerance) {
        return { pt: { x: exactPt.x, y: start.y }, angleDeg: 180, isOrthogonal: true };
      }
      // Vertical snap (90° or 270°): keep exact Y of cursor, lock X to start.x
      if (Math.abs(angleDeg - 90) < snapTolerance) {
        return { pt: { x: start.x, y: exactPt.y }, angleDeg: 90, isOrthogonal: true };
      }
      if (Math.abs(angleDeg - 270) < snapTolerance) {
        return { pt: { x: start.x, y: exactPt.y }, angleDeg: 270, isOrthogonal: true };
      }
    }

    return { pt: exactPt, angleDeg: Math.round(angleDeg), isOrthogonal: false };
  };

  // Auto-snap wall endpoint to 90° orthogonal angles, corners, wall bodies (T-junctions), or intersections
  const getSnappedWallEndpoint = (
    start: Point2D,
    rawPt: Point2D,
    ignoreWallId?: string
  ): { pt: Point2D; angleDeg: number; isOrthogonal: boolean; snapType?: 'corner' | 'intersection' | 'wall_body' } => {
    // 1. High priority: check wall snap candidates (corners, intersections, T-junctions)
    const snapCand = findWallSnapCandidate(rawPt, start, floor.walls, ignoreWallId, scale);
    if (snapCand.snapType) {
      const dx = snapCand.snappedPt.x - start.x;
      const dy = snapCand.snappedPt.y - start.y;
      let angleDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
      if (angleDeg < 0) angleDeg += 360;
      const isOrthogonal = angleDeg === 0 || angleDeg === 90 || angleDeg === 180 || angleDeg === 270;
      return { pt: snapCand.snappedPt, angleDeg, isOrthogonal, snapType: snapCand.snapType };
    }

    const dx = rawPt.x - start.x;
    const dy = rawPt.y - start.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.1) return { pt: rawPt, angleDeg: 0, isOrthogonal: false };

    let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angleDeg < 0) angleDeg += 360;

    // 2. Auto-snap to 90° angles (0, 90, 180, 270) within 12 degree tolerance
    const snapTolerance = 12;

    if (Math.abs(angleDeg - 0) < snapTolerance || Math.abs(angleDeg - 360) < snapTolerance) {
      return { pt: { x: Number(rawPt.x.toFixed(2)), y: start.y }, angleDeg: 0, isOrthogonal: true };
    }
    if (Math.abs(angleDeg - 90) < snapTolerance) {
      return { pt: { x: start.x, y: Number(rawPt.y.toFixed(2)) }, angleDeg: 90, isOrthogonal: true };
    }
    if (Math.abs(angleDeg - 180) < snapTolerance) {
      return { pt: { x: Number(rawPt.x.toFixed(2)), y: start.y }, angleDeg: 180, isOrthogonal: true };
    }
    if (Math.abs(angleDeg - 270) < snapTolerance) {
      return { pt: { x: start.x, y: Number(rawPt.y.toFixed(2)) }, angleDeg: 270, isOrthogonal: true };
    }

    return { pt: rawPt, angleDeg: Math.round(angleDeg), isOrthogonal: false };
  };

  // Find nearest wall to snap electrical components or select wall
  const findNearestWall = (
    pt: Point2D,
    maxDist: number = 0.5
  ): { wall: Wall; proj: Point2D; ratio: number; angle: number; distFromStart: number; dist: number } | null => {
    let nearest: { wall: Wall; proj: Point2D; ratio: number; angle: number; distFromStart: number; dist: number } | null = null;
    let minDist = maxDist;

    floor.walls.forEach((w) => {
      const dx = w.end.x - w.start.x;
      const dy = w.end.y - w.start.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) return;

      let t = ((pt.x - w.start.x) * dx + (pt.y - w.start.y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));

      const projX = w.start.x + t * dx;
      const projY = w.start.y + t * dy;
      const dist = Math.hypot(pt.x - projX, pt.y - projY);

      if (dist < minDist) {
        minDist = dist;
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        const distFromStart = Math.hypot(projX - w.start.x, projY - w.start.y);
        nearest = { wall: w, proj: { x: projX, y: projY }, ratio: t, angle, distFromStart, dist };
      }
    });

    return nearest;
  };

  // Helper to determine endpoint radius extension:
  // - If connected to another wall (corner, T-junction), use connected wall's radius (thickness / 2)
  //   so that the visual face aligns without overhang or gap!
  // - If open/standalone, use the wall's own radius (thickness / 2) so measured length is length + priemer steny
  const getEndpointRadius = (
    pt: Point2D,
    ownThickness: number,
    wallId?: string,
    activeWallPt?: Point2D | null
  ): number => {
    let connectingThickness: number | null = null;

    // Check if connected to active drawing point (e.g. wallStart)
    if (activeWallPt && Math.hypot(pt.x - activeWallPt.x, pt.y - activeWallPt.y) < 0.10) {
      connectingThickness = Math.max(connectingThickness || 0, defaultWallThickness || 0.15);
    }

    // Check all other walls
    for (const w of floor.walls) {
      if (wallId && w.id === wallId) continue;
      const wThick = w.thickness || defaultWallThickness || 0.15;

      // 1. Direct corner connection
      if (
        Math.hypot(pt.x - w.start.x, pt.y - w.start.y) < 0.10 ||
        Math.hypot(pt.x - w.end.x, pt.y - w.end.y) < 0.10
      ) {
        connectingThickness = Math.max(connectingThickness || 0, wThick);
        continue;
      }

      // 2. T-junction connection along wall body
      const dx = w.end.x - w.start.x;
      const dy = w.end.y - w.start.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq > 0) {
        const t = ((pt.x - w.start.x) * dx + (pt.y - w.start.y) * dy) / lenSq;
        if (t >= -0.05 && t <= 1.05) {
          const projX = w.start.x + t * dx;
          const projY = w.start.y + t * dy;
          if (Math.hypot(pt.x - projX, pt.y - projY) < 0.10) {
            connectingThickness = Math.max(connectingThickness || 0, wThick);
          }
        }
      }
    }

    // If connected to another wall of different/same thickness, use connected wall's radius (r = thickness / 2).
    // If not connected to any other wall, use own wall's radius (r = ownThickness / 2).
    const finalThickness = connectingThickness !== null ? connectingThickness : ownThickness;
    return finalThickness / 2;
  };

  // ESC KEY & GLOBAL MOUSEUP HANDLERS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeCalibHandleDrag) {
          e.preventDefault();
          setActiveCalibHandleDrag(null);
          return;
        }
        if (componentDragState) {
          e.preventDefault();
          onUpdateFloor((prev) => ({
            ...prev,
            components: prev.components.map((c) =>
              c.id === componentDragState.componentId
                ? { ...c, position: { ...c.position, x: componentDragState.initialPos.x, y: componentDragState.initialPos.y } }
                : c
            ),
          }));
          setComponentDragState(null);
          return;
        }
        if (calibStart || isCalibActive) {
          e.preventDefault();
          setCalibStart(null);
          setCalibEnd(null);
          setCalibActive(false);
          return;
        }
        if (wallDragState) {
          e.preventDefault();
          // Revert wall to initial state
          onUpdateFloor((prev) => ({
            ...prev,
            walls: prev.walls.map((w) =>
              w.id === wallDragState.wallId
                ? { ...w, start: wallDragState.initialStart, end: wallDragState.initialEnd }
                : w
            ),
          }));
          setWallDragState(null);
          setSnappedAngleInfo(null);
          return;
        }
        if (wallStart) {
          e.preventDefault();
          setWallStart(null); // Cancel current wall segment, keep 'wall' tool active!
          setSnappedAngleInfo(null);
          return;
        }
        if (isManualRouting) {
          e.preventDefault();
          setManualWaypoints([]);
          setIsManualRouting(false);
          return;
        }
        if (selectedWallId) {
          e.preventDefault();
          onSelectWall(undefined);
          return;
        }
        if (selectedComponentId) {
          e.preventDefault();
          onSelectComponent(undefined);
          return;
        }
        if (ceilingZoneStart) {
          e.preventDefault();
          setCeilingZoneStart(null);
          return;
        }
        if (activeSelectedZoneId) {
          e.preventDefault();
          setEffectiveSelectedZoneId(undefined);
          return;
        }
      }
      if (activeSelectedZoneId && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        onUpdateFloor((prev) => ({
          ...prev,
          installationZones: prev.installationZones?.filter((z) => z.id !== activeSelectedZoneId),
        }));
        setEffectiveSelectedZoneId(undefined);
        return;
      }
    };

    const handleWindowMouseUp = () => {
      setIsPanning(false);
      setActiveCalibHandleDrag(null);
      setComponentDragState((curr) => {
        if (curr && curr.hasMoved) {
          onUpdateFloor((prev) => ({ ...prev }), true);
        }
        return null;
      });
      setWallDragState((curr) => {
        if (curr && curr.hasMoved) {
          onUpdateFloor((prev) => {
            const resolved = resolveAllFloorWallIntersections(prev);
            return resolved;
          }, true);
        }
        return null;
      });
      setZoneDragState((curr) => {
        if (curr && curr.hasMoved) {
          onUpdateFloor((prev) => ({ ...prev }), true);
        }
        return null;
      });
      setSnappedAngleInfo(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [wallDragState, wallStart, isManualRouting, selectedComponentId, selectedWallId, isCalibActive, calibStart, activeCalibHandleDrag, onSelectComponent, onSelectWall, onUpdateFloor]);

  // Floating calibration panel drag handlers
  useEffect(() => {
    if (!isDraggingCalibPanel || !calibPanelDragStart) return;

    const handlePanelMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - calibPanelDragStart.mouseX;
      const dy = e.clientY - calibPanelDragStart.mouseY;
      const newX = Math.max(10, Math.min(window.innerWidth - 340, calibPanelDragStart.startX + dx));
      const newY = Math.max(40, Math.min(window.innerHeight - 80, calibPanelDragStart.startY + dy));
      setCalibPanelPos({ x: newX, y: newY });
    };

    const handlePanelMouseUp = () => {
      setIsDraggingCalibPanel(false);
      setCalibPanelDragStart(null);
    };

    window.addEventListener('mousemove', handlePanelMouseMove);
    window.addEventListener('mouseup', handlePanelMouseUp);
    return () => {
      window.removeEventListener('mousemove', handlePanelMouseMove);
      window.removeEventListener('mouseup', handlePanelMouseUp);
    };
  }, [isDraggingCalibPanel, calibPanelDragStart]);

  const handleCalibTitleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = calibPanelPos?.x ?? Math.max(20, rect.width - 380);
    const currentY = calibPanelPos?.y ?? 75;

    setIsDraggingCalibPanel(true);
    setCalibPanelDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: currentX,
      startY: currentY,
    });
  };

  const selectedComponent = floor.components.find((c) => c.id === selectedComponentId);
  const selectedWall = floor.walls.find((w) => w.id === selectedWallId);
  const switchboard = floor.switchboards[0];

  // SOLIDWORKS MOUSE NAVIGATION
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent canvas interactions when clicking on any UI buttons, inputs, dropdowns or overlay cards
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('textarea') ||
      target.closest('.no-canvas-click')
    ) {
      return;
    }

    // SolidWorks MMB Pan (button 1) or Alt+LMB
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    // Right click cancels current active wall segment (SolidWorks style)
    if (e.button === 2) {
      e.preventDefault();
      if (wallStart) {
        setWallStart(null);
        setSnappedAngleInfo(null);
      }
      if (isManualRouting) {
        setManualWaypoints([]);
        setIsManualRouting(false);
      }
      return;
    }

    const worldPt = screenToWorld(e.clientX, e.clientY);

    if (onCursorMove) {
      onCursorMove(worldPt);
    }
    const snapped = snapToGrid(worldPt);

    if (isManualRouting && selectedComponent) {
      setManualWaypoints((prev) => [...prev, snapped]);
      return;
    }

    // 0. Blueprint Scale Calibration Mode: Measure standard dimension line on blueprint
    if (isCalibActive) {
      // Guard against the activating click registering as the first point
      if (Date.now() - calibActivatedAtRef.current < 250) {
        return;
      }

      if (!calibStart) {
        // First click on canvas: sets Point A EXACTLY where clicked (no grid snap!)
        setCalibStart(worldPt);
        return;
      }
      if (calibStart && !calibEnd) {
        // Second click on canvas: sets Point B
        const isOrtho = calibOrtho && !e.shiftKey;
        const snapResult = getCalibrationEndpoint(calibStart, worldPt, isOrtho);
        const finalEnd = snapResult.pt;
        setCalibEnd(finalEnd);
        const distM = Math.hypot(finalEnd.x - calibStart.x, finalEnd.y - calibStart.y);
        if (calibUnit === 'mm') {
          setCalibInputRaw(Math.round(distM * 1000).toString());
        } else {
          setCalibInputRaw(distM.toFixed(2));
        }
        return;
      }
      return;
    }

    // Step 3: Installation Zone Tools (drag along wall to select specific area, or click for preset)
    if (activeTool === 'zone_kitchen' || activeTool === 'zone_segment' || activeTool === 'zone_vertical') {
      const wallSnap = findNearestWall(worldPt, 0.45);
      if (wallSnap) {
        const dx = wallSnap.wall.end.x - wallSnap.wall.start.x;
        const dy = wallSnap.wall.end.y - wallSnap.wall.start.y;
        const len = Math.hypot(dx, dy);
        const dist = Number((wallSnap.ratio * len).toFixed(2));
        const zoneType: InstallationZoneType =
          activeTool === 'zone_kitchen' ? 'zvs' : activeTool === 'zone_vertical' ? 'zvz' : 'zvs';
        setZoneDrawState({
          wallId: wallSnap.wall.id,
          startDist: dist,
          currentDist: dist,
          type: zoneType,
        });
      }
      return;
    }

    if (activeTool === 'zone_bathroom') {
      const bathRoom = floor.rooms.find(
        (r) => r.type === 'bathroom' || r.name.toLowerCase().includes('kúp') || r.name.toLowerCase().includes('kup')
      );
      onUpdateFloor((prev) => ({
        ...prev,
        installationZones: addBathroomSafetyZone(snapped, 1.6, 0.8, bathRoom?.id, prev),
      }));
      return;
    }

    if (activeTool === 'zone_ceiling') {
      if (!ceilingZoneStart) {
        setCeilingZoneStart(snapped);
      } else {
        onUpdateFloor((prev) => ({
          ...prev,
          installationZones: addCeilingCorridor(ceilingZoneStart, snapped, 0.4, prev),
        }));
        setCeilingZoneStart(null);
      }
      return;
    }

    if (activeTool === 'wall') {
      // 1. Check priority snap candidate: Corner, Intersection, or Wall body (T-junction)
      const snapCand = findWallSnapCandidate(worldPt, wallStart, floor.walls, undefined, scale);
      const clickedSnapPt = snapCand.snapType ? snapCand.snappedPt : null;

      if (!wallStart) {
        // Start drawing wall: from clicked snap point (corner, intersection, wall body), or grid snap
        let startPoint = clickedSnapPt;
        if (!startPoint) {
          const wallSnap = findNearestWall(worldPt, 0.25);
          if (wallSnap) {
            startPoint = wallSnap.proj;
          }
        }
        if (!startPoint) {
          startPoint = snapped;
        }
        setWallStart(startPoint);
        onSelectWall(undefined);
        return;
      } else {
        // Complete wall segment with auto-snap to corner, intersection, wall body (T-junction), or 90°
        let finalEnd = clickedSnapPt;
        if (!finalEnd) {
          const wallSnap = findNearestWall(worldPt, 0.25);
          if (wallSnap) {
            finalEnd = wallSnap.proj;
          }
        }
        if (!finalEnd) {
          finalEnd = getSnappedWallEndpoint(wallStart, snapped).pt;
        }

        if (Math.hypot(finalEnd.x - wallStart.x, finalEnd.y - wallStart.y) > 0.15) {
          const newWall: Wall = {
            id: `w-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            start: wallStart,
            end: finalEnd,
            thickness: defaultWallThickness || 0.15,
            height: floor.height,
            openings: [],
            material: 'aerated_concrete',
          };

          // AUTOMATIC WALL SNAP, INTERSECTION RESOLUTION & JUNCTION NODE CREATION
          const { resolvedWalls, resolvedComponents, resolvedZones, newJunctionNodes, lastWallId } =
            resolveWallIntersections(
              newWall,
              floor.walls,
              floor.components,
              floor.installationZones
            );

          if (newJunctionNodes.length > 0) {
            setNewJunctionPulse(newJunctionNodes[0]);
            setTimeout(() => setNewJunctionPulse(null), 2200);
          }

          onUpdateFloor((prev) => ({
            ...prev,
            walls: resolvedWalls,
            components: resolvedComponents,
            installationZones: resolvedZones,
          }));
          onSelectWall(lastWallId);
        }
        // Continuous chained wall drawing (SolidWorks style): continue from finalEnd!
        setWallStart(finalEnd);
        return;
      }
    } else if (activeTool === 'component' && selectedComponentType) {
      // Placing electrical component
      const wallSnap = findNearestWall(worldPt);
      const targetPos = wallSnap ? wallSnap.proj : snapped;
      const rotation = wallSnap ? wallSnap.angle + 90 : 0;

      // Special handling for switchboard in Step 3 (RH alebo RP)
      if (selectedComponentType === 'switchboard') {
        const isSub = selectedSwitchboardKind === 'sub';
        const existingSubs = floor.components.filter(
          (c) => c.type === 'switchboard' && (c.switchboardKind === 'sub' || c.notes === 'RP' || c.label.includes('RP'))
        ).length;
        const subIndex = existingSubs + 1;

        const label = isSub ? `Podružný rozvádzač RP${subIndex}` : `Hlavný rozvádzač RH`;
        const code = isSub ? '134016' : '134018';
        const catalogName = isSub
          ? 'Podružný rozvádzač Legrand Practibox S 24M pod omietku'
          : 'Hlavný rozvádzač Legrand Practibox S 36M pod omietku';
        const modules = isSub ? 24 : 36;
        const rows = isSub ? 2 : 3;

        const newComp: ElectricalComponent = {
          id: `comp-sb-${Date.now()}`,
          type: 'switchboard',
          label,
          switchboardKind: isSub ? 'sub' : 'main',
          notes: isSub ? 'RP' : 'RH',
          position: { x: targetPos.x, y: targetPos.y, z: 1.50 },
          rotation,
          wallId: wallSnap?.wall.id,
          distanceAlongWallRatio: wallSnap?.ratio,
          floorId: floor.id,
          catalogItem: {
            brand: 'Legrand',
            series: 'Practibox S',
            code,
            name: catalogName,
            category: 'Rozvádzače',
            priceEur: isSub ? 48.0 : 68.0,
          },
          pathwayPreference: defaultPathway,
        };

        const newEnclosure: SwitchboardEnclosure = {
          id: `sb-${isSub ? 'rp' : 'rh'}-${Date.now()}`,
          name: label,
          type: catalogName,
          floorId: floor.id,
          position: { x: targetPos.x, y: targetPos.y, z: 1.50 },
          rowsCount: rows,
          modulesPerRow: 12,
          totalModules: modules,
          modules: isSub
            ? [
                { id: `m-main-${Date.now()}`, type: 'main_switch', name: 'Vypínač 25A 3P', widthDIN: 3, rating: '25A / 3P', brand: 'Legrand', modelCode: '406439' },
                { id: `m-rcd-${Date.now()}`, type: 'rcd', name: 'Prúdový chránič RCD', widthDIN: 4, rating: '25A / 30mA typ A', brand: 'Legrand', modelCode: '411504' },
                { id: `m-mcb1-${Date.now()}`, type: 'mcb', name: 'Svetelný okruh S1', widthDIN: 1, rating: 'B10A / 1P', brand: 'Legrand', modelCode: '403356' },
                { id: `m-mcb2-${Date.now()}`, type: 'mcb', name: 'Zásuvkový okruh Z1', widthDIN: 1, rating: 'B16A / 1P', brand: 'Legrand', modelCode: '403358' },
              ]
            : [
                { id: `m-main-${Date.now()}`, type: 'main_switch', name: 'Hlavný vypínač 25A 3P', widthDIN: 3, rating: '25A / 3P', brand: 'Legrand', modelCode: '406439' },
                { id: `m-spd-${Date.now()}`, type: 'spd', name: 'Prepäťová ochrana T1+T2', widthDIN: 4, rating: '12.5kA / 4P', brand: 'Legrand', modelCode: '412224' },
                { id: `m-rcd-${Date.now()}`, type: 'rcd', name: 'Prúdový chránič RCD', widthDIN: 4, rating: '40A / 30mA typ A', brand: 'Legrand', modelCode: '411505' },
                { id: `m-mcb1-${Date.now()}`, type: 'mcb', name: 'Svetelný okruh S1', widthDIN: 1, rating: 'B10A / 1P', brand: 'Legrand', modelCode: '403356' },
                { id: `m-mcb2-${Date.now()}`, type: 'mcb', name: 'Zásuvkový okruh Z1', widthDIN: 1, rating: 'B16A / 1P', brand: 'Legrand', modelCode: '403358' },
              ],
        };

        onUpdateFloor((prev) => {
          let updatedSwitchboards: SwitchboardEnclosure[];
          if (isSub) {
            updatedSwitchboards = [...prev.switchboards, newEnclosure];
          } else {
            const rhIndex = prev.switchboards.findIndex((sb) => !sb.name.includes('RP'));
            if (rhIndex >= 0) {
              updatedSwitchboards = prev.switchboards.map((sb, idx) =>
                idx === rhIndex ? { ...sb, position: { x: targetPos.x, y: targetPos.y, z: 1.50 } } : sb
              );
            } else {
              updatedSwitchboards = [newEnclosure, ...prev.switchboards];
            }
          }
          return {
            ...prev,
            components: [...prev.components, newComp],
            switchboards: updatedSwitchboards,
          };
        });
        onSelectComponent(newComp.id);
        onSelectWall(undefined);
        return;
      }

      const inBathroom = floor.rooms.some((r) => r.type === 'bathroom');
      const recommendedZ = getRecommendedHeight(selectedComponentType, inBathroom ? 'bathroom' : undefined);

      const catalogRef = getDefaultCatalogItem(selectedComponentType);
      const recommendedShelly = recommendShellyModule(selectedComponentType);

      const newComp: ElectricalComponent = {
        id: `comp-${Date.now()}`,
        type: selectedComponentType,
        label: `${STN_HEIGHT_RECOMMENDATIONS[selectedComponentType]?.descriptionSk.split(' ')[0]} ${floor.components.length + 1}`,
        position: { x: targetPos.x, y: targetPos.y, z: recommendedZ },
        rotation,
        wallId: wallSnap?.wall.id,
        distanceAlongWallRatio: wallSnap?.ratio,
        floorId: floor.id,
        catalogItem: catalogRef,
        smartModule: recommendedShelly,
        pathwayPreference: defaultPathway,
      };

      onUpdateFloor((prev) => ({
        ...prev,
        components: [...prev.components, newComp],
      }));
      onSelectComponent(newComp.id);
      onSelectWall(undefined);
      if (onSelectOpening) onSelectOpening(undefined);
    } else if (activeTool === 'door' || activeTool === 'window') {
      const wallSnap = findNearestWall(worldPt, 0.8);
      if (wallSnap) {
        const isDoor = activeTool === 'door';
        const opening: Opening = {
          id: `op-${Date.now()}`,
          type: isDoor ? 'door' : 'window',
          positionRatio: wallSnap.ratio,
          width: isDoor ? (defaultDoorSize?.width ?? 0.9) : (defaultWindowSize?.width ?? 1.2),
          height: isDoor ? (defaultDoorSize?.height ?? 2.0) : (defaultWindowSize?.height ?? 1.4),
          elevation: isDoor ? 0 : (defaultWindowSize?.elevation ?? 0.9),
          swingDirection: 'left',
          swingSide: 'left',
        };
        onUpdateFloor((prev) => ({
          ...prev,
          walls: prev.walls.map((w) =>
            w.id === wallSnap.wall.id
              ? { ...w, openings: [...w.openings, opening] }
              : w
          ),
        }));
        onSelectWall(wallSnap.wall.id);
        if (onSelectOpening) {
          onSelectOpening(opening.id);
        }
      }
    } else if (activeTool === 'select') {
      // Selection tool: Check if clicked a wall
      const wallSnap = findNearestWall(worldPt, 0.35);
      if (wallSnap) {
        onSelectWall(wallSnap.wall.id);
        if (onSelectOpening) onSelectOpening(undefined);
        onSelectComponent(undefined);
      } else {
        onSelectWall(undefined);
        if (onSelectOpening) onSelectOpening(undefined);
        onSelectComponent(undefined);
      }
    }
  };

  // Start dragging component (switchboard, socket, switch, etc.)
  const handleStartComponentDrag = (
    comp: ElectricalComponent,
    e: React.MouseEvent
  ) => {
    if (e.button !== 0 || e.altKey) return;
    if (wallStart) return; // Don't interrupt active wall drawing
    if (isLinkingMode) return; // Linking mode handles its own clicks

    e.stopPropagation();
    onSelectComponent(comp.id);
    onSelectWall(undefined);
    if (onSelectOpening) onSelectOpening(undefined);

    const mouseWorld = screenToWorld(e.clientX, e.clientY);
    setComponentDragState({
      componentId: comp.id,
      startMouseWorld: mouseWorld,
      initialPos: { ...comp.position },
      hasMoved: false,
    });
  };

  // Start dragging opening along wall
  const handleStartOpeningDrag = (
    wall: Wall,
    op: Opening,
    e: React.MouseEvent
  ) => {
    if (e.button !== 0 || e.altKey) return;
    if (wallStart) return;

    e.stopPropagation();
    onSelectWall(wall.id);
    if (onSelectOpening) {
      onSelectOpening(op.id);
    }
    onSelectComponent(undefined);

    const mouseWorld = screenToWorld(e.clientX, e.clientY);
    setOpeningDragState({
      wallId: wall.id,
      openingId: op.id,
      startMouseWorld: mouseWorld,
      initialRatio: op.positionRatio,
      hasMoved: false,
    });
  };

  // Start dragging whole wall or individual vertex handle
  const handleStartWallDrag = (
    wall: Wall,
    mode: 'wall' | 'start' | 'end',
    e: React.MouseEvent
  ) => {
    if (e.button !== 0 || e.altKey) return;
    if (activeTool !== 'select') return; // When drawing walls, do not drag walls or intercept clicks!
    if (wallStart) return; // Don't interrupt active wall drawing

    e.stopPropagation();
    onSelectWall(wall.id);
    if (onSelectOpening) onSelectOpening(undefined);
    onSelectComponent(undefined);

    const mouseWorld = screenToWorld(e.clientX, e.clientY);
    setWallDragState({
      wallId: wall.id,
      mode,
      startMouseWorld: mouseWorld,
      initialStart: { ...wall.start },
      initialEnd: { ...wall.end },
      hasMoved: false,
      currentDelta: { dx: 0, dy: 0 },
    });
  };

  // Start dragging installation zone (move along wall, resize start/end handles, or move area zones)
  const handleStartZoneDrag = (
    zone: InstallationZone,
    mode: 'move' | 'start' | 'end' | 'area_center' | 'area_corner',
    e: React.MouseEvent,
    cornerIndex?: number
  ) => {
    if (e.button !== 0 || e.altKey) return;
    e.stopPropagation();
    setEffectiveSelectedZoneId(zone.id);
    onSelectWall(undefined);
    onSelectComponent(undefined);
    if (onSelectOpening) onSelectOpening(undefined);

    const mouseWorld = screenToWorld(e.clientX, e.clientY);
    const wall = zone.wallId ? floor.walls.find((w) => w.id === zone.wallId) : undefined;
    const wallLen = wall ? Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y) : 2.0;

    setZoneDragState({
      zoneId: zone.id,
      mode,
      wallId: zone.wallId,
      startMouseWorld: mouseWorld,
      initialDist: zone.distanceFromStartMeters ?? 0,
      initialLength: zone.lengthMeters ?? wallLen,
      initialWidth: zone.widthMeters ?? 0.30,
      initialCenter: zone.center ? { ...zone.center } : undefined,
      initialDimensions: zone.dimensions ? { ...zone.dimensions } : undefined,
      cornerIndex,
      hasMoved: false,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const worldPt = screenToWorld(e.clientX, e.clientY);

    if (onCursorMove) {
      onCursorMove(worldPt);
    }

    // 1. ACTIVE WALL / VERTEX DRAGGING
    if (wallDragState) {
      const dx = worldPt.x - wallDragState.startMouseWorld.x;
      const dy = worldPt.y - wallDragState.startMouseWorld.y;
      const hasMoved = wallDragState.hasMoved || Math.abs(dx) > 0.03 || Math.abs(dy) > 0.03;

      if (wallDragState.mode === 'wall') {
        // Whole wall translation: preserves wall length and angle
        const snappedDx = Number((Math.round(dx / 0.1) * 0.1).toFixed(2));
        const snappedDy = Number((Math.round(dy / 0.1) * 0.1).toFixed(2));

        const newStart: Point2D = {
          x: Number((wallDragState.initialStart.x + snappedDx).toFixed(2)),
          y: Number((wallDragState.initialStart.y + snappedDy).toFixed(2)),
        };
        const newEnd: Point2D = {
          x: Number((wallDragState.initialEnd.x + snappedDx).toFixed(2)),
          y: Number((wallDragState.initialEnd.y + snappedDy).toFixed(2)),
        };

        setWallDragState((prev) =>
          prev ? { ...prev, hasMoved, currentDelta: { dx: snappedDx, dy: snappedDy } } : null
        );

        onUpdateFloor((prev) => ({
          ...prev,
          walls: prev.walls.map((w) =>
            w.id === wallDragState.wallId ? { ...w, start: newStart, end: newEnd } : w
          ),
          components: prev.components.map((c) => {
            if (c.wallId === wallDragState.wallId && c.distanceAlongWallRatio !== undefined) {
              return {
                ...c,
                position: {
                  ...c.position,
                  x: Number((newStart.x + c.distanceAlongWallRatio * (newEnd.x - newStart.x)).toFixed(2)),
                  y: Number((newStart.y + c.distanceAlongWallRatio * (newEnd.y - newStart.y)).toFixed(2)),
                },
              };
            }
            return c;
          }),
        }), false);

      } else if (wallDragState.mode === 'start') {
        // Move start vertex: end stays fixed
        const rawSnapped = snapToGrid(worldPt);
        const snapResult = getSnappedWallEndpoint(wallDragState.initialEnd, rawSnapped, wallDragState.wallId);
        const newStart = snapResult.pt;

        setCursorPos(newStart);
        setSnappedAngleInfo({ angleDeg: snapResult.angleDeg, isOrthogonal: snapResult.isOrthogonal });
        setWallDragState((prev) => (prev ? { ...prev, hasMoved } : null));

        onUpdateFloor((prev) => ({
          ...prev,
          walls: prev.walls.map((w) =>
            w.id === wallDragState.wallId ? { ...w, start: newStart } : w
          ),
          components: prev.components.map((c) => {
            if (c.wallId === wallDragState.wallId && c.distanceAlongWallRatio !== undefined) {
              return {
                ...c,
                position: {
                  ...c.position,
                  x: Number((newStart.x + c.distanceAlongWallRatio * (wallDragState.initialEnd.x - newStart.x)).toFixed(2)),
                  y: Number((newStart.y + c.distanceAlongWallRatio * (wallDragState.initialEnd.y - newStart.y)).toFixed(2)),
                },
              };
            }
            return c;
          }),
        }), false);

      } else if (wallDragState.mode === 'end') {
        // Move end vertex: start stays fixed
        const rawSnapped = snapToGrid(worldPt);
        const snapResult = getSnappedWallEndpoint(wallDragState.initialStart, rawSnapped, wallDragState.wallId);
        const newEnd = snapResult.pt;

        setCursorPos(newEnd);
        setSnappedAngleInfo({ angleDeg: snapResult.angleDeg, isOrthogonal: snapResult.isOrthogonal });
        setWallDragState((prev) => (prev ? { ...prev, hasMoved } : null));

        onUpdateFloor((prev) => ({
          ...prev,
          walls: prev.walls.map((w) =>
            w.id === wallDragState.wallId ? { ...w, end: newEnd } : w
          ),
          components: prev.components.map((c) => {
            if (c.wallId === wallDragState.wallId && c.distanceAlongWallRatio !== undefined) {
              return {
                ...c,
                position: {
                  ...c.position,
                  x: Number((wallDragState.initialStart.x + c.distanceAlongWallRatio * (newEnd.x - wallDragState.initialStart.x)).toFixed(2)),
                  y: Number((wallDragState.initialStart.y + c.distanceAlongWallRatio * (newEnd.y - wallDragState.initialStart.y)).toFixed(2)),
                },
              };
            }
            return c;
          }),
        }), false);
      }
      return;
    }

    // Handle component (switchboard, socket, switch, etc.) dragging along walls or on floor
    if (componentDragState) {
      const comp = floor.components.find((c) => c.id === componentDragState.componentId);
      if (comp) {
        // Snap to nearest wall if within reach (0.4m), else grid snap
        const wallSnap = findNearestWall(worldPt, 0.4);
        const targetPos = wallSnap ? wallSnap.proj : snapToGrid(worldPt);
        const rotation = wallSnap ? wallSnap.angle + 90 : comp.rotation;

        setComponentDragState((prev) => (prev ? { ...prev, hasMoved: true } : null));

        onUpdateFloor((prev) => {
          const isSb = comp.type === 'switchboard';
          const updatedComponents = prev.components.map((c) => {
            if (c.id !== comp.id) return c;
            return {
              ...c,
              position: { ...c.position, x: targetPos.x, y: targetPos.y },
              rotation,
              wallId: wallSnap?.wall.id,
              distanceAlongWallRatio: wallSnap?.ratio,
            };
          });

          // Sync switchboards array if moving a switchboard
          let updatedSwitchboards = prev.switchboards;
          if (isSb) {
            const isSub = comp.switchboardKind === 'sub' || comp.notes === 'RP' || comp.label.includes('RP');
            const matchIdx = prev.switchboards.findIndex(
              (sb) => sb.name === comp.label || (isSub ? sb.name.includes('RP') : !sb.name.includes('RP'))
            );
            if (matchIdx >= 0) {
              updatedSwitchboards = prev.switchboards.map((sb, idx) =>
                idx === matchIdx ? { ...sb, position: { ...sb.position, x: targetPos.x, y: targetPos.y } } : sb
              );
            } else if (prev.switchboards.length > 0) {
              updatedSwitchboards = prev.switchboards.map((sb, idx) =>
                idx === 0 ? { ...sb, position: { ...sb.position, x: targetPos.x, y: targetPos.y } } : sb
              );
            }
          }

          return {
            ...prev,
            components: updatedComponents,
            switchboards: updatedSwitchboards,
          };
        }, false);
      }
      return;
    }

    // Handle opening sliding along wall
    if (openingDragState) {
      const targetWall = floor.walls.find((w) => w.id === openingDragState.wallId);
      if (targetWall) {
        const wdx = targetWall.end.x - targetWall.start.x;
        const wdy = targetWall.end.y - targetWall.start.y;
        const wLenSq = wdx * wdx + wdy * wdy;
        if (wLenSq > 0.001) {
          const proj = ((worldPt.x - targetWall.start.x) * wdx + (worldPt.y - targetWall.start.y) * wdy) / wLenSq;
          const clampedRatio = Math.max(0.05, Math.min(0.95, Number(proj.toFixed(3))));

          setOpeningDragState((prev) => (prev ? { ...prev, hasMoved: true } : null));

          onUpdateFloor((prev) => ({
            ...prev,
            walls: prev.walls.map((w) =>
              w.id === targetWall.id
                ? {
                    ...w,
                    openings: w.openings.map((op) =>
                      op.id === openingDragState.openingId
                        ? { ...op, positionRatio: clampedRatio }
                        : op
                    ),
                  }
                : w
            ),
          }), false);
        }
      }
      return;
    }

    // Handle interactive Installation Zone dragging (Move along wall, resize start/end handles, move area zones)
    if (zoneDragState) {
      const targetWall = zoneDragState.wallId
        ? floor.walls.find((w) => w.id === zoneDragState.wallId)
        : undefined;

      if (targetWall) {
        const wdx = targetWall.end.x - targetWall.start.x;
        const wdy = targetWall.end.y - targetWall.start.y;
        const wLen = Math.hypot(wdx, wdy);
        if (wLen > 0.01) {
          const ux = wdx / wLen;
          const uy = wdy / wLen;
          const currentProj = (worldPt.x - targetWall.start.x) * ux + (worldPt.y - targetWall.start.y) * uy;
          const startProj = (zoneDragState.startMouseWorld.x - targetWall.start.x) * ux + (zoneDragState.startMouseWorld.y - targetWall.start.y) * uy;
          const deltaM = currentProj - startProj;

          if (Math.abs(deltaM) > 0.02) {
            setZoneDragState((prev) => (prev ? { ...prev, hasMoved: true } : null));
          }

          if (zoneDragState.mode === 'move') {
            const maxStart = Math.max(0, wLen - zoneDragState.initialLength);
            const rawNewStart = zoneDragState.initialDist + deltaM;
            const clamped = Math.max(0, Math.min(maxStart, rawNewStart));
            const snappedStart = Math.round(clamped * 20) / 20;

            onUpdateFloor((prev) => ({
              ...prev,
              installationZones: prev.installationZones?.map((z) =>
                z.id === zoneDragState.zoneId
                  ? { ...z, distanceFromStartMeters: Number(snappedStart.toFixed(2)) }
                  : z
              ),
            }), false);
          } else if (zoneDragState.mode === 'start') {
            const currentEnd = zoneDragState.initialDist + zoneDragState.initialLength;
            const rawNewStart = currentProj;
            const clamped = Math.max(0, Math.min(currentEnd - 0.20, rawNewStart));
            const snappedStart = Math.round(clamped * 20) / 20;
            const newLen = Number((currentEnd - snappedStart).toFixed(2));

            onUpdateFloor((prev) => ({
              ...prev,
              installationZones: prev.installationZones?.map((z) =>
                z.id === zoneDragState.zoneId
                  ? {
                      ...z,
                      distanceFromStartMeters: Number(snappedStart.toFixed(2)),
                      lengthMeters: newLen,
                    }
                  : z
              ),
            }), false);
          } else if (zoneDragState.mode === 'end') {
            const currentStart = zoneDragState.initialDist;
            const rawNewEnd = currentProj;
            const clamped = Math.max(currentStart + 0.20, Math.min(wLen, rawNewEnd));
            const snappedEnd = Math.round(clamped * 20) / 20;
            const newLen = Number((snappedEnd - currentStart).toFixed(2));

            onUpdateFloor((prev) => ({
              ...prev,
              installationZones: prev.installationZones?.map((z) =>
                z.id === zoneDragState.zoneId
                  ? { ...z, lengthMeters: newLen }
                  : z
              ),
            }), false);
          }
        }
      } else if (zoneDragState.initialCenter) {
        // Area / Bathroom zone dragging
        const dx = worldPt.x - zoneDragState.startMouseWorld.x;
        const dy = worldPt.y - zoneDragState.startMouseWorld.y;
        if (Math.abs(dx) > 0.02 || Math.abs(dy) > 0.02) {
          setZoneDragState((prev) => (prev ? { ...prev, hasMoved: true } : null));
        }

        if (zoneDragState.mode === 'area_center') {
          const newCenter = {
            x: Number((zoneDragState.initialCenter.x + dx).toFixed(2)),
            y: Number((zoneDragState.initialCenter.y + dy).toFixed(2)),
          };
          onUpdateFloor((prev) => ({
            ...prev,
            installationZones: prev.installationZones?.map((z) =>
              z.id === zoneDragState.zoneId ? { ...z, center: newCenter } : z
            ),
          }), false);
        } else if (zoneDragState.mode === 'area_corner' && zoneDragState.initialDimensions) {
          const newW = Math.max(0.6, Number((zoneDragState.initialDimensions.width + dx).toFixed(2)));
          const newH = Math.max(0.6, Number((zoneDragState.initialDimensions.height + dy).toFixed(2)));
          onUpdateFloor((prev) => ({
            ...prev,
            installationZones: prev.installationZones?.map((z) =>
              z.id === zoneDragState.zoneId
                ? { ...z, dimensions: { width: newW, height: newH }, widthMeters: newW }
                : z
            ),
          }), false);
        }
      }
      return;
    }

    // Handle interactive zone drawing along wall
    if (zoneDrawState) {
      const targetWall = floor.walls.find((w) => w.id === zoneDrawState.wallId);
      if (targetWall) {
        const wdx = targetWall.end.x - targetWall.start.x;
        const wdy = targetWall.end.y - targetWall.start.y;
        const wLen = Math.hypot(wdx, wdy);
        if (wLen > 0.01) {
          const ux = wdx / wLen;
          const uy = wdy / wLen;
          const proj = (worldPt.x - targetWall.start.x) * ux + (worldPt.y - targetWall.start.y) * uy;
          const clamped = Math.max(0, Math.min(wLen, Number(proj.toFixed(2))));
          setZoneDrawState((prev) => (prev ? { ...prev, currentDist: clamped } : null));
        }
      }
      return;
    }

    // 0. Handle calibration endpoint dragging (sub-millimeter precision, no grid snap)
    if (activeCalibHandleDrag) {
      if (activeCalibHandleDrag === 'start') {
        setCalibStart(worldPt);
      } else if (activeCalibHandleDrag === 'end' && calibStart) {
        const isOrtho = calibOrtho && !e.shiftKey;
        const snapResult = getCalibrationEndpoint(calibStart, worldPt, isOrtho);
        setCalibEnd(snapResult.pt);
      }
      return;
    }

    if (isCalibActive) {
      if (calibStart && !calibEnd) {
        const isOrtho = calibOrtho && !e.shiftKey;
        const snapResult = getCalibrationEndpoint(calibStart, worldPt, isOrtho);
        setCursorPos(snapResult.pt);
        setSnappedAngleInfo({ angleDeg: snapResult.angleDeg, isOrthogonal: snapResult.isOrthogonal });
      } else {
        setCursorPos(worldPt);
        setSnappedAngleInfo(null);
      }
      return;
    }

    // 2. CORNER, INTERSECTION & WALL SNAP HOVER
    let nearCorner: Point2D | null = null;
    let currentSnapTarget: { pt: Point2D; type: 'corner' | 'intersection' | 'wall_body'; label: string } | null = null;

    if (activeTool === 'wall') {
      const snapCand = findWallSnapCandidate(worldPt, wallStart, floor.walls, undefined, scale);
      if (snapCand.snapType) {
        currentSnapTarget = {
          pt: snapCand.snappedPt,
          type: snapCand.snapType,
          label: snapCand.label || '',
        };
        if (snapCand.snapType === 'corner') {
          nearCorner = snapCand.snappedPt;
        }
      }
      setHoveredCorner(nearCorner);
      setHoveredSnapTarget(currentSnapTarget);
    } else {
      setHoveredCorner(null);
      setHoveredSnapTarget(null);
    }

    const rawSnapped = snapToGrid(worldPt);

    if (wallStart) {
      if (currentSnapTarget) {
        setCursorPos(currentSnapTarget.pt);
        const dx = currentSnapTarget.pt.x - wallStart.x;
        const dy = currentSnapTarget.pt.y - wallStart.y;
        let angleDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
        if (angleDeg < 0) angleDeg += 360;
        const isOrtho = angleDeg === 0 || angleDeg === 90 || angleDeg === 180 || angleDeg === 270;
        setSnappedAngleInfo({ angleDeg, isOrthogonal: isOrtho });
      } else {
        const snapResult = getSnappedWallEndpoint(wallStart, rawSnapped);
        setCursorPos(snapResult.pt);
        setSnappedAngleInfo({ angleDeg: snapResult.angleDeg, isOrthogonal: snapResult.isOrthogonal });
      }
    } else {
      setCursorPos(currentSnapTarget ? currentSnapTarget.pt : rawSnapped);
      setSnappedAngleInfo(null);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setActiveCalibHandleDrag(null);
    if (componentDragState) {
      if (componentDragState.hasMoved) {
        onUpdateFloor((prev) => ({ ...prev }), true);
      }
      setComponentDragState(null);
    }
    if (openingDragState) {
      if (openingDragState.hasMoved) {
        onUpdateFloor((prev) => ({ ...prev }), true);
      }
      setOpeningDragState(null);
    }
    if (wallDragState) {
      if (wallDragState.hasMoved) {
        onUpdateFloor((prev) => {
          const resolved = resolveAllFloorWallIntersections(prev);
          return resolved;
        }, true);
      }
      setWallDragState(null);
      setSnappedAngleInfo(null);
    }
    if (zoneDragState) {
      if (zoneDragState.hasMoved) {
        onUpdateFloor((prev) => ({ ...prev }), true);
      }
      setZoneDragState(null);
    }
    if (zoneDrawState) {
      const targetWall = floor.walls.find((w) => w.id === zoneDrawState.wallId);
      if (targetWall) {
        const wdx = targetWall.end.x - targetWall.start.x;
        const wdy = targetWall.end.y - targetWall.start.y;
        const wLen = Math.hypot(wdx, wdy);
        const s = Math.min(zoneDrawState.startDist, zoneDrawState.currentDist);
        const e = Math.max(zoneDrawState.startDist, zoneDrawState.currentDist);
        let len = Number((e - s).toFixed(2));
        let finalStart = s;
        if (len < 0.2) {
          if (zoneDrawState.type === 'zvs') {
            len = Math.min(2.4, Number((wLen - finalStart).toFixed(2)));
            if (len < 1.0) {
              finalStart = Math.max(0, wLen - 2.4);
              len = Math.min(2.4, wLen);
            }
          } else if (zoneDrawState.type === 'zvz') {
            len = 0.20;
          } else {
            len = Math.min(1.5, Number((wLen - finalStart).toFixed(2)));
          }
        }

        const newZones = addWallZoneSegment(
          zoneDrawState.wallId,
          finalStart,
          len,
          zoneDrawState.type,
          floor
        );
        const createdZone = newZones[newZones.length - 1];
        onUpdateFloor((prev) => ({
          ...prev,
          installationZones: newZones,
        }), true);
        if (createdZone) {
          setEffectiveSelectedZoneId(createdZone.id);
        }
      }
      setZoneDrawState(null);
    }
  };

  // SOLIDWORKS STYLE CURSOR-CENTERED ZOOM
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - pan.x) / scale;
    const worldY = (mouseY - pan.y) / scale;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.max(10, Math.min(600, scale * zoomFactor));

    const newPanX = mouseX - worldX * newScale;
    const newPanY = mouseY - worldY * newScale;

    setScale(newScale);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleFinishManualRoute = () => {
    if (!selectedComponent) return;
    setIsManualRouting(false);
  };

  // Calibrates blueprint underlay dimensions based on drawn measurement line on blueprint dimension
  const handleApplyCalibration = (targetLengthMeters: number, rescaleAll: boolean = true) => {
    if (!calibStart || !calibEnd) return;
    if (targetLengthMeters <= 0.05) return;

    const measuredLength = Math.hypot(calibEnd.x - calibStart.x, calibEnd.y - calibStart.y);
    if (measuredLength <= 0.02) return;

    const factor = targetLengthMeters / measuredLength;
    const anchor = calibStart;

    onUpdateFloor((prev) => {
      if (!prev.blueprintUnderlay) return prev;

      const oldUnderlay = prev.blueprintUnderlay;
      const oldUx = oldUnderlay.x || 0;
      const oldUy = oldUnderlay.y || 0;

      const newWidth = Number((oldUnderlay.widthMeters * factor).toFixed(3));
      const newHeight = Number((oldUnderlay.heightMeters * factor).toFixed(3));
      const newUx = Number((anchor.x + (oldUx - anchor.x) * factor).toFixed(3));
      const newUy = Number((anchor.y + (oldUy - anchor.y) * factor).toFixed(3));

      const newWalls = rescaleAll
        ? prev.walls.map((w) => ({
            ...w,
            start: {
              x: Number((anchor.x + (w.start.x - anchor.x) * factor).toFixed(2)),
              y: Number((anchor.y + (w.start.y - anchor.y) * factor).toFixed(2)),
            },
            end: {
              x: Number((anchor.x + (w.end.x - anchor.x) * factor).toFixed(2)),
              y: Number((anchor.y + (w.end.y - anchor.y) * factor).toFixed(2)),
            },
          }))
        : prev.walls;

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
          referenceWallLength: targetLengthMeters,
        },
        walls: newWalls,
        components: newComponents,
      };
    });

    setCalibStart(null);
    setCalibEnd(null);
    setCalibActive(false);
    setCalibrationSuccessToast(
      `Mierka podkladu bola úspešne prispôsobená podľa kóty: ${targetLengthMeters.toFixed(2)} m (faktor: ${factor.toFixed(3)}x).`
    );
    setTimeout(() => setCalibrationSuccessToast(null), 5000);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-slate-900 overflow-hidden select-none ${
        isPanning
          ? 'cursor-grabbing'
          : activeCalibHandleDrag
          ? 'cursor-grabbing'
          : isCalibActive
          ? 'cursor-crosshair'
          : wallDragState?.mode === 'wall'
          ? 'cursor-grabbing'
          : wallDragState?.mode === 'start' || wallDragState?.mode === 'end'
          ? 'cursor-crosshair'
          : activeTool === 'wall' || activeTool.startsWith('zone_')
          ? 'cursor-crosshair'
          : 'cursor-default'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 1-CLICK 2D / 3D TOGGLE BUTTON */}
      {onSwitchTo3D && (
        <div
          className="absolute top-4 right-4 z-20 flex items-center gap-2 no-canvas-click"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={onSwitchTo3D}
            className="px-3.5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl shadow-sky-500/25 border border-sky-400/40 transition active:scale-95"
            title="Okamžitý prepínač do 3D pohľadu"
          >
            <Box className="w-4 h-4" />
            <span>Prepnúť do 3D pohľadu</span>
          </button>
        </div>
      )}

      {/* Floating Canvas Controls & SolidWorks Mouse Hint */}
      <div
        className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-800/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 shadow-xl no-canvas-click"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span className="font-semibold text-sky-400 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5" /> 2D Pôdorys
        </span>
        <span className="text-slate-500">|</span>
        <span>X: {cursorPos.x.toFixed(2)} m, Y: {cursorPos.y.toFixed(2)} m</span>
        <span className="text-slate-500">|</span>
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <Magnet className="w-3 h-3 text-emerald-400" /> Auto-snap 90° aktívny
        </span>

        <button
          onClick={() => setShowZones(!showZones)}
          className={`ml-2 px-2 py-1 rounded flex items-center gap-1 transition ${
            showZones ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-slate-700 text-slate-400'
          }`}
          title="Zobraziť normové inštalačné zóny v stenách podľa STN 33 2130"
        >
          {showZones ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          STN Zóny
        </button>

        <button
          onClick={() => setShowCableRoutes(!showCableRoutes)}
          className={`px-2 py-1 rounded flex items-center gap-1 transition ${
            showCableRoutes ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-700 text-slate-400'
          }`}
          title="Zobraziť trasy káblov k rozvádzaču"
        >
          {showCableRoutes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          Trasy káblov
        </button>

        <button
          onClick={() => {
            setScale(65);
            setPan({ x: 180, y: 120 });
          }}
          className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
        >
          Vycentrovať
        </button>

        {/* Blueprint Underlay Calibration Button */}
        {floor.blueprintUnderlay && (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (isCalibActive) {
                setCalibStart(null);
                setCalibEnd(null);
                setCalibActive(false);
              } else {
                setCalibActive(true);
              }
            }}
            className={`ml-1 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95 ${
              isCalibActive
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/60 font-black'
                : 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40'
            }`}
            title="Prispôsobiť mierku podkladu natiahnutím čiary na kótu výkresu"
          >
            <Ruler className="w-3.5 h-3.5 text-amber-400" />
            <span>{isCalibActive ? 'Ukončiť meranie kóty' : 'Kalibrovať mierku z kóty'}</span>
          </button>
        )}
      </div>

      {/* Step 3: Interactive In-Canvas STN Guidance Bar */}
      {currentStep === 3 && (
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-teal-500/50 shadow-2xl text-xs text-slate-200 no-canvas-click select-none"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 border-r border-slate-800 pr-3">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse"></span>
            <span className="font-bold text-teal-300">STN 33 2130 Zóny:</span>
          </div>

          <span className="text-slate-300">
            {activeTool === 'select'
              ? '💡 Kliknite na zónu pre úpravu. Potiahnutím za stred zónu presuniete, za modré okraje zmeníte rozmer.'
              : activeTool === 'zone_kitchen'
              ? '💡 Kliknite a ťahajte po stene pre vyznačenie linky len na požadovanom úseku (napr. 2.4 m).'
              : activeTool === 'zone_segment'
              ? '💡 Kliknite a ťahajte po stene pre vymedzenie úseku zóny.'
              : 'Zakreslite inštalačné zóny podľa normy STN.'}
          </span>

          {onOpenZoneGuide && (
            <button
              onClick={onOpenZoneGuide}
              className="ml-2 px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/50 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95 shrink-0"
              title="Otvoriť podrobného sprievodcu normou STN 33 2130 a návod ako umiestňovať zóny"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Návod STN</span>
            </button>
          )}
        </div>
      )}

      {/* Calibration Success Toast */}
      {calibrationSuccessToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-emerald-950/95 text-emerald-200 border border-emerald-500/60 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{calibrationSuccessToast}</span>
        </div>
      )}

      {/* 📐 NON-BLOCKING FLOATING PANEL: KALIBRÁCIA MIERKY Z KÓTY VÝKRESU */}
      {(isCalibActive || calibStart !== null) && (() => {
        const measuredDistM = calibStart && calibEnd
          ? Math.hypot(calibEnd.x - calibStart.x, calibEnd.y - calibStart.y)
          : (calibStart ? Math.hypot(cursorPos.x - calibStart.x, cursorPos.y - calibStart.y) : 0);

        // Parse target length from raw input
        const rawNum = parseFloat(calibInputRaw) || 0;
        let targetLengthMeters = calibUnit === 'mm' ? rawNum / 1000 : rawNum;
        if (calibUnit === 'm' && rawNum >= 50) {
          targetLengthMeters = rawNum / 1000;
        } else if (calibUnit === 'mm' && rawNum > 0 && rawNum < 20) {
          targetLengthMeters = rawNum;
        }

        const scaleFactor = measuredDistM > 0.05 && targetLengthMeters > 0.05
          ? targetLengthMeters / measuredDistM
          : 1.0;

        return (
          <div
            className="absolute z-40 pointer-events-auto select-none no-canvas-click"
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              top: calibPanelPos ? `${calibPanelPos.y}px` : '75px',
              left: calibPanelPos ? `${calibPanelPos.x}px` : undefined,
              right: calibPanelPos ? undefined : '20px',
            }}
          >
            {isCalibMinimized ? (
              /* Minimized Floating Pill */
              <div className="bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-amber-500/60 shadow-2xl flex items-center gap-3 text-xs">
                <div
                  className="flex items-center gap-2 cursor-move"
                  onMouseDown={handleCalibTitleMouseDown}
                  title="Potiahnutím presuniete panel"
                >
                  <GripHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <Ruler className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-slate-200">
                    Kóta: {measuredDistM > 0 ? `${measuredDistM.toFixed(2)} m` : 'Merač'}
                  </span>
                </div>
                <button
                  onClick={() => setIsCalibMinimized(false)}
                  className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[11px] font-semibold transition"
                  title="Rozbaliť panel kalibrácie"
                >
                  Rozbaliť ▾
                </button>
                <button
                  onClick={() => {
                    setCalibStart(null);
                    setCalibEnd(null);
                    setCalibActive(false);
                  }}
                  className="text-slate-400 hover:text-white px-1 text-sm font-bold"
                  title="Zavrieť"
                >
                  ✕
                </button>
              </div>
            ) : (
              /* Full Floating Draggable Card */
              <div className="bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-amber-500/60 shadow-2xl w-88 max-w-sm flex flex-col gap-3">
                {/* Header with drag handle and window controls */}
                <div
                  className="flex items-center justify-between border-b border-slate-800 pb-2.5 cursor-move"
                  onMouseDown={handleCalibTitleMouseDown}
                  title="Potiahnutím presuniete panel kamkoľvek na obrazovke"
                >
                  <div className="flex items-center gap-2">
                    <GripHorizontal className="w-4 h-4 text-slate-500 hover:text-slate-300 transition" />
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                      <Ruler className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                        <span>Kalibrácia mierky z kóty</span>
                      </h3>
                      <span className="text-[10px] text-amber-400 font-mono">
                        {!calibStart
                          ? '1. Kliknite na začiatok kóty na výkrese'
                          : !calibEnd
                          ? '2. Kliknite na koncový bod kóty'
                          : '✓ Kóta zmeraná, zadajte rozmer'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsCalibMinimized(true)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                      title="Minimalizovať okno"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setCalibStart(null);
                        setCalibEnd(null);
                        setCalibActive(false);
                      }}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition font-bold text-xs"
                      title="Zavrieť (ESC)"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Instructions / Status card */}
                <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Namerané v CADe:</span>
                    <span className="text-amber-300 font-mono font-bold text-xs">
                      {measuredDistM > 0
                        ? `${measuredDistM.toFixed(2)} m (${Math.round(measuredDistM * 1000)} mm)`
                        : 'Čaká na kliknutie'}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 leading-normal">
                    {!calibStart
                      ? 'Kliknite ľavým tlačidlom na začiatok kóty (šípku) na podklade.'
                      : !calibEnd
                      ? 'Kliknite na koncový bod kóty. Pomocná vodiaca čiara sa automaticky prichytáva na 90° uhol.'
                      : 'Body A a B môžete na výkrese dodatočne presne posunúť potiahnutím myšou.'}
                  </p>
                </div>

                {/* Real dimension input with mm / m selector */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-xs">Skutočná dĺžka z výkresu:</span>
                    {/* Unit toggle mm / m */}
                    <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-700 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          if (calibUnit !== 'mm') {
                            setCalibUnit('mm');
                            setCalibInputRaw(Math.round(targetLengthMeters * 1000).toString());
                          }
                        }}
                        className={`px-2 py-0.5 rounded transition ${
                          calibUnit === 'mm' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        mm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (calibUnit !== 'm') {
                            setCalibUnit('m');
                            setCalibInputRaw(targetLengthMeters.toFixed(2));
                          }
                        }}
                        className={`px-2 py-0.5 rounded transition ${
                          calibUnit === 'm' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        m
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step={calibUnit === 'mm' ? '10' : '0.05'}
                      min="0.1"
                      value={calibInputRaw}
                      onChange={(e) => setCalibInputRaw(e.target.value)}
                      placeholder={calibUnit === 'mm' ? '3800' : '3.80'}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && calibStart && calibEnd && targetLengthMeters > 0.05) {
                          handleApplyCalibration(targetLengthMeters, calibRescaleAll);
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2.5 text-slate-100 font-mono font-bold text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-right"
                    />
                    <span className="text-amber-400 font-mono font-bold text-xs">{calibUnit}</span>
                  </div>

                  {/* Realtime Scale Factor Info */}
                  {measuredDistM > 0.05 && targetLengthMeters > 0.05 && (
                    <div className="flex items-center justify-between text-[10.5px] bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
                      <span className="text-slate-400">Korekčný faktor mierky:</span>
                      <span className="font-mono font-bold text-amber-300">
                        {scaleFactor.toFixed(3)}x ({targetLengthMeters.toFixed(2)} m / {measuredDistM.toFixed(2)} m)
                      </span>
                    </div>
                  )}

                  {/* Quick Preset Buttons for Common Dimensions */}
                  <div className="grid grid-cols-5 gap-1 pt-1 text-[10px] font-mono">
                    {['1200', '2000', '3000', '3800', '5000'].map((presetMm) => (
                      <button
                        key={presetMm}
                        type="button"
                        onClick={() => {
                          if (calibUnit === 'mm') {
                            setCalibInputRaw(presetMm);
                          } else {
                            setCalibInputRaw((parseFloat(presetMm) / 1000).toFixed(2));
                          }
                        }}
                        className="py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-center transition"
                      >
                        {calibUnit === 'mm' ? presetMm : (parseFloat(presetMm) / 1000).toFixed(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checkbox: Rescale existing walls and components */}
                <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer px-1">
                  <input
                    type="checkbox"
                    checked={calibRescaleAll}
                    onChange={(e) => setCalibRescaleAll(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0 bg-slate-950"
                  />
                  <span>Prispôsobiť aj nakreslené steny a rozvody</span>
                </label>

                {/* Checkbox: Ortho 90° snapping */}
                <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer px-1">
                  <input
                    type="checkbox"
                    checked={calibOrtho}
                    onChange={(e) => setCalibOrtho(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0 bg-slate-950"
                  />
                  <span>Automaticky snapnúť na 90° uhol (Shift = voľný uhol)</span>
                </label>

                {/* Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setCalibStart(null);
                      setCalibEnd(null);
                    }}
                    className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs rounded-lg transition"
                    title="Vymazať čiaru a zmerať znova"
                  >
                    Nové meranie
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCalibStart(null);
                        setCalibEnd(null);
                        setCalibActive(false);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
                    >
                      Zrušiť
                    </button>
                    <button
                      type="button"
                      disabled={!calibStart || !calibEnd || targetLengthMeters <= 0.05}
                      onClick={() => handleApplyCalibration(targetLengthMeters, calibRescaleAll)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold text-xs rounded-lg transition shadow-md shadow-amber-500/25 active:scale-95 flex items-center gap-1.5"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>Použiť kalibráciu</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Empty Scene Helpful Prompt if no walls exist */}
      {floor.walls.length === 0 && !floor.blueprintUnderlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/80 text-center max-w-md shadow-2xl pointer-events-auto">
            <div className="text-sky-400 font-bold text-base mb-1">Prázdna scéna – Začnite kresliť</div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Klikaním ľavým tlačidlom myši začnite kresliť steny budovy. Automatický snap na <strong>90° uhol</strong> zarovnáva steny presne vodorovne a zvisle.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-[11px] text-slate-300">
              <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700 font-mono">
                Koliesko (MMB): Posun
              </span>
              <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700 font-mono">
                ESC: Zruší segment
              </span>
              <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700 font-mono">
                Del: Zmaže prvok
              </span>
              <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700 font-mono">
                Ctrl+Z: Krok späť
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Shortcuts Status Bar */}
      <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 shadow-xl select-none pointer-events-none">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-200 font-mono font-bold">Del</kbd>
          <span>Zmazať označené</span>
        </span>
        <span className="text-slate-700">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-200 font-mono font-bold">Ctrl+Z</kbd>
          <span>Krok späť</span>
        </span>
        <span className="text-slate-700">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-200 font-mono font-bold">Ctrl+Y</kbd>
          <span>Krok vpred</span>
        </span>
        <span className="text-slate-700">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-200 font-mono font-bold">ESC</kbd>
          <span>Zrušiť kreslenie</span>
        </span>
        <span className="text-slate-700">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-sky-300 font-mono font-bold">Ťahanie steny</kbd>
          <span>Stred = celá stena | Body = dĺžka a uhol</span>
        </span>
      </div>

      {/* MANUAL ROUTING MODE BANNER */}
      {isManualRouting && selectedComponent && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-emerald-950/95 backdrop-blur-md px-5 py-3 rounded-2xl border border-emerald-500/50 text-xs text-emerald-200 shadow-2xl">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div>
              <div className="font-bold text-emerald-100">Režim manuálneho trasovania: {selectedComponent.label}</div>
              <div className="text-[11px] text-emerald-300/80">
                Klikaním do výkresu zadávate lomové body trasy kábla podľa inštalačných zón STN. (ESC pre zrušenie)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFinishManualRoute}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition"
            >
              Dokončiť trasu ({manualWaypoints.length} bodov)
            </button>
            <button
              onClick={() => {
                setIsManualRouting(false);
                setManualWaypoints([]);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            >
              Zrušiť
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE LINKING MODE BANNER (Step 4 & 7) */}
      {isLinkingMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-amber-950/95 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-amber-500/60 text-xs text-amber-200 shadow-2xl">
          <GitFork className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>
            <strong>Režim párovania vypínačov so svietidlami:</strong> Klikajte na svietidlá na plátne pre ich priradenie k vypínaču. Ak k rovnakému svetlu priradíte 2+ vypínače, vytvorí sa <strong>schodiskové zapojenie (Radenie 6+6 / 6+7+6)</strong>.
          </span>
          {onToggleLinkingMode && (
            <button
              onClick={onToggleLinkingMode}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition shrink-0"
            >
              Hotovo
            </button>
          )}
        </div>
      )}

      {/* SVG Canvas Layer - Always fills 100% of viewport without clipping */}
      <svg
        className="w-full h-full block"
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <defs>
          <pattern id="cadGrid" width={scale} height={scale} patternUnits="userSpaceOnUse">
            <path d={`M ${scale} 0 L 0 0 0 ${scale}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <path
              d={`M ${scale / 2} 0 L 0 0 0 ${scale / 2}`}
              fill="none"
              stroke="rgba(255,255,255,0.02)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>

        {/* Viewport Root: Pans all world graphics without viewport boundary clipping */}
        <g id="cad-viewport-root" transform={`translate(${pan.x}, ${pan.y})`}>
          {/* Infinite Grid Background */}
          <rect x="-50000" y="-50000" width="100000" height="100000" fill="url(#cadGrid)" />

          {/* Origin axes */}
          <line x1="0" y1="-50000" x2="0" y2="50000" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="-50000" y1="0" x2="50000" y2="0" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1" strokeDasharray="4 4" />

          {/* 0. BLUEPRINT PDF UNDERLAY */}
          {floor.blueprintUnderlay && (
            <image
              href={floor.blueprintUnderlay.imageUrl}
              x={(floor.blueprintUnderlay.x || 0) * scale}
              y={(floor.blueprintUnderlay.y || 0) * scale}
              width={floor.blueprintUnderlay.widthMeters * scale}
              height={floor.blueprintUnderlay.heightMeters * scale}
              opacity={
                floor.blueprintUnderlay.opacity > 1
                  ? floor.blueprintUnderlay.opacity / 100
                  : (floor.blueprintUnderlay.opacity ?? 0.5)
              }
              preserveAspectRatio="none"
              style={{ pointerEvents: 'none' }}
            />
          )}

        {/* 1. ROOMS (Floor areas) */}
        {floor.rooms.map((room) => {
          const pointsStr = room.points.map((p) => `${p.x * scale},${p.y * scale}`).join(' ');
          const centroidX = room.points.reduce((sum, p) => sum + p.x, 0) / room.points.length;
          const centroidY = room.points.reduce((sum, p) => sum + p.y, 0) / room.points.length;
          const isBathroom = room.type === 'bathroom';

          return (
            <g key={room.id}>
              <polygon
                points={pointsStr}
                fill={isBathroom ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.03)'}
                stroke={isBathroom ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.08)'}
                strokeWidth="1"
              />
              <text
                x={centroidX * scale}
                y={centroidY * scale - 10}
                fill="rgba(255, 255, 255, 0.4)"
                fontSize="13"
                fontWeight="bold"
                textAnchor="middle"
              >
                {room.name}
              </text>
              <text
                x={centroidX * scale}
                y={centroidY * scale + 10}
                fill="rgba(255, 255, 255, 0.25)"
                fontSize="11"
                textAnchor="middle"
              >
                {room.areaM2.toFixed(1)} m²
              </text>
            </g>
          );
        })}

        {/* 1.5 INSTALLATION ZONES (STN 33 2130 & STN 33 2000-7-701) */}
        {(showZones || currentStep === 3) && (
          <g id="stn-installation-zones-layer">
            {/* A. Wall-based Installation Zones (Rendered per zone with individual sub-segment dimensions) */}
            {floor.installationZones
              ?.filter((z) => z.wallId)
              .map((zone) => {
                const wall = floor.walls.find((w) => w.id === zone.wallId);
                if (!wall) return null;
                const dx = wall.end.x - wall.start.x;
                const dy = wall.end.y - wall.start.y;
                const wallLen = Math.hypot(dx, dy);
                if (wallLen < 0.2) return null;

                const ux = dx / wallLen;
                const uy = dy / wallLen;
                const nx = -uy;
                const ny = ux;

                const hT = (wall.thickness || defaultWallThickness || 0.15) / 2;
                const zWidth = zone.widthMeters || 0.30;
                const sDist = Math.max(0, Math.min(wallLen - 0.1, zone.distanceFromStartMeters ?? 0));
                const zLen = Math.max(0.1, Math.min(wallLen - sDist, zone.lengthMeters ?? (wallLen - sDist)));
                const eDist = sDist + zLen;
                const midDist = (sDist + eDist) / 2;

                const isSelected = zone.id === activeSelectedZoneId;
                const isKitchen = zone.type === 'zvs';
                const isVertical = zone.type === 'zvz' || zone.type === 'zvr';

                const zoneColor = zone.color || (isKitchen ? '#f59e0b' : isVertical ? '#34d399' : '#38bdf8');
                const fillColor = isKitchen
                  ? 'rgba(245, 158, 11, 0.22)'
                  : isVertical
                  ? 'rgba(52, 211, 153, 0.22)'
                  : 'rgba(56, 189, 248, 0.18)';

                // Segment points on wall axis
                const sPt = { x: wall.start.x + ux * sDist, y: wall.start.y + uy * sDist };
                const ePt = { x: wall.start.x + ux * eDist, y: wall.start.y + uy * eDist };
                const midPt = { x: wall.start.x + ux * midDist, y: wall.start.y + uy * midDist };

                const side = zone.side || 'both';
                const showLeft = side === 'both' || side === 'left';
                const showRight = side === 'both' || side === 'right';

                // Left polygon (in pixels)
                const p1Lx = (sPt.x + nx * hT) * scale;
                const p1Ly = (sPt.y + ny * hT) * scale;
                const p2Lx = (ePt.x + nx * hT) * scale;
                const p2Ly = (ePt.y + ny * hT) * scale;
                const p3Lx = (ePt.x + nx * (hT + zWidth)) * scale;
                const p3Ly = (ePt.y + ny * (hT + zWidth)) * scale;
                const p4Lx = (sPt.x + nx * (hT + zWidth)) * scale;
                const p4Ly = (sPt.y + ny * (hT + zWidth)) * scale;

                // Right polygon (in pixels)
                const p1Rx = (sPt.x - nx * hT) * scale;
                const p1Ry = (sPt.y - ny * hT) * scale;
                const p2Rx = (ePt.x - nx * hT) * scale;
                const p2Ry = (ePt.y - ny * hT) * scale;
                const p3Rx = (ePt.x - nx * (hT + zWidth)) * scale;
                const p3Ry = (ePt.y - ny * (hT + zWidth)) * scale;
                const p4Rx = (sPt.x - nx * (hT + zWidth)) * scale;
                const p4Ry = (sPt.y - ny * (hT + zWidth)) * scale;

                const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

                return (
                  <g
                    key={`inst-zone-${zone.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEffectiveSelectedZoneId(zone.id);
                      onSelectWall(undefined);
                      onSelectComponent(undefined);
                      if (onSelectOpening) onSelectOpening(undefined);
                    }}
                    className="cursor-pointer"
                  >
                    {/* Left Strip */}
                    {showLeft && (
                      <polygon
                        points={`${p1Lx},${p1Ly} ${p2Lx},${p2Ly} ${p3Lx},${p3Ly} ${p4Lx},${p4Ly}`}
                        fill={fillColor}
                        stroke={isSelected ? '#38bdf8' : zoneColor}
                        strokeWidth={isSelected ? 2.5 : 1}
                        strokeDasharray={isSelected ? 'none' : '4 3'}
                        className="transition-colors hover:opacity-90"
                      />
                    )}

                    {/* Right Strip */}
                    {showRight && (
                      <polygon
                        points={`${p1Rx},${p1Ry} ${p2Rx},${p2Ry} ${p3Rx},${p3Ry} ${p4Rx},${p4Ry}`}
                        fill={fillColor}
                        stroke={isSelected ? '#38bdf8' : zoneColor}
                        strokeWidth={isSelected ? 2.5 : 1}
                        strokeDasharray={isSelected ? 'none' : '4 3'}
                        className="transition-colors hover:opacity-90"
                      />
                    )}

                    {/* Label Badge on Zone */}
                    <g
                      transform={`translate(${midPt.x * scale}, ${midPt.y * scale}) rotate(${
                        angleDeg > 90 || angleDeg < -90 ? angleDeg + 180 : angleDeg
                      })`}
                    >
                      <rect
                        x="-45"
                        y={-hT * scale - 14}
                        width="90"
                        height="13"
                        rx="3.5"
                        fill={isSelected ? '#0284c7' : isKitchen ? 'rgba(245, 158, 11, 0.9)' : 'rgba(15, 23, 42, 0.88)'}
                        stroke={zoneColor}
                        strokeWidth="0.8"
                      />
                      <text
                        x="0"
                        y={-hT * scale - 5}
                        fill={isSelected ? '#ffffff' : isKitchen ? '#020617' : zoneColor}
                        fontSize="8"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {isKitchen ? `ZVS Linka ${zLen.toFixed(1)}m` : `${zone.type.toUpperCase()} ${zLen.toFixed(1)}m`}
                      </text>
                    </g>

                    {/* Interactive Drag & Resize Handles when Selected */}
                    {isSelected && (
                      <g className="zone-handles select-none">
                        {/* 1. Center Move Handle / Badge */}
                        <g
                          transform={`translate(${midPt.x * scale}, ${midPt.y * scale}) rotate(${
                            angleDeg > 90 || angleDeg < -90 ? angleDeg + 180 : angleDeg
                          })`}
                          className="cursor-move"
                          onMouseDown={(e) => handleStartZoneDrag(zone, 'move', e)}
                        >
                          <rect
                            x="-58"
                            y={hT * scale + 4}
                            width="116"
                            height="18"
                            rx="5"
                            fill="#0284c7"
                            stroke="#ffffff"
                            strokeWidth="1.2"
                            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                          />
                          <text
                            x="0"
                            y={hT * scale + 16}
                            fill="#ffffff"
                            fontSize="9"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            ✥ Posunúť: {zLen.toFixed(2)}m (od {sDist.toFixed(2)}m)
                          </text>
                        </g>

                        {/* 2. Start Resize Handle */}
                        <g
                          transform={`translate(${sPt.x * scale}, ${sPt.y * scale})`}
                          className="cursor-ew-resize"
                          onMouseDown={(e) => handleStartZoneDrag(zone, 'start', e)}
                        >
                          <title>Potiahnite pre zmenu začiatku a rozmeru zóny</title>
                          <circle r="9" fill="#0284c7" stroke="#ffffff" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))" />
                          <circle r="3.5" fill="#ffffff" />
                        </g>

                        {/* 3. End Resize Handle */}
                        <g
                          transform={`translate(${ePt.x * scale}, ${ePt.y * scale})`}
                          className="cursor-ew-resize"
                          onMouseDown={(e) => handleStartZoneDrag(zone, 'end', e)}
                        >
                          <title>Potiahnite pre zmenu dĺžky zóny</title>
                          <circle r="9" fill="#0284c7" stroke="#ffffff" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))" />
                          <circle r="3.5" fill="#ffffff" />
                        </g>
                      </g>
                    )}
                  </g>
                );
              })}

            {/* Ghost guidelines for walls with no zones yet during Step 3 */}
            {currentStep === 3 &&
              floor.walls.map((wall) => {
                const hasZone = floor.installationZones?.some((z) => z.wallId === wall.id);
                if (hasZone) return null;
                const dx = wall.end.x - wall.start.x;
                const dy = wall.end.y - wall.start.y;
                const len = Math.hypot(dx, dy);
                if (len < 0.2) return null;
                const ux = dx / len;
                const uy = dy / len;
                const nx = -uy;
                const ny = ux;
                const hT = (wall.thickness || defaultWallThickness || 0.15) / 2;
                const zWidth = 0.30;

                const p1Lx = (wall.start.x + nx * (hT + zWidth / 2)) * scale;
                const p1Ly = (wall.start.y + ny * (hT + zWidth / 2)) * scale;
                const p2Lx = (wall.end.x + nx * (hT + zWidth / 2)) * scale;
                const p2Ly = (wall.end.y + ny * (hT + zWidth / 2)) * scale;

                return (
                  <g key={`wall-ghost-${wall.id}`} className="pointer-events-none opacity-30">
                    <line
                      x1={p1Lx}
                      y1={p1Ly}
                      x2={p2Lx}
                      y2={p2Ly}
                      stroke="#2dd4bf"
                      strokeWidth="1"
                      strokeDasharray="4 6"
                    />
                  </g>
                );
              })}

            {/* Live preview for zone segment drawing in progress */}
            {zoneDrawState && (() => {
              const wall = floor.walls.find((w) => w.id === zoneDrawState.wallId);
              if (!wall) return null;
              const dx = wall.end.x - wall.start.x;
              const dy = wall.end.y - wall.start.y;
              const wallLen = Math.hypot(dx, dy);
              if (wallLen < 0.1) return null;
              const ux = dx / wallLen;
              const uy = dy / wallLen;
              const nx = -uy;
              const ny = ux;
              const hT = (wall.thickness || defaultWallThickness || 0.15) / 2;
              const zWidth = 0.30;
              const sDist = Math.min(zoneDrawState.startDist, zoneDrawState.currentDist);
              const eDist = Math.max(zoneDrawState.startDist, zoneDrawState.currentDist);
              const drawnLen = Math.abs(eDist - sDist);

              const sPt = { x: wall.start.x + ux * sDist, y: wall.start.y + uy * sDist };
              const ePt = { x: wall.start.x + ux * eDist, y: wall.start.y + uy * eDist };
              const midPt = { x: (sPt.x + ePt.x) / 2, y: (sPt.y + ePt.y) / 2 };

              const p1Lx = (sPt.x + nx * hT) * scale;
              const p1Ly = (sPt.y + ny * hT) * scale;
              const p2Lx = (ePt.x + nx * hT) * scale;
              const p2Ly = (ePt.y + ny * hT) * scale;
              const p3Lx = (ePt.x + nx * (hT + zWidth)) * scale;
              const p3Ly = (ePt.y + ny * (hT + zWidth)) * scale;
              const p4Lx = (sPt.x + nx * (hT + zWidth)) * scale;
              const p4Ly = (sPt.y + ny * (hT + zWidth)) * scale;

              return (
                <g className="pointer-events-none">
                  <polygon
                    points={`${p1Lx},${p1Ly} ${p2Lx},${p2Ly} ${p3Lx},${p3Ly} ${p4Lx},${p4Ly}`}
                    fill="rgba(245, 158, 11, 0.35)"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  {/* Floating Dimension Tag */}
                  <g transform={`translate(${midPt.x * scale}, ${midPt.y * scale - 25})`}>
                    <rect
                      x="-70"
                      y="-12"
                      width="140"
                      height="24"
                      rx="6"
                      fill="rgba(15, 23, 42, 0.95)"
                      stroke="#f59e0b"
                      strokeWidth="1.2"
                    />
                    <text x="0" y="4" fill="#fbbf24" fontSize="10" fontWeight="bold" textAnchor="middle">
                      {zoneDrawState.type === 'zvs' ? '🍳 Linka' : 'Úsek'}: {drawnLen.toFixed(2)} m (od {sDist.toFixed(2)} m)
                    </text>
                  </g>
                </g>
              );
            })()}

            {/* B. Room-based and Custom Installation Zones (Bathrooms, Corridors) */}
            {floor.installationZones
              ?.filter((z) => !z.wallId)
              .map((zone) => {
                const isSelected = zone.id === activeSelectedZoneId;

                // Bathroom Safety Zone
                if (zone.type === 'bathroom' && zone.center && zone.dimensions) {
                  const isZone01 = zone.subType === '0';
                  const rx = (zone.center.x - zone.dimensions.width / 2) * scale;
                  const ry = (zone.center.y - zone.dimensions.height / 2) * scale;
                  const rw = zone.dimensions.width * scale;
                  const rh = zone.dimensions.height * scale;

                  return (
                    <g
                      key={zone.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEffectiveSelectedZoneId(zone.id);
                        onSelectWall(undefined);
                        onSelectComponent(undefined);
                        if (onSelectOpening) onSelectOpening(undefined);
                      }}
                      className="cursor-pointer"
                    >
                      <rect
                        x={rx}
                        y={ry}
                        width={rw}
                        height={rh}
                        fill={isZone01 ? 'rgba(239, 68, 68, 0.18)' : 'rgba(245, 158, 11, 0.12)'}
                        stroke={isSelected ? '#38bdf8' : isZone01 ? '#ef4444' : '#f59e0b'}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        strokeDasharray={isZone01 ? '4 4' : '6 3'}
                        rx={6}
                      />
                      <text
                        x={zone.center.x * scale}
                        y={isZone01 ? zone.center.y * scale : ry + 12}
                        fill={isZone01 ? '#f87171' : '#fbbf24'}
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {isZone01 ? 'Vaňa / Sprcha: Zóna 0 & 1 (ZÁKAZ 230V)' : 'Zóna 2 (Ochranný pás 60cm, min. IPX4)'}
                      </text>

                      {/* Interactive Handles when Selected */}
                      {isSelected && (
                        <g className="select-none">
                          {/* Center Move Handle */}
                          <g
                            transform={`translate(${zone.center.x * scale}, ${zone.center.y * scale})`}
                            className="cursor-move"
                            onMouseDown={(e) => handleStartZoneDrag(zone, 'area_center', e)}
                          >
                            <title>Potiahnite pre presunutie vane/sprchy</title>
                            <circle r="12" fill="#ef4444" stroke="#ffffff" strokeWidth="2" opacity="0.9" />
                            <text x="0" y="3.5" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                              ✥
                            </text>
                          </g>

                          {/* Corner Resize Handle */}
                          <g
                            transform={`translate(${rx + rw}, ${ry + rh})`}
                            className="cursor-nwse-resize"
                            onMouseDown={(e) => handleStartZoneDrag(zone, 'area_corner', e)}
                          >
                            <title>Potiahnite pre zmenu rozmeru vane/sprchy</title>
                            <circle r="8" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
                          </g>
                        </g>
                      )}
                    </g>
                  );
                }

                // Ceiling Corridor (SDK)
                if (zone.type === 'ceiling' && zone.polygon && zone.polygon.length >= 2) {
                  const [pStart, pEnd] = zone.polygon;
                  const cWidth = (zone.widthMeters || 0.4) * scale;

                  return (
                    <g
                      key={zone.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEffectiveSelectedZoneId(zone.id);
                        onSelectWall(undefined);
                        onSelectComponent(undefined);
                        if (onSelectOpening) onSelectOpening(undefined);
                      }}
                      className="cursor-pointer"
                    >
                      <line
                        x1={pStart.x * scale}
                        y1={pStart.y * scale}
                        x2={pEnd.x * scale}
                        y2={pEnd.y * scale}
                        stroke={isSelected ? '#38bdf8' : 'rgba(251, 191, 36, 0.5)'}
                        strokeWidth={cWidth}
                        strokeDasharray="8 6"
                        strokeLinecap="round"
                      />
                      <text
                        x={((pStart.x + pEnd.x) / 2) * scale}
                        y={((pStart.y + pEnd.y) / 2) * scale - cWidth / 2 - 4}
                        fill="#fbbf24"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {zone.name}
                      </text>
                    </g>
                  );
                }

                return null;
              })}

            {/* C. Live drawing preview for Ceiling Corridor in progress */}
            {activeTool === 'zone_ceiling' && ceilingZoneStart && (
              <g>
                <line
                  x1={ceilingZoneStart.x * scale}
                  y1={ceilingZoneStart.y * scale}
                  x2={cursorPos.x * scale}
                  y2={cursorPos.y * scale}
                  stroke="rgba(251, 191, 36, 0.75)"
                  strokeWidth={0.4 * scale}
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                />
                <circle
                  cx={ceilingZoneStart.x * scale}
                  cy={ceilingZoneStart.y * scale}
                  r="5"
                  fill="#fbbf24"
                />
                <text
                  x={((ceilingZoneStart.x + cursorPos.x) / 2) * scale}
                  y={((ceilingZoneStart.y + cursorPos.y) / 2) * scale - 14}
                  fill="#fbbf24"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Dĺžka koridoru: {Math.hypot(cursorPos.x - ceilingZoneStart.x, cursorPos.y - ceilingZoneStart.y).toFixed(2)} m
                </text>
              </g>
            )}

            {/* D. Live preview for Bathtub zone placement */}
            {activeTool === 'zone_bathroom' && (
              <g>
                <rect
                  x={(cursorPos.x - 0.8) * scale}
                  y={(cursorPos.y - 0.4) * scale}
                  width={1.6 * scale}
                  height={0.8 * scale}
                  fill="rgba(239, 68, 68, 0.25)"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  rx="6"
                />
                <text
                  x={cursorPos.x * scale}
                  y={cursorPos.y * scale}
                  fill="#ef4444"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Vaňa 1.6×0.8m (Kliknite pre umiestnenie)
                </text>
              </g>
            )}
          </g>
        )}

        {/* 2. CABLE ROUTES */}
        {showCableRoutes &&
          switchboard &&
          floor.components.map((comp) => {
            if (comp.type === 'switchboard') return null;

            const isSelected = comp.id === selectedComponentId;
            const startX = comp.position.x * scale;
            const startY = comp.position.y * scale;
            const targetX = switchboard.position.x * scale;
            const targetY = switchboard.position.y * scale;

            const pathColor =
              comp.pathwayPreference === 'floor'
                ? '#38bdf8'
                : comp.pathwayPreference === 'ceiling'
                ? '#fbbf24'
                : '#34d399';

            return (
              <g key={`route-line-${comp.id}`} opacity={isSelected ? 1 : 0.65}>
                <path
                  d={`M ${startX} ${startY} L ${targetX} ${startY} L ${targetX} ${targetY}`}
                  fill="none"
                  stroke={pathColor}
                  strokeWidth={isSelected ? 3 : 1.5}
                  strokeDasharray={comp.pathwayPreference === 'ceiling' ? '6 4' : 'none'}
                />
              </g>
            );
          })}

        {/* 2B. SWITCH-TO-LIGHT CONTROL RELATIONSHIP LINES (Step 4 & 7) */}
        {floor.components.map((comp) => {
          if (!comp.targetLightIds || comp.targetLightIds.length === 0) return null;
          const isSwitchSelected = comp.id === selectedComponentId;

          return comp.targetLightIds.map((lightId) => {
            const lightComp = floor.components.find((c) => c.id === lightId);
            if (!lightComp) return null;

            const sx = comp.position.x * scale;
            const sy = comp.position.y * scale;
            const lx = lightComp.position.x * scale;
            const ly = lightComp.position.y * scale;
            const isLightSelected = lightComp.id === selectedComponentId;
            const isHighlighted = isSwitchSelected || isLightSelected || isLinkingMode;

            // Curve calculation
            const midX = (sx + lx) / 2;
            const midY = (sy + ly) / 2;
            const dx = lx - sx;
            const dy = ly - sy;
            const ctrlX = midX - dy * 0.18;
            const ctrlY = midY + dx * 0.18;

            return (
              <g key={`ctrl-line-${comp.id}-${lightId}`} opacity={isHighlighted ? 1 : 0.75}>
                <path
                  d={`M ${sx} ${sy} Q ${ctrlX} ${ctrlY} ${lx} ${ly}`}
                  fill="none"
                  stroke={isHighlighted ? '#f59e0b' : '#d97706'}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  strokeDasharray="5 3"
                />
                <circle cx={ctrlX} cy={ctrlY} r="3.5" fill={isHighlighted ? '#f59e0b' : '#d97706'} />
              </g>
            );
          });
        })}

        {/* CORNER JOINTS FOR CONNECTED WALLS */}
        {(() => {
          const vertexMap = new Map<string, { count: number; x: number; y: number; thickness: number }>();
          floor.walls.forEach((w) => {
            const kStart = `${w.start.x.toFixed(2)},${w.start.y.toFixed(2)}`;
            const kEnd = `${w.end.x.toFixed(2)},${w.end.y.toFixed(2)}`;
            const t = w.thickness || defaultWallThickness || 0.15;

            const e1 = vertexMap.get(kStart) || { count: 0, x: w.start.x, y: w.start.y, thickness: 0 };
            e1.count++;
            e1.thickness = Math.max(e1.thickness, t);
            vertexMap.set(kStart, e1);

            const e2 = vertexMap.get(kEnd) || { count: 0, x: w.end.x, y: w.end.y, thickness: 0 };
            e2.count++;
            e2.thickness = Math.max(e2.thickness, t);
            vertexMap.set(kEnd, e2);
          });

          return Array.from(vertexMap.values())
            .filter((v) => v.count > 1)
            .map((v, idx) => (
              <g key={`joint-${idx}`} className="pointer-events-none">
                <circle
                  cx={v.x * scale}
                  cy={v.y * scale}
                  r={(v.thickness * scale) / 2}
                  fill="#475569"
                />
                <circle
                  cx={v.x * scale}
                  cy={v.y * scale}
                  r={Math.max(1, (v.thickness * scale - 2) / 2)}
                  fill="#64748b"
                />
              </g>
            ));
        })()}

        {/* 3. WALLS & OPENINGS */}
        {floor.walls.map((wall) => {
          const x1 = wall.start.x * scale;
          const y1 = wall.start.y * scale;
          const x2 = wall.end.x * scale;
          const y2 = wall.end.y * scale;
          const thicknessPx = Math.max(6, wall.thickness * scale);
          const isSelected = wall.id === selectedWallId;

          const dx = wall.end.x - wall.start.x;
          const dy = wall.end.y - wall.start.y;
          const nodeLength = Math.hypot(dx, dy);
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;

          const ux = nodeLength > 0.001 ? dx / nodeLength : 0;
          const uy = nodeLength > 0.001 ? dy / nodeLength : 0;
          const ownThickness = wall.thickness || defaultWallThickness || 0.15;

          // Radius extension at start & end:
          // - If connected to another wall (corner, T-junction), radius is taken from that connected wall
          //   to prevent overhang or gap!
          // - If open/standalone, radius is taken from own thickness (so total measured length = node length + priemer steny)
          const rStart = getEndpointRadius(wall.start, ownThickness, wall.id, wallStart);
          const rEnd = getEndpointRadius(wall.end, ownThickness, wall.id, wallStart);

          const renderStartX = wall.start.x - ux * rStart;
          const renderStartY = wall.start.y - uy * rStart;
          const renderEndX = wall.end.x + ux * rEnd;
          const renderEndY = wall.end.y + uy * rEnd;

          // Measured length: distance between start and end node + radii (priemer steny)
          const measuredLength = nodeLength + rStart + rEnd;

          const rx1 = renderStartX * scale;
          const ry1 = renderStartY * scale;
          const rx2 = renderEndX * scale;
          const ry2 = renderEndY * scale;

          const isBeingDragged = wallDragState?.wallId === wall.id;

          return (
            <g key={wall.id} className="group">
              {/* Attic roof slope projection polygon and STN clearance lines */}
              {wall.atticSlope?.enabled && wall.atticSlope.type !== 'gable_slope' && (() => {
                const attic = wall.atticSlope;
                const kneeH = attic.kneeWallHeight ?? 1.0;
                const ceilH = attic.ceilingHeight ?? 2.60;
                const deltaH = Math.max(0.3, ceilH - kneeH);
                const angleRad = ((attic.roofAngleDeg ?? 38) * Math.PI) / 180;
                const D = attic.slopeDepth || (deltaH / Math.tan(angleRad));

                const dir = attic.slopeDirection === 'right' ? -1 : 1;
                const nx = dir * -uy;
                const ny = dir * ux;

                // Points along wall
                const p1x = wall.start.x * scale;
                const p1y = wall.start.y * scale;
                const p2x = wall.end.x * scale;
                const p2y = wall.end.y * scale;

                // Ceiling intersection line (where slope meets flat ceiling)
                const c1x = (wall.start.x + nx * D) * scale;
                const c1y = (wall.start.y + ny * D) * scale;
                const c2x = (wall.end.x + nx * D) * scale;
                const c2y = (wall.end.y + ny * D) * scale;

                const polyPoints = `${p1x},${p1y} ${p2x},${p2y} ${c2x},${c2y} ${c1x},${c1y}`;

                return (
                  <g className="pointer-events-none opacity-90">
                    {/* Slope shaded footprint up to ceiling height */}
                    <polygon
                      points={polyPoints}
                      fill="rgba(245, 158, 11, 0.08)"
                      stroke="rgba(245, 158, 11, 0.3)"
                      strokeWidth="0.8"
                    />

                    {/* Flat ceiling boundary line (where slope reaches ceiling height) */}
                    <line
                      x1={c1x}
                      y1={c1y}
                      x2={c2x}
                      y2={c2y}
                      stroke="#f59e0b"
                      strokeWidth="1.2"
                      strokeDasharray="5 3"
                    />
                    <text
                      x={(c1x + c2x) / 2}
                      y={(c1y + c2y) / 2 - 4}
                      fill="#f59e0b"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      hrana stropu ({ceilH.toFixed(2)} m)
                    </text>

                    {/* Slope direction and roof angle tag */}
                    <text
                      x={(p1x + p2x + c1x + c2x) / 4}
                      y={(p1y + p2y + c1y + c2y) / 4 + 3}
                      fill="rgba(251, 191, 36, 0.85)"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      ▲ sklon strechy {attic.roofAngleDeg ?? 38}° po strop
                    </text>
                  </g>
                );
              })()}

              {/* Highlight selection halo */}
              {isSelected && (
                <line
                  x1={rx1}
                  y1={ry1}
                  x2={rx2}
                  y2={ry2}
                  stroke={isBeingDragged ? '#10b981' : '#38bdf8'}
                  strokeWidth={thicknessPx + 10}
                  strokeLinecap="butt"
                  opacity={0.35}
                />
              )}

              {/* Wall Body visible lines - Exact butt linecaps ensure wall length precisely matches dimensions */}
              <line
                x1={rx1}
                y1={ry1}
                x2={rx2}
                y2={ry2}
                stroke={isSelected ? '#38bdf8' : '#475569'}
                strokeWidth={thicknessPx}
                strokeLinecap="butt"
              />
              <line
                x1={rx1}
                y1={ry1}
                x2={rx2}
                y2={ry2}
                stroke={isSelected ? '#7dd3fc' : '#64748b'}
                strokeWidth={Math.max(2, thicknessPx - 2)}
                strokeLinecap="butt"
              />

              {/* STN Installation Zones inside Wall (ZVD / ZVH / ZZD) */}
              {showZones && (
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(56, 189, 248, 0.4)"
                  strokeWidth="1"
                  strokeDasharray="2 4"
                />
              )}

              {/* WIDE INTERACTIVE HIT LINE: Drag whole wall (or click to select) - Only active in select mode */}
              {activeTool === 'select' && (
                <line
                  x1={rx1}
                  y1={ry1}
                  x2={rx2}
                  y2={ry2}
                  stroke="transparent"
                  strokeWidth={Math.max(26, thicknessPx + 16)}
                  className={
                    isBeingDragged && wallDragState?.mode === 'wall'
                      ? 'cursor-grabbing'
                      : isSelected
                      ? 'cursor-grab'
                      : 'cursor-pointer'
                  }
                  onMouseDown={(e) => handleStartWallDrag(wall, 'wall', e)}
                />
              )}

              {/* Selection handles (Start, End, Mid) for dragging individual vertices or whole wall */}
              {isSelected && (
                <g>
                  {/* Start Point Handle - Dragging moves only start vertex */}
                  <g
                    className={
                      isBeingDragged && wallDragState?.mode === 'start'
                        ? 'cursor-grabbing'
                        : 'cursor-crosshair'
                    }
                    onMouseDown={(e) => handleStartWallDrag(wall, 'start', e)}
                  >
                    <circle cx={x1} cy={y1} r="15" fill="transparent" />
                    <circle
                      cx={x1}
                      cy={y1}
                      r={isBeingDragged && wallDragState?.mode === 'start' ? 8 : 6}
                      fill={isBeingDragged && wallDragState?.mode === 'start' ? '#10b981' : '#0284c7'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </g>

                  {/* End Point Handle - Dragging moves only end vertex */}
                  <g
                    className={
                      isBeingDragged && wallDragState?.mode === 'end'
                        ? 'cursor-grabbing'
                        : 'cursor-crosshair'
                    }
                    onMouseDown={(e) => handleStartWallDrag(wall, 'end', e)}
                  >
                    <circle cx={x2} cy={y2} r="15" fill="transparent" />
                    <circle
                      cx={x2}
                      cy={y2}
                      r={isBeingDragged && wallDragState?.mode === 'end' ? 8 : 6}
                      fill={isBeingDragged && wallDragState?.mode === 'end' ? '#10b981' : '#0284c7'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </g>

                  {/* Midpoint Handle: also moves whole wall */}
                  <g
                    className={
                      isBeingDragged && wallDragState?.mode === 'wall'
                        ? 'cursor-grabbing'
                        : 'cursor-grab'
                    }
                    onMouseDown={(e) => handleStartWallDrag(wall, 'wall', e)}
                  >
                    <circle cx={midX} cy={midY} r="14" fill="transparent" />
                    <circle cx={midX} cy={midY} r="4.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
                  </g>
                </g>
              )}

              {/* Live HUD Feedback when dragging the whole wall */}
              {isBeingDragged && wallDragState?.mode === 'wall' && wallDragState.currentDelta && (
                <g transform={`translate(${midX}, ${midY - 26})`}>
                  <rect
                    x="-90"
                    y="-12"
                    width="180"
                    height="24"
                    fill="rgba(15, 23, 42, 0.95)"
                    rx="5"
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                  />
                  <text x="0" y="4" fill="#38bdf8" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                    Posun steny: ΔX={wallDragState.currentDelta.dx >= 0 ? `+${wallDragState.currentDelta.dx}` : wallDragState.currentDelta.dx}m, ΔY={wallDragState.currentDelta.dy >= 0 ? `+${wallDragState.currentDelta.dy}` : wallDragState.currentDelta.dy}m
                  </text>
                </g>
              )}

              {/* Wall Dimension Label - Total measured length including wall diameters / radii */}
              {showDimensions && measuredLength > 0.3 && (
                <g transform={`translate(${midX}, ${midY - 12})`}>
                  <rect
                    x="-28"
                    y="-9"
                    width="56"
                    height="18"
                    fill={isSelected ? '#0284c7' : 'rgba(15, 23, 42, 0.85)'}
                    rx="4"
                    stroke={isSelected ? '#38bdf8' : '#334155'}
                    strokeWidth="0.8"
                  />
                  <text
                    x="0"
                    y="3"
                    fill="#f8fafc"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {measuredLength.toFixed(2)}m
                  </text>
                </g>
              )}

              {/* Attic slope indicator badge */}
              {wall.atticSlope?.enabled && (
                <g transform={`translate(${midX}, ${midY + 12})`}>
                  <rect
                    x="-65"
                    y="-8"
                    width="130"
                    height="16"
                    fill="rgba(15, 23, 42, 0.9)"
                    rx="3"
                    stroke="#f59e0b"
                    strokeWidth="0.8"
                  />
                  <text
                    x="0"
                    y="3.5"
                    fill="#fbbf24"
                    fontSize="8.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    📐 {wall.atticSlope.type === 'gable_slope'
                      ? `Štít: ${wall.atticSlope.startHeight ?? 1}m → ${wall.atticSlope.endHeight ?? 3.2}m`
                      : `Šikmina: ${wall.atticSlope.kneeWallHeight ?? 1}m ↗ strop ${wall.atticSlope.ceilingHeight ?? 2.6}m (${wall.atticSlope.roofAngleDeg ?? 38}°)`}
                  </text>
                </g>
              )}

              {/* Openings (Doors and Windows) */}
              {wall.openings.map((op) => {
                const opX = (wall.start.x + op.positionRatio * dx) * scale;
                const opY = (wall.start.y + op.positionRatio * dy) * scale;
                const opWidthPx = op.width * scale;
                const opThickPx = Math.max(thicknessPx, (wall.thickness || 0.3) * scale);
                const wallAngleRad = Math.atan2(dy, dx);
                const wallAngleDeg = (wallAngleRad * 180) / Math.PI;
                const isOpSelected = selectedOpeningId === op.id;

                const isRightHinge = op.swingDirection === 'right';
                const isOpeningOut = op.swingSide === 'right';
                const sideSign = isOpeningOut ? 1 : -1;

                const hingeX = isRightHinge ? opWidthPx / 2 : -opWidthPx / 2;
                const latchX = isRightHinge ? -opWidthPx / 2 : opWidthPx / 2;
                const leafTipX = hingeX;
                const leafTipY = sideSign * opWidthPx;

                // sweepFlag:
                // For left hinge: sideSign > 0 ? 1 : 0
                // For right hinge: sideSign > 0 ? 0 : 1
                const sweepFlag = isRightHinge ? (sideSign > 0 ? 0 : 1) : (sideSign > 0 ? 1 : 0);
                const arcPath = `M ${latchX} 0 A ${opWidthPx} ${opWidthPx} 0 0 ${sweepFlag} ${leafTipX} ${leafTipY}`;

                return (
                  <g
                    key={op.id}
                    transform={`translate(${opX}, ${opY}) rotate(${wallAngleDeg})`}
                    className="cursor-pointer group/op"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectWall(wall.id);
                      if (onSelectOpening) onSelectOpening(op.id);
                      onSelectComponent(undefined);
                    }}
                    onMouseDown={(e) => handleStartOpeningDrag(wall, op, e)}
                  >
                    {/* Clear wall cut out background */}
                    <rect
                      x={-opWidthPx / 2}
                      y={-opThickPx / 2 - 1.5}
                      width={opWidthPx}
                      height={opThickPx + 3}
                      fill="#0b0f19"
                    />

                    {/* Interactive selection halo */}
                    {isOpSelected && (
                      <rect
                        x={-opWidthPx / 2 - 4}
                        y={-opThickPx / 2 - 4}
                        width={opWidthPx + 8}
                        height={opThickPx + 8}
                        rx="4"
                        fill="rgba(56, 189, 248, 0.15)"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                      />
                    )}

                    {/* Opening CAD graphics */}
                    {op.type === 'door' ? (
                      <g>
                        {/* Frame jamb lines */}
                        <line x1={-opWidthPx / 2} y1={-opThickPx / 2} x2={-opWidthPx / 2} y2={opThickPx / 2} stroke="#f8fafc" strokeWidth="2.5" />
                        <line x1={opWidthPx / 2} y1={-opThickPx / 2} x2={opWidthPx / 2} y2={opThickPx / 2} stroke="#f8fafc" strokeWidth="2.5" />

                        {/* Door hinge pin circle indicator */}
                        <circle cx={hingeX} cy="0" r="2.5" fill={isOpSelected ? '#38bdf8' : '#f8fafc'} stroke="#0f172a" strokeWidth="0.8" />

                        {/* Door leaf (open at 90 deg) */}
                        <line
                          x1={hingeX}
                          y1="0"
                          x2={leafTipX}
                          y2={leafTipY}
                          stroke={isOpSelected ? '#38bdf8' : '#f8fafc'}
                          strokeWidth="2.5"
                        />
                        {/* Swing path arc */}
                        <path
                          d={arcPath}
                          fill="none"
                          stroke={isOpSelected ? 'rgba(56, 189, 248, 0.7)' : 'rgba(248, 250, 252, 0.45)'}
                          strokeWidth="1.2"
                          strokeDasharray="3 3"
                        />

                        {/* Door Dimension & Handedness Label (STN): e.g. D1: 80/200 L or 80/200 P */}
                        {(() => {
                          const dimText = `${(op.width * 100).toFixed(0)}/${(op.height * 100).toFixed(0)} ${isRightHinge ? 'P' : 'L'}`;
                          const labelText = op.label ? `${op.label} (${dimText})` : dimText;
                          const badgeWidth = Math.max(48, labelText.length * 5.8 + 10);
                          return (
                            <g transform={`translate(0, ${-sideSign * (opThickPx / 2 + 7)})`}>
                              <rect
                                x={-badgeWidth / 2}
                                y="-6"
                                width={badgeWidth}
                                height="12"
                                rx="2"
                                fill="rgba(15, 23, 42, 0.85)"
                                stroke={isOpSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'}
                                strokeWidth="0.5"
                              />
                              <text
                                x="0"
                                y="3"
                                fill={isOpSelected ? '#38bdf8' : '#e2e8f0'}
                                fontSize="7.5"
                                fontWeight="bold"
                                textAnchor="middle"
                                className="select-none pointer-events-none"
                                transform={wallAngleDeg > 90 || wallAngleDeg < -90 ? 'rotate(180)' : undefined}
                              >
                                {labelText}
                              </text>
                            </g>
                          );
                        })()}

                        {/* Interactive In-Canvas Flip Pill when Selected */}
                        {isOpSelected && (
                          <g
                            transform={`translate(${hingeX}, ${leafTipY + sideSign * 9})`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateFloor((prev) => ({
                                ...prev,
                                walls: prev.walls.map((w) =>
                                  w.id === wall.id
                                    ? {
                                        ...w,
                                        openings: w.openings.map((o) =>
                                          o.id === op.id
                                            ? { ...o, swingDirection: isRightHinge ? 'left' : 'right' }
                                            : o
                                        ),
                                      }
                                    : w
                                ),
                              }), true);
                            }}
                            className="cursor-pointer hover:opacity-100 opacity-90 transition"
                          >
                            <rect
                              x="-22"
                              y="-5.5"
                              width="44"
                              height="11"
                              rx="3"
                              fill="#0284c7"
                              stroke="#38bdf8"
                              strokeWidth="0.8"
                            />
                            <text
                              x="0"
                              y="2.5"
                              fill="#ffffff"
                              fontSize="6.5"
                              fontWeight="bold"
                              textAnchor="middle"
                              className="select-none"
                              transform={wallAngleDeg > 90 || wallAngleDeg < -90 ? 'rotate(180)' : undefined}
                            >
                              ⇄ {isRightHinge ? 'Pravé (P)' : 'Ľavé (L)'}
                            </text>
                          </g>
                        )}
                      </g>
                    ) : op.type === 'window' ? (
                      <g>
                        {/* Window sill box */}
                        <rect
                          x={-opWidthPx / 2}
                          y={-opThickPx / 2}
                          width={opWidthPx}
                          height={opThickPx}
                          fill="#0f172a"
                          stroke={isOpSelected ? '#38bdf8' : '#64748b'}
                          strokeWidth="1.2"
                        />
                        {/* Double glass panes */}
                        <line x1={-opWidthPx / 2} y1="-2" x2={opWidthPx / 2} y2="-2" stroke="#38bdf8" strokeWidth="1.8" />
                        <line x1={-opWidthPx / 2} y1="2" x2={opWidthPx / 2} y2="2" stroke="#38bdf8" strokeWidth="1.8" />
                        {/* Jamb markers */}
                        <line x1={-opWidthPx / 2} y1={-opThickPx / 2} x2={-opWidthPx / 2} y2={opThickPx / 2} stroke="#94a3b8" strokeWidth="2.5" />
                        <line x1={opWidthPx / 2} y1={-opThickPx / 2} x2={opWidthPx / 2} y2={opThickPx / 2} stroke="#94a3b8" strokeWidth="2.5" />

                        {/* Window Dimension Label: e.g. O1: 120/140 (P:90) */}
                        {(() => {
                          const dimText = `${(op.width * 100).toFixed(0)}/${(op.height * 100).toFixed(0)}${op.elevation > 0 ? ` p=${(op.elevation * 100).toFixed(0)}` : ''}`;
                          const labelText = op.label ? `${op.label} (${dimText})` : dimText;
                          const badgeWidth = Math.max(56, labelText.length * 5.6 + 10);
                          return (
                            <g transform={`translate(0, ${-opThickPx / 2 - 7})`}>
                              <rect
                                x={-badgeWidth / 2}
                                y="-6"
                                width={badgeWidth}
                                height="12"
                                rx="2"
                                fill="rgba(15, 23, 42, 0.85)"
                                stroke={isOpSelected ? '#38bdf8' : 'rgba(56, 189, 248, 0.3)'}
                                strokeWidth="0.5"
                              />
                              <text
                                x="0"
                                y="3"
                                fill={isOpSelected ? '#38bdf8' : '#7dd3fc'}
                                fontSize="7.5"
                                fontWeight="bold"
                                textAnchor="middle"
                                className="select-none pointer-events-none"
                                transform={wallAngleDeg > 90 || wallAngleDeg < -90 ? 'rotate(180)' : undefined}
                              >
                                {labelText}
                              </text>
                            </g>
                          );
                        })()}
                      </g>
                    ) : (
                      <g>
                        {/* Niche / Open passage */}
                        <rect
                          x={-opWidthPx / 2}
                          y={-opThickPx / 2}
                          width={opWidthPx}
                          height={opThickPx}
                          fill="none"
                          stroke={isOpSelected ? '#38bdf8' : '#94a3b8'}
                          strokeWidth="1.5"
                          strokeDasharray="4 2"
                        />
                        <text
                          x="0"
                          y="3"
                          fill={isOpSelected ? '#38bdf8' : '#cbd5e1'}
                          fontSize="7.5"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="select-none pointer-events-none"
                        >
                          {(op.width * 100).toFixed(0)}/{(op.height * 100).toFixed(0)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* 4. WALL DRAWING IN-PROGRESS PREVIEW WITH 90° AUTO-SNAP VISUALIZATION */}
        {wallStart && (() => {
          const pDx = cursorPos.x - wallStart.x;
          const pDy = cursorPos.y - wallStart.y;
          const pNodeLen = Math.hypot(pDx, pDy);
          const pUx = pNodeLen > 0.001 ? pDx / pNodeLen : 0;
          const pUy = pNodeLen > 0.001 ? pDy / pNodeLen : 0;
          const ownThickness = defaultWallThickness || 0.15;

          const pRStart = getEndpointRadius(wallStart, ownThickness, undefined, null);
          const pREnd = getEndpointRadius(cursorPos, ownThickness, undefined, null);

          const pStartX = wallStart.x - pUx * pRStart;
          const pStartY = wallStart.y - pUy * pRStart;
          const pEndX = cursorPos.x + pUx * pREnd;
          const pEndY = cursorPos.y + pUy * pREnd;

          // Measured length: node length + start radius + end radius (priemer steny)
          const pMeasuredLength = pNodeLen + pRStart + pREnd;

          return (
            <g>
              {/* Orthogonal Guide Lines when snapped to 90° */}
              {snappedAngleInfo?.isOrthogonal && (
                <line
                  x1={snappedAngleInfo.angleDeg === 90 || snappedAngleInfo.angleDeg === 270 ? wallStart.x * scale : -2000}
                  y1={snappedAngleInfo.angleDeg === 0 || snappedAngleInfo.angleDeg === 180 ? wallStart.y * scale : -2000}
                  x2={snappedAngleInfo.angleDeg === 90 || snappedAngleInfo.angleDeg === 270 ? wallStart.x * scale : 4000}
                  y2={snappedAngleInfo.angleDeg === 0 || snappedAngleInfo.angleDeg === 180 ? wallStart.y * scale : 4000}
                  stroke="#10b981"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />
              )}

              {/* In-progress wall segment with exact butt linecap and real thickness */}
              <line
                x1={pStartX * scale}
                y1={pStartY * scale}
                x2={pEndX * scale}
                y2={pEndY * scale}
                stroke={snappedAngleInfo?.isOrthogonal ? '#10b981' : '#38bdf8'}
                strokeWidth={Math.max(4, (defaultWallThickness || 0.15) * scale)}
                strokeLinecap="butt"
                strokeDasharray="6 4"
              />
              <circle cx={wallStart.x * scale} cy={wallStart.y * scale} r="5" fill={snappedAngleInfo?.isOrthogonal ? '#10b981' : '#38bdf8'} />
              <circle cx={cursorPos.x * scale} cy={cursorPos.y * scale} r="5" fill={snappedAngleInfo?.isOrthogonal ? '#10b981' : '#38bdf8'} />

              {/* Length & Angle HUD tag near cursor */}
              <g transform={`translate(${cursorPos.x * scale + 15}, ${cursorPos.y * scale + 15})`}>
                <rect
                  x="0"
                  y="-14"
                  width="140"
                  height="28"
                  fill="rgba(15, 23, 42, 0.95)"
                  rx="5"
                  stroke={snappedAngleInfo?.isOrthogonal ? '#10b981' : '#38bdf8'}
                  strokeWidth="1"
                />
                <text x="8" y="4" fill="#ffffff" fontSize="11" fontWeight="bold">
                  {pMeasuredLength.toFixed(2)} m |{' '}
                  <tspan fill={snappedAngleInfo?.isOrthogonal ? '#34d399' : '#38bdf8'}>
                    {snappedAngleInfo?.angleDeg}° {snappedAngleInfo?.isOrthogonal ? '✓' : ''}
                  </tspan>
                </text>
              </g>
            </g>
          );
        })()}

        {/* 4b. WALL CORNER SNAP TARGETS & HUD BADGE (When tool is wall) */}
        {activeTool === 'wall' && (
          <g>
            {/* Subtle snap target dots on all wall vertices */}
            {(() => {
              const uniqueCorners = new Map<string, Point2D>();
              floor.walls.forEach((w) => {
                uniqueCorners.set(`${w.start.x.toFixed(2)},${w.start.y.toFixed(2)}`, w.start);
                uniqueCorners.set(`${w.end.x.toFixed(2)},${w.end.y.toFixed(2)}`, w.end);
              });
              return Array.from(uniqueCorners.values()).map((corner, idx) => {
                const isHovered =
                  hoveredCorner &&
                  Math.hypot(hoveredCorner.x - corner.x, hoveredCorner.y - corner.y) < 0.05;
                if (isHovered) return null; // Hovered corner gets special high-vis marker below
                return (
                  <circle
                    key={`corner-dot-${idx}`}
                    cx={corner.x * scale}
                    cy={corner.y * scale}
                    r="4.5"
                    fill="#0f172a"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    className="pointer-events-none opacity-80"
                  />
                );
              });
            })()}

            {/* Prominent High-Visibility Snap Indicator for Corner, Intersection, or Wall Body (T-junction) */}
            {hoveredSnapTarget && (
              <g
                className="pointer-events-none"
                transform={`translate(${hoveredSnapTarget.pt.x * scale}, ${hoveredSnapTarget.pt.y * scale})`}
              >
                {hoveredSnapTarget.type === 'corner' && (
                  <g>
                    <circle
                      r="14"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      className="animate-spin"
                      style={{ animationDuration: '6s' }}
                    />
                    <circle r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                    <line x1="-18" y1="0" x2="-8" y2="0" stroke="#10b981" strokeWidth="1.5" />
                    <line x1="8" y1="0" x2="18" y2="0" stroke="#10b981" strokeWidth="1.5" />
                    <line x1="0" y1="-18" x2="0" y2="-8" stroke="#10b981" strokeWidth="1.5" />
                    <line x1="0" y1="8" x2="0" y2="18" stroke="#10b981" strokeWidth="1.5" />
                    <g transform="translate(0, -26)">
                      <rect
                        x="-70"
                        y="-12"
                        width="140"
                        height="24"
                        fill="rgba(15, 23, 42, 0.95)"
                        rx="5"
                        stroke="#10b981"
                        strokeWidth="1.2"
                      />
                      <text x="0" y="4" fill="#34d399" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                        ⌖ Roh steny ({hoveredSnapTarget.pt.x.toFixed(2)}, {hoveredSnapTarget.pt.y.toFixed(2)})
                      </text>
                    </g>
                  </g>
                )}

                {hoveredSnapTarget.type === 'intersection' && (
                  <g>
                    <circle
                      r="16"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                      className="animate-spin"
                      style={{ animationDuration: '4s' }}
                    />
                    <circle r="5" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
                    {/* Diagonal X ticks */}
                    <line x1="-12" y1="-12" x2="12" y2="12" stroke="#c084fc" strokeWidth="2" />
                    <line x1="-12" y1="12" x2="12" y2="-12" stroke="#c084fc" strokeWidth="2" />
                    <g transform="translate(0, -26)">
                      <rect
                        x="-85"
                        y="-12"
                        width="170"
                        height="24"
                        fill="rgba(15, 23, 42, 0.95)"
                        rx="5"
                        stroke="#a855f7"
                        strokeWidth="1.2"
                      />
                      <text x="0" y="4" fill="#d8b4fe" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                        ⤬ Priesečník stien ({hoveredSnapTarget.pt.x.toFixed(2)}, {hoveredSnapTarget.pt.y.toFixed(2)})
                      </text>
                    </g>
                  </g>
                )}

                {hoveredSnapTarget.type === 'wall_body' && (
                  <g>
                    <rect
                      x="-8"
                      y="-8"
                      width="16"
                      height="16"
                      transform="rotate(45)"
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <circle r="3.5" fill="#ffffff" />
                    <g transform="translate(0, -26)">
                      <rect
                        x="-82"
                        y="-12"
                        width="164"
                        height="24"
                        fill="rgba(15, 23, 42, 0.95)"
                        rx="5"
                        stroke="#f59e0b"
                        strokeWidth="1.2"
                      />
                      <text x="0" y="4" fill="#fbbf24" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                        ⊥ T-spoj na stene ({hoveredSnapTarget.pt.x.toFixed(2)}, {hoveredSnapTarget.pt.y.toFixed(2)})
                      </text>
                    </g>
                  </g>
                )}
              </g>
            )}

            {/* Glowing Pulse indicator when a new shared junction node was just created */}
            {newJunctionPulse && (
              <g
                className="pointer-events-none"
                transform={`translate(${newJunctionPulse.x * scale}, ${newJunctionPulse.y * scale})`}
              >
                <circle
                  r="24"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  className="animate-ping"
                  opacity="0.8"
                />
                <circle r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                <g transform="translate(0, 26)">
                  <rect
                    x="-95"
                    y="-12"
                    width="190"
                    height="24"
                    fill="rgba(15, 23, 42, 0.95)"
                    rx="5"
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                  />
                  <text x="0" y="4" fill="#7dd3fc" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                    ✓ Vytvorený bod stretu (uzol)
                  </text>
                </g>
              </g>
            )}
          </g>
        )}

        {/* 5. ELECTRICAL COMPONENTS */}
        {floor.components.map((comp) => {
          const cx = comp.position.x * scale;
          const cy = comp.position.y * scale;
          const isSelected = comp.id === selectedComponentId;
          const isShellySmart = Boolean(comp.smartModule);

          const isCompDragging = componentDragState?.componentId === comp.id;

          return (
            <g
              key={comp.id}
              transform={`translate(${cx}, ${cy})`}
              className={isCompDragging ? 'cursor-grabbing' : 'cursor-grab hover:opacity-95'}
              onMouseDown={(e) => handleStartComponentDrag(comp, e)}
              onClick={(e) => {
                e.stopPropagation();
                if (componentDragState?.hasMoved) return; // Ignore click if user was dragging!

                // If in linking mode and currently selected component is a switch
                if (
                  isLinkingMode &&
                  selectedComponent &&
                  (selectedComponent.type.startsWith('switch_') || selectedComponent.type === 'push_button')
                ) {
                  // If clicked on a light -> toggle this light!
                  if (comp.type.startsWith('light_')) {
                    const currentTargets = selectedComponent.targetLightIds || [];
                    const isAlready = currentTargets.includes(comp.id);
                    const newTargets = isAlready
                      ? currentTargets.filter((id) => id !== comp.id)
                      : [...currentTargets, comp.id];

                    onUpdateFloor((prev) => ({
                      ...prev,
                      components: prev.components.map((c) =>
                        c.id === selectedComponent.id
                          ? { ...c, targetLightIds: newTargets, controlGroupId: c.controlGroupId || `grp-${Date.now()}` }
                          : c
                      ),
                    }));
                    return;
                  }

                  // If clicked on another switch -> pair for staircase wiring (Radenie 6+6 / 6+7+6)!
                  if (
                    comp.id !== selectedComponent.id &&
                    (comp.type.startsWith('switch_') || comp.type === 'push_button')
                  ) {
                    const sharedTargets = selectedComponent.targetLightIds || [];
                    if (sharedTargets.length > 0) {
                      const sharedGroupId = selectedComponent.controlGroupId || `grp-stairs-${Date.now()}`;
                      onUpdateFloor((prev) => ({
                        ...prev,
                        components: prev.components.map((c) => {
                          if (c.id === comp.id || c.id === selectedComponent.id) {
                            return {
                              ...c,
                              targetLightIds: sharedTargets,
                              controlGroupId: sharedGroupId,
                              type: c.type === 'switch_1' ? 'switch_6' : c.type,
                            };
                          }
                          return c;
                        }),
                      }));
                      return;
                    }
                  }
                }

                // Normal selection
                onSelectComponent(comp.id);
                onSelectWall(undefined);
              }}
            >
              {isSelected && (
                <g>
                  <circle cx="0" cy="0" r="26" fill="rgba(56, 189, 248, 0.22)" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
                  {comp.type === 'switchboard' && (
                    <circle cx="0" cy="0" r="32" fill="none" stroke="rgba(56, 189, 248, 0.45)" strokeWidth="1" strokeDasharray="2 4" />
                  )}
                </g>
              )}

              {/* Badge for switches showing number of controlled lights */}
              {(comp.type.startsWith('switch_') || comp.type === 'push_button') &&
                comp.targetLightIds &&
                comp.targetLightIds.length > 0 && (
                  <g transform="translate(0, -22)">
                    <rect
                      x="-32"
                      y="-7"
                      width="64"
                      height="15"
                      fill="rgba(245, 158, 11, 0.95)"
                      rx="3"
                    />
                    <text x="0" y="3.5" fill="#0f172a" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                      💡 {comp.targetLightIds.length}x svetlo
                    </text>
                  </g>
                )}

              {/* Badge for lights showing staircase or single switch control */}
              {comp.type.startsWith('light_') && (() => {
                const switchCount = floor.components.filter((c) => c.targetLightIds?.includes(comp.id)).length;
                if (switchCount === 0) return null;
                const isStaircase = switchCount >= 2;
                return (
                  <g transform="translate(0, -22)">
                    <rect
                      x="-42"
                      y="-7"
                      width="84"
                      height="15"
                      fill={isStaircase ? 'rgba(234, 88, 12, 0.95)' : 'rgba(16, 185, 129, 0.95)'}
                      rx="3"
                    />
                    <text x="0" y="3.5" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                      {isStaircase ? `⚡ Schodisko (${switchCount}x)` : '⚡ 1x vypínač'}
                    </text>
                  </g>
                );
              })()}

              {isShellySmart && (
                <circle cx="12" cy="-12" r="6" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              )}

              {comp.type === 'switchboard' ? (() => {
                const isSub = comp.switchboardKind === 'sub' || comp.notes === 'RP' || comp.label.includes('RP');
                const borderColor = isSelected ? '#38bdf8' : isSub ? '#2563eb' : '#dc2626';
                const fillColor = isSub ? '#dbeafe' : '#fee2e2';
                const textColor = isSub ? '#1d4ed8' : '#b91c1c';
                const labelText = isSub ? 'RP' : 'RH';
                return (
                  <g>
                    {/* STN symbol rozvádzača */}
                    <g transform="translate(-18, -18)">
                      <rect x="0" y="0" width="36" height="36" stroke={borderColor} strokeWidth={isSelected ? 3 : 2} fill={fillColor} rx="3" />
                      <line x1="0" y1="0" x2="36" y2="36" stroke={borderColor} strokeWidth={isSelected ? 2.5 : 2} />
                      <text x="18" y="24" fontSize="11" fontWeight="900" fill={textColor} textAnchor="middle" fontFamily="sans-serif">
                        {labelText}
                      </text>
                    </g>
                    {/* Menovka nad rozvádzačom */}
                    <g transform="translate(0, -26)">
                      <rect
                        x="-48"
                        y="-7"
                        width="96"
                        height="15"
                        fill={isSub ? 'rgba(37, 99, 235, 0.95)' : 'rgba(220, 38, 38, 0.95)'}
                        rx="3"
                        stroke={isSelected ? '#38bdf8' : 'none'}
                        strokeWidth="1"
                      />
                      <text x="0" y="3.5" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                        ⚡ {isSub ? 'Podružný RP' : 'Hlavný RH'}
                      </text>
                    </g>
                  </g>
                );
              })() : (
                <g
                  transform="translate(-16, -16)"
                  dangerouslySetInnerHTML={{
                    __html: renderSTNSymbol(comp.type, 32, isSelected ? '#38bdf8' : '#e2e8f0'),
                  }}
                />
              )}

              <g transform="translate(0, 22)">
                <rect
                  x="-35"
                  y="0"
                  width="70"
                  height="16"
                  fill="rgba(15, 23, 42, 0.9)"
                  rx="3"
                  stroke={isSelected ? '#38bdf8' : '#334155'}
                  strokeWidth="0.8"
                />
                <text x="0" y="11" fill="#f8fafc" fontSize="9" fontWeight="bold" textAnchor="middle">
                  Z={comp.position.z.toFixed(2)}m
                </text>
              </g>

              {isShellySmart && (
                <text x="12" y="-16" fill="#10b981" fontSize="8" fontWeight="bold" textAnchor="middle">
                  SHELLY
                </text>
              )}
            </g>
          );
        })}

        {/* Live HUD Feedback when dragging an electrical component / switchboard */}
        {componentDragState && (() => {
          const comp = floor.components.find((c) => c.id === componentDragState.componentId);
          if (!comp) return null;
          const isSb = comp.type === 'switchboard';
          const isSub = comp.switchboardKind === 'sub' || comp.notes === 'RP' || comp.label.includes('RP');
          return (
            <g transform={`translate(${comp.position.x * scale}, ${comp.position.y * scale - 42})`} className="pointer-events-none select-none">
              <rect
                x="-80"
                y="-13"
                width="160"
                height="26"
                fill="rgba(15, 23, 42, 0.95)"
                rx="6"
                stroke={isSb ? (isSub ? '#3b82f6' : '#ef4444') : '#38bdf8'}
                strokeWidth="1.5"
              />
              <text x="0" y="3" fill="#ffffff" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                {isSb ? (isSub ? 'Presun RP' : 'Presun RH') : 'Presun prvku'}: X={comp.position.x.toFixed(2)}m, Y={comp.position.y.toFixed(2)}m
              </text>
            </g>
          );
        })()}

        {/* Precision Target Crosshair when positioning calibration points */}
        {isCalibActive && !calibEnd && (
          <g transform={`translate(${cursorPos.x * scale}, ${cursorPos.y * scale})`} className="pointer-events-none">
            <line x1="-18" y1="0" x2="18" y2="0" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="0" y1="-18" x2="0" y2="18" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
            <circle r="4" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
            <circle r="1" fill="#f59e0b" />
          </g>
        )}

        {/* 6. CALIBRATION MEASUREMENT LINE (Merač kóty pre kalibráciu podkladu) */}
        {calibStart && (() => {
          const endPt = calibEnd || cursorPos;
          const x1 = calibStart.x * scale;
          const y1 = calibStart.y * scale;
          const x2 = endPt.x * scale;
          const y2 = endPt.y * scale;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const distM = Math.hypot(endPt.x - calibStart.x, endPt.y - calibStart.y);
          const angleRad = Math.atan2(dy, dx);
          const normalX = -Math.sin(angleRad);
          const normalY = Math.cos(angleRad);
          const tickLen = 14;

          return (
            <g className="calibration-dimension-line select-none">
              {/* Orthogonal Guide Lines when snapped to 90° */}
              {snappedAngleInfo?.isOrthogonal && !calibEnd && (
                <line
                  x1={snappedAngleInfo.angleDeg === 90 || snappedAngleInfo.angleDeg === 270 ? x1 : -2000}
                  y1={snappedAngleInfo.angleDeg === 0 || snappedAngleInfo.angleDeg === 180 ? y1 : -2000}
                  x2={snappedAngleInfo.angleDeg === 90 || snappedAngleInfo.angleDeg === 270 ? x1 : 4000}
                  y2={snappedAngleInfo.angleDeg === 0 || snappedAngleInfo.angleDeg === 180 ? y1 : 4000}
                  stroke="#f59e0b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />
              )}

              {/* Glowing Aura Line */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#f59e0b"
                strokeWidth="10"
                strokeLinecap="round"
                opacity="0.25"
              />

              {/* Main Dimension Line */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeDasharray={calibEnd ? 'none' : '6 4'}
              />

              {/* Perpendicular Dimension Ticks at Point A (calibStart) */}
              <line
                x1={x1 - normalX * tickLen}
                y1={y1 - normalY * tickLen}
                x2={x1 + normalX * tickLen}
                y2={y1 + normalY * tickLen}
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Perpendicular Dimension Ticks at Point B (endPt) */}
              <line
                x1={x2 - normalX * tickLen}
                y1={y2 - normalY * tickLen}
                x2={x2 + normalX * tickLen}
                y2={y2 + normalY * tickLen}
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Interactive Endpoint Handle A */}
              <g
                transform={`translate(${x1}, ${y1})`}
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setActiveCalibHandleDrag('start');
                }}
              >
                <circle r="14" fill="rgba(245, 158, 11, 0.2)" />
                <circle r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                <rect x="-22" y="-30" width="44" height="16" rx="4" fill="rgba(15, 23, 42, 0.95)" stroke="#f59e0b" strokeWidth="1" />
                <text x="0" y="-19" fill="#fef3c7" fontSize="9" fontWeight="bold" textAnchor="middle">
                  Kóta A
                </text>
              </g>

              {/* Interactive Endpoint Handle B */}
              <g
                transform={`translate(${x2}, ${y2})`}
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setActiveCalibHandleDrag('end');
                }}
              >
                <circle r="14" fill="rgba(245, 158, 11, 0.2)" />
                <circle r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                <rect x="-22" y="-30" width="44" height="16" rx="4" fill="rgba(15, 23, 42, 0.95)" stroke="#f59e0b" strokeWidth="1" />
                <text x="0" y="-19" fill="#fef3c7" fontSize="9" fontWeight="bold" textAnchor="middle">
                  Kóta B
                </text>
              </g>

              {/* Dimension measurement text badge at midpoint */}
              {distM > 0.05 && (
                <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2 - 16})`}>
                  <rect
                    x="-75"
                    y="-12"
                    width="150"
                    height="24"
                    rx="5"
                    fill="rgba(15, 23, 42, 0.95)"
                    stroke="#f59e0b"
                    strokeWidth="1.2"
                  />
                  <text x="0" y="3" fill="#ffffff" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                    📏 {distM.toFixed(2)} m ({Math.round(distM * 1000)} mm)
                  </text>
                </g>
              )}
            </g>
          );
        })()}

        {/* 11. REMOTE COLLABORATORS REAL-TIME CURSORS */}
        {remoteCursors &&
          Object.entries(remoteCursors).map(([peerId, c]) => {
            if (!c || c.floorId !== floor.id) return null;
            const uColor = c.user?.color || '#38bdf8';
            const uName = c.user?.name || 'Kolega';
            const px = c.x * scale;
            const py = c.y * scale;

            return (
              <g
                key={`remote-cursor-${peerId}`}
                transform={`translate(${px}, ${py})`}
                className="pointer-events-none transition-all duration-75 select-none"
              >
                {/* Pointer Arrow */}
                <polygon
                  points="0,0 0,18 5,14 8,21 12,19 9,13 15,13"
                  fill={uColor}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                {/* User Tag */}
                <g transform="translate(14, 16)">
                  <rect
                    x="-2"
                    y="-9"
                    width={Math.max(45, uName.length * 7 + 12)}
                    height="18"
                    rx="4"
                    fill={uColor}
                    stroke="#ffffff"
                    strokeWidth="0.8"
                  />
                  <text x="4" y="3.5" fill="#ffffff" fontSize="9" fontWeight="bold">
                    {uName}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
