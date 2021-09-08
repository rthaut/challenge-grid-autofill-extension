/**
 * THIS EXISTS BECAUSE THE `useSearch` HOOK FROM `react-use` DOESN'T SEEM TO FULLY WORK IN EXTENSION PAGES
 *
 * The value from `useSearch` doesn't update when using either
 * `window.location.replace()` or `history.replaceState()`
 * to change a query param within the the Create/Edit Grid App
 */

import { useEffect, useState } from "react";
import { useLocation } from "react-use";

export const useQueryParam = (param) => {
  const { search } = useLocation();

  const [value, setValue] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(search.replace("?", ""));
    setValue(params.get(param));
  }, [search]);

  return value;
};

export default useQueryParam;
