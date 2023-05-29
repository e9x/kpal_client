/* eslint-disable @typescript-eslint/no-explicit-any */
import { extendClientSettings } from "./extendSettings.js";
import KPalMenu, { drawWatermark } from "./menu.js";
import { waitFor } from "./util.js";

drawWatermark();

waitFor(
  () =>
    typeof windows === "object" &&
    Array.isArray(windows) &&
    windows.length >= 52
).then(() => {
  extendClientSettings(() => <KPalMenu />);
});
