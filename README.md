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
| `npm run preview` | Previzualizare build de producție |

## Calitatea codului

- **ESLint** — reguli recomandate pentru TypeScript și React Hooks
- **Prettier** — formatare consistentă (fără punct și virgulă, ghilimele simple, 100 caractere/linie)

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
│   │   └── DashboardPage.tsx
│   └── profile/
│       └── ProfilePage.tsx
└── store/
    └── auth.store.ts        # Zustand store (accessToken, refreshToken, user, initialized)
```
