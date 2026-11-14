import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Floor } from '../types/cad';
import { Compass, Target } from 'lucide-react';

interface CADViewer3DProps {
  floor: Floor;
  selectedComponentId?: string;
  onSelectComponent: (id?: string) => void;
  onSwitchTo2D?: () => void;
}

export const CADViewer3D: React.FC<CADViewer3DProps> = ({
  floor,
  selectedComponentId,
  onSwitchTo2D,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const resetCameraRef = useRef<() => void>(() => {});
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0b0f19);
    scene.fog = new THREE.FogExp2(0x0b0f19, 0.035);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(5, 9, 13);
    camera.lookAt(4.5, 1, 3);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(10, 18, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const blueLight = new THREE.PointLight(0x0284c7, 1.5, 15);
    blueLight.position.set(4, 3, 3);
    scene.add(blueLight);

    // 5. Floor Plane & Grid
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.8,
      metalness: 0.1,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const grid = new THREE.GridHelper(30, 30, 0x0284c7, 0x1e293b);
    grid.position.y = 0.01;
    scene.add(grid);

    // 6. Build 3D Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
      metalness: 0.1,
    });

    floor.walls.forEach((wall) => {
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const wallLen = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const midX = (wall.start.x + wall.end.x) / 2;
      const midZ = (wall.start.y + wall.end.y) / 2;
      const ux = wallLen > 0.0001 ? dx / wallLen : 0;
      const uy = wallLen > 0.0001 ? dy / wallLen : 0;
      const wallTotalHeight = wall.height || floor.height || 2.70;

      // 6a. Check for Attic Sloped Wall / Roof Slope (Šikmina podkrovia)
      if (wall.atticSlope?.enabled) {
        const attic = wall.atticSlope;
        if (attic.type === 'gable_slope') {
          // GABLE SLOPED WALL (Štítová stena): Trapeze profile along wall length
          const hStart = Math.max(0.2, attic.startHeight ?? 1.0);
          const hEnd = Math.max(0.2, attic.endHeight ?? (wall.height || floor.height || 2.70));

          const shape = new THREE.Shape();
          shape.moveTo(-wallLen / 2, 0);
          shape.lineTo(wallLen / 2, 0);
          shape.lineTo(wallLen / 2, hEnd);
          shape.lineTo(-wallLen / 2, hStart);
          shape.closePath();

          const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
            depth: wall.thickness,
            bevelEnabled: false,
          });
          extrudeGeo.translate(0, 0, -wall.thickness / 2);

          const gableMesh = new THREE.Mesh(extrudeGeo, wallMat);
          gableMesh.position.set(midX, 0, midZ);
          gableMesh.rotation.y = -angle;
          gableMesh.castShadow = true;
          gableMesh.receiveShadow = true;
          scene.add(gableMesh);
        } else {
          // KNEE WALL + ROOF / CEILING SLOPE (Podmurovka 1m + šikmina strechy)
          const kneeHeight = Math.max(0.2, attic.kneeWallHeight || 1.0);
          const ceilingH = Math.max(kneeHeight + 0.3, attic.ceilingHeight || wall.height || floor.height || 2.60);
          const deltaH = ceilingH - kneeHeight;
          const roofAngleRad = ((attic.roofAngleDeg || 38) * Math.PI) / 180;

          // Slope horizontal depth into room
          const slopeDepth = attic.slopeDepth || Math.max(0.4, deltaH / Math.tan(roofAngleRad));
          const slopeSpan = Math.hypot(slopeDepth, deltaH);
          const actualAngleRad = Math.atan2(deltaH, slopeDepth);

          // Direction: -1 (right) or 1 (left) relative to wall vector
          const dirSign = attic.slopeDirection === 'right' ? -1 : 1;

          const wallGroup = new THREE.Group();
          wallGroup.position.set(midX, 0, midZ);
          wallGroup.rotation.y = -angle;

          // 1. Zvislá podmurovka (Vertical knee wall e.g. 1.0m)
          const kneeBoxGeo = new THREE.BoxGeometry(wallLen, kneeHeight, wall.thickness);
          const kneeMesh = new THREE.Mesh(kneeBoxGeo, wallMat);
          kneeMesh.position.set(0, kneeHeight / 2, 0);
          kneeMesh.castShadow = true;
          kneeMesh.receiveShadow = true;
          wallGroup.add(kneeMesh);

          // 2. Šikmina strechy / stropu (Sloped roof / ceiling slab)
          const roofSlabThick = 0.16;
          const roofMat = new THREE.MeshStandardMaterial({
            color: 0x475569, // drywall ceiling finish
            roughness: 0.85,
            metalness: 0.05,
          });
          const roofSlabGeo = new THREE.BoxGeometry(wallLen, roofSlabThick, slopeSpan);
          const roofMesh = new THREE.Mesh(roofSlabGeo, roofMat);

          roofMesh.position.set(
            0,
            kneeHeight + deltaH / 2,
            dirSign * (slopeDepth / 2)
          );
          roofMesh.rotation.x = dirSign * -actualAngleRad;
          roofMesh.castShadow = true;
          roofMesh.receiveShadow = true;
          wallGroup.add(roofMesh);

          // 3. Stropný preklad / spoj s vodorovným stropom (Ceiling beam connection)
          const collarGeo = new THREE.BoxGeometry(wallLen, 0.06, 0.35);
          const collarMesh = new THREE.Mesh(collarGeo, roofMat);
          collarMesh.position.set(
            0,
            ceilingH - 0.03,
            dirSign * (slopeDepth + 0.17)
          );
          collarMesh.castShadow = true;
          wallGroup.add(collarMesh);

          scene.add(wallGroup);
        }
      } else {
        // Regular vertical wall
        const wallHeight = wall.height || floor.height || 2.70;
        const wallBoxGeo = new THREE.BoxGeometry(wallLen, wallHeight, wall.thickness);
        const wallMesh = new THREE.Mesh(wallBoxGeo, wallMat);

        wallMesh.position.set(midX, wallHeight / 2, midZ);
        wallMesh.rotation.y = -angle;
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        scene.add(wallMesh);
      }

      // 3D STN Installation Zones on Wall (Rendered with exact sub-segment length and position)
      const wallZones = floor.installationZones?.filter((z) => z.wallId === wall.id) || [];
      if (wallZones.length > 0) {
        wallZones.forEach((z) => {
          const sDist = Math.max(0, Math.min(wallLen - 0.1, z.distanceFromStartMeters ?? 0));
          const zLen = Math.max(0.1, Math.min(wallLen - sDist, z.lengthMeters ?? (wallLen - sDist)));
          const centerDist = sDist + zLen / 2;
          const zCenterX = wall.start.x + ux * centerDist;
          const zCenterZ = wall.start.y + uy * centerDist;
          const zHeight = Math.max(0.1, z.elevationTopMeters - z.elevationBottomMeters);
          const zCenterY = z.elevationBottomMeters + zHeight / 2;

          let colorHex = 0x38bdf8;
          let opacity = 0.14;
          if (z.type === 'zvs') {
            colorHex = 0xf59e0b;
            opacity = 0.25;
          } else if (z.type === 'zvd') {
            colorHex = 0x2dd4bf;
            opacity = 0.14;
          } else if (z.type === 'zvz' || z.type === 'zvr') {
            colorHex = 0x34d399;
            opacity = 0.18;
          }

          const zoneGeo = new THREE.BoxGeometry(zLen, zHeight, wall.thickness + 0.015);
          const zoneMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity });
          const zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
          zoneMesh.position.set(zCenterX, zCenterY, zCenterZ);
          zoneMesh.rotation.y = -angle;
          scene.add(zoneMesh);
        });
      } else {
        // Fallback default guides for wall if no explicit zones generated yet
        const zvdGeo = new THREE.BoxGeometry(wallLen, 0.30, wall.thickness + 0.01);
        const zvdMat = new THREE.MeshBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.10 });
        const zvdMesh = new THREE.Mesh(zvdGeo, zvdMat);
        zvdMesh.position.set(midX, 0.30, midZ);
        zvdMesh.rotation.y = -angle;
        scene.add(zvdMesh);

        const zvhGeo = new THREE.BoxGeometry(wallLen, 0.30, wall.thickness + 0.01);
        const zvhMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.10 });
        const zvhMesh = new THREE.Mesh(zvhGeo, zvhMat);
        zvhMesh.position.set(midX, Math.max(0.4, wallTotalHeight - 0.30), midZ);
        zvhMesh.rotation.y = -angle;
        scene.add(zvhMesh);
      }

      // Openings (door & window cuts visual markers)
      wall.openings.forEach((op) => {
        const opX = wall.start.x + op.positionRatio * dx;
        const opZ = wall.start.y + op.positionRatio * dy;
        const opColor = op.type === 'door' ? 0xf8fafc : 0x38bdf8;
        const opGeo = new THREE.BoxGeometry(op.width, op.height, wall.thickness + 0.05);
        const opMat = new THREE.MeshBasicMaterial({ color: opColor, transparent: true, opacity: 0.4 });
        const opMesh = new THREE.Mesh(opGeo, opMat);
        opMesh.position.set(opX, op.elevation + op.height / 2, opZ);
        opMesh.rotation.y = -angle;
        scene.add(opMesh);

        // In 3D: If door, also render the open door leaf swung in the correct direction!
        if (op.type === 'door') {
          const isRightHinge = op.swingDirection === 'right';
          const isOpeningOut = op.swingSide === 'right';
          const sideSign = isOpeningOut ? 1 : -1;
          const hingeLocalX = (isRightHinge ? 1 : -1) * (op.width / 2);
          const leafThick = 0.04;

          const doorGroup = new THREE.Group();
          doorGroup.position.set(opX, 0, opZ);
          doorGroup.rotation.y = -angle;

          const leafGeo = new THREE.BoxGeometry(leafThick, op.height, op.width);
          const leafMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.6,
            metalness: 0.1,
          });
          const leafMesh = new THREE.Mesh(leafGeo, leafMat);
          leafMesh.position.set(hingeLocalX, op.elevation + op.height / 2, sideSign * (op.width / 2));
          leafMesh.castShadow = true;
          doorGroup.add(leafMesh);

          scene.add(doorGroup);
        }
      });
    });

    // 7. Helper functions for realistic 3D Switchboards (STN EN 61439)
    const createSwitchboardFaceTexture = (name: string, isSub: boolean, modules: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 768;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Background enclosure panel (biela / svetlosivá RAL 9010)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 512, 768);

      // Outer metal border
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, 498, 754);

      // Door recess
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(28, 28, 456, 712);

      // Top header badge
      const headerColor = isSub ? '#2563eb' : '#dc2626';
      ctx.fillStyle = headerColor;
      ctx.fillRect(28, 28, 456, 110);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isSub ? '⚡ PODRUŽNÝ ROZVÁDZAČ RP' : '⚡ HLAVNÝ ROZVÁDZAČ RH', 256, 68);

      // Subtitle
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`${name} • ${modules}M DIN • 3x400/230V`, 256, 112);

      // Rows of DIN devices
      const rows = isSub ? 2 : 3;
      const startY = 160;
      const rowSpacing = isSub ? 240 : 160;

      for (let r = 0; r < rows; r++) {
        const y = startY + r * rowSpacing;

        // DIN Rail
        ctx.fillStyle = '#475569';
        ctx.fillRect(40, y + 45, 432, 14);

        // Module row body
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(48, y, 416, 105);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(48, y, 416, 105);

        // Draw individual DIN modules (12 modules per row)
        const modWidth = 416 / 12;
        for (let m = 0; m < 12; m++) {
          const mx = 48 + m * modWidth;
          ctx.beginPath();
          ctx.moveTo(mx, y);
          ctx.lineTo(mx, y + 105);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Module toggle lever / switch
          const isSpecial = r === 0 && m < 4;
          ctx.fillStyle = isSpecial ? (isSub ? '#2563eb' : '#dc2626') : '#0284c7';
          ctx.fillRect(mx + 6, y + 35, modWidth - 12, 35);

          // Status indicator window
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(mx + modWidth / 2 - 4, y + 15, 8, 8);
        }
      }

      // Bottom Status Bar & LEDs
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(28, 680, 456, 60);

      const phases = ['L1 230V', 'L2 230V', 'L3 230V'];
      phases.forEach((p, idx) => {
        const px = 110 + idx * 145;
        const py = 710;

        ctx.beginPath();
        ctx.arc(px - 35, py, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#22c55e';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(p, px - 20, py);
      });

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };

    const createSwitchboardLabelSprite = (text: string, isSub: boolean) => {
      const canvas = document.createElement('canvas');
      canvas.width = 384;
      canvas.height = 96;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.fillStyle = isSub ? 'rgba(30, 58, 138, 0.95)' : 'rgba(153, 27, 27, 0.95)';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(8, 8, 368, 80, 18) : ctx.fillRect(8, 8, 368, 80);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 192, 48);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        depthTest: false,
        transparent: true,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(1.4, 0.35, 1);
      sprite.renderOrder = 999;
      return sprite;
    };

    // 8. Gather all Switchboards to ensure they are 100% visible in 3D
    const switchboardItems: Array<{
      id: string;
      label: string;
      position: { x: number; y: number; z: number };
      rotation: number;
      wallId?: string;
      isSub: boolean;
      isSelected: boolean;
    }> = [];

    // From floor.components
    floor.components.forEach((c) => {
      if (c.type === 'switchboard') {
        const isSub = c.switchboardKind === 'sub' || c.notes === 'RP' || c.label.includes('RP');
        switchboardItems.push({
          id: c.id,
          label: c.label || (isSub ? 'Podružný rozvádzač RP' : 'Hlavný rozvádzač RH'),
          position: c.position,
          rotation: c.rotation,
          wallId: c.wallId,
          isSub,
          isSelected: c.id === selectedComponentId,
        });
      }
    });

    // From floor.switchboards (ensure initial and unlinked switchboards are always rendered)
    floor.switchboards.forEach((sb) => {
      const alreadyAdded = switchboardItems.some(
        (it) => Math.hypot(it.position.x - sb.position.x, it.position.y - sb.position.y) < 0.5
      );
      if (!alreadyAdded) {
        const isSub = sb.name.includes('RP');
        switchboardItems.push({
          id: sb.id,
          label: sb.name || (isSub ? 'Podružný rozvádzač RP' : 'Hlavný rozvádzač RH'),
          position: sb.position,
          rotation: 0,
          isSub,
          isSelected: false,
        });
      }
    });

    // Build 3D Switchboards with realistic enclosure, front door & floating 3D labels
    switchboardItems.forEach((sb) => {
      const sbWidth = sb.isSub ? 0.38 : 0.46;
      const sbHeight = sb.isSub ? 0.52 : 0.72;

      // Find wall if attached or near
      const wall = sb.wallId
        ? floor.walls.find((w) => w.id === sb.wallId)
        : floor.walls.find((w) => {
            const dx = w.end.x - w.start.x;
            const dy = w.end.y - w.start.y;
            const l2 = dx * dx + dy * dy;
            if (l2 === 0) return false;
            const t = Math.max(0, Math.min(1, ((sb.position.x - w.start.x) * dx + (sb.position.y - w.start.y) * dy) / l2));
            const px = w.start.x + t * dx;
            const py = w.start.y + t * dy;
            return Math.hypot(sb.position.x - px, sb.position.y - py) < 0.35;
          });

      const wallThick = wall ? wall.thickness : 0.15;
      // Protrudes beyond the wall thickness on BOTH sides so it is NEVER buried inside the wall
      const sbDepth = wallThick + 0.10;

      let rotY = 0;
      let posX = sb.position.x;
      let posY = sb.position.z || 1.50;
      let posZ = sb.position.y;

      if (wall) {
        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const wallAngle = Math.atan2(dy, dx);
        rotY = -wallAngle;
      }

      const sbGroup = new THREE.Group();

      // Enclosure body
      const bodyGeo = new THREE.BoxGeometry(sbWidth, sbHeight, sbDepth);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: sb.isSelected ? 0xec4899 : 0xf1f5f9,
        roughness: 0.35,
        metalness: 0.2,
        emissive: sb.isSelected ? 0xec4899 : (sb.isSub ? 0x1e3a8a : 0x7f1d1d),
        emissiveIntensity: sb.isSelected ? 0.4 : 0.15,
      });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      sbGroup.add(bodyMesh);

      // Detailed front face with STN EN 61439 Texture
      const faceTex = createSwitchboardFaceTexture(sb.label, sb.isSub, sb.isSub ? 24 : 36);
      if (faceTex) {
        const faceGeo = new THREE.PlaneGeometry(sbWidth - 0.02, sbHeight - 0.02);
        const faceMat = new THREE.MeshBasicMaterial({ map: faceTex });

        // Front door
        const frontDoorMesh = new THREE.Mesh(faceGeo, faceMat);
        frontDoorMesh.position.z = sbDepth / 2 + 0.002;
        sbGroup.add(frontDoorMesh);

        // Rear door (ensures visibility from the adjacent room)
        const rearDoorMesh = new THREE.Mesh(faceGeo, faceMat);
        rearDoorMesh.rotation.y = Math.PI;
        rearDoorMesh.position.z = -(sbDepth / 2 + 0.002);
        sbGroup.add(rearDoorMesh);
      }

      // Floating 3D camera-facing label badge above switchboard
      const badgeText = sb.isSub ? `⚡ ${sb.label} (1.50m)` : `⚡ ${sb.label} (1.50m)`;
      const sprite = createSwitchboardLabelSprite(badgeText, sb.isSub);
      if (sprite) {
        sprite.position.set(0, sbHeight / 2 + 0.32, 0);
        sbGroup.add(sprite);
      }

      sbGroup.position.set(posX, posY, posZ);
      sbGroup.rotation.y = rotY;
      scene.add(sbGroup);
    });

    // 9. Build other electrical components (sockets, switches, lights, appliances)
    floor.components.forEach((comp) => {
      if (comp.type === 'switchboard') return; // Rendered above!

      const isSelected = comp.id === selectedComponentId;
      const isShelly = Boolean(comp.smartModule);

      let color = 0x38bdf8;
      const isLight = comp.type.startsWith('light_');

      if (isShelly) color = 0x10b981;
      else if (comp.type.startsWith('switch_')) color = 0xf59e0b;
      else if (isLight) color = 0xfef08a; // warm luminous white/yellow for lights
      else if (comp.type === 'boiler' || comp.type === 'water_pump' || comp.type === 'electric_heating' || comp.type === 'heat_pump') color = 0xf97316;

      if (isSelected) color = 0xec4899;

      let posX = comp.position.x;
      let posY = comp.position.z;
      let posZ = comp.position.y;
      let rotY = (comp.rotation * Math.PI) / 180;

      const compWall = comp.wallId ? floor.walls.find((w) => w.id === comp.wallId) : null;
      if (compWall) {
        const dx = compWall.end.x - compWall.start.x;
        const dy = compWall.end.y - compWall.start.y;
        const wallAngle = Math.atan2(dy, dx);
        rotY = -wallAngle;

        // Offset slightly out of the wall centerline to surface
        const nx = -Math.sin(wallAngle);
        const nz = Math.cos(wallAngle);
        const halfThick = compWall.thickness / 2;
        posX += nx * (halfThick + 0.02);
        posZ += nz * (halfThick + 0.02);
      }

      // Specialized 3D geometries for different lighting types
      let compMesh: THREE.Object3D;
      const compMat = new THREE.MeshStandardMaterial({
        color,
        emissive: isSelected ? 0xec4899 : isLight ? 0xfacc15 : color,
        emissiveIntensity: isSelected ? 0.7 : isLight ? 0.85 : 0.2,
        roughness: isLight ? 0.2 : 0.5,
      });

      if (comp.type === 'light_ceiling') {
        // Round ceiling luminaire disc
        const geo = new THREE.CylinderGeometry(0.20, 0.20, 0.04, 24);
        compMesh = new THREE.Mesh(geo, compMat);
      } else if (comp.type === 'light_spotlight') {
        // Compact recessed downlight
        const geo = new THREE.CylinderGeometry(0.065, 0.065, 0.025, 16);
        compMesh = new THREE.Mesh(geo, compMat);
      } else if (comp.type === 'light_chandelier') {
        // Pendant chandelier with suspension wire and decorative body
        const group = new THREE.Group();
        const wireGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.45, 8);
        const wireMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
        const wire = new THREE.Mesh(wireGeo, wireMat);
        wire.position.y = 0.225;
        group.add(wire);

        const bodyGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.12, 16);
        const body = new THREE.Mesh(bodyGeo, compMat);
        group.add(body);
        compMesh = group;
      } else if (comp.type === 'light_wall') {
        // Wall sconce
        const geo = new THREE.CylinderGeometry(0.06, 0.06, 0.18, 16);
        compMesh = new THREE.Mesh(geo, compMat);
      } else if (comp.type === 'light_led_strip') {
        // Linear architectural LED profile
        const geo = new THREE.BoxGeometry(1.20, 0.03, 0.03);
        compMesh = new THREE.Mesh(geo, compMat);
      } else if (comp.type === 'light_kitchen_under') {
        // Under-cabinet kitchen strip
        const geo = new THREE.BoxGeometry(0.80, 0.025, 0.04);
        compMesh = new THREE.Mesh(geo, compMat);
      } else if (comp.type === 'light_outdoor') {
        // Anthracite IP65 outdoor wall luminaire
        const geo = new THREE.BoxGeometry(0.10, 0.18, 0.09);
        const outdoorMat = new THREE.MeshStandardMaterial({
          color: isSelected ? 0xec4899 : 0x334155,
          emissive: isSelected ? 0xec4899 : 0xfbbf24,
          emissiveIntensity: isSelected ? 0.7 : 0.6,
        });
        compMesh = new THREE.Mesh(geo, outdoorMat);
      } else if (comp.type === 'light_bathroom') {
        // Sleek mirror light bar
        const geo = new THREE.BoxGeometry(0.55, 0.04, 0.05);
        compMesh = new THREE.Mesh(geo, compMat);
      } else if (comp.type === 'light_night_orientation') {
        // Low step light
        const geo = new THREE.BoxGeometry(0.08, 0.08, 0.025);
        compMesh = new THREE.Mesh(geo, compMat);
      } else {
        const size = 0.12;
        const height = 0.12;
        const depth = 0.08;
        const compGeo = new THREE.BoxGeometry(size, height, depth);
        compMesh = new THREE.Mesh(compGeo, compMat);
      }

      compMesh.position.set(posX, posY, posZ);
      compMesh.rotation.y = rotY;
      compMesh.castShadow = true;
      scene.add(compMesh);

      // 3D Cable Routes to Closest Switchboard
      if (switchboardItems.length > 0) {
        const targetSb = switchboardItems.reduce((closest, curr) => {
          const dCurr = Math.hypot(curr.position.x - comp.position.x, curr.position.y - comp.position.y);
          const dClosest = Math.hypot(closest.position.x - comp.position.x, closest.position.y - comp.position.y);
          return dCurr < dClosest ? curr : closest;
        }, switchboardItems[0]);

        const pathPoints: THREE.Vector3[] = [];
        const startX = comp.position.x;
        const startY = comp.position.z;
        const startZ = comp.position.y;

        const targetX = targetSb.position.x;
        const targetY = targetSb.position.z || 1.50;
        const targetZ = targetSb.position.y;

        pathPoints.push(new THREE.Vector3(startX, startY, startZ));

        if (comp.pathwayPreference === 'floor') {
          pathPoints.push(new THREE.Vector3(startX, 0.05, startZ));
          pathPoints.push(new THREE.Vector3(targetX, 0.05, startZ));
          pathPoints.push(new THREE.Vector3(targetX, 0.05, targetZ));
          pathPoints.push(new THREE.Vector3(targetX, targetY - 0.2, targetZ));
        } else if (comp.pathwayPreference === 'ceiling') {
          const ceilY = floor.height - 0.15;
          pathPoints.push(new THREE.Vector3(startX, ceilY, startZ));
          pathPoints.push(new THREE.Vector3(targetX, ceilY, startZ));
          pathPoints.push(new THREE.Vector3(targetX, ceilY, targetZ));
          pathPoints.push(new THREE.Vector3(targetX, targetY + 0.2, targetZ));
        } else {
          const zoneY = comp.position.z > 1.4 ? floor.height - 0.3 : 0.3;
          pathPoints.push(new THREE.Vector3(startX, zoneY, startZ));
          pathPoints.push(new THREE.Vector3(targetX, zoneY, startZ));
          pathPoints.push(new THREE.Vector3(targetX, zoneY, targetZ));
          pathPoints.push(new THREE.Vector3(targetX, targetY, targetZ));
        }

        const lineGeo = new THREE.BufferGeometry().setFromPoints(pathPoints);
        const lineMat = new THREE.LineBasicMaterial({
          color: comp.pathwayPreference === 'floor' ? 0x38bdf8 : comp.pathwayPreference === 'ceiling' ? 0xfbbf24 : 0x10b981,
          linewidth: 2,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        scene.add(line);
      }
    });

    // 9. CAD & SOLIDWORKS 3D CONTROLS:
    // - Pravé tlačidlo (RMB) = Posun stredu pohľadu (Pan camera target)
    // - Ľavé tlačidlo (LMB) / Stredné (MMB) = Otáčanie okolo stredu (Orbit)
    // - Koliesko = Priblíženie / Oddialenie (Zoom)
    let isMouseDown = false;
    let isPanMode = false;
    let prevMousePos = { x: 0, y: 0 };

    // Automatický výpočet geometrického stredu podlažia zo stien
    let defaultCenterX = 4.5;
    let defaultCenterY = floor.height / 2;
    let defaultCenterZ = 3.0;

    if (floor.walls.length > 0) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minZ = Infinity;
      let maxZ = -Infinity;
      floor.walls.forEach((w) => {
        minX = Math.min(minX, w.start.x, w.end.x);
        maxX = Math.max(maxX, w.start.x, w.end.x);
        minZ = Math.min(minZ, w.start.y, w.end.y);
        maxZ = Math.max(maxZ, w.start.y, w.end.y);
      });
      if (Number.isFinite(minX) && Number.isFinite(maxX)) {
        defaultCenterX = (minX + maxX) / 2;
        defaultCenterZ = (minZ + maxZ) / 2;
      }
    }

    const initialTarget = new THREE.Vector3(defaultCenterX, defaultCenterY, defaultCenterZ);
    const cameraTarget = initialTarget.clone();
    const spherical = new THREE.Spherical(16, Math.PI / 3, Math.PI / 4);

    const updateCamera = () => {
      camera.position.setFromSpherical(spherical).add(cameraTarget);
      camera.lookAt(cameraTarget);
    };
    updateCamera();

    // Funkcia na vycentrovanie pohľadu späť na stred
    resetCameraRef.current = () => {
      cameraTarget.copy(initialTarget);
      spherical.radius = 16;
      spherical.theta = Math.PI / 4;
      spherical.phi = Math.PI / 3;
      updateCamera();
    };

    const dom = renderer.domElement;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        // Pravé tlačidlo = Posun stredu pohľadu (Pan)
        isMouseDown = true;
        isPanMode = true;
        prevMousePos = { x: e.clientX, y: e.clientY };
        dom.style.cursor = 'move';
        e.preventDefault();
      } else if (e.button === 0 || e.button === 1) {
        // Ľavé alebo stredné tlačidlo = Otáčanie (alebo Pan pri držaní Ctrl/Shift)
        isMouseDown = true;
        isPanMode = e.ctrlKey || e.shiftKey;
        prevMousePos = { x: e.clientX, y: e.clientY };
        dom.style.cursor = isPanMode ? 'move' : 'grabbing';
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;
      prevMousePos = { x: e.clientX, y: e.clientY };

      if (isPanMode) {
        // Presný 1:1 posun bodu pohľadu v rovine kamery podľa pixelov na obrazovke
        const fovRad = (camera.fov * Math.PI) / 360;
        const viewHeight = 2 * Math.tan(fovRad) * spherical.radius;
        const panFactor = viewHeight / Math.max(100, dom.clientHeight);

        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        cameraTarget.addScaledVector(right, -deltaX * panFactor);
        cameraTarget.addScaledVector(up, deltaY * panFactor);
        updateCamera();
      } else {
        // Otáčanie okolo cameraTarget
        spherical.theta -= deltaX * 0.008;
        spherical.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, spherical.phi - deltaY * 0.008));
        updateCamera();
      }
    };

    const onMouseUp = () => {
      isMouseDown = false;
      isPanMode = false;
      dom.style.cursor = 'grab';
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Zabrániť otvoreniu prehliadačového kontextového menu
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(3, Math.min(35, spherical.radius + e.deltaY * 0.02));
      updateCamera();
    };

    dom.addEventListener('mousedown', onMouseDown);
    dom.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // 10. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      dom.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [floor, selectedComponentId]);

  return (
    <div className="relative w-full h-full bg-slate-950 select-none overflow-hidden">
      {/* 3D ACTION BAR: Reset view & Back to 2D */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => resetCameraRef.current()}
          className="px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xl border border-slate-700 hover:border-sky-500/50 transition active:scale-95"
          title="Vrátiť bod centrovania a pohľad na stred podlažia"
        >
          <Target className="w-4 h-4 text-sky-400" />
          <span>Vycentrovať pohľad</span>
        </button>

        {onSwitchTo2D && (
          <button
            onClick={onSwitchTo2D}
            className="px-3.5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl shadow-sky-500/25 border border-sky-400/40 transition active:scale-95"
            title="Prepnúť späť do 2D pôdorysu"
          >
            <Compass className="w-4 h-4" />
            <span>Prepnúť do 2D pôdorysu</span>
          </button>
        )}
      </div>

      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D HUD & Legend */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2.5 bg-slate-900/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-700 text-xs text-slate-300 shadow-2xl pointer-events-auto max-w-xs sm:max-w-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="font-bold text-sky-400">3D Priestorový pohľad</span>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
            Výška stien: {floor.height.toFixed(2)} m
          </span>
        </div>
        
        {/* Ovládanie pohľadu myšou */}
        <div className="flex flex-col gap-1 text-[11px] bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-slate-300">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-sky-300">Pravé tlačidlo:</span>
            <span className="text-slate-300 text-right">Posun bodu pohľadu (Pan)</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-sky-300">Ľavé tlačidlo:</span>
            <span className="text-slate-300 text-right">Otáčanie okolo stredu (Orbit)</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-sky-300">Koliesko myši:</span>
            <span className="text-slate-300 text-right">Priblíženie / Oddialenie</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-800 text-[10px]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-red-600 inline-block border border-red-400"></span>
              <span className="font-semibold text-red-200">Hlavný rozvádzač RH</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block border border-blue-400"></span>
              <span className="font-semibold text-blue-200">Podružný rozvádzač RP</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 inline-block"></span>
              <span>Kábel v podlahe</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
              <span>Kábel v strope</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              <span>Kábel v stene</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
