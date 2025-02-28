import { createChromeStorageStateHookSync as createBrowserStorageStateHookSync } from "use-chrome-storage";

import { type Grid, GRIDS_STORAGE_KEY } from "@/utils/grids";

export const useGridStore = createBrowserStorageStateHookSync<Partial<Grid>[]>(
  GRIDS_STORAGE_KEY,
  [],
);

export default useGridStore;
