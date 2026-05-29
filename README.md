# Agri Front

Frontend React + TypeScript + Vite.

## Tehnologii

- **React 19** cu React Compiler
- **TypeScript 6**
- **Vite 8** — build rapid
- **MUI 9** — componente UI
- **React Router 7** — rutare
- **TanStack Query** — data fetching și cache
- **Axios** — client HTTP
- **React Hook Form + Zod** — formulare și validare
- **Zustand** — state management
- **Notistack** — notificări
- **Day.js** — manipulare date

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

Definite în `.env.example`:

| Variabilă | Descriere | Implicit |
|-----------|-----------|----------|
| `VITE_API_BASE_URL` | URL-ul de bază al API-ului backend | `http://localhost:8080` |
| `VITE_APP_NAME` | Numele aplicației | `Agri Frontend` |
| `VITE_APP_PORT` | Portul serverului de dezvoltare | `3000` |

## Scripturi disponibile

| Comandă | Descriere |
|---------|-----------|
| `npm run dev` | Pornește serverul de dezvoltare |
| `npm run build` | Build de producție (TypeScript + Vite) |
| `npm run lint` | Verificare ESLint |
| `npm run format` | Formatare automată cu Prettier |
| `npm run format:check` | Verifică formatarea fără a modifica fișierele |
| `npm run preview` | Previzualizare build de producție |

## Calitatea codului

- **ESLint** — reguli recomandate pentru TypeScript și React Hooks
- **Prettier** — formatare consistentă (fără punct și virgulă, ghilimele simple, 100 caractere/linie)

## Structura proiectului

```
src/
├── App.tsx          # Componenta principală
├── main.tsx         # Punct de intrare
public/              # Fișiere statice
```
