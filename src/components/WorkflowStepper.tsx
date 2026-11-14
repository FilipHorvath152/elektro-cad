import React from 'react';
import { Floor, WorkflowStep } from '../types/cad';
import { WORKFLOW_STEPS } from '../constants/stnStandards';
import {
  Square,
  DoorOpen,
  Layers,
  Lightbulb,
  Plug,
  Flame,
  GitFork,
  Route,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface WorkflowStepperProps {
  currentStep: WorkflowStep;
  onSelectStep: (step: WorkflowStep) => void;
  floor: Floor;
}

const STEP_ICONS: Record<WorkflowStep, React.ElementType> = {
  1: Square,
  2: DoorOpen,
  3: ShieldCheck,
  4: Layers,
  5: Lightbulb,
  6: Plug,
  7: Flame,
  8: GitFork,
  9: Route,
};

/**
 * Zisťuje, či sa v danom kroku workflow už nachádzajú vytvorené prvky na podlaží.
 * Umožňuje zachovať označenie kroku ako "hotový" (✓) aj pri návrate v krokoch späť.
 */
export const checkStepHasElements = (step: WorkflowStep, floor: Floor): boolean => {
  if (!floor) return false;
  switch (step) {
    case 1:
      // Krok 1 (Steny): nachádza sa aspoň 1 stena
      return floor.walls.length > 0;

    case 2:
      // Krok 2 (Otvory): v stenách sa nachádzajú dvere alebo okná
      return floor.walls.some((w) => w.openings && w.openings.length > 0);

    case 3:
      // Krok 3 (Inštalačné zóny): sú vytvorené inštalačné zóny alebo steny
      return Boolean(
        (floor.installationZones && floor.installationZones.length > 0) ||
        (floor.walls && floor.walls.length > 0)
      );

    case 4:
      // Krok 4 (Rozvádzače): na podlaží je umiestnený rozvádzač
      return (
        floor.components.some((c) => c.type === 'switchboard') ||
        (floor.switchboards && floor.switchboards.length > 0 && floor.walls.length > 0)
      );

    case 5:
      // Krok 5 (Svetlá a Vypínače): nachádza sa aspoň jedno svietidlo alebo spínač
      return floor.components.some(
        (c) => c.type.startsWith('light_') || c.type.startsWith('switch_') || c.type === 'push_button'
      );

    case 6:
      // Krok 6 (Zásuvky): nachádza sa aspoň jedna zásuvka (230V, 400V, dátová)
      return floor.components.some(
        (c) => c.type.startsWith('socket_') || c.type === 'data_socket'
      );

    case 7:
      // Krok 7 (Spotrebiče a Žalúzie): nachádza sa sporák, AC, žalúzie, termostat, bojler atď.
      return floor.components.some(
        (c) =>
          c.type.startsWith('appliance_') ||
          c.type.startsWith('blinds_') ||
          c.type === 'cooker_outlet' ||
          c.type === 'ac_outlet' ||
          c.type === 'thermostat' ||
          c.type === 'boiler' ||
          c.type === 'heat_pump' ||
          c.type === 'water_pump' ||
          c.type === 'electric_heating'
      );

    case 8:
      // Krok 8 (Väzby a Skupiny): existuje väzba medzi spínačom a svetlom alebo ovládacia skupina
      return floor.components.some(
        (c) => (c.targetLightIds && c.targetLightIds.length > 0) || Boolean(c.controlGroupId)
      );

    case 9:
      // Krok 9 (Trasy káblov): sú vygenerované trasy káblov
      return Boolean(floor.routes && floor.routes.length > 0);

    default:
      return false;
  }
};

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  currentStep,
  onSelectStep,
  floor,
}) => {
  const currentStepConfig = WORKFLOW_STEPS.find((s) => s.step === currentStep) || WORKFLOW_STEPS[0];

  const handlePrev = () => {
    if (currentStep > 1) {
      onSelectStep((currentStep - 1) as WorkflowStep);
    }
  };

  const handleNext = () => {
    if (currentStep < 9) {
      onSelectStep((currentStep + 1) as WorkflowStep);
    }
  };

  return (
    <div className="bg-slate-950 border-b border-slate-800 select-none shadow-lg z-20">
      {/* 9-Step Navigation Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-850 overflow-x-auto gap-1 scrollbar-none">
        <div className="flex items-center gap-1 min-w-max">
          {WORKFLOW_STEPS.map((step) => {
            const Icon = STEP_ICONS[step.step];
            const isActive = step.step === currentStep;
            const isCompleted = checkStepHasElements(step.step, floor);

            return (
              <button
                key={step.step}
                onClick={() => onSelectStep(step.step)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                    : isCompleted
                    ? 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
                title={isCompleted ? `${step.title} (Hotovo - obsahuje prvky)` : step.title}
              >
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                    isActive
                      ? isCompleted
                        ? 'bg-emerald-500/40 text-white border border-emerald-300'
                        : 'bg-white/20 text-white'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : step.step}
                </div>
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? 'text-white' : isCompleted ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate max-w-[110px] md:max-w-none">{step.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Step Navigation Arrows */}
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
              currentStep === 1
                ? 'text-slate-600 opacity-40 cursor-not-allowed'
                : 'text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800'
            }`}
            title="Predchádzajúci krok"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">Späť</span>
          </button>

          <span className="text-[11px] font-mono text-slate-400 px-1">
            {currentStep}/9
          </span>

          <button
            onClick={handleNext}
            disabled={currentStep === 9}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
              currentStep === 9
                ? 'text-slate-600 opacity-40 cursor-not-allowed'
                : 'text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-sm shadow-sky-500/20'
            }`}
            title="Ďalší krok"
          >
            <span className="hidden sm:inline text-[11px]">Ďalej</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contextual Step Guidance Banner with STN Rules */}
      <div className="px-4 py-2 bg-slate-900/60 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="font-extrabold text-sky-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            {currentStepConfig.title}:
          </span>
          <span className="text-slate-300 font-medium">{currentStepConfig.description}</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-400">
            <strong className="text-emerald-300 font-normal">STN Odporúčanie: </strong>
            {currentStepConfig.stnTip}
          </span>
        </div>
      </div>
    </div>
  );
};
