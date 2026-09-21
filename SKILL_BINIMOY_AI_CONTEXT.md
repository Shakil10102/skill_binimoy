# SKILL BINIMOY — COMPLETE PROJECT SPECIFICATION & AI CONTEXT GUIDE

> **Target Audience**: AI Agents (ChatGPT, Claude, Cursor, Gemini, Copilot) & Developers.  
> **Purpose**: This document contains the end-to-end technical architecture, complete database schema, REST API documentation, WebRTC signaling protocol, frontend structure, and deployment instructions for the **Skill Binimoy** peer-to-peer skill exchange platform. Feed this entire file into any AI to provide complete context of the codebase.

---

## 1. PROJECT OVERVIEW

- **Project Name**: Skill Binimoy ("দক্ষতা বিনিময়" — Skill Exchange)
- **Concept**: A collaborative, peer-to-peer knowledge and skill-swapping platform where users exchange their skills directly with others without financial transactions (e.g., User A teaches Python in exchange for User B teaching Graphic Design).
- **Core Value Proposition**:
  - Direct 1-on-1 skill exchange proposals.
  - Verification restricted to `@gmail.com` accounts via 6-digit OTP codes.
  - Scheduled 20-minute exchange sessions.
  - In-browser WebRTC 1-on-1 Audio and Video calling with custom synthesized ringtones (no third-party meeting accounts or plugins needed).
  - Direct and group chat messaging.
  - "Binimoy AI" — an in-app AI assistant powered by Google Gemini (gemini-1.5-flash) to guide users on skill roadmaps.

---

## 2. TECHNOLOGY STACK

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 4.19.2
- **Database**: Google Firebase Cloud Firestore (via `firebase-admin` v12.0.0)
- **Authentication**: Custom JWT (`jsonwebtoken` v9.0.2) + Passwords hashed with `bcrypt` v5.1.1
- **Email Service**: Brevo (Sendinblue) Transactional Email API via HTTPS `fetch`
- **AI Integration**: Google Gemini AI API (`gemini-1.5-flash`) via HTTPS `fetch`
- **Signaling**: Firestore-based WebRTC signaling engine for peer-to-peer media streaming

### Frontend
- **Architecture**: Multi-Page Application (MPA) using Vanilla HTML5, CSS3, and modern JavaScript (ES6+).
- **Styling**: Pure CSS (No Tailwind, No Bootstrap). CSS Custom Variables, Glassmorphism, Responsive CSS Grid & Flexbox.
- **Audio Synthesis**: Native Web Audio API (synthesizes incoming and outgoing telephone/messenger ringtone chimes in real time without audio assets).
- **Media**: HTML5 `navigator.mediaDevices.getUserMedia` + WebRTC `RTCPeerConnection` with Google Public STUN servers.
- **Client Configuration**: Dynamic host detection (`window.location.hostname`) switching between local (`http://localhost:5000`) and cloud backend (`https://skill-binimoy-backend.onrender.com`).

---

## 3. REPOSITORY FOLDER STRUCTURE

