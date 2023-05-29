/* eslint-disable @typescript-eslint/no-explicit-any */
import { extendClientSettings } from "./extendSettings.js";
import KPalMenu from "./menu.js";
import { waitFor } from "./util.js";

waitFor(
  () =>
    typeof windows === "object" &&
    Array.isArray(windows) &&
    windows.length >= 52
).then(() => {
  extendClientSettings(() => <KPalMenu />);
});
