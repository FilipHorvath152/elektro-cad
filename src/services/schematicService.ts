import { ElectricalComponent, ElectricalComponentType, SwitchboardEnclosure } from '../types/cad';

/**
 * Returns clean SVG path / graphics for STN EN 60617 electrical symbols
 */
export function renderSTNSymbol(type: ElectricalComponentType, size: number = 24, color: string = '#0284c7'): string {
  const r = size / 2;
  switch (type) {
    case 'switch_1':
      // Spínač č. 1: Kruh s jednou lomenou čiarou hore
      return `
        <circle cx="${r}" cy="${r}" r="${r * 0.45}" stroke="${color}" stroke-width="2" fill="white" />
        <line x1="${r}" y1="${r * 0.55}" x2="${r}" y2="${r * 0.15}" stroke="${color}" stroke-width="2" />
        <line x1="${r}" y1="${r * 0.15}" x2="${r + r * 0.35}" y2="${r * 0.15}" stroke="${color}" stroke-width="2" />
      `;

    case 'switch_5':
      // Spínač č. 5: Sériový (dve čiarky v rovnakom smere)
      return `
        <circle cx="${r}" cy="${r}" r="${r * 0.45}" stroke="${color}" stroke-width="2" fill="white" />
        <line x1="${r}" y1="${r * 0.55}" x2="${r}" y2="${r * 0.1}" stroke="${color}" stroke-width="2" />
        <line x1="${r}" y1="${r * 0.1}" x2="${r + r * 0.35}" y2="${r * 0.1}" stroke="${color}" stroke-width="2" />
        <line x1="${r}" y1="${r * 0.25}" x2="${r + r * 0.35}" y2="${r * 0.25}" stroke="${color}" stroke-width="2" />
      `;

    case 'switch_6':
      // Spínač č. 6: Striedavý / schodiskový (dve čiarky do opačných strán)
      return `
        <circle cx="${r}" cy="${r}" r="${r * 0.45}" stroke="${color}" stroke-width="2" fill="white" />
        <line x1="${r}" y1="${r * 0.55}" x2="${r}" y2="${r * 0.15}" stroke="${color}" stroke-width="2" />
        <line x1="${r}" y1="${r * 0.15}" x2="${r + r * 0.35}" y2="${r * 0.15}" stroke="${color}" stroke-width="2" />
        <line x1="${r}" y1="${r * 0.85}" x2="${r - r * 0.35}" y2="${r * 0.85}" stroke="${color}" stroke-width="2" />
      `;

    case 'switch_7':
      // Spínač č. 7: Krížový (ramená kríža)
      return `
        <circle cx="${r}" cy="${r}" r="${r * 0.45}" stroke="${color}" stroke-width="2" fill="white" />
        <line x1="${r * 0.3}" y1="${r * 0.3}" x2="${r * 1.7}" y2="${r * 1.7}" stroke="${color}" stroke-width="2" />
        <line x1="${r * 1.7}" y1="${r * 0.3}" x2="${r * 0.3}" y2="${r * 1.7}" stroke="${color}" stroke-width="2" />
      `;

    case 'push_button':
      // Tlačidlo 1/0
      return `
        <circle cx="${r}" cy="${r}" r="${r * 0.45}" stroke="${color}" stroke-width="2" fill="white" />
        <circle cx="${r}" cy="${r}" r="${r * 0.2}" fill="${color}" />
        <line x1="${r}" y1="${r * 0.55}" x2="${r}" y2="${r * 0.15}" stroke="${color}" stroke-width="2" />
      `;

    case 'socket_230':
      // Zásuvka 230V s kolíkom (polkruh + prívodná čiara)
      return `
        <path d="M ${r * 0.2} ${r} A ${r * 0.8} ${r * 0.8} 0 0 1 ${r * 1.8} ${r}" stroke="${color}" stroke-width="2" fill="white" />
        <line x1="${r * 0.2}" y1="${r}" x2="${r * 1.8}" y2="${r}" stroke="${color}" stroke-width="2" />
        <line x1="${r}" y1="${r}" x2="${r}" y2="${r * 1.8}" stroke="${color}" stroke-width="2" />
        <circle cx="${r}" cy="${r * 0.6}" r="1.5" fill="${color}" />
      `;

    case 'socket_230_double':
      // Dvojzásuvka 230V
      return `
        <path d="M ${r * 0.2} ${r} A ${r * 0.8} ${r * 0.8} 0 0 1 ${r * 1.8} ${r}" stroke="${color}" stroke-width="2" fill="white" />
        <line x1="${r * 0.2}" y1="${r}" x2="${r * 1.8}" y2="${r}" stroke="${color}" stroke-width="2" />
        <line x1="${r * 0.8}" y1="${r}" x2="${r * 0.8}" y2="${r * 1.8}" stroke="${color}" stroke-width="2" />
        <line x1="${r * 1.2}" y1="${r}" x2="${r * 1.2}" y2="${r * 1.8}" stroke="${color}" stroke-width="2" />
      `;

    case 'socket_ip44':
      // Zásuvka IP44 s krytom
      return `
        <path d="M ${r * 0.2} ${r} A ${r * 0.8} ${r * 0.8} 0 0 1 ${r * 1.8} ${r}" stroke="${color}" stroke-width="2" fill="${color}" fill-opacity="0.3" />
        <line x1="${r * 0.2}" y1="${r}" x2="${r * 1.8}" y2="${r}" stroke="${color}" stroke-width="2" />
        <line x1="${r}" y1="${r}" x2="${r}" y2="${r * 1.8}" stroke="${color}" stroke-width="2" />
      `;

    case 'cooker_outlet':
      // Sporáková prípojka 400V
      return `
        <rect x="${r * 0.3}" y="${r * 0.3}" width="${r * 1.4}" height="${r * 1.4}" stroke="${color}" stroke-width="2" fill="white" />
        <text x="${r}" y="${r * 1.3}" font-size="10" font-weight="bold" fill="${color}" text-anchor="middle">400V</text>
      `;

    case 'ac_outlet':
      // Klimatizácia
      return `
        <rect x="${r * 0.2}" y="${r * 0.4}" width="${r * 1.6}" height="${r * 1.2}" rx="3" stroke="${color}" stroke-width="2" fill="white" />
        <text x="${r}" y="${r * 1.25}" font-size="9" font-weight="bold" fill="${color}" text-anchor="middle">AC</text>
      `;

    case 'blinds_switch':
    case 'blinds_motor':
      // Žalúzie motor / spínač
      return `
        <rect x="${r * 0.3}" y="${r * 0.3}" width="${r * 1.4}" height="${r * 1.4}" stroke="${color}" stroke-width="2" fill="white" />
        <path d="M ${r * 0.6} ${r * 0.9} L ${r} ${r * 0.5} L ${r * 1.4} ${r * 0.9}" stroke="${color}" stroke-width="1.5" fill="none" />
        <path d="M ${r * 0.6} ${r * 1.1} L ${r} ${r * 1.5} L ${r * 1.4} ${r * 1.1}" stroke="${color}" stroke-width="1.5" fill="none" />
      `;

    case 'light_ceiling':
      // Stropné svietidlo: Kruh s krížom
      return `
        <circle cx="${r}" cy="${r}" r="${r * 0.7}" stroke="${color}" stroke-width="1.5" fill="white" />
        <line x1="${r * 0.5}" y1="${r * 0.5}" x2="${r * 1.5}" y2="${r * 1.5}" stroke="${color}" stroke-width="2" />
        <line x1="${r * 1.5}" y1="${r * 0.5}" x2="${r * 0.5}" y2="${r * 1.5}" stroke="${color}" stroke-width="2" />
      `;

    case 'light_spotlight':
      // Bodové zapustené svietidlo (downlight): Kruh s krížom a vonkajším lemom
      return `
        <circle cx="${r}" cy="${r}" r="${r * 0.75}" stroke="${color}" stroke-width="1.2" stroke-dasharray="2 1.5" fill="white" />
        <circle cx="${r}" cy="${r}" r="${r * 0.55}" stroke="${color}" stroke-width="1.5" fill="white" />
        <line x1="${r * 0.6}" y1="${r * 0.6}" x2="${r * 1.4}" y2="${r * 1.4}" stroke="${color}" stroke-width="2" />
        <line x1="${r * 1.4}" y1="${r * 0.6}" x2="${r * 0.6}" y2="${r * 1.4}" stroke="${color}" stroke-width="2" />
      `;

    case 'light_chandelier':
      // Závesný luster / svietidlo nad stôl: Kríž s horným závesom
      return `
        <line x1="${r}" y1="${r * 0.1}" x2="${r}" y2="${r * 0.45}" stroke="${color}" stroke-width="2" />
        <circle cx="${r}" cy="${r * 0.15}" r="${r * 0.12}" fill="${color}" />
        <circle cx="${r}" cy="${r * 1.15}" r="${r * 0.65}" stroke="${color}" stroke-width="1.5" fill="white" />
        <line x1="${r * 0.55}" y1="${r * 0.7}" x2="${r * 1.45}" y2="${r * 1.6}" stroke="${color}" stroke-width="2" />
        <line x1="${r * 1.45}" y1="${r * 0.7}" x2="${r * 0.55}" y2="${r * 1.6}" stroke="${color}" stroke-width="2" />
      `;

    case 'light_wall':
      // Nástenné svietidlo podľa STN/IEC: Základňa na stene + polkruh s krížom
      return `
        <line x1="${r * 0.2}" y1="${r * 1.5}" x2="${r * 1.8}" y2="${r * 1.5}" stroke="${color}" stroke-width="2.5" />
        <path d="M ${r * 0.4} ${r * 1.5} A ${r * 0.6} ${r * 0.6} 0 0 1 ${r * 1.6} ${r * 1.5} Z" stroke="${color}" stroke-width="1.5" fill="white" />
        <line x1="${r * 0.6}" y1="${r * 1.5}" x2="${r * 1.4}" y2="${r * 0.9}" stroke="${color}" stroke-width="1.8" />
        <line x1="${r * 1.4}" y1="${r * 1.5}" x2="${r * 0.6}" y2="${r * 0.9}" stroke="${color}" stroke-width="1.8" />
      `;

    case 'light_led_strip':
      // LED pásik: Lineárne pásové svietidlo s textom LED
      return `
        <rect x="${r * 0.15}" y="${r * 0.55}" width="${r * 1.7}" height="${r * 0.9}" rx="3" stroke="${color}" stroke-width="1.8" fill="white" />
        <path d="M ${r * 0.3} ${r * 0.75} L ${r * 0.55} ${r * 1.25} M ${r * 0.65} ${r * 0.75} L ${r * 0.9} ${r * 1.25}" stroke="${color}" stroke-width="1.5" />
        <text x="${r * 1.35}" y="${r * 1.15}" font-size="7.5" font-weight="900" fill="${color}" text-anchor="middle">LED</text>
      `;

    case 'light_kitchen_under':
      // Podsvietenie pracovnej linky: Lišta s lúčmi svetla smerujúcimi dole na pracovnú dosku
      return `
        <rect x="${r * 0.1}" y="${r * 0.35}" width="${r * 1.8}" height="${r * 0.45}" rx="2" stroke="${color}" stroke-width="1.8" fill="${color}" fill-opacity="0.25" />
        <line x1="${r * 0.4}" y1="${r * 0.9}" x2="${r * 0.4}" y2="${r * 1.55}" stroke="${color}" stroke-width="1.6" stroke-dasharray="2 1" />
        <line x1="${r}" y1="${r * 0.9}" x2="${r}" y2="${r * 1.65}" stroke="${color}" stroke-width="1.6" stroke-dasharray="2 1" />
        <line x1="${r * 1.6}" y1="${r * 0.9}" x2="${r * 1.6}" y2="${r * 1.55}" stroke="${color}" stroke-width="1.6" stroke-dasharray="2 1" />
        <polygon points="${r * 0.4},${r * 1.7} ${r * 0.3},${r * 1.5} ${r * 0.5},${r * 1.5}" fill="${color}" />
        <polygon points="${r},${r * 1.8} ${r - r * 0.1},${r * 1.6} ${r + r * 0.1},${r * 1.6}" fill="${color}" />
        <polygon points="${r * 1.6},${r * 1.7} ${r * 1.5},${r * 1.5} ${r * 1.7},${r * 1.5}" fill="${color}" />
      `;

    case 'light_outdoor':
      // Exteriérové fasádne svietidlo IP65 (svit hore/dole)
      return `
        <rect x="${r * 0.4}" y="${r * 0.4}" width="${r * 1.2}" height="${r * 1.2}" rx="3" stroke="${color}" stroke-width="2" fill="white" />
        <path d="M ${r * 0.6} ${r * 0.35} L ${r} ${r * 0.1} L ${r * 1.4} ${r * 0.35}" stroke="${color}" stroke-width="1.8" fill="none" />
        <path d="M ${r * 0.6} ${r * 1.65} L ${r} ${r * 1.9} L ${r * 1.4} ${r * 1.65}" stroke="${color}" stroke-width="1.8" fill="none" />
        <text x="${r}" y="${r * 1.15}" font-size="7" font-weight="bold" fill="${color}" text-anchor="middle">IP65</text>
      `;

    case 'light_bathroom':
      // Kúpeľňové svietidlo nad zrkadlo IP44
      return `
        <rect x="${r * 0.15}" y="${r * 0.45}" width="${r * 1.7}" height="${r * 1.1}" rx="4" stroke="${color}" stroke-width="1.8" fill="white" />
        <line x1="${r * 0.35}" y1="${r * 0.65}" x2="${r * 1.65}" y2="${r * 0.65}" stroke="${color}" stroke-width="1.2" />
        <text x="${r}" y="${r * 1.28}" font-size="7.5" font-weight="900" fill="${color}" text-anchor="middle">IP44</text>
      `;

    case 'light_night_orientation':
      // Nočné soklové / schodiskové orientačné svietidlo
      return `
        <rect x="${r * 0.3}" y="${r * 0.3}" width="${r * 1.4}" height="${r * 1.4}" rx="2" stroke="${color}" stroke-width="1.8" fill="white" />
        <path d="M ${r * 0.5} ${r * 0.6} L ${r * 1.5} ${r * 0.6}" stroke="${color}" stroke-width="1.5" />
        <path d="M ${r * 0.5} ${r * 0.95} L ${r * 1.5} ${r * 0.95}" stroke="${color}" stroke-width="1.5" />
        <path d="M ${r * 0.5} ${r * 1.3} L ${r * 1.5} ${r * 1.3}" stroke="${color}" stroke-width="1.5" />
        <circle cx="${r * 0.7}" cy="${r * 1.3}" r="1.5" fill="${color}" />
      `;

    case 'socket_400v_16a':
      // Zásuvka 400V 16A 5P CEE
      return `
        <circle cx="${r}" cy="${r}" r="${r * 0.7}" stroke="${color}" stroke-width="2" fill="white" />
        <line x1="${r}" y1="${r * 0.3}" x2="${r}" y2="${r * 1.7}" stroke="${color}" stroke-width="2" />
        <line x1="${r * 0.3}" y1="${r}" x2="${r * 1.7}" y2="${r}" stroke="${color}" stroke-width="2" />
        <text x="${r}" y="${r * 1.35}" font-size="8" font-weight="bold" fill="${color}" text-anchor="middle">16A</text>
      `;

    case 'boiler':
      // Elektrický ohrievač vody (bojler)
      return `
        <circle cx="${r}" cy="${r}" r="${r * 0.75}" stroke="${color}" stroke-width="2" fill="white" />
        <text x="${r}" y="${r * 1.25}" font-size="11" font-weight="bold" fill="${color}" text-anchor="middle">W</text>
      `;

    case 'water_pump':
      // Vodné čerpadlo / domáca vodáreň
      return `
        <circle cx="${r}" cy="${r}" r="${r * 0.75}" stroke="${color}" stroke-width="2" fill="white" />
        <path d="M ${r * 0.6} ${r * 1.4} L ${r} ${r * 0.5} L ${r * 1.4} ${r * 1.4} Z" fill="${color}" />
      `;

    case 'electric_heating':
      // Elektrické kúrenie / podlahová rohož
      return `
        <rect x="${r * 0.25}" y="${r * 0.4}" width="${r * 1.5}" height="${r * 1.2}" stroke="${color}" stroke-width="2" fill="white" />
        <path d="M ${r * 0.4} ${r * 1.3} L ${r * 0.7} ${r * 0.7} L ${r} ${r * 1.3} L ${r * 1.3} ${r * 0.7} L ${r * 1.6} ${r * 1.3}" stroke="${color}" stroke-width="1.8" fill="none" />
      `;

    case 'heat_pump':
      // Tepelné čerpadlo
      return `
        <rect x="${r * 0.2}" y="${r * 0.2}" width="${r * 1.6}" height="${r * 1.6}" rx="3" stroke="${color}" stroke-width="2" fill="white" />
        <text x="${r}" y="${r * 1.25}" font-size="10" font-weight="bold" fill="${color}" text-anchor="middle">TČ</text>
      `;

    case 'ventilation':
      // Rekuperácia
      return `
        <circle cx="${r}" cy="${r}" r="${r * 0.75}" stroke="${color}" stroke-width="2" fill="white" />
        <path d="M ${r} ${r * 0.3} Q ${r * 1.5} ${r} ${r} ${r * 1.7}" stroke="${color}" stroke-width="2" fill="none" />
        <path d="M ${r} ${r * 1.7} Q ${r * 0.5} ${r} ${r} ${r * 0.3}" stroke="${color}" stroke-width="2" fill="none" />
      `;

    case 'switchboard':
      // Rozvádzač RH: Obdĺžnik s uhlopriečkou
      return `
        <rect x="${r * 0.1}" y="${r * 0.1}" width="${r * 1.8}" height="${r * 1.8}" stroke="#dc2626" stroke-width="2" fill="#fee2e2" />
        <line x1="${r * 0.1}" y1="${r * 0.1}" x2="${r * 1.9}" y2="${r * 1.9}" stroke="#dc2626" stroke-width="2" />
        <text x="${r}" y="${r * 1.3}" font-size="8" font-weight="bold" fill="#dc2626" text-anchor="middle">RH</text>
      `;

    default:
      return `
        <circle cx="${r}" cy="${r}" r="${r * 0.5}" stroke="${color}" stroke-width="2" fill="white" />
      `;
  }
}

