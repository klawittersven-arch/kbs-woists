# KBS Wo ist’s? Anatomie!

Ein Tippspiel zu Skelett, Muskeln und Organen für die ganze Klasse. Oben auf dem Handy steht ein Begriff, z. B. „Kniescheibe“ oder „Patella“. Darunter ist ein ganzer menschlicher Körper zu sehen. Wer die richtige Stelle schnell antippt, bekommt viele Punkte. Wer danebentippt, fällt auf 0 zurück. Erst spielen alle allein auf dem Handy (Qualifying), dann spielen die Besten im Finale am Beamer gegeneinander.

| Seite | Adresse | Für wen |
|---|---|---|
| Üben | `/` | alle, auch zu Hause (ohne Klasse, ohne Anmeldung), mit „Erkunden“ |
| Klassenmodus | `/lehrer` | Lehrkraft am Laptop mit Beamer |
| Mitspielen | `/mitspielen` | SuS, wird über den QR-Code geöffnet |

**Link für den Beamer (nach der Einrichtung):** `https://kbs-woists.klawittersven.workers.dev/lehrer`

Spiel, Abbildungen und Töne: © 2026 Sven Klawitter. Alle Abbildungen sind eigene Zeichnungen.

---

## Einmalige Einrichtung bei Cloudflare (etwa 10 Minuten)

Genauso wie bei KBS Simon says, KBS-Kart und Tetris:

1. Bei Cloudflare anmelden: <https://dash.cloudflare.com>
2. Links im Menü **Workers & Pages** öffnen (je nach Ansicht unter **Compute (Workers)**).
3. **Create application** (Anwendung erstellen) wählen, dann **GitHub** bzw. **Import a repository**.
4. Das Repository **kbs-woists** auswählen. Falls es nicht in der Liste steht: in den GitHub-Einstellungen der Cloudflare-App den Zugriff auf `kbs-woists` erlauben.
5. Einstellungen prüfen:
   - **Project name / Worker name:** `kbs-woists` (muss genau so heißen, sonst schlägt der Build fehl)
   - **Build command:** leer lassen
   - **Deploy command:** `npx wrangler deploy` (ist voreingestellt)
   - **Root directory:** leer lassen
6. **Save and Deploy** klicken. Nach ein bis zwei Minuten ist das Spiel online unter `https://kbs-woists.klawittersven.workers.dev`.

**Updates:** Jede Änderung, die im Branch `main` dieses GitHub-Repositorys landet, veröffentlicht Cloudflare automatisch.

---

## Ablauf im Unterricht

1. **Lehrer-Link am Laptop öffnen**, Beamer und Lautsprecher an, **F** für Vollbild. Oben rechts steht der Code der Sitzung.
2. **Anmeldung:** Die SuS scannen den QR-Code und geben Vornamen und den ersten Buchstaben des Nachnamens ein (z. B. „Lena K.“). Die Namen erscheinen am Beamer. Mit **×** entfernst du unpassende Namen.
3. **Einstellungen** (unter den Namen, bleiben gespeichert):
   - **Thema:** Skelett, Muskeln, Organe oder Alles gemischt.
   - **Begriffe:** **Einfach** (deutsche Wörter: Schienbein, Kapuzenmuskel, Leber …) oder **Schwer** (Fachbegriffe: Tibia, M. trapezius, Hepar …). Bei „Schwer“ kommen zusätzlich feinere Begriffe dran (z. B. Ossa carpi, M. vastus lateralis). In der Auflösung steht immer beides da.
   - **Qualifying:** 90 Sekunden, 2 Minuten (voreingestellt) oder 3 Minuten.
   - **Finale:** mit 2, 3 oder 4 Personen.
