import { ElectricalComponent, Floor, InstallationZone, Opening, Point2D, Wall } from '../types/cad';

export function roundCoord(val: number, decimals: number = 3): number {
  return Number(val.toFixed(decimals));
}

export function roundPoint(pt: Point2D, decimals: number = 3): Point2D {
  return {
    x: roundCoord(pt.x, decimals),
    y: roundCoord(pt.y, decimals),
  };
}

export function pointsEqual(p1: Point2D, p2: Point2D, tolerance: number = 0.03): boolean {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y) < tolerance;
}

export function segmentLength(p1: Point2D, p2: Point2D): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Projects a 2D point onto a line segment.
 * Returns projection point, ratio t (0 = start, 1 = end), distance to segment, and whether it's strictly interior.
 */
export function projectPointOntoSegment(
  pt: Point2D,
  segStart: Point2D,
  segEnd: Point2D
): { proj: Point2D; t: number; dist: number; isInterior: boolean } {
  const dx = segEnd.x - segStart.x;
  const dy = segEnd.y - segStart.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq < 1e-8) {
    return {
      proj: { x: segStart.x, y: segStart.y },
      t: 0,
      dist: Math.hypot(pt.x - segStart.x, pt.y - segStart.y),
      isInterior: false,
    };
  }

  const rawT = ((pt.x - segStart.x) * dx + (pt.y - segStart.y) * dy) / lenSq;
  const tClamped = Math.max(0, Math.min(1, rawT));
  const proj = {
    x: roundCoord(segStart.x + tClamped * dx),
    y: roundCoord(segStart.y + tClamped * dy),
  };
  const dist = Math.hypot(pt.x - proj.x, pt.y - proj.y);
  // Interior: not within 0.05m of endpoints
  const segLen = Math.sqrt(lenSq);
  const minMarginRatio = segLen > 0.1 ? 0.05 / segLen : 0.05;
  const isInterior = rawT >= minMarginRatio && rawT <= 1 - minMarginRatio;

  return { proj, t: tClamped, dist, isInterior };
}

/**
 * Detects 2D intersection between two line segments (p1-p2 and p3-p4).
 */
export function findSegmentIntersection(
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  p4: Point2D
): {
  intersect: boolean;
  point?: Point2D;
  t1?: number; // ratio along p1-p2
  t2?: number; // ratio along p3-p4
  isInterior1?: boolean;
  isInterior2?: boolean;
  isCollinear?: boolean;
} {
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x;
  const d2y = p4.y - p3.y;

  const denom = d1x * d2y - d1y * d2x;

  // Check parallel or collinear
  if (Math.abs(denom) < 1e-6) {
    const projP3 = projectPointOntoSegment(p3, p1, p2);
    const projP4 = projectPointOntoSegment(p4, p1, p2);
    const isCollinear = projP3.dist < 0.05 && projP4.dist < 0.05;
    return { intersect: false, isCollinear };
  }

  const t1 = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;
  const t2 = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / denom;

  const eps = 0.005;
  if (t1 >= -eps && t1 <= 1 + eps && t2 >= -eps && t2 <= 1 + eps) {
    const clampedT1 = Math.max(0, Math.min(1, t1));
    const clampedT2 = Math.max(0, Math.min(1, t2));
    const point = {
      x: roundCoord(p1.x + clampedT1 * d1x),
      y: roundCoord(p1.y + clampedT1 * d1y),
    };

    const len1 = Math.hypot(d1x, d1y);
    const len2 = Math.hypot(d2x, d2y);
    const margin1 = len1 > 0.1 ? 0.04 / len1 : 0.03;
    const margin2 = len2 > 0.1 ? 0.04 / len2 : 0.03;

    const isInterior1 = clampedT1 >= margin1 && clampedT1 <= 1 - margin1;
    const isInterior2 = clampedT2 >= margin2 && clampedT2 <= 1 - margin2;

    return {
      intersect: true,
      point,
      t1: clampedT1,
      t2: clampedT2,
      isInterior1,
      isInterior2,
    };
  }

  return { intersect: false };
}

/**
 * Checks if two walls are collinear and overlap each other.
 */
