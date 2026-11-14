import React from 'react';
import { Circuit, ElectricalComponent, PathwayPreference, SwitchboardEnclosure, Wall } from '../types/cad';
import { getRecommendedHeight, STN_HEIGHT_RECOMMENDATIONS } from '../constants/stnStandards';
import { LEGRAND_DEVICES, SHELLY_DEVICES } from '../constants/catalog';
import { calculateComponentRoute } from '../services/routingService';
import {
  Trash2,
  ShieldCheck,
  Zap,
  Sliders,
  Cpu,
  ArrowUpRight,
  GitFork,
  Lightbulb,
  ToggleLeft,
  Flame,
  Droplets,
  AlertTriangle,
  Layers,
  Move,
  RotateCw,
} from 'lucide-react';

interface ComponentPropertiesPanelProps {
  component: ElectricalComponent;
  floorComponents: ElectricalComponent[];
  allWalls?: Wall[];
  switchboard?: SwitchboardEnclosure;
  floorHeight: number;
  circuits: Circuit[];
  onUpdateComponent: (updated: ElectricalComponent) => void;
  onDeleteComponent: (id: string) => void;
  onClose: () => void;
}

export const ComponentPropertiesPanel: React.FC<ComponentPropertiesPanelProps> = ({
  component,
  floorComponents,
  allWalls,
  switchboard,
  floorHeight,
  circuits,
  onUpdateComponent,
  onDeleteComponent,
  onClose,
}) => {
  const normRec = STN_HEIGHT_RECOMMENDATIONS[component.type];
  const standardHeight = normRec?.defaultHeightMeters ?? 0.30;

  // Real-time calculation of 3D route to switchboard
  const routeCalc = switchboard
    ? calculateComponentRoute(component, switchboard, floorHeight)
    : null;

  const handleHeightChange = (val: number) => {
    onUpdateComponent({
      ...component,
      position: { ...component.position, z: Number(val.toFixed(2)) },
    });
  };

  const handlePathwayChange = (pathway: PathwayPreference) => {
    onUpdateComponent({
      ...component,
      pathwayPreference: pathway,
    });
  };

  const handleShellyChange = (model: string) => {
    if (model === 'none') {
      onUpdateComponent({
        ...component,
        smartModule: undefined,
      });
    } else {
      onUpdateComponent({
        ...component,
        smartModule: {
          brand: 'Shelly',
          model: model as any,
          location: 'in_box',
          mode: component.type.includes('blinds') ? 'roller_blinds' : 'switch',
        },
      });
    }
  };

  // Switch & Lighting linking helpers
  const isSwitchboard = component.type === 'switchboard';
  const isSwitch = component.type.startsWith('switch_') || component.type === 'push_button';
  const isLight = component.type.startsWith('light_');
  const allLights = floorComponents.filter((c) => c.type.startsWith('light_'));
  const allSwitches = floorComponents.filter((c) => c.type.startsWith('switch_') || c.type === 'push_button');

  const toggleTargetLight = (lightId: string) => {
    const current = component.targetLightIds || [];
    const exists = current.includes(lightId);
    const updated = exists ? current.filter((id) => id !== lightId) : [...current, lightId];

    onUpdateComponent({
      ...component,
      targetLightIds: updated,
      controlGroupId: component.controlGroupId || `grp-${Date.now()}`,
    });
  };

  // Find other switches that control the same light(s) (Staircase wiring detection)
  const relatedStaircaseSwitches = isSwitch && component.targetLightIds && component.targetLightIds.length > 0
    ? allSwitches.filter(
        (s) =>
          s.id !== component.id &&
          s.targetLightIds?.some((lId) => component.targetLightIds?.includes(lId))
      )
    : [];

  // If this is a light, find all switches that control it
  const switchesControllingThisLight = isLight
    ? allSwitches.filter((s) => s.targetLightIds?.includes(component.id))
    : [];

  // Attached wall lookup (or nearest wall within 0.35m)
  const attachedWall = React.useMemo(() => {
    if (!allWalls || allWalls.length === 0) return undefined;
    if (component.wallId) {
      const match = allWalls.find((w) => w.id === component.wallId);
      if (match) return match;
    }
    let bestDist = 0.35;
    let bestWall: Wall | undefined = undefined;
    const px = component.position.x;
    const py = component.position.y;
    for (const wall of allWalls) {
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq < 0.0001) continue;
      const t = Math.max(0, Math.min(1, ((px - wall.start.x) * dx + (py - wall.start.y) * dy) / lenSq));
      const projX = wall.start.x + t * dx;
      const projY = wall.start.y + t * dy;
      const dist = Math.hypot(px - projX, py - projY);
      if (dist < bestDist) {
        bestDist = dist;
        bestWall = wall;
      }
    }
    return bestWall;
  }, [allWalls, component.wallId, component.position.x, component.position.y]);

  const wallMetrics = React.useMemo(() => {
    if (!attachedWall) return null;
    const dx = attachedWall.end.x - attachedWall.start.x;
    const dy = attachedWall.end.y - attachedWall.start.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) return null;
    const ux = dx / len;
    const uy = dy / len;
    const currentDist = (component.position.x - attachedWall.start.x) * ux + (component.position.y - attachedWall.start.y) * uy;
    const clampedDist = Math.max(0.1, Math.min(len - 0.1, currentDist));
    return {
      wallLength: len,
      currentDist: clampedDist,
      ux,
      uy,
    };
  }, [attachedWall, component.position.x, component.position.y]);

  const handleStepAlongWall = (deltaMeters: number) => {
    if (!attachedWall || !wallMetrics) return;
    const newDist = Math.max(0.1, Math.min(wallMetrics.wallLength - 0.1, wallMetrics.currentDist + deltaMeters));
    const newX = attachedWall.start.x + wallMetrics.ux * newDist;
    const newY = attachedWall.start.y + wallMetrics.uy * newDist;
    const ratio = wallMetrics.wallLength > 0 ? Number((newDist / wallMetrics.wallLength).toFixed(3)) : 0.5;
    onUpdateComponent({
      ...component,
      position: { ...component.position, x: Number(newX.toFixed(3)), y: Number(newY.toFixed(3)) },
      wallId: attachedWall.id,
      distanceAlongWallRatio: ratio,
    });
  };

  const handleSetDistanceAlongWall = (newDist: number) => {
    if (!attachedWall || !wallMetrics) return;
    const clampedDist = Math.max(0.1, Math.min(wallMetrics.wallLength - 0.1, newDist));
    const newX = attachedWall.start.x + wallMetrics.ux * clampedDist;
    const newY = attachedWall.start.y + wallMetrics.uy * clampedDist;
    const ratio = wallMetrics.wallLength > 0 ? Number((clampedDist / wallMetrics.wallLength).toFixed(3)) : 0.5;
    onUpdateComponent({
      ...component,
      position: { ...component.position, x: Number(newX.toFixed(3)), y: Number(newY.toFixed(3)) },
      wallId: attachedWall.id,
      distanceAlongWallRatio: ratio,
    });
  };

  return (
    <div className="w-80 h-full bg-slate-900 border-l border-slate-800 flex flex-col text-slate-200 text-xs shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10 backdrop-blur-md">
        <div>
          <div className="text-[10px] text-sky-400 font-mono font-bold uppercase tracking-wider">
            Vlastnosti komponentu
          </div>
          <h3 className="font-bold text-sm text-slate-100 truncate">{component.label}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 text-base font-bold px-2 py-0.5 rounded hover:bg-slate-800 transition"
        >
          ✕
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* 0. SWITCHBOARD CONFIGURATION (RH vs RP) */}
        {isSwitchboard && (
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-red-500/30 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-red-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-red-400" />
                Druh a parametre rozvádzača
              </span>
              <span className="text-[10px] bg-red-950 text-red-300 px-1.5 py-0.5 rounded border border-red-800 font-mono font-bold">
                STN EN 61439
              </span>
            </div>

            {/* Prepínač typu rozvádzača: RH vs RP */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Druh rozvádzača:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateComponent({
                      ...component,
                      switchboardKind: 'main',
                      label: component.label.replace(/RP\d*/i, 'RH').replace(/Podružný/i, 'Hlavný') || 'Hlavný rozvádzač RH',
                      notes: 'RH',
                      catalogItem: {
                        brand: 'Legrand',
                        series: 'Practibox S',
                        code: '134018',
                        name: 'Hlavný rozvádzač Legrand Practibox S 36M pod omietku',
                        category: 'Rozvádzače',
                        priceEur: 68.0,
                      },
                    });
                  }}
                  className={`py-2 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    component.switchboardKind !== 'sub' && component.notes !== 'RP' && !component.label.includes('RP')
                      ? 'border-red-500 bg-red-950/70 text-red-300 shadow-md ring-1 ring-red-400/40'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span>⚡ Hlavný (RH)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateComponent({
                      ...component,
                      switchboardKind: 'sub',
                      label: component.label.replace(/RH\d*/i, 'RP1').replace(/Hlavný/i, 'Podružný') || 'Podružný rozvádzač RP1',
                      notes: 'RP',
                      catalogItem: {
                        brand: 'Legrand',
                        series: 'Practibox S',
                        code: '134016',
                        name: 'Podružný rozvádzač Legrand Practibox S 24M pod omietku',
                        category: 'Rozvádzače',
                        priceEur: 48.0,
                      },
                    });
                  }}
                  className={`py-2 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    component.switchboardKind === 'sub' || component.notes === 'RP' || component.label.includes('RP')
                      ? 'border-blue-500 bg-blue-950/70 text-blue-300 shadow-md ring-1 ring-blue-400/40'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span>⚡ Podružný (RP)</span>
                </button>
              </div>
            </div>

            {/* Označenie / Názov */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-300">Názov a kód označenia:</label>
              <input
                type="text"
                value={component.label}
                onChange={(e) => onUpdateComponent({ ...component, label: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                placeholder="napr. RH, RP1, RP-Garáž"
              />
            </div>

            {/* Kapacita DIN modulov */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Kapacita skrine (DIN moduly):</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[12, 18, 24, 36, 48, 72].map((mods) => {
                  const isCurrent = component.catalogItem.name.includes(`${mods}M`);
                  return (
                    <button
                      key={mods}
                      type="button"
                      onClick={() => {
                        onUpdateComponent({
                          ...component,
                          catalogItem: {
                            ...component.catalogItem,
                            name: component.catalogItem.name.replace(/\d+M/, `${mods}M`),
                          },
                        });
                      }}
                      className={`py-1.5 rounded-lg border text-xs font-bold transition ${
                        isCurrent
                          ? 'border-amber-400 bg-amber-950 text-amber-300 ring-1 ring-amber-400/40'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {mods}M
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 1. LIGHTING & SWITCH WIRING (Step 4 & 7) */}
        {isSwitch && (
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-amber-500/30 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <GitFork className="w-4 h-4 text-amber-400" />
                Ovládané svietidlá
              </span>
              <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-500/30 font-bold">
                {component.targetLightIds?.length || 0}x svetlo
              </span>
            </div>

            {/* Staircase / Grouping mode badge */}
            {relatedStaircaseSwitches.length > 0 ? (
              <div className="bg-amber-950/40 p-2.5 rounded-lg border border-amber-500/40 flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-200">
                  <div className="font-bold">Schodiskové zapojenie (Radenie 6+6 / 6+7+6)</div>
                  <div className="text-[10px] text-amber-300/80">
                    Svietidlá sú ovládané aj spínačom:{' '}
                    {relatedStaircaseSwitches.map((s) => s.label).join(', ')}
                  </div>
                </div>
              </div>
            ) : component.targetLightIds && component.targetLightIds.length > 1 ? (
              <div className="bg-sky-950/40 p-2 rounded-lg border border-sky-500/30 text-[10px] text-sky-300">
                ✓ <strong>Skupinové ovládanie:</strong> Tento vypínač spína {component.targetLightIds.length} svietidlá súčasne.
              </div>
            ) : null}

            {/* List of lights to toggle */}
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Vyberte svietidlá na podlaží:
              </span>
              {allLights.length === 0 ? (
                <div className="text-[11px] text-slate-500 italic p-2 bg-slate-900/50 rounded-lg">
                  Na tomto podlaží zatiaľ nie sú žiadne svietidlá. Pridajte svietidlo v Kroku 4.
                </div>
              ) : (
                <div className="max-h-36 overflow-y-auto flex flex-col gap-1 pr-1">
                  {allLights.map((light) => {
                    const isChecked = component.targetLightIds?.includes(light.id) || false;
                    return (
                      <label
                        key={light.id}
                        className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition ${
                          isChecked
                            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200 font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleTargetLight(light.id)}
                            className="accent-amber-400 rounded"
                          />
                          <Lightbulb className={`w-3.5 h-3.5 ${isChecked ? 'text-amber-400' : 'text-slate-500'}`} />
                          <span className="truncate text-[11px]">{light.label}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {light.position.x.toFixed(1)}, {light.position.y.toFixed(1)}m
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* LIGHT: Shows controlling switches */}
        {isLight && (
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-sky-500/30 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-300 flex items-center gap-1.5">
                <ToggleLeft className="w-4 h-4 text-sky-400" />
                Ovládanie tohto svietidla
              </span>
              <span className="text-[10px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded font-mono border border-sky-500/30 font-bold">
                {switchesControllingThisLight.length}x vypínač
              </span>
            </div>

            {switchesControllingThisLight.length === 0 ? (
              <div className="text-[11px] text-amber-400 bg-amber-950/30 p-2.5 rounded-lg border border-amber-500/30 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Toto svietidlo zatiaľ nie je priradené k žiadnemu vypínaču.</span>
              </div>
            ) : switchesControllingThisLight.length === 1 ? (
              <div className="text-[11px] text-emerald-300 bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/30">
                ✓ <strong>Jednoduché spínanie:</strong> Ovládané vypínačom: {switchesControllingThisLight[0].label}
              </div>
            ) : (
              <div className="text-[11px] text-amber-300 bg-amber-950/30 p-2 rounded-lg border border-amber-500/30">
                ⚡ <strong>Schodiskové / striedavé ovládanie:</strong> Ovládané z {switchesControllingThisLight.length} miest ({switchesControllingThisLight.map((s) => s.label).join(', ')})
              </div>
            )}
          </div>
        )}

        {/* SPECIALIZED APPLIANCES (BOILER, HEATING, PUMP, HEAT PUMP) */}
        {(component.type === 'boiler' ||
          component.type === 'electric_heating' ||
          component.type === 'water_pump' ||
          component.type === 'heat_pump' ||
          component.type === 'cooker_outlet') && (
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-orange-500/30 flex flex-col gap-2">
            <span className="font-bold text-orange-300 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" />
              Špecializovaný spotrebič (STN 33 2130)
            </span>
            <div className="text-slate-300 text-[11px] leading-relaxed">
              {component.type === 'boiler' && 'Elektrický bojler: Príkon 2000 W. Vyžaduje samostatný obvod s prúdovým chráničom RCD 30mA a ističom B16A.'}
              {component.type === 'electric_heating' && 'Elektrické kúrenie: Príkon 2500 W. Spínané izbovým termostatom, vlastný obvod B16A.'}
              {component.type === 'water_pump' && 'Vodné čerpadlo: Príkon 1500 W. Motorový obvod s ochranou proti preťaženiu.'}
              {component.type === 'heat_pump' && 'Tepelné čerpadlo: 400V 3P (4-8 kW). Samostatný trojfázový prívod CYKY-J 5x2.5.'}
              {component.type === 'cooker_outlet' && 'Varná doska: 400V 3P (7 kW). Sporáková prípojka CYKY-J 5x2.5, istič B16A 3P.'}
            </div>
          </div>
        )}

        {/* POLOHA A PRESUN ROZVÁDZAČA / PRVKU */}
        <div className={`p-3.5 rounded-xl border flex flex-col gap-3 ${
          isSwitchboard
            ? 'bg-slate-950/90 border-amber-500/40 shadow-lg shadow-amber-500/5'
            : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`font-bold flex items-center gap-1.5 ${isSwitchboard ? 'text-amber-300' : 'text-slate-300'}`}>
              <Move className={`w-4 h-4 ${isSwitchboard ? 'text-amber-400' : 'text-sky-400'}`} />
              {isSwitchboard ? 'Presun a poloha rozvádzača' : 'Presun a poloha prvku'}
            </span>
            <span className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700 font-bold">
              2D / 3D
            </span>
          </div>

          <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex items-start gap-2">
            <span className="text-sm leading-none">💡</span>
            <span>
              {isSwitchboard ? 'Rozvádzač' : 'Tento prvok'} môžete <strong>priamo chytiť a ťahať myšou</strong> v 2D pôdoryse (Drag & Drop), automaticky sa prichytáva k stenám.
            </span>
          </div>

          {/* Posun po stene, ak je naviazaný na stenu */}
          {attachedWall && wallMetrics && (
            <div className="flex flex-col gap-2 pt-1 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Vzdialenosť po stene:</span>
                <span className="font-mono text-sky-400 font-bold">
                  {wallMetrics.currentDist.toFixed(2)} m{' '}
                  <span className="text-slate-500 text-[10px] font-normal">/ {wallMetrics.wallLength.toFixed(2)} m</span>
                </span>
              </div>

              <input
                type="range"
                min={0.1}
                max={Math.max(0.2, wallMetrics.wallLength - 0.1)}
                step={0.05}
                value={wallMetrics.currentDist}
                onChange={(e) => handleSetDistanceAlongWall(parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />

              <div className="flex items-center justify-between gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleStepAlongWall(-0.5)}
                  className="flex-1 py-1 px-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-sky-500 rounded text-slate-300 font-mono transition text-center"
                  title="Posunúť o -50 cm dozadu po stene"
                >
                  -50cm
                </button>
                <button
                  type="button"
                  onClick={() => handleStepAlongWall(-0.1)}
                  className="flex-1 py-1 px-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-sky-500 rounded text-slate-300 font-mono transition text-center"
                  title="Jemný posun o -10 cm dozadu"
                >
                  -10cm
                </button>
                <button
                  type="button"
                  onClick={() => handleStepAlongWall(0.1)}
                  className="flex-1 py-1 px-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-sky-500 rounded text-slate-300 font-mono transition text-center"
                  title="Jemný posun o +10 cm dopredu"
                >
                  +10cm
                </button>
                <button
                  type="button"
                  onClick={() => handleStepAlongWall(0.5)}
                  className="flex-1 py-1 px-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-sky-500 rounded text-slate-300 font-mono transition text-center"
                  title="Posunúť o +50 cm dopredu po stene"
                >
                  +50cm
                </button>
              </div>
            </div>
          )}

          {/* Súradnice X a Y */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-400">Súradnica X [m]:</label>
              <input
                type="number"
                step="0.05"
                value={Number(component.position.x.toFixed(2))}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    onUpdateComponent({
                      ...component,
                      position: { ...component.position, x: val },
                    });
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-400">Súradnica Y [m]:</label>
              <input
                type="number"
                step="0.05"
                value={Number(component.position.y.toFixed(2))}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    onUpdateComponent({
                      ...component,
                      position: { ...component.position, y: val },
                    });
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Rýchle natočenie */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5 text-sky-400" />
                Natočenie:
              </span>
              <span className="font-mono text-sky-400 font-bold">
                {Math.round(((component.rotation || 0) * 180) / Math.PI) % 360}°
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 90, 180, 270].map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => {
                    const rad = (deg * Math.PI) / 180;
                    onUpdateComponent({
                      ...component,
                      rotation: rad,
                    });
                  }}
                  className={`py-1 rounded border text-xs font-mono transition ${
                    Math.round(((component.rotation || 0) * 180) / Math.PI) % 360 === deg
                      ? 'border-sky-400 bg-sky-950 text-sky-300 font-bold'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. MOUNTING HEIGHT & STN 33 2130 ADVISOR */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              Montážna výška Z
            </span>
            <span className="font-mono text-sm font-bold text-sky-400">
              {component.position.z.toFixed(2)} m
            </span>
          </div>

          <input
            type="range"
            min={0.1}
            max={Math.min(3.5, floorHeight)}
            step={0.05}
            value={component.position.z}
            onChange={(e) => handleHeightChange(parseFloat(e.target.value))}
            className="w-full accent-sky-400 cursor-pointer"
          />

          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Podlaha (0m)</span>
            <span>Strop ({floorHeight.toFixed(2)}m)</span>
          </div>

          {/* STN Recommendation Button */}
          {Math.abs(component.position.z - standardHeight) > 0.01 ? (
            <button
              onClick={() => handleHeightChange(standardHeight)}
              className="mt-1 px-2.5 py-1.5 bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-500/30 rounded-lg text-[11px] flex items-center justify-between transition"
            >
              <span>Odporúčanie {normRec?.stnReference}:</span>
              <span className="font-bold underline">{standardHeight.toFixed(2)} m</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zhoda s normou STN 33 2130 ({standardHeight.toFixed(2)}m)</span>
            </div>
          )}
        </div>

        {/* 3. CABLE ROUTING PATHWAY & 3D CALCULATION */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2.5">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
            Spôsob trasovania kabeláže
          </span>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handlePathwayChange('floor')}
              className={`py-2 px-1 rounded-lg border text-[11px] font-semibold flex flex-col items-center justify-center transition ${
                component.pathwayPreference === 'floor'
                  ? 'border-sky-400 bg-sky-950 text-sky-300 shadow-md shadow-sky-500/20'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span>Podlahou</span>
              <span className="text-[9px] opacity-75 font-normal">(v potere)</span>
            </button>

            <button
              onClick={() => handlePathwayChange('ceiling')}
              className={`py-2 px-1 rounded-lg border text-[11px] font-semibold flex flex-col items-center justify-center transition ${
                component.pathwayPreference === 'ceiling'
                  ? 'border-amber-400 bg-amber-950 text-amber-300 shadow-md shadow-amber-500/20'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span>Stropom</span>
              <span className="text-[9px] opacity-75 font-normal">(v SDK)</span>
            </button>

            <button
              onClick={() => handlePathwayChange('wall')}
              className={`py-2 px-1 rounded-lg border text-[11px] font-semibold flex flex-col items-center justify-center transition ${
                component.pathwayPreference === 'wall'
                  ? 'border-emerald-400 bg-emerald-950 text-emerald-300 shadow-md shadow-emerald-500/20'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span>Stenou</span>
              <span className="text-[9px] opacity-75 font-normal">(v zóne STN)</span>
            </button>
          </div>

          {/* 3D Routing Results to Switchboard */}
          {routeCalc && (
            <div className="mt-2 pt-2.5 border-t border-slate-800/80 flex flex-col gap-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">3D dĺžka trasy:</span>
                <span className="font-bold text-slate-200">{routeCalc.lengthMeters.toFixed(2)} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Zvislé zvody / výstupy:</span>
                <span className="text-slate-300">{routeCalc.verticalMeters.toFixed(2)} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kábel:</span>
                <span className="text-amber-300">{routeCalc.recommendedCableType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Úbytok napätia (ΔU):</span>
                <span className={`font-bold ${routeCalc.isVoltageDropOk ? 'text-emerald-400' : 'text-red-400'}`}>
                  {routeCalc.voltageDropPercent.toFixed(2)} % {routeCalc.isVoltageDropOk ? '✓' : '⚠️'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 4. SHELLY SMART MODULE SELECTION */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Shelly Smart modul
            </span>
            {component.smartModule && (
              <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-500/30">
                Aktivovaný
              </span>
            )}
          </div>

          <select
            value={component.smartModule?.model || 'none'}
            onChange={(e) => handleShellyChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs focus:ring-1 focus:ring-emerald-400 outline-none"
          >
            <option value="none">Bez smart modulu (Klasika)</option>
            <option value="Shelly Plus 1">Shelly Plus 1 (16A suchý kontakt)</option>
            <option value="Shelly Plus 1PM">Shelly Plus 1PM (16A + meranie prúdu)</option>
            <option value="Shelly Plus 2PM">Shelly Plus 2PM (Žalúzie / 2-kanál)</option>
            <option value="Shelly Plus i4">Shelly Plus i4 (4 vstupy tlačidiel)</option>
            <option value="Shelly 1PM Mini Gen3">Shelly 1PM Mini Gen3 (pre úzke krabice)</option>
          </select>
        </div>

        {/* 5. ELECTRICAL CIRCUIT ASSIGNMENT */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            Priradený elektrický obvod
          </span>
          <select
            value={component.circuitId || ''}
            onChange={(e) => onUpdateComponent({ ...component, circuitId: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs focus:ring-1 focus:ring-sky-400 outline-none font-mono"
          >
            <option value="">Nezaradený do okruhu</option>
            {circuits.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name} ({c.mcbRating})
              </option>
            ))}
          </select>
        </div>

        {/* Delete Component Button */}
        <button
          onClick={() => onDeleteComponent(component.id)}
          className="w-full py-2.5 px-3 bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-800/50 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
        >
          <Trash2 className="w-4 h-4" />
          Odstrániť prvok z projektu
        </button>
      </div>
    </div>
  );
};
