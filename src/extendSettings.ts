import type { RenderOnDemand } from "krunker-ui/container";
import { createRenderContainer } from "krunker-ui/container";

// settings window ID
// showWindow(x)
// x - 1
const id = 0;

/**
 * Create a native client settings tab
 */
export async function extendClientSettings(render: RenderOnDemand) {
  const window = windows[id] as Settings | undefined;

  if (!window) throw new Error(`Couldn't find game window with ID ${id}`);

  /**
   * Keep track of the custom tab index
   */
  const indexes: Record<string, number> = {};

  for (const mode in window.tabs) {
    // last tab is always client
    indexes[mode] = window.tabs[mode].length - 1;
  }

  const html = createRenderContainer(render);

  const { getSettings } = window;

  window.getSettings = function () {
    return window.tabIndex === indexes[window.settingType]
      ? html
      : getSettings.call(this);
  };
}
