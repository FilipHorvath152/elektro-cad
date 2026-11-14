import { Floor, InstallationZone, Point2D, Wall } from '../types/cad';

/**
 * Service pre generovanie a správu inštalačných zón podľa STN 33 2130 a STN 33 2000-7-701.
 */

/**
 * Automaticky vygeneruje kompletnú sieť inštalačných zón pre podlažie podľa STN 33 2130:
 * - Vodorovné zóny: ZVH (horná, 15-45 cm pod stropom), ZVD (dolná, 15-45 cm nad podlahou)
 * - Zvislé zóny: ZVZ (pri dverách 10-30 cm od zárubne pre vypínače), ZVR (v rohoch stien)
 * - Kúpeľňové bezpečnostné zóny: Zóna 0, 1, 2 podľa STN 33 2000-7-701
 */
export function generateSTNInstallationZones(floor: Floor): InstallationZone[] {
  const zones: InstallationZone[] = [];
  const floorHeight = floor.height || 2.7;

  // 1. Pre každú stenu vygenerujeme horizontálne zóny ZVH a ZVD
  floor.walls.forEach((wall, idx) => {
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const wallLength = Math.hypot(dx, dy);
    if (wallLength < 0.2) return;

    // ZVH: Zóna vodorovná horná (15 až 45 cm pod hotovým stropom, os 30 cm pod stropom)
    zones.push({
      id: `zone-zvh-${wall.id}`,
      name: `ZVH - Horná zóna (Stena #${idx + 1})`,
      type: 'zvh',
      wallId: wall.id,
      distanceFromStartMeters: 0,
      lengthMeters: Number(wallLength.toFixed(2)),
      widthMeters: 0.30,
      elevationBottomMeters: Number(Math.max(0.1, floorHeight - 0.45).toFixed(2)),
      elevationTopMeters: Number(Math.max(0.2, floorHeight - 0.15).toFixed(2)),
      description: 'STN 33 2130: Horná vodorovná zóna 15-45 cm pod stropom pre káblové rozvody, svetelné vývody a klimatizácie.',
      stnReference: 'STN 33 2130 čl. 7.6.2',
      color: '#38bdf8', // sky-400
      isAutomatic: true,
    });

    // ZVD: Zóna vodorovná dolná (15 až 45 cm nad hotovou podlahou, os 30 cm nad podlahou)
    zones.push({
      id: `zone-zvd-${wall.id}`,
      name: `ZVD - Dolná zóna (Stena #${idx + 1})`,
      type: 'zvd',
      wallId: wall.id,
      distanceFromStartMeters: 0,
      lengthMeters: Number(wallLength.toFixed(2)),
      widthMeters: 0.30,
      elevationBottomMeters: 0.15,
      elevationTopMeters: 0.45,
      description: 'STN 33 2130: Dolná vodorovná zóna 15-45 cm nad podlahou pre zásuvkové okruhy v obytných izbách.',
      stnReference: 'STN 33 2130 čl. 7.6.2',
      color: '#2dd4bf', // teal-400
      isAutomatic: true,
    });

    // Zvislé zóny v rohoch steny (ZVR - 10 až 30 cm od rohu)
    if (wallLength >= 0.8) {
      // Začiatok steny (roh)
      zones.push({
        id: `zone-zvr-start-${wall.id}`,
        name: `ZVR - Roh steny (štart #${idx + 1})`,
        type: 'zvr',
        wallId: wall.id,
        distanceFromStartMeters: 0.10,
        lengthMeters: 0.20,
        widthMeters: 0.20,
        elevationBottomMeters: 0.15,
        elevationTopMeters: Number(Math.max(0.2, floorHeight - 0.15).toFixed(2)),
        description: 'STN 33 2130: Zvislá inštalačná zóna 10-30 cm od vnútorného rohu steny pre zvislé zvody a stúpacie vedenia.',
        stnReference: 'STN 33 2130 čl. 7.6.3',
        color: '#a78bfa', // purple-400
        isAutomatic: true,
      });

      // Koniec steny (roh)
      zones.push({
        id: `zone-zvr-end-${wall.id}`,
        name: `ZVR - Roh steny (koniec #${idx + 1})`,
        type: 'zvr',
        wallId: wall.id,
        distanceFromStartMeters: Number((wallLength - 0.30).toFixed(2)),
        lengthMeters: 0.20,
        widthMeters: 0.20,
        elevationBottomMeters: 0.15,
        elevationTopMeters: Number(Math.max(0.2, floorHeight - 0.15).toFixed(2)),
        description: 'STN 33 2130: Zvislá inštalačná zóna 10-30 cm od rohu steny pre zvislé zvody.',
        stnReference: 'STN 33 2130 čl. 7.6.3',
        color: '#a78bfa',
        isAutomatic: true,
      });
    }

    // Zvislé zóny pri dverách (ZVZ - 10 až 30 cm od dvernej zárubne pre vypínače a termostaty)
    if (wall.openings && wall.openings.length > 0) {
      wall.openings.forEach((op) => {
        if (op.type === 'door') {
          const doorCenterDist = op.positionRatio * wallLength;
          const halfWidth = op.width / 2;

          // Ľavá strana zárubne (10-30 cm od hrany otvoru)
          const leftZoneStart = Math.max(0.05, doorCenterDist - halfWidth - 0.30);
          zones.push({
            id: `zone-zvz-left-${op.id}`,
            name: `ZVZ - Dvere (ľavá strana vypínače)`,
            type: 'zvz',
            wallId: wall.id,
            distanceFromStartMeters: Number(leftZoneStart.toFixed(2)),
            lengthMeters: 0.20,
            widthMeters: 0.20,
            elevationBottomMeters: 0.15,
            elevationTopMeters: Number(Math.max(0.2, floorHeight - 0.15).toFixed(2)),
            description: 'STN 33 2130: Zvislá zóna 10-30 cm od zárubne dverí (os 20 cm) vo výške 105 cm pre vypínače svietidiel a termostaty.',
            stnReference: 'STN 33 2130 čl. 7.6.3',
            color: '#34d399', // emerald-400
            isAutomatic: true,
          });

          // Pravá strana zárubne (10-30 cm od hrany otvoru)
          const rightZoneStart = Math.min(wallLength - 0.25, doorCenterDist + halfWidth + 0.10);
          zones.push({
            id: `zone-zvz-right-${op.id}`,
            name: `ZVZ - Dvere (pravá strana vypínače)`,
            type: 'zvz',
            wallId: wall.id,
            distanceFromStartMeters: Number(rightZoneStart.toFixed(2)),
            lengthMeters: 0.20,
            widthMeters: 0.20,
            elevationBottomMeters: 0.15,
            elevationTopMeters: Number(Math.max(0.2, floorHeight - 0.15).toFixed(2)),
            description: 'STN 33 2130: Zvislá zóna 10-30 cm od zárubne dverí pre vypínače.',
            stnReference: 'STN 33 2130 čl. 7.6.3',
            color: '#34d399',
            isAutomatic: true,
          });
        }
      });
    }
  });

  // 2. Kúpeľňové bezpečnostné zóny podľa STN 33 2000-7-701
  if (floor.rooms && floor.rooms.length > 0) {
    floor.rooms.forEach((room) => {
      const isBath =
        room.type === 'bathroom' ||
        room.name.toLowerCase().includes('kúpeľ') ||
        room.name.toLowerCase().includes('kupel');

      if (isBath && room.points && room.points.length >= 3) {
        // Vypočítame referenčný bod v kúpeľni (napr. v rohu pre vaňu)
        const p0 = room.points[0];
        const tubWidth = 1.60;
        const tubHeight = 0.80;

        // Zóna 0 & 1 (Vaňa / Sprcha)
        zones.push({
          id: `zone-bath-0-1-${room.id}`,
          name: `Kúpeľňa - Zóna 0 & 1 (${room.name})`,
          type: 'bathroom',
          roomId: room.id,
          subType: '0',
          widthMeters: tubWidth,
          elevationBottomMeters: 0,
          elevationTopMeters: 2.25,
          center: { x: p0.x + tubWidth / 2, y: p0.y + tubHeight / 2 },
          dimensions: { width: tubWidth, height: tubHeight },
          description: 'STN 33 2000-7-701: Zóna 0 & 1 – Priestor vane / sprchy. Prísny zákaz montáže zásuviek a bežných spínačov.',
          stnReference: 'STN 33 2000-7-701',
          color: '#ef4444', // red-500
          isAutomatic: true,
        });

        // Zóna 2 (Ochranný pás 0.6 m okolo Zóny 1)
        const z2Width = tubWidth + 1.20;
        const z2Height = tubHeight + 1.20;
        zones.push({
          id: `zone-bath-2-${room.id}`,
          name: `Kúpeľňa - Zóna 2 (Ochranný pás 0.6m)`,
          type: 'bathroom',
          roomId: room.id,
          subType: '2',
          widthMeters: z2Width,
          elevationBottomMeters: 0,
          elevationTopMeters: 2.25,
          center: { x: p0.x + tubWidth / 2, y: p0.y + tubHeight / 2 },
          dimensions: { width: z2Width, height: z2Height },
          description: 'STN 33 2000-7-701: Zóna 2 – Ochranný pás 60 cm od vane. Povolené iba špeciálne svietidlá min. IPX4, žiadne bežné 230V zásuvky.',
          stnReference: 'STN 33 2000-7-701',
          color: '#f59e0b', // amber-500
          isAutomatic: true,
        });
      }
    });
  }

  return zones;
}

