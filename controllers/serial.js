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
  console.log("Serial Port Opened");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("line", (input) => {
    serialPort.write(input, (err) => {
      if (err) {
        return console.log("Error on write: ", err.message);
      }
      console.log(`Command "${input}" sent`);
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
    console.log("Card #  :", decimalStr);

    const timestamp = new Date();
    const currentDate = new Date().toISOString().split("T")[0];

    const getUserVisitorIdQuery =
      "SELECT * FROM dt_kartu_akses WHERE no_kartu = ?";
    dbConnection.query(getUserVisitorIdQuery, [decimalStr], (err, results) => {
      if (err) {
        return console.error("Error fetching user_visitor_id: ", err.message);
      }

      if (results.length === 0) {
        console.error("Status  : NOTFOUND");
        return logInvalidCard(dbConnection, decimalStr, timestamp);
      }

      const nama = results[0].nama;
      const no_kartu = results[0].no_kartu;
      const masa_berlaku = new Date(results[0].masa_berlaku)
        .toISOString()
        .split("T")[0];
      const isActive = results[0].is_active;

      console.log(`Exp Date: ${masa_berlaku}`);

      // Check if the card is inactive
      if (isActive === 0) {
        console.error(`Status  : INACTIVE`);
        return logError(
          dbConnection,
          no_kartu,
          nama,
          timestamp,
          "INACTIVE"
        );
      }

      // Check if the card is expired
      if (masa_berlaku < currentDate) {
        console.error(`Status  : EXPIRED`);
        return logError(
          dbConnection,
          no_kartu,
          nama,
          timestamp,
          "EXPIRED"
        );
      }

      // Determine the status based on the prefix
      let status = "TEST";
      if (dataStr.startsWith("*W")) {
        status = "IN";
      } else if (dataStr.startsWith("*X")) {
        status = "OUT";
      }

      // Check the last status of the specific card
      getLastCardStatus(dbConnection, no_kartu, (err, lastStatus) => {
        if (err) {
          return console.error("Error fetching last status: ", err.message);
        }

        const isInvalidTap =
          (lastStatus === "IN" && status === "IN") ||
          (lastStatus === "OUT" && status === "OUT");
        if (isInvalidTap) {
          const errorMessage = `INVALID:${lastStatus}`;
          console.error("Status  :", errorMessage);

          if (enableStrictAccess) {
            logError(dbConnection, no_kartu, nama, timestamp, errorMessage);
            return; // Exit without allowing access
          }
        }

        logEvent(dbConnection, no_kartu, nama, timestamp, status);
        
        if (!isInvalidTap) {
          console.log("Status  :", status);
        }

        // Send the serial command based on the status
        let serialCommand = "";
        if (status === "IN") {
          serialCommand = "*TRIG1ON#";
        } else if (status === "OUT") {
          serialCommand = "*TRIG2ON#";
        }

        if (serialCommand) {
          serialPort.write(serialCommand, (err) => {
            if (err) {
              return console.error(
                `Error sending ${serialCommand} command: `,
                err.message
              );
            }
            console.log(`Command : ${serialCommand}`);
          });
        }
      });
    });
  }
});

serialPort.on("error", (err) => {
  console.error("Error: ", err.message);
});

serialPort.on("close", () => {
  console.log("Serial Port Closed");
  dbConnection.end((err) => {
    if (err) {
      return console.error("Error closing database connection: ", err.message);
    }
    console.log("Database connection closed.");
  });
});

module.exports = serialPort;