```
skill_binimoy-main/
├── SKILL_BINIMOY_AI_CONTEXT.md       # Master AI context documentation (this file)
└── v3/
    ├── backend/
    │   ├── server.js                 # Express entrypoint, CORS, JSON limit (5MB), route mounting
    │   ├── package.json              # Backend dependencies and scripts
    │   ├── .env.example              # Environment variables template
    │   ├── config/
    │   │   ├── firebase.js           # Firebase Admin SDK init, clock-skew sync, getNextId transaction
    │   │   └── serviceAccountKey.json# Firebase service account credential (local dev)
    │   ├── controllers/
    │   │   └── userController.js     # 1,400+ lines of business logic (Auth, Users, Chat, WebRTC, AI)
    │   ├── routes/
    │   │   └── userRoutes.js         # Express router mapping routes to userController
    │   ├── middleware/
    │   │   └── authMiddleware.js     # JWT Bearer token authentication guard
    │   ├── utils/
    │   │   └── sendEmail.js          # Brevo HTTP API email sender
    │   └── database/
    │       └── skill_binimoy.sql     # Reference relational schema (SQL DDL)
    └── frontend/
        ├── index.html                # Public landing page with stats & testimonials
        ├── login.html                # User login page (handles unverified 403 redirect)
        ├── register.html             # User registration (Gmail check, strength meter, avatar preview)
        ├── verify-email.html         # 6-digit OTP email verification with 60s cooldown
        ├── forgot-password.html      # Password reset request via OTP
        ├── reset-password.html       # Password reset confirmation with OTP
        ├── dashboard.html            # Main authenticated user dashboard (metrics, feeds, trending)
        ├── marketplace.html          # Skill discovery, user cards, trending tags, exchange modal
        ├── profile.html              # Profile editing, avatar/cover base64 upload, teach/learn skills
        ├── requests.html             # Inbound & outbound exchange proposals (Accept/Reject)
        ├── sessions.html             # Scheduled sessions list with 20-min WebRTC Video Call launcher
        ├── chat.html                 # Direct messaging & group chat UI with polling
        ├── admin.html                # Admin statistics and mock analytics
        ├── js/
        │   ├── config.js             # Dynamic API_URL resolver
        │   ├── app.js                # Global helpers (showNotification, getToken, getUser, theme toggle)
        │   ├── auth.js               # Client route guard & global logout listener
        │   ├── chatbot.js            # Binimoy AI floating chat widget
        │   ├── videocall.js          # WebRTC P2P audio/video calling, Web Audio ringtones & Jitsi fallback
        │   ├── dashboard.js          # Counter animations & calendar navigation
        │   ├── marketplace.js        # Fallback/mock marketplace renderer
        │   └── profile.js            # Profile loading and edit submission
        ├── css/
        │   ├── style.css             # Base theme tokens, resets, typography, buttons, glassmorphism
        │   ├── auth.css              # Glassmorphic auth card styles & floating background bubbles
        │   ├── dashboard.css         # Dashboard layout, sidebar drawer, top header, stats cards
        │   ├── marketplace.css       # Marketplace cards & tag styling
        │   ├── responsive.css        # Mobile and tablet breakpoints
        │   ├── chatbot.css           # Binimoy AI widget styles
        │   └── videocall.css         # Call incoming/outgoing dialogs, floating controls, soundwave UI
        └── images/
            └── logo.png              # Skill Binimoy brand emblem
```

---

## 4. DATABASE ARCHITECTURE (FIREBASE FIRESTORE)

The platform utilizes Google Cloud Firestore. Sequential integer IDs are generated using an atomic Firestore transaction (`getNextId(counterName)` in `config/firebase.js`) stored in the `counters` collection. This guarantees numeric IDs (`1, 2, 3...`) for strict compatibility with frontend parseInt, WebRTC room IDs, and sorting routines.

### Firestore Collections & Data Schemas

#### 1. `counters`
- Document ID: `users`, `skills`, `exchange_requests`, `sessions`, `messages`, `groups`, `group_messages`, `reviews`, `calls`
- Fields:
  - `current` (Number): Latest allocated sequential ID.

#### 2. `users`
- Document ID: String representation of `id` (e.g. `"1"`)
- Schema:
  ```json
  {
    "id": 1,
    "full_name": "Rahim Ahmed",
    "email": "rahim@gmail.com",
    "password": "$2b$10$hashedPasswordHere...",
    "bio": "Full-stack developer passionate about open source",
    "profile_image": "data:image/jpeg;base64,...",
    "cover_image": "data:image/jpeg;base64,...",
    "is_verified": true,
    "verification_code": null,
    "verification_expires": null,
    "reset_code": null,
    "reset_code_expires": null,
    "created_at": "2026-03-20T10:00:00.000Z"
  }
  ```

#### 3. `skills`
- Document ID: String representation of `id`
- Schema:
  ```json
  {
    "id": 101,
    "user_id": 1,
    "skill_name": "Node.js",
    "skill_type": "teach", // "teach" | "learn"
    "created_at": "2026-03-20T10:05:00.000Z"
  }
  ```