/**
 * Pridá alebo prepne strednú inštalačnú zónu ZVS (Kuchynská linka / pracovný stôl vo výške 90-120 cm, os 105-115 cm)
 */
export function toggleKitchenZoneOnWall(wallId: string, floor: Floor): InstallationZone[] {
  const existing = floor.installationZones || [];
  const exists = existing.find((z) => z.wallId === wallId && z.type === 'zvs');

  if (exists) {
    // Ak už existuje, odstránime ju
    return existing.filter((z) => z.id !== exists.id);
  }

  const wall = floor.walls.find((w) => w.id === wallId);
  if (!wall) return existing;

  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const wallLength = Math.hypot(dx, dy);

  // Kuchynská linka je výhradne na jednej strane steny (v kuchyni).
  // Ak sú definované miestnosti, skúsime automaticky zistiť stranu s kuchyňou.
  let initialSide: 'left' | 'right' = 'left';
  if (floor.rooms && floor.rooms.length > 0 && wallLength > 0.1) {
    const ux = dx / wallLength;
    const uy = dy / wallLength;
    const nx = -uy;
    const ny = ux;
    const midX = (wall.start.x + wall.end.x) / 2;
    const midY = (wall.start.y + wall.end.y) / 2;
    const testLeft = { x: midX + nx * 0.25, y: midY + ny * 0.25 };
    const testRight = { x: midX - nx * 0.25, y: midY - ny * 0.25 };

    const kitchenRoom = floor.rooms.find(
      (r) =>
        r.type === 'kitchen' ||
        r.name.toLowerCase().includes('kuchyň') ||
        r.name.toLowerCase().includes('kuchyn') ||
        r.name.toLowerCase().includes('obýv') ||
        r.name.toLowerCase().includes('obyv')
    );

    if (kitchenRoom && kitchenRoom.points && kitchenRoom.points.length >= 3) {
      const pointInPolygon = (pt: Point2D, poly: Point2D[]) => {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const xi = poly[i].x, yi = poly[i].y;
          const xj = poly[j].x, yj = poly[j].y;
          const intersect = yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
          if (intersect) inside = !inside;
        }
        return inside;
      };

      if (pointInPolygon(testRight, kitchenRoom.points)) {
        initialSide = 'right';
      } else if (pointInPolygon(testLeft, kitchenRoom.points)) {
        initialSide = 'left';
      }
    }
  }

  const newZone: InstallationZone = {
    id: `zone-zvs-${wallId}-${Date.now()}`,
    name: `ZVS - Kuchynská linka (os 115 cm)`,
    type: 'zvs',
    wallId,
    distanceFromStartMeters: 0,
    lengthMeters: Number(wallLength.toFixed(2)),
    widthMeters: 0.30,
    elevationBottomMeters: 0.90,
    elevationTopMeters: 1.20,
    side: initialSide,
    description: 'STN 33 2130: Stredná vodorovná zóna 90-120 cm (os 115 cm) nad hotovou podlahou pre zásuvky kuchynskej linky a pracovných dosiek.',
    stnReference: 'STN 33 2130 čl. 7.6.2',
    color: '#f59e0b', // amber-500
    isAutomatic: false,
  };

  return [...existing, newZone];
}

