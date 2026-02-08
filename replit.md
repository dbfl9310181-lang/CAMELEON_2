# CAMELEON - AI-Powered Photo Diary Application

## Overview

CAMELEON is a personal journaling application that transforms photos and descriptions into beautifully written diary entries using AI. The slogan is "Remember every moment, without writing." Users can upload multiple "moments" (photos with context like time, location, and weather), and the system generates cohesive narrative diary entries. The application features a green-teal-purple color theme inspired by the chameleon mascot logo, with a cute Haribo gummy-bear style design.

## User Preferences

- Preferred communication style: Simple, everyday language (Korean preferred)
- Logo style: Cute, Haribo gummy bear-like chameleon, no white eyes, abstract
- UI colors: Green-teal-purple gradient theme, soft/not eye-straining
- No Portfolio feature - diary only

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with shadcn/ui components
- **Animations**: Framer Motion for page transitions
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a standard React SPA pattern with protected routes requiring authentication. Components use the shadcn/ui library (New York style) with extensive Radix UI primitives. The design system uses CSS variables for theming with a green-teal-purple color palette.

### Backend Architecture
- **Framework**: Express.js 5 with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Replit Auth via OpenID Connect (passport.js)
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **AI Integration**: OpenAI API (via Replit AI Integrations) for diary generation and mood detection

The server uses a modular architecture with routes defined in `server/routes.ts` and database operations abstracted in `server/storage.ts`. Express 5 uses `{*param}` wildcard syntax which returns params as arrays.

### Data Model
- **Users**: Managed by Replit Auth, stored in `users` table
- **Entries**: Diary entries with content, date, and user association
- **Photos**: Individual photos linked to entries with metadata (description, time, location, weather)
- **SongRecommendations**: YouTube/song DB for mood-based recommendations (title, artist, youtubeUrl, mood, genre, tags)
- **Sessions**: Authentication sessions stored in PostgreSQL

### API Structure
- `GET /api/entries` - List user's diary entries
- `GET /api/entries/:id` - Get single entry with photos
- `POST /api/entries` - Create new entry (generates AI diary content)
- `DELETE /api/entries/:id` - Remove entry
- `GET /api/entries/:id/recommendations` - Get mood-based song recommendations for an entry
- `GET /api/songs` - List all song recommendations
- `GET /api/songs/mood/:mood` - Get songs by mood
- `POST /api/songs` - Add song recommendation (admin only)
- `PUT /api/songs/:id` - Update song (admin only)
- `DELETE /api/songs/:id` - Remove song (admin only)
- `GET /api/admin/check` - Check if user is admin

### Admin System
- Admin user is configured via `ADMIN_USER_ID` environment variable
- Admin-only page at `/admin/songs` for managing YouTube/song recommendation DB (Notion-style table)
- Supports CRUD operations for song recommendations

### Language Detection
- AI automatically detects the language of user's diary descriptions
- Output is generated in the same language as the input (supports all languages)

### Build System
- Development: Vite dev server with HMR, proxied through Express
- Production: Vite builds to `dist/public`, esbuild bundles server to `dist/index.cjs`
- Database migrations: Drizzle Kit with `db:push` command

## External Dependencies

### Database
- **PostgreSQL**: Primary database accessed via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database access with schema defined in `shared/schema.ts`

### Authentication
- **Replit Auth**: OpenID Connect authentication via Replit's identity provider

### AI Services
- **OpenAI API** (via Replit AI Integrations): Used for generating diary content and mood detection
- Model: gpt-4o

### UI Components
- **Radix UI**: Headless component primitives
- **shadcn/ui**: Pre-styled component library built on Radix
- **Lucide React**: Icon library

### Fonts (External)
- Google Fonts: Lora (serif), DM Sans (sans-serif), Playfair Display (display)

## Recent Changes
- Rebranded from Tabscape to CAMELEON with cute chameleon gummy-bear logo
- Updated UI colors to green-teal-purple gradient theme
- Removed Portfolio feature (diary only)
- Added universal language detection for diary output
- Added YouTube/song recommendation system with admin management page
- Added mood-based song recommendations on diary entry view
- Moved quotes to top of diary entry page with AI conversational commentary style
- Added landing state with clickable "+" card before showing diary form
- Changed photo upload icon to camera (Instagram-style)
- Added styleReference column to entries table for saving writing style per diary
- Added AI-powered writing style suggestion feature (POST /api/suggest-styles)
- Writing Style input now has "AI Suggest" button that recommends 5 influencer/celebrity styles based on descriptions
