const mysql = require("mysql2/promise");

// Create a connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "test-password",
  database: "playr_backend",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});

// Utility function to query records from a table
const queryRecord = async (query, params = []) => {
  try {
    console.log("Executing Query:", query, "with params:", params);
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(query, params);
    connection.release();
    console.log("Query Result:", rows);
    return rows;
  } catch (error) {
    console.error("Error querying record:", error);
  }
};

// Utility function to insert a record into a table
const insertRecord = async (table, fields, values) => {
  try {
    console.log(
      `Inserting into ${table} with fields:`,
      fields,
      "and values:",
      values
    );
    const connection = await pool.getConnection();
    const query = `INSERT INTO ${table} (${fields.join(", ")}) VALUES (${fields
      .map(() => "?")
      .join(", ")})`;
    const [result] = await connection.execute(query, values);
    connection.release();
    console.log("Insert Result:", result);
    return result; // Return result to access insertId
  } catch (error) {
    console.error("Error inserting record:", error);
  }
};

// Utility function to update a record in a table
const updateRecord = async (table, fields, values, condition) => {
  try {
    const connection = await pool.getConnection();
    const setFields = fields.map((field) => `${field} = ?`).join(", ");
    const query = `UPDATE ${table} SET ${setFields} WHERE ${condition}`;
    await connection.execute(query, values);
    connection.release();
    console.log("Record updated successfully.");
  } catch (error) {
    console.error("Error updating record:", error);
  }
};

// Utility function to delete a record from a table
const deleteRecord = async (table, condition, values) => {
  try {
    const connection = await pool.getConnection();
    const query = `DELETE FROM ${table} WHERE ${condition}`;
    await connection.execute(query, values);
    connection.release();
    console.log("Record deleted successfully.");
  } catch (error) {
    console.error("Error deleting record:", error);
  }
};

// Utility function to create tables
const createTables = async () => {
  try {
    const connection = await pool.getConnection();

    // Create users table
    await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                spotify_id VARCHAR(255) NOT NULL UNIQUE,
                display_name VARCHAR(255),
                email VARCHAR(255),
                profile_image VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

    // Create playlists table
    await connection.query(`
            CREATE TABLE IF NOT EXISTS playlists (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                spotify_playlist_id VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                total_tracks INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        `);

    // Create lyrics table
    await connection.query(`
            CREATE TABLE IF NOT EXISTS lyrics (
                id INT AUTO_INCREMENT PRIMARY KEY,
                track_name VARCHAR(255),
                artist_name VARCHAR(255),
                lyrics TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

    // Create favorites table
    await connection.query(`
            CREATE TABLE IF NOT EXISTS favorites (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                item_type ENUM('track', 'playlist', 'lyrics') NOT NULL,
                item_id VARCHAR(255) NOT NULL,
                item_name VARCHAR(255),
                item_artist VARCHAR(255),
                FOREIGN KEY (user_id) REFERENCES users(spotify_id) ON DELETE CASCADE
            );
        `);

    connection.release();
    console.log("Tables created successfully.");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
};

module.exports = {
  insertRecord,
  queryRecord,
  updateRecord,
  deleteRecord,
  createTables,
};