#### 4. `exchange_requests`
- Document ID: String representation of `id`
- Schema:
  ```json
  {
    "id": 501,
    "sender_id": 1,
    "receiver_id": 2,
    "offered_skill": "Node.js",
    "requested_skill": "Figma UI/UX",
    "message": "Hey! Let's swap Node.js knowledge for Figma tips.",
    "status": "Pending", // "Pending" | "Accepted" | "Rejected" | "Completed"
    "created_at": "2026-03-20T11:00:00.000Z"
  }
  ```

#### 5. `sessions`
- Document ID: String representation of `id`
- Schema:
  ```json
  {
    "id": 701,
    "request_id": 501,
    "sender_id": 1,
    "receiver_id": 2,
    "scheduled_at": "2026-03-25T15:00:00.000Z",
    "duration_minutes": 20,
    "meeting_link": "https://meet.jit.si/skill-binimoy-session-701",
    "status": "Upcoming", // "Upcoming" | "Completed" | "Cancelled"
    "created_at": "2026-03-20T12:00:00.000Z"
  }
  ```

#### 6. `messages` (Direct 1-on-1 Messages)
- Document ID: String representation of `id`
- Schema:
  ```json
  {
    "id": 1001,
    "sender_id": 1,
    "receiver_id": 2,
    "message": "Hello! Looking forward to our session.",
    "is_read": false,
    "created_at": "2026-03-20T12:30:00.000Z"
  }
  ```

#### 7. `groups` & `group_messages`
- `groups`:
  ```json
  {
    "id": 201,
    "group_name": "Web Devs Club",
    "created_by": 1,
    "members": [1, 2, 3],
    "created_at": "2026-03-20T13:00:00.000Z"
  }
  ```
- `group_messages`:
  ```json
  {
    "id": 3001,
    "group_id": 201,
    "sender_id": 1,
    "sender_name": "Rahim Ahmed",
    "message": "Welcome everyone!",
    "created_at": "2026-03-20T13:05:00.000Z"
  }
  ```

#### 8. `reviews`
- Document ID: String representation of `id`
- Schema:
  ```json
  {
    "id": 401,
    "reviewer_id": 2,
    "reviewed_id": 1,
    "rating": 5, // 1 to 5
    "comment": "Super helpful teacher! Explained async/await clearly.",
    "created_at": "2026-03-20T16:00:00.000Z"
  }
  ```

#### 9. `calls` (WebRTC Call State & Signaling)
- Document ID: Numeric or string `callId` (e.g. `"call_1_2_1711000000"`)
- Schema:
  ```json
  {
    "id": "call_1_2_1711000000",
    "caller_id": 1,
    "caller_name": "Rahim Ahmed",
    "caller_avatar": "data:image/jpeg;base64,...",
    "receiver_id": 2,
    "call_type": "video", // "video" | "audio"
    "status": "ringing", // "ringing" | "accepted" | "rejected" | "ended" | "missed"
    "created_at": "2026-03-20T14:00:00.000Z",
    "signals": {
      "caller_offer": { "type": "offer", "sdp": "..." },
      "receiver_answer": { "type": "answer", "sdp": "..." },
      "caller_ice": [ { "candidate": "..." } ],
      "receiver_ice": [ { "candidate": "..." } ]
    }
  }
  ```

---

## 5. REST API SPECIFICATION

All private endpoints require the header:
`Authorization: Bearer <jwt_token>`

