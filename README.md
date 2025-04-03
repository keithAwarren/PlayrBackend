# Playr Back End

> **NOTE**: This back end is in development mode. Users must be manually added for full Spotify access. Contact the developer to be included.

The back end of **Playr** is responsible for user authentication, secure data fetching, database operations, and connecting the front end with the Spotify and Musixmatch APIs.

It uses **Node.js**, **Express**, and **MySQL**, along with **JWT authentication** to protect sensitive routes like analytics, lyrics, and favoriting tracks.

---

## Features

- **JWT Authentication**: Securely issues and verifies JSON Web Tokens on login for protected API access.
- **Spotify OAuth Integration**: Connects with Spotify's API to authenticate users and fetch music-related data.
- **User Database**: Stores Spotify user profiles in a MySQL database for future sessions and token management.
- **Track Analytics**: Provides recently played, top tracks, and favorite data for the dashboard.
- **Lyrics Fetching**: Integrates with the Musixmatch API to fetch lyrics, with database caching for performance.
- **Favorites System**: Allows users to favorite/unfavorite tracks and stores those selections in the database.
- **RESTful API Routes**: Cleanly structured endpoints to handle requests for music data, user info, favorites, and more.

---

## Tech Stack

### Back End

- **Node.js** – JavaScript runtime to run the server
- **Express.js** – Fast, minimal web server framework
- **MySQL** – Relational database to persist user and favorite data
- **JWT (`jsonwebtoken`)** – For authentication and securing private routes
- **Spotify Web API** – Used to fetch track, artist, and playlist data from Spotify
- **Musixmatch API** – For fetching and caching lyrics
- **dotenv** – Loads environment variables like API keys and secrets
- **axios** – Makes HTTP requests to external APIs
- **mysql2/promise** – Used to interact with MySQL using async/await
- **Render** – Hosts the live back-end server
- **AWS RDS** – Hosts the MySQL database in the cloud

---

## Authentication Flow

1. The user logs in via the Spotify OAuth screen.
2. The `/callback` route exchanges the code for tokens and fetches the user's Spotify profile.
3. A **JWT token** is created using the user’s database ID and Spotify ID.
4. That JWT token is sent to the front end and stored in `localStorage`.
5. Protected routes (like `/favorites`, `/analytics`, etc.) require the JWT, which is verified by middleware before allowing access.

---

## Folder Structure

- /routes        # Auth, analytics, lyrics, playlists, and favorites
- /utils         # SQL utility functions (query, insert, update, delete)
- /middleware    # JWT auth middleware
- .env           # Environment variables (secrets & API keys)
- index.js       # Main server entry point

---

## Hurdles Overcome

- **Spotify Changed Rules (Twice)**  
  During development, Spotify changed its API policies — breaking playlist creation and editing. These features remain in the codebase but will be commented out due to API deprecation.

- **Token Persistence & Refresh**  
  Implemented refresh token logic to keep Spotify sessions active using `/auth/refresh`.

- **Database-Verified Auth**  
  The JWT embeds `userId`, which is used to safely associate each request with the correct Spotify user via a MySQL lookup.

---

## Tools Used

- **Prettier** – Code formatting
- **Render Dashboard** – Deployment & monitoring
- **MySQL Workbench** – Database visualization
- **Netlify** – Frontend hosting
- **Postman** – API testing

---

## Contact

> Built by [@keithAwarren](https://github.com/keithAwarren)  
> For access or questions, reach out via GitHub or your connected Spotify email.

---
