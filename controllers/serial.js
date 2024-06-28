require("dotenv").config();
const { SerialPort } = require("serialport");
const readline = require("readline");
const dbConnection = require("../config/database");
const {
  logEvent,
  logInvalidCard,
  getLastCardStatus,
  logError,
} = require("../models/log");
const hexToDecimalBigInt = require("../utils/hexToDecimalBigInt");
const logger = require("../utils/logger");

const enableStrictAccess = process.env.ENABLE_STRICT_ACCESS === "true";

const serialPort = new SerialPort({
  path: process.env.SERIAL_PORT,
  baudRate: parseInt(process.env.SERIAL_BAUD_RATE, 10),
  dataBits: 8,
  parity: "none",
  stopBits: 1,
  flowControl: false,
});

serialPort.on("open", () => {
  logger.info("Serial Port Opened");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("line", (input) => {
    serialPort.write(input, (err) => {
      if (err) {
        return logger.error("Error on write: " + err.message);
      }
      logger.info(`Command "${input}" sent`);
    });
  });
});

serialPort.on("data", (data) => {
  const dataStr = data.toString();

  if (
    (dataStr.startsWith("*W") || dataStr.startsWith("*X")) &&
    dataStr.endsWith("#")
  ) {
    const hexStr = dataStr.slice(2, -1);
    const decimalStr = hexToDecimalBigInt(hexStr);
    const timestamp = new Date();
    const currentDate = new Date().toISOString().split("T")[0];

    const getUserVisitorIdQuery =
      "SELECT * FROM dt_kartu_akses WHERE no_kartu = ?";
    dbConnection.query(getUserVisitorIdQuery, [decimalStr], (err, results) => {
      if (err) {
        return logger.error("Error fetching user_visitor_id: " + err.message);
      }

      if (results.length === 0) {
        logger.info(`Card #: ${decimalStr}, Status: NOTFOUND`);
        return logInvalidCard(dbConnection, decimalStr, timestamp);
      }

      const nama = results[0].nama;
      const no_kartu = results[0].no_kartu;
      const masa_berlaku = new Date(results[0].masa_berlaku)
        .toISOString()
        .split("T")[0];
      const isActive = results[0].is_active;

      if (isActive === 0) {
        logger.info(`Card #: ${no_kartu}, Status: INACTIVE`);
        return logError(dbConnection, no_kartu, nama, timestamp, "INACTIVE");
      }

      if (masa_berlaku < currentDate) {
        logger.info(`Card #: ${no_kartu}, Status: EXPIRED`);
        return logError(dbConnection, no_kartu, nama, timestamp, "EXPIRED");
      }

      let status = dataStr.startsWith("*W") ? "IN" : "OUT";

      getLastCardStatus(dbConnection, no_kartu, (err, lastStatus) => {
        if (err) {
          return logger.error("Error fetching last status: " + err.message);
        }

        const isInvalidTap =
          (lastStatus === "IN" && status === "IN") ||
          (lastStatus === "OUT" && status === "OUT");

        if (isInvalidTap) {
          const errorMessage = `INVALID:${lastStatus}`;
          logger.info(`Card #: ${no_kartu}, Status: ${errorMessage}`);

          if (enableStrictAccess) {
            logError(dbConnection, no_kartu, nama, timestamp, errorMessage);
            return;
          }
        }

        logEvent(dbConnection, no_kartu, nama, timestamp, status);
        if (!isInvalidTap) {
          logger.info(`Card #: ${no_kartu}, Status: ${status}`);
        }

        const serialCommand = status === "IN" ? "*TRIG1ON#" : "*TRIG2ON#";

        serialPort.write(serialCommand, (err) => {
          if (err) {
            return logger.error(`Error sending ${serialCommand} command: ${err.message}`);
          }
          logger.info(`Command: ${serialCommand}`);
        });
      });
    });
  }
});

serialPort.on("error", (err) => {
  logger.error("Error: " + err.message);
});

serialPort.on("close", () => {
  logger.info("Serial Port Closed");
  dbConnection.end((err) => {
    if (err) {
      return logger.error("Error closing database connection: " + err.message);
    }
    logger.info("Database connection closed.");
  });
});

module.exports = serialPort;
