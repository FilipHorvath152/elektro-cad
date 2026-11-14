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

## ☁️ Nasadenie na Vercel

Projekt je pripravený na nasadenie jedným kliknutím na **Vercel**:

1. Prepojte GitHub repozitár `https://github.com/FilipHorvath152/elektro-cad` s Vercel účtom.
2. Konfigurácia (`vercel.json`) je predpripravená:
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - SPA routing rewrites: `/* -> /index.html`
3. Kliknite **Deploy** a aplikácia bude okamžite dostupná online s HTTPS a WebRTC podporou.
