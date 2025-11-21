# CRAWL.STORIES - Platform for Interactive Chat Stories

## Overview
CRAWL.STORIES is a Russian-language platform for creating and reading interactive stories in chat/messenger format. The platform allows stories to be displayed as if they were real chat conversations, creating an immersive reading experience.

## Project Type
**Static Frontend Website** with Firebase/Firestore backend

## Architecture

### Frontend (Static HTML/CSS/JS)
- **index.html** - Main landing page with story catalog and category filtering
- **reader.html** - Interactive chat-style story reader with autoplay features
- **admin.html** - Admin panel for managing stories, episodes, characters, and themes

### Backend (Firebase/Firestore)
The project uses Firebase for:
- **Database**: Firestore collections for stories, episodes, messages, characters, settings
- **Authentication**: Firebase Auth for admin login
- **Security**: Firestore rules to protect admin operations

### Firestore Collections
- `stories` - Story metadata (title, description, category, publish status)
- `episodes` - Story chapters/episodes with episode numbers
- `episode_messages` - Individual chat messages within episodes
- `story_characters` - Character definitions (name, avatar, type)
- `settings` - Global settings (themes, seasonal effects)
- `admins` - Admin user permissions (UID-based)

### Key Features
1. **Chat-style story reader** with message bubbles (user/other/system/thought)
2. **Autoplay mode** with configurable speed
3. **Category filtering** (Fantasy, Sci-Fi, Horror, Adventure, Mystery)
4. **Publishing workflow** (published, scheduled, coming soon)
5. **Seasonal themes** with visual effects (New Year, Halloween, Valentine's, Fear)
6. **Admin panel** for content management
7. **Progress tracking** and chapter navigation

## Technology Stack
- Pure JavaScript (no frameworks)
- Firebase SDK (v9.6.0 compat mode)
- CSS custom properties for theming
- http-server for local development

## Development Setup

### Server Configuration
- **Development Server**: http-server on port 5000
- **Host**: 0.0.0.0 (required for Replit proxy)
- **Caching**: Disabled (-c-1 flag) for proper iframe preview
- **CORS**: Enabled for Firebase communication

### Workflow
```bash
npx http-server -p 5000 -a 0.0.0.0 -c-1 --cors
```

## Firebase Configuration
The project connects to a pre-configured Firebase project:
- **Project ID**: crawl-stories
- **Auth Domain**: crawl-stories.firebaseapp.com
- **API Key**: Public client-side key (safe to commit)

Note: Firebase config is already embedded in HTML files. No environment variables needed for basic functionality.

## Security Model
- **Public access**: Read stories, episodes, and published content
- **Admin access**: Create/update/delete content, manage settings
- **Firestore Rules**: Enforce admin-only writes via `admins` collection
- **Admin verification**: Based on Firebase Auth UID

## File Structure
```
/
├── index.html              # Main catalog page
├── reader.html             # Story reader
├── admin.html              # Admin panel (2800+ lines)
├── firestore.rules         # Security rules for Firestore
├── FIRESTORE_RULES_AND_ADMIN_SETUP.md  # Setup instructions
├── README.md               # Russian documentation
├── package.json            # Node.js dependencies
└── .gitignore              # Git ignore rules
```

## Deployment
This is a static site suitable for:
- GitHub Pages (original deployment target)
- Replit Static Deployment
- Any static hosting service (Netlify, Vercel, etc.)

## Recent Changes

- **2025-11-21**: Major feature update - Story Status & Visibility System
  - Implemented comprehensive story status system (Announced, New, Ongoing, Finished, Abandoned)
  - Added visibility control (Public, Closed, Hidden) with proper filtering logic
  - Updated Firestore structure: plannedEpisodes, status, firstEpisodeDate, visibility, episodesCount, lastEpisodeDate
  - Added search functionality by title/description on main page
  - Fixed seasonal themes - snow now displays only during winter theme (New Year), not always
  - Implemented status-based filtering in index.html (all statuses including abandoned)
  - Added announcement-only view for closed stories
  - Updated admin panel with full status/visibility management
  - Improved category filters with search query reset on category change

- **2024-11-20**: Initial Replit setup
  - Installed Node.js 20 and http-server
  - Configured workflow for port 5000 with proper flags
  - Added .gitignore for Node.js projects
  - Created project documentation

## User Preferences
- Implement all features according to FULL_SPEC.txt
- Focus on status/visibility system correctness
- Seasonal effects should be theme-appropriate (snow only in winter)

## Notes
- The project is fully self-contained - all HTML, CSS, and JS are in the HTML files
- No build process required - it's ready to serve as-is
- Firebase backend is already set up externally
- Admin panel requires Firebase Auth login to manage content