/**
 * Generates an SVG string of the switchboard single-line diagram (STN EN 61439 & STN EN 60617)
 */
export function generateSingleLineDiagramSVG(
  switchboard: SwitchboardEnclosure,
  components: ElectricalComponent[]
): string {
  const width = 1100;
  const height = 650;

  let circuitsSvg = '';
  const xStart = 280;
  const spacing = 110;

  // Render circuits connected to this switchboard
  switchboard.modules.filter((m) => m.type === 'mcb').forEach((mcb, index) => {
    const x = xStart + index * spacing;
    const yTop = 190;
    const yBottom = 480;

    circuitsSvg += `
      <!-- Obvod ${index + 1}: ${mcb.name} -->
      <line x1="${x}" y1="${yTop}" x2="${x}" y2="${yBottom}" stroke="#1e293b" stroke-width="2" />
      
      <!-- Istič MCB symbol -->
      <rect x="${x - 18}" y="${yTop + 50}" width="36" height="50" rx="4" fill="#ffffff" stroke="#2563eb" stroke-width="2" />
      <text x="${x}" y="${yTop + 72}" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle">${mcb.rating}</text>
      <text x="${x}" y="${yTop + 88}" font-size="9" fill="#64748b" text-anchor="middle">${mcb.widthDIN} DIN</text>

      <!-- Label obvodu -->
      <rect x="${x - 48}" y="${yBottom + 10}" width="96" height="60" rx="4" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
      <text x="${x}" y="${yBottom + 28}" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">${mcb.name}</text>
      <text x="${x}" y="${yBottom + 45}" font-size="9" fill="#0284c7" text-anchor="middle">${mcb.rating.includes('3P') ? 'CYKY-J 5x2.5' : mcb.rating.includes('10A') ? 'CYKY-J 3x1.5' : 'CYKY-J 3x2.5'}</text>
      <text x="${x}" y="${yBottom + 60}" font-size="8" fill="#16a34a" text-anchor="middle">ΔU &lt; 2.1 % (STN OK)</text>
    `;
  });

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background:#ffffff; font-family: -apple-system, sans-serif;">
      <!-- Title block according to STN standards -->
      <rect x="20" y="20" width="${width - 40}" height="70" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5" rx="6" />
      <text x="40" y="50" font-size="18" font-weight="bold" fill="#0f172a">JEDNOPÓLOVÁ SCHÉMA ZAPOJENIA ROZVÁDZAČA (${switchboard.name})</text>
      <text x="40" y="72" font-size="11" fill="#475569">Sústava: 3x400/230V 50Hz TN-C-S | Ochrana samočinným odpojením podľa STN 33 2000-4-41 | Norma: STN EN 61439-3</text>
      <text x="${width - 250}" y="50" font-size="11" font-weight="bold" fill="#0284c7">Kapacita: ${switchboard.totalModules} DIN modulov</text>
      <text x="${width - 250}" y="72" font-size="10" fill="#64748b">Rezerva: 28 % voľných modulov</text>

      <!-- Prívod TN-C z elektromerového rozvádzača RE -->
      <line x1="60" y1="120" x2="60" y2="400" stroke="#b91c1c" stroke-width="3" />
      <text x="75" y="145" font-size="12" font-weight="bold" fill="#b91c1c">Prívod CYKY-J 5x10 mm²</text>
      <text x="75" y="162" font-size="10" fill="#475569">Z elektromeru RE (B25A/3P)</text>

      <!-- Hlavný vypínač 3P -->
      <rect x="35" y="190" width="50" height="60" rx="4" fill="#fee2e2" stroke="#b91c1c" stroke-width="2" />
      <text x="60" y="222" font-size="10" font-weight="bold" fill="#b91c1c" text-anchor="middle">HLAVNÝ</text>
      <text x="60" y="238" font-size="9" fill="#b91c1c" text-anchor="middle">40A 3P</text>

      <!-- Zvodič prepätia SPD T1+T2 -->
      <line x1="60" y1="280" x2="150" y2="280" stroke="#b91c1c" stroke-width="2" />
      <rect x="150" y="255" width="70" height="50" rx="4" fill="#fef3c7" stroke="#d97706" stroke-width="2" />
      <text x="185" y="280" font-size="10" font-weight="bold" fill="#92400e" text-anchor="middle">SPD T1+T2</text>
      <text x="185" y="295" font-size="8" fill="#92400e" text-anchor="middle">Imax=50kA (4P)</text>

      <!-- Zbernica L1, L2, L3 po hlavnom vypínači -->
      <line x1="60" y1="190" x2="${width - 80}" y2="190" stroke="#2563eb" stroke-width="3" />
      <text x="${width - 70}" y="195" font-size="10" font-weight="bold" fill="#2563eb">L1, L2, L3</text>

      <!-- Prúdové chrániče (RCD) sekcia -->
      <rect x="240" y="125" width="220" height="45" rx="4" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5" />
      <text x="350" y="148" font-size="11" font-weight="bold" fill="#0369a1" text-anchor="middle">RCD 1: 40A / 30mA 4P (Typ A)</text>
      <text x="350" y="162" font-size="9" fill="#0284c7" text-anchor="middle">Ochrana svetelných a zásuvkových obvodov</text>

      <!-- Vykreslenie jednotlivých obvodov -->
      ${circuitsSvg}

      <!-- Legenda a certifikačné pole -->
      <rect x="20" y="${height - 70}" width="${width - 40}" height="50" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" rx="4" />
      <text x="40" y="${height - 40}" font-size="10" fill="#475569">Vypracoval: Certifikovaný elektrotechnik | Všetky zásuvkové a svetelné obvody sú vybavené prúdovým chráničom RCD ≤ 30mA podľa STN 33 2000-4-41.</text>
      <text x="40" y="${height - 25}" font-size="9" fill="#64748b">Značky a vyhotovenie podľa STN EN 60617 a STN EN 61439-1 / -3. Určené pre montáž a revíznu správu.</text>
    </svg>
  `;
}
