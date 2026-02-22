# ZRH Bag Check

## Overview

ZRH Bag Check is a mobile-first application that helps travelers at Zurich Airport determine whether specific items are allowed in their hand baggage or checked baggage. Users can photograph an item with their camera, select an item category (batteries, liquids, sharp objects, etc.), answer follow-up questions about the item's properties (e.g., mAh, voltage, volume), and receive a clear verdict with color-coded results (allowed/conditional/not allowed) for both hand and checked baggage.

The app is built with Expo (React Native) for the frontend and Express for the backend API server, designed to run on Replit with PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture
- **Routing**: Expo Router with file-based routing (`app/` directory). Screens include: Home (`index`), Camera, Analyzing (AI), Categories, Questions wizard, Verdict, and History Detail
- **State Management**: React Context (`ScanProvider` in `lib/scan-context.tsx`) manages the active scan session (photo, category, answers, verdict, aiAnalysis). React Query (`@tanstack/react-query`) is available for server state management
- **Local Storage**: `@react-native-async-storage/async-storage` stores scan history on-device (`lib/storage.ts`). History is capped at 50 records
- **Fonts**: Inter font family (400, 500, 600, 700 weights) via `@expo-google-fonts/inter`
- **Animations**: `react-native-reanimated` for transitions and progress animations
- **Haptics**: `expo-haptics` for tactile feedback on interactions
- **Camera**: `expo-camera` for photographing items. Photos are optional — users can skip to category selection

### Core Application Flow

1. Home screen shows a "Scan Item" button and recent scan history
2. Camera screen captures a photo (optional - skip goes to manual category selection)
3. AI Analyzing screen (`app/analyzing.tsx`) sends photo to `/api/analyze-image` endpoint, which uses OpenAI Vision (gpt-5.2) to identify the item, match it to a category, and extract specs (mAh, voltage, volume, blade length). Shows results with confidence indicator
4. User can accept AI suggestion (auto-fills category + answers) or override to manual category selection
5. Categories screen presents a searchable, grouped list of item types (fallback/manual path)
6. Questions wizard walks through category-specific follow-up questions (pre-filled by AI when possible)
7. Verdict screen shows color-coded results for hand baggage and checked baggage
8. Results are saved to local storage for history

### Rules Engine

- All item categories, questions, and verdict logic are defined in `constants/rules.ts` as pure TypeScript (no database dependency)
- Each `ItemCategory` has a `getVerdict()` function that computes the verdict based on user answers
- Categories are grouped into types: Batteries & Power, Liquids, Sharp Objects, Electronics, Lighters, Medical Devices, Tools, Sports Equipment, etc.
- Verdict statuses: `allowed` (green), `conditional` (amber), `not_allowed` (red)

### Backend (Express)

- **Framework**: Express 5 running on Node.js (`server/index.ts`)
- **Purpose**: Currently minimal — serves as API server and static file host for production builds. Routes are registered in `server/routes.ts` (currently empty, prefixed with `/api`)
- **CORS**: Configured to allow Replit dev domains and localhost origins
- **Storage**: `server/storage.ts` has an in-memory storage implementation with a User CRUD interface (template code, not actively used by the app's core features)
- **Production**: Built with esbuild, serves static Expo web build

### Database (PostgreSQL + Drizzle)

- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts` — currently only has a `users` table (template). The app's item rules and categories live in `constants/rules.ts` as static data, not in the database
- **Config**: `drizzle.config.ts` reads `DATABASE_URL` environment variable
- **Migrations**: Output to `./migrations` directory
- **Push**: `npm run db:push` to sync schema

### Build & Development

- **Dev**: Two processes run — `expo:dev` for the Expo dev server and `server:dev` for the Express backend (via `tsx`)
- **Production build**: `expo:static:build` creates a static web bundle, `server:build` bundles the server with esbuild, `server:prod` runs the production server
- **TypeScript**: Strict mode enabled, path aliases `@/*` and `@shared/*`

## External Dependencies

- **PostgreSQL**: Required for database (via `DATABASE_URL` environment variable). Currently only has a users table template
- **Expo SDK 54**: Core mobile framework with camera, haptics, image picker, location, and other native modules
- **React Query**: Server state management (configured but lightly used since most data is local)
- **AsyncStorage**: Client-side persistent storage for scan history
- **Drizzle ORM + drizzle-zod**: Database ORM and schema validation
- **pg**: PostgreSQL client driver
- **Zurich Airport Rules**: The rules engine is based on regulations from flughafen-zuerich.ch (hardcoded in `constants/rules.ts`)