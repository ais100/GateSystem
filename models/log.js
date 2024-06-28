const logger = require("../utils/logger");

function logEvent(dbConnection, no_kartu, nama, timestamp, status) {
  const logDoorsQuery = `
      INSERT INTO log (no_kartu, nama, gambar, created_at, status, camera)
      VALUES (?, ?, "No image captured", ?, ?, 0)
    `;
  const logDoorsValues = [no_kartu, nama, timestamp, status];

  dbConnection.query(logDoorsQuery, logDoorsValues, (err, results) => {
    if (err) {
      logger.error(`Error inserting data into log: ${err.message}`);
      return;
    }
    logger.info(`Event ID: ${results.insertId}, Card: ${no_kartu}, Name: ${nama}, Status: ${status}`);
    console.log("--------------------");
  });
}

function logInvalidCard(dbConnection, no_kartu, timestamp) {
  const logInvalidCardQuery = `
      INSERT INTO log (no_kartu, nama, gambar, created_at, status, camera)
      VALUES (?, 'Invalid', 'No image captured', ?, 'NOTFOUND', 0)
    `;
  const logInvalidCardValues = [no_kartu, timestamp];

  dbConnection.query(
    logInvalidCardQuery,
    logInvalidCardValues,
    (err, results) => {
      if (err) {
        logger.error(`Error inserting invalid card into log: ${err.message}`);
        return;
      }
      logger.info(`Event ID: ${results.insertId}, Card: ${no_kartu}, Status: NOTFOUND`);
      console.log("--------------------");
    }
  );
}

function logError(dbConnection, no_kartu, nama, timestamp, errorMessage) {
  const logErrorQuery = `
      INSERT INTO log (no_kartu, nama, gambar, created_at, status, camera)
      VALUES (?, ?, "No image captured", ?, ?, 0)
    `;
  const logErrorValues = [no_kartu, nama, timestamp, errorMessage];

  dbConnection.query(logErrorQuery, logErrorValues, (err, results) => {
    if (err) {
      logger.error(`Error inserting error log into log: ${err.message}`);
      return;
    }
    logger.info(`Event ID: ${results.insertId}, Card: ${no_kartu}, Name: ${nama}, Status: ${errorMessage}`);
    console.log("--------------------");
  });
}

function getLastCardStatus(dbConnection, cardNumber, callback) {
  const query = `
      SELECT status
      FROM log
      WHERE no_kartu = ? AND (status = 'IN' OR status = 'OUT')
      ORDER BY created_at DESC
      LIMIT 1
    `;
  dbConnection.query(query, [cardNumber], (err, results) => {
    if (err) {
      return callback(err);
    }
    if (results.length === 0) {
      return callback(null, null);
    }
    callback(null, results[0].status);
  });
}

module.exports = {
  logEvent,
  logInvalidCard,
  logError,
  getLastCardStatus,
};
