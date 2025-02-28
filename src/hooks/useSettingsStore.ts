import { createChromeStorageStateHookSync as createBrowserStorageStateHookSync } from "use-chrome-storage";

import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  type Settings,
} from "@/utils/settings";

export const useSettingsStore = createBrowserStorageStateHookSync<Settings>(
  SETTINGS_STORAGE_KEY,
  DEFAULT_SETTINGS,
);

export default useSettingsStore;
