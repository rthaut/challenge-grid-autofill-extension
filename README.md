# Challenge Grid Autofill v2.0.0

[![Chrome Web Store][chrome-image-version]][chrome-url] [![Microsoft Edge Add-on][edge-image-version]][edge-url] [![Mozilla Add-on][firefox-image-version]][firefox-url]

> This browser extension provides a way to programmatically parse prompts and automatically fill in the corresponding response for websites using security/challenge grids as an additional authentication mechanism, such as [Entrust eGrid](https://www.entrust.com/digital-security/identity-and-access-management/capabilities/authenticators) and [Deepnet Security GridID](https://wiki.deepnetsecurity.com/display/DUALSHIELD/GridID).

**NOTICE OF NON-AFFILIATION: Neither this extension nor the extension author are affiliated, associated, authorized, endorsed by, or in any way officially connected with Entrust Corporation, Deepnet Security, or any of their respective subsidiaries or affiliates.**

* * *

## Overview

![Challenge Grid Autofill Promotional Image](/promo/Promo-Image-Marquee_1400x560.png?raw=true)

### Features

* Parses challenge prompts and automatically enters the corresponding response for the selected grid from a context menu and/or the browser action menu
* Store multiple grids directly in your browser and sync them across multiple devices
* Quickly import grids from CSV files and/or use the built-in grid editor
* Optionally automatically submit the challenge form after entering a response
* Optionally force the UI elements of this extension to use Dark Mode

* * *

## Installation

| Web Browser | Information & Downloads |
| ----------- | ----------------------- |
| Google Chrome | [![Chrome Web Store][chrome-image-version]][chrome-url] <!--[![Chrome Web Store][chrome-image-users]][chrome-url]--> |
| Microsoft Edge | [![Microsoft Edge Add-on][edge-image-version]][edge-url] <!--[![Microsoft Edge Add-on][edge-image-users]][edge-url]--> |
| Mozilla Firefox | [![Mozilla Add-on][firefox-image-version]][firefox-url] <!--[![Mozilla Add-on][firefox-image-users]][firefox-url]--> |

* * *

## Contributing

Contributions are always welcome! Even if you aren't comfortable coding, you can always submit [new ideas](https://github.com/rthaut/challenge-grid-autofill-extension/issues/new?labels=enhancement) and [bug reports](https://github.com/rthaut/challenge-grid-autofill-extension/issues/new?labels=bug).

### Localization/Translation

This extension is setup to be fully localized/translated into multiple languages, but for now English is the only language with full translations. If you are able to help localize/translate, please [check out this guide](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization). All of the text for the extension is stored [here in the `/src/public/_locales` directory](https://github.com/rthaut/challenge-grid-autofill-extension/tree/master/src/public/_locales).

### Building the Extension

**This extension uses [WXT](https://wxt.dev/) for development and build processes.**

To build the extension from source code, you will need [Node.js](https://nodejs.org/) 22 or later and [Node Package Manager (npm)](https://www.npmjs.com/), which handles all of the dependencies needed for this project and is used to execute the various scripts for development/building/packaging/etc.

```sh
npm install
```

Then you can run the development process (where the extension is auto-reloaded when changes are made) for your browser of choice:

```sh
npm run dev:<chrome/edge/firefox>
```

Or you can generate a production build for your browser of choice:

```sh
npm run build:<chrome/edge/firefox>
```

### Development Process

The `dev:chrome` and `dev:firefox` scripts start a temporary development profile on [Google Chrome](https://www.google.com/chrome/) or [Mozilla Firefox](https://getfirefox.com) with the extension already loaded, and reload the extension as you make changes.

To try a production build in a temporary profile instead, build it first and then start the browser with [`web-ext`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Getting_started_with_web-ext):

```sh
npm run build:firefox
npm run start:firefox
```

Use `build:chrome` and `start:chrome` for Chrome. Use <kbd>CTRL</kbd> + <kbd>c</kbd> to stop the browser process in your terminal.

[chrome-url]: https://chrome.google.com/webstore/detail/challenge-grid-autofill/nifoiollkgakfnbefnepgonkmhijehhl
[chrome-image-version]: https://img.shields.io/chrome-web-store/v/nifoiollkgakfnbefnepgonkmhijehhl?logo=googlechrome&style=for-the-badge
[chrome-image-users]: https://img.shields.io/chrome-web-store/d/nifoiollkgakfnbefnepgonkmhijehhl?logo=googlechrome&style=for-the-badge

[edge-url]: https://microsoftedge.microsoft.com/addons/detail/challenge-grid-autofill/memaigildfbodkbnbicnhjplglehionl
[edge-image-version]: https://img.shields.io/badge/dynamic/json?logo=microsoftedge&style=for-the-badge&label=edge%20add-on&prefix=v&query=%24.version&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Fmemaigildfbodkbnbicnhjplglehionl
[edge-image-users]: https://img.shields.io/badge/dynamic/json?logo=microsoftedge&style=for-the-badge&label=users&query=%24.activeInstallCount&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Fmemaigildfbodkbnbicnhjplglehionl

[firefox-url]: https://addons.mozilla.org/en-US/firefox/addon/challenge-grid-autofill/
[firefox-image-version]: https://img.shields.io/amo/v/challenge-grid-autofill?color=blue&logo=firefox&style=for-the-badge
[firefox-image-users]: https://img.shields.io/amo/users/challenge-grid-autofill?color=blue&logo=firefox&style=for-the-badge
