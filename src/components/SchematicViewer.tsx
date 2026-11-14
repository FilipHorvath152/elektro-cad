import React, { useState } from 'react';
import { Circuit, ElectricalComponent, SwitchboardEnclosure } from '../types/cad';
import { generateSingleLineDiagramSVG } from '../services/schematicService';
import { Download, Printer, Cpu, FileText, CheckCircle2 } from 'lucide-react';

interface SchematicViewerProps {
  switchboard: SwitchboardEnclosure;
  components: ElectricalComponent[];
  circuits: Circuit[];
}

export const SchematicViewer: React.FC<SchematicViewerProps> = ({
  switchboard,
  components,
  circuits,
}) => {
  const [activeTab, setActiveTab] = useState<'single_line' | 'circuit_table' | 'shelly_wiring'>('single_line');

  const svgContent = generateSingleLineDiagramSVG(switchboard, components);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSVG = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schema_rozvadzaca_${switchboard.name.replace(/\s+/g, '_')}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-slate-100 p-6 overflow-y-auto">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            Schémy zapojenia podľa slovenských noriem (STN EN 60617 / STN EN 61439)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automaticky generovaná výkresová a technická dokumentácia pre montáž a revíznu správu
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSVG}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-sky-400" />
            Exportovať SVG
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-sky-600/30 transition"
          >
            <Printer className="w-4 h-4" />
            Vytlačiť do PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 my-4 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('single_line')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'single_line'
              ? 'border-sky-400 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Jednopólová schéma rozvádzača
        </button>
        <button
          onClick={() => setActiveTab('circuit_table')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'circuit_table'
              ? 'border-sky-400 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Tabuľka a rozpis okruhov (Káble, Istenie, ΔU)
        </button>
        <button
          onClick={() => setActiveTab('shelly_wiring')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'shelly_wiring'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Zapojenie Shelly modulov v krabiciach
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-[500px]">
        {activeTab === 'single_line' && (
          <div className="w-full bg-white rounded-2xl p-4 shadow-xl overflow-x-auto border border-slate-300">
            <div dangerouslySetInnerHTML={{ __html: svgContent }} />
          </div>
        )}

        {activeTab === 'circuit_table' && (
          <div className="w-full bg-slate-950 rounded-2xl p-5 border border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Kód</th>
                  <th className="p-3">Názov okruhu</th>
                  <th className="p-3">Kábel (STN)</th>
                  <th className="p-3">Istenie (MCB)</th>
                  <th className="p-3">Ochrana (RCD)</th>
                  <th className="p-3">Príkon (W)</th>
                  <th className="p-3">Úbytok napätia (ΔU)</th>
                  <th className="p-3">Stav normy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {circuits.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/50 transition">
                    <td className="p-3 font-bold text-sky-400">{c.code}</td>
                    <td className="p-3 font-sans font-medium text-slate-200">{c.name}</td>
                    <td className="p-3 text-amber-300">{c.cableType}</td>
                    <td className="p-3 text-slate-100">{c.mcbRating}</td>
                    <td className="p-3 text-indigo-300">RCD 40A/30mA typ A</td>
                    <td className="p-3">{c.totalPowerWatts} W</td>
                    <td className="p-3 text-emerald-400 font-bold">{c.maxVoltageDrop.toFixed(2)} %</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Vyhovuje STN
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'shelly_wiring' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shelly Plus 2PM pre žalúzie */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  Shelly Plus 2PM: Ovládanie roliet / žalúzií
                </h3>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 font-mono">
                  Cover Mode
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Inštalácia v hlbokej krabici KU 68 pod žalúziový spínač Legrand Valena Life.
              </p>

              {/* Terminal Diagram visual */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 font-mono text-xs flex flex-col gap-2">
                <div className="text-slate-400 text-[11px] border-b border-slate-800 pb-1 font-bold">
                  Zapojenie svoriek:
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-red-400 font-bold">L (Fáza):</span>
                  <span className="text-slate-300">Prívod fázového vodiča 230V</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-blue-400 font-bold">N (Nulák):</span>
                  <span className="text-slate-300">Prívod neutrálneho vodiča (modrý)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-amber-400 font-bold">SW1:</span>
                  <span className="text-slate-300">Spínač smer HORE (Legrand)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-amber-400 font-bold">SW2:</span>
                  <span className="text-slate-300">Spínač smer DOLE (Legrand)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-emerald-400 font-bold">O1:</span>
                  <span className="text-slate-300">Výstup na motor žalúzie (HORE)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-emerald-400 font-bold">O2:</span>
                  <span className="text-slate-300">Výstup na motor žalúzie (DOLE)</span>
                </div>
              </div>
            </div>

            {/* Shelly Plus 1PM pre zásuvky a svetlá */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  Shelly Plus 1PM: Spínanie & Meranie spotreby
                </h3>
                <span className="text-[10px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-500/40 font-mono">
                  16A Relé + Wattmeter
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Inštalácia v krabici KU 68 pod zásuvku alebo spínač osvetlenia.
              </p>

              {/* Terminal Diagram visual */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 font-mono text-xs flex flex-col gap-2">
                <div className="text-slate-400 text-[11px] border-b border-slate-800 pb-1 font-bold">
                  Zapojenie svoriek:
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-red-400 font-bold">L:</span>
                  <span className="text-slate-300">Fázový prívod 230V</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-blue-400 font-bold">N:</span>
                  <span className="text-slate-300">Neutrálny vodič N</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-amber-400 font-bold">SW:</span>
                  <span className="text-slate-300">Vstup z mechanického spínača / tlačidla</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-emerald-400 font-bold">O (Output):</span>
                  <span className="text-slate-300">Spínaný výstup na spotrebič / svietidlo</span>
                </div>
              </div>
            </div>

            {/* Shelly Plus 1 pre schodiskové prepínače č. 6 */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  Shelly Plus 1: Schodiskové / Striedavé zapojenie (č. 6)
                </h3>
                <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40 font-mono">
                  Suchý kontakt 16A
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Zapojenie v odbočnej alebo koncovej krabici za prepínačom č. 6.
              </p>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 font-mono text-xs flex flex-col gap-2">
                <div className="text-slate-400 text-[11px] border-b border-slate-800 pb-1 font-bold">
                  Zapojenie svoriek:
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-red-400 font-bold">L:</span>
                  <span className="text-slate-300">Napájanie modulu 230V AC</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-blue-400 font-bold">N:</span>
                  <span className="text-slate-300">Neutrálny vodič</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-red-400 font-bold">I (Input relé):</span>
                  <span className="text-slate-300">Trvalá fáza L (pre spínanie)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-emerald-400 font-bold">O (Output relé):</span>
                  <span className="text-slate-300">Fáza k svietidlu (svetelný okruh)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-amber-400 font-bold">SW:</span>
                  <span className="text-slate-300">Koš z prepínača č. 6 (striedavý signál)</span>
                </div>
              </div>
            </div>

            {/* Shelly Pro 2PM na DIN lištu */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  Shelly Pro 2PM: Montáž na DIN lištu v rozvádzači
                </h3>
                <span className="text-[10px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-500/40 font-mono">
                  1 DIN / LAN Ethernet / 2x16A
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Profesionálne centrálne ovládanie v rozvádzači RH cez LAN kábel RJ45 alebo Wi-Fi.
              </p>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 font-mono text-xs flex flex-col gap-2">
                <div className="text-slate-400 text-[11px] border-b border-slate-800 pb-1 font-bold">
                  Zapojenie svoriek na DIN lište:
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-red-400 font-bold">L1, L2:</span>
                  <span className="text-slate-300">Prívod z ističa B10A/B16A cez hrebeň</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-blue-400 font-bold">N:</span>
                  <span className="text-slate-300">N-zbernica za prúdovým chráničom</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-amber-400 font-bold">S1, S2:</span>
                  <span className="text-slate-300">Ovládacie vstupy z tlačidiel z miestností</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-emerald-400 font-bold">O1, O2:</span>
                  <span className="text-slate-300">Vývody na motory žalúzií / okruhy</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sky-400 font-bold">LAN RJ45:</span>
                  <span className="text-slate-300">Ethernetový dátový kábel UTP Cat6</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
