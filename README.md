# Agri Front

Frontend React + TypeScript + Vite pentru managementul mașinilor agricole, operatorilor și asignărilor.

## Tehnologii

- **React 19** cu React Compiler
- **TypeScript 6**
- **Vite 8** — build rapid
- **MUI 9** — componente UI (Grid v2, `sx` props, `slotProps`)
- **@mui/x-date-pickers** — DatePicker cu AdapterDayjs, locale `ro`
- **React Router 7** — rutare cu layout routes (`GuestRoute` / `ProtectedRoute`)
- **TanStack Query 5** — data fetching și cache
- **Axios** — client HTTP cu interceptor JWT + refresh automat
- **React Hook Form 7 + Zod 4** — formulare și validare, `zodResolver`
- **Zustand 5 + persist** — state management (access token, refresh token, user, initialized)
- **Day.js** — manipulare date
- **Notistack** — notificări toast

## Funcționalități implementate

### Autentificare
- Înregistrare, login, logout
- Refresh automat al access token-ului (interceptor Axios)
- Resetare parolă prin email (forgot/reset password)
- Guard împotriva race condition la refresh pe page load (`initialized` flag în Zustand)

### Profil utilizator
- Vizualizare date profil: nume, email, rol, dată naștere, poză de profil
- Editare profil (mod read-only implicit, activat prin buton "Editează")
- Încărcare/schimbare poză de profil direct din pagina de profil și în avatar-ul din sidebar/topbar
- DatePicker cu locale română pentru data nașterii

### Dashboard
- Salut personalizat cu prenumele din profil
- Banner hero cu număr de alocări active din API
- Carduri KPI din `/api/dashboard/cards` (Total mașini, Mașini active, Total operatori, Alocări active) cu bară de progres și tendință
- Dashboard dedicat pentru utilizatorii cu rol `operator`, sub formă de panou de tură: lucrarea curentă, fișa lucrării, agenda zilei și sumar operațional
- Operatorii au acces doar la dashboard și la operațiunile pe teren filtrate pe userul curent; după login se curăță cache-ul user-scoped pentru dashboard, profil, permisiuni și operațiuni pe teren, iar widgetul meteo nu navighează pentru rolurile fără acces la terenuri
- Pagina de view pentru o operațiune pe teren folosește un ecran operațional dedicat, cu progres, echipare, instrucțiuni, carduri de resurse cu modal de detalii și checklist care afișează `Start lucrare` după completare
- Activitate recentă (list)
- Statistici rapide

### Layout & navigare
- Sidebar responsive (permanent pe desktop, drawer pe mobil)
- Widget meteo în sidebar pentru Cantemir, alimentat prin endpointul backend `/api/weather/current`, cu navigare către `/weather-map`
- Avatar utilizator în sidebar și topbar din datele de profil
- Meniu utilizator în topbar (Profil, Setări, Deconectare)
- Navigare cu `aria-current="page"` pe itemul activ

### Hartă meteo
- Pagina `/weather-map` afișează terenurile pe OpenStreetMap folosind geometriile GeoJSON existente
- Include vremea curentă pentru Cantemir, meteo per teren pe baza centrului poligonului și strat radar gratuit RainViewer pentru precipitații
- Are straturi selectabile pentru temperatură, umiditate, vânt și precipitații, calculate din datele backend fără expunerea cheilor API în frontend
- Radarul RainViewer este controlat prin switch separat; când este activ, harta blochează zoom-ul la nivelul suportat de radar

### Accesibilitate (WCAG AA)
- Toate elementele interactive au `aria-label`
- Landmark-uri corecte (`<main>`, `<nav>`)
- Contrast minim 4.5:1 pentru text normal, 3:1 pentru UI components
- Elemente decorative marcate cu `aria-hidden="true"`
- Carduri KPI ca `<article>` cu `aria-label` complet

## Configurare

1. Instalează dependențele:

```bash
npm install
```

2. Copiază fișierul de variabile de mediu:

```bash
cp .env.example .env
```

3. Pornește serverul de dezvoltare:

```bash
npm run dev
```

## Variabile de mediu

| Variabilă | Descriere | Implicit |
|-----------|-----------|----------|
| `VITE_API_BASE_URL` | URL-ul de bază al API-ului backend | `http://localhost:8080/api` |

## Scripturi disponibile

