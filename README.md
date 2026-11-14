# ElektroCAD SR ⚡

**Profesionálny webový CAD systém pre návrh elektroinštalácií rodinných domov a bytov podľa slovenských technických noriem (STN 33 2130, STN 33 2000-5-52, STN 33 2000-7-701).**

![ElektroCAD SR](https://img.shields.io/badge/Norma-STN%2033%202130-blue)
![WebRTC P2P](https://img.shields.io/badge/P2P%20Sync-Trystero-emerald)
![Vite](https://img.shields.io/badge/Built%20with-Vite%20%2B%20React%20%2B%20TS-cyan)
![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel%20Ready-black)

---

## 🚀 Kľúčové vlastnosti

### 1. 8-krokový interaktívny workflow
1. **Obvodové & Vnútorné steny**: Presné kreslenie stien s nastaviteľnou hrúbkou (15 cm, 25 cm, 30 cm, 38 cm), automatickým snapovaním k existujúcim stenám a detekciou rohov.
2. **Okná & Dvere**: Vkladanie dverí a okien s možnosťou otočenia otvárania (vpravo/vľavo), výberom a editáciou.
3. **Inštalačné zóny (STN 33 2130)**: Automatické generovanie vodorovných a zvislých inštalačných zón pozdĺž stien a okolo dverí.
4. **Rozvádzače**: Hlavný domový rozvádzač (RH) aj podružné rozvádzače (RP) s možnosťou voľného presunu a 3D vizualizácie DIN modulov.
5. **Svetelné vývody**: Stropné, bodové (spotlight), lustre, LED pásy, podsvietenie kuchynskej linky, exteriérové osvetlenie, kúpeľňové svietidlá a nočné orientačné svetlá.
6. **Zásuvky & Vypínače**: 230V, kuchynské linky, vonkajšie IP44, 400V 16A/32A, vypínače radenia 1, 5, 6, 6+6, 7.
7. **Spotrebiče & Kúrenie**: Varná doska, rúra, umývačka riadu, práčka, bojler, tepelné čerpadlo, klimatizácia, elektrické podlahové kúrenie.
8. **Káblové trasy & Prepojenia**: Automatické STN trasovanie káblov v inštalačných zónach k rozvádzačom, prepájanie vypínačov so svietidlami.
9. **Jednopólová schéma & Kusovník (BOM)**: Automatické generovanie schém zapojenia ističov/chráničov a export materiálového súpisu vrátane dĺžok káblov (CYKY-J 3x1.5, 3x2.5, 5x2.5).

---

### 2. Spolupráca viacerých ľudí v reálnom čase (P2P WebRTC)
- **Multi-device podpora**: Práca na tom istom projekte súčasne z počítača (Desktop), tabletu (iPad / Android) aj smartfónu na stavbe.
- **Okamžitá synchronizácia**: Bez potreby centrálneho servera vďaka WebRTC DataChannels cez Trystero a lokálnemu `BroadcastChannel`.
- **Zdieľanie cez QR kód a odkaz**: Generovanie živého QR kódu na obrazovke – kolega na stavbe stačí namieriť fotoaparát telefónu a okamžite vidí projekt.
- **Živé kurzory & Prítomnosť**: Zobrazenie menoviek, rolí (Projektant, Revízny technik, Elektromontér, Investor) a živých kurzorov spolupracovníkov na výkrese.

---

### 3. Dvojrozmerný (2D) & Trojrozmerný (3D) pohľad
- **2D Canvas**: Kreslenie v reálnych metroch, snapovanie, kalibrácia mierky podľa PDF podkladu.
- **3D Realistický model**: Pohľad na steny, otvory, výšky elektroinštalácie podľa STN (vypínače 1.05 m, zásuvky 0.30 m, linka 1.15 m), rozvádzače s DIN prvkami a káblové trasy. Ovládanie rotácie ľavým tlačidlom, posun (Pan) stredným/pravým tlačidlom.

---

## 🛠️ Spustenie projektu lokálne

```bash
# 1. Inštalácia závislostí
npm install

# 2. Spustenie vývojového servera
npm run dev

# 3. Produkčný build
npm run build
```

---

## ☁️ Nasadenie na Vercel & Zdieľanie pre kolegov

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FFilipHorvath152%2Felektro-cad)

Projekt je plne pripravený na nasadenie na **Vercel Edge Cloud**:

### 1. Ako sa kolega dostane k nástroju a rozpracovanému projektu z iného zariadenia:
1. **Globálny prístup bez inštalácie**:
   - Kolega otvorí Vercel URL (napr. `https://elektro-cad.vercel.app`) na akomkoľvek zariadení (Windows PC, Mac, iPhone, iPad, Android).
   - Nepotrebuje inštalovať Node.js, npm ani žiadne programy – všetko beží priamo v prehliadači s hardvérovou WebGL akceleráciou pre 3D.
2. **Okamžité načítanie rozpracovaného projektu (Odkaz / QR kód)**:
   - V aplikácii kliknite na **"Zdieľať & Spolupráca"** a v záložke **"Odkaz s projektom"** kliknite **"Kopírovať odkaz"** alebo ukážte kolegovi **QR kód**.
   - Stav celého projektu (steny, zóny, elektroinštalácia, rozvádzače) sa skomprimuje pomocou natívneho GZIP a zakóduje priamo do URL adresy (`#project=...`).
   - Keď kolega otvorí odkaz alebo naskenuje QR kód na mobile/tablete, projekt sa mu ihneď načíta.
3. **Živá synchronizácia v reálnom čase (P2P WebRTC)**:
   - Ak obaja pracujete súčasne, zmeny na stenách, komponentoch a rozvádzačoch sa cez WebRTC DataChannels prenášajú okamžite obojsmerne vrátane kurzorov.

### 2. Automatický CI/CD deployment
- Repozitár: `https://github.com/FilipHorvath152/elektro-cad` (vetva `main`).
- Každý `git push` do vetvy `main` automaticky aktivuje nový produkčný build na Verceli do 30 sekúnd.
- Konfigurácia `vercel.json` obsahuje:
  - Framework: **Vite**
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - SPA Routing Rewrites: `/* -> /index.html` (zamedzuje 404 chybám pri obnovení stránky)
  - HTTP Cache-Control hlavičky pre statické assety.
