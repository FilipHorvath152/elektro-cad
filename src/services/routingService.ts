import { CABLE_RESERVES, calculateVoltageDrop } from '../constants/stnStandards';
import { CableRoute, CableType, ElectricalComponent, PathwayPreference, Point3D, SwitchboardEnclosure } from '../types/cad';

export interface RouteCalculationResult {
  route: CableRoute;
  pathwayType: PathwayPreference;
  points3D: Point3D[];
  lengthMeters: number;
  horizontalMeters: number;
  verticalMeters: number;
  voltageDropPercent: number;
  voltageDropVolts: number;
  isVoltageDropOk: boolean;
  recommendedCableType: CableType;
  recommendedMcb: string;
}

/**
 * Determines default cable type and MCB protection based on component type
 */
export function getStandardCircuitSpecs(componentType: string): {
  cableType: CableType;
  mcb: string;
  nominalWatts: number;
} {
  switch (componentType) {
    case 'switch_1':
    case 'switch_5':
    case 'switch_6':
    case 'switch_7':
    case 'push_button':
    case 'light_ceiling':
    case 'light_spotlight':
    case 'light_chandelier':
    case 'light_wall':
    case 'light_led_strip':
    case 'light_kitchen_under':
    case 'light_outdoor':
    case 'light_bathroom':
    case 'light_night_orientation':
      return { cableType: 'CYKY-J 3x1.5', mcb: 'B10A 1P', nominalWatts: 300 };

    case 'socket_230':
    case 'socket_230_double':
    case 'socket_ip44':
      return { cableType: 'CYKY-J 3x2.5', mcb: 'B16A 1P', nominalWatts: 2000 };

    case 'appliance_dishwasher':
    case 'appliance_washing_machine':
    case 'appliance_dryer':
    case 'appliance_oven':
      return { cableType: 'CYKY-J 3x2.5', mcb: 'B16A 1P', nominalWatts: 2200 };

    case 'cooker_outlet':
      return { cableType: 'CYKY-J 5x2.5', mcb: 'B16A 3P', nominalWatts: 7200 };

    case 'ac_outlet':
      return { cableType: 'CYKY-J 3x2.5', mcb: 'B16A 1P', nominalWatts: 1800 };

    case 'blinds_switch':
    case 'blinds_motor':
      return { cableType: 'CYKY-J 5x1.5', mcb: 'B10A 1P', nominalWatts: 350 };

    case 'data_socket':
      return { cableType: 'UTP Cat6', mcb: 'Bez istenia (dátový rozvod)', nominalWatts: 0 };

    default:
      return { cableType: 'CYKY-J 3x2.5', mcb: 'B16A 1P', nominalWatts: 1500 };
  }
}

/**
 * Computes 3D routing between an electrical component and a switchboard.
 * Supports both Automatic STN Routing and Manual User Waypoints.
 */