4. **Qualifying starten** (Enter). Nach einem Countdown spielen alle **gleichzeitig auf dem eigenen Handy**. Alle bekommen die Begriffe in derselben Reihenfolge. Am Beamer laufen die Restzeit und eine Live-Rangliste.
5. Nach einem Fehler zeigt das Handy die **Auflösung**: Die richtige Stelle blinkt grün, dazu steht da, was gesucht war (z. B. „Femur = Oberschenkelknochen“) und was getippt wurde. Mit **Weiter** (oder nach 5 Sekunden) geht es mit dem nächsten Begriff weiter. Nachzügler können über den kleinen QR-Code noch einsteigen, haben dann aber nur die restliche Zeit.
6. Ist die Zeit um, zeigt der Beamer den **Endstand**. Jedes Handy zeigt das eigene Ergebnis, den Platz und die Liste **„Das solltest du noch üben“** (alle Begriffe, bei denen es danebenging). **Weiter zum Finale** (Enter). Mit „Qualifying beenden“ lässt es sich auch vorzeitig beenden.
7. **Finale einrichten:** Die Besten sind vorausgewählt, über die Auswahllisten lässt sich jemand austauschen. Thema, Begriffe und die **Länge** (5, 10 oder 15 Begriffe) lassen sich fürs Finale ändern. **Finale starten** (Enter), sobald alle Finalisten-Handys verbunden sind.
8. **Finale (Punkte-Duell):** Der Begriff erscheint **am Beamer** (mit Ton) und auf den Handys der Finalisten. Alle tippen gleichzeitig auf dem eigenen Handy. Am Beamer sieht man nur, wer schon getippt hat. Sobald alle getippt haben (oder die Zeit um ist), kommt die **Auflösung**: Die richtige Stelle leuchtet, und farbige Punkte mit Nummern zeigen, wo jede Person getippt hat. Nach gut 6 Sekunden kommt der nächste Begriff.
9. **Siegerehrung** mit Pokal, Platzierungen und allen Begriffen des Finales zum Nachlesen. Danach **Revanche** (Enter, gleiche Finalisten, neue Begriffe), **Andere Finalisten** oder **Neues Spiel** (Esc, zurück zur Anmeldung, alle bleiben angemeldet).

### Punkte

| | |
|---|---|
| **Richtig** | 50 Punkte sicher, dazu bis zu 50 **Tempopunkte**: volle Tempopunkte in den ersten 2 Sekunden, danach werden es langsam weniger, ab 15 Sekunden gibt es keine mehr. |
| **Falsch oder Zeit um** | Die Punkte fallen auf **0**. |
| **Wertung** | Es zählt der **Bestwert**: die meisten Punkte, die man am Stück geschafft hat. Ein Fehler kurz vor Schluss kostet also nicht alles. Bei Gleichstand zählen die Treffer (im Finale danach die schnellere Zeit). |
| **Zeit pro Begriff** | 20 Sekunden (Zeitbalken). Getestet wird das Wissen, nicht das Tipptempo: Auch nach 15 Sekunden gibt es noch 50 Punkte. |
| **Danebentippen** | Ein kleines Stück daneben (etwa eine Fingerkuppe) zählt noch als richtig. Wer zum Beispiel die Speiche sucht und knapp die Elle trifft, bekommt die Punkte. |

### Im Finale

- Tippt ein Handy nicht (z. B. weggelegt), endet der Begriff automatisch nach 20 Sekunden. Mit **Begriff beenden** geht es sofort weiter: Wer noch nicht getippt hat, bekommt 0 Punkte.
- **Finale abbrechen** führt zurück zur Auswahl der Finalisten.
- Die Punkte am Beamer ändern sich erst bei der Auflösung, damit niemand vorher sieht, ob es richtig war.

### Tasten am Beamer

| Taste | Funktion |
|---|---|
| Enter | Qualifying starten / beenden, Finale starten, Revanche |
| Esc | Neues Spiel (zurück zur Anmeldung) |
| F | Vollbild |
| M | Ton an/aus |

**Tipps**
- Die Handys sind immer stumm, auch auf der Übungsseite. Ton gibt es nur im Finale über den Beamer-Laptop (mit **M** oder dem Knopf oben rechts ausschaltbar).
- Bei Begriffen, die man von hinten besser sieht (Scapula, M. trapezius, M. gluteus maximus …), erscheint die Abbildung **von hinten**. Oben links steht dann in Orange „von hinten“.
- Links und rechts spielen keine Rolle: Bei paarigen Strukturen zählen beide Seiten.
- Der Bildschirm der Handys bleibt während des Spiels an (sofern der Browser das unterstützt).
- Wer die Seite versehentlich schließt, scannt den QR-Code noch einmal. Das Handy wird wiedererkannt, solange derselbe Browser benutzt wird. Im Qualifying geht es dann mit dem gespeicherten Punktestand weiter.
- **Mehrere Klassen gleichzeitig:** Jede Lehrkraft öffnet `/lehrer` und bekommt einen eigenen Code. **Sitzung → Neue Sitzung** erzeugt einen neuen Code.
- **Übungsseite:** „Spielen“ dauert 2 Minuten und merkt sich den Rekord je Thema und Stufe. Mit **„In Ruhe erkunden“** tippt man auf eine Stelle und sieht ihren Namen (beide Begriffe), bei verschachtelten Stellen auch, wozu sie gehört (z. B. „M. biceps femoris, gehört zu: Mm. ischiocrurales“). Gut zum Lernen vor dem Spiel.