/**
 * Pridá vlastnú zvislú inštalačnú zónu (zvod / inštalačná šachta) na stenu v zadanej vzdialenosti
 */
export function addVerticalZoneOnWall(
  wallId: string,
  distanceMeters: number,
  floor: Floor
): InstallationZone[] {
  const existing = floor.installationZones || [];
  const floorHeight = floor.height || 2.7;

  const newZone: InstallationZone = {
    id: `zone-zv-custom-${wallId}-${Date.now()}`,
    name: `Zvislý inštalačný zvod (${distanceMeters.toFixed(2)} m)`,
    type: 'zvz',
    wallId,
    distanceFromStartMeters: Number(Math.max(0, distanceMeters - 0.10).toFixed(2)),
    lengthMeters: 0.20,
    widthMeters: 0.20,
    elevationBottomMeters: 0.15,
    elevationTopMeters: Number(Math.max(0.2, floorHeight - 0.15).toFixed(2)),
    description: 'STN 33 2130: Vyhradená zvislá zóna pre káblový zvod medzi hornou a dolnou inštalačnou zónou.',
    stnReference: 'STN 33 2130 čl. 7.6.3',
    color: '#10b981', // emerald-500
    isAutomatic: false,
  };

  return [...existing, newZone];
}

/**
 * Pridá kúpeľňovú bezpečnostnú zónu na zadanú pozíciu
 */
