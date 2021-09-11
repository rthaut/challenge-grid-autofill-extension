import { createChromeStorageStateHookSync as createBrowserStorageStateHookSync } from "use-chrome-storage";
import { GRIDS_STORAGE_KEY } from "utils/grids";

export const useGridStore = createBrowserStorageStateHookSync(
  GRIDS_STORAGE_KEY,
  []
);

export default useGridStore;
