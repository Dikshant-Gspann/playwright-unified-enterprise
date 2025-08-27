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
        './playwright-tests/mobile/specs/mobile.e2e.js',
    ],
    //
    // ================
    // Capabilities
    // ================
    maxInstances: 1,    // you can bump this if you spin up multiple emulators
    capabilities: [
    {
        platformName: 'Android',
        // 'appium:deviceName': 'ramboemulator',
        'appium:deviceName': 'emulator-5554',
        'appium:automationName': 'UiAutomator2',
        'appium:app': currenWorkingDirectory+'/resources/sephora-android-app-prod-release.apk',
        'appium:appPackage': 'com.sephora',
        'appium:appActivity': 'com.sephora.appmodules.splash.SplashActivity',
        'appium:appWaitActivity': '*',             // wildcard to catch whatever comes next
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