export function addBathroomSafetyZone(
  center: Point2D,
  width: number,
  height: number,
  roomId: string | undefined,
  floor: Floor
): InstallationZone[] {
  const existing = floor.installationZones || [];
  const id = Date.now();

  const zone01: InstallationZone = {
    id: `zone-bath-0-custom-${id}`,
    name: 'Kúpeľňa - Zóna 0 & 1 (Vaňa / Sprchový kút)',
    type: 'bathroom',
    roomId,
    subType: '0',
    widthMeters: width,
    elevationBottomMeters: 0,
    elevationTopMeters: 2.25,
    center,
    dimensions: { width, height },
    description: 'STN 33 2000-7-701: Zóna 0 a 1 – Priamy zákaz inštalácie zásuviek a bežných spínačov.',
    stnReference: 'STN 33 2000-7-701',
    color: '#ef4444',
    isAutomatic: false,
  };

  const zone2: InstallationZone = {
    id: `zone-bath-2-custom-${id}`,
    name: 'Kúpeľňa - Zóna 2 (Ochranný pás 60 cm)',
    type: 'bathroom',
    roomId,
    subType: '2',
    widthMeters: width + 1.20,
    elevationBottomMeters: 0,
    elevationTopMeters: 2.25,
    center,
    dimensions: { width: width + 1.20, height: height + 1.20 },
    description: 'STN 33 2000-7-701: Zóna 2 – Zákaz bežných 230V zásuviek, vyžaduje sa krytie min. IPX4.',
    stnReference: 'STN 33 2000-7-701',
    color: '#f59e0b',
    isAutomatic: false,
  };

  return [...existing, zone01, zone2];
}

/**
 * Pridá stropný káblový koridor (trasovanie v SDK podhľade)
 */
export function addCeilingCorridor(
  start: Point2D,
  end: Point2D,
  widthMeters: number = 0.40,
  floor: Floor
): InstallationZone[] {
  const existing = floor.installationZones || [];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.2) return existing;

  const floorHeight = floor.height || 2.7;

  const newZone: InstallationZone = {
    id: `zone-ceiling-${Date.now()}`,
    name: `Stropný koridor SDK (${len.toFixed(2)} m)`,
    type: 'ceiling',
    widthMeters,
    elevationBottomMeters: Number(Math.max(0.1, floorHeight - 0.20).toFixed(2)),
    elevationTopMeters: floorHeight,
    polygon: [start, end],
    description: 'Vyhradený stropný inštalačný koridor v sádrokartónovom podhľade pre hlavné káblové zväzky.',
    color: '#fbbf24', // amber-400
    isAutomatic: false,
  };

  return [...existing, newZone];
}

/**
 * Pridá inštalačnú zónu na konkrétny vymedzený úsek steny (nie celú stenu)
 * Vhodné pre kuchynskú linku, pracovný stôl, TV stenu alebo vlastný káblový koridor.
 */