---

## Begriffe ändern

Alle Begriffe stehen in **`public/js/inhalte.js`**. Auf GitHub die Datei öffnen, auf den Stift klicken, ändern, „Commit changes“. Nach ein bis zwei Minuten gilt die Änderung.

Jede Zeile sieht so aus:

```js
{ stelle: 'femur', bild: 'skelett-vorn', einfach: 'Oberschenkelknochen', schwer: 'Femur' },
```

- **einfach** und **schwer**: die Wörter für die beiden Stufen. Nur den Text zwischen den Hochkommas ändern.
- **nur: 'schwer'** am Ende: Der Begriff kommt nur bei „Schwer“ dran.
- **Begriff weglassen:** Zeile löschen oder `//` an den Anfang schreiben.
- **stelle** und **bild** nicht ändern, außer du willst eine der unten genannten freien Stellen verwenden.
- **bild** darf auch eine Liste sein, z. B. `bild: ['muskeln-vorn', 'muskeln-hinten']`. Dann wird jedes Mal ausgelost, welche Ansicht kommt.

Enthalten sind 96 Begriffe (Einfach: Skelett 30, Muskeln 23, Organe 22; Schwer: 38, 35, 23).

### Gezeichnete Stellen, die noch keinen eigenen Begriff haben

Diese Stellen sind schon gezeichnet und antippbar. Für einen neuen Begriff eine Zeile mit dieser `stelle` und diesem `bild` ergänzen:

| Abbildung (`bild`) | freie Stellen (`stelle`) |
|---|---|
| `skelett-vorn` | `scapula`, `columna`, `vertebrae-cervicales`, `vertebrae-thoracicae`, `os-sacrum`, `os-coxae` (Hüftbein), `os-ischii`, `os-nasale` (Nasenbein) |
| `skelett-hinten` | `cranium`, `mandibula`, `clavicula`, `costae`, `pelvis`, `os-coxae`, `os-ilium`, `os-pubis`, `humerus`, `radius`, `ulna`, `manus`, `ossa-carpi`, `ossa-metacarpi`, `phalanges-manus`, `femur`, `tibia`, `fibula`, `pes`, `talus` (Sprungbein), `ossa-metatarsi` |
| `muskeln-vorn` | `m-trapezius`, `m-latissimus-dorsi`, `m-triceps-brachii`, `m-gastrocnemius`, `m-soleus` (jeweils nur ein schmaler Streifen sichtbar) |
| `muskeln-hinten` | `m-obliquus-externus-abdominis`, `m-brachioradialis` |

Neue Stellen (z. B. Bauchnabel) müssen in den Abbildungen gezeichnet werden (`public/js/bilder/`). Der Test `node --test tests/room.test.mjs` prüft, ob jede `stelle` auf ihrer Abbildung vorkommt.

---

## Datenschutz

- **Gespeichert wird nur:** Vorname mit Anfangsbuchstabe des Nachnamens und die Spielergebnisse. Keine Konten, keine E-Mail-Adressen, keine Cookies, keine Werbung, kein Tracking.
- Die Daten liegen im Klassenraum-Speicher bei Cloudflare und werden **6 Stunden nach der letzten Änderung automatisch gelöscht**. Sofort löschen: **Sitzung → Sitzung beenden und Daten jetzt löschen**.
- Im Browser der Handys speichert die Seite eine zufällige Geräte-Kennung und den zuletzt eingegebenen Namen. Die Übungsseite speichert nur die eigenen Rekorde im Browser.
- Abbildungen, Schriften und Programmbibliotheken liegen im Projekt selbst. Die Seiten laden nichts von Google oder anderen Drittanbietern nach.
- Cloudflare ist ein US-Anbieter. Stimme den Einsatz am besten kurz mit der Schulleitung oder dem Datenschutzbeauftragten ab.

