import Store from "electron-store";

const config = new Store<{
  tools_vsync: boolean;
  tools_d3d9: boolean;
  tools_colorProfile: string;
  tools_folderModels: string;
  tools_customModels: boolean;
  tools_region: string;
  tools_mode: string;
  tools_map: string;
  tools_type: string;
  tools_minPlayersSlider: number;
  tools_maxPlayersSlider: number;
  tools_autoSearch: boolean;
  tools_theme: boolean;
}>({
  defaults: {
    tools_vsync: true,
    tools_d3d9: false,
    tools_colorProfile: "default",
    tools_folderModels: "",
    tools_customModels: false,
    tools_region: "any",
    tools_mode: "default",
    tools_map: "",
    tools_type: "public",
    tools_minPlayersSlider: 0,
    tools_maxPlayersSlider: 8,
    tools_autoSearch: false,
    tools_theme: false,
  },
});

export default config;