export function checkCollinearOverlap(
  w1: Wall,
  w2: Wall
): {
  isCollinear: boolean;
  overlaps: boolean;
  splitPoints: Point2D[];
} {
  const d1x = w1.end.x - w1.start.x;
  const d1y = w1.end.y - w1.start.y;
  const len1 = Math.hypot(d1x, d1y);
  if (len1 < 0.05) return { isCollinear: false, overlaps: false, splitPoints: [] };

  const ux = d1x / len1;
  const uy = d1y / len1;

  // Project w2.start and w2.end onto line of w1
  const projS = projectPointOntoSegment(w2.start, w1.start, w1.end);
  const projE = projectPointOntoSegment(w2.end, w1.start, w1.end);

  if (projS.dist > 0.05 || projE.dist > 0.05) {
    return { isCollinear: false, overlaps: false, splitPoints: [] };
  }

  // Both endpoints of w2 are within 5cm of line of w1 => collinear!
  // Calculate 1D projection coordinates along line of w1
  const s1Start = 0;
  const s1End = len1;

  const s2Start = (w2.start.x - w1.start.x) * ux + (w2.start.y - w1.start.y) * uy;
  const s2End = (w2.end.x - w1.start.x) * ux + (w2.end.y - w1.start.y) * uy;

  const min2 = Math.min(s2Start, s2End);
  const max2 = Math.max(s2Start, s2End);

  // Overlap interval between [s1Start, s1End] and [min2, max2]
  const overlapStart = Math.max(s1Start, min2);
  const overlapEnd = Math.min(s1End, max2);

  const overlaps = overlapEnd - overlapStart > 0.05;

  const splitPoints: Point2D[] = [];
  if (overlaps) {
    if (min2 > 0.05 && min2 < len1 - 0.05) {
      splitPoints.push({
        x: roundCoord(w1.start.x + min2 * ux),
        y: roundCoord(w1.start.y + min2 * uy),
      });
    }
    if (max2 > 0.05 && max2 < len1 - 0.05) {
      splitPoints.push({
        x: roundCoord(w1.start.x + max2 * ux),
        y: roundCoord(w1.start.y + max2 * uy),
      });
    }
  }

  return { isCollinear: true, overlaps, splitPoints };
}

/**
 * Splits a single wall at a set of interior split points, maintaining openings and components.
 */
export function splitWallAtPoints(
  wall: Wall,
  points: Point2D[],
  components?: ElectricalComponent[],
  zones?: InstallationZone[]
): {
  subWalls: Wall[];
  updatedComponents: ElectricalComponent[];
  updatedZones: InstallationZone[];
} {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const wallLen = Math.hypot(dx, dy);

  if (wallLen < 0.1 || points.length === 0) {
    return {
      subWalls: [wall],
      updatedComponents: components || [],
      updatedZones: zones || [],
    };
  }

  // Calculate t for each point along wall
  const ratios: { t: number; pt: Point2D }[] = [];
  for (const pt of points) {
    const proj = projectPointOntoSegment(pt, wall.start, wall.end);
    // Ignore points too close to ends
    if (proj.t > 0.04 && proj.t < 0.96) {
      ratios.push({ t: proj.t, pt: proj.proj });
    }
  }

  // Sort ascending by t
  ratios.sort((a, b) => a.t - b.t);

  // Deduplicate points within 0.05m
  const uniqueRatios: { t: number; pt: Point2D }[] = [];
  for (const r of ratios) {
    if (
      uniqueRatios.length === 0 ||
      Math.abs(r.t - uniqueRatios[uniqueRatios.length - 1].t) * wallLen > 0.05
    ) {
      uniqueRatios.push(r);
    }
  }

  if (uniqueRatios.length === 0) {
    return {
      subWalls: [wall],
      updatedComponents: components || [],
      updatedZones: zones || [],
    };
  }

  // Build segments
  const allNodes: { t: number; pt: Point2D }[] = [
    { t: 0, pt: wall.start },
    ...uniqueRatios,
    { t: 1, pt: wall.end },
  ];

  const subWalls: Wall[] = [];
  const compList = components ? [...components] : [];
  const zoneList = zones ? [...zones] : [];

  for (let i = 0; i < allNodes.length - 1; i++) {
    const nStart = allNodes[i];
    const nEnd = allNodes[i + 1];
    const segLen = segmentLength(nStart.pt, nEnd.pt);
    if (segLen < 0.05) continue;

    const segId =
      i === 0
        ? wall.id
        : `w-${Date.now()}-${Math.floor(Math.random() * 10000)}-${i}`;

    // Filter and adjust openings for this segment
    const tMin = nStart.t;
    const tMax = nEnd.t;
    const segTDelta = tMax - tMin;

    const segOpenings: Opening[] = [];
    for (const op of wall.openings) {
      if (op.positionRatio >= tMin && op.positionRatio <= tMax) {
        const newRatio = Math.max(
          0.05,
          Math.min(0.95, (op.positionRatio - tMin) / segTDelta)
        );
        segOpenings.push({
          ...op,
          positionRatio: roundCoord(newRatio, 3),
        });
      }
    }

    subWalls.push({
      ...wall,
      id: segId,
      start: roundPoint(nStart.pt),
      end: roundPoint(nEnd.pt),
      openings: segOpenings,
    });

    // Reassign components that were on this wall
    if (compList.length > 0) {
      for (let cIdx = 0; cIdx < compList.length; cIdx++) {
        const c = compList[cIdx];
        if (c.wallId === wall.id) {
          const ratio = c.distanceAlongWallRatio;
          if (ratio !== undefined && ratio >= tMin && ratio <= tMax) {
            const newRatio = Math.max(
              0.02,
              Math.min(0.98, (ratio - tMin) / segTDelta)
            );
            compList[cIdx] = {
              ...c,
              wallId: segId,
              distanceAlongWallRatio: roundCoord(newRatio, 3),
            };
          } else if (ratio === undefined) {
            // Check distance of component point to segment
            const proj = projectPointOntoSegment(
              { x: c.position.x, y: c.position.y },
              nStart.pt,
              nEnd.pt
            );
            if (proj.dist < 0.3) {
              compList[cIdx] = {
                ...c,
                wallId: segId,
                distanceAlongWallRatio: roundCoord(proj.t, 3),
              };
            }
          }
        }
      }
    }

    // Duplicate installation zones on subwalls if any
    if (zoneList.length > 0 && i > 0) {
      const origZones = zoneList.filter((z) => z.wallId === wall.id);
      for (const oz of origZones) {
        zoneList.push({
          ...oz,
          id: `${oz.id}-sub-${i}`,
          wallId: segId,
        });
      }
    }
  }

  return {
    subWalls: subWalls.length > 0 ? subWalls : [wall],
    updatedComponents: compList,
    updatedZones: zoneList,
  };
}