export function addWallZoneSegment(
  wallId: string,
  startMeters: number,
  lengthMeters: number,
  type: InstallationZone['type'],
  floor: Floor,
  options?: Partial<InstallationZone>
): InstallationZone[] {
  const existing = floor.installationZones || [];
  const wall = floor.walls.find((w) => w.id === wallId);
  if (!wall) return existing;

  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const wallLength = Math.hypot(dx, dy);

  const clampedStart = Math.max(0, Math.min(wallLength - 0.1, startMeters));
  const clampedLength = Math.max(0.1, Math.min(wallLength - clampedStart, lengthMeters));
  const floorHeight = floor.height || 2.7;

  let name = `Vymedzená zóna (${clampedLength.toFixed(2)} m)`;
  let elevationBottom = 0.15;
  let elevationTop = 0.45;
  let color = '#38bdf8';
  let desc = 'Vymedzený úsek inštalačnej zóny na stene.';
  let stnRef = 'STN 33 2130 čl. 7.6';

  if (type === 'zvs') {
    name = `ZVS – Kuchynská linka (${clampedLength.toFixed(2)} m)`;
    elevationBottom = 0.90;
    elevationTop = 1.20;
    color = '#f59e0b';
    desc = 'STN 33 2130: Stredná vodorovná zóna 90–120 cm (os 115 cm) vymedzená presne pre kuchynskú linku a pracovnú dosku.';
    stnRef = 'STN 33 2130 čl. 7.6.2';
  } else if (type === 'zvd') {
    name = `ZVD – Dolná zóna (${clampedLength.toFixed(2)} m)`;
    elevationBottom = 0.15;
    elevationTop = 0.45;
    color = '#2dd4bf';
    desc = 'STN 33 2130: Dolná vodorovná zóna 15–45 cm nad podlahou pre zásuvkové okruhy.';
    stnRef = 'STN 33 2130 čl. 7.6.2';
  } else if (type === 'zvh') {
    name = `ZVH – Horná zóna (${clampedLength.toFixed(2)} m)`;
    elevationBottom = Number(Math.max(0.1, floorHeight - 0.45).toFixed(2));
    elevationTop = Number(Math.max(0.2, floorHeight - 0.15).toFixed(2));
    color = '#38bdf8';
    desc = 'STN 33 2130: Horná vodorovná zóna 15–45 cm pod stropom pre káblové magistrály a svetlá.';
    stnRef = 'STN 33 2130 čl. 7.6.2';
  } else if (type === 'zvz') {
    name = `ZVZ – Zvislý úsek (${clampedLength.toFixed(2)} m)`;
    elevationBottom = 0.15;
    elevationTop = Number(Math.max(0.2, floorHeight - 0.15).toFixed(2));
    color = '#34d399';
    desc = 'STN 33 2130: Zvislá inštalačná zóna pre káblový zvod.';
    stnRef = 'STN 33 2130 čl. 7.6.3';
  }

  // Kuchynská linka (ZVS) je výhradne na jednej strane steny (v kuchyni), preto má predvolenú hodnotu 'left', nie 'both'!
  const defaultSide: 'left' | 'right' | 'both' = type === 'zvs' ? 'left' : 'both';

  const newZone: InstallationZone = {
    id: `zone-seg-${wallId}-${Date.now()}`,
    name,
    type,
    wallId,
    distanceFromStartMeters: Number(clampedStart.toFixed(2)),
    lengthMeters: Number(clampedLength.toFixed(2)),
    widthMeters: 0.30,
    elevationBottomMeters: elevationBottom,
    elevationTopMeters: elevationTop,
    side: options?.side || defaultSide,
    description: desc,
    stnReference: stnRef,
    color,
    isAutomatic: false,
    ...options,
  };

  return [...existing, newZone];
}

/**
 * Aktualizuje parametre konkrétnej inštalačnej zóny
 */
export function updateInstallationZone(
  zoneId: string,
  updates: Partial<InstallationZone>,
  floor: Floor
): InstallationZone[] {
  const existing = floor.installationZones || [];
  return existing.map((z) => (z.id === zoneId ? { ...z, ...updates } : z));
}

/**
 * Odstráni inštalačnú zónu podľa ID
 */
export function deleteInstallationZone(zoneId: string, floor: Floor): InstallationZone[] {
  const existing = floor.installationZones || [];
  return existing.filter((z) => z.id !== zoneId);
}
