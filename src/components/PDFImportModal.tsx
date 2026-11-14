import React, { useState } from 'react';
import { ParsedPDFResult, parsePDFPlan } from '../services/pdfPlanParser';
import { Floor } from '../types/cad';
import { FileUp, CheckCircle2, AlertCircle, Eye, Sliders, Layers, Sparkles, X, ArrowRight } from 'lucide-react';

interface PDFImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedFloor: (parsedResult: ParsedPDFResult, keepUnderlay: boolean, underlayOpacity: number) => void;
}

export const PDFImportModal: React.FC<PDFImportModalProps> = ({
  isOpen,
  onClose,
  onApplyParsedFloor,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedPDFResult | null>(null);

  // Settings
  const [keepUnderlay, setKeepUnderlay] = useState(true);
  const [underlayOpacity, setUnderlayOpacity] = useState(35); // 35% opacity
  const [scaleMultiplier, setScaleMultiplier] = useState(1.0);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Vyberte platný súbor vo formáte PDF!');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setIsLoading(true);

    try {
      const result = await parsePDFPlan(selectedFile);
      setParsedResult(result);
    } catch (err: any) {
      console.error(err);
      setError('Nepodarilo sa spracovať PDF súbor. Uistite sa, že PDF obsahuje architektonický výkres.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (!parsedResult) return;
    onApplyParsedFloor(parsedResult, keepUnderlay, underlayOpacity / 100);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                Automatický import pôdorysu z PDF projektu
              </h3>
              <p className="text-xs text-slate-400">
                Nástroj analyzuje steny, dvere, okná, kóty a mierku priamo z PDF výkresu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg font-bold p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-5">
          {/* 1. Drag & Drop Upload Zone */}
          {!parsedResult && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-700 hover:border-sky-500/80 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 bg-slate-950/40 hover:bg-slate-950/80 transition cursor-pointer"
              onClick={() => document.getElementById('pdf-file-input')?.click()}
            >
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <FileUp className="w-7 h-7" />
              </div>
              <div className="text-center">
                <div className="font-bold text-sm text-slate-200">
                  Pretiahnite sem PDF výkres alebo kliknite pre výber súboru
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Podporované formáty: Vektorové a skenované PDF z AutoCAD, ArchiCAD, Revit (A4, A3, A2, A1)
                </div>
              </div>
              <input
                id="pdf-file-input"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-sm font-semibold text-slate-200">
                Analyzujem stavebný PDF výkres...
              </div>
              <div className="text-xs text-slate-400">
                Prebieha čítanie vektorových stien, vyhľadávanie montážnych otvorov a kót...
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-950/40 border border-red-800/60 p-4 rounded-xl text-xs text-red-300 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Parsed Result Preview & Settings */}
          {parsedResult && (
            <div className="flex flex-col gap-5">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Rozpoznané steny</div>
                  <div className="text-lg font-bold text-sky-400 mt-0.5">
                    {parsedResult.summary.wallsCount} stien
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Montážne otvory</div>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">
                    {parsedResult.summary.doorsCount} dverí / {parsedResult.summary.windowsCount} okien
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Vyčítané kóty (STN)</div>
                  <div className="text-lg font-bold text-amber-400 mt-0.5">
                    {parsedResult.summary.dimensionsCount} kót
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Detegovaná mierka</div>
                  <div className="text-lg font-bold text-purple-400 mt-0.5">
                    {parsedResult.detectedScaleRatio}
                  </div>
                </div>
              </div>

              {/* Visual Preview */}
              <div className="relative h-64 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
                <img
                  src={parsedResult.blueprintImageDataUrl}
                  alt="PDF Blueprint Underlay"
                  className="max-h-full max-w-full object-contain opacity-75"
                />
                <div className="absolute top-2 left-2 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded text-[11px] text-sky-300 font-mono border border-slate-700">
                  Náhľad PDF výkresu
                </div>
              </div>

              {/* Options & Calibrations */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3 text-xs">
                <div className="font-bold text-slate-200">Nastavenia importu a podkladu:</div>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepUnderlay}
                    onChange={(e) => setKeepUnderlay(e.target.checked)}
                    className="accent-sky-500 rounded"
                  />
                  <span>
                    Ponechať originálny PDF výkres ako podklad pod 2D pôdorys (ideálne pre kontrolu detailov pri osadzovaní zásuviek a vypínačov)
                  </span>
                </label>

                {keepUnderlay && (
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-slate-400 shrink-0">Priehľadnosť podkladu:</span>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      value={underlayOpacity}
                      onChange={(e) => setUnderlayOpacity(parseInt(e.target.value, 10))}
                      className="w-48 accent-sky-400 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-sky-400">{underlayOpacity} %</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={() => {
              setParsedResult(null);
              setFile(null);
              setError(null);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
          >
            {parsedResult ? 'Vybrať iný súbor' : 'Zrušiť'}
          </button>

          {parsedResult && (
            <button
              onClick={handleApply}
              className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-sky-500/25 transition active:scale-95"
            >
              <span>Vložiť do pôdorysu ElektroCAD</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
