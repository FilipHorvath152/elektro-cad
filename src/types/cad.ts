export interface Point2D {
  x: number; // in meters or millimeters (we will standardize on meters, e.g. 5.20 m)
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number; // in meters (e.g. 0.3m for socket, 1.05m for switch, 2.7m ceiling)
}

export type OpeningType = 'door' | 'window' | 'niche';

export interface Opening {
  id: string;
  type: OpeningType;
  positionRatio: number; // 0 to 1 along the wall
  width: number; // in meters (e.g. 0.9m for door, 1.5m for window)
  height: number; // in meters (e.g. 2.0m for door, 1.4m for window)
  elevation: number; // height above floor in meters (e.g. 0 for door, 0.9 for window)
  label?: string;
  swingDirection?: 'left' | 'right'; // door swing direction
  swingSide?: 'left' | 'right'; // door swing side relative to wall vector
}

export type WallMaterial = 'brick' | 'aerated_concrete' | 'drywall_sdk' | 'concrete';
export type WallRole = 'bearing_exterior' | 'bearing_interior' | 'partition';

export interface AtticSlopeConfig {
  enabled: boolean;
  type?: 'knee_wall_roof' | 'gable_slope'; // 'knee_wall_roof' = zvislá podmurovka + šikmý strop; 'gable_slope' = skosená štítová stena
  kneeWallHeight: number; // výška zvislej steny/námurovky pod pomúrnicou v metroch (napr. 1.0 m)
  roofAngleDeg?: number; // sklon strechy v stupňoch (napr. 35°, 38°, 45°)
  ceilingHeight?: number; // výška vodorovného stropu v metroch (napr. 2.60 m)
  slopeDepth?: number; // horizontálna hĺbka šikminy do interiéru v metroch
  slopeDirection?: 'left' | 'right'; // smer šikminy voči smeru kreslenia steny ('left' alebo 'right')
  startHeight?: number; // pre štítovú stenu: výška na začiatku v metroch
  endHeight?: number; // pre štítovú stenu: výška na konci v metroch
}

export interface Wall {
  id: string;
  start: Point2D;
  end: Point2D;
  thickness: number; // in meters (e.g. 0.15 for partition, 0.30 for external/bearing)
  height: number; // wall height in meters (default e.g. 2.7m)
  openings: Opening[];
  material?: WallMaterial;
  role?: WallRole;
  name?: string;
  atticSlope?: AtticSlopeConfig;
}

export type RoomType =
  | 'living_room'
  | 'kitchen'
  | 'bedroom'
  | 'bathroom'
  | 'hallway'
  | 'toilet'
  | 'technical'
  | 'terrace'
  | 'garage';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  points: Point2D[];
  areaM2: number;
  floorId: string;
}

export type ElectricalComponentType =
  | 'switch_1'          // Spínač č. 1 (jednopólový)
  | 'switch_5'          // Spínač č. 5 (sériový / lustrový)
  | 'switch_6'          // Spínač č. 6 (striedavý / schodiskový)
  | 'switch_7'          // Spínač č. 7 (krížový)
  | 'push_button'       // Tlačidlový ovládač č. 1/0
  | 'socket_230'        // Zásuvka 230V 1P+N+PE
  | 'socket_230_double' // Dvojzásuvka 230V
  | 'socket_ip44'       // Zásuvka IP44 s viečkom
  | 'socket_400v_16a'   // Zásuvka 400V 16A 5-kolík CEE
  | 'cooker_outlet'     // Sporáková prípojka 400V (varná doska)
  | 'ac_outlet'         // Vývod pre klimatizáciu
  | 'blinds_switch'     // Žalúziový ovládač
  | 'blinds_motor'      // Vývod pre motor žalúzie
  | 'light_ceiling'     // Stropné svietidlo / prisadené
  | 'light_spotlight'   // Bodové svietidlo / downlight (SDK podhľad)
  | 'light_chandelier'  // Závesný luster / dizajnové svietidlo
  | 'light_wall'        // Nástenné svietidlo
  | 'light_led_strip'   // LED pásik / nepriame osvetlenie
  | 'light_kitchen_under' // Podsvietenie kuchynskej linky (pod skrinkami)
  | 'light_outdoor'     // Exteriérové / fasádne svietidlo IP65
  | 'light_bathroom'    // Kúpeľňové svietidlo nad zrkadlo IP44
  | 'light_night_orientation' // Nočné / orientačné svietidlo v sokli
  | 'boiler'            // Elektrický ohrievač vody (bojler)
  | 'water_pump'        // Vodné čerpadlo / domáca vodáreň
  | 'electric_heating'  // Elektrické kúrenie / podlahové vykurovanie
  | 'heat_pump'         // Tepelné čerpadlo
  | 'ventilation'       // Rekuperácia / nútené vetranie
  | 'appliance_dishwasher' // Umývačka riadu
  | 'appliance_washing_machine' // Práčka
  | 'appliance_dryer'   // Sušička
  | 'appliance_oven'    // Elektrická rúra
  | 'appliance_refrigerator' // Chladnička
  | 'thermostat'        // Priestorový termostat
  | 'data_socket'       // Dátová zásuvka RJ45 Cat6
  | 'switchboard';      // Rozvádzač (RH / RP)

