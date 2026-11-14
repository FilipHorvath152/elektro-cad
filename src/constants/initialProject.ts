import { Floor, ProjectData, SwitchboardEnclosure } from '../types/cad';
import { getDefaultCatalogItem } from './catalog';

// 1. DEMO PROJECT (Pre budúci tutoriál / ukážku)
const demoSwitchboard: SwitchboardEnclosure = {
  id: 'sb-rh-1',
  name: 'Hlavný rozvádzač RH (1.NP)',
  type: 'Legrand Practibox S 36M pod omietku',
  floorId: 'floor-1',
  position: { x: 1.2, y: 1.0, z: 1.5 },
  rowsCount: 3,
  modulesPerRow: 12,
  totalModules: 36,
  modules: [
    { id: 'm-1', type: 'main_switch', name: 'Hlavný vypínač', widthDIN: 3, rating: '40A / 3P', brand: 'Legrand', modelCode: '406439' },
    { id: 'm-2', type: 'spd', name: 'Zvodič prepätia T1+T2', widthDIN: 4, rating: '50kA / 4P', brand: 'Legrand', modelCode: '412224' },
    { id: 'm-3', type: 'rcd', name: 'RCD Chránič 1', widthDIN: 4, rating: '40A / 30mA typ A', brand: 'Legrand', modelCode: '411505' },
    { id: 'm-4', type: 'mcb', name: 'S1: Osvetlenie izby', widthDIN: 1, rating: 'B10A / 1P', circuitId: 'S1', brand: 'Legrand', modelCode: '403356' },
    { id: 'm-5', type: 'mcb', name: 'S2: Osvetlenie kúpeľňa', widthDIN: 1, rating: 'B10A / 1P', circuitId: 'S2', brand: 'Legrand', modelCode: '403356' },
    { id: 'm-6', type: 'mcb', name: 'Z1: Zásuvky obývačka', widthDIN: 1, rating: 'B16A / 1P', circuitId: 'Z1', brand: 'Legrand', modelCode: '403358' },
    { id: 'm-7', type: 'mcb', name: 'Z2: Zásuvky kuchyňa', widthDIN: 1, rating: 'B16A / 1P', circuitId: 'Z2', brand: 'Legrand', modelCode: '403358' },
    { id: 'm-8', type: 'mcb', name: 'Z3: Práčka kúpeľňa', widthDIN: 1, rating: 'B16A / 1P', circuitId: 'Z3', brand: 'Legrand', modelCode: '403358' },
    { id: 'm-9', type: 'mcb', name: 'KU: Varná doska 400V', widthDIN: 3, rating: 'B16A / 3P', circuitId: 'KU-IND', brand: 'Legrand', modelCode: '403544' },
    { id: 'm-10', type: 'mcb', name: 'AC: Klimatizácia', widthDIN: 1, rating: 'B16A / 1P', circuitId: 'AC1', brand: 'Legrand', modelCode: '403358' },
    { id: 'm-11', type: 'shelly_pro', name: 'Shelly Pro 2PM (Žalúzie)', widthDIN: 1, rating: '2x16A LAN/WiFi', brand: 'Shelly', modelCode: 'SH-PRO-2PM' },
  ],
};