export interface WallIntersectionResolutionResult {
  resolvedWalls: Wall[];
  resolvedComponents: ElectricalComponent[];
  resolvedZones: InstallationZone[];
  newJunctionNodes: Point2D[];
  lastWallId?: string;
}

/**
 * Resolves intersections, T-junctions, and collinear overlaps when adding or updating a wall.
 * Automatically snaps meeting points and splits both intersecting walls, creating shared junction nodes!
 */
export function resolveWallIntersections(
  candidateWall: Wall,
  existingWalls: Wall[],
  components?: ElectricalComponent[],
  zones?: InstallationZone[],
  snapDistance: number = 0.25
): WallIntersectionResolutionResult {
  let candStart = { ...candidateWall.start };
  let candEnd = { ...candidateWall.end };

  const newJunctionNodes: Point2D[] = [];

  // 1. T-JUNCTION SNAP: Check if candidate endpoints snap onto any existing wall body
  for (const w of existingWalls) {
    if (w.id === candidateWall.id) continue;

    // Start point snap to wall body
    const projStart = projectPointOntoSegment(candStart, w.start, w.end);
    if (projStart.dist <= snapDistance && projStart.isInterior) {
      candStart = { ...projStart.proj };
      newJunctionNodes.push(candStart);
    }

    // End point snap to wall body
    const projEnd = projectPointOntoSegment(candEnd, w.start, w.end);
    if (projEnd.dist <= snapDistance && projEnd.isInterior) {
      candEnd = { ...projEnd.proj };
      newJunctionNodes.push(candEnd);
    }
  }

  const updatedCandidate: Wall = {
    ...candidateWall,
    start: roundPoint(candStart),
    end: roundPoint(candEnd),
  };

  // 2. COLLECT SPLIT POINTS for candidate and all existing walls
  const candidateSplitPoints: Point2D[] = [];
  const existingSplitPoints = new Map<string, Point2D[]>();

  const otherWalls = existingWalls.filter((w) => w.id !== candidateWall.id);

  for (const w of otherWalls) {
    // A. Check segment-segment intersection (X-crossings)
    const isect = findSegmentIntersection(
      updatedCandidate.start,
      updatedCandidate.end,
      w.start,
      w.end
    );

    if (isect.intersect && isect.point) {
      const pt = roundPoint(isect.point);
      newJunctionNodes.push(pt);

      if (isect.isInterior1) {
        candidateSplitPoints.push(pt);
      }
      if (isect.isInterior2) {
        const cur = existingSplitPoints.get(w.id) || [];
        cur.push(pt);
        existingSplitPoints.set(w.id, cur);
      }
    }

    // B. Check T-junctions: does candidate endpoint touch existing wall body?
    const projCandStart = projectPointOntoSegment(updatedCandidate.start, w.start, w.end);
    if (projCandStart.dist < 0.03 && projCandStart.isInterior) {
      const cur = existingSplitPoints.get(w.id) || [];
      cur.push(updatedCandidate.start);
      existingSplitPoints.set(w.id, cur);
      newJunctionNodes.push(updatedCandidate.start);
    }

    const projCandEnd = projectPointOntoSegment(updatedCandidate.end, w.start, w.end);
    if (projCandEnd.dist < 0.03 && projCandEnd.isInterior) {
      const cur = existingSplitPoints.get(w.id) || [];
      cur.push(updatedCandidate.end);
      existingSplitPoints.set(w.id, cur);
      newJunctionNodes.push(updatedCandidate.end);
    }

    // C. Does existing wall endpoint touch candidate wall body?
    const projWStart = projectPointOntoSegment(w.start, updatedCandidate.start, updatedCandidate.end);
    if (projWStart.dist < 0.03 && projWStart.isInterior) {
      candidateSplitPoints.push(w.start);
      newJunctionNodes.push(w.start);
    }

    const projWEnd = projectPointOntoSegment(w.end, updatedCandidate.start, updatedCandidate.end);
    if (projWEnd.dist < 0.03 && projWEnd.isInterior) {
      candidateSplitPoints.push(w.end);
      newJunctionNodes.push(w.end);
    }

    // D. Collinear overlap
    const coll = checkCollinearOverlap(updatedCandidate, w);
    if (coll.overlaps && coll.splitPoints.length > 0) {
      for (const sp of coll.splitPoints) {
        candidateSplitPoints.push(sp);
        const cur = existingSplitPoints.get(w.id) || [];
        cur.push(sp);
        existingSplitPoints.set(w.id, cur);
        newJunctionNodes.push(sp);
      }
    }
  }

  // 3. EXECUTE SPLITS ON EXISTING WALLS
  let workingComponents = components ? [...components] : [];
  let workingZones = zones ? [...zones] : [];
  const finalExistingWalls: Wall[] = [];

  for (const w of otherWalls) {
    const pts = existingSplitPoints.get(w.id);
    if (pts && pts.length > 0) {
      const splitRes = splitWallAtPoints(w, pts, workingComponents, workingZones);
      finalExistingWalls.push(...splitRes.subWalls);
      workingComponents = splitRes.updatedComponents;
      workingZones = splitRes.updatedZones;
    } else {
      finalExistingWalls.push(w);
    }
  }

  // 4. EXECUTE SPLITS ON CANDIDATE WALL
  const candSplitRes = splitWallAtPoints(
    updatedCandidate,
    candidateSplitPoints,
    workingComponents,
    workingZones
  );
  const finalCandidateSegments = candSplitRes.subWalls;
  workingComponents = candSplitRes.updatedComponents;
  workingZones = candSplitRes.updatedZones;

  // 5. COMBINE AND CLEAN DUPLICATES
  const combinedWalls = [...finalExistingWalls, ...finalCandidateSegments];

  // Filter degenerate walls (< 0.06m)
  const validWalls: Wall[] = [];
  for (const w of combinedWalls) {
    const len = segmentLength(w.start, w.end);
    if (len >= 0.06) {
      validWalls.push(w);
    }
  }

  // Deduplicate overlapping collinear or exact identical walls
  const deduplicatedWalls: Wall[] = [];
  for (const w of validWalls) {
    let isDuplicate = false;
    for (const existing of deduplicatedWalls) {
      // Check identical endpoints (same or reversed)
      const sameDir =
        pointsEqual(w.start, existing.start, 0.04) &&
        pointsEqual(w.end, existing.end, 0.04);
      const revDir =
        pointsEqual(w.start, existing.end, 0.04) &&
        pointsEqual(w.end, existing.start, 0.04);

      if (sameDir || revDir) {
        isDuplicate = true;
        // Merge openings if needed
        for (const op of w.openings) {
          if (!existing.openings.some((eo) => eo.id === op.id)) {
            existing.openings.push(op);
          }
        }
        break;
      }
    }
    if (!isDuplicate) {
      deduplicatedWalls.push(w);
    }
  }

  // Deduplicate junction nodes
  const uniqueNodes: Point2D[] = [];
  for (const pt of newJunctionNodes) {
    if (!uniqueNodes.some((un) => pointsEqual(un, pt, 0.03))) {
      uniqueNodes.push(roundPoint(pt));
    }
  }

  const lastWallId =
    finalCandidateSegments.length > 0
      ? finalCandidateSegments[finalCandidateSegments.length - 1].id
      : candidateWall.id;

  return {
    resolvedWalls: deduplicatedWalls,
    resolvedComponents: workingComponents,
    resolvedZones: workingZones,
    newJunctionNodes: uniqueNodes,
    lastWallId,
  };
}

