import React from 'react';
import { ElectricalComponentType, WorkflowStep } from '../types/cad';
import {
  MousePointer,
  Square,
  DoorOpen,
  AppWindow,
  ToggleLeft,
  Plug,
  Lightbulb,
  Flame,
  Layers,
  Fan,
  Droplets,
  Wind,
  Zap,
  Route,
  GitFork,
  Radio,
  Sliders,
  CheckCircle2,
  Ruler,
  ShieldCheck,
  Sparkles,
  Columns,
  Maximize2,
} from 'lucide-react';

interface LeftSidebarProps {
  currentStep: WorkflowStep;
  activeTool: string;
  onSelectTool: (tool: string) => void;
  selectedComponentType?: ElectricalComponentType;
  onSelectComponentType: (type: ElectricalComponentType) => void;
  isLinkingMode?: boolean;
  onToggleLinkingMode?: () => void;
  onTriggerAutoRouteAll?: () => void;
  defaultWallThickness?: number;
  onChangeDefaultWallThickness?: (thickness: number) => void;
  isCalibratingScale?: boolean;
  onStartCalibration?: () => void;
  hasBlueprintUnderlay?: boolean;
  defaultDoorSize?: { width: number; height: number };
  onChangeDefaultDoorSize?: (size: { width: number; height: number }) => void;
  defaultWindowSize?: { width: number; height: number; elevation: number };
  onChangeDefaultWindowSize?: (size: { width: number; height: number; elevation: number }) => void;
  selectedSwitchboardKind?: 'main' | 'sub';
  onSelectSwitchboardKind?: (kind: 'main' | 'sub') => void;
  onGenerateZones?: () => void;
  onClearZones?: () => void;
  zoneCount?: number;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  currentStep,
  activeTool,
  onSelectTool,
  selectedComponentType,
  onSelectComponentType,
  isLinkingMode = false,
  onToggleLinkingMode,
  onTriggerAutoRouteAll,
  defaultWallThickness = 0.15,
  onChangeDefaultWallThickness,
  isCalibratingScale = false,
  onStartCalibration,
  hasBlueprintUnderlay = false,
  defaultDoorSize = { width: 0.9, height: 2.0 },
  onChangeDefaultDoorSize,
  defaultWindowSize = { width: 1.2, height: 1.4, elevation: 0.9 },
  onChangeDefaultWindowSize,
  selectedSwitchboardKind = 'main',
  onSelectSwitchboardKind,
  onGenerateZones,
  onClearZones,
  zoneCount = 0,
}) => {
  const handleComponentPick = (type: ElectricalComponentType) => {
    onSelectTool('component');
    onSelectComponentType(type);
  };

  return (
    <aside className="w-68 h-full bg-slate-950 border-r border-slate-800 flex flex-col text-xs text-slate-300 select-none overflow-y-auto">
      {/* STEP 1: WALLS */}
      {currentStep === 1 && (
        <div className="p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
              Krok 1: Kreslenie stien
            </span>
            <span className="text-[10px] bg-sky-950 text-sky-300 px-1.5 py-0.5 rounded border border-sky-800 font-mono">
              90° Auto-snap
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSelectTool('wall')}
              className={`flex items-center gap-2 p-2.5 rounded-xl font-bold transition shadow-sm ${
                activeTool === 'wall'
                  ? 'bg-sky-500 text-white shadow-sky-500/25 ring-2 ring-sky-400/50'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800'
              }`}
            >
              <Square className="w-4 h-4 text-sky-300" />
              <span>Kresliť stenu</span>
            </button>

            <button
              onClick={() => onSelectTool('select')}
              className={`flex items-center gap-2 p-2.5 rounded-xl font-semibold transition ${
                activeTool === 'select'
                  ? 'bg-sky-500 text-white shadow-sky-500/25 ring-2 ring-sky-400/50'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <MousePointer className="w-4 h-4 text-slate-400" />
              <span>Označiť stenu</span>
            </button>
          </div>

          {/* Hrúbka novej steny pri kreslení - presne na cm */}
          {onChangeDefaultWallThickness && (
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5 text-[11px]">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  Hrúbka novej steny:
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="5"
                    max="80"
                    step="1"
                    value={Math.round(defaultWallThickness * 100)}
                    onChange={(e) => {
                      const cm = parseFloat(e.target.value);
                      if (!isNaN(cm) && cm >= 1) {
                        onChangeDefaultWallThickness(Number((cm / 100).toFixed(3)));
                      }
                    }}
                    className="w-14 bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-lg px-2 py-0.5 text-right font-mono font-bold text-emerald-400 text-xs outline-none"
                  />
                  <span className="font-mono text-[11px] text-slate-400 font-bold">cm</span>
                </div>
              </div>

              {/* Rýchle predvoľby hrúbok v cm */}
              <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
                {[
                  { val: 0.10, label: '10 cm' },
                  { val: 0.115, label: '11.5' },
                  { val: 0.15, label: '15 cm' },
                  { val: 0.20, label: '20 cm' },
                  { val: 0.25, label: '25 cm' },
                  { val: 0.30, label: '30 cm' },
                  { val: 0.38, label: '38 cm' },
                  { val: 0.44, label: '44 cm' },
                ].map((p) => (
                  <button
                    key={p.val}
                    onClick={() => onChangeDefaultWallThickness(p.val)}
                    className={`py-1 rounded border text-center transition ${
                      Math.abs(defaultWallThickness - p.val) < 0.008
                        ? 'border-emerald-400 bg-emerald-950 text-emerald-300 font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Kalibrácia mierky podkladu kreslením čiary na kótu */}
          {hasBlueprintUnderlay && onStartCalibration && (
            <div className="bg-amber-950/30 p-3 rounded-xl border border-amber-500/40 flex flex-col gap-2">
              <span className="font-bold text-amber-300 flex items-center gap-1.5 text-[11px]">
                <Ruler className="w-3.5 h-3.5 text-amber-400" />
                Mierka podkladu (Merač kóty)
              </span>
              <p className="text-[10px] text-slate-400 leading-normal">
                Natiahnutím čiary medzi šípkami kóty na výkrese zosúladíte mierku celého podkladu na milimeter.
              </p>
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onStartCalibration?.();
                }}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm ${
                  isCalibratingScale
                    ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/50'
                    : 'bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-500/50'
                }`}
              >
                <Ruler className="w-4 h-4" />
                <span>{isCalibratingScale ? 'Prebieha meranie kóty...' : 'Zmerať kótu na podklade'}</span>
              </button>
            </div>
          )}

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-[11px] flex flex-col gap-2">
            <span className="font-semibold text-slate-200">Odporúčané hrúbky podľa STN:</span>
            <div className="flex flex-col gap-1.5 text-slate-400">
              <div className="flex justify-between items-center bg-slate-950/60 px-2 py-1 rounded border border-slate-800/60">
                <span>Vnútorné priečky</span>
                <span className="font-mono text-sky-400 font-bold">15 cm</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/60 px-2 py-1 rounded border border-slate-800/60">
                <span>Vnútorné nosné steny</span>
                <span className="font-mono text-sky-400 font-bold">25 - 30 cm</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/60 px-2 py-1 rounded border border-slate-800/60">
                <span>Obvodové steny</span>
                <span className="font-mono text-sky-400 font-bold">38 - 45 cm</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal mt-1">
              Tip: Kliknutím na nakreslenú stenu v plátne otvoríte pravý panel pre zmenu jej dĺžky, presného uhla (0°-360°) a hrúbky.
            </p>
          </div>
        </div>
      )}

      {/* STEP 2: OPENINGS (DOORS & WINDOWS) */}
      {currentStep === 2 && (
        <div className="p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
              Krok 2: Dvere a okná
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => onSelectTool('door')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl font-bold transition shadow-sm ${
                activeTool === 'door'
                  ? 'bg-sky-500 text-white shadow-sky-500/25 ring-2 ring-sky-400/50'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800'
              }`}
              title="Kresliť / vložiť dvere na stenu"
            >
              <DoorOpen className="w-4 h-4 text-emerald-400 mb-0.5" />
              <span className="text-xs">Dvere</span>
              <span className="text-[9px] font-mono text-slate-300 font-normal">
                {Math.round(defaultDoorSize.width * 100)}×{Math.round(defaultDoorSize.height * 100)}
              </span>
            </button>

            <button
              onClick={() => onSelectTool('window')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl font-bold transition shadow-sm ${
                activeTool === 'window'
                  ? 'bg-sky-500 text-white shadow-sky-500/25 ring-2 ring-sky-400/50'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800'
              }`}
              title="Kresliť / vložiť okno na stenu"
            >
              <AppWindow className="w-4 h-4 text-sky-400 mb-0.5" />
              <span className="text-xs">Okno</span>
              <span className="text-[9px] font-mono text-slate-300 font-normal">
                {Math.round(defaultWindowSize.width * 100)}×{Math.round(defaultWindowSize.height * 100)}
              </span>
            </button>

            <button
              onClick={() => onSelectTool('select')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl font-bold transition shadow-sm ${
                activeTool === 'select'
                  ? 'bg-sky-500 text-white shadow-sky-500/25 ring-2 ring-sky-400/50'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
              title="Označiť okno alebo dvere na výkrese"
            >
              <MousePointer className="w-4 h-4 text-amber-400 mb-0.5" />
              <span className="text-xs">Označiť</span>
              <span className="text-[9px] text-slate-400 font-normal">
                Okno / dvere
              </span>
            </button>
          </div>

          {/* Guidance when Selection Tool is active in Step 2 */}
          {activeTool === 'select' && (
            <div className="bg-slate-950/70 p-3 rounded-xl border border-sky-500/30 flex flex-col gap-2 text-xs">
              <span className="font-bold text-sky-300 flex items-center gap-1.5 text-[11px]">
                <MousePointer className="w-3.5 h-3.5 text-sky-400" />
                Označenie okna alebo dverí:
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Kliknite na ľubovoľné okno alebo dvere na výkrese. V pravom paneli sa zobrazia jeho vlastnosti:
              </p>
              <ul className="text-slate-400 text-[10.5px] list-disc list-inside flex flex-col gap-1">
                <li>Zmena šírky, výšky a parapetu</li>
                <li>Prehodenie pántov vľavo (L) / vpravo (P)</li>
                <li>Smer otvárania dovnútra / von</li>
                <li>Posun pozdĺž steny ťahaním myšou</li>
                <li>Označenie (napr. D01, O01, Vchod)</li>
              </ul>
            </div>
          )}

          {/* Quick dimension selector for the active opening tool */}
          {activeTool === 'door' && (
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-2.5 text-xs">
              <span className="font-semibold text-slate-200 text-[11px]">
                Rozmery dverí na umiestnenie:
              </span>

              {/* Width */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-slate-400">Šírka krídla:</span>
                  <span className="font-mono font-bold text-sky-400">{Math.round(defaultDoorSize.width * 100)} cm ({defaultDoorSize.width.toFixed(2)}m)</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {[60, 70, 80, 90, 100, 120].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => onChangeDefaultDoorSize?.({ ...defaultDoorSize, width: w / 100 })}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                        Math.round(defaultDoorSize.width * 100) === w
                          ? 'bg-sky-500/30 border-sky-400 text-sky-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Height */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-slate-400">Výška dverí:</span>
                  <span className="font-mono font-bold text-sky-400">{Math.round(defaultDoorSize.height * 100)} cm</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {[197, 200, 210, 220].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => onChangeDefaultDoorSize?.({ ...defaultDoorSize, height: h / 100 })}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                        Math.round(defaultDoorSize.height * 100) === h
                          ? 'bg-sky-500/30 border-sky-400 text-sky-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {h} cm
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTool === 'window' && (
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-2.5 text-xs">
              <span className="font-semibold text-slate-200 text-[11px]">
                Rozmery okna na umiestnenie:
              </span>

              {/* Common Window Size Presets */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-slate-400">Šírka × Výška:</span>
                  <span className="font-mono font-bold text-sky-400">
                    {Math.round(defaultWindowSize.width * 100)}×{Math.round(defaultWindowSize.height * 100)} cm
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {[
                    { label: '60 × 60 (WC)', w: 0.6, h: 0.6 },
                    { label: '90 × 120 cm', w: 0.9, h: 1.2 },
                    { label: '120 × 140 cm', w: 1.2, h: 1.4 },
                    { label: '150 × 150 cm', w: 1.5, h: 1.5 },
                    { label: '200 × 140 cm', w: 2.0, h: 1.4 },
                    { label: '90 × 210 (Balkón)', w: 0.9, h: 2.1, elev: 0 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => onChangeDefaultWindowSize?.({
                        ...defaultWindowSize,
                        width: preset.w,
                        height: preset.h,
                        elevation: preset.elev !== undefined ? preset.elev : defaultWindowSize.elevation,
                      })}
                      className={`p-1 rounded text-center border font-mono transition ${
                        defaultWindowSize.width === preset.w && defaultWindowSize.height === preset.h
                          ? 'bg-sky-500/30 border-sky-400 text-sky-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parapet */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-slate-400">Výška parapetu:</span>
                  <span className="font-mono font-bold text-sky-400">{Math.round(defaultWindowSize.elevation * 100)} cm</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {[0, 85, 90, 100, 120].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => onChangeDefaultWindowSize?.({ ...defaultWindowSize, elevation: p / 100 })}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition ${
                        Math.round(defaultWindowSize.elevation * 100) === p
                          ? 'bg-sky-500/30 border-sky-400 text-sky-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {p === 0 ? '0 (Balkón)' : p === 85 ? '85 (STN)' : `${p} cm`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-[11px] flex flex-col gap-2">
            <span className="font-semibold text-slate-200">Ako umiestniť otvor:</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Kliknite nástrojom <strong>Dvere</strong> alebo <strong>Okno</strong> priamo na stenu na pôdoryse. Otvor sa automaticky prichytí na stenu a vytvorí montážny priechod.
            </p>
            <div className="bg-amber-950/30 p-2 rounded-lg border border-amber-500/20 text-amber-300 text-[10px]">
              <strong>STN 33 2130:</strong> Vypínače sa umiestňujú na strane kľučky dverí, 10 až 20 cm od zárubne vo výške 105 cm.
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: INSTALLATION ZONES (STN 33 2130 & STN 33 2000-7-701) */}
      {currentStep === 3 && (
        <div className="p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
              Krok 3: Inštalačné zóny
            </span>
            <span className="text-[10px] bg-teal-950 text-teal-300 px-1.5 py-0.5 rounded border border-teal-800 font-mono">
              STN 33 2130
            </span>
          </div>

          {/* Generovanie normových zón STN */}
          {onGenerateZones && (
            <button
              onClick={onGenerateZones}
              className="w-full p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-400 hover:to-sky-500 text-white shadow-lg shadow-teal-500/20 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Vygenerovať zóny STN 33 2130</span>
            </button>
          )}

          {/* Počet vygenerovaných zón */}
          <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 bg-slate-900 rounded-lg border border-slate-800">
            <span className="text-slate-400">Aktívne inštalačné zóny:</span>
            <span className="font-mono font-bold text-teal-300">{zoneCount} zón</span>
          </div>

          {/* Výber / Úprava zóny */}
          <button
            onClick={() => onSelectTool('select')}
            className={`w-full p-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition ${
              activeTool === 'select'
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/25 ring-2 ring-sky-400'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-sky-400" />
              Označiť / Prezerať zóny
            </span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono">
              Výber
            </span>
          </button>

          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            Manuálne kreslenie zón:
          </div>

          {/* Nástroje manuálneho zakreslenia zón */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => onSelectTool('zone_kitchen')}
              className={`w-full p-2 rounded-xl font-bold text-xs flex items-center justify-between transition border ${
                activeTool === 'zone_kitchen'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-amber-400" />
                <div className="flex flex-col text-left">
                  <span>ZVS – Kuchynská linka</span>
                  <span className="text-[9px] font-normal text-slate-400">Vodorovná 90–120 cm (os 115cm)</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800/80 rounded">
                + Stena
              </span>
            </button>

            <button
              onClick={() => onSelectTool('zone_vertical')}
              className={`w-full p-2 rounded-xl font-bold text-xs flex items-center justify-between transition border ${
                activeTool === 'zone_vertical'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Columns className="w-4 h-4 text-emerald-400" />
                <div className="flex flex-col text-left">
                  <span>Zvislý inštalačný zvod</span>
                  <span className="text-[9px] font-normal text-slate-400">Šírka 20 cm, stúpačka / kanál</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800/80 rounded">
                + Zvislá
              </span>
            </button>

            <button
              onClick={() => onSelectTool('zone_bathroom')}
              className={`w-full p-2 rounded-xl font-bold text-xs flex items-center justify-between transition border ${
                activeTool === 'zone_bathroom'
                  ? 'bg-red-500 text-white border-red-400 shadow-md shadow-red-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-red-400" />
                <div className="flex flex-col text-left">
                  <span>Kúpeľňa – Zóna 0, 1, 2</span>
                  <span className="text-[9px] font-normal text-slate-400">Vaňa / sprcha (STN 33 2000-7-701)</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800/80 rounded">
                + Kúpeľňa
              </span>
            </button>

            <button
              onClick={() => onSelectTool('zone_ceiling')}
              className={`w-full p-2 rounded-xl font-bold text-xs flex items-center justify-between transition border ${
                activeTool === 'zone_ceiling'
                  ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-sky-400" />
                <div className="flex flex-col text-left">
                  <span>Stropný koridor SDK</span>
                  <span className="text-[9px] font-normal text-slate-400">Káblový zväzok v podhľade</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800/80 rounded">
                + Strop
              </span>
            </button>
          </div>

          {/* Vzdelávacia karta normy STN 33 2130 */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex flex-col gap-2 mt-1">
            <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Pravidlá STN 33 2130
            </span>
            <ul className="text-[10px] text-slate-300 space-y-1 list-disc list-inside">
              <li><strong className="text-teal-300">ZVD:</strong> 15–45 cm nad podlahou (zásuvky)</li>
              <li><strong className="text-sky-300">ZVH:</strong> 15–45 cm pod stropom (vedenia, klíma)</li>
              <li><strong className="text-amber-300">ZVS:</strong> 90–120 cm (kuchyňa, linka)</li>
              <li><strong className="text-emerald-300">ZVZ:</strong> 10–30 cm od zárubne (vypínače)</li>
              <li><strong className="text-purple-300">ZVR:</strong> 10–30 cm od vnútorného rohu steny</li>
            </ul>
          </div>

          {onClearZones && zoneCount > 0 && (
            <button
              onClick={onClearZones}
              className="w-full py-2 px-3 bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-300 border border-slate-800 hover:border-red-800/50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <span>Vyčistiť inštalačné zóny</span>
            </button>
          )}
        </div>
      )}

      {/* STEP 4: SWITCHBOARDS */}
      {currentStep === 4 && (
        <div className="p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">
              Krok 4: Rozvádzače
            </span>
            <span className="text-[10px] bg-red-950 text-red-300 px-1.5 py-0.5 rounded border border-red-800 font-mono">
              STN DBO
            </span>
          </div>

          {/* Nástroj na označenie a úpravu rozvádzača */}
          <button
            onClick={() => onSelectTool('select')}
            className={`w-full p-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition ${
              activeTool === 'select'
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/25 ring-2 ring-sky-400'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-sky-400" />
              Označiť / Upraviť rozvádzač
            </span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono">
              Výber
            </span>
          </button>

          {/* Výber typu rozvádzača na vloženie */}
          <div className="flex flex-col gap-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Vyberte rozvádzač na umiestnenie:
            </div>

            {/* 1. Hlavný rozvádzač RH */}
            <button
              onClick={() => {
                onSelectSwitchboardKind?.('main');
                handleComponentPick('switchboard');
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl font-bold transition text-left ${
                activeTool === 'component' && selectedComponentType === 'switchboard' && selectedSwitchboardKind === 'main'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 ring-2 ring-red-400/50'
                  : 'bg-red-950/40 hover:bg-red-900/40 text-red-200 border border-red-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-red-900/60 border border-red-700/50">
                  <Layers className="w-4 h-4 text-red-300" />
                </div>
                <div>
                  <div className="text-xs font-bold">Hlavný rozvádzač RH</div>
                  <div className="text-[10px] text-red-300 font-normal">Domový / bytový prívod (150 cm)</div>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-red-900/80 px-2 py-0.5 rounded border border-red-700">36-48M</span>
            </button>

            {/* 2. Podružný rozvádzač RP */}
            <button
              onClick={() => {
                onSelectSwitchboardKind?.('sub');
                handleComponentPick('switchboard');
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl font-bold transition text-left ${
                activeTool === 'component' && selectedComponentType === 'switchboard' && selectedSwitchboardKind === 'sub'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/50'
                  : 'bg-blue-950/40 hover:bg-blue-900/40 text-blue-200 border border-blue-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-900/60 border border-blue-700/50">
                  <Zap className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <div className="text-xs font-bold">Podružný rozvádzač RP</div>
                  <div className="text-[10px] text-blue-300 font-normal">Poschodie, garáž, dielňa (150 cm)</div>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-blue-900/80 px-2 py-0.5 rounded border border-blue-700">18-24M</span>
            </button>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-[11px] flex flex-col gap-2">
            <span className="font-semibold text-slate-200">Pravidlá umiestnenia rozvádzača:</span>
            <ul className="list-disc pl-4 text-slate-400 space-y-1 text-[10px]">
              <li><strong>Hlavný rozvádzač RH:</strong> zádverie, chodba alebo technická miestnosť.</li>
              <li><strong>Podružný rozvádzač RP:</strong> podlažie, garáž, dieľňa, záhrada alebo podkrovie.</li>
              <li>Stred rozvádzača vo výške <strong>150 cm</strong> nad hotovou podlahou (STN 33 2130).</li>
              <li>Dostatočný manipulačný priestor min. 80 cm pred rozvádzačom.</li>
            </ul>
          </div>
        </div>
      )}

      {/* STEP 5: LIGHTING & SWITCHES */}
      {currentStep === 5 && (
        <div className="p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Krok 5: Svetlá a Vypínače
            </span>
          </div>

          {/* Linking Mode Action Button */}
          {onToggleLinkingMode && (
            <button
              onClick={onToggleLinkingMode}
              className={`w-full p-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition ${
                isLinkingMode
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400'
                  : 'bg-amber-950/50 hover:bg-amber-900/50 text-amber-300 border border-amber-500/40'
              }`}
            >
              <span className="flex items-center gap-2">
                <GitFork className="w-4 h-4" />
                {isLinkingMode ? 'Ukončiť párovanie svietidiel' : 'Prepojiť vypínač so svetlami'}
              </span>
              <span className="text-[10px] bg-amber-400/20 px-1.5 py-0.5 rounded font-mono">
                {isLinkingMode ? 'AKTÍVNE' : 'Schodiskové'}
              </span>
            </button>
          )}

          {/* Svietidlá a LED osvetlenie */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Svietidlá a LED systémy</span>
              <span className="text-[10px] text-amber-400 font-medium">9 typov</span>
            </div>

            {/* Hlavné a stropné */}
            <div className="text-[10px] font-semibold text-slate-400 mt-0.5">Stropné a dizajnové</div>
            {[
              { type: 'light_ceiling', label: 'Stropné svietidlo', desc: 'Strop' },
              { type: 'light_spotlight', label: 'Bodové svietidlo (downlight)', desc: 'SDK strop' },
              { type: 'light_chandelier', label: 'Závesný luster nad stôl', desc: '220 cm' },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => handleComponentPick(item.type as ElectricalComponentType)}
                className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition ${
                  activeTool === 'component' && selectedComponentType === item.type
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="text-[10px] text-yellow-400 font-mono">{item.desc}</span>
              </button>
            ))}

            {/* Líniové a kuchynské podsvietenie */}
            <div className="text-[10px] font-semibold text-slate-400 mt-1">Líniové a kuchyňa</div>
            {[
              { type: 'light_kitchen_under', label: 'Podsvietenie kuchynskej dosky', desc: '150 cm' },
              { type: 'light_led_strip', label: 'LED pásik (nepriame podhľady)', desc: '260 cm' },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => handleComponentPick(item.type as ElectricalComponentType)}
                className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition ${
                  activeTool === 'component' && selectedComponentType === item.type
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono">{item.desc}</span>
              </button>
            ))}

            {/* Nástenné, exteriér a kúpeľňa */}
            <div className="text-[10px] font-semibold text-slate-400 mt-1">Nástenné a špeciálne</div>
            {[
              { type: 'light_wall', label: 'Nástenné svietidlo', desc: '190 cm' },
              { type: 'light_bathroom', label: 'Kúpeľňa nad zrkadlo (IP44)', desc: '190 cm' },
              { type: 'light_outdoor', label: 'Exteriérové / fasádne (IP65)', desc: '210 cm' },
              { type: 'light_night_orientation', label: 'Nočné orientačné v sokli', desc: '30 cm' },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => handleComponentPick(item.type as ElectricalComponentType)}
                className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition ${
                  activeTool === 'component' && selectedComponentType === item.type
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="text-[10px] text-yellow-400 font-mono">{item.desc}</span>
              </button>
            ))}
          </div>

          {/* Vypínače */}
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vypínače (Z = 105 cm)</div>
            {[
              { type: 'switch_1', label: 'Spínač č. 1 (jednopólový)', desc: '1 svetlo' },
              { type: 'switch_5', label: 'Spínač č. 5 (sériový / luster)', desc: '2 skupiny' },
              { type: 'switch_6', label: 'Spínač č. 6 (schodiskový)', desc: 'Radenie 6+6' },
              { type: 'switch_7', label: 'Spínač č. 7 (krížový)', desc: 'Radenie 6+7+6' },
              { type: 'push_button', label: 'Tlačidlo 1/0 (pre Shelly relé)', desc: 'Impulz' },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => handleComponentPick(item.type as ElectricalComponentType)}
                className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition ${
                  activeTool === 'component' && selectedComponentType === item.type
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ToggleLeft className="w-3.5 h-3.5 text-sky-400" />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="text-[10px] text-sky-400 font-mono">{item.desc}</span>
              </button>
            ))}
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
            <strong>Schodiskové / Skupinové zapojenie:</strong> Kliknite na vypínač a tlačidlom hore ho prepojte s jedným alebo viacerými svietidlami. Pre schodisko priraďte k rovnakému svetlu dva spínače č. 6.
          </div>
        </div>
      )}

      {/* STEP 6: SOCKETS */}
      {currentStep === 6 && (
        <div className="p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
              Krok 6: Zásuvky 230V a 400V
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {[
              { type: 'socket_230', label: 'Zásuvka 230V s kolíkom', desc: '30 cm' },
              { type: 'socket_230_double', label: 'Dvojzásuvka 230V', desc: '30 cm' },
              { type: 'socket_ip44', label: 'Zásuvka IP44 s viečkom', desc: '120 cm' },
              { type: 'socket_400v_16a', label: 'Zásuvka 400V 16A 5P CEE', desc: '100 cm' },
              { type: 'data_socket', label: 'Dátová zásuvka RJ45 Cat6', desc: '30 cm' },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => handleComponentPick(item.type as ElectricalComponentType)}
                className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition ${
                  activeTool === 'component' && selectedComponentType === item.type
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Plug className="w-4 h-4 text-sky-400" />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="text-[10px] text-sky-400 font-mono font-bold">{item.desc}</span>
              </button>
            ))}
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-[10px] text-slate-400 leading-relaxed flex flex-col gap-1.5">
            <span className="font-bold text-slate-200">Pravidlá STN 33 2130:</span>
            <div>• Obytné miestnosti: výška osi 30 cm nad podlahou.</div>
            <div>• Pracovná plocha v kuchyni: výška 115 cm nad podlahou.</div>
            <div>• Kúpeľňa: mimo zóny 0, 1 a 2; zóna 3 min. vo výške 120 cm s krytím IP44 a RCD 30mA.</div>
            <div>• Max 10 zásuviek na jeden okruh s ističom B16A.</div>
          </div>
        </div>
      )}

      {/* STEP 7: SPECIALIZED APPLIANCES & AUTOMATION */}
      {currentStep === 7 && (
        <div className="p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
              Krok 7: Spotrebiče & Smart
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {[
              { type: 'electric_heating', label: 'Elektrické kúrenie / rohož', desc: '2500W', icon: Flame },
              { type: 'boiler', label: 'Elektrický bojler (ohrievač)', desc: '2000W', icon: Droplets },
              { type: 'water_pump', label: 'Vodné čerpadlo / vodáreň', desc: '1500W', icon: Droplets },
              { type: 'heat_pump', label: 'Tepelné čerpadlo 400V 3P', desc: '4-8 kW', icon: Zap },
              { type: 'ac_outlet', label: 'Klimatizácia vývod', desc: '250 cm', icon: Wind },
              { type: 'blinds_motor', label: 'Motor žalúzie vývod', desc: '255 cm', icon: Sliders },
              { type: 'blinds_switch', label: 'Ovládač žalúzií (Shelly 2PM)', desc: '105 cm', icon: Sliders },
              { type: 'cooker_outlet', label: 'Varná doska 400V (prípojka)', desc: '40 cm', icon: Zap },
              { type: 'ventilation', label: 'Rekuperácia vývod', desc: '240 cm', icon: Fan },
              { type: 'thermostat', label: 'Izbový termostat', desc: '150 cm', icon: Sliders },
              { type: 'appliance_washing_machine', label: 'Práčka (kúpeľňa)', desc: '100 cm', icon: Plug },
              { type: 'appliance_dishwasher', label: 'Umývačka riadu', desc: '30 cm', icon: Plug },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  onClick={() => handleComponentPick(item.type as ElectricalComponentType)}
                  className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition ${
                    activeTool === 'component' && selectedComponentType === item.type
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50 font-bold'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-orange-400" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span className="text-[10px] text-orange-400 font-mono font-bold">{item.desc}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
            <strong>Samostatné obvody podľa STN:</strong> Spotrebiče s príkonom nad 2 kW (bojler, varná doska, práčka, sušička, el. kúrenie) musia mať podľa STN 33 2130 samostatný elektrický prívod priamo z rozvádzača.
          </div>
        </div>
      )}

      {/* STEP 8: COMPONENT INTERCONNECTIONS */}
      {currentStep === 8 && (
        <div className="p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
              Krok 8: Prepojenie komponentov
            </span>
            <GitFork className="w-4 h-4 text-purple-400" />
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs flex flex-col gap-2">
            <div className="font-bold text-slate-200">Režim priraďovania väzieb:</div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Kliknite na vypínač alebo spotrebič na plátne pre zobrazenie a úpravu jeho priradeného <strong>elektrického okruhu</strong> a <strong>ovládacej skupiny</strong>.
            </p>
          </div>

          {onToggleLinkingMode && (
            <button
              onClick={onToggleLinkingMode}
              className={`w-full p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                isLinkingMode
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 border border-purple-800/60'
              }`}
            >
              <GitFork className="w-4 h-4" />
              <span>{isLinkingMode ? 'Ukončiť režim prepájania' : 'Aktivovať prepájanie svietidiel'}</span>
            </button>
          )}

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-[10px] text-slate-400 space-y-1.5">
            <div className="font-bold text-slate-300">Normové rozdelenie okruhov (STN 33 2130):</div>
            <div>• <strong>S1, S2...</strong> Svetelné okruhy (B10A, max 10 svietidiel)</div>
            <div>• <strong>Z1, Z2...</strong> Zásuvkové okruhy (B16A, max 10 zásuviek)</div>
            <div>• <strong>KÚRENIE</strong> Samostatný obvod B16A</div>
            <div>• <strong>BOJLER</strong> Samostatný obvod B16A + RCD</div>
            <div>• <strong>VARNÁ DOSKA</strong> 3-fázový obvod 400V B16A 3P</div>
          </div>
        </div>
      )}

      {/* STEP 9: CABLE ROUTING */}
      {currentStep === 9 && (
        <div className="p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Krok 9: Trasovanie kabeláže
            </span>
            <Route className="w-4 h-4 text-emerald-400" />
          </div>

          {onTriggerAutoRouteAll && (
            <button
              onClick={onTriggerAutoRouteAll}
              className="w-full p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Prepočítať všetky trasy STN</span>
            </button>
          )}

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-[11px] flex flex-col gap-2">
            <span className="font-semibold text-slate-200">Spôsoby ukladania káblov:</span>
            <div className="space-y-1.5 text-slate-400 text-[10px]">
              <div>• <strong>Podlaha (v chráničke FXP):</strong> Najrýchlejšia trasa pri novostavbách pod poter.</div>
              <div>• <strong>Strop (v podhľade):</strong> Ideálne pre SDK stropy a znížené podhľady.</div>
              <div>• <strong>Stena (inštalačná zóna):</strong> Vodorovne 15-45 cm od stropu/podlahy, zvisle pri rohoch.</div>
            </div>
          </div>

          <div className="bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/30 text-emerald-300 text-[10px] leading-relaxed">
            <strong>STN 33 2000-5-52:</strong> Systém automaticky počíta 3D dĺžku každého kábla (s 10% technologickou rezervou a zvislými klesaniami) a overuje úbytok napätia &le; 3% pre svetlá a &le; 5% pre zásuvky.
          </div>
        </div>
      )}

      {/* Global Selection Tool always available at bottom */}
      <div className="mt-auto p-3 border-t border-slate-800">
        <button
          onClick={() => onSelectTool('select')}
          className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg font-semibold transition ${
            activeTool === 'select'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'hover:bg-slate-900 text-slate-400'
          }`}
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span>Ukazovateľ (Výber prvku)</span>
        </button>
      </div>
    </aside>
  );
};