const demoFloor: Floor = {
  id: 'floor-1',
  name: '1. NP (Prízemie)',
  level: 0,
  height: 2.70,
  walls: [
    { id: 'w-1', start: { x: 0, y: 0 }, end: { x: 9.0, y: 0 }, thickness: 0.30, height: 2.70, openings: [
      { id: 'op-win-1', type: 'window', positionRatio: 0.3, width: 1.5, height: 1.4, elevation: 0.9 },
      { id: 'op-win-2', type: 'window', positionRatio: 0.75, width: 2.0, height: 1.4, elevation: 0.9 },
    ] },
    { id: 'w-2', start: { x: 9.0, y: 0 }, end: { x: 9.0, y: 6.0 }, thickness: 0.30, height: 2.70, openings: [
      { id: 'op-door-terrace', type: 'door', positionRatio: 0.5, width: 1.8, height: 2.2, elevation: 0 },
    ] },
    { id: 'w-3', start: { x: 9.0, y: 6.0 }, end: { x: 0, y: 6.0 }, thickness: 0.30, height: 2.70, openings: [
      { id: 'op-win-3', type: 'window', positionRatio: 0.4, width: 1.2, height: 1.4, elevation: 0.9 },
    ] },
    { id: 'w-4', start: { x: 0, y: 6.0 }, end: { x: 0, y: 0 }, thickness: 0.30, height: 2.70, openings: [
      { id: 'op-door-main', type: 'door', positionRatio: 0.25, width: 0.9, height: 2.1, elevation: 0 },
    ] },
    { id: 'w-5', start: { x: 3.2, y: 0 }, end: { x: 3.2, y: 3.2 }, thickness: 0.15, height: 2.70, openings: [
      { id: 'op-door-bath', type: 'door', positionRatio: 0.5, width: 0.8, height: 2.0, elevation: 0 },
    ] },
    { id: 'w-6', start: { x: 0, y: 3.2 }, end: { x: 3.2, y: 3.2 }, thickness: 0.15, height: 2.70, openings: [] },
    { id: 'w-7', start: { x: 5.5, y: 0 }, end: { x: 5.5, y: 6.0 }, thickness: 0.15, height: 2.70, openings: [
      { id: 'op-door-bed', type: 'door', positionRatio: 0.7, width: 0.8, height: 2.0, elevation: 0 },
    ] },
  ],
  rooms: [
    { id: 'room-hall', name: 'Vstupná chodba', type: 'hallway', points: [{ x: 0, y: 0 }, { x: 3.2, y: 0 }, { x: 3.2, y: 3.2 }, { x: 0, y: 3.2 }], areaM2: 10.24, floorId: 'floor-1' },
    { id: 'room-bath', name: 'Kúpeľňa s WC', type: 'bathroom', points: [{ x: 3.2, y: 0 }, { x: 5.5, y: 0 }, { x: 5.5, y: 3.2 }, { x: 3.2, y: 3.2 }], areaM2: 7.36, floorId: 'floor-1' },
    { id: 'room-living', name: 'Obývacia izba s kuchyňou', type: 'kitchen', points: [{ x: 0, y: 3.2 }, { x: 5.5, y: 3.2 }, { x: 5.5, y: 6.0 }, { x: 0, y: 6.0 }], areaM2: 15.4, floorId: 'floor-1' },
    { id: 'room-bed', name: 'Spálňa', type: 'bedroom', points: [{ x: 5.5, y: 0 }, { x: 9.0, y: 0 }, { x: 9.0, y: 6.0 }, { x: 5.5, y: 6.0 }], areaM2: 21.0, floorId: 'floor-1' },
  ],
  components: [
    { id: 'comp-sb', type: 'switchboard', label: 'RH', position: { x: 1.2, y: 0.35, z: 1.50 }, rotation: 0, floorId: 'floor-1', roomId: 'room-hall', catalogItem: { brand: 'Legrand', series: 'Practibox S', code: '001336', name: 'Rozvodnica 36M pod omietku', category: 'Rozvádzač', priceEur: 48.0 }, pathwayPreference: 'floor' },
    { id: 'comp-s1', type: 'switch_6', label: 'Spínač chodba', position: { x: 0.35, y: 0.90, z: 1.05 }, rotation: 90, floorId: 'floor-1', roomId: 'room-hall', circuitId: 'S1', catalogItem: getDefaultCatalogItem('switch_6'), pathwayPreference: 'wall' },
    { id: 'comp-l1', type: 'light_ceiling', label: 'Svietidlo chodba', position: { x: 1.6, y: 1.6, z: 2.70 }, rotation: 0, floorId: 'floor-1', roomId: 'room-hall', circuitId: 'S1', catalogItem: getDefaultCatalogItem('light_ceiling'), pathwayPreference: 'ceiling' },
    { id: 'comp-bath-sw', type: 'switch_1', label: 'Spínač kúpeľňa (pred dverami)', position: { x: 3.0, y: 1.6, z: 1.05 }, rotation: 270, floorId: 'floor-1', roomId: 'room-hall', circuitId: 'S2', catalogItem: getDefaultCatalogItem('switch_1'), pathwayPreference: 'wall' },
    { id: 'comp-bath-soc', type: 'socket_ip44', label: 'Zásuvka umývadlo IP44', position: { x: 4.8, y: 0.2, z: 1.20 }, rotation: 0, floorId: 'floor-1', roomId: 'room-bath', circuitId: 'Z3', catalogItem: getDefaultCatalogItem('socket_ip44'), pathwayPreference: 'floor' },
    { id: 'comp-bath-wash', type: 'appliance_washing_machine', label: 'Zásuvka práčka IP44', position: { x: 5.3, y: 2.8, z: 1.00 }, rotation: 270, floorId: 'floor-1', roomId: 'room-bath', circuitId: 'Z3', catalogItem: getDefaultCatalogItem('socket_ip44'), pathwayPreference: 'floor' },
    { id: 'comp-cooker', type: 'cooker_outlet', label: 'Indukčná doska 400V', position: { x: 0.35, y: 4.5, z: 0.40 }, rotation: 90, floorId: 'floor-1', roomId: 'room-living', circuitId: 'KU-IND', catalogItem: getDefaultCatalogItem('cooker_outlet'), pathwayPreference: 'floor' },
    { id: 'comp-kitchen-counter', type: 'socket_230_double', label: 'Pracovná doska kuchyňa', position: { x: 0.35, y: 5.2, z: 1.15 }, rotation: 90, floorId: 'floor-1', roomId: 'room-living', circuitId: 'Z2', catalogItem: getDefaultCatalogItem('socket_230_double'), pathwayPreference: 'wall' },
    { id: 'comp-ac', type: 'ac_outlet', label: 'Klimatizácia', position: { x: 4.8, y: 5.85, z: 2.50 }, rotation: 180, floorId: 'floor-1', roomId: 'room-living', circuitId: 'AC1', catalogItem: getDefaultCatalogItem('ac_outlet'), pathwayPreference: 'ceiling' },
    { id: 'comp-blinds-sw', type: 'blinds_switch', label: 'Ovládač žalúzie', position: { x: 5.35, y: 4.2, z: 1.05 }, rotation: 270, floorId: 'floor-1', roomId: 'room-living', circuitId: 'Z1', catalogItem: getDefaultCatalogItem('blinds_switch'), smartModule: { brand: 'Shelly', model: 'Shelly Plus 2PM', location: 'in_box', mode: 'roller_blinds' }, pathwayPreference: 'floor' },
    { id: 'comp-blinds-motor', type: 'blinds_motor', label: 'Motor žalúzie okno', position: { x: 5.35, y: 4.2, z: 2.55 }, rotation: 270, floorId: 'floor-1', roomId: 'room-living', circuitId: 'Z1', catalogItem: getDefaultCatalogItem('blinds_motor'), pathwayPreference: 'wall' },
    { id: 'comp-living-soc', type: 'socket_230_double', label: 'Zásuvky TV / multimédiá', position: { x: 2.5, y: 5.85, z: 0.30 }, rotation: 180, floorId: 'floor-1', roomId: 'room-living', circuitId: 'Z1', catalogItem: getDefaultCatalogItem('socket_230_double'), smartModule: { brand: 'Shelly', model: 'Shelly Plus 1PM', location: 'in_box', mode: 'metering' }, pathwayPreference: 'floor' },
  ],
  routes: [],
  switchboards: [demoSwitchboard],
};