### Public / Authentication Endpoints

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/users/register` | Register new account. Only `@gmail.com` accepted. Sends 6-digit OTP code via Brevo. | `{ "full_name": "...", "email": "...@gmail.com", "password": "..." }` | `201 Created`: `{ message, email }` |
| `POST` | `/api/users/verify-email` | Verifies 6-digit OTP code received in email. | `{ "email": "...", "code": "123456" }` | `200 OK`: `{ message }` |
| `POST` | `/api/users/resend-code` | Resends a new 6-digit OTP verification code. | `{ "email": "..." }` | `200 OK`: `{ message }` |
| `POST` | `/api/users/login` | Validates credentials. Denies unverified users with HTTP 403. | `{ "email": "...", "password": "..." }` | `200 OK`: `{ token, user: { id, full_name, email, bio, profile_image } }` |
| `POST` | `/api/users/forgot-password`| Sends 6-digit reset code to user's Gmail. | `{ "email": "..." }` | `200 OK`: `{ message }` |
| `POST` | `/api/users/reset-password` | Sets new password if reset OTP code is valid. | `{ "email": "...", "code": "...", "newPassword": "..." }` | `200 OK`: `{ message }` |

### Profile & Skills Endpoints (Protected)

| Method | Endpoint | Description | Request Body / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/users/profile` | Get current authenticated user profile & skills list. | None | `{ user: { ..., skills_teach: [], skills_learn: [] } }` |
| `PUT` | `/api/users/profile` | Update profile bio, full name, or base64 images. | `{ "full_name": "...", "bio": "...", "profile_image": "...", "cover_image": "..." }` | `{ message, user }` |
| `POST` | `/api/users/skills` | Add a teach or learn skill. | `{ "skill_name": "Docker", "skill_type": "teach" }` | `{ message, skill }` |
| `DELETE`| `/api/users/skills/:id` | Delete a skill by ID. | URL param `:id` | `{ message }` |
| `GET` | `/api/users/skills/trending`| (Public) Returns aggregated trending skills count. | None | `{ trending: [ { skill_name, teach_count, learn_count } ] }` |

### Marketplace & Friends (Protected)

| Method | Endpoint | Description | Request Body / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/users/all` | Returns all verified users excluding current user. | None | `{ users: [ { id, full_name, email, bio, profile_image, skills_teach: [], skills_learn: [] } ] }` |
| `GET` | `/api/users/friends` | Returns users who have mutual `Accepted` exchanges. | None | `{ friends: [ { id, full_name, profile_image, ... } ] }` |

### Exchange Requests & Sessions (Protected)

| Method | Endpoint | Description | Request Body / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/users/requests` | Propose exchange to another user. | `{ "receiver_id": 2, "offered_skill": "...", "requested_skill": "...", "message": "..." }` | `{ message, request }` |
| `GET` | `/api/users/requests` | Get all incoming & outgoing exchange proposals. | None | `{ requests: [ { id, sender_id, receiver_id, sender_name, receiver_name, status, ... } ] }` |
| `PUT` | `/api/users/requests/:id` | Accept or reject proposal. If Accepted, auto-creates session. | `{ "status": "Accepted" }` (or `"Rejected"`) | `{ message, request }` |
| `GET` | `/api/users/sessions` | Fetch upcoming & past scheduled exchange sessions. | None | `{ sessions: [ { id, sender_id, receiver_id, offered_skill, requested_skill, scheduled_at, ... } ] }` |
| `POST` | `/api/users/sessions` | Manually schedule a session. | `{ "request_id": 501, "scheduled_at": "...", "duration_minutes": 20 }` | `{ message, session }` |

### Direct & Group Messaging (Protected)

| Method | Endpoint | Description | Request Body / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/users/messages/:userId`| Get conversation history with user `:userId`. | URL param `:userId` | `{ messages: [ { id, sender_id, receiver_id, message, created_at } ] }` |
| `POST` | `/api/users/messages` | Send direct message to user. | `{ "receiver_id": 2, "message": "Hi!" }` | `{ message: "Message sent", data: { ... } }` |
| `POST` | `/api/users/groups` | Create group chat with friends. | `{ "group_name": "...", "member_ids": [2, 3] }` | `{ message, group_id }` |
| `GET` | `/api/users/groups` | List groups current user belongs to. | None | `{ groups: [ { id, group_name, members: [] } ] }` |
| `GET` | `/api/users/groups/:groupId/messages` | Get group message thread. | URL param `:groupId` | `{ messages: [ ... ] }` |
| `POST` | `/api/users/groups/:groupId/messages` | Post message to group. | `{ "message": "Hello team" }` | `{ message: "Message sent" }` |

### AI Chatbot (Public)

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/users/chatbot` | Conversational assistant powered by Google Gemini. Returns skill advice, roadmaps, and site usage tips. | `{ "message": "How do I become a UI designer?", "history": [ ... ] }` | `{ reply: "Markdown text response..." }` |

### WebRTC Signaling & Real-Time Call Endpoints (Protected)

