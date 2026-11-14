import { ElectricalComponentType, PathwayPreference, RoomType } from '../types/cad';

export interface HeightRecommendation {
  type: ElectricalComponentType;
  defaultHeightMeters: number; // Z in meters
  minHeightMeters: number;
  maxHeightMeters: number;
  descriptionSk: string;
  stnReference: string;
}

export const STN_HEIGHT_RECOMMENDATIONS: Record<ElectricalComponentType, HeightRecommendation> = {
  switch_1: {
    type: 'switch_1',
    defaultHeightMeters: 1.05,
    minHeightMeters: 0.90,
    maxHeightMeters: 1.20,
    descriptionSk: 'Jednopólový spínač (odporúčaná ergonomická výška 105 cm na strane kľučky dverí)',
    stnReference: 'STN 33 2130',
  },
  switch_5: {
    type: 'switch_5',
    defaultHeightMeters: 1.05,
    minHeightMeters: 0.90,
    maxHeightMeters: 1.20,
    descriptionSk: 'Sériový / lustrový spínač (os vo výške 105 cm)',
    stnReference: 'STN 33 2130',
  },
  switch_6: {
    type: 'switch_6',
    defaultHeightMeters: 1.05,
    minHeightMeters: 0.90,
    maxHeightMeters: 1.20,
    descriptionSk: 'Striedavý / schodiskový spínač (os vo výške 105 cm)',
    stnReference: 'STN 33 2130',
  },
  switch_7: {
    type: 'switch_7',
    defaultHeightMeters: 1.05,
    minHeightMeters: 0.90,
    maxHeightMeters: 1.20,
    descriptionSk: 'Krížový spínač (os vo výške 105 cm)',
    stnReference: 'STN 33 2130',
  },
  push_button: {
    type: 'push_button',
    defaultHeightMeters: 1.05,
    minHeightMeters: 0.90,
    maxHeightMeters: 1.20,
    descriptionSk: 'Tlačidlový ovládač pre relé / Shelly (105 cm)',
    stnReference: 'STN 33 2130',
  },
  socket_230: {
    type: 'socket_230',
    defaultHeightMeters: 0.30,
    minHeightMeters: 0.20,
    maxHeightMeters: 0.40,
    descriptionSk: 'Bežná zásuvka 230V v obytných miestnostiach (stred 30 cm nad podlahou)',
    stnReference: 'STN 33 2130 (Dolná zóna ZVD)',
  },
  socket_230_double: {
    type: 'socket_230_double',
    defaultHeightMeters: 0.30,
    minHeightMeters: 0.20,
    maxHeightMeters: 0.40,
    descriptionSk: 'Dvojzásuvka 230V (stred 30 cm nad podlahou)',
    stnReference: 'STN 33 2130',
  },
  socket_ip44: {
    type: 'socket_ip44',
    defaultHeightMeters: 1.20,
    minHeightMeters: 0.30,
    maxHeightMeters: 1.40,
    descriptionSk: 'Zásuvka IP44 s viečkom (kúpeľne, exteriér, technické miestnosti)',
    stnReference: 'STN 33 2000-7-701 / STN 33 2130',
  },
  cooker_outlet: {
    type: 'cooker_outlet',
    defaultHeightMeters: 0.35,
    minHeightMeters: 0.20,
    maxHeightMeters: 0.50,
    descriptionSk: 'Sporáková prípojka 400V (varná doska)',
    stnReference: 'STN 33 2130',
  },
  ac_outlet: {
    type: 'ac_outlet',
    defaultHeightMeters: 2.50,
    minHeightMeters: 2.20,
    maxHeightMeters: 2.80,
    descriptionSk: 'Vývod pre klimatizáciu (horná inštalačná zóna ZVH, 20-30 cm pod stropom)',
    stnReference: 'STN 33 2130',
  },
  blinds_switch: {
    type: 'blinds_switch',
    defaultHeightMeters: 1.05,
    minHeightMeters: 0.90,
    maxHeightMeters: 1.20,
    descriptionSk: 'Žalúziový ovládač (105 cm nad podlahou)',
    stnReference: 'STN 33 2130',
  },
  blinds_motor: {
    type: 'blinds_motor',
    defaultHeightMeters: 2.55,
    minHeightMeters: 2.30,
    maxHeightMeters: 2.90,
    descriptionSk: 'Vývod pre motor žalúzie (nadpražie / horná inštalačná zóna)',
    stnReference: 'STN 33 2130',
  },
  light_ceiling: {
    type: 'light_ceiling',
    defaultHeightMeters: 2.70, // ceiling level
    minHeightMeters: 2.20,
    maxHeightMeters: 4.00,
    descriptionSk: 'Stropné svietidlo (stropný vývod)',
    stnReference: 'STN 33 2130',
  },
  light_spotlight: {
    type: 'light_spotlight',
    defaultHeightMeters: 2.70,
    minHeightMeters: 2.20,
    maxHeightMeters: 4.00,
    descriptionSk: 'Bodové svietidlo / downlight (vstavané v SDK podhľade)',
    stnReference: 'STN 33 2130',
  },
  light_chandelier: {
    type: 'light_chandelier',
    defaultHeightMeters: 2.20,
    minHeightMeters: 1.80,
    maxHeightMeters: 3.50,
    descriptionSk: 'Závesný luster / dizajnové svietidlo (nad jedálenský stôl)',
    stnReference: 'STN 33 2130',
  },
  light_wall: {
    type: 'light_wall',
    defaultHeightMeters: 1.90,
    minHeightMeters: 1.60,
    maxHeightMeters: 2.20,
    descriptionSk: 'Nástenné svietidlo (190 cm nad podlahou)',
    stnReference: 'STN 33 2130',
  },
  light_led_strip: {
    type: 'light_led_strip',
    defaultHeightMeters: 2.60,
    minHeightMeters: 0.10,
    maxHeightMeters: 3.80,
    descriptionSk: 'LED pásik / nepriame líniové osvetlenie (stropný fabión / podhľad)',
    stnReference: 'STN 33 2130',
  },
  light_kitchen_under: {
    type: 'light_kitchen_under',
    defaultHeightMeters: 1.50,
    minHeightMeters: 1.35,
    maxHeightMeters: 1.65,
    descriptionSk: 'Podsvietenie kuchynskej linky (LED profil pod hornými skrinkami)',
    stnReference: 'STN 33 2130',
  },
  light_outdoor: {
    type: 'light_outdoor',
    defaultHeightMeters: 2.10,
    minHeightMeters: 1.80,
    maxHeightMeters: 2.80,
    descriptionSk: 'Exteriérové / fasádne svietidlo IP65 (terasa, vchod, fasáda)',
    stnReference: 'STN 33 2000-7-714 / STN 33 2130',
  },
  light_bathroom: {
    type: 'light_bathroom',
    defaultHeightMeters: 1.90,
    minHeightMeters: 1.60,
    maxHeightMeters: 2.20,
    descriptionSk: 'Kúpeľňové svietidlo nad zrkadlo IP44 (zóna 2 / 3)',
    stnReference: 'STN 33 2000-7-701',
  },
  light_night_orientation: {
    type: 'light_night_orientation',
    defaultHeightMeters: 0.30,
    minHeightMeters: 0.20,
    maxHeightMeters: 0.50,
    descriptionSk: 'Orientačné / nočné svietidlo (schodiskový / chodbový sokel)',
    stnReference: 'STN 33 2130',
  },
  appliance_dishwasher: {
    type: 'appliance_dishwasher',
    defaultHeightMeters: 0.30,
    minHeightMeters: 0.20,
    maxHeightMeters: 0.40,
    descriptionSk: 'Zásuvka pre umývačku (umiestniť do susednej skrinky, nie priamo za umývačku)',
    stnReference: 'STN 33 2130',
  },
  appliance_washing_machine: {
    type: 'appliance_washing_machine',
    defaultHeightMeters: 1.00,
    minHeightMeters: 0.30,
    maxHeightMeters: 1.20,
    descriptionSk: 'Zásuvka pre práčku (min. IP44 v kúpeľniach, samostatný obvod)',
    stnReference: 'STN 33 2000-7-701',
  },
  appliance_dryer: {
    type: 'appliance_dryer',
    defaultHeightMeters: 1.00,
    minHeightMeters: 0.30,
    maxHeightMeters: 1.20,
    descriptionSk: 'Zásuvka pre sušičku bielizne (samostatný obvod B16A)',
    stnReference: 'STN 33 2130',
  },
  appliance_oven: {
    type: 'appliance_oven',
    defaultHeightMeters: 0.40,
    minHeightMeters: 0.20,
    maxHeightMeters: 0.60,
    descriptionSk: 'Zásuvka pre samostatnú rúru (B16A samostatný obvod)',
    stnReference: 'STN 33 2130',
  },
  appliance_refrigerator: {
    type: 'appliance_refrigerator',
    defaultHeightMeters: 0.30,
    minHeightMeters: 0.20,
    maxHeightMeters: 0.50,
    descriptionSk: 'Zásuvka pre chladničku',
    stnReference: 'STN 33 2130',
  },
  thermostat: {
    type: 'thermostat',
    defaultHeightMeters: 1.50,
    minHeightMeters: 1.30,
    maxHeightMeters: 1.60,
    descriptionSk: 'Izbový termostat (150 cm nad podlahou, mimo priameho slnka a prievanu)',
    stnReference: 'STN EN 12098 / STN 33 2130',
  },
  data_socket: {
    type: 'data_socket',
    defaultHeightMeters: 0.30,
    minHeightMeters: 0.20,
    maxHeightMeters: 0.40,
    descriptionSk: 'Dátová zásuvka RJ45 Cat6',
    stnReference: 'STN EN 50173',
  },
  socket_400v_16a: {
    type: 'socket_400v_16a',
    defaultHeightMeters: 1.00,
    minHeightMeters: 0.30,
    maxHeightMeters: 1.30,
    descriptionSk: 'Priemyselná / domová zásuvka 400V 16A 5-kolík CEE (dielňa, garáž, záhrada)',
    stnReference: 'STN 33 2130',
  },
  boiler: {
    type: 'boiler',
    defaultHeightMeters: 1.40,
    minHeightMeters: 0.40,
    maxHeightMeters: 2.00,
    descriptionSk: 'Elektrický akumulačný ohrievač vody / bojler (2000W, samostatný obvod B16A, RCD 30mA)',
    stnReference: 'STN 33 2130 / STN 33 2000-7-701',
  },
  water_pump: {
    type: 'water_pump',
    defaultHeightMeters: 0.50,
    minHeightMeters: 0.30,
    maxHeightMeters: 1.20,
    descriptionSk: 'Vodné čerpadlo / domáca vodáreň (1500W, motorový vývod B16A, min. IP44)',
    stnReference: 'STN 33 2130',
  },
  electric_heating: {
    type: 'electric_heating',
    defaultHeightMeters: 0.30,
    minHeightMeters: 0.15,
    maxHeightMeters: 0.50,
    descriptionSk: 'Elektrické kúrenie / podlahová vykurovacia rohož / konvektor (2500W, ovládané termostatom)',
    stnReference: 'STN 33 2130 / STN EN 60335-2-96',
  },
  heat_pump: {
    type: 'heat_pump',
    defaultHeightMeters: 0.60,
    minHeightMeters: 0.30,
    maxHeightMeters: 1.50,
    descriptionSk: 'Tepelné čerpadlo (4000-8000W, 400V 3P, samostatný prívod B16A-B25A 3P)',
    stnReference: 'STN 33 2130',
  },
  ventilation: {
    type: 'ventilation',
    defaultHeightMeters: 2.40,
    minHeightMeters: 2.00,
    maxHeightMeters: 2.80,
    descriptionSk: 'Rekuperácia / nútené vetranie (350W, samostatný vývod)',
    stnReference: 'STN 33 2130',
  },
  switchboard: {
    type: 'switchboard',
    defaultHeightMeters: 1.50, // center of switchboard
    minHeightMeters: 1.20,
    maxHeightMeters: 1.80,
    descriptionSk: 'Domový rozvádzač RH/RP (horná hrana do 180-200 cm, stred cca 150 cm)',
    stnReference: 'STN 33 2130 / STN EN 61439-3',
  },
};