export const DEMO_PROJECT: ProjectData = {
  id: 'proj-demo-1',
  name: 'Vzorový rodinný byt (Tutoriál)',
  clientName: 'Ing. Peter Horváth',
  address: 'Bratislava, Slnečnice 14',
  designer: 'Certifikovaný elektrotechnik SR (vyhl. 508/2009 Z.z. §23)',
  electricianCertNumber: 'EV-2024/9871',
  date: new Date().toISOString().split('T')[0],
  currentFloorId: 'floor-1',
  floors: [demoFloor],
  circuits: [
    { id: 'S1', code: 'S1', name: 'Svetlá chodba a spálňa', phaseCount: 1, voltage: 230, cableType: 'CYKY-J 3x1.5', mcbRating: 'B10A 1P', componentIds: ['comp-s1', 'comp-l1'], totalPowerWatts: 250, maxVoltageDrop: 1.2 },
    { id: 'S2', code: 'S2', name: 'Svetlá kúpeľňa a terasa', phaseCount: 1, voltage: 230, cableType: 'CYKY-J 3x1.5', mcbRating: 'B10A 1P', componentIds: ['comp-bath-sw'], totalPowerWatts: 180, maxVoltageDrop: 0.9 },
    { id: 'Z1', code: 'Z1', name: 'Zásuvky obývačka + Žalúzie', phaseCount: 1, voltage: 230, cableType: 'CYKY-J 3x2.5', mcbRating: 'B16A 1P', componentIds: ['comp-blinds-sw', 'comp-living-soc'], totalPowerWatts: 2200, maxVoltageDrop: 2.1 },
    { id: 'Z2', code: 'Z2', name: 'Zásuvky kuchynská linka', phaseCount: 1, voltage: 230, cableType: 'CYKY-J 3x2.5', mcbRating: 'B16A 1P', componentIds: ['comp-kitchen-counter'], totalPowerWatts: 3200, maxVoltageDrop: 2.3 },
    { id: 'Z3', code: 'Z3', name: 'Zásuvka práčka kúpeľňa', phaseCount: 1, voltage: 230, cableType: 'CYKY-J 3x2.5', mcbRating: 'B16A 1P', componentIds: ['comp-bath-soc', 'comp-bath-wash'], totalPowerWatts: 2300, maxVoltageDrop: 1.8 },
    { id: 'KU-IND', code: 'KU-1', name: 'Varná doska 400V', phaseCount: 3, voltage: 400, cableType: 'CYKY-J 5x2.5', mcbRating: 'B16A 3P', componentIds: ['comp-cooker'], totalPowerWatts: 7200, maxVoltageDrop: 1.5 },
    { id: 'AC1', code: 'AC-1', name: 'Klimatizácia', phaseCount: 1, voltage: 230, cableType: 'CYKY-J 3x2.5', mcbRating: 'B16A 1P', componentIds: ['comp-ac'], totalPowerWatts: 1800, maxVoltageDrop: 1.9 },
  ],
  globalDefaultPathway: 'floor',
  activeTool: 'select',
};

