# Task Manager React Alkalmazás

Ez a projekt egy egyszerű **Task Manager** alkalmazás, amely React és modern JavaScript (ES6+) technológiákat használ. 

![alt text](/src/assets/screenshot.png)

## Mappa szerkezet
- `assets` → statikus fájlok, például képek, ikonok, SVG-k  
- `component` → újrahasználható React komponensek  
- `hooks` → egyedi React hook-ok, állapotkezeléshez és logikához  
- `modal` → felugró ablakok és modális elemek  
- `styles` → globális és komponensspecifikus stílusok


## Főbb funkciók

- **Projektek kezelése**
  - Több projekt létrehozása és törlése.
  - Aktív projekt kiválasztása.


- **Címkék (labels)**
  - Minden új projekthez egyedi címkék.
  - Címkék hozzáadása feladatokhoz.
  - Címkék törlése egyesével vagy az összes törlése a projektből.

- **Feladatok kezelése**
  - Új feladat hozzáadása projektekhez.
  - Létrehozzot feladatok szerkesztése, törlése, állapotának módosítása (kész / folyamatban).
  - Feladatokhoz eltöltött idő mérése és automatikus mentése **localStorage**-ban.

- **Szűrés és rendezés**
  - Szűrés állapot, címkék és prioritás (**high**, **mid**, **low**) szerint.
  - Az aktuális szűrők alapján megjelenített feladatlista.

- **Felhasználói felület és állapotmentés**
  - Reszponzív kialakítás mobil és desktop nézetekhez.
  - Modal komponensek, felugró dropdown-ok és címke panelek a könnyű kezelhetőségért.
  - Projektek és feladatok állapotának mentése **localStorage**-ban az oldal frissítése után is.



## Használat

### Top-section


* Kezdésképpen van egy "General" nevű projekted. A jobb oldalon felül az **"Add project"** gomb segítségével hozhatsz létre újat.
* A **Filter** legördülő menüvel szűrhetsz, hogy csak a kívánt feladatokat lásd.
* Egy feladatot kitörölhetsz a feladat jobb oldalán található **"x"** gombbal. A bal oldalán lévő **"Mark complete"** jelölőnégyzettel kipipálhatod, de a feladat ekkor is megmarad.
* Kattints egy már meglévő feladatra a cím, prioritás vagy címkék szerkesztéséhez.

## Állapotok mentése

* Minden projekt, feladat és címke a `localStorage`-ban tárolódik.
* A feladatok időmérése egyenként a `localStorage`-ban tárolódik.
* Az aktív projekt a lap újratöltése után is megmarad.

## Stílus

* A CSS fájlok tartalmazzák a reszponzív elrendezéseket és az egyedi stílusokat a feladatokhoz, címkékhez, modalokhoz és gombokhoz.
* Mobil és desktop nézetekhez külön kezeljük a felhasználói élményt.

## Dependencies

* React
* react-dom
```

## Futtatás

1. Telepítsd a dependecies:

   ```bash
   npm install
   ```

2. Indítsd el a fejlesztői szervert:

   ```bash
   npm run dev