export function calculateComponentRoute(
  component: ElectricalComponent,
  switchboard: SwitchboardEnclosure,
  floorHeight: number = 2.70,
  pathwayOverride?: PathwayPreference,
  manualWaypoints?: { x: number; y: number }[]
): RouteCalculationResult {
  const pathway = pathwayOverride || component.pathwayPreference || 'floor';
  const start = component.position;
  const target = switchboard.position;

  const points: Point3D[] = [];
  let verticalDistance = 0;
  let horizontalDistance = 0;

  // 1. Initial point at component box
  points.push({ x: start.x, y: start.y, z: start.z });

  const isManual = manualWaypoints && manualWaypoints.length > 0;

  if (isManual) {
    // MANUAL ROUTING WITH STN RECOMMENDATIONS
    const pathwayZ =
      pathway === 'floor'
        ? 0.05
        : pathway === 'ceiling'
        ? floorHeight - 0.15
        : start.z > 1.4
        ? floorHeight - 0.30
        : 0.30;

    // Transition from component height to pathway height
    verticalDistance += Math.abs(start.z - pathwayZ);
    points.push({ x: start.x, y: start.y, z: pathwayZ });

    let prevPt = { x: start.x, y: start.y };
    manualWaypoints.forEach((wp) => {
      horizontalDistance += Math.hypot(wp.x - prevPt.x, wp.y - prevPt.y);
      points.push({ x: wp.x, y: wp.y, z: pathwayZ });
      prevPt = { x: wp.x, y: wp.y };
    });

    // From last waypoint to switchboard
    horizontalDistance += Math.hypot(target.x - prevPt.x, target.y - prevPt.y);
    points.push({ x: target.x, y: target.y, z: pathwayZ });

    // Vertical transition into switchboard
    verticalDistance += Math.abs(target.z - pathwayZ);
    points.push({ x: target.x, y: target.y, z: target.z });
  } else if (pathway === 'floor') {
    // Drop straight down to floor level (in conduit / screed at z = 0.05)
    const floorZ = 0.05;
    verticalDistance += Math.abs(start.z - floorZ);
    points.push({ x: start.x, y: start.y, z: floorZ });

    // Orthogonal run across floor (cornering at x_target, y_start or via walls)
    const midX = target.x;
    const midY = start.y;
    horizontalDistance += Math.abs(midX - start.x) + Math.abs(target.y - midY);
    points.push({ x: midX, y: midY, z: floorZ });
    points.push({ x: target.x, y: target.y, z: floorZ });

    // Rise vertically from floor into bottom of switchboard (typically z = 1.2m)
    const switchboardEntryZ = Math.max(0.2, target.z - 0.4);
    verticalDistance += Math.abs(switchboardEntryZ - floorZ);
    points.push({ x: target.x, y: target.y, z: switchboardEntryZ });
  } else if (pathway === 'ceiling') {
    // Rise straight up to ceiling level (in plaster / conduit up to z = floorHeight - 0.15)
    const ceilingZ = floorHeight - 0.15;
    verticalDistance += Math.abs(ceilingZ - start.z);
    points.push({ x: start.x, y: start.y, z: ceilingZ });

    // Orthogonal horizontal run across ceiling / hallway
    const midX = target.x;
    const midY = start.y;
    horizontalDistance += Math.abs(midX - start.x) + Math.abs(target.y - midY);
    points.push({ x: midX, y: midY, z: ceilingZ });
    points.push({ x: target.x, y: target.y, z: ceilingZ });

    // Drop vertically from ceiling into top of switchboard
    const switchboardTopZ = Math.min(floorHeight - 0.2, target.z + 0.4);
    verticalDistance += Math.abs(ceilingZ - switchboardTopZ);
    points.push({ x: target.x, y: target.y, z: switchboardTopZ });
  } else {
    // Pathway: 'wall' (running through horizontal STN installation zones ZVD or ZVH)
    const useUpperZone = start.z > 1.4;
    const wallZoneZ = useUpperZone ? floorHeight - 0.30 : 0.30;

    // Go to installation zone height
    verticalDistance += Math.abs(start.z - wallZoneZ);
    points.push({ x: start.x, y: start.y, z: wallZoneZ });

    // Run in horizontal wall zone
    const midX = target.x;
    const midY = start.y;
    horizontalDistance += Math.abs(midX - start.x) + Math.abs(target.y - midY);
    points.push({ x: midX, y: midY, z: wallZoneZ });
    points.push({ x: target.x, y: target.y, z: wallZoneZ });

    // Approach switchboard
    verticalDistance += Math.abs(target.z - wallZoneZ);
    points.push({ x: target.x, y: target.y, z: target.z });
  }

  // Add technological reserves (stripping + cabinet channels)
  const totalPhysicalLength = verticalDistance + horizontalDistance;
  const reservesTotal = CABLE_RESERVES.boxTerminalMeters + CABLE_RESERVES.switchboardTerminalMeters;
  const totalLengthWithReserves = Number((totalPhysicalLength + reservesTotal).toFixed(2));

  // Determine standard specs
  const specs = getStandardCircuitSpecs(component.type);

  // Cross section in mm2
  let crossSection = 2.5;
  if (specs.cableType.includes('3x1.5') || specs.cableType.includes('5x1.5')) {
    crossSection = 1.5;
  } else if (specs.cableType.includes('5x2.5')) {
    crossSection = 2.5;
  }

  // Calculate voltage drop
  const dropResult = calculateVoltageDrop(
    totalLengthWithReserves,
    specs.nominalWatts,
    crossSection,
    specs.cableType.includes('5x') ? 400 : 230
  );

  const route: CableRoute = {
    id: `route-${component.id}`,
    circuitId: component.circuitId || `C-${component.id.slice(0, 4)}`,
    sourceComponentId: component.id,
    targetComponentId: switchboard.id,
    pathwayType: pathway,
    points3D: points,
    lengthMeters: totalLengthWithReserves,
    cableType: specs.cableType,
    voltageDropPercent: dropResult.dropPercent,
    currentAmps: Number((specs.nominalWatts / 230).toFixed(1)),
    mcb: specs.mcb,
    rcdProtected: true,
    isManual: Boolean(isManual),
    manualWaypoints: manualWaypoints,
  };

  return {
    route,
    pathwayType: pathway,
    points3D: points,
    lengthMeters: totalLengthWithReserves,
    horizontalMeters: Number(horizontalDistance.toFixed(2)),
    verticalMeters: Number(verticalDistance.toFixed(2)),
    voltageDropPercent: dropResult.dropPercent,
    voltageDropVolts: dropResult.dropVolts,
    isVoltageDropOk: dropResult.isAcceptable,
    recommendedCableType: specs.cableType,
    recommendedMcb: specs.mcb,
  };
}