export const WORKFLOW_STEPS: {
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  title: string;
  shortTitle: string;
  description: string;
  stnTip: string;
}[] = [
  {
    step: 1,
    title: '1. Kreslenie stien',
    shortTitle: 'Steny',
    description: 'Zakreslenie obvodových a vnútorných stien pôdorysu s automatickým 90° snapom.',
    stnTip: 'Obvodové nosné steny zvoľte hrúbku 30-40 cm, vnútorné priečky 15 cm. Kreslite v smere hodinových ručičiek.',
  },
  {
    step: 2,
    title: '2. Otvory dverí a okien',
    shortTitle: 'Otvory',
    description: 'Umiestnenie dverí, okien a výklenkov do stien s presnými stavebnými rozmermi.',
    stnTip: 'Vypínače sa umiestňujú 10-20 cm od zárubne na strane kľučky dverí vo výške 105 cm podľa STN 33 2130.',
  },
  {
    step: 3,
    title: '3. Inštalačné zóny STN 33 2130',
    shortTitle: 'Inštalačné zóny',
    description: 'Zakreslenie a generovanie vodorovných (ZVD, ZVH, ZVS), zvislých (ZVZ, ZVR) a kúpeľňových bezpečnostných zón.',
    stnTip: 'STN 33 2130: Vedenia sa ukladajú výhradne do inštalačných zón: ZVD (15-45 cm nad podlahou), ZVH (15-45 cm pod stropom), ZVS (90-120 cm pre kuchyne) a ZVZ (10-30 cm od zárubne).',
  },
  {
    step: 4,
    title: '4. Umiestnenie rozvádzača',
    shortTitle: 'Rozvádzače',
    description: 'Umiestnenie hlavného domového rozvádzača RH a podružných rozvádzačov RP na stenu.',
    stnTip: 'STN 33 2130: Rozvádzač umiestnite vo výške 1,5 m od podlahy (horná hrana max 1,8-2,0 m), v dostupnom priestore.',
  },
  {
    step: 5,
    title: '5. Svetlá a vypínače',
    shortTitle: 'Svetlá & Vypínače',
    description: 'Zakreslenie svietidiel a priradenie vypínačov (jednoduché, schodiskové 6+6, krížové 6+7+6 alebo Shelly).',
    stnTip: 'STN 33 2130: Výška vypínačov 105 cm. Možnosť spárovať viac svietidiel na 1 vypínač alebo viac vypínačov pre jedno svetlo.',
  },
  {
    step: 6,
    title: '6. Zásuvky 230V a 400V',
    shortTitle: 'Zásuvky',
    description: 'Umiestnenie zásuviek 230V a motorových zásuviek 400V s kontrolou inštalačných zón.',
    stnTip: 'STN 33 2130: Obytné izby 30 cm, kuchynská linka 115 cm, kúpeľňa min. zóna 3 vo výške 120 cm s krytím IP44 a prúdovým chráničom 30mA.',
  },
  {
    step: 7,
    title: '7. Špecializované spotrebiče & Smart',
    shortTitle: 'Spotrebiče & Smart',
    description: 'Elektrické kúrenie, bojler, vodné čerpadlo, klimatizácia, žalúzie a moduly Shelly.',
    stnTip: 'Bojler (2kW) a el. kúrenie vyžadujú samostatný obvod CYKY-J 3x2.5 a vlastný istič B16A podľa STN 33 2130.',
  },
  {
    step: 8,
    title: '8. Prepojenie komponentov',
    shortTitle: 'Prepojenie',
    description: 'Priradenie komponentov do elektrických okruhov a definícia logických väzieb ovládania.',
    stnTip: 'Na jeden svetelný obvod max 10 svietidiel (istič B10A). Na zásuvkový obvod max 10 zásuviek (istič B16A).',
  },
  {
    step: 9,
    title: '9. Trasovanie kabeláže',
    shortTitle: 'Trasovanie',
    description: 'Automatické a manuálne trasovanie káblov, 3D výpočet dĺžok a kontrola úbytku napätia podľa STN 33 2000-5-52.',
    stnTip: 'STN 33 2000-5-52: Max úbytok napätia &le; 3 % pre svetlá a &le; 5 % pre zásuvky a spotrebiče.',
  },
];