export type PathwayPreference = 'floor' | 'ceiling' | 'wall';

export interface CatalogItemRef {
  brand: 'Legrand' | 'Shelly' | 'Kopos' | 'Hager' | 'Kábel' | 'Prysmian' | 'NKT' | 'Eglo' | 'Kanlux' | 'Philips' | 'Ostatné';
  series?: string; // e.g. "Valena Life", "Plexo", "Shelly Plus"
  code: string;
  name: string;
  category: string;
  priceEur?: number;
}

export interface SmartModuleRef {
  brand: 'Shelly';
  model:
    | 'Shelly Plus 1'
    | 'Shelly Plus 1PM'
    | 'Shelly Plus 2PM'
    | 'Shelly Plus i4'
    | 'Shelly 1PM Mini Gen3'
    | 'Shelly PM Mini Gen3'
    | 'Shelly Pro 1'
    | 'Shelly Pro 1PM'
    | 'Shelly Pro 2PM'
    | 'Shelly Pro 4PM';
  location: 'in_box' | 'in_switchboard';
  mode?: 'switch' | 'roller_blinds' | 'metering';
}

export interface ElectricalComponent {
  id: string;
  type: ElectricalComponentType;
  label: string;
  position: Point3D; // x, y on floorplan, z is height from finished floor in meters!
  wallId?: string;
  distanceAlongWallRatio?: number;
  rotation: number; // in degrees
  floorId: string;
  roomId?: string;
  circuitId?: string; // assigned electrical circuit
  catalogItem: CatalogItemRef;
  smartModule?: SmartModuleRef;
  pathwayPreference: PathwayPreference;
  notes?: string;
  switchboardKind?: 'main' | 'sub'; // RH (Hlavný) alebo RP (Podružný rozvádzač)
  // Linking & Control Groups (Step 4 & Step 7)
  targetLightIds?: string[]; // IDs of lights controlled by this switch
  controlGroupId?: string;   // Group ID (e.g. for staircase 6+6 / 6+7+6 wiring or group lighting)
  controlGroupName?: string; // e.g. "Schodisko 1.NP", "Obývačka hlavné"
  ratedPowerWatts?: number;  // Nominal electrical power (e.g. 2000W for boiler, 2500W heating)
  // Validation status
  normWarning?: string; // warning if height or bathroom zone is violated
}

export type WorkflowStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type InstallationZoneType =
  | 'zvh'             // Zóna vodorovná horná (15-45 cm pod stropom, šírka 30 cm)
  | 'zvd'             // Zóna vodorovná dolná (15-45 cm nad podlahou, šírka 30 cm)
  | 'zvs'             // Zóna vodorovná stredná (90-120 cm nad podlahou, kuchynská linka / pracovný stôl)
  | 'zvz'             // Zóna zvislá pri dverách/otvoroch (10-30 cm od zárubne, šírka 20 cm)
  | 'zvr'             // Zóna zvislá v rohu miestnosti (10-30 cm od rohu, šírka 20 cm)
  | 'bathroom'        // Kúpeľňová bezpečnostná zóna (Zóna 0, 1, 2 podľa STN 33 2000-7-701)
  | 'ceiling'         // Stropný káblový koridor (trasovanie v SDK / podhľade)
  | 'custom';         // Vlastná inštalačná zóna

export interface InstallationZone {
  id: string;
  name: string;
  type: InstallationZoneType;
  wallId?: string;       // pre zóny naviazané na stenu (ZVD, ZVH, ZVS, ZVZ, ZVR)
  roomId?: string;       // pre kúpeľňové alebo priestorové zóny
  subType?: '0' | '1' | '2' | '3'; // pre kúpeľňové bezpečnostné zóny
  distanceFromStartMeters?: number; // pozícia na stene od štartu
  lengthMeters?: number;            // dĺžka úseku na stene
  widthMeters: number;              // šírka pásma v metroch (napr. 0.30 pre horizontálne, 0.20 pre vertikálne)
  elevationBottomMeters: number;    // Z spodná hrana v metroch (napr. 0.15)
  elevationTopMeters: number;       // Z horná hrana v metroch (napr. 0.45)
  polygon?: Point2D[];              // pre plošné zóny na podlahe (vaňa, sprcha, káblový koridor)
  center?: Point2D;
  dimensions?: { width: number; height: number };
  description?: string;
  stnReference?: string;
  color?: string;
  isAutomatic?: boolean;
}

