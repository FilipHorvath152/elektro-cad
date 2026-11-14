import React, { useState } from 'react';
import {
  X,
  BookOpen,
  ShieldCheck,
  Ruler,
  MousePointer,
  Move,
  Maximize2,
  Sparkles,
  Droplets,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

interface InstallationZonesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool?: (tool: string) => void;
}

export const InstallationZonesGuideModal: React.FC<InstallationZonesGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectTool,
}) => {
  const [activeTab, setActiveTab] = useState<'stn_rules' | 'kitchen_surface' | 'bathroom' | 'how_to_use'>('stn_rules');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Sprievodca a návod na inštalačné zóny STN 33 2130
                </h2>
                <span className="text-[10px] bg-teal-950 text-teal-300 px-2 py-0.5 rounded-full border border-teal-700/60 font-mono">
                  Slovenská technická norma
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pravidlá správneho umiestňovania, presúvania a vymedzovania plôch inštalačných zón
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2">
          <button
            onClick={() => setActiveTab('stn_rules')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'stn_rules'
                ? 'border-teal-400 text-teal-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>1. Pravidlá a výšky STN 33 2130</span>
          </button>

          <button
            onClick={() => setActiveTab('kitchen_surface')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'kitchen_surface'
                ? 'border-amber-400 text-amber-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ruler className="w-4 h-4" />
            <span>2. Zóna na ploche (nie celá stena)</span>
          </button>

          <button
            onClick={() => setActiveTab('bathroom')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'bathroom'
                ? 'border-red-400 text-red-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Droplets className="w-4 h-4" />
            <span>3. Kúpeľňa (STN 33 2000-7-701)</span>
          </button>

          <button
            onClick={() => setActiveTab('how_to_use')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'how_to_use'
                ? 'border-sky-400 text-sky-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MousePointer className="w-4 h-4" />
            <span>4. Návod: Kreslenie, posun a zmena rozmeru</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300 text-xs leading-relaxed">
          {/* TAB 1: STN 33 2130 Rules */}
          {activeTab === 'stn_rules' && (
            <div className="space-y-6">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-100 text-sm mb-1">Prečo existujú inštalačné zóny?</h4>
                  <p className="text-slate-400 leading-normal">
                    Podľa normy <strong>STN 33 2130 čl. 7.6</strong> sa elektrické vedenia v stenách musia ukladať
                    výhradne v presne stanovených vodorovných a zvislých pásmach (zónach). Zabezpečuje to ochranu pred
                    navŕtaním kábla pri vešaní obrazov, montáži nábytku alebo kuchynskej linky.
                  </p>
                </div>
              </div>

              {/* 5 STN Zones Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ZVD */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-teal-500/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-300 text-sm flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-teal-400 inline-block"></span>
                      ZVD – Dolná vodorovná zóna
                    </span>
                    <span className="text-[10px] bg-teal-950 text-teal-300 px-2 py-0.5 rounded font-mono border border-teal-800">
                      15 – 45 cm nad podlahou
                    </span>
                  </div>
                  <p className="text-slate-300">
                    <strong>Šírka zóny:</strong> 30 cm, <strong>Montážna os:</strong> 30 cm nad hotovou podlahou.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Určená pre zásuvkové okruhy 230V v obytných miestnostiach (obývačka, spálňa, chodba). Zásuvky sa osádzajú do výšky 30 cm.
                  </p>
                </div>

                {/* ZVH */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-sky-500/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-300 text-sm flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-sky-400 inline-block"></span>
                      ZVH – Horná vodorovná zóna
                    </span>
                    <span className="text-[10px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded font-mono border border-sky-800">
                      15 – 45 cm pod stropom
                    </span>
                  </div>
                  <p className="text-slate-300">
                    <strong>Šírka zóny:</strong> 30 cm, <strong>Montážna os:</strong> 30 cm pod hotovým stropom.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Hlavná káblová magistrála od rozvádzača. Slúži na rozvody osvetlenia, napájanie klimatizačných jednotiek, žalúzií a senzorov.
                  </p>
                </div>

                {/* ZVS */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 text-sm flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
                      ZVS – Stredná vodorovná zóna
                    </span>
                    <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-800">
                      90 – 120 cm nad podlahou
                    </span>
                  </div>
                  <p className="text-slate-300">
                    <strong>Šírka zóny:</strong> 30 cm, <strong>Montážna os:</strong> 105 – 115 cm nad podlahou.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Zásuvky nad pracovnou doskou kuchynskej linky alebo pracovným stolom. <span className="text-amber-300 font-bold">Umiestňuje sa výhradne len na plochu, kde bude linka!</span>
                  </p>
                </div>

                {/* ZVZ */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
                      ZVZ – Zvislá zóna pri dverách
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-mono border border-emerald-800">
                      10 – 30 cm od zárubne
                    </span>
                  </div>
                  <p className="text-slate-300">
                    <strong>Šírka zóny:</strong> 20 cm, <strong>Montážna os:</strong> 20 cm od hrany dverného otvoru.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Zvislý káblový zvod z hornej zóny k vypínačom osvetlenia. Vypínače sa montujú v odporúčanej výške 105 cm (100–110 cm).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Specific surface / Not whole wall */}
          {activeTab === 'kitchen_surface' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 p-5 rounded-2xl border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span>Dôležité: Zóna na ploche linky vs. Celá stena</span>
                </div>
                <p className="text-slate-200">
                  Pri moderných otvorených dispozíciách (kuchyňa spojená s obývačkou a jedálňou) je jedna stena dlhá často 6 až 8 metrov.
                  <strong> Kuchynská zóna ZVS (90–120 cm) sa nesmie kresliť po celej stene!</strong>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="bg-red-950/40 p-3 rounded-xl border border-red-800/40">
                    <span className="font-bold text-red-300 block mb-1">❌ Chybný postup (obe strany steny):</span>
                    <span className="text-slate-400 text-[11px]">
                      Zóna kuchynskej linky sa nesmie kresliť na obe strany steny. Zásuvky nad pracovnou doskou patria výlučne do vnútra kuchyne, nie do susednej izby, chodby alebo exteriéru.
                    </span>
                  </div>
                  <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/40">
                    <span className="font-bold text-emerald-300 block mb-1">✅ Správny postup (jedna strana & vymedzený úsek):</span>
                    <span className="text-slate-400 text-[11px]">
                      Zóna ZVS je jednostranná (Ľavá alebo Pravá strana steny) a vymedzená len v dĺžke linky (napr. 2.4 m). Ak ju nakreslíte na opačnú stranu, tlačidlom <em>Prehodiť stranu</em> ju jedným klikom otočíte dovnútra.
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-teal-400" />
                  Ako vytvoriť zónu len pre určitú plochu v ElektroCAD:
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-300">
                  <li>
                    Aktivujte nástroj <strong>ZVS – Kuchynská linka (len plocha)</strong> alebo <strong>Úsek na stene</strong> v ľavom paneli.
                  </li>
                  <li>
                    <strong>Kliknite na stenu a ťahajte myšou:</strong> V reálnom čase vidíte presnú dĺžku úseku (napr. <em>2.40 m</em>).
                  </li>
                  <li>
                    <strong>Uvoľnite myš:</strong> Vytvorí sa ohraničená zóna presne na danej ploche steny.
                  </li>
                  <li>
                    <strong>Úprava kedykoľvek:</strong> Potiahnutím za modré kruhové úchyty na krajoch môžete zónu predĺžiť alebo skrátiť, potiahnutím za stred ju posuniete.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: Bathroom STN 33 2000-7-701 */}
          {activeTab === 'bathroom' && (
            <div className="space-y-6">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-red-500/30 flex items-start gap-3">
                <Droplets className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-200 text-sm mb-1">
                    Bezpečnostné zóny v priestoroch s vaňou alebo sprchou (STN 33 2000-7-701)
                  </h4>
                  <p className="text-slate-400 leading-normal">
                    Voda dramaticky znižuje elektrický odpor ľudského tela. V kúpeľniach platia prísne bezpečnostné pásma,
                    kde je zakázaná inštalácia bežných spínačov a zásuviek 230V.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-400 text-sm">Zóna 0 & Zóna 1 (Vaňa / Sprchový kút)</span>
                    <span className="text-[10px] bg-red-950 text-red-300 px-2 py-0.5 rounded font-mono border border-red-800">
                      PRÍSNY ZÁKAZ 230V
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    <strong>Zóna 0:</strong> Vnútorný priestor vane alebo sprchovacej vaničky.
                  </p>
                  <p className="text-slate-300 text-[11px]">
                    <strong>Zóna 1:</strong> Zvislý priestor nad vaňou do výšky 2.25 m. Povolené iba ohrievače vody a nízkonapäťové svietidlá SELV (max. 12V AC). Žiadne bežné vypínače ani zásuvky!
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 text-sm">Zóna 2 (Ochranný pás 60 cm – pevne naviazaný na vaňu)</span>
                    <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-800">
                      Min. krytie IPX4
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Bezpečnostné pásmo široké 60 cm po celom obvode vane alebo sprchy. Nie je to samostatná zóna – <strong>je pevne naviazaná na Zónu 1</strong> a pohybuje sa aj mení rozmery automaticky s vaňou. Sú tu zakázané bežné zásuvky 230V a povolené iba špeciálne svietidlá a spotrebiče s krytím min. IPX4 zapojené cez prúdový chránič RCD 30 mA.
                  </p>
                  <div className="mt-1 p-2 rounded bg-amber-950/60 border border-amber-600/40 text-[10.5px] text-amber-200">
                    💡 <strong>Asymetrická zmena veľkosti:</strong> Po kliknutí na zónu potiahnite za ľubovoľný roh. Menia sa <strong>iba strany naviazané na tento roh</strong> a opačný roh zostáva zafixovaný na pôvodnom mieste (zóna sa nerozťahuje symetricky). Zóna 2 sa automaticky prispôsobí.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-teal-950/30 border border-teal-500/30 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-300 text-sm">Zóna 3 (Zvyšný priestor kúpeľne)</span>
                    <span className="text-[10px] bg-teal-950 text-teal-300 px-2 py-0.5 rounded font-mono border border-teal-800">
                      Zásuvky s RCD 30mA
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Všetky zásuvky pri umývadle (vzdialené viac ako 60 cm od vane) MUSIA byť zapojené za prúdový chránič s vybavovacím prúdom max. 30 mA (napr. typ A 30mA). Odporúča sa krytie IP44 s viečkom.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Interactive Usage Instructions */}
          {activeTab === 'how_to_use' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Kreslenie úseku */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    1
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm">Kreslenie len na časť steny</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Kliknite na stenu a ťahajte myšou. Vytvoríte úsek zóny presne na požadovanú dĺžku (napr. 2.4 m kuchyňa).
                  </p>
                </div>

                {/* 2. Presúvanie zóny */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                    <Move className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm">Presúvanie zóny</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    V režime Výber kliknite na zónu a ťahajte za jej stred. Zóna sa plynule posúva po stene s magnetickým krokom 5 cm.
                  </p>
                </div>

                {/* 3. Zmena rozmeru */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm">Zväčšovanie / Zmenšovanie</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Pri stenových zónach potiahnite za úchyt na začiatku/konci. Pri kúpeľňových zónach potiahnite za ľubovoľný roh — menia sa len priľahlé strany, opačný roh zostáva zafixovaný. Rozmer môžete zadať aj v pravom paneli.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block">Chcete automaticky vygenerovať základné normové zóny?</span>
                  <span className="text-slate-400 text-[11px]">
                    Vygenerujú sa zóny ZVD a ZVH pozdĺž stien a zvislé zóny ZVZ pri dverách, ktoré potom môžete ľubovoľne skrátiť a upraviť.
                  </span>
                </div>
                {onSelectTool && (
                  <button
                    onClick={() => {
                      onSelectTool('zone_kitchen');
                      onClose();
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shrink-0"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Začať kresliť kuchynskú linku</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Normy STN 33 2130 (čl. 7.6) a STN 33 2000-7-701
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition"
          >
            Rozumiem, zatvoriť návod
          </button>
        </div>
      </div>
    </div>
  );
};