/**
 * Resolves all intersections, T-junctions, and overlaps in a floorplan.
 * Can be called after moving/dragging a wall or vertex.
 */
export function resolveAllFloorWallIntersections(floor: Floor): Floor {
  if (floor.walls.length <= 1) return floor;

  let currentWalls = [...floor.walls];
  let currentComponents = floor.components ? [...floor.components] : [];
  let currentZones = floor.installationZones ? [...floor.installationZones] : [];

  let hadSplits = true;
  let iterations = 0;
  const maxIterations = 5;

  while (hadSplits && iterations < maxIterations) {
    hadSplits = false;
    iterations++;

    for (let i = 0; i < currentWalls.length; i++) {
      const candidate = currentWalls[i];
      const otherWalls = currentWalls.filter((_, idx) => idx !== i);

      const res = resolveWallIntersections(
        candidate,
        otherWalls,
        currentComponents,
        currentZones,
        0.15
      );

      // Check if any split or topology change occurred
      if (
        res.resolvedWalls.length !== currentWalls.length ||
        res.newJunctionNodes.length > 0
      ) {
        currentWalls = res.resolvedWalls;
        currentComponents = res.resolvedComponents;
        currentZones = res.resolvedZones;
        hadSplits = true;
        break; // Restart loop with updated wall list
      }
    }
  }

  return {
    ...floor,
    walls: currentWalls,
    components: currentComponents,
    installationZones: currentZones,
  };
}

