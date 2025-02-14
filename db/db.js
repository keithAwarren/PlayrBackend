const mysql = require('mysql2');
const config = require('../config/config');

// Create a MySQL connection pool
const pool = mysql.createPool(config);

// Function to establish a connection
const connectDB = () => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to the database:', err.message);
    } else {
      console.log('Connected to the MySQL database');
      connection.release(); // Release the connection back to the pool
    }
  });
};

console.log("Database Config:", config);

// Helper function to run queries
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

module.exports = { connectDB, query };