export interface WorkflowStepConfig {
  step: WorkflowStep;
  title: string;
  shortTitle: string;
  description: string;
  stnTip: string;
}

export type CableType =
  | 'CYKY-J 3x1.5'
  | 'CYKY-J 3x2.5'
  | 'CYKY-J 5x2.5'
  | 'CYKY-J 5x1.5'
  | 'CYKY-O 3x1.5'
  | 'CYKY-J 5x10'
  | 'UTP Cat6';

export interface CableRoute {
  id: string;
  circuitId: string;
  sourceComponentId: string;
  targetComponentId: string; // usually switchboard or previous daisy-chained socket
  pathwayType: PathwayPreference;
  points3D: Point3D[];
  lengthMeters: number; // exact 3D path with vertical rises/drops + reserves
  cableType: CableType;
  voltageDropPercent: number; // calculated according to STN 33 2000-5-52
  currentAmps: number;
  mcb: string; // e.g. "B10A/1P", "B16A/1P"
  rcdProtected: boolean;
  isManual?: boolean;
  manualWaypoints?: Point2D[];
}

export interface Circuit {
  id: string;
  code: string; // e.g. "S1", "Z1", "KU-1"
  name: string; // e.g. "Svetlá denná časť", "Zásuvky kuchyňa", "Indukčná doska"
  phaseCount: 1 | 3;
  voltage: 230 | 400;
  cableType: CableType;
  mcbRating: string; // "B10A 1P", "B16A 1P", "B16A 3P", etc.
  rcdId?: string;
  componentIds: string[];
  totalPowerWatts: number;
  maxVoltageDrop: number;
}

export interface DINModule {
  id: string;
  type: 'main_switch' | 'spd' | 'rcd' | 'mcb' | 'shelly_pro' | 'bell_trafo' | 'blank';
  name: string;
  widthDIN: number; // 1DIN = 18mm (e.g. 1P MCB = 1DIN, 4P RCD = 4DIN, SPD = 4DIN)
  rating: string;
  circuitId?: string;
  brand: string;
  modelCode: string;
}

export interface SwitchboardEnclosure {
  id: string;
  name: string;
  type: string;
  floorId: string;
  position: Point3D;
  rowsCount: number;
  modulesPerRow: number;
  totalModules: number; // e.g. 24, 36, 48, 72
  modules: DINModule[];
}

export interface BlueprintUnderlay {
  imageUrl: string;
  opacity: number;
  widthMeters: number;
  heightMeters: number;
  x?: number; // X offset in meters
  y?: number; // Y offset in meters
  scaleMultiplier?: number; // Scale correction factor
  isCalibrated?: boolean; // Whether user calibrated scale with a reference wall
  referenceWallLength?: number;
}

export interface Floor {
  id: string;
  name: string;
  level: number; // 0 = prízemie / 1.NP, 1 = 1. poschodie / 2.NP, -1 = suterén
  height: number; // svetlá výška podlažia v metroch (napr. 2.70 m)
  walls: Wall[];
  rooms: Room[];
  components: ElectricalComponent[];
  routes: CableRoute[];
  switchboards: SwitchboardEnclosure[];
  blueprintUnderlay?: BlueprintUnderlay;
  installationZones?: InstallationZone[];
}

export interface ProjectData {
  id: string;
  name: string;
  clientName: string;
  address: string;
  designer: string;
  electricianCertNumber: string;
  date: string;
  currentFloorId: string;
  floors: Floor[];
  circuits: Circuit[];
  globalDefaultPathway: PathwayPreference;
  activeTool:
    | 'select'
    | 'wall'
    | 'door'
    | 'window'
    | 'room'
    | 'component'
    | 'route'
    | 'delete';
  selectedComponentType?: ElectricalComponentType;
  selectedComponentId?: string;
  selectedWallId?: string;
}

export interface BOMItem {
  id: string;
  category: 'cable' | 'wiring_device' | 'box' | 'smart_device' | 'switchboard_device' | 'accessory';
  brand: string;
  code: string;
  name: string;
  quantity: number;
  unit: 'm' | 'ks' | 'balenie';
  unitPriceEstimate?: number;
  totalPriceEstimate?: number;
  notes?: string;
}