| Method | Endpoint | Description | Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users/call/initiate` | Initiates audio/video call to peer. Sets status to `ringing`. | `{ "receiver_id": 2, "call_type": "video" }` |
| `GET` | `/api/users/call/status` | Polled by client every 2-3 seconds to check for incoming calls. | None |
| `GET` | `/api/users/call/check/:callId` | Polled by caller to check if receiver accepted/rejected/ended. | URL param `:callId` |
| `POST` | `/api/users/call/respond` | Receiver accepts or declines the call. | `{ "call_id": "...", "action": "accept" }` |
| `POST` | `/api/users/call/cancel` | Caller or receiver hangs up call. | `{ "call_id": "..." }` |
| `POST` | `/api/users/call/signal` | Transmits WebRTC SDP offer/answer or ICE candidate. | `{ "call_id": "...", "type": "offer"|"answer"|"ice", "payload": { ... } }` |
| `GET` | `/api/users/call/signal/:callId`| Retrieves counterpart's WebRTC signaling payload. | URL param `:callId` |

---

## 6. WEBRTC & REAL-TIME AUDIO/VIDEO SUBSYSTEM

The WebRTC implementation in `v3/frontend/js/videocall.js` and `v3/backend/controllers/userController.js` provides zero-install peer-to-peer communication:

```
[Caller]                                  [Backend / Firestore]                           [Receiver]
   |                                                |                                         |
   |--- POST /call/initiate ----------------------->|                                         |
   |    (Creates call record with status: ringing)  |                                         |
   |                                                |<-- GET /call/status (polling 2.5s) -----|
   |                                                |    (Returns active incoming call)       |
   |                                                |                                         |
   | [Starts Ringback Tone via Web Audio API]       |                                         | [Starts Chime via Web Audio API]
   | [Tab Flashes: "📞 Ringing..."]                 |                                         | [Tab Flashes: "🔔 Incoming Call!"]
   |                                                |                                         |
   |                                                |<-- POST /call/respond (action: accept)--|
   |--- GET /call/check/:callId (sees 'accepted') ->|                                         |
   |                                                |                                         |
   |--- POST /call/signal (SDP Offer) ------------->|                                         |
   |                                                |<-- GET /call/signal (reads SDP Offer)---|
   |                                                |<-- POST /call/signal (SDP Answer) ------|
   |--- GET /call/signal (reads SDP Answer) ------->|                                         |
   |                                                |                                         |
   | <================== Direct P2P Media Flow (STUN Audio & Video) ========================> |
```

### Key Technical Details of the Calling Engine
1. **Web Audio API Native Synthesis**:
   - `startRingingSound(isIncoming)` uses native Web Audio oscillators to synthesize custom frequencies:
     - Incoming Call: E5 (659Hz) → G#5 (830Hz) → B5 (987Hz) chord progression.
     - Outgoing Call: Standard telephone ringback tone (440Hz + 480Hz).
   - Requires zero MP3/WAV audio files; auto-resumes `AudioContext` on any initial user gesture (`click`, `touchstart`, `keydown`).
2. **STUN Configuration**: Uses 5 public Google STUN servers:
   `stun:stun.l.google.com:19302`, `stun:stun1.l.google.com:19302`, `stun2`, `stun3`, `stun4`.
3. **Session Call Fallback**:
   - Group calls or scheduled sessions link to self-hosted/public **Jitsi Meet** rooms (`https://meet.jit.si/skill-binimoy-session-<id>`) with an automated 20-minute countdown timer.

---

## 7. FRONTEND ARCHITECTURE & UX DESIGN

### Color Palette & Design Tokens
```css
:root {
  --primary-color: #6C63FF;     /* Modern Purple Accent */
  --secondary-color: #00C2FF;   /* Cyan Glow Accent */
  --bg-dark: #0F172A;           /* Deep Slate Dark Background */
  --card-bg: #1E293B;          /* Glassmorphic Elevated Card */
  --border: #334155;            /* Subtle Boundary Color */
  --text-primary: #F8FAFC;      /* Crisp Off-White */
  --text-secondary: #94A3B8;    /* Muted Slate Text */
  --success: #10B981;           /* Emerald Green */
  --warning: #F59E0B;           /* Amber Orange */
  --danger: #EF4444;            /* Crimson Red */
}
```

