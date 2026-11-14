import React, { useState } from 'react';
import { DINModule, SwitchboardEnclosure } from '../types/cad';
import { ShieldCheck, AlertTriangle, Plus, Trash2, Cpu, Zap, Download } from 'lucide-react';

interface SwitchboardDesignerProps {
  switchboard: SwitchboardEnclosure;
  onUpdateSwitchboard: (updater: (prev: SwitchboardEnclosure) => SwitchboardEnclosure) => void;
}

export const SwitchboardDesigner: React.FC<SwitchboardDesignerProps> = ({
  switchboard,
  onUpdateSwitchboard,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Calculate used modules
  const totalUsedDIN = switchboard.modules.reduce((sum, m) => sum + m.widthDIN, 0);
  const totalCapacity = switchboard.totalModules;
  const freeDIN = Math.max(0, totalCapacity - totalUsedDIN);
  const reservePercent = Math.round((freeDIN / totalCapacity) * 100);

  const isReserveCompliant = reservePercent >= 20; // STN EN 61439 recommends >= 20-30% reserve

  // Add new modular device
  const handleAddModule = (type: 'mcb' | 'rcd' | 'shelly_pro') => {
    let newMod: DINModule;
    if (type === 'mcb') {
      newMod = {
        id: `mod-${Date.now()}`,
        type: 'mcb',
        name: `Istič B16A (Nový)`,
        widthDIN: 1,
        rating: 'B16A / 1P',
        brand: 'Legrand',
        modelCode: '403358',
      };
    } else if (type === 'rcd') {
      newMod = {
        id: `mod-${Date.now()}`,
        type: 'rcd',
        name: `RCD Chránič 2P`,
        widthDIN: 2,
        rating: '25A / 30mA typ A',
        brand: 'Legrand',
        modelCode: '411504',
      };
    } else {
      newMod = {
        id: `mod-${Date.now()}`,
        type: 'shelly_pro',
        name: `Shelly Pro 2PM (DIN)`,
        widthDIN: 1,
        rating: '2x16A LAN/WiFi',
        brand: 'Shelly',
        modelCode: 'SH-PRO-2PM',
      };
    }

    onUpdateSwitchboard((prev) => ({
      ...prev,
      modules: [...prev.modules, newMod],
    }));
  };

  const handleDeleteModule = (id: string) => {
    onUpdateSwitchboard((prev) => ({
      ...prev,
      modules: prev.modules.filter((m) => m.id !== id),
    }));
    if (selectedModuleId === id) setSelectedModuleId(null);
  };

  const handleEnclosureResize = (newTotal: number) => {
    onUpdateSwitchboard((prev) => ({
      ...prev,
      totalModules: newTotal,
      rowsCount: newTotal / 12,
    }));
  };

  // Group modules into DIN rail rows (12 modules per rail)
  const rows: { railNumber: number; modules: DINModule[]; usedWidth: number }[] = [];
  const rowsCount = switchboard.totalModules / 12;

  let currentRail = 1;
  let currentRailWidth = 0;
  let currentRailModules: DINModule[] = [];

  switchboard.modules.forEach((mod) => {
    if (currentRailWidth + mod.widthDIN > 12 && currentRail < rowsCount) {
      rows.push({ railNumber: currentRail, modules: currentRailModules, usedWidth: currentRailWidth });
      currentRail++;
      currentRailWidth = 0;
      currentRailModules = [];
    }
    currentRailModules.push(mod);
    currentRailWidth += mod.widthDIN;
  });

  // Push remaining or fill empty rows
  rows.push({ railNumber: currentRail, modules: currentRailModules, usedWidth: currentRailWidth });
  while (rows.length < rowsCount) {
    rows.push({ railNumber: rows.length + 1, modules: [], usedWidth: 0 });
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-slate-100 overflow-y-auto p-6">
      {/* Header & Compliance Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-100">{switchboard.name}</h2>
            <span className="text-xs bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded font-mono">
              STN EN 61439-3 (DBO)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Typ rozvodnice: <span className="text-slate-200 font-semibold">{switchboard.type}</span> | Sústava: 3x400/230V TN-C-S
          </p>
        </div>

        {/* DIN Capacity & STN Reserve Meter */}
        <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
          <div>
            <div className="text-[11px] text-slate-400">Obsadenosť rozvádzača</div>
            <div className="text-sm font-bold text-slate-200">
              {totalUsedDIN} / {totalCapacity} DIN modulov
            </div>
          </div>

          <div className="w-32">
            <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  reservePercent < 20 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (totalUsedDIN / totalCapacity) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Rezerva: {reservePercent}%</span>
              <span>{freeDIN} voľných</span>
            </div>
          </div>

          {isReserveCompliant ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>STN OK</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium" title="Norma STN EN 61439 odporúča minimálne 20-30% voľného miesta">
              <AlertTriangle className="w-4 h-4" />
              <span>Malá rezerva (&lt;20%)</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 my-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Pridať prvok na DIN lištu:</span>
          <button
            onClick={() => handleAddModule('mcb')}
            className="px-2.5 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 rounded text-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Istič B16A (1 DIN)
          </button>
          <button
            onClick={() => handleAddModule('rcd')}
            className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 rounded text-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" /> RCD Chránič 2P (2 DIN)
          </button>
          <button
            onClick={() => handleAddModule('shelly_pro')}
            className="px-2.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 rounded text-xs flex items-center gap-1.5 transition"
          >
            <Cpu className="w-3.5 h-3.5" /> Shelly Pro 2PM (1 DIN)
          </button>
        </div>

        {/* Switchboard Size Selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">Veľkosť skrine:</span>
          {[24, 36, 48, 72].map((size) => (
            <button
              key={size}
              onClick={() => handleEnclosureResize(size)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                totalCapacity === size
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {size}M
            </button>
          ))}
        </div>
      </div>

      {/* Visual DIN Rails Container */}
      <div className="flex-1 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col gap-6 shadow-inner">
        {rows.map((row) => (
          <div key={row.railNumber} className="relative">
            {/* Rail Number & Header */}
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-bold text-slate-300">DIN Lišta #{row.railNumber} (TS 35mm)</span>
              <span>Obsadené: {row.usedWidth} / 12 DIN</span>
            </div>

            {/* DIN Rail Background metal strip */}
            <div className="relative h-28 bg-slate-900/90 border border-slate-700/80 rounded-xl flex items-center px-4 overflow-x-auto">
              {/* Metallic DIN strip visual line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-8 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 opacity-30 border-y border-slate-500 pointer-events-none" />

              {/* Placed Modules */}
              <div className="relative flex items-center gap-1 z-10 w-full">
                {row.modules.map((mod) => {
                  const isSelected = selectedModuleId === mod.id;
                  const isShelly = mod.type === 'shelly_pro';
                  const isMain = mod.type === 'main_switch';
                  const isSPD = mod.type === 'spd';
                  const isRCD = mod.type === 'rcd';

                  return (
                    <div
                      key={mod.id}
                      onClick={() => setSelectedModuleId(mod.id)}
                      style={{ flex: `${mod.widthDIN} 0 auto` }}
                      className={`h-22 rounded-lg border flex flex-col justify-between p-2 cursor-pointer transition select-none shadow-md ${
                        isSelected
                          ? 'border-sky-400 bg-sky-950/80 ring-2 ring-sky-400/30'
                          : isMain
                          ? 'border-red-500/60 bg-red-950/30'
                          : isSPD
                          ? 'border-amber-500/60 bg-amber-950/30'
                          : isRCD
                          ? 'border-indigo-500/60 bg-indigo-950/30'
                          : isShelly
                          ? 'border-emerald-500/60 bg-emerald-950/30'
                          : 'border-slate-700 bg-slate-800/90 hover:border-slate-500'
                      }`}
                    >
                      {/* Top Bar of Module */}
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono text-slate-400 font-bold">{mod.brand}</span>
                        <span className="font-semibold text-slate-300">{mod.widthDIN}M</span>
                      </div>

                      {/* Name & Rating */}
                      <div className="my-auto text-center">
                        <div className="text-[11px] font-bold text-slate-100 truncate">{mod.name}</div>
                        <div className="text-[10px] text-sky-400 font-mono mt-0.5">{mod.rating}</div>
                      </div>

                      {/* Bottom status */}
                      <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-700/50 pt-1">
                        <span>{mod.modelCode}</span>
                        {isSelected && !isMain && !isSPD && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteModule(mod.id);
                            }}
                            className="text-red-400 hover:text-red-300"
                            title="Odstrániť modul"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Free space on the rail */}
                {row.usedWidth < 12 && (
                  <div
                    style={{ flex: `${12 - row.usedWidth} 0 auto` }}
                    className="h-22 rounded-lg border-2 border-dashed border-slate-800 flex items-center justify-center text-xs text-slate-600"
                  >
                    Voľné: {12 - row.usedWidth} DIN
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
