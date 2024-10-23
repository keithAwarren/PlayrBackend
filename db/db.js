const mysql = require('mysql2');
const config = require('./config');

const pool = mysql.createPool(config);

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

module.exports = { query };