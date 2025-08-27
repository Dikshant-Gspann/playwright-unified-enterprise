// wdio.conf.js
const currenWorkingDirectory = process.cwd();
exports.config = {
    //
    // ====================
    // Runner & Server Setup
    // ====================
    runner: 'local',
    //
    // Path required for Appium 2.x
    path: '/',
    //
    // ==================
    // Specify Test Files
    // ==================
    specs: [
        './playwright-tests/mobile/specs/ios.e2e.js',
    ],
    //
    // ================
    // Capabilities
    // ================
    maxInstances: 1,    // you can bump this if you spin up multiple emulators
    capabilities: [
    {
        "appium:automationName": "XCUITest",
        "appium:bundleId": "org.wikimedia.wikipedia",
        'appium:app': currenWorkingDirectory+'/resources/Wikipedia.app',
        "appium:deviceName": "iPhone 16 Pro",
        "appium:udid": "C348A341-C1A0-4026-9103-108F41DEF094",
        "appium:platformName": "iOS",
        "appium:platformVersion": "16",
        "appium:usePrebuiltWDA": false,
        'appium:appWaitDuration': 60000,           // wait up to 60s for the app to settle
        'appium:autoGrantPermissions': true,
        'aapium:fullReset': true, // reset app state before each test
    }
    ],
    //
    // ===================
    // Test Configurations
    // ===================
    logLevel: 'silent', // 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent'
    outputDir: './playwright-tests/mobile/logs',
    baseUrl: 'http://localhost',
    bail: 0,
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    //
    // ==================
    // Services
    // ==================
    services: [
        ['appium', {
            args: {
                address: 'localhost',
                port: 4723,
                relaxedSecurity: true,


                // start your AVD for you…
                avd: 'ramboemulator',
                avdArgs: [
                    // simply omit "-no-window" here, or leave avdArgs empty
                    // so the emulator GUI will launch normally
                ],
            },
            drivers: {
                uiautomator2: 'latest',
                // if you ever need iOS later:
                xcuitest:    'latest'
            },
            command: 'appium',
        }]
    ],
    //
    // =========
    // Framework
    // =========
    framework: 'mocha',
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
    },
    //
    // ========
    // Reporters
    // ========
    reporters: [
        'spec',
        ['allure', {
            outputDir: 'allure-results',
            disableWebdriverStepsReporting: false,
            disableWebdriverScreenshotsReporting: false
        }]
    ],
    //
    // ===========
    // Hooks
    // ===========
    afterTest: async function (test, context, { error, result, duration, passed, retries }) {
        if (!passed) {
            // screenshot on failure
            await browser.takeScreenshot();
        }
    },
};
