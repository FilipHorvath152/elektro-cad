import { BOMItem, CableRoute, ElectricalComponent, SwitchboardEnclosure } from '../types/cad';
import { INSTALLATION_MATERIALS, LEGRAND_DEVICES, SHELLY_DEVICES } from '../constants/catalog';

export interface BOMSummary {
  items: BOMItem[];
  totalPriceEur: number;
  totalCableLengthMeters: number;
  totalDevicesCount: number;
  cablesByType: Record<string, number>;
}

export function generateBOM(
  components: ElectricalComponent[],
  routes: CableRoute[],
  switchboards: SwitchboardEnclosure[]
): BOMSummary {
  const items: BOMItem[] = [];

  // 1. Group Cables by Type and add 10% cutting & installation margin
  const cablesMap = new Map<string, number>();
  routes.forEach((r) => {
    const current = cablesMap.get(r.cableType) || 0;
    cablesMap.set(r.cableType, current + r.lengthMeters);
  });

  const cablesByType: Record<string, number> = {};
  let totalCableLength = 0;

  cablesMap.forEach((length, type) => {
    const lengthWithMargin = Math.ceil(length * 1.10); // +10% prerez a ohyby
    cablesByType[type] = lengthWithMargin;
    totalCableLength += lengthWithMargin;

    const catalogRef = INSTALLATION_MATERIALS.find((m) => m.code.includes(type.replace(/\s+/g, '-'))) || {
      name: `Inštalačný kábel ${type}`,
      code: type,
      priceEur: type.includes('3x1.5') ? 0.75 : type.includes('3x2.5') ? 1.15 : 1.95,
    };

    items.push({
      id: `bom-cable-${type}`,
      category: 'cable',
      brand: 'Prysmian / NKT',
      code: catalogRef.code,
      name: `${catalogRef.name} (+10% technologická rezerva)`,
      quantity: lengthWithMargin,
      unit: 'm',
      unitPriceEstimate: catalogRef.priceEur,
      totalPriceEstimate: Number((lengthWithMargin * (catalogRef.priceEur || 1)).toFixed(2)),
      notes: `Vypočítaná trasa: ${length.toFixed(1)} m + 10% prerez`,
    });
  });

  // Chránička FXP 20 pre trasy v podlahe / strope
  const conduitLength = Math.ceil(totalCableLength * 0.75); // cca 75% kabeláže ide v chráničkách
  items.push({
    id: 'bom-conduit-fxp20',
    category: 'accessory',
    brand: 'Kopos',
    code: 'FXP 20 (Monoflex)',
    name: 'Ohybná elektroinštalačná chránička FXP 20mm',
    quantity: conduitLength,
    unit: 'm',
    unitPriceEstimate: 0.38,
    totalPriceEstimate: Number((conduitLength * 0.38).toFixed(2)),
    notes: 'Pre ukladanie do podlahy a podhľadov',
  });

  // 2. Installation Boxes (KU 68 vs KP 68)
  let deepBoxesCount = 0; // for Shelly modules
  let standardBoxesCount = 0;

  components.forEach((c) => {
    if (c.type === 'switchboard' || c.type.startsWith('light_')) return;
    if (c.smartModule) {
      deepBoxesCount++;
    } else {
      standardBoxesCount++;
    }
  });

  if (deepBoxesCount > 0) {
    items.push({
      id: 'bom-box-ku68',
      category: 'box',
      brand: 'Kopos',
      code: 'KU 68-1901',
      name: 'Prístrojová krabica hlboká KU 68 (pod Shelly moduly)',
      quantity: deepBoxesCount,
      unit: 'ks',
      unitPriceEstimate: 0.85,
      totalPriceEstimate: Number((deepBoxesCount * 0.85).toFixed(2)),
      notes: 'Zväčšená hĺbka 66mm pre komfortné umiestnenie smart modulu za prístroj',
    });
  }

  if (standardBoxesCount > 0) {
    items.push({
      id: 'bom-box-kp68',
      category: 'box',
      brand: 'Kopos',
      code: 'KP 68/D',
      name: 'Prístrojová krabica pod omietku KP 68',
      quantity: standardBoxesCount,
      unit: 'ks',
      unitPriceEstimate: 0.45,
      totalPriceEstimate: Number((standardBoxesCount * 0.45).toFixed(2)),
    });
  }

  // 3. Legrand Devices & Accessories
  const deviceCounts = new Map<string, { count: number; item: ElectricalComponent }>();
  components.forEach((c) => {
    if (c.type === 'switchboard') return;
    const key = `${c.catalogItem.brand}-${c.catalogItem.code}-${c.catalogItem.name}`;
    const entry = deviceCounts.get(key) || { count: 0, item: c };
    entry.count += 1;
    deviceCounts.set(key, entry);
  });

  deviceCounts.forEach((val, key) => {
    const price = val.item.catalogItem.priceEur || 6.50;
    items.push({
      id: `bom-dev-${key}`,
      category: 'wiring_device',
      brand: val.item.catalogItem.brand,
      code: val.item.catalogItem.code,
      name: val.item.catalogItem.name,
      quantity: val.count,
      unit: 'ks',
      unitPriceEstimate: price,
      totalPriceEstimate: Number((val.count * price).toFixed(2)),
      notes: `Séria: ${val.item.catalogItem.series || 'Valena Life'}`,
    });
  });

  // 4. Shelly Smart Automation Devices
  const shellyCounts = new Map<string, number>();
  components.forEach((c) => {
    if (c.smartModule) {
      const model = c.smartModule.model;
      shellyCounts.set(model, (shellyCounts.get(model) || 0) + 1);
    }
  });

  shellyCounts.forEach((count, model) => {
    const catalogItem = SHELLY_DEVICES.find((s) => s.code.includes(model.replace('Shelly ', 'SH-')) || s.name.includes(model));
    const price = catalogItem?.priceEur || 19.90;
    items.push({
      id: `bom-shelly-${model}`,
      category: 'smart_device',
      brand: 'Shelly',
      code: catalogItem?.code || model,
      name: catalogItem?.name || model,
      quantity: count,
      unit: 'ks',
      unitPriceEstimate: price,
      totalPriceEstimate: Number((count * price).toFixed(2)),
      notes: 'Bezdrôtová automatizácia Wi-Fi / BLE',
    });
  });

  // 5. Switchboards & Modular DIN devices
  switchboards.forEach((sb) => {
    items.push({
      id: `bom-sb-${sb.id}`,
      category: 'switchboard_device',
      brand: 'Legrand',
      code: `PRACTIBOX-S-${sb.totalModules}M`,
      name: `${sb.name} (${sb.totalModules} modulov DIN pod omietku)`,
      quantity: 1,
      unit: 'ks',
      unitPriceEstimate: sb.totalModules > 36 ? 62.00 : 48.00,
      totalPriceEstimate: sb.totalModules > 36 ? 62.00 : 48.00,
      notes: 'Vrátane DIN líšt a svorkovníc N / PE',
    });

    sb.modules.forEach((mod) => {
      items.push({
        id: `bom-mod-${mod.id}`,
        category: 'switchboard_device',
        brand: mod.brand,
        code: mod.modelCode,
        name: `${mod.name} (${mod.rating})`,
        quantity: 1,
        unit: 'ks',
        unitPriceEstimate: mod.type === 'spd' ? 165.00 : mod.type === 'rcd' ? 46.00 : mod.type === 'mcb' ? 4.20 : 55.00,
        totalPriceEstimate: mod.type === 'spd' ? 165.00 : mod.type === 'rcd' ? 46.00 : mod.type === 'mcb' ? 4.20 : 55.00,
        notes: `Šírka ${mod.widthDIN} DIN`,
      });
    });

    // Fázová zbernica (hrebeňová lišta 3P)
    items.push({
      id: `bom-busbar-${sb.id}`,
      category: 'accessory',
      brand: 'Legrand',
      code: '404926',
      name: 'Fázová prepojovacia lišta 3P 10mm² (vidličková / kolíková)',
      quantity: 1,
      unit: 'ks',
      unitPriceEstimate: 14.50,
      totalPriceEstimate: 14.50,
    });
  });

  // Calculate Total Price
  const totalPriceEur = items.reduce((sum, item) => sum + (item.totalPriceEstimate || 0), 0);

  return {
    items,
    totalPriceEur: Number(totalPriceEur.toFixed(2)),
    totalCableLengthMeters: totalCableLength,
    totalDevicesCount: components.length,
    cablesByType,
  };
}
