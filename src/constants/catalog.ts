import { CatalogItemRef, ElectricalComponentType, SmartModuleRef } from '../types/cad';

export interface DetailedCatalogItem extends CatalogItemRef {
  description: string;
  compatibleComponentTypes: ElectricalComponentType[];
  inStock?: boolean;
}

export const LEGRAND_DEVICES: DetailedCatalogItem[] = [
  // Valena Life
  {
    brand: 'Legrand',
    series: 'Valena Life',
    code: '752101',
    name: 'Spínač č. 1 jednopólový biely',
    category: 'Vypínače',
    description: '10AX, 230V~, automatické bezskrutkové svorky',
    compatibleComponentTypes: ['switch_1'],
    priceEur: 4.90,
  },
  {
    brand: 'Legrand',
    series: 'Valena Life',
    code: '752105',
    name: 'Spínač č. 5 sériový (lustrový) biely',
    category: 'Vypínače',
    description: '10AX, 230V~, dvojitá klapka pre dva nezávislé svetelné okruhy',
    compatibleComponentTypes: ['switch_5'],
    priceEur: 6.80,
  },
  {
    brand: 'Legrand',
    series: 'Valena Life',
    code: '752106',
    name: 'Spínač č. 6 striedavý (schodiskový) biely',
    category: 'Vypínače',
    description: '10AX, 230V~, ovládanie jedného svietidla z 2 miest',
    compatibleComponentTypes: ['switch_6'],
    priceEur: 5.40,
  },
  {
    brand: 'Legrand',
    series: 'Valena Life',
    code: '752107',
    name: 'Spínač č. 7 krížový biely',
    category: 'Vypínače',
    description: '10AX, 230V~, zaradenie medzi dva schodiskové spínače č. 6',
    compatibleComponentTypes: ['switch_7'],
    priceEur: 8.90,
  },
  {
    brand: 'Legrand',
    series: 'Valena Life',
    code: '752111',
    name: 'Tlačidlový ovládač č. 1/0 biely',
    category: 'Vypínače',
    description: '10A, 230V~, tlačidlo 1-pólové s vratnou pružinou pre Shelly / impulzné relé',
    compatibleComponentTypes: ['push_button'],
    priceEur: 5.20,
  },
  {
    brand: 'Legrand',
    series: 'Valena Life',
    code: '752128',
    name: 'Žalúziový ovládač biely (mechanické blokovanie)',
    category: 'Ovládanie žalúzií',
    description: '10A, 230V~, mechanicky blokované súčasné zopnutie oboch smerov hore/dole',
    compatibleComponentTypes: ['blinds_switch'],
    priceEur: 14.50,
  },
  {
    brand: 'Legrand',
    series: 'Valena Life',
    code: '753120',
    name: 'Zásuvka 230V 1P+N+PE s detskou ochranou (kolík)',
    category: 'Zásuvky',
    description: '16A, 250V~, s clonkami (detská ochrana), bezskrutkové svorky',
    compatibleComponentTypes: ['socket_230', 'appliance_dishwasher', 'appliance_washing_machine', 'appliance_dryer', 'appliance_oven', 'appliance_refrigerator'],
    priceEur: 5.80,
  },
  {
    brand: 'Legrand',
    series: 'Valena Life',
    code: '753124',
    name: 'Dvojzásuvka 230V s natočenou dutinkou',
    category: 'Zásuvky',
    description: '16A, 250V~, s kolíkom, horná dutinka pootočená o 45 stupňov pre uhlové vidlice',
    compatibleComponentTypes: ['socket_230_double'],
    priceEur: 10.90,
  },
  {
    brand: 'Legrand',
    series: 'Valena Life',
    code: '753188',
    name: 'Zásuvka IP44 s priehľadným viečkom biela',
    category: 'Zásuvky',
    description: '16A, 250V~, do vlhkých priestorov kúpeľní a technických miestností',
    compatibleComponentTypes: ['socket_ip44'],
    priceEur: 12.30,
  },
  {
    brand: 'Legrand',
    series: 'Valena Life',
    code: '753142',
    name: 'Dátová zásuvka 1x RJ45 Cat6 UTP biela',
    category: 'Dátové rozvody',
    description: 'RJ45 Cat6 beznástrojové pripojenie LCS3',
    compatibleComponentTypes: ['data_socket'],
    priceEur: 11.20,
  },

  // Rezidenčné svietidlá a LED systémy
  {
    brand: 'Eglo',
    series: 'Fueva LED',
    code: '752001',
    name: 'Stropné prisadené LED svietidlo 24W 3000K',
    category: 'Svietidlá',
    description: 'Ploché stropné LED svietidlo s rovnomerným rozptylom svetla, priemer 285mm',
    compatibleComponentTypes: ['light_ceiling'],
    priceEur: 38.50,
  },
  {
    brand: 'Kanlux',
    series: 'Bord Downlight',
    code: '752002',
    name: 'Zápustné bodové svietidlo (downlight) 7W GU10',
    category: 'Svietidlá',
    description: 'Vstavané stropné bodové svietidlo do SDK podhľadu, výklopné prevedenie',
    compatibleComponentTypes: ['light_spotlight'],
    priceEur: 12.80,
  },
  {
    brand: 'Eglo',
    series: 'Townshend',
    code: '752003',
    name: 'Závesný luster / dizajnové svietidlo nad stôl',
    category: 'Svietidlá',
    description: 'Závesné dizajnové svietidlo nastaviteľnej výšky s teplým svetlom',
    compatibleComponentTypes: ['light_chandelier'],
    priceEur: 64.90,
  },
  {
    brand: 'Eglo',
    series: 'Passa Wall',
    code: '752004',
    name: 'Nástenné interiérové svietidlo 2x3.3W',
    category: 'Svietidlá',
    description: 'Interiérové nástenné svietidlo s obojsmerným vyžarovaním svetla',
    compatibleComponentTypes: ['light_wall'],
    priceEur: 26.50,
  },
  {
    brand: 'Kanlux',
    series: 'COB LED Strip Pro',
    code: '752005',
    name: 'LED pásik COB 24V 10W/m s hliníkovým profilom a zdrojom',
    category: 'Svietidlá',
    description: 'Líniové nepriame osvetlenie do stropných podhľadov a ník, súvislé svetlo bez viditeľných bodov',
    compatibleComponentTypes: ['light_led_strip'],
    priceEur: 32.00,
  },
  {
    brand: 'Kanlux',
    series: 'Corner Kitchen Line',
    code: '752006',
    name: 'Podsvietenie kuchynskej linky (LED profil s bezdotykovým senzorom)',
    category: 'Svietidlá',
    description: 'Hliníkový podlinkový LED profil pod horné skrinky s bezdotykovým mávacím spínačom',
    compatibleComponentTypes: ['light_kitchen_under'],
    priceEur: 28.90,
  },
  {
    brand: 'Philips',
    series: 'Hue Outdoor / Bustan',
    code: '752007',
    name: 'Exteriérové fasádne svietidlo IP65 antracit',
    category: 'Svietidlá',
    description: 'Vysoké krytie IP65, odolné voči dažďu a mrazu, obojsmerný svit na fasádu a terasu',
    compatibleComponentTypes: ['light_outdoor'],
    priceEur: 39.00,
  },
  {
    brand: 'Eglo',
    series: 'Palomaro IP44',
    code: '752008',
    name: 'Kúpeľňové LED svietidlo nad zrkadlo IP44',
    category: 'Svietidlá',
    description: 'Chrómované zrkadlové LED svietidlo s krytím IP44 do zóny 2 a 3 v kúpeľni',
    compatibleComponentTypes: ['light_bathroom'],
    priceEur: 34.00,
  },
  {
    brand: 'Legrand',
    series: 'Valena Life',
    code: '752009',
    name: 'Orientačné nočné svietidlo do krabice KU 68 so senzorom šera',
    category: 'Svietidlá',
    description: 'Soklové nočné orientačné LED svetlo na chodby a schodiská s automatickým stmievaním',
    compatibleComponentTypes: ['light_night_orientation'],
    priceEur: 19.80,
  },

  // Rámiky Valena Life
  {
    brand: 'Legrand',
    series: 'Valena Life',
    code: '754001',
    name: 'Rámik 1-násobný biely',
    category: 'Krycie rámiky',
    description: 'Jednonásobný horizontálny / vertikálny rámik',
    compatibleComponentTypes: [],
    priceEur: 1.20,
  },
  {
    brand: 'Legrand',
    series: 'Valena Life',
    code: '754002',
    name: 'Rámik 2-násobný biely',
    category: 'Krycie rámiky',
    description: 'Dvojnásobný rámik s roztečou 71mm',
    compatibleComponentTypes: [],
    priceEur: 2.50,
  },
  {
    brand: 'Legrand',
    series: 'Valena Life',
    code: '754003',
    name: 'Rámik 3-násobný biely',
    category: 'Krycie rámiky',
    description: 'Trojnásobný rámik s roztečou 71mm',
    compatibleComponentTypes: [],
    priceEur: 4.80,
  },

  // Plexo IP55 (Outdoor, Garage, Workshop)
  {
    brand: 'Legrand',
    series: 'Plexo IP55',
    code: '069731',
    name: 'Zásuvka 230V IP55 s viečkom sivá',
    category: 'Zásuvky IP55',
    description: '16A, 250V~, zvýšené krytie IP55, odolná voči vode a prachu (terasa/garáž)',
    compatibleComponentTypes: ['socket_ip44'],
    priceEur: 9.80,
  },
  {
    brand: 'Legrand',
    series: 'Plexo IP55',
    code: '069711',
    name: 'Spínač č. 1 / 6 IP55 sivý',
    category: 'Vypínače IP55',
    description: '10AX, 250V~, krytie IP55, odolný vonkajší spínač',
    compatibleComponentTypes: ['switch_1', 'switch_6'],
    priceEur: 8.90,
  },

  // Modulárne prístroje Legrand TX3 / DX3 do rozvádzača
  {
    brand: 'Legrand',
    series: 'TX3',
    code: '403356',
    name: 'Istič TX3 B10A 1P 6kA',
    category: 'Istiace prvky',
    description: 'Menovitý prúd 10A, charakteristika B, skratová odolnosť 6kA, šírka 1 DIN',
    compatibleComponentTypes: [],
    priceEur: 4.10,
  },
  {
    brand: 'Legrand',
    series: 'TX3',
    code: '403358',
    name: 'Istič TX3 B16A 1P 6kA',
    category: 'Istiace prvky',
    description: 'Menovitý prúd 16A, charakteristika B, skratová odolnosť 6kA, šírka 1 DIN',
    compatibleComponentTypes: [],
    priceEur: 4.20,
  },
  {
    brand: 'Legrand',
    series: 'TX3',
    code: '403544',
    name: 'Istič TX3 B16A 3P 6kA (trojfázový)',
    category: 'Istiace prvky',
    description: 'Trojfázový istič 16A pre varnú dosku / 400V spotrebiče, šírka 3 DIN',
    compatibleComponentTypes: [],
    priceEur: 16.50,
  },
  {
    brand: 'Legrand',
    series: 'DX3',
    code: '411505',
    name: 'Prúdový chránič DX3 40A / 30mA 4P typ A',
    category: 'Prúdové chrániče',
    description: '4-pólový RCD citlivý na striedavé aj pulzujúce jednosmerné prúdy, šírka 4 DIN',
    compatibleComponentTypes: [],
    priceEur: 46.00,
  },
  {
    brand: 'Legrand',
    series: 'DX3',
    code: '411504',
    name: 'Prúdový chránič DX3 25A / 30mA 2P typ A',
    category: 'Prúdové chrániče',
    description: '2-pólový RCD pre samostatné okruhy kúpeľne / vonkajšie zásuvky, šírka 2 DIN',
    compatibleComponentTypes: [],
    priceEur: 32.00,
  },
  {
    brand: 'Legrand',
    series: 'DX3',
    code: '412224',
    name: 'Zvodič prepätia Legrand SPD T1+T2 4P',
    category: 'Prepäťová ochrana',
    description: 'Kombinovaný zvodič prepätia Imax 50kA, pre siete TN-C-S / TN-S, šírka 4 DIN',
    compatibleComponentTypes: [],
    priceEur: 165.00,
  },

  // Rozvodnice Practibox S
  {
    brand: 'Legrand',
    series: 'Practibox S',
    code: '001324',
    name: 'Rozvodnica Practibox S pod omietku 24 modulov (2x12)',
    category: 'Rozvádzače',
    description: 'Plastová rozvodnica so svorkovnicami N/PE a bielymi dvierkami, IP40',
    compatibleComponentTypes: ['switchboard'],
    priceEur: 34.00,
  },
  {
    brand: 'Legrand',
    series: 'Practibox S',
    code: '001336',
    name: 'Rozvodnica Practibox S pod omietku 36 modulov (3x12)',
    category: 'Rozvádzače',
    description: 'Plastová rozvodnica so svorkovnicami N/PE a bielymi dvierkami, IP40',
    compatibleComponentTypes: ['switchboard'],
    priceEur: 48.00,
  },
  {
    brand: 'Legrand',
    series: 'Practibox S',
    code: '001348',
    name: 'Rozvodnica Practibox S pod omietku 48 modulov (4x12)',
    category: 'Rozvádzače',
    description: 'Plastová rozvodnica so svorkovnicami N/PE a bielymi dvierkami, IP40',
    compatibleComponentTypes: ['switchboard'],
    priceEur: 62.00,
  },
];

