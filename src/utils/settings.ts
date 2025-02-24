export interface Settings {
  autoSubmitForm: boolean;
  forceDarkMode: boolean;
}

export const SETTINGS_STORAGE_KEY = "settings";

export const DEFAULT_SETTINGS: Settings = {
  autoSubmitForm: false,
  forceDarkMode: false,
};

export const GetSetting = async (
  key: keyof typeof DEFAULT_SETTINGS,
  defaultValue = undefined,
) => {
  const { [SETTINGS_STORAGE_KEY]: settings } = await browser.storage.sync.get({
    [SETTINGS_STORAGE_KEY]: { [key]: defaultValue ?? DEFAULT_SETTINGS[key] },
  });

  const value =
    (settings as Settings)[key] ?? defaultValue ?? DEFAULT_SETTINGS[key];

  return value;
};