| Comandă | Descriere |
|---------|-----------|
| `npm run dev` | Pornește serverul de dezvoltare |
| `npm run build` | Build de producție (TypeScript + Vite) |
| `npm run lint` | Verificare ESLint |
| `npm test` | Rulează testele (Vitest) |
| `npm run test:watch` | Testele în mod watch |
| `npm run test:coverage` | Testele + raport de coverage în `coverage/` (citit de SonarQube) |
| `npm run preview` | Previzualizare build de producție |

## Calitatea codului

- **ESLint** — reguli recomandate pentru TypeScript și React Hooks
- **Prettier** — formatare consistentă (fără punct și virgulă, ghilimele simple, 100 caractere/linie)
- **Vitest + Testing Library** — teste unitare pentru logica aplicației (vezi mai jos)
- **SonarQube** — analiză statică (bug-uri, vulnerabilități, cod duplicat), rulată local

### Teste

```bash
npm test                 # toate testele
npm run test:coverage    # + coverage/lcov.info
npx vitest run src/hooks # doar un director
```

Testele stau lângă codul testat (`*.test.ts` / `*.test.tsx`) și rulează în `jsdom`, configurat în `vite.config.ts` (secțiunea `test`). Ajutoarele comune sunt în `src/test/`:
- `setup.ts` — matcher-ele `jest-dom`, curățarea DOM-ului și a `localStorage` după fiecare test
- `utils.tsx` — `renderWithProviders` / `createWrapper` (react-query + router), `setAuth` (pune store-ul în starea „logat”), `expectQueryData`, `expectQueryDisabled`, `runMutation` (rulează o mutație și întoarce cheile invalidate)

Modulele din `src/api/` se înlocuiesc cu `vi.mock('../api/x.api')`, deci hook-urile se testează fără server. Interceptorii din `axios.ts` se testează cu un adaptor fals (refresh de token, coadă de cereri, delogare).

**Ce nu intră în coverage** (listat în `vite.config.ts` și `sonar-project.properties`): `src/pages/`, `src/layouts/` și fișierele de bootstrap (`main.tsx`, `App.tsx`, rutele). Sunt UI pur cu MUI, hărți și grafice; se măsoară logica din `api/`, `hooks/`, `schemas/`, `store/`, `utils/`, `components/` și `routes/routeConfig.ts`.

### Analiză SonarQube

SonarQube rulează în `docker-compose`-ul din `agri-api`, iar comenzile se dau de acolo. Setup-ul complet (prima pornire, token) e descris în README-ul din `agri-api`.

```bash
cd ../agri-api
make sonar-up      # pornește SonarQube (dacă nu rulează deja)
make sonar-front   # rulează testele cu coverage și analizează frontend-ul
```

Rezultatele se văd la http://localhost:9000, la proiectul **Agri Front**.

Configurarea analizei e în `sonar-project.properties`. Excepțiile de reguli se pun acolo, cu motivul în comentariu. Excepție existentă: `Math.random()` din `src/pages/auth/AuthLayout.tsx`, care poziționează doar particule decorative și nu e folosit în scop de securitate.

## Structura proiectului

```
src/
├── App.tsx                  # Rute principale (GuestRoute / ProtectedRoute)
├── main.tsx                 # Punct de intrare
├── theme.ts                 # Temă MUI (culori, tipografie)
├── api/
│   ├── axios.ts             # Client Axios + interceptor refresh
│   ├── auth.api.ts          # Endpoints autentificare
│   └── profile.api.ts       # Endpoints profil
├── components/
│   ├── AppLogo.tsx
│   └── AuthInitializer.tsx  # Refresh token la page load, setează `initialized`
├── hooks/
│   ├── useAuth.ts           # useLogin, useLogout, useRegister etc.
│   └── useProfile.ts        # useProfile, useUpdateProfile, useUploadPhoto
├── layouts/
│   └── DashboardLayout.tsx  # Sidebar + Topbar + <Outlet />
├── pages/
│   ├── auth/
│   │   ├── AuthLayout.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   └── ResetPasswordPage.tsx
│   ├── dashboard/
│   │   ├── DashboardPage.tsx
│   │   └── OperatorDashboard.tsx
│   └── profile/
│       └── ProfilePage.tsx
└── store/
    └── auth.store.ts        # Zustand store (accessToken, refreshToken, user, initialized)
```
