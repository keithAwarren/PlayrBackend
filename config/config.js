module.exports = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'playr-user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'playr_backend',
  port: process.env.DB_PORT || 3306
};