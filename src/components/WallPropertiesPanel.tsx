import React, { useState, useEffect } from 'react';
import { Opening, Point2D, Wall, WallMaterial, AtticSlopeConfig } from '../types/cad';
import {
  Trash2,
  RotateCw,
  Ruler,
  Layers,
  ShieldCheck,
  ArrowRightLeft,
  Square,
  DoorOpen,
  AppWindow,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react';

interface WallPropertiesPanelProps {
  wall: Wall;
  allWalls?: Wall[];
  floorHeight: number;
  hasBlueprintUnderlay?: boolean;
  selectedOpeningId?: string;
  onSelectOpening?: (id: string | undefined) => void;
  onUpdateWall: (updated: Wall) => void;
  onDeleteWall: (id: string) => void;
  onCalibrateUnderlayWithWall?: (wall: Wall, targetLength: number, rescaleAll: boolean) => void;
  onClose: () => void;
}

export const WallPropertiesPanel: React.FC<WallPropertiesPanelProps> = ({
  wall,
  allWalls,
  floorHeight,
  hasBlueprintUnderlay = false,
  selectedOpeningId,
  onSelectOpening,
  onUpdateWall,
  onDeleteWall,
  onCalibrateUnderlayWithWall,
  onClose,
}) => {
  // Anchor mode: 'start' | 'end' | 'center'
  const [anchorMode, setAnchorMode] = useState<'start' | 'end' | 'center'>('start');
  const [expandedOpeningIds, setExpandedOpeningIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (selectedOpeningId) {
      setExpandedOpeningIds((prev) => ({ ...prev, [selectedOpeningId]: true }));
    }
  }, [selectedOpeningId]);

  const toggleOpeningExpand = (opId: string) => {
    setExpandedOpeningIds((prev) => ({ ...prev, [opId]: !prev[opId] }));
    if (onSelectOpening) {
      onSelectOpening(expandedOpeningIds[opId] ? undefined : opId);
    }
  };

  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const currentLength = Math.hypot(dx, dy);

  // Helper to determine connecting wall radius (half-thickness) at endpoint:
  const getEndpointRadiusForWall = (pt: Point2D): number => {
    let connectingThickness: number | null = null;
    if (allWalls) {
      for (const w of allWalls) {
        if (w.id === wall.id) continue;
        const wThick = w.thickness || 0.15;
        // Corner connection
        if (
          Math.hypot(pt.x - w.start.x, pt.y - w.start.y) < 0.10 ||
          Math.hypot(pt.x - w.end.x, pt.y - w.end.y) < 0.10
        ) {
          connectingThickness = Math.max(connectingThickness || 0, wThick);
          continue;
        }
        // T-junction along body
        const wDx = w.end.x - w.start.x;
        const wDy = w.end.y - w.start.y;
        const lenSq = wDx * wDx + wDy * wDy;
        if (lenSq > 0) {
          const t = ((pt.x - w.start.x) * wDx + (pt.y - w.start.y) * wDy) / lenSq;
          if (t >= -0.05 && t <= 1.05) {
            const projX = w.start.x + t * wDx;
            const projY = w.start.y + t * wDy;
            if (Math.hypot(pt.x - projX, pt.y - projY) < 0.10) {
              connectingThickness = Math.max(connectingThickness || 0, wThick);
            }
          }
        }
      }
    }
    const finalThickness = connectingThickness !== null ? connectingThickness : (wall.thickness || 0.15);
    return finalThickness / 2;
  };

  const rStart = getEndpointRadiusForWall(wall.start);
  const rEnd = getEndpointRadiusForWall(wall.end);
  const measuredTotalLength = currentLength + rStart + rEnd;

  // Calibration state
  const [calibLength, setCalibLength] = useState<number>(() => Number(measuredTotalLength.toFixed(2)));
  const [rescaleAll, setRescaleAll] = useState<boolean>(true);

  useEffect(() => {
    setCalibLength(Number(measuredTotalLength.toFixed(2)));
  }, [wall.id, measuredTotalLength]);

  // Angle in degrees (0 to 360)
  let currentAngleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (currentAngleDeg < 0) currentAngleDeg += 360;
  currentAngleDeg = Math.round(currentAngleDeg * 10) / 10;

  // Recalculate start and end points based on length, angle, and anchor point
  const applyGeometryChange = (newLen: number, newAngleDeg: number) => {
    const angleRad = (newAngleDeg * Math.PI) / 180;
    const newDx = newLen * Math.cos(angleRad);
    const newDy = newLen * Math.sin(angleRad);

    let newStart: Point2D = { ...wall.start };
    let newEnd: Point2D = { ...wall.end };

    if (anchorMode === 'start') {
      newEnd = {
        x: Number((newStart.x + newDx).toFixed(2)),
        y: Number((newStart.y + newDy).toFixed(2)),
      };
    } else if (anchorMode === 'end') {
      newStart = {
        x: Number((newEnd.x - newDx).toFixed(2)),
        y: Number((newEnd.y - newDy).toFixed(2)),
      };
    } else {
      // Center anchor
      const midX = (wall.start.x + wall.end.x) / 2;
      const midY = (wall.start.y + wall.end.y) / 2;
      newStart = {
        x: Number((midX - newDx / 2).toFixed(2)),
        y: Number((midY - newDy / 2).toFixed(2)),
      };
      newEnd = {
        x: Number((midX + newDx / 2).toFixed(2)),
        y: Number((midY + newDy / 2).toFixed(2)),
      };
    }

    onUpdateWall({
      ...wall,
      start: newStart,
      end: newEnd,
    });
  };

  const handleTotalLengthChange = (newTotalLen: number) => {
    if (newTotalLen <= rStart + rEnd + 0.05) return;
    const newNodeLen = Math.max(0.1, newTotalLen - rStart - rEnd);
    applyGeometryChange(newNodeLen, currentAngleDeg);
  };

  const handleAngleChange = (newAngleDeg: number) => {
    let normalized = newAngleDeg % 360;
    if (normalized < 0) normalized += 360;
    applyGeometryChange(currentLength, normalized);
  };

  const handleFlipWall = () => {
    onUpdateWall({
      ...wall,
      start: { ...wall.end },
      end: { ...wall.start },
    });
  };

  const handleThicknessChange = (t: number) => {
    onUpdateWall({ ...wall, thickness: t });
  };

  const handleMaterialChange = (mat: WallMaterial) => {
    onUpdateWall({ ...wall, material: mat });
  };

  const handleDeleteOpening = (openingId: string) => {
    onUpdateWall({
      ...wall,
      openings: wall.openings.filter((o) => o.id !== openingId),
    });
    if (selectedOpeningId === openingId && onSelectOpening) {
      onSelectOpening(undefined);
    }
  };

  const handleUpdateOpening = (openingId: string, updates: Partial<Opening>) => {
    onUpdateWall({
      ...wall,
      openings: wall.openings.map((op) => (op.id === openingId ? { ...op, ...updates } : op)),
    });
  };

  const handleAddOpening = (type: 'door' | 'window') => {
    const isDoor = type === 'door';
    const newOp: Opening = {
      id: `op-${Date.now()}`,
      type,
      positionRatio: 0.5,
      width: isDoor ? 0.9 : 1.2,
      height: isDoor ? 2.0 : 1.4,
      elevation: isDoor ? 0 : 0.9,
      swingDirection: 'left',
      swingSide: 'left',
    };
    onUpdateWall({
      ...wall,
      openings: [...wall.openings, newOp],
    });
    setExpandedOpeningIds((prev) => ({ ...prev, [newOp.id]: true }));
    if (onSelectOpening) {
      onSelectOpening(newOp.id);
    }
  };

  const handleToggleAtticSlope = (enabled: boolean) => {
    if (!enabled) {
      onUpdateWall({
        ...wall,
        atticSlope: wall.atticSlope ? { ...wall.atticSlope, enabled: false } : undefined,
      });
    } else {
      const currentCeilingH = wall.atticSlope?.ceilingHeight || floorHeight || 2.60;
      const currentKneeH = wall.atticSlope?.kneeWallHeight ?? 1.0;
      const currentAngle = wall.atticSlope?.roofAngleDeg ?? 38;
      const deltaH = Math.max(0.3, currentCeilingH - currentKneeH);
      const angleRad = (currentAngle * Math.PI) / 180;
      const slopeDepth = Number((deltaH / Math.tan(angleRad)).toFixed(2));

      onUpdateWall({
        ...wall,
        atticSlope: {
          enabled: true,
          type: wall.atticSlope?.type || 'knee_wall_roof',
          kneeWallHeight: currentKneeH,
          roofAngleDeg: currentAngle,
          ceilingHeight: currentCeilingH,
          slopeDepth,
          slopeDirection: wall.atticSlope?.slopeDirection || 'left',
          startHeight: wall.atticSlope?.startHeight ?? 1.0,
          endHeight: wall.atticSlope?.endHeight ?? 3.2,
        },
      });
    }
  };

  const handleUpdateAtticSlope = (patch: Partial<AtticSlopeConfig>) => {
    const prevAttic: AtticSlopeConfig = wall.atticSlope || {
      enabled: true,
      type: 'knee_wall_roof',
      kneeWallHeight: 1.0,
      roofAngleDeg: 38,
      ceilingHeight: floorHeight || 2.60,
      slopeDirection: 'left',
      startHeight: 1.0,
      endHeight: 3.2,
    };
    const updatedAttic = { ...prevAttic, ...patch };

    // Recalculate slopeDepth if parameters changed
    if (patch.kneeWallHeight !== undefined || patch.roofAngleDeg !== undefined || patch.ceilingHeight !== undefined) {
      const ceilH = updatedAttic.ceilingHeight || floorHeight || 2.60;
      const kneeH = updatedAttic.kneeWallHeight ?? 1.0;
      const angle = updatedAttic.roofAngleDeg ?? 38;
      const deltaH = Math.max(0.3, ceilH - kneeH);
      const angleRad = (angle * Math.PI) / 180;
      updatedAttic.slopeDepth = Number((deltaH / Math.tan(angleRad)).toFixed(2));
    }

    onUpdateWall({
      ...wall,
      atticSlope: updatedAttic,
    });
  };

  return (
    <div className="w-80 h-full bg-slate-900 border-l border-slate-800 flex flex-col text-slate-200 text-xs shadow-2xl overflow-y-auto select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div>
          <div className="text-[10px] text-sky-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Square className="w-3.5 h-3.5" />
            Vlastnosti steny
          </div>
          <h3 className="font-bold text-sm text-slate-100">
            Stena ({measuredTotalLength.toFixed(2)} m)
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 text-base font-bold px-2 py-0.5"
        >
          ✕
        </button>
      </div>

      <div className="p-4 flex flex-col gap-5">
        {/* 1. DĹŽKA STENY (LENGTH) */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-sky-400" />
                Dĺžka steny (celková)
              </span>
              <span className="text-[10px] text-slate-400">
                Osová: {currentLength.toFixed(2)}m (rohy: +{((rStart + rEnd) * 100).toFixed(0)}cm)
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-sm font-bold text-sky-400">
              <input
                type="number"
                step="0.05"
                min="0.2"
                max="30"
                value={Number(measuredTotalLength.toFixed(2))}
                onChange={(e) => handleTotalLengthChange(parseFloat(e.target.value) || measuredTotalLength)}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-sky-400 outline-none focus:border-sky-400"
              />
              <span>m</span>
            </div>
          </div>

          {/* Quick Length Adjust Steppers */}
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <button
              onClick={() => handleTotalLengthChange(Number((measuredTotalLength - 0.5).toFixed(2)))}
              className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-300 transition"
            >
              -0.50m
            </button>
            <button
              onClick={() => handleTotalLengthChange(Number((measuredTotalLength - 0.1).toFixed(2)))}
              className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-300 transition"
            >
              -0.10m
            </button>
            <button
              onClick={() => handleTotalLengthChange(Number((measuredTotalLength + 0.1).toFixed(2)))}
              className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-300 transition"
            >
              +0.10m
            </button>
            <button
              onClick={() => handleTotalLengthChange(Number((measuredTotalLength + 0.5).toFixed(2)))}
              className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-300 transition"
            >
              +0.50m
            </button>
          </div>
        </div>

        {/* 2. UHOL STENY & 90° SNAP PRESETS */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              Uhol steny (α)
            </span>
            <div className="flex items-center gap-1 font-mono text-sm font-bold text-amber-400">
              <input
                type="number"
                step="1"
                min="0"
                max="360"
                value={Math.round(currentAngleDeg)}
                onChange={(e) => handleAngleChange(parseFloat(e.target.value) || 0)}
                className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-amber-400 outline-none focus:border-amber-400"
              />
              <span>°</span>
            </div>
          </div>

          {/* Quick 90° Orthogonal Alignment Buttons */}
          <div className="grid grid-cols-4 gap-1.5 text-[11px] font-mono font-semibold">
            <button
              onClick={() => handleAngleChange(0)}
              className={`py-1.5 rounded border transition ${
                Math.round(currentAngleDeg) === 0 || Math.round(currentAngleDeg) === 360
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
            >
              0° →
            </button>
            <button
              onClick={() => handleAngleChange(90)}
              className={`py-1.5 rounded border transition ${
                Math.round(currentAngleDeg) === 90
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
            >
              90° ↓
            </button>
            <button
              onClick={() => handleAngleChange(180)}
              className={`py-1.5 rounded border transition ${
                Math.round(currentAngleDeg) === 180
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
            >
              180° ←
            </button>
            <button
              onClick={() => handleAngleChange(270)}
              className={`py-1.5 rounded border transition ${
                Math.round(currentAngleDeg) === 270
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
            >
              270° ↑
            </button>
          </div>
        </div>

        {/* 3. FIXNÝ BOD ROTÁCIE / ZMENY DĹŽKY (ANCHOR POINT) */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
          <span className="font-bold text-slate-300 flex items-center justify-between">
            <span>Fixný bod (bod otáčania a dĺžky):</span>
            <span className="text-[10px] text-sky-400 font-mono uppercase">{anchorMode}</span>
          </span>

          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <button
              onClick={() => setAnchorMode('start')}
              className={`py-1.5 px-1 rounded-lg border font-semibold transition ${
                anchorMode === 'start'
                  ? 'border-sky-400 bg-sky-950 text-sky-300 shadow-sm'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
              }`}
            >
              Začiatok steny
            </button>

            <button
              onClick={() => setAnchorMode('center')}
              className={`py-1.5 px-1 rounded-lg border font-semibold transition ${
                anchorMode === 'center'
                  ? 'border-sky-400 bg-sky-950 text-sky-300 shadow-sm'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
              }`}
            >
              Stred steny
            </button>

            <button
              onClick={() => setAnchorMode('end')}
              className={`py-1.5 px-1 rounded-lg border font-semibold transition ${
                anchorMode === 'end'
                  ? 'border-sky-400 bg-sky-950 text-sky-300 shadow-sm'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
              }`}
            >
              Koniec steny
            </button>
          </div>

          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Začiatok: [{wall.start.x.toFixed(2)}, {wall.start.y.toFixed(2)}]m | Koniec: [{wall.end.x.toFixed(2)}, {wall.end.y.toFixed(2)}]m
          </div>
        </div>

        {/* 4. HRÚBKA STENY (THICKNESS) - PRESNÉ NASTAVENIE NA CM */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Hrúbka steny (T)
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="5"
                max="100"
                step="1"
                value={Math.round(wall.thickness * 100)}
                onChange={(e) => {
                  const cm = parseFloat(e.target.value);
                  if (!isNaN(cm) && cm >= 1) {
                    handleThicknessChange(Number((cm / 100).toFixed(3)));
                  }
                }}
                className="w-16 bg-slate-900 border border-slate-700 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 rounded-lg px-2 py-1 text-right font-mono font-bold text-emerald-400 text-sm outline-none"
              />
              <span className="font-mono text-xs text-slate-400 font-bold">cm</span>
            </div>
          </div>

          {/* Stepper buttons (-5, -1, +1, +5 cm) and Slider */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleThicknessChange(Math.max(0.05, Number((wall.thickness - 0.05).toFixed(2))))}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-xs font-mono font-bold text-slate-400 hover:text-slate-200 transition"
              title="-5 cm"
            >
              -5
            </button>
            <button
              onClick={() => handleThicknessChange(Math.max(0.05, Number((wall.thickness - 0.01).toFixed(2))))}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-xs font-mono font-bold text-slate-400 hover:text-slate-200 transition"
              title="-1 cm"
            >
              -1
            </button>
            <input
              type="range"
              min="5"
              max="60"
              step="1"
              value={Math.round(wall.thickness * 100)}
              onChange={(e) => handleThicknessChange(Number((parseInt(e.target.value, 10) / 100).toFixed(2)))}
              className="flex-1 accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <button
              onClick={() => handleThicknessChange(Number((wall.thickness + 0.01).toFixed(2)))}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-xs font-mono font-bold text-slate-400 hover:text-slate-200 transition"
              title="+1 cm"
            >
              +1
            </button>
            <button
              onClick={() => handleThicknessChange(Number((wall.thickness + 0.05).toFixed(2)))}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-xs font-mono font-bold text-slate-400 hover:text-slate-200 transition"
              title="+5 cm"
            >
              +5
            </button>
          </div>

          {/* Quick preset buttons for standard Slovak building thicknesses */}
          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
            {[
              { val: 0.10, label: '10 cm (SDK)' },
              { val: 0.115, label: '11.5 cm (Ytong)' },
              { val: 0.125, label: '12.5 cm (SDK)' },
              { val: 0.15, label: '15 cm (Priečka)' },
              { val: 0.20, label: '20 cm (Nosná)' },
              { val: 0.25, label: '25 cm (Aku)' },
              { val: 0.30, label: '30 cm (Obvod)' },
              { val: 0.38, label: '38 cm (Tehla)' },
              { val: 0.44, label: '44 cm (Porotherm)' },
            ].map((p) => (
              <button
                key={p.val}
                onClick={() => handleThicknessChange(p.val)}
                className={`py-1 rounded-lg border text-center transition text-[10px] ${
                  Math.abs(wall.thickness - p.val) < 0.008
                    ? 'border-emerald-400 bg-emerald-950 text-emerald-300 font-bold'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5. MATERIÁL STENY (PRE ELEKTROINŠTALÁCIU) */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            Materiál steny (Spôsob uloženia STN)
          </span>

          <select
            value={wall.material || 'aerated_concrete'}
            onChange={(e) => handleMaterialChange(e.target.value as WallMaterial)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs focus:ring-1 focus:ring-sky-400 outline-none"
          >
            <option value="aerated_concrete">Pórobetón (Ytong, Porfix - ľahké drážkovanie)</option>
            <option value="brick">Pálená tehla (Heluz, Porotherm - drážky v omietke)</option>
            <option value="drywall_sdk">Sadrokartón SDK (vedenie v dutine, krabice s packami)</option>
            <option value="concrete">Železobetón (monolit - predsteny / debnenie)</option>
          </select>
        </div>

        {/* 5B. PODKROVIE & ŠIKMINA STRECHY / SKOSENIE */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <span className="text-amber-400">📐</span>
              Podkrovie & Šikmina strechy
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(wall.atticSlope?.enabled)}
                onChange={(e) => handleToggleAtticSlope(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {wall.atticSlope?.enabled && (
            <div className="flex flex-col gap-3 pt-1 border-t border-slate-800/80">
              {/* Type Switcher: Knee Wall + Roof Slope vs Gable Wall Slope */}
              <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleUpdateAtticSlope({ type: 'knee_wall_roof' })}
                  className={`py-1.5 px-2 rounded-md font-bold text-[10px] text-center transition ${
                    wall.atticSlope.type !== 'gable_slope'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pomúrnica + šikmý strop
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateAtticSlope({ type: 'gable_slope' })}
                  className={`py-1.5 px-2 rounded-md font-bold text-[10px] text-center transition ${
                    wall.atticSlope.type === 'gable_slope'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Štítová stena (po dĺžke)
                </button>
              </div>

              {wall.atticSlope.type !== 'gable_slope' ? (
                <>
                  {/* Knee Wall Height (Výška podmurovky / námurovky) */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-semibold text-[11px]">
                        Výška zvislej steny (podmurovka):
                      </span>
                      <div className="flex items-center gap-1 font-mono font-bold text-amber-400">
                        <input
                          type="number"
                          step="0.05"
                          min="0.2"
                          max="2.5"
                          value={wall.atticSlope.kneeWallHeight ?? 1.0}
                          onChange={(e) =>
                            handleUpdateAtticSlope({
                              kneeWallHeight: parseFloat(e.target.value) || 1.0,
                            })
                          }
                          className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-amber-400 outline-none focus:border-amber-400"
                        />
                        <span>m</span>
                      </div>
                    </div>
                    {/* Steppers */}
                    <div className="grid grid-cols-4 gap-1 text-[10px]">
                      {[0.8, 1.0, 1.2, 1.5].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => handleUpdateAtticSlope({ kneeWallHeight: h })}
                          className={`py-0.5 rounded border text-center transition ${
                            Math.abs((wall.atticSlope?.kneeWallHeight ?? 1.0) - h) < 0.04
                              ? 'border-amber-400 bg-amber-950/60 text-amber-300 font-bold'
                              : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {h.toFixed(1)} m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Roof Angle (Sklon strechy) */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-semibold text-[11px]">
                        Sklon strechy (uhol šikminy):
                      </span>
                      <div className="flex items-center gap-1 font-mono font-bold text-amber-400">
                        <input
                          type="number"
                          step="1"
                          min="15"
                          max="75"
                          value={wall.atticSlope.roofAngleDeg ?? 38}
                          onChange={(e) =>
                            handleUpdateAtticSlope({
                              roofAngleDeg: parseFloat(e.target.value) || 38,
                            })
                          }
                          className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-amber-400 outline-none focus:border-amber-400"
                        />
                        <span>°</span>
                      </div>
                    </div>
                    {/* Steppers */}
                    <div className="grid grid-cols-5 gap-1 text-[10px]">
                      {[30, 35, 38, 40, 45].map((ang) => (
                        <button
                          key={ang}
                          type="button"
                          onClick={() => handleUpdateAtticSlope({ roofAngleDeg: ang })}
                          className={`py-0.5 rounded border text-center transition ${
                            (wall.atticSlope?.roofAngleDeg ?? 38) === ang
                              ? 'border-amber-400 bg-amber-950/60 text-amber-300 font-bold'
                              : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {ang}°
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ceiling Height (Výška stropu) */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-semibold text-[11px]">
                      Výška po vodorovný strop:
                    </span>
                    <div className="flex items-center gap-1 font-mono font-bold text-amber-400">
                      <input
                        type="number"
                        step="0.05"
                        min="1.5"
                        max="5.0"
                        value={wall.atticSlope.ceilingHeight ?? (floorHeight || 2.6)}
                        onChange={(e) =>
                          handleUpdateAtticSlope({
                            ceilingHeight: parseFloat(e.target.value) || (floorHeight || 2.6),
                          })
                        }
                        className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-amber-400 outline-none focus:border-amber-400"
                      />
                      <span>m</span>
                    </div>
                  </div>

                  {/* Slope Direction (Smer stúpania do interiéru) */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-300 font-semibold text-[11px]">
                      Smer stúpania šikminy:
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateAtticSlope({ slopeDirection: 'left' })}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                          (wall.atticSlope.slopeDirection || 'left') === 'left'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        ⟵ Vľavo (interiér)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateAtticSlope({ slopeDirection: 'right' })}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                          wall.atticSlope.slopeDirection === 'right'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Vpravo (interiér) ⟶
                      </button>
                    </div>
                  </div>

                  {/* Calculation Card (Real-time computed parameters) */}
                  {(() => {
                    const kneeH = wall.atticSlope.kneeWallHeight ?? 1.0;
                    const ceilH = wall.atticSlope.ceilingHeight ?? (floorHeight || 2.6);
                    const angDeg = wall.atticSlope.roofAngleDeg ?? 38;
                    const deltaH = Math.max(0.1, ceilH - kneeH);
                    const angRad = (angDeg * Math.PI) / 180;
                    const depth = deltaH / Math.tan(angRad);
                    const slopeSpan = Math.hypot(depth, deltaH);

                    return (
                      <div className="bg-slate-900/90 rounded-lg p-2.5 border border-amber-500/20 flex flex-col gap-1 text-[10.5px]">
                        <div className="text-amber-400 font-bold flex items-center justify-between">
                          <span>📐 Šikmá dĺžka stropu:</span>
                          <span>{slopeSpan.toFixed(2)} m</span>
                        </div>
                        <div className="text-slate-400 flex items-center justify-between">
                          <span>Pôdorysný prienik do miestnosti (po strop):</span>
                          <span className="font-mono text-slate-200">{depth.toFixed(2)} m</span>
                        </div>
                        <div className="text-slate-400 flex items-center justify-between">
                          <span>Prevýšenie po strop (ΔH):</span>
                          <span className="font-mono text-amber-300">
                            +{deltaH.toFixed(2)} m ({kneeH.toFixed(2)}m ↗ {ceilH.toFixed(2)}m)
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <>
                  {/* Gable Slope: Start Height and End Height */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-semibold text-[11px]">
                        Výška na začiatku steny (štart):
                      </span>
                      <div className="flex items-center gap-1 font-mono font-bold text-amber-400">
                        <input
                          type="number"
                          step="0.05"
                          min="0.2"
                          max="6.0"
                          value={wall.atticSlope.startHeight ?? 1.0}
                          onChange={(e) =>
                            handleUpdateAtticSlope({
                              startHeight: parseFloat(e.target.value) || 1.0,
                            })
                          }
                          className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-amber-400 outline-none focus:border-amber-400"
                        />
                        <span>m</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-semibold text-[11px]">
                        Výška na konci steny (hrebeň):
                      </span>
                      <div className="flex items-center gap-1 font-mono font-bold text-amber-400">
                        <input
                          type="number"
                          step="0.05"
                          min="0.2"
                          max="6.0"
                          value={wall.atticSlope.endHeight ?? 3.2}
                          onChange={(e) =>
                            handleUpdateAtticSlope({
                              endHeight: parseFloat(e.target.value) || 3.2,
                            })
                          }
                          className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-amber-400 outline-none focus:border-amber-400"
                        />
                        <span>m</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateAtticSlope({
                          startHeight: wall.atticSlope?.endHeight ?? 3.2,
                          endHeight: wall.atticSlope?.startHeight ?? 1.0,
                        })
                      }
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 font-bold text-[10px] flex items-center justify-center gap-1.5 transition"
                    >
                      <RotateCw className="w-3 h-3 text-amber-400" />
                      Prehodiť sklon (začiatok ⇄ koniec)
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 6. OTVORY V TEJTO STENE (DOORS & WINDOWS) */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <DoorOpen className="w-4 h-4 text-sky-400" />
              Otvory v stene ({wall.openings.length})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAddOpening('door')}
                className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700/60 px-2 py-1 rounded text-[10.5px] font-semibold transition"
                title="Pridať dvere do tejto steny"
              >
                <Plus className="w-3 h-3" />
                Dvere
              </button>
              <button
                type="button"
                onClick={() => handleAddOpening('window')}
                className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700/60 px-2 py-1 rounded text-[10.5px] font-semibold transition"
                title="Pridať okno do tejto steny"
              >
                <Plus className="w-3 h-3" />
                Okno
              </button>
            </div>
          </div>

          {wall.openings.length === 0 ? (
            <div className="bg-slate-900/60 rounded-lg p-3 text-center border border-dashed border-slate-800 text-[11px] text-slate-400 flex flex-col items-center gap-2">
              <span>V tejto stene nie je vytvorený žiadny otvor.</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAddOpening('door')}
                  className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded font-medium text-[10.5px] hover:bg-emerald-500/20 transition"
                >
                  + Dvere (90×200 cm)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddOpening('window')}
                  className="px-2.5 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded font-medium text-[10.5px] hover:bg-sky-500/20 transition"
                >
                  + Okno (120×140 cm)
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {wall.openings.map((op, idx) => {
                const isSelected = selectedOpeningId === op.id;
                const isExpanded = expandedOpeningIds[op.id] ?? isSelected;
                const widthCm = Math.round(op.width * 100);
                const heightCm = Math.round(op.height * 100);
                const elevCm = Math.round((op.elevation || 0) * 100);
                const distFromStart = Number((op.positionRatio * currentLength).toFixed(2));
                const distFromEnd = Number(((1 - op.positionRatio) * currentLength).toFixed(2));

                return (
                  <div
                    key={op.id}
                    className={`rounded-xl border transition flex flex-col overflow-hidden ${
                      isSelected
                        ? 'bg-slate-900/95 border-sky-400 ring-1 ring-sky-400/50 shadow-lg shadow-sky-500/10'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header: Title, summary badge, delete button */}
                    <div
                      onClick={() => toggleOpeningExpand(op.id)}
                      className="p-2.5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-800/40 transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {op.type === 'door' ? (
                          <DoorOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : op.type === 'window' ? (
                          <AppWindow className="w-4 h-4 text-sky-400 shrink-0" />
                        ) : (
                          <Maximize2 className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span className="font-bold text-slate-200 text-xs truncate">
                          {op.label ? op.label : op.type === 'door' ? `Dvere #${idx + 1}` : op.type === 'window' ? `Okno #${idx + 1}` : `Priechod #${idx + 1}`}
                        </span>
                        <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded font-mono text-slate-300 border border-slate-800 shrink-0">
                          {widthCm}×{heightCm} cm{op.type === 'door' ? ` (${op.swingDirection === 'right' ? 'P' : 'L'})` : op.type === 'window' ? ` (P:${elevCm})` : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOpening(op.id);
                          }}
                          className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-red-950/40 transition"
                          title="Odstrániť tento otvor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="text-slate-400 p-0.5">
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail / Editor Form */}
                    {isExpanded && (
                      <div className="p-3 pt-0 border-t border-slate-800/60 flex flex-col gap-3 text-xs">
                        {/* Type Switcher */}
                        <div className="flex gap-1 pt-2.5">
                          {(['door', 'window', 'niche'] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                const newElevation = t === 'door' ? 0 : t === 'window' ? (op.elevation || 0.9) : 0;
                                handleUpdateOpening(op.id, { type: t, elevation: newElevation });
                              }}
                              className={`flex-1 py-1 rounded text-[10.5px] font-semibold border transition ${
                                op.type === t
                                  ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {t === 'door' ? 'Dvere' : t === 'window' ? 'Okno' : 'Priechod'}
                            </button>
                          ))}
                        </div>

                        {/* 0. OZNAČENIE / NÁZOV OTVORU */}
                        <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                          <span className="font-semibold text-slate-300 text-[11px]">
                            Označenie otvoru:
                          </span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              placeholder={op.type === 'door' ? `D${idx + 1}` : op.type === 'window' ? `O${idx + 1}` : `P${idx + 1}`}
                              value={op.label || ''}
                              onChange={(e) => handleUpdateOpening(op.id, { label: e.target.value })}
                              className="w-28 bg-slate-900 border border-slate-700 focus:border-sky-400 rounded px-2 py-0.5 font-mono text-slate-200 text-xs outline-none"
                            />
                            {!op.label && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOpening(op.id, { label: op.type === 'door' ? `D${idx + 1}` : op.type === 'window' ? `O${idx + 1}` : `P${idx + 1}` })}
                                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-sky-300 font-mono transition"
                                title="Nastaviť automatické označenie"
                              >
                                {op.type === 'door' ? `D${idx + 1}` : op.type === 'window' ? `O${idx + 1}` : `P${idx + 1}`}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 1. ŠÍRKA OTVORU (WIDTH) */}
                        <div className="flex flex-col gap-1.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-300 text-[11px]">
                              Šírka otvoru:
                            </span>
                            <div className="flex items-center gap-1 font-mono font-bold text-sky-300">
                              <button
                                type="button"
                                onClick={() => handleUpdateOpening(op.id, { width: Math.max(0.4, Number((op.width - 0.05).toFixed(2))) })}
                                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                                title="Zmenšiť o 5 cm"
                              >
                                -5
                              </button>
                              <input
                                type="number"
                                step="1"
                                min="30"
                                max="600"
                                value={widthCm}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val) && val > 0) {
                                    handleUpdateOpening(op.id, { width: Number((val / 100).toFixed(2)) });
                                  }
                                }}
                                className="w-14 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-right font-mono text-sky-300 outline-none focus:border-sky-400"
                              />
                              <span className="text-[10px] text-slate-400">cm</span>
                              <span className="text-[10px] text-slate-500 font-mono">({op.width.toFixed(2)}m)</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateOpening(op.id, { width: Number((op.width + 0.05).toFixed(2)) })}
                                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                                title="Zväčšiť o 5 cm"
                              >
                                +5
                              </button>
                            </div>
                          </div>

                          {/* Quick Width Presets */}
                          <div className="flex flex-wrap gap-1 pt-1">
                            {(op.type === 'door'
                              ? [60, 70, 80, 90, 100, 120, 140, 160]
                              : [60, 90, 100, 120, 150, 180, 200, 240]
                            ).map((wVal) => (
                              <button
                                key={wVal}
                                type="button"
                                onClick={() => handleUpdateOpening(op.id, { width: wVal / 100 })}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition ${
                                  widthCm === wVal
                                    ? 'bg-sky-500/25 border-sky-400 text-sky-200 font-bold'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                              >
                                {wVal}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 2. VÝŠKA OTVORU (HEIGHT) */}
                        <div className="flex flex-col gap-1.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-300 text-[11px]">
                              Výška otvoru:
                            </span>
                            <div className="flex items-center gap-1 font-mono font-bold text-sky-300">
                              <button
                                type="button"
                                onClick={() => handleUpdateOpening(op.id, { height: Math.max(0.4, Number((op.height - 0.05).toFixed(2))) })}
                                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                                title="Zmenšiť o 5 cm"
                              >
                                -5
                              </button>
                              <input
                                type="number"
                                step="1"
                                min="30"
                                max="400"
                                value={heightCm}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val) && val > 0) {
                                    handleUpdateOpening(op.id, { height: Number((val / 100).toFixed(2)) });
                                  }
                                }}
                                className="w-14 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-right font-mono text-sky-300 outline-none focus:border-sky-400"
                              />
                              <span className="text-[10px] text-slate-400">cm</span>
                              <span className="text-[10px] text-slate-500 font-mono">({op.height.toFixed(2)}m)</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateOpening(op.id, { height: Number((op.height + 0.05).toFixed(2)) })}
                                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                                title="Zväčšiť o 5 cm"
                              >
                                +5
                              </button>
                            </div>
                          </div>

                          {/* Quick Height Presets */}
                          <div className="flex flex-wrap gap-1 pt-1">
                            {(op.type === 'door'
                              ? [197, 200, 210, 220]
                              : [60, 100, 120, 140, 150, 210, 220]
                            ).map((hVal) => (
                              <button
                                key={hVal}
                                type="button"
                                onClick={() => handleUpdateOpening(op.id, { height: hVal / 100 })}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition ${
                                  heightCm === hVal
                                    ? 'bg-sky-500/25 border-sky-400 text-sky-200 font-bold'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                              >
                                {hVal} cm
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 3. VÝŠKA PARAPETU (ELEVATION) */}
                        <div className="flex flex-col gap-1.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-300 text-[11px]">
                              {op.type === 'window' ? 'Výška parapetu (od podlahy):' : 'Výška prahu / nad podlahou:'}
                            </span>
                            <div className="flex items-center gap-1 font-mono font-bold text-sky-300">
                              <button
                                type="button"
                                onClick={() => handleUpdateOpening(op.id, { elevation: Math.max(0, Number(((op.elevation || 0) - 0.05).toFixed(2))) })}
                                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                                title="Znížiť o 5 cm"
                              >
                                -5
                              </button>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                max="250"
                                value={elevCm}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val) && val >= 0) {
                                    handleUpdateOpening(op.id, { elevation: Number((val / 100).toFixed(2)) });
                                  }
                                }}
                                className="w-14 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-right font-mono text-sky-300 outline-none focus:border-sky-400"
                              />
                              <span className="text-[10px] text-slate-400">cm</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateOpening(op.id, { elevation: Number(((op.elevation || 0) + 0.05).toFixed(2)) })}
                                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                                title="Zvýšiť o 5 cm"
                              >
                                +5
                              </button>
                            </div>
                          </div>

                          {/* Quick Parapet Presets */}
                          <div className="flex flex-wrap gap-1 pt-1">
                            {(op.type === 'door'
                              ? [0, 5, 10]
                              : [0, 85, 90, 100, 120, 150]
                            ).map((pVal) => (
                              <button
                                key={pVal}
                                type="button"
                                onClick={() => handleUpdateOpening(op.id, { elevation: pVal / 100 })}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition ${
                                  elevCm === pVal
                                    ? 'bg-sky-500/25 border-sky-400 text-sky-200 font-bold'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                              >
                                {pVal === 0 ? '0 (Podlaha)' : pVal === 85 ? '85 (STN)' : `${pVal} cm`}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 4. POZÍCIA NA STENE */}
                        <div className="flex flex-col gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-300 text-[11px]">
                              Umiestnenie na stene:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateOpening(op.id, { positionRatio: 0.5 })}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded text-[10px] font-medium transition"
                            >
                              Vycentrovať
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-400">Od začiatku steny:</span>
                              <div className="flex items-center gap-1 font-mono">
                                <input
                                  type="number"
                                  step="0.05"
                                  min="0.1"
                                  max={currentLength - 0.1}
                                  value={distFromStart}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && currentLength > 0.1) {
                                      const ratio = Math.max(0.05, Math.min(0.95, val / currentLength));
                                      handleUpdateOpening(op.id, { positionRatio: Number(ratio.toFixed(3)) });
                                    }
                                  }}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 font-mono text-slate-200 outline-none focus:border-sky-400"
                                />
                                <span>m</span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <span className="text-slate-400">Od konca steny:</span>
                              <div className="flex items-center gap-1 font-mono">
                                <input
                                  type="number"
                                  step="0.05"
                                  min="0.1"
                                  max={currentLength - 0.1}
                                  value={distFromEnd}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && currentLength > 0.1) {
                                      const ratio = Math.max(0.05, Math.min(0.95, (currentLength - val) / currentLength));
                                      handleUpdateOpening(op.id, { positionRatio: Number(ratio.toFixed(3)) });
                                    }
                                  }}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 font-mono text-slate-200 outline-none focus:border-sky-400"
                                />
                                <span>m</span>
                              </div>
                            </div>
                          </div>

                          {/* Slider for smooth visual movement */}
                          <input
                            type="range"
                            min="0.05"
                            max="0.95"
                            step="0.01"
                            value={op.positionRatio}
                            onChange={(e) => handleUpdateOpening(op.id, { positionRatio: parseFloat(e.target.value) })}
                            className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                          />
                        </div>

                        {/* 5. SMER OTVÁRANIA (iba pre dvere) */}
                        {op.type === 'door' && (
                          <div className="flex flex-col gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                            {/* 1. Orientácia pántov (Ľavé / Pravé dvere podľa STN) */}
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-300 text-[11px]">
                                Orientácia (pánty dverí):
                              </span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOpening(op.id, { swingDirection: 'left' })}
                                  className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                                    (op.swingDirection ?? 'left') === 'left'
                                      ? 'bg-sky-500/25 border-sky-400 text-sky-200'
                                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                  }`}
                                  title="Ľavé dvere (L) - pánty na ľavej strane"
                                >
                                  ⟵ Ľavé (L)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOpening(op.id, { swingDirection: 'right' })}
                                  className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                                    op.swingDirection === 'right'
                                      ? 'bg-sky-500/25 border-sky-400 text-sky-200'
                                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                  }`}
                                  title="Pravé dvere (P) - pánty na pravej strane"
                                >
                                  Pravé (P) ⟶
                                </button>
                              </div>
                            </div>

                            {/* 2. Smer otvárania (Dovnútra / Von) */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                              <span className="font-semibold text-slate-300 text-[11px]">
                                Smer otvárania krídla:
                              </span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOpening(op.id, { swingSide: 'left' })}
                                  className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                                    (op.swingSide ?? 'left') === 'left'
                                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                  }`}
                                  title="Otváranie krídla dovnútra miestnosti"
                                >
                                  Dovnútra
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOpening(op.id, { swingSide: 'right' })}
                                  className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                                    op.swingSide === 'right'
                                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                  }`}
                                  title="Otváranie krídla von z miestnosti"
                                >
                                  Von
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 6B. KALIBRÁCIA MIERKY PODKLADOVÉHO PÔDORYSU */}
        {hasBlueprintUnderlay && onCalibrateUnderlayWithWall && (
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-sky-500/40 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-300 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-sky-400" />
                Mierka podkladu z PDF
              </span>
              <span className="text-[10px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded font-mono border border-sky-500/30">
                Kalibrácia
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Ak nástroj načítal nesprávnu mierku z PDF, zadajte skutočnú dĺžku tejto steny (z kóty vo výkrese). Celý podklad sa automaticky prepočíta a zosúladí:
            </p>

            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus-within:border-sky-400">
                <input
                  type="number"
                  step="0.05"
                  min="0.2"
                  value={calibLength}
                  onChange={(e) => setCalibLength(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-slate-100 font-mono font-bold text-sm outline-none"
                  placeholder="napr. 5.50"
                />
                <span className="text-slate-400 font-bold text-xs ml-1">m</span>
              </div>

              <button
                onClick={() => onCalibrateUnderlayWithWall(wall, calibLength, rescaleAll)}
                className="py-2 px-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-lg text-xs transition shadow-md shadow-sky-500/20 active:scale-95"
              >
                Prispôsobiť podklad
              </button>
            </div>

            <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer mt-0.5">
              <input
                type="checkbox"
                checked={rescaleAll}
                onChange={(e) => setRescaleAll(e.target.checked)}
                className="accent-sky-400 rounded"
              />
              <span>Prepočítať aj ostatné steny a komponenty</span>
            </label>
          </div>
        )}

        {/* 7. AKCIE: OTOČIŤ & ZMAZAŤ STENU */}
        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={handleFlipWall}
            className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
            Otočiť smer steny (Zameniť začiatok a koniec)
          </button>

          <button
            onClick={() => onDeleteWall(wall.id)}
            className="w-full py-2.5 px-3 bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-800/50 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Trash2 className="w-4 h-4" />
            Zmazať túto stenu
          </button>
        </div>
      </div>
    </div>
  );
};
