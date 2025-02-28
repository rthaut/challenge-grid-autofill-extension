/**
 * THIS EXISTS BECAUSE THE `useSearch` HOOK FROM `react-use` DOESN'T SEEM TO FULLY WORK IN EXTENSION PAGES
 *
 * The value from `useSearch` doesn't update when using either
 * `window.location.replace()` or `history.replaceState()`
 * to change a query param within the the Create/Edit Grid App
 */

import * as React from "react";

import { useLocation } from "react-use";

export const useQueryParam = (param: string) => {
  const { search } = useLocation();

  const [value, setValue] = React.useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(search?.replace("?", ""));
    setValue(params.get(param));
  }, [search]);

  return value;
};

export default useQueryParam;