/**
 * Returns adjusted recommended height based on room context (e.g. Kitchen counter vs Bedroom)
 */
export function getRecommendedHeight(type: ElectricalComponentType, roomType?: RoomType): number {
  if (roomType === 'kitchen' && (type === 'socket_230' || type === 'socket_230_double')) {
    // Kitchen counter work surface height: 115 cm
    return 1.15;
  }
  if (roomType === 'bathroom' && (type === 'socket_230' || type === 'socket_230_double' || type === 'socket_ip44')) {
    // Bathroom mirror/washbasin socket: 120 cm
    return 1.20;
  }
  return STN_HEIGHT_RECOMMENDATIONS[type]?.defaultHeightMeters ?? 0.30;
}

/**
 * Check STN 33 2000-7-701 bathroom constraints
 */
export function validateBathroomPlacement(
  componentType: ElectricalComponentType,
  distanceFromBathOrShowerMeters: number
): { valid: boolean; warning?: string } {
  // Zone 0: inside bathtub/shower tray
  if (distanceFromBathOrShowerMeters <= 0.05) {
    return {
      valid: false,
      warning: 'STN 33 2000-7-701: Zóna 0 - Zákaz montáže akýchkoľvek spínačov a zásuviek! Povolené len SELV ≤ 12V s krytím IPX7.',
    };
  }
  // Zone 1: up to edge of bath/shower
  if (distanceFromBathOrShowerMeters < 0.60) {
    if (componentType.startsWith('socket_') || componentType.startsWith('switch_')) {
      return {
        valid: false,
        warning: 'STN 33 2000-7-701: Zóna 1 & 2 (< 60 cm od vane/sprchy) - Zákaz inštalácie zásuviek a bežných vypínačov!',
      };
    }
  }
  return { valid: true };
}

