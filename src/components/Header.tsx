import React, { useState, useRef, useEffect } from 'react';
import { Floor, PathwayPreference, ProjectData } from '../types/cad';
import {
  Zap,
  Box,
  Compass,
  Layers,
  FileSpreadsheet,
  Plus,
  Upload,
  Download,
  Sparkles,
  FileUp,
  Undo2,
  Redo2,
  Share2,
  ChevronDown,
  Building2,
  Settings2,
  FolderOpen,
  FilePlus,
  Check,
} from 'lucide-react';

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
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isFloorMenuOpen, setIsFloorMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const floorMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProjectMenuOpen(false);
      }
      if (floorMenuRef.current && !floorMenuRef.current.contains(event.target as Node)) {
        setIsFloorMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-3 md:px-4 z-30 select-none shadow-sm">
      {/* 1. LEFT: Brand & Project Name */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 via-indigo-500 to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/20">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs md:text-sm tracking-tight text-white">
                ElektroCAD <span className="text-sky-400 font-semibold">SR</span>
              </span>
              <span className="hidden sm:inline-block text-[9.5px] bg-sky-950/80 text-sky-400 border border-sky-800/50 px-1.5 py-0.5 rounded font-mono font-bold">
                STN 33 2130
              </span>
            </div>
            <div className="text-[10.5px] text-slate-400 truncate max-w-[130px] md:max-w-[200px]" title={project.name}>
              {project.name}
            </div>
          </div>
        </div>
      </div>

      {/* 2. CENTER: Undo/Redo & Main View Switcher */}
      <div className="flex items-center gap-2">
        {/* Compact History Controls */}
        <div className="hidden sm:flex items-center bg-slate-900/90 p-0.5 rounded-lg border border-slate-800/90 gap-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-md text-xs transition flex items-center ${
              canUndo
                ? 'text-slate-200 hover:text-white hover:bg-slate-800 cursor-pointer active:scale-95'
                : 'text-slate-600 cursor-not-allowed opacity-30'
            }`}
            title="Krok späť (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3.5 bg-slate-800" />
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-md text-xs transition flex items-center ${
              canRedo
                ? 'text-slate-200 hover:text-white hover:bg-slate-800 cursor-pointer active:scale-95'
                : 'text-slate-600 cursor-not-allowed opacity-30'
            }`}
            title="Krok vpred (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Unified Segmented View Bar */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800/90 gap-1 shadow-inner">
          <button
            onClick={() => setActiveView('2d')}
            className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeView === '2d'
                ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="2D editor pôdorysu a rozvodov"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden md:inline">2D Pôdorys</span>
            <span className="md:hidden">2D</span>
          </button>

          <button
            onClick={() => setActiveView('3d')}
            className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeView === '3d'
                ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="3D realistický model a výšky"
          >
            <Box className="w-3.5 h-3.5" />
            <span className="hidden md:inline">3D Model</span>
            <span className="md:hidden">3D</span>
          </button>

          <button
            onClick={() => setActiveView('schematics')}
            className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeView === 'schematics'
                ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="Jednopólová schéma zapojenia STN"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Schémy STN</span>
            <span className="lg:hidden">Schémy</span>
          </button>

          <button
            onClick={() => setActiveView('switchboard')}
            className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeView === 'switchboard'
                ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="Osadenie rozvádzača a DIN moduly"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Rozvádzač DIN</span>
            <span className="lg:hidden">Rozvádzač</span>
          </button>

          <button
            onClick={() => setActiveView('bom')}
            className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeView === 'bom'
                ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="Súpis materiálu a dĺžky káblov"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Kusovník & BOM</span>
            <span className="xl:hidden">BOM</span>
          </button>
        </div>
      </div>

      {/* 3. RIGHT: Floor Selector, Share, PDF & Project Dropdown */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Floor Control Pill */}
        <div className="relative" ref={floorMenuRef}>
          <button
            onClick={() => setIsFloorMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-850 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-200 transition cursor-pointer"
            title="Prepnúť podlažie alebo zmeniť výšku stropu"
          >
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-bold text-xs">{currentFloor.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">({currentFloor.height}m)</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isFloorMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl p-2.5 z-50 flex flex-col gap-2.5 text-xs text-slate-200">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">Podlažia projektu</span>
                <button
                  onClick={() => {
                    onAddFloor();
                    setIsFloorMenuOpen(false);
                  }}
                  className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[10px] font-bold flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" /> Pridať NP
                </button>
              </div>

              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                {project.floors.map((f) => {
                  const isSelected = f.id === currentFloor.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        onChangeFloor(f.id);
                        setIsFloorMenuOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{f.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{f.height} m</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Svetlá výška stropu:</span>
                <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  <input
                    type="number"
                    step="0.05"
                    min="2.2"
                    max="4.5"
                    value={currentFloor.height}
                    onChange={(e) => onUpdateFloorHeight(parseFloat(e.target.value) || 2.7)}
                    className="w-10 bg-transparent text-white font-mono font-bold outline-none text-right text-xs"
                  />
                  <span className="text-[10px] text-slate-400">m</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PDF Import Button */}
        <button
          onClick={onOpenPDFImport}
          className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-800 transition active:scale-95 cursor-pointer"
          title="Načítať architektonický podklad z PDF"
        >
          <FileUp className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">PDF</span>
        </button>

        {/* Collaboration & Live Share Button */}
        {onOpenCollaboration && (
          <button
            onClick={onOpenCollaboration}
            className="px-3 py-1.5 bg-gradient-to-r from-sky-600 via-indigo-600 to-emerald-600 hover:from-sky-500 hover:via-indigo-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-sky-600/20 border border-sky-400/30 transition active:scale-95 cursor-pointer"
            title="Zdieľať rozpracovaný projekt alebo pracovať v tíme (Vercel & P2P Live)"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Zdieľať</span>
            {collaboratorCount !== undefined && collaboratorCount > 1 ? (
              <span className="bg-emerald-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {collaboratorCount}
              </span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        )}

        {/* Unified Project Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsProjectMenuOpen((prev) => !prev)}
            className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-800 transition cursor-pointer"
            title="Projektové menu a nastavenia"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Projekt</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isProjectMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 text-xs text-slate-200">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Projekt a súbory
              </div>

              <button
                onClick={() => {
                  onNewCleanProject();
                  setIsProjectMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-slate-800 text-slate-200 transition cursor-pointer"
              >
                <FilePlus className="w-3.5 h-3.5 text-sky-400" />
                <span>Nový čistý projekt</span>
              </button>

              <button
                onClick={() => {
                  onExportProject();
                  setIsProjectMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-slate-800 text-slate-200 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Uložiť projekt (.json)</span>
              </button>

              <label className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-slate-800 text-slate-200 transition cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Otvoriť projekt (.json)</span>
                <input
                  type="file"
                  accept=".json,.ele"
                  onChange={(e) => {
                    onImportProject(e);
                    setIsProjectMenuOpen(false);
                  }}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => {
                  onResetToDemo();
                  setIsProjectMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-slate-800 text-amber-300 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Načítať vzorový dom (Tutoriál)</span>
              </button>

              <div className="pt-2 mt-1 border-t border-slate-800 px-2.5 pb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Predvolená trasa káblov
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {(
                    [
                      { id: 'floor', label: 'Podlaha' },
                      { id: 'ceiling', label: 'Strop' },
                      { id: 'wall', label: 'Stena' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => onChangeDefaultPathway(opt.id)}
                      className={`px-1.5 py-1 rounded text-[11px] font-semibold transition text-center ${
                        defaultPathway === opt.id
                          ? 'bg-sky-500 text-white font-bold'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
