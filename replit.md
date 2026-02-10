# PBallon - AI-Powered Photo Diary Application

## Overview

PBallon is a personal journaling application that transforms photos and descriptions into beautifully written diary entries using AI. The slogan is "Remember every moment, without writing." Users can upload multiple "moments" (photos with context like time, location, and weather), and the system generates cohesive narrative diary entries. The application features a Coral Rose (#FF6F61) color theme with a cute pink balloon logo.

## User Preferences

- Preferred communication style: Simple, everyday language (Korean preferred)
- Logo style: Cute pink balloon icon
- UI colors: Coral Rose (#FF6F61) primary color theme
- No Portfolio feature - diary only

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with shadcn/ui components
- **Animations**: Framer Motion for page transitions
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a standard React SPA pattern with protected routes requiring authentication. Components use the shadcn/ui library (New York style) with extensive Radix UI primitives. The design system uses CSS variables for theming with Coral Rose (#FF6F61) as the primary color.

### Backend Architecture
- **Framework**: Express.js 5 with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Replit Auth via OpenID Connect (passport.js)
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **AI Integration**: OpenAI API (via Replit AI Integrations) for diary generation, mood detection, and song recommendations

The server uses a modular architecture with routes defined in `server/routes.ts` and database operations abstracted in `server/storage.ts`. Express 5 uses `{*param}` wildcard syntax which returns params as arrays.

### Data Model
- **Users**: Managed by Replit Auth, stored in `users` table
- **Entries**: Diary entries with content, date, styleReference, and user association
- **Photos**: Individual photos linked to entries with metadata (description, time, location, weather)
- **SongRecommendations**: Song DB for mood-based recommendations (title, artist, youtubeUrl, mood, genre, tags)
- **Quotes**: Admin-managed inspirational quotes (text, author, comment, isActive)
- **EmojiReactions**: User emoji feedback on recommendations for AI learning (userId, entryId, recommendationType, recommendationId, emoji)
- **Sessions**: Authentication sessions stored in PostgreSQL

### API Structure
- `GET /api/entries` - List user's diary entries
- `GET /api/entries/:id` - Get single entry with photos
- `POST /api/entries` - Create new entry (generates AI diary content)
- `DELETE /api/entries/:id` - Remove entry
- `GET /api/entries/:id/recommendations` - Get mood-based song/YouTube recommendations
- `GET /api/entries/:id/reactions` - Get emoji reactions for entry recommendations
- `POST /api/reactions` - Save/update emoji reaction on a recommendation
- `GET /api/quotes` - Get active quotes (for landing page display)
- `GET /api/admin/quotes` - Get all quotes (admin only)
- `POST /api/admin/quotes` - Create quote (admin only)
- `PUT /api/admin/quotes/:id` - Update quote (admin only)
- `DELETE /api/admin/quotes/:id` - Delete quote (admin only)
- `GET /api/songs` - List all song recommendations
- `GET /api/songs/mood/:mood` - Get songs by mood
- `POST /api/songs` - Add song recommendation (admin only)
- `PUT /api/songs/:id` - Update song (admin only)
- `DELETE /api/songs/:id` - Remove song (admin only)
- `GET /api/admin/check` - Check if user is admin
- `POST /api/suggest-styles` - AI-powered writing style suggestions

### Admin System
- Admin user is configured via `ADMIN_USER_ID` environment variable
- Admin pages: `/admin/songs` for song management, `/admin/quotes` for quote management
- Supports CRUD operations for songs and quotes

### SNS Sharing
- Share button on diary entry view page
- Supports: Copy to clipboard, X (Twitter), Facebook sharing
- Native Web Share API support on mobile devices

### Emoji Reaction Learning System
- Users react to song/YouTube recommendations with emojis (❤️, 🔥, 😍, 😢, 😴, 👎)
- Reactions are stored in DB and fed back to AI for improved future recommendations
- AI considers past liked/disliked content when generating new recommendations

### Song & YouTube Recommendations
- AI detects diary mood and recommends songs
- Each recommendation includes both Spotify and YouTube links
- Spotify playlists → AI selection → Spotify search → AI fallback (in order)
- Single song recommended per diary entry

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
- **OpenAI API** (via Replit AI Integrations): Used for generating diary content, mood detection, song recommendations, and style suggestions
- Model: gpt-4o

### UI Components
- **Radix UI**: Headless component primitives
- **shadcn/ui**: Pre-styled component library built on Radix
- **Lucide React**: Icon library

### Fonts (External)
- Google Fonts: Lora (serif), DM Sans (sans-serif), Playfair Display (display)

## Recent Changes
- Rebranded from CAMELEON to PBallon with pink balloon logo
- Updated UI colors to Coral Rose (#FF6F61) theme
- Added SNS sharing feature (Twitter/X, Facebook, clipboard copy, native share)
- Added YouTube links alongside Spotify for song recommendations
- Added emoji reaction system for AI learning on recommendations
- Added admin quotes management page (CRUD with active/inactive toggle)
- Landing page now fetches quotes from DB (admin-managed) with fallback defaults
- Reduced song recommendations to 1 per diary entry
- AI uses past emoji reaction history to improve future recommendations
