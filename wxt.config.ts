import { defineConfig, type UserManifest } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  publicDir: "src/public",
  modules: ["@wxt-dev/webextension-polyfill", "@wxt-dev/module-react"],
  hooks: {
    "build:manifestGenerated": (wxt, manifest) => {
      if (manifest.options_ui?.page !== undefined) {
        // set the options page to open in a new tab in development mode
        manifest.options_ui = {
          ...manifest.options_ui,
          open_in_tab: wxt.config.mode === "development",
        };
      }
    },
  },
  manifest: ({ browser, mode }) => {
    const author_developer =
      browser === "firefox"
        ? {
            // use the "developer" field for Firefox, since it doesn't support the `author.email` format
            // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/developer
            developer: {
              name: "Ryan Thaut",
              url: "https://ryan.thaut.me",
            } as UserManifest["developer"],
          }
        : {
            // use the "author" field for Edge and Chrome
            // https://developer.chrome.com/docs/extensions/reference/manifest/author
            author: {
              email: "rthaut@gmail.com",
            } as UserManifest["author"],
          };

    const firefox_settings =
      browser === "firefox"
        ? {
            // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings
            browser_specific_settings: {
              gecko: {
                id: "challenge-grid-autofill@ryan.thaut.me",
                strict_min_version: "109.0",
                // the extension does not collect or transmit any user data
                // https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/
                data_collection_permissions: {
                  required: ["none"],
                },
              } as NonNullable<
                UserManifest["browser_specific_settings"]
              >["gecko"],
            },
          }
        : {};

    return {
      name: "__MSG_ExtensionName__",
      description: "__MSG_ExtensionDescription__",
      short_name: "__MSG_ExtensionShortName__",
      default_locale: "en",
      homepage_url:
        "https://github.com/rthaut/challenge-grid-autofill-extension/",
      ...author_developer,
      action: {
        default_title: "__MSG_BrowserActionTitle__",
      },
      page_action: {
        default_title: "__MSG_BrowserActionTitle__",
      },
      host_permissions: ["<all_urls>"],
      permissions: [
        "activeTab",
        "contextMenus",
        "notifications",
        "scripting",
        "storage",
      ],
      minimum_chrome_version: browser === "chrome" ? "90" : "91",
      ...firefox_settings,
    } satisfies UserManifest;
  },
});
