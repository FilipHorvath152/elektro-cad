import React, { useState } from 'react';
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
  ChevronDown,
  ChevronUp,
  Info,
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
 */
export const checkStepHasElements = (step: WorkflowStep, floor: Floor): boolean => {
  if (!floor) return false;
  switch (step) {
    case 1:
      return floor.walls.length > 0;
    case 2:
      return floor.walls.some((w) => w.openings && w.openings.length > 0);
    case 3:
      return Boolean(
        (floor.installationZones && floor.installationZones.length > 0) ||
        (floor.walls && floor.walls.length > 0)
      );
    case 4:
      return (
        floor.components.some((c) => c.type === 'switchboard') ||
        (floor.switchboards && floor.switchboards.length > 0 && floor.walls.length > 0)
      );
    case 5:
      return floor.components.some(
        (c) => c.type.startsWith('light_') || c.type.startsWith('switch_') || c.type === 'push_button'
      );
    case 6:
      return floor.components.some(
        (c) => c.type.startsWith('socket_') || c.type === 'data_socket'
      );
    case 7:
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
      return floor.components.some(
        (c) => (c.targetLightIds && c.targetLightIds.length > 0) || Boolean(c.controlGroupId)
      );
    case 9:
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
  const [isGuidanceOpen, setIsGuidanceOpen] = useState(true);
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
    <div className="bg-slate-950/95 border-b border-slate-800/80 select-none z-20">
      {/* 9-Step Navigation Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 overflow-x-auto gap-1 scrollbar-none">
        <div className="flex items-center gap-1 min-w-max">
          {WORKFLOW_STEPS.map((step) => {
            const Icon = STEP_ICONS[step.step];
            const isActive = step.step === currentStep;
            const isCompleted = checkStepHasElements(step.step, floor);

            return (
              <button
                key={step.step}
                onClick={() => onSelectStep(step.step)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all relative cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm shadow-sky-500/25'
                    : isCompleted
                    ? 'bg-slate-900 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800/80'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
                title={isCompleted ? `${step.title} (Obsahuje prvky)` : step.title}
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
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
                <span className="truncate max-w-[100px] md:max-w-none text-[11.5px]">{step.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Step Navigation Arrows & Guide Toggle */}
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          <button
            onClick={() => setIsGuidanceOpen((prev) => !prev)}
            className={`p-1 rounded-md text-xs transition flex items-center gap-1 cursor-pointer ${
              isGuidanceOpen
                ? 'text-sky-400 bg-sky-950/60 border border-sky-800/40'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
            title={isGuidanceOpen ? 'Zbaliť sprievodcu normou STN' : 'Zobraziť sprievodcu normou STN'}
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[10.5px]">Nápoveda</span>
          </button>

          <div className="w-px h-3.5 bg-slate-800 my-auto" />

          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`p-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
              currentStep === 1
                ? 'text-slate-600 opacity-30 cursor-not-allowed'
                : 'text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 cursor-pointer'
            }`}
            title="Predchádzajúci krok"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10.5px]">Späť</span>
          </button>

          <span className="text-[10px] font-mono text-slate-400 px-0.5">
            {currentStep}/9
          </span>

          <button
            onClick={handleNext}
            disabled={currentStep === 9}
            className={`p-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
              currentStep === 9
                ? 'text-slate-600 opacity-30 cursor-not-allowed'
                : 'text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-sm cursor-pointer'
            }`}
            title="Ďalší krok"
          >
            <span className="hidden sm:inline text-[10.5px]">Ďalej</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Slim Contextual Step Guidance Banner */}
      {isGuidanceOpen && (
        <div className="px-3 py-1.5 bg-slate-900/50 border-t border-slate-850 flex flex-wrap items-center justify-between gap-2 text-[11px] animate-in fade-in duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-sky-400 shrink-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              {currentStepConfig.title}:
            </span>
            <span className="text-slate-300 truncate">{currentStepConfig.description}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[10.5px] bg-slate-950/70 px-2 py-0.5 rounded-md border border-slate-800 text-slate-300 shrink-0">
            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-emerald-300 font-semibold">STN: </strong>
              {currentStepConfig.stnTip}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