### Shared Global JavaScript Services
1. **`js/config.js`**:
   - Inspects `window.location.hostname`.
   - If `localhost`, `127.0.0.1`, or `[::1]`, sets `window.API_URL = 'http://localhost:5000'`.
   - Otherwise, targets production: `'https://skill-binimoy-backend.onrender.com'`.
2. **`js/auth.js`**:
   - Protects private views (`dashboard.html`, `marketplace.html`, `profile.html`, `requests.html`, `sessions.html`, `chat.html`).
   - If `localStorage.getItem('token')` is missing, immediately redirects to `login.html`.
   - Binds `#logoutBtn` to purge `localStorage` and redirect to `index.html`.
3. **`js/app.js`**:
   - `showNotification(msg, type)`: Animated floating toast notification (`success`, `error`, `info`).
   - `getToken()` / `getUser()`: Quick access to cached authentication tokens.
   - Synchronizes user initials into `.user-avatar` and `.user-initials` elements across all navbars.
   - Light/Dark theme toggler with `localStorage.setItem('theme', ...)`.
4. **`js/chatbot.js`**:
   - Injects the floating circular robot button (`#binimoyChatLauncher`) on all views.
   - Handles multi-turn chat dialogs with markdown formatting (bold, italics, code blocks, lists).
   - Includes quick-prompt suggestion chips for instant questions.

---

## 8. ENVIRONMENT CONFIGURATION & SETUP GUIDE

### `.env` Setup (Backend)
Create a `.env` file inside `v3/backend/` with the following keys:

```env
PORT=5000
JWT_SECRET=superSecretSkillBinimoyKey2026_XYZ!@#
FRONTEND_URL=http://localhost:8000

# FIREBASE CONFIGURATION (Choose Option 1 or Option 2)
# Option 1: Provide full JSON string (Render / Production recommended)
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk@your-project.iam.gserviceaccount.com"}'

# Option 2: Place serviceAccountKey.json in v3/backend/config/ (Local dev)

# BREVO (SENDINBLUE) EMAIL API (Required for OTP verification & password reset)
BREVO_API_KEY=xkeysib-your-brevo-api-key-here
SENDER_EMAIL=your-verified-brevo-sender@gmail.com

# GOOGLE GEMINI AI API (Required for Binimoy AI chatbot)
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyFromGoogleAIStudio
```

### How to Run Locally

#### 1. Start Backend:
```bash
cd v3/backend
npm install
npm run dev
# Server will run on http://localhost:5000
```

#### 2. Start Frontend:
Open a separate terminal and serve `v3/frontend`:
```bash
cd v3/frontend
# Using Python:
python -m http.server 8000

# OR using Node.js:
npx serve -l 8000
```
Open your browser at `http://localhost:8000`.

---

## 9. IMPORTANT CONVENTIONS & CODING GUIDELINES FOR AI AGENTS

When writing, extending, or refactoring code in this repository, always respect these established patterns:

1. **Numeric ID Integrity**:
   - Never generate arbitrary string UUIDs for new Firestore documents in `users`, `skills`, `requests`, `sessions`, `messages`, or `groups`.
   - Always call `await getNextId('collection_name')` from `config/firebase.js` so that `id` remains an auto-incrementing integer.
2. **Gmail Only Constraint**:
   - Registration strictly verifies that email ends with `@gmail.com`.
   - Never remove Gmail validation without user approval.
3. **Vanilla Frontend**:
   - Keep the frontend framework-free (Pure Vanilla JavaScript, HTML5, CSS3).
   - Do not introduce React, Vue, Angular, or Tailwind unless explicitly directed by the user.
4. **CORS & JSON Body Limits**:
   - Avatar photos are transmitted as base64 data URLs (`data:image/jpeg;base64,...`). The body parser limit is set to `5mb` in `server.js`.
5. **Real-time Communication**:
   - In-app messaging and call status updates rely on regular interval polling against the Express/Firestore backend (no socket server dependency required, keeping deployment lightweight on free hosting tiers like Render).
