/* global module */
module.exports = {
  artifactsDir: "./dist",
  build: {
    overwriteDest: true,
  },
  run: {
    browserConsole: true,
    startUrl: [
      "https://www.entrust.com/digital-security/identity-and-access-management/capabilities/authenticators",
    ],
  },
};
