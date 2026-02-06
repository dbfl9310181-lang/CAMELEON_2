# Tabscape - AI-Powered Photo Diary Application

## Overview

Tabscape is a personal journaling application that transforms photos and descriptions into beautifully written diary entries using AI. The slogan is "Remember every moment, without writing." Users can upload multiple "moments" (photos with context like time, location, and weather), and the system generates cohesive narrative diary entries. The application features a warm, paper-like aesthetic with serif typography designed to feel like a traditional journal.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with shadcn/ui components
- **Animations**: Framer Motion for page transitions
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a standard React SPA pattern with protected routes requiring authentication. Components use the shadcn/ui library (New York style) with extensive Radix UI primitives. The design system uses CSS variables for theming with a warm, paper-like color palette.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Replit Auth via OpenID Connect (passport.js)
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **AI Integration**: OpenAI API (via Replit AI Integrations) for diary generation and image processing

The server uses a modular architecture with routes defined in `server/routes.ts` and database operations abstracted in `server/storage.ts`. The application includes pre-built integration modules in `server/replit_integrations/` for authentication, chat, audio, image generation, and batch processing.

### Data Model
- **Users**: Managed by Replit Auth, stored in `users` table
- **Entries**: Diary entries with content, date, and user association
- **Photos**: Individual photos linked to entries with metadata (description, time, location, weather)
- **Sessions**: Authentication sessions stored in PostgreSQL
- **Conversations/Messages**: Chat history for AI conversations (optional feature)

### API Structure
Routes are defined declaratively in `shared/routes.ts` with Zod schemas for validation:
- `GET /api/entries` - List user's diary entries
- `GET /api/entries/:id` - Get single entry with photos
- `POST /api/entries` - Create new entry (generates AI diary content)
- `DELETE /api/entries/:id` - Remove entry

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
- Required environment variables: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`

### AI Services
- **OpenAI API** (via Replit AI Integrations): Used for generating diary content from photo descriptions
- Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
- Supports text generation, image generation (`gpt-image-1`), and speech-to-text

### UI Components
- **Radix UI**: Headless component primitives (dialogs, dropdowns, tooltips, etc.)
- **shadcn/ui**: Pre-styled component library built on Radix
- **Lucide React**: Icon library

### Fonts (External)
- Google Fonts: Lora (serif), DM Sans (sans-serif), Playfair Display (display)