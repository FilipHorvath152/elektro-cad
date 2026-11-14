import React, { useMemo } from 'react';
import { Circuit, ElectricalComponent, Floor, ProjectData, SwitchboardEnclosure } from '../types/cad';
import { generateBOM } from '../services/bomService';
import { calculateComponentRoute } from '../services/routingService';
import { Download, Printer, CheckCircle, FileSpreadsheet, Euro, ShieldCheck } from 'lucide-react';

interface BOMReportProps {
  project: ProjectData;
  floor: Floor;
  switchboards: SwitchboardEnclosure[];
}

export const BOMReport: React.FC<BOMReportProps> = ({
  project,
  floor,
  switchboards,
}) => {
  const switchboard = switchboards[0];

  // Calculate routes for all components to switchboard
  const routes = useMemo(() => {
    if (!switchboard) return [];
    return floor.components
      .filter((c) => c.type !== 'switchboard')
      .map((c) => calculateComponentRoute(c, switchboard, floor.height).route);
  }, [floor.components, switchboard, floor.height]);

  const bom = useMemo(() => {
    return generateBOM(floor.components, routes, switchboards);
  }, [floor.components, routes, switchboards]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Kategória', 'Výrobca', 'Kód', 'Názov položky', 'Množstvo', 'Jednotka', 'Cena/ks (EUR)', 'Spolu (EUR)', 'Poznámka'];
    const rows = bom.items.map((item) => [
      item.category,
      item.brand,
      item.code,
      `"${item.name.replace(/"/g, '""')}"`,
      item.quantity,
      item.unit,
      item.unitPriceEstimate || 0,
      item.totalPriceEstimate || 0,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kusovnik_${project.name.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-slate-100 p-6 overflow-y-auto">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-100">Kusovník materiálu a technický report</h2>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> STN 33 2130 & STN 33 2000-5-52
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Projekt: <span className="text-slate-200 font-semibold">{project.name}</span> | Zákazník: {project.clientName} | Zhotoviteľ: {project.designer}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export do Excel (CSV)
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-sky-600/30 transition"
          >
            <Printer className="w-4 h-4" />
            Tlačiť report (PDF)
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400">Celková kabeláž (3D + 10% prerez)</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">
            {bom.totalCableLengthMeters} <span className="text-sm font-normal text-slate-400">metrov</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Vrátane zvislých zvodov a rezerv</div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400">Elektroinštalačné prístroje</div>
          <div className="text-2xl font-bold text-slate-200 mt-1">
            {bom.totalDevicesCount} <span className="text-sm font-normal text-slate-400">komponentov</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Legrand Valena Life / Plexo</div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400">Smart automatizácia Shelly</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {bom.items.filter((i) => i.category === 'smart_device').reduce((s, i) => s + i.quantity, 0)}{' '}
            <span className="text-sm font-normal text-slate-400">modulov</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Plus, Mini & Pro DIN</div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400">Odhadovaná cena materiálu</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {bom.totalPriceEur.toFixed(2)} <span className="text-sm font-normal text-slate-400">EUR bez DPH</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Veľkoobchodný odhad</div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-xl overflow-x-auto">
        <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
          Položkový súpis materiálu
        </h3>

        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3">Výrobca</th>
              <th className="p-3">Kód</th>
              <th className="p-3">Názov materiálu</th>
              <th className="p-3 text-right">Množstvo</th>
              <th className="p-3 text-center">MJ</th>
              <th className="p-3 text-right">Cena/MJ</th>
              <th className="p-3 text-right">Spolu (EUR)</th>
              <th className="p-3">Poznámka / Montáž</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {bom.items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-900/50 transition">
                <td className="p-3 font-semibold text-sky-400">{item.brand}</td>
                <td className="p-3 font-mono text-slate-400">{item.code}</td>
                <td className="p-3 font-medium text-slate-200">{item.name}</td>
                <td className="p-3 text-right font-mono font-bold text-slate-100">{item.quantity}</td>
                <td className="p-3 text-center text-slate-400">{item.unit}</td>
                <td className="p-3 text-right font-mono text-slate-400">
                  {item.unitPriceEstimate ? `${item.unitPriceEstimate.toFixed(2)} €` : '-'}
                </td>
                <td className="p-3 text-right font-mono font-bold text-amber-300">
                  {item.totalPriceEstimate ? `${item.totalPriceEstimate.toFixed(2)} €` : '-'}
                </td>
                <td className="p-3 text-[11px] text-slate-400">{item.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-700 bg-slate-900/80 font-bold">
            <tr>
              <td colSpan={6} className="p-3 text-right text-slate-300">
                Celková suma materiálu bez DPH:
              </td>
              <td className="p-3 text-right font-mono text-amber-400 text-sm">
                {bom.totalPriceEur.toFixed(2)} €
              </td>
              <td className="p-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
