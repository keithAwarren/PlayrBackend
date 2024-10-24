const mysql = require('mysql2/promise');

// Create a connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'playr_backend',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Utility function to insert a record into a table
const insertRecord = async (table, fields, values) => {
    try {
        const connection = await pool.getConnection();
        const query = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`;
        await connection.execute(query, values);
        connection.release();
        console.log('Record inserted successfully.');
    } catch (error) {
        console.error('Error inserting record:', error);
    }
};

// Utility function to query records from a table
const queryRecord = async (query, params = []) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute(query, params);
        connection.release();
        return rows;
    } catch (error) {
        console.error('Error querying record:', error);
    }
};

// Utility function to update a record in a table
const updateRecord = async (table, fields, values, condition) => {
    try {
        const connection = await pool.getConnection();
        const setFields = fields.map((field) => `${field} = ?`).join(', ');
        const query = `UPDATE ${table} SET ${setFields} WHERE ${condition}`;
        await connection.execute(query, values);
        connection.release();
        console.log('Record updated successfully.');
    } catch (error) {
        console.error('Error updating record:', error);
    }
};

// Utility function to delete a record from a table
const deleteRecord = async (table, condition, values) => {
    try {
        const connection = await pool.getConnection();
        const query = `DELETE FROM ${table} WHERE ${condition}`;
        await connection.execute(query, values);
        connection.release();
        console.log('Record deleted successfully.');
    } catch (error) {
        console.error('Error deleting record:', error);
    }
};

module.exports = {
    insertRecord,
    queryRecord,
    updateRecord,
    deleteRecord
};