/**
 * Finds snap targets for cursor when drawing walls:
 * - Corner snap (existing wall endpoints)
 * - T-junction snap (projection onto existing wall body)
 * - Intersection snap (crossing between active segment and existing walls)
 */
export function findWallSnapCandidate(
  cursorWorld: Point2D,
  wallStart: Point2D | null,
  walls: Wall[],
  ignoreWallId?: string,
  scale: number = 30
): {
  snappedPt: Point2D;
  snapType: 'corner' | 'intersection' | 'wall_body' | null;
  targetWall?: Wall;
  label?: string;
} {
  const cornerDistLimit = Math.max(0.35, 20 / scale);
  const wallBodyDistLimit = Math.max(0.28, 16 / scale);

  // 1. High priority: Check existing corners / endpoints
  for (const w of walls) {
    if (ignoreWallId && w.id === ignoreWallId) continue;
    if (Math.hypot(cursorWorld.x - w.start.x, cursorWorld.y - w.start.y) < cornerDistLimit) {
      return {
        snappedPt: { x: w.start.x, y: w.start.y },
        snapType: 'corner',
        targetWall: w,
        label: 'Roh steny',
      };
    }
    if (Math.hypot(cursorWorld.x - w.end.x, cursorWorld.y - w.end.y) < cornerDistLimit) {
      return {
        snappedPt: { x: w.end.x, y: w.end.y },
        snapType: 'corner',
        targetWall: w,
        label: 'Roh steny',
      };
    }
  }

  // 2. High priority when drawing: Check intersection with existing walls if wallStart is active
  if (wallStart) {
    for (const w of walls) {
      if (ignoreWallId && w.id === ignoreWallId) continue;
      const isect = findSegmentIntersection(wallStart, cursorWorld, w.start, w.end);
      if (isect.intersect && isect.point) {
        // If cursor is close to intersection point
        if (Math.hypot(cursorWorld.x - isect.point.x, cursorWorld.y - isect.point.y) < cornerDistLimit) {
          return {
            snappedPt: isect.point,
            snapType: 'intersection',
            targetWall: w,
            label: 'Priesečník stien (kríženie)',
          };
        }
      }
    }
  }

  // 3. Medium priority: Snap to wall body (T-junction)
  let nearestWallSnap: {
    snappedPt: Point2D;
    snapType: 'wall_body';
    targetWall: Wall;
    label: string;
  } | null = null;
  let minWallDist = wallBodyDistLimit;

  for (const w of walls) {
    if (ignoreWallId && w.id === ignoreWallId) continue;
    const proj = projectPointOntoSegment(cursorWorld, w.start, w.end);
    if (proj.dist < minWallDist && proj.isInterior) {
      minWallDist = proj.dist;
      nearestWallSnap = {
        snappedPt: proj.proj,
        snapType: 'wall_body',
        targetWall: w,
        label: 'T-spoj (napojenie steny)',
      };
    }
  }

  if (nearestWallSnap) {
    return nearestWallSnap;
  }

  return {
    snappedPt: cursorWorld,
    snapType: null,
  };
}
