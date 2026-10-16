# Live Stream Sight

Dashboard web pentru supravegherea video a unei locuințe: 4 camere IP Hikvision, convertite din RTSP în HLS
de [go2rtc](https://github.com/AlexxIT/go2rtc) și afișate într-o aplicație React cu hls.js.

Proiect universitar în care aplicația a fost refactorizată pe trei principii SOLID. Descrierea completă a
modificărilor (ce a fost înlocuit și cu ce) este în [`AJUSTARI-SOLID.txt`](./AJUSTARI-SOLID.txt).

## Funcționalități

- Grilă cu camerele, căutare după nume sau locație, indicator Live / Offline
- Vizualizare fullscreen cu sunet pentru o cameră
- Control de înregistrare per cameră: **Auto** (declanșat de mișcare, pe server) sau **Manual** (buton în UI)
- Pagină de setări: nume, locație și URL-ul HLS pentru fiecare cameră (salvate în `localStorage`)
- Fallback pe placeholder când camera e offline, nu are URL sau redarea eșuează

## Tehnologii

TanStack Start + TanStack Router, React 19, TypeScript, Tailwind CSS 4, hls.js, Vite 8, Nitro (`node-server`).
Backend de streaming: go2rtc rulat pe un server din rețeaua privată (acces prin Tailscale).

## Arhitectura

```
Browser                                         Server (VAIO, Ubuntu)
───────                                         ─────────────────────
Dashboard (această aplicație, portul 3000)      go2rtc (portul 1984)
   │                                               ▲        │
   └──────── HLS (.m3u8) prin Tailscale ───────────┘        │ RTSP
                                                            ▼
                                                   4 camere Hikvision
```

Structura frontend-ului, pe responsabilități:

```
src/
├── routes/
│   ├── index.tsx                  pagina principală: stare, căutare, layout
│   └── settings.tsx               setări camere / înregistrare / notificări
├── components/
│   ├── CameraTile.tsx             un card de cameră din grilă
│   ├── CameraModal.tsx            vizualizare fullscreen
│   ├── CameraPlayer.tsx           decide ce se afișează: video sau placeholder
│   ├── StreamPlaceholder.tsx      aspectul „fără imagine"
│   ├── RecordingControl.tsx       alege controlul potrivit modului camerei
│   └── recording/
│       ├── registry.ts            registru: mod de înregistrare -> componentă
│       ├── AutoRecordingBadge.tsx
│       ├── ManualRecordingButton.tsx
│       └── types.ts
├── hooks/
│   └── use-video-stream.ts        legătura cu React a unui stream
└── lib/
    ├── use-cameras.ts             accesul la lista de camere (localStorage)
    ├── defaults.ts                camere și setări implicite
    ├── types.ts                   tipuri de date
    └── video/
        ├── video-engine.ts        abstracția VideoEngine
        ├── hls-engine.ts          implementarea cu hls.js
        └── start-playback.ts     ciclul de viață al unui stream
```

Fluxul unui stream:

```
CameraTile ─► CameraPlayer ─► useVideoStream ─► startPlayback ─► VideoEngine (interfață)
                                                                      ▲
                                                                 HlsEngine (hls.js)
```

## Principii SOLID utilizate

### S — Principiul Responsabilității Unice (Single Responsibility Principle)

Fiecare modul are un singur motiv de schimbare. `routes/index.tsx` (217 linii, făcea totul) a fost împărțit în
`CameraTile`, `CameraModal` și `RecordingControl`. `CameraPlayer` a fost împărțit în `useVideoStream`
(legătura cu React), `startPlayback` (ciclul de viață al streamului) și `StreamPlaceholder` (aspect).

### O — Principiul Deschis/Închis (Open/Closed Principle)

Codul este deschis pentru extindere, dar închis pentru modificare. Controlul de înregistrare folosea un `if` pe
modul camerei; acum este un registru `Record<RecordingMode, Componentă>`. Un mod nou înseamnă o componentă nouă
și o linie în `recording/registry.ts`; restul codului nu se modifică. TypeScript refuză build-ul dacă un mod este
adăugat și uitat în registru.

### D — Principiul Inversării Dependențelor (Dependency Inversion Principle)

Modulele de nivel înalt depind de abstracții. `CameraPlayer` nu mai importă `hls.js`, ci interfața `VideoEngine`;
implementarea cu hls.js este izolată în `hls-engine.ts`. Motorul se poate înlocui sau simula în teste. Accesul la
lista de camere trece prin hook-ul `useCameras`, nu prin cheia `localStorage` repetită în trei locuri (formă
ușoară a principiului, nu o interfață completă de tip repository).

## Rulare

Cerințe: Node.js `>= 20.19` sau `>= 22.12`.

```bash
npm install
npm run dev          # dezvoltare (portul 8080)
npm run build        # build de producție
node .output/server/index.mjs   # pornește aplicația construită (portul 3000, PORT=... pentru alt port)
```

Verificări:

```bash
npm run typecheck    # TypeScript pentru aplicație și teste
npm test             # 9 teste, fără browser, fără camere, fără go2rtc
npm run lint
```

## Configurare

URL-urile HLS implicite sunt în `src/lib/defaults.ts` (variabila `GO2RTC_BASE`) și se pot modifica oricând din
pagina **Settings → Cameras**, fără modificări de cod. Fiecare cameră trebuie să existe în go2rtc sub numele
folosit în URL (`.../api/stream.m3u8?src=camera_01`).

## Teste

| Fișier | Ce verifică | Principiu |
|---|---|---|
| `test/start-playback.test.ts` | pornire cu URL-ul corect, oprire înainte și după atașare, erori ignorate după oprire, motor care nu poate reda, `attach` care eșuează | Responsabilitate Unică + Inversarea Dependențelor |
| `test/recording-registry.test.ts` | fiecare mod are control; mod necunoscut din `localStorage` cade pe butonul manual | Deschis/Închis |

## Limitări

- Redarea cu camere reale trebuie verificată manual în rețeaua proprie.
- Componentele React nu au teste de randare; testele acoperă logica extrasă.
- Dispozitivele fără acces la rețeaua privată (Tailscale) nu pot reda streamurile.