// 2. EMPTY PROJECT (Východiskový stav pre nový čistý projekt)
const emptySwitchboard: SwitchboardEnclosure = {
  id: 'sb-rh-1',
  name: 'Hlavný rozvádzač RH (1.NP)',
  type: 'Legrand Practibox S 36M pod omietku',
  floorId: 'floor-1',
  position: { x: 1.0, y: 1.0, z: 1.5 },
  rowsCount: 3,
  modulesPerRow: 12,
  totalModules: 36,
  modules: [
    { id: 'm-1', type: 'main_switch', name: 'Hlavný vypínač 3P', widthDIN: 3, rating: '40A / 3P', brand: 'Legrand', modelCode: '406439' },
    { id: 'm-2', type: 'spd', name: 'Zvodič prepätia T1+T2', widthDIN: 4, rating: '50kA / 4P', brand: 'Legrand', modelCode: '412224' },
    { id: 'm-3', type: 'rcd', name: 'RCD Chránič 4P', widthDIN: 4, rating: '40A / 30mA typ A', brand: 'Legrand', modelCode: '411505' },
  ],
};

const emptyFloor: Floor = {
  id: 'floor-1',
  name: '1. NP (Prízemie)',
  level: 0,
  height: 2.70,
  walls: [],
  rooms: [],
  components: [],
  routes: [],
  switchboards: [emptySwitchboard],
};

export const EMPTY_PROJECT: ProjectData = {
  id: 'proj-new-clean',
  name: 'Nový elektro projekt',
  clientName: '',
  address: '',
  designer: 'Certifikovaný elektrotechnik SR (vyhl. 508/2009 Z.z. §23)',
  electricianCertNumber: '',
  date: new Date().toISOString().split('T')[0],
  currentFloorId: 'floor-1',
  floors: [emptyFloor],
  circuits: [],
  globalDefaultPathway: 'floor',
  activeTool: 'wall',
};

export const INITIAL_PROJECT = EMPTY_PROJECT;
