import React from 'react';
import { Floor, PathwayPreference, ProjectData } from '../types/cad';
import { Zap, Box, Compass, Layers, FileSpreadsheet, Plus, Upload, Download, Sparkles, FileUp, Undo2, Redo2, Users, Share2 } from 'lucide-react';

interface HeaderProps {
  project: ProjectData;
  activeView: '2d' | '3d' | 'schematics' | 'switchboard' | 'bom';
  setActiveView: (view: '2d' | '3d' | 'schematics' | 'switchboard' | 'bom') => void;
  currentFloor: Floor;
  onChangeFloor: (floorId: string) => void;
  onAddFloor: () => void;
  onUpdateFloorHeight: (height: number) => void;
  defaultPathway: PathwayPreference;
  onChangeDefaultPathway: (pathway: PathwayPreference) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExportProject: () => void;
  onImportProject: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetToDemo: () => void;
  onNewCleanProject: () => void;
  onOpenPDFImport: () => void;
  onOpenCollaboration?: () => void;
  collaboratorCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  activeView,
  setActiveView,
  currentFloor,
  onChangeFloor,
  onAddFloor,
  onUpdateFloorHeight,
  defaultPathway,
  onChangeDefaultPathway,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExportProject,
  onImportProject,
  onResetToDemo,
  onNewCleanProject,
  onOpenPDFImport,
  onOpenCollaboration,
  collaboratorCount,
}) => {
  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 z-30 select-none">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-slate-100">
              ElektroCAD <span className="text-sky-400 font-normal">SR</span>
            </span>
            <span className="text-[10px] bg-slate-800 text-sky-400 border border-slate-700 px-1.5 py-0.2 rounded font-mono">
              STN Norma Ready
            </span>
          </div>
          <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
            {project.name}
          </div>
        </div>
      </div>

      {/* Undo / Redo + Main Mode View Navigation */}
      <div className="flex items-center gap-3">
        {/* History Undo / Redo Buttons */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 gap-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              canUndo
                ? 'text-slate-200 hover:text-white hover:bg-slate-800 cursor-pointer active:scale-95'
                : 'text-slate-600 cursor-not-allowed opacity-35'
            }`}
            title="Krok späť (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden md:inline text-[11px]">Späť</span>
          </button>
          <div className="w-px h-4 bg-slate-800 my-auto" />
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              canRedo
                ? 'text-slate-200 hover:text-white hover:bg-slate-800 cursor-pointer active:scale-95'
                : 'text-slate-600 cursor-not-allowed opacity-35'
            }`}
            title="Krok vpred (Ctrl+Y / Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
            <span className="hidden md:inline text-[11px]">Vpred</span>
          </button>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveView('2d')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeView === '2d'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>2D Pôdorys</span>
        </button>

        <button
          onClick={() => setActiveView('3d')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeView === '3d'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>3D Model</span>
        </button>

        <button
          onClick={() => setActiveView('schematics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeView === 'schematics'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Schémy STN</span>
        </button>

        <button
          onClick={() => setActiveView('switchboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeView === 'switchboard'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Rozvádzač (DIN)</span>
        </button>

        <button
          onClick={() => setActiveView('bom')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeView === 'bom'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Kusovník & Report</span>
        </button>
      </div>
      </div>

      {/* Floor & Project Controls */}
      <div className="flex items-center gap-3">
        {/* Floor selector */}
        <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs text-slate-300">
          <span className="text-slate-500">Podlažie:</span>
          <select
            value={currentFloor.id}
            onChange={(e) => onChangeFloor(e.target.value)}
            className="bg-transparent font-semibold text-slate-100 outline-none cursor-pointer"
          >
            {project.floors.map((f) => (
              <option key={f.id} value={f.id} className="bg-slate-900 text-slate-100">
                {f.name}
              </option>
            ))}
          </select>
          <button
            onClick={onAddFloor}
            className="p-1 hover:bg-slate-800 text-sky-400 rounded transition"
            title="Pridať ďalšie poschodie"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Floor Height Input */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs text-slate-300">
          <span className="text-slate-500">Svetlá výška:</span>
          <input
            type="number"
            step="0.05"
            min="2.2"
            max="4.5"
            value={currentFloor.height}
            onChange={(e) => onUpdateFloorHeight(parseFloat(e.target.value) || 2.7)}
            className="w-12 bg-transparent text-slate-100 font-mono font-bold outline-none text-right"
          />
          <span className="text-slate-400">m</span>
        </div>

        {/* Default Pathway Selector */}
        <div className="hidden xl:flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs text-slate-300">
          <span className="text-slate-500">Predvolená trasa:</span>
          <select
            value={defaultPathway}
            onChange={(e) => onChangeDefaultPathway(e.target.value as PathwayPreference)}
            className="bg-transparent font-semibold text-slate-100 outline-none cursor-pointer"
          >
            <option value="floor" className="bg-slate-900">Podlahou (chránička)</option>
            <option value="ceiling" className="bg-slate-900">Stropom (podhľad)</option>
            <option value="wall" className="bg-slate-900">Stenou (inštal. zóna)</option>
          </select>
        </div>

        {/* Collaboration & Live Share Button */}
        {onOpenCollaboration && (
          <button
            onClick={onOpenCollaboration}
            className="px-3 py-1.5 bg-gradient-to-r from-sky-600 via-indigo-600 to-emerald-600 hover:from-sky-500 hover:via-indigo-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/20 border border-sky-400/30 transition active:scale-95 cursor-pointer"
            title="Zdieľať rozpracovaný projekt s kolegom alebo pracovať spoločne v reálnom čase (Vercel & WebRTC)"
          >
            <Share2 className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Zdieľať & Spolupráca</span>
            {collaboratorCount !== undefined && collaboratorCount > 1 ? (
              <span className="bg-emerald-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {collaboratorCount}
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        )}

        {/* PDF Import Button */}
        <button
          onClick={onOpenPDFImport}
          className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 border border-emerald-400/30 transition active:scale-95"
          title="Automatické čítanie stien, dverí a kót z architektonického PDF"
        >
          <FileUp className="w-3.5 h-3.5" />
          <span>Import PDF</span>
        </button>

        {/* File Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onExportProject}
            className="p-2 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition"
            title="Uložiť projekt (JSON)"
          >
            <Download className="w-4 h-4" />
          </button>

          <label
            className="p-2 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition cursor-pointer"
            title="Otvoriť projekt (JSON)"
          >
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json,.ele" onChange={onImportProject} className="hidden" />
          </label>

          <button
            onClick={onNewCleanProject}
            className="px-2.5 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-750 transition"
            title="Vytvoriť čistý projekt s prázdnou scénou"
          >
            <Plus className="w-3.5 h-3.5" />
            Nový
          </button>

          <button
            onClick={onResetToDemo}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
            title="Načítať vzorový dom pre tutoriál"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Tutoriál (Vzor)
          </button>
        </div>
      </div>
    </header>
  );
};
