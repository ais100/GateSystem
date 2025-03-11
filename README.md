# GateSystem

This project is an Access Control System that interacts with RFID card readers, logs access events, and controls access based on card validity and status.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Logging](#logging)
- [License](#license)

## Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/ais100/GateSystem.git
    cd GateSystem
    ```

2. Install the dependencies:

    ```sh
    npm install
    ```

## Configuration

1. Create a `.env` file in the root directory of your project and add the following environment variables:

    ```env
    SERIAL_PORT=/dev/ttyUSB0  # Update with your serial port path
    SERIAL_BAUD_RATE=9600
    ENABLE_STRICT_ACCESS=true
    ```

2. Update the database configuration in `config/database.js` with your MySQL connection details.

## Usage

1. Start the application:

    ```sh
    node serial.js
    ```

2. The application will listen for data from the configured serial port. When a card is scanned, the system will log the event, check the card's validity, and trigger appropriate actions.

## Logging

The system uses the `winston` library to log events. Logs are stored in a file named `access_control.log` and also printed to the console.

### Example Log Entry

2024-06-10T10:15:30.123Z [INFO]: Serial Port Opened
2024-06-10T10:16:05.456Z [INFO]: Card # : 1234567890
2024-06-10T10:16:05.789Z [INFO]: Exp Date: 2024-12-31
2024-06-10T10:16:06.012Z [INFO]: Status : IN
2024-06-10T10:16:06.345Z [INFO]: Command : *TRIG1ON#

## Directory Structure

.
├── config
│ └── database.js
├── models
│ └── log.js
├── utils
│ └── hexToDecimalBigInt.js
│ └── logger.js
├── .env
├── serial.js
└── README.md


## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details. - faris -