/**
 * STN 33 2000-5-52: Calculation of Voltage Drop ΔU
 */
export function calculateVoltageDrop(
  lengthMeters: number,
  powerWatts: number,
  crossSectionMm2: number,
  voltage: number = 230,
  conductorMaterial: 'copper' | 'aluminum' = 'copper'
): { dropVolts: number; dropPercent: number; isAcceptable: boolean; maxAllowedPercent: number } {
  const conductivity = conductorMaterial === 'copper' ? 56 : 35; // m / (Ohm * mm2)
  const isLighting = crossSectionMm2 === 1.5;
  const maxAllowedPercent = isLighting ? 3.0 : 5.0; // 3% for lighting, 5% for sockets/appliances

  // Formula for 1-phase: ΔU = (2 * L * P) / (κ * S * U)
  const dropVolts = (2 * lengthMeters * powerWatts) / (conductivity * crossSectionMm2 * voltage);
  const dropPercent = (dropVolts / voltage) * 100;

  return {
    dropVolts: Number(dropVolts.toFixed(2)),
    dropPercent: Number(dropPercent.toFixed(2)),
    isAcceptable: dropPercent <= maxAllowedPercent,
    maxAllowedPercent,
  };
}

/**
 * Standard Technological Cable Reserves according to Slovak Installation Practice
 */
export const CABLE_RESERVES = {
  boxTerminalMeters: 0.20,       // 20 cm at switch/socket box
  switchboardTerminalMeters: 0.90, // 90 cm inside switchboard for neat vertical wire routing
  junctionBoxMeters: 0.15,      // 15 cm in branch box
};
