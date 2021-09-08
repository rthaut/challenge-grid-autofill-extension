import { createChromeStorageStateHookSync as createBrowserStorageStateHookSync } from "use-chrome-storage";
import { SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS } from "../../utils/settings";

export const useSettingsStore = createBrowserStorageStateHookSync(
  SETTINGS_STORAGE_KEY,
  DEFAULT_SETTINGS
);

export default useSettingsStore;
