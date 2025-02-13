const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3306;

// Import routes and database connection
const userRoutes = require("./routes/userRoutes");
const favoritesRoutes = require("./routes/favoritesRoutes");
const authRoutes = require("./routes/authRoutes");
const playlistRoutes = require("./routes/playlistRoutes");
const lyricsRoutes = require("./routes/lyricsRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const { connectDB } = require("./db/db");
const { createTables } = require("./utils/sqlFunctions");

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes); // Auth routes for login, callback, etc.
app.use("/auth", userRoutes); // User Routes
app.use("/api", favoritesRoutes); // Favorites routes
app.use("/api", playlistRoutes); // Playlist routes
app.use("/api", lyricsRoutes); // Lyrics routes
app.use("/api/analytics", analyticsRoutes); // Analytics Routes

// Basic route
app.get("/", (req, res) => {
  res.send("Spotify Backend is running!");
});

// Connect to database and create tables
if (require.main === module) {
  connectDB();
  createTables();

  // Start the server
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;