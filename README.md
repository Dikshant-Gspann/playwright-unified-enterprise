# Playwright Unified Framework

This framework is designed to provide a unified platform for UI, API, and mobile automation testing. It leverages Playwright for UI and API testing and extends mobile automation capabilities through Appium with WebdriverIO.

## Prerequisites

Before setting up the framework, ensure that you have the following prerequisites installed and configured on your system:

- **Node.js**: Ensure that Node.js is installed. You can download it from [nodejs.org](https://nodejs.org/).
- **Android SDK**: Make sure the Android SDK path is properly set in your environment variables. This is required for mobile testing using Appium.

## Setup Instructions

1. Clone the repository to your local machine.

2. Navigate to the project directory:
   ```bash
   cd playwright-unified-framework
   ```

3. Install the necessary dependencies using npm:
   ```bash
   npm install
   ```

## Running Tests

The `package.json` file contains custom scripts to execute different types of tests. Below are the instructions for running them:

- **UI Tests**: To run UI tests, use the following command:
  ```bash
  npm run test:ui
  ```

- **API Tests**: To run API tests, use the following command:
  ```bash
  npm run test:api
  ```

- **Mobile Tests**: To run mobile tests, ensure Appium is running and use the following command:
  ```bash
  npm run test:mobile
  ```

## Extending the Framework

This framework can be extended to include additional testing capabilities as needed. It is built to be flexible and to integrate easily with other testing tools and services.

For more detailed information on extending the framework, refer to the documentation or contact the development team.

---

This README provides a basic overview and setup instructions for the Playwright Unified Framework. Ensure all prerequisites are met before proceeding with the setup and execution of tests. If you encounter any issues, please consult the documentation or reach out for support.