## Kosten

Der kostenlose Cloudflare-Tarif reicht aus (100.000 Anfragen pro Tag). Jedes Handy schickt pro Tipp eine kurze Nachricht. Eine Unterrichtsstunde mit 30 SuS braucht grob 2.000 bis 3.000 Anfragen.

---

## Notlösung ohne Cloudflare: Laptop als Server

1. [Node.js](https://nodejs.org) installieren (Version 18 oder neuer).
2. Das Repository herunterladen (bei GitHub: **Code → Download ZIP**) und entpacken.
3. Im Projektordner ein Terminal öffnen und `node server/local.mjs` eingeben.
4. Die angezeigte Adresse „Im Netz: http://192.168.…:8787/lehrer“ am Laptop öffnen (nicht `localhost`), damit der QR-Code die Netzwerkadresse enthält.

Voraussetzung: Handys und Laptop sind im selben WLAN, und das WLAN erlaubt Verbindungen zwischen den Geräten.

---

## Technik

| Datei | Inhalt |
|---|---|
| `public/js/inhalte.js` | ← die Begriffe (Einfach, Schwer, Abbildung) |
| `public/js/bilder/` | Abbildungen als SVG: `skelett.js`, `muskeln.js`, `organe.js`, Körperumriss in `koerper.js` |
| `public/js/regeln.js` | Regeln, Punkte, Zeiten, Zufall (gilt für Handys, Beamer und Server) |
| `public/js/figur.js` | Abbildung anzeigen, Tipp auswerten (mit Toleranz), Stellen markieren |
| `public/js/spiel.js` | Einzelspiel auf dem Handy (Qualifying und Üben) |
| `public/js/lehrer.js` | Beamer-Seite: Anmeldung, Rangliste, Finale, Siegerehrung |
| `public/js/mitspielen.js` | Handy-Seite: Anmeldung, Qualifying, Finale |
| `public/js/ueben.js` | Übungsseite mit „Erkunden“ |
| `public/js/ton.js` | Töne (Web Audio, ohne Dateien) |
| `public/js/net.js` | WebSocket-Verbindung mit Wiederverbinden und Uhrabgleich |
| `src/room.js` | Raum-Logik einer Klasse (unabhängig vom Server) |
| `src/worker.js` | Cloudflare Worker und Durable Object (ein Raum je Code) |
| `server/local.mjs` | Lokaler Server ohne Zusatzpakete |

Jede antippbare Stelle ist in der Zeichnung eine Gruppe mit `data-s="kennung"`. Gruppen dürfen ineinander liegen: Wer die Hand (`manus`) sucht, darf auch auf die Handwurzel (`ossa-carpi`) tippen. Ein Tipp zählt, wenn die gesuchte Stelle genau dort oder bis zu 11 Bildschirmpunkte daneben liegt.

Im Finale entscheidet der Server, wann ein Begriff beginnt. Beamer und Handys gleichen ihre Uhren mit dem Server ab, damit alle gleichzeitig starten. Die Handys der Finalisten kennen immer nur den aktuellen Begriff, Zuschauer-Handys gar keinen.

### Tests

```
node --test tests/room.test.mjs     # Inhalte, Regeln und Raum-Logik
node tests/e2e.mjs                  # Browser-Durchlauf: Beamer + 5 Handys (Playwright), Bildschirmfotos in tests/ergebnisse/
```

Der Browser-Durchlauf prüft Anmeldung, Qualifying mit richtigen und falschen Tipps und abgelaufener Zeit, Rangliste und Bestwerte (Handy und Beamer gleich), ein Finale mit 4 Personen (Skelett, Schwer) mit Auflösung, Zeitablauf und Platzierungen, ein zweites Finale mit 2 Personen und „Begriff beenden“, die Übungsseite mit „Erkunden“ und dass jeder Begriff auf einem Handy (390 × 780) gut antippbar ist. Außerdem, dass Handys und Übungsseite keinen Ton abspielen.

**Lizenzen:** Schriften Bungee und Rubik unter SIL Open Font License (siehe `public/fonts/`). QR-Code-Generator von Kazuhiko Arase unter MIT-Lizenz (`public/js/qrcode.js`). Das Schullogo gehört der Karoline-Breitinger-Schule.

---

© 2026 Sven Klawitter
