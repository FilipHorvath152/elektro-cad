import React from 'react';
import {
  X,
  Trash2,
  Ruler,
  Move,
  Maximize2,
  ShieldCheck,
  Droplets,
  Layers,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Sparkles,
  Info,
  ArrowLeftRight,
} from 'lucide-react';
import { InstallationZone, InstallationZoneType, Wall } from '../types/cad';

interface ZonePropertiesPanelProps {
  zone: InstallationZone;
  allWalls: Wall[];
  floorHeight: number;
  onUpdateZone: (updated: InstallationZone) => void;
  onDeleteZone: (zoneId: string) => void;
  onClose: () => void;
}

export const ZonePropertiesPanel: React.FC<ZonePropertiesPanelProps> = ({
  zone,
  allWalls,
  floorHeight,
  onUpdateZone,
  onDeleteZone,
  onClose,
}) => {
  const wall = zone.wallId ? allWalls.find((w) => w.id === zone.wallId) : undefined;
  const wallLength = wall
    ? Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y)
    : undefined;

  const currentDist = zone.distanceFromStartMeters ?? 0;
  const currentLength = zone.lengthMeters ?? (wallLength || 2.0);
  const currentWidth = zone.widthMeters ?? 0.30;

  // Move along wall
  const handleMove = (delta: number) => {
    if (!wallLength) return;
    const maxStart = Math.max(0, wallLength - currentLength);
    const nextStart = Number(Math.max(0, Math.min(maxStart, currentDist + delta)).toFixed(2));
    onUpdateZone({
      ...zone,
      distanceFromStartMeters: nextStart,
    });
  };

  // Resize length
  const handleResizeLength = (delta: number) => {
    if (!wallLength) return;
    const maxLen = wallLength - currentDist;
    const nextLen = Number(Math.max(0.2, Math.min(maxLen, currentLength + delta)).toFixed(2));
    onUpdateZone({
      ...zone,
      lengthMeters: nextLen,
    });
  };

  // Expand to full wall
  const handleExpandToFullWall = () => {
    if (!wallLength) return;
    onUpdateZone({
      ...zone,
      distanceFromStartMeters: 0,
      lengthMeters: Number(wallLength.toFixed(2)),
    });
  };

  // Set preset length
  const handleSetPresetLength = (len: number) => {
    if (!wallLength) return;
    const clampedLen = Math.min(wallLength, len);
    const maxStart = Math.max(0, wallLength - clampedLen);
    const nextStart = Math.min(currentDist, maxStart);
    onUpdateZone({
      ...zone,
      distanceFromStartMeters: Number(nextStart.toFixed(2)),
      lengthMeters: Number(clampedLen.toFixed(2)),
    });
  };

  const isKitchen = zone.type === 'zvs';
  const isBathroom = zone.type === 'bathroom';

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-20 shadow-xl overflow-hidden text-slate-100 select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
            style={{
              backgroundColor: isKitchen ? 'rgba(245, 158, 11, 0.2)' : isBathroom ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
              color: isKitchen ? '#f59e0b' : isBathroom ? '#ef4444' : '#38bdf8',
              border: `1px solid ${isKitchen ? 'rgba(245, 158, 11, 0.4)' : isBathroom ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`,
            }}
          >
            {isKitchen ? 'ZVS' : isBathroom ? 'KÚP' : zone.type.toUpperCase()}
          </div>
          <div>
            <span className="font-bold text-xs text-slate-100 block truncate max-w-[170px]">
              {zone.name}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {zone.stnReference || 'STN 33 2130'}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          title="Zavrieť panel vlastností"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Názov zóny */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-400">Názov zóny</label>
          <input
            type="text"
            value={zone.name}
            onChange={(e) => onUpdateZone({ ...zone, name: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
          />
        </div>

        {/* Typ zóny */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-400">Typ inštalačnej zóny</label>
          <select
            value={zone.type}
            onChange={(e) => {
              const newType = e.target.value as InstallationZoneType;
              let elevBottom = zone.elevationBottomMeters;
              let elevTop = zone.elevationTopMeters;
              let color = zone.color;
              if (newType === 'zvs') {
                elevBottom = 0.90;
                elevTop = 1.20;
                color = '#f59e0b';
              } else if (newType === 'zvd') {
                elevBottom = 0.15;
                elevTop = 0.45;
                color = '#2dd4bf';
              } else if (newType === 'zvh') {
                elevBottom = Math.max(0.1, floorHeight - 0.45);
                elevTop = Math.max(0.2, floorHeight - 0.15);
                color = '#38bdf8';
              } else if (newType === 'zvz') {
                elevBottom = 0.15;
                elevTop = Math.max(0.2, floorHeight - 0.15);
                color = '#34d399';
              }
              onUpdateZone({
                ...zone,
                type: newType,
                elevationBottomMeters: Number(elevBottom.toFixed(2)),
                elevationTopMeters: Number(elevTop.toFixed(2)),
                color,
              });
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="zvs">ZVS – Stredná / Kuchynská linka (90–120 cm)</option>
            <option value="zvd">ZVD – Dolná vodorovná (15–45 cm nad podlahou)</option>
            <option value="zvh">ZVH – Horná vodorovná (15–45 cm pod stropom)</option>
            <option value="zvz">ZVZ – Zvislá zóna pri dverách (vypínače)</option>
            <option value="zvr">ZVR – Zvislá zóna v rohu steny</option>
            <option value="ceiling">Stropný koridor SDK</option>
            <option value="bathroom">Kúpeľňa – Bezpečnostná zóna</option>
            <option value="custom">Vlastná inštalačná zóna</option>
          </select>
        </div>

        {/* Wall Bound Controls */}
        {wall && wallLength && (
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Naviazaná na stenu:</span>
              <span className="font-mono text-slate-200 font-bold">Dĺžka steny {wallLength.toFixed(2)} m</span>
            </div>

            {/* Dĺžka zóny */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-teal-400" />
                  Dĺžka zóny na stene
                </span>
                <span className="text-xs font-mono font-bold text-teal-300">
                  {currentLength.toFixed(2)} m
                </span>
              </div>

              {/* Slider & Stepper */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleResizeLength(-0.2)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 border border-slate-700 transition"
                  title="Zmenšiť rozmer o 20 cm"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="0.2"
                  max={Number((wallLength - currentDist).toFixed(2))}
                  step="0.05"
                  value={currentLength}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) handleSetPresetLength(val);
                  }}
                  className="flex-1 accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <button
                  onClick={() => handleResizeLength(+0.2)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 border border-slate-700 transition"
                  title="Zväčšiť rozmer o 20 cm"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Rýchle predvoľby dĺžky */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  onClick={() => handleSetPresetLength(1.2)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono transition"
                >
                  1.2 m
                </button>
                <button
                  onClick={() => handleSetPresetLength(1.8)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono transition"
                >
                  1.8 m
                </button>
                <button
                  onClick={() => handleSetPresetLength(2.4)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-[10px] font-mono transition border border-amber-500/30 font-bold"
                  title="Typická dĺžka kuchynskej linky"
                >
                  2.4 m (Linka)
                </button>
                <button
                  onClick={() => handleSetPresetLength(3.0)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono transition"
                >
                  3.0 m
                </button>
                <button
                  onClick={handleExpandToFullWall}
                  className="px-2 py-1 bg-teal-950 hover:bg-teal-900 text-teal-300 rounded text-[10px] font-mono transition border border-teal-800 ml-auto"
                  title="Roztiahnuť po celej stene"
                >
                  Celá stena
                </button>
              </div>
            </div>

            {/* Pozícia / Posun pozdĺž steny */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-sky-400" />
                  Začiatok zóny od rohu steny
                </span>
                <span className="text-xs font-mono font-bold text-sky-300">
                  {currentDist.toFixed(2)} m
                </span>
              </div>

              {/* Posúvacie tlačidlá */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleMove(-0.1)}
                  disabled={currentDist <= 0}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Posunúť vľavo (-0.1m)</span>
                </button>
                <button
                  onClick={() => handleMove(+0.1)}
                  disabled={currentDist + currentLength >= wallLength}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition"
                >
                  <span>Posunúť vpravo (+0.1m)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Strana steny */}
            <div className="space-y-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  Strana steny
                </label>
                {isKitchen && (
                  <span className="text-[10px] text-amber-400 font-medium">Iba jedna strana (kuchyňa)</span>
                )}
              </div>

              <div className={`grid ${isKitchen ? 'grid-cols-2' : 'grid-cols-3'} gap-1.5`}>
                {!isKitchen && (
                  <button
                    type="button"
                    onClick={() => onUpdateZone({ ...zone, side: 'both' })}
                    className={`py-1.5 rounded-lg text-xs font-bold transition border ${
                      (zone.side || 'both') === 'both'
                        ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    Obe strany
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onUpdateZone({ ...zone, side: 'left' })}
                  className={`py-1.5 rounded-lg text-xs font-bold transition border ${
                    ((isKitchen && (!zone.side || zone.side === 'both')) ? 'left' : (zone.side || 'both')) === 'left'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  Ľavá strana
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateZone({ ...zone, side: 'right' })}
                  className={`py-1.5 rounded-lg text-xs font-bold transition border ${
                    ((isKitchen && (!zone.side || zone.side === 'both')) ? 'left' : (zone.side || 'both')) === 'right'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  Pravá strana
                </button>
              </div>

              {/* Rýchle prehodenie strany steny */}
              <button
                type="button"
                onClick={() => {
                  const currentEffective = (isKitchen && (!zone.side || zone.side === 'both')) ? 'left' : (zone.side || 'both');
                  const nextSide = currentEffective === 'left' ? 'right' : 'left';
                  onUpdateZone({ ...zone, side: nextSide });
                }}
                className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-[11px] font-medium text-slate-300 flex items-center justify-center gap-1.5 transition active:scale-95"
                title="Prehodiť zónu na opačnú stranu steny (napr. dovnútra miestnosti)"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
                <span>Prehodiť stranu steny (vľavo ⇄ vpravo)</span>
              </button>
            </div>
          </div>
        )}

        {/* Area / Bathroom Controls */}
        {isBathroom && zone.dimensions && (
          <div className="bg-slate-950/70 p-3 rounded-xl border border-red-500/30 space-y-3">
            <span className="font-bold text-red-300 text-xs block">Rozmery vane / sprchy (Zóna 0 & 1):</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Dĺžka (m):</label>
                <input
                  type="number"
                  step="0.1"
                  value={zone.dimensions.width}
                  onChange={(e) => {
                    const w = parseFloat(e.target.value) || 1.6;
                    onUpdateZone({
                      ...zone,
                      dimensions: { ...zone.dimensions!, width: w },
                      widthMeters: w,
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Šírka (m):</label>
                <input
                  type="number"
                  step="0.1"
                  value={zone.dimensions.height}
                  onChange={(e) => {
                    const h = parseFloat(e.target.value) || 0.8;
                    onUpdateZone({
                      ...zone,
                      dimensions: { ...zone.dimensions!, height: h },
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Šírka pásma zóny */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-400">Šírka pásma v stene (STN norma)</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[0.20, 0.30, 0.40].map((w) => (
              <button
                key={w}
                onClick={() => onUpdateZone({ ...zone, widthMeters: w })}
                className={`py-1.5 rounded-lg text-xs font-mono font-bold transition border ${
                  Math.abs(currentWidth - w) < 0.02
                    ? 'bg-teal-500 text-slate-950 border-teal-400'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                {(w * 100).toFixed(0)} cm
              </button>
            ))}
          </div>
        </div>

        {/* Výškové umiestnenie */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-400">Výšková úroveň (Z):</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
              STN 33 2130
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block">Spodná hrana:</span>
              <span className="font-mono font-bold text-slate-200">{zone.elevationBottomMeters.toFixed(2)} m</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Horná hrana:</span>
              <span className="font-mono font-bold text-slate-200">{zone.elevationTopMeters.toFixed(2)} m</span>
            </div>
          </div>
        </div>

        {/* STN Tip Card */}
        {zone.description && (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-normal">
              {zone.description}
            </p>
          </div>
        )}
      </div>

      {/* Footer / Delete */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80">
        <button
          onClick={() => {
            if (confirm(`Naozaj chcete odstrániť zónu "${zone.name}"?`)) {
              onDeleteZone(zone.id);
            }
          }}
          className="w-full py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Odstrániť túto zónu</span>
        </button>
      </div>
    </aside>
  );
};
