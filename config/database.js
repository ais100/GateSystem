const mysql = require('mysql');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const dbConnection = mysql.createConnection(dbConfig);

dbConnection.connect((err) => {
  if (err) {
    console.error("Database connection error: ", err.stack);
    return;
  }
  console.log(`Connected to the ${dbConfig.database} database.
--------------------`);
});

module.exports = dbConnection;