export const SHELLY_DEVICES: DetailedCatalogItem[] = [
  // Shelly do krabice za vypínač / zásuvku
  {
    brand: 'Shelly',
    series: 'Shelly Plus',
    code: 'SH-PLUS-1',
    name: 'Shelly Plus 1 Smart Relé 16A',
    category: 'Smart domov',
    description: 'Wi-Fi & Bluetooth 1-kanálové relé so suchým kontaktom (16A), montáž do krabice KU 68',
    compatibleComponentTypes: [
      'switch_1',
      'push_button',
      'light_ceiling',
      'light_spotlight',
      'light_chandelier',
      'light_wall',
      'light_led_strip',
      'light_kitchen_under',
      'light_outdoor',
      'light_bathroom',
      'light_night_orientation',
    ],
    priceEur: 15.90,
  },
  {
    brand: 'Shelly',
    series: 'Shelly Plus',
    code: 'SH-PLUS-1PM',
    name: 'Shelly Plus 1PM Relé s meraním spotreby 16A',
    category: 'Smart domov',
    description: 'Wi-Fi & Bluetooth smart spínač s presným meraním spotreby a ochranou proti preťaženiu',
    compatibleComponentTypes: ['socket_230', 'light_ceiling', 'appliance_dishwasher', 'appliance_washing_machine', 'ac_outlet'],
    priceEur: 18.90,
  },
  {
    brand: 'Shelly',
    series: 'Shelly Plus',
    code: 'SH-PLUS-2PM',
    name: 'Shelly Plus 2PM 2-kanálové relé & Ovládač žalúzií',
    category: 'Smart domov',
    description: '2x10A relé s meraním príkonu a režimom pre elektrické rolety a žalúzie s kalibráciou lamiel',
    compatibleComponentTypes: ['blinds_switch', 'blinds_motor', 'switch_5'],
    priceEur: 26.90,
  },
  {
    brand: 'Shelly',
    series: 'Shelly Plus',
    code: 'SH-PLUS-I4',
    name: 'Shelly Plus i4 4-vstupový modul',
    category: 'Smart domov',
    description: 'Vstupný modul pre čítanie stavu 4 tlačidiel/vypínačov a aktiváciu scén bez záťaže',
    compatibleComponentTypes: ['push_button', 'switch_1'],
    priceEur: 16.50,
  },
  {
    brand: 'Shelly',
    series: 'Shelly Mini Gen3',
    code: 'SH-MINI-1PM-G3',
    name: 'Shelly 1PM Mini Gen3 Ultracompact',
    category: 'Smart domov',
    description: 'Miniatúrne relé s meraním prúdu (8A) s procesorom ESP-Shelly-C38F pre stiesnené krabice',
    compatibleComponentTypes: ['socket_230', 'switch_1', 'light_ceiling'],
    priceEur: 16.90,
  },

  // Shelly Pro na DIN lištu do rozvádzača
  {
    brand: 'Shelly',
    series: 'Shelly Pro (DIN)',
    code: 'SH-PRO-1',
    name: 'Shelly Pro 1 DIN 1-kanálové relé 16A',
    category: 'Smart rozvádzač',
    description: 'Profesionálne relé na DIN lištu (1 DIN), LAN Ethernet, Wi-Fi a Bluetooth, suchý kontakt',
    compatibleComponentTypes: ['switchboard'],
    priceEur: 49.00,
  },
  {
    brand: 'Shelly',
    series: 'Shelly Pro (DIN)',
    code: 'SH-PRO-1PM',
    name: 'Shelly Pro 1PM DIN Relé s meraním 16A',
    category: 'Smart rozvádzač',
    description: '1-kanálové relé s meraním prúdu na DIN lištu (1 DIN), LAN Ethernet, Wi-Fi, preťaženie',
    compatibleComponentTypes: ['switchboard'],
    priceEur: 55.00,
  },
  {
    brand: 'Shelly',
    series: 'Shelly Pro (DIN)',
    code: 'SH-PRO-2PM',
    name: 'Shelly Pro 2PM DIN 2-kanálové relé / Žalúzie',
    category: 'Smart rozvádzač',
    description: '2-kanálové relé (2x16A) na DIN lištu (1 DIN), ovládač žalúzií, meranie spotreby, LAN Ethernet',
    compatibleComponentTypes: ['switchboard'],
    priceEur: 75.00,
  },
  {
    brand: 'Shelly',
    series: 'Shelly Pro (DIN)',
    code: 'SH-PRO-4PM',
    name: 'Shelly Pro 4PM DIN 4-kanálové relé s displejom',
    category: 'Smart rozvádzač',
    description: '4-kanálové relé (4x16A, max 40A celkovo) na DIN lištu (4 DIN) s farebným 1.8" displejom a LAN',
    compatibleComponentTypes: ['switchboard'],
    priceEur: 110.00,
  },
  {
    brand: 'Shelly',
    series: 'Shelly Pro (DIN)',
    code: 'SH-PRO-EM-50',
    name: 'Shelly Pro EM-50 DIN 2-kanálový elektromer',
    category: 'Smart rozvádzač',
    description: 'Presný merací modul spotreby s dvomi 50A prúdovými transformátormi (1 DIN), LAN, Wi-Fi',
    compatibleComponentTypes: ['switchboard'],
    priceEur: 79.00,
  },
];

export const INSTALLATION_MATERIALS: DetailedCatalogItem[] = [
  {
    brand: 'Kopos',
    series: 'Krabice pod omietku',
    code: 'KP 68/D',
    name: 'Prístrojová krabica plytká KP 68',
    category: 'Inštalačné krabice',
    description: 'Hĺbka 42mm, priemer 71mm, pre montáž do muriva',
    compatibleComponentTypes: ['switch_1', 'socket_230'],
    priceEur: 0.45,
  },
  {
    brand: 'Kopos',
    series: 'Krabice pod omietku',
    code: 'KU 68-1901',
    name: 'Prístrojová krabica hlboká KU 68 (pod Shelly)',
    category: 'Inštalačné krabice',
    description: 'Hĺbka 66mm, zväčšený vnútorný priestor pre komfortné umiestnenie modulu Shelly za prístroj',
    compatibleComponentTypes: ['switch_1', 'socket_230', 'blinds_switch'],
    priceEur: 0.85,
  },
  {
    brand: 'Kopos',
    series: 'Chráničky',
    code: 'FXP 20 (Monoflex)',
    name: 'Ohybná chránička FXP 20 mm 750N',
    category: 'Chráničky',
    description: 'Samozhášavá PVC ohybná trubka pre ukladanie káblov do podlahy a betónu',
    compatibleComponentTypes: [],
    priceEur: 0.38,
  },
  // Káble
  {
    brand: 'Kábel',
    series: 'CYKY-J',
    code: 'CYKY-J-3x1.5',
    name: 'Kábel medený CYKY-J 3x1.5 mm²',
    category: 'Kabeláž',
    description: 'Medený inštalačný kábel pre svetelné obvody (hnedá, modrá, žltozelená)',
    compatibleComponentTypes: ['light_ceiling', 'light_wall', 'switch_1'],
    priceEur: 0.75,
  },
  {
    brand: 'Kábel',
    series: 'CYKY-J',
    code: 'CYKY-J-3x2.5',
    name: 'Kábel medený CYKY-J 3x2.5 mm²',
    category: 'Kabeláž',
    description: 'Medený inštalačný kábel pre zásuvkové obvody a bežné spotrebiče',
    compatibleComponentTypes: ['socket_230', 'socket_230_double', 'socket_ip44', 'appliance_dishwasher', 'appliance_washing_machine', 'ac_outlet'],
    priceEur: 1.15,
  },
  {
    brand: 'Kábel',
    series: 'CYKY-J',
    code: 'CYKY-J-5x2.5',
    name: 'Kábel medený CYKY-J 5x2.5 mm²',
    category: 'Kabeláž',
    description: 'Trojfázový inštalačný kábel pre varné dosky a 400V spotrebiče',
    compatibleComponentTypes: ['cooker_outlet'],
    priceEur: 1.95,
  },
  {
    brand: 'Kábel',
    series: 'CYKY-J',
    code: 'CYKY-J-5x1.5',
    name: 'Kábel medený CYKY-J 5x1.5 mm²',
    category: 'Kabeláž',
    description: 'Inštalačný kábel pre motory žalúzií a viacokruhové ovládania',
    compatibleComponentTypes: ['blinds_motor'],
    priceEur: 1.25,
  },
  {
    brand: 'Kábel',
    series: 'Dátové káble',
    code: 'UTP-CAT6',
    name: 'Dátový kábel UTP Cat6 LSOH',
    category: 'Kabeláž',
    description: 'Nestienená krútená dvojlinka 4x2 AWG23 pre štruktúrovanú kabeláž a LAN',
    compatibleComponentTypes: ['data_socket'],
    priceEur: 0.65,
  },
];

/**
 * Intelligent Shelly Recommendation Engine:
 * Suggests the best Shelly device and mounting location based on the application.
 */
export function recommendShellyModule(componentType: ElectricalComponentType): SmartModuleRef | undefined {
  switch (componentType) {
    case 'blinds_switch':
    case 'blinds_motor':
      return {
        brand: 'Shelly',
        model: 'Shelly Plus 2PM',
        location: 'in_box',
        mode: 'roller_blinds',
      };
    case 'boiler':
    case 'electric_heating':
    case 'water_pump':
      return {
        brand: 'Shelly',
        model: 'Shelly Plus 1PM',
        location: 'in_box',
        mode: 'metering',
      };
    case 'heat_pump':
      return {
        brand: 'Shelly',
        model: 'Shelly Pro 4PM',
        location: 'in_switchboard',
        mode: 'metering',
      };
    case 'socket_230':
    case 'appliance_dishwasher':
    case 'appliance_washing_machine':
      return {
        brand: 'Shelly',
        model: 'Shelly Plus 1PM',
        location: 'in_box',
        mode: 'metering',
      };
    case 'switch_1':
    case 'push_button':
      return {
        brand: 'Shelly',
        model: 'Shelly Plus 1',
        location: 'in_box',
        mode: 'switch',
      };
    case 'switch_5':
      return {
        brand: 'Shelly',
        model: 'Shelly Plus 2PM',
        location: 'in_box',
        mode: 'switch',
      };
    default:
      return undefined;
  }
}

/**
 * Find default catalog item for a given electrical component type
 */
export function getDefaultCatalogItem(type: ElectricalComponentType): CatalogItemRef {
  const match = LEGRAND_DEVICES.find((item) => item.compatibleComponentTypes.includes(type));
  if (match) {
    return {
      brand: match.brand,
      series: match.series,
      code: match.code,
      name: match.name,
      category: match.category,
      priceEur: match.priceEur,
    };
  }
  return {
    brand: 'Legrand',
    series: 'Valena Life',
    code: 'GENERIC',
    name: type,
    category: 'Elektroinštalácia',
  };
}
