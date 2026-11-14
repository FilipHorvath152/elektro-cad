import * as pdfjsLib from 'pdfjs-dist';
import { Opening, Point2D, Room, Wall } from '../types/cad';

// Configure worker for browser environment
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();
}

export interface ExtractedDimension {
  text: string;
  valueMm: number;
  valueMeters: number;
  x: number;
  y: number;
}

export interface ParsedPDFResult {
  pageWidth: number;
  pageHeight: number;
  scaleMetersPerUnit: number;
  detectedScaleRatio: string; // e.g. "1:50" or "1:100"
  blueprintImageDataUrl: string;
  walls: Wall[];
  openings: Opening[];
  dimensions: ExtractedDimension[];
  detectedRooms: { name: string; x: number; y: number }[];
  summary: {
    wallsCount: number;
    doorsCount: number;
    windowsCount: number;
    dimensionsCount: number;
    roomsCount: number;
  };
}

export async function parsePDFPlan(file: File): Promise<ParsedPDFResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  // 1. Render to high-resolution canvas for Blueprint Underlay
  const viewport = page.getViewport({ scale: 2.0 }); // 2x resolution
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const renderContext = {
      canvasContext: ctx,
      viewport,
      canvas: canvas,
    };
    await page.render(renderContext).promise;
  }
  const blueprintImageDataUrl = canvas.toDataURL('image/png');

  // 2. Extract Text (Dimensions, Scale, Room Names)
  const textContent = await page.getTextContent();
  const extractedDimensions: ExtractedDimension[] = [];
  const detectedRooms: { name: string; x: number; y: number }[] = [];
  let detectedScaleRatio = '1:50';

  const roomKeywords = [
    'izba', 'obýv', 'kuchyn', 'kúpeľň', 'chodba', 'predsieň', 'wc', 'spálň',
    'detská', 'šatník', 'technick', 'garáž', 'terasa', 'zádverie', 'balkón',
    'living', 'kitchen', 'bath', 'hall', 'bed'
  ];

  textContent.items.forEach((item: any) => {
    const str = item.str.trim();
    if (!str) return;

    // Check scale notation (e.g. 1:50 or 1:100 or M 1:50)
    const scaleMatch = str.match(/1\s*:\s*(50|100|20|75|200)/);
    if (scaleMatch) {
      detectedScaleRatio = `1:${scaleMatch[1]}`;
    }

    // Check numeric dimensions (in mm, e.g. 900, 1 200, 3 500, 4200)
    const cleanNumStr = str.replace(/\s+/g, '');
    const num = parseInt(cleanNumStr, 10);
    if (!isNaN(num) && num >= 600 && num <= 15000 && /^\d+$/.test(cleanNumStr)) {
      extractedDimensions.push({
        text: str,
        valueMm: num,
        valueMeters: Number((num / 1000).toFixed(2)),
        x: item.transform[4] / 2, // scale back to 1x
        y: (viewport.height - item.transform[5]) / 2,
      });
    }

    // Check room names
    const lower = str.toLowerCase();
    if (roomKeywords.some((kw) => lower.includes(kw))) {
      detectedRooms.push({
        name: str,
        x: item.transform[4] / 2,
        y: (viewport.height - item.transform[5]) / 2,
      });
    }
  });

  // 3. Extract Vector Paths / Wall Lines
  const opList = await page.getOperatorList();
  const rawSegments: { x1: number; y1: number; x2: number; y2: number }[] = [];

  // Parse path operators
  let currentX = 0;
  let currentY = 0;

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];
    const args = opList.argsArray[i];

    if (fn === pdfjsLib.OPS.constructPath) {
      const ops = args[0];
      const coords = args[1];
      let cIdx = 0;

      for (let o = 0; o < ops.length; o++) {
        const op = ops[o];
        if (op === pdfjsLib.OPS.moveTo) {
          currentX = coords[cIdx++] / 2;
          currentY = (viewport.height - coords[cIdx++]) / 2;
        } else if (op === pdfjsLib.OPS.lineTo) {
          const nextX = coords[cIdx++] / 2;
          const nextY = (viewport.height - coords[cIdx++]) / 2;

          // Only keep lines with meaningful length
          const dist = Math.hypot(nextX - currentX, nextY - currentY);
          if (dist > 15) {
            rawSegments.push({ x1: currentX, y1: currentY, x2: nextX, y2: nextY });
          }
          currentX = nextX;
          currentY = nextY;
        } else if (op === pdfjsLib.OPS.rectangle) {
          const rx = coords[cIdx++] / 2;
          const ry = (viewport.height - coords[cIdx++]) / 2;
          const rw = coords[cIdx++] / 2;
          const rh = coords[cIdx++] / 2;

          // If it's a long strip, it might be a wall or door opening
          if (rw > 30 || Math.abs(rh) > 30) {
            rawSegments.push({ x1: rx, y1: ry, x2: rx + rw, y2: ry });
            rawSegments.push({ x1: rx + rw, y1: ry, x2: rx + rw, y2: ry - rh });
            rawSegments.push({ x1: rx + rw, y1: ry - rh, x2: rx, y2: ry - rh });
            rawSegments.push({ x1: rx, y1: ry - rh, x2: rx, y2: ry });
          }
        }
      }
    }
  }

  // Calculate default scale: 1 meter = 40 pixels (for standard 1:50 / 1:100 A4/A3 architectural drawing)
  // If we found dimension text like 3500 mm near a line, we calibrate precisely
  let scaleMetersPerUnit = 0.025; // 40 units = 1 meter
  if (extractedDimensions.length > 0 && rawSegments.length > 0) {
    // Find closest segment to dimension
    for (const dim of extractedDimensions) {
      if (dim.valueMeters >= 2.0 && dim.valueMeters <= 8.0) {
        const matchingSeg = rawSegments.find((seg) => {
          const len = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
          const midX = (seg.x1 + seg.x2) / 2;
          const midY = (seg.y1 + seg.y2) / 2;
          return Math.hypot(dim.x - midX, dim.y - midY) < 60 && len > 50;
        });

        if (matchingSeg) {
          const segPixelLen = Math.hypot(matchingSeg.x2 - matchingSeg.x1, matchingSeg.y2 - matchingSeg.y1);
          scaleMetersPerUnit = dim.valueMeters / segPixelLen;
          break;
        }
      }
    }
  }

  // 4. Group & Simplify Segments into CAD Walls
  const walls: Wall[] = [];
  const openings: Opening[] = [];

  // Filter dominant lines (horizontal and vertical walls)
  const minWallLengthPixels = 40;
  const filteredSegments = rawSegments.filter((seg) => {
    const len = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
    const angle = Math.abs((Math.atan2(seg.y2 - seg.y1, seg.x2 - seg.x1) * 180) / Math.PI);
    const isOrthogonal = angle < 10 || Math.abs(angle - 90) < 10 || Math.abs(angle - 180) < 10;
    return len >= minWallLengthPixels && isOrthogonal;
  });

  // Convert pixels to meters and normalize origin
  const minX = Math.min(...filteredSegments.map((s) => Math.min(s.x1, s.x2)), 0);
  const minY = Math.min(...filteredSegments.map((s) => Math.min(s.y1, s.y2)), 0);

  // Group parallel lines within 15-40cm into single walls with thickness
  const processedIndices = new Set<number>();

  filteredSegments.slice(0, 40).forEach((seg, idx) => {
    if (processedIndices.has(idx)) return;
    processedIndices.add(idx);

    const x1 = Number(((seg.x1 - minX) * scaleMetersPerUnit).toFixed(2));
    const y1 = Number(((seg.y1 - minY) * scaleMetersPerUnit).toFixed(2));
    const x2 = Number(((seg.x2 - minX) * scaleMetersPerUnit).toFixed(2));
    const y2 = Number(((seg.y2 - minY) * scaleMetersPerUnit).toFixed(2));

    const wallLength = Math.hypot(x2 - x1, y2 - y1);
    if (wallLength < 0.6) return; // Skip tiny fragments

    const wallOpenings: Opening[] = [];

    // Check if there are door dimensions (e.g. 800, 900) along this wall
    extractedDimensions.forEach((dim) => {
      if ((dim.valueMm >= 700 && dim.valueMm <= 1000) || dim.text.includes('/')) {
        // Candidate door
        const dimWorldX = (dim.x - minX) * scaleMetersPerUnit;
        const dimWorldY = (dim.y - minY) * scaleMetersPerUnit;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const t = ((dimWorldX - x1) * dx + (dimWorldY - y1) * dy) / (wallLength * wallLength);

        if (t > 0.15 && t < 0.85) {
          const projX = x1 + t * dx;
          const projY = y1 + t * dy;
          if (Math.hypot(dimWorldX - projX, dimWorldY - projY) < 0.8) {
            const doorOpening: Opening = {
              id: `op-pdf-door-${Date.now()}-${dim.valueMm}`,
              type: 'door',
              positionRatio: Number(t.toFixed(2)),
              width: Number((dim.valueMm / 1000).toFixed(2)) || 0.9,
              height: 2.0,
              elevation: 0,
            };
            wallOpenings.push(doorOpening);
            openings.push(doorOpening);
          }
        }
      } else if (dim.valueMm >= 1100 && dim.valueMm <= 2500) {
        // Candidate window
        const dimWorldX = (dim.x - minX) * scaleMetersPerUnit;
        const dimWorldY = (dim.y - minY) * scaleMetersPerUnit;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const t = ((dimWorldX - x1) * dx + (dimWorldY - y1) * dy) / (wallLength * wallLength);

        if (t > 0.15 && t < 0.85) {
          const projX = x1 + t * dx;
          const projY = y1 + t * dy;
          if (Math.hypot(dimWorldX - projX, dimWorldY - projY) < 0.8) {
            const windowOpening: Opening = {
              id: `op-pdf-win-${Date.now()}-${dim.valueMm}`,
              type: 'window',
              positionRatio: Number(t.toFixed(2)),
              width: Number((dim.valueMm / 1000).toFixed(2)) || 1.4,
              height: 1.4,
              elevation: 0.9,
            };
            wallOpenings.push(windowOpening);
            openings.push(windowOpening);
          }
        }
      }
    });

    walls.push({
      id: `w-pdf-${idx}-${Date.now()}`,
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: wallLength > 6.0 ? 0.30 : 0.15, // Bearing vs Partition
      height: 2.70,
      openings: wallOpenings,
    });
  });

  return {
    pageWidth: viewport.width / 2,
    pageHeight: viewport.height / 2,
    scaleMetersPerUnit,
    detectedScaleRatio,
    blueprintImageDataUrl,
    walls,
    openings,
    dimensions: extractedDimensions,
    detectedRooms,
    summary: {
      wallsCount: walls.length,
      doorsCount: openings.filter((o) => o.type === 'door').length,
      windowsCount: openings.filter((o) => o.type === 'window').length,
      dimensionsCount: extractedDimensions.length,
      roomsCount: detectedRooms.length,
    },
  };
}
