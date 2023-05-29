import { ipcRenderer } from "electron";
import Button from "krunker-ui/components/Button";
import Select from "krunker-ui/components/Select";
import { Set } from "krunker-ui/components/Set";
import Switch from "krunker-ui/components/Switch";
import config from "../config.js";

export default function ClientSection() {
  return (
    <Set title="Client">
      <Switch
        title="VSync"
        defaultChecked={config.get("tools_vsync")}
        attention
        description="Requires restart"
        onChange={(e) => {
          config.set("tools_vsync", e.currentTarget.checked);
          ipcRenderer.send("restart-optional");
        }}
      />
      <Switch
        title="KPal Theme"
        defaultChecked={config.get("tools_theme")}
        onChange={(e) => config.set("tools_theme", e.currentTarget.checked)}
      />
      <Switch
        title="DX9 Rendering"
        defaultChecked={config.get("tools_d3d9")}
        attention
        description="Requires restart"
        onChange={(e) => {
          config.set("tools_d3d9", e.currentTarget.checked);
          ipcRenderer.send("restart-optional");
        }}
      />
      <Select
        title="Color Profile"
        defaultValue={config.get("tools_colorProfile")}
        onChange={(e) => {
          config.set("tools_colorProfile", e.currentTarget.value);
          ipcRenderer.send("restart-optional");
        }}
      >
        <option value="default">Default</option>
        <option value="srgb">sRGB</option>
        <option value="generic-rgb">Generic RGB</option>
        <option value="color-spin-gamma24">Color spin with gamma 2.4</option>
      </Select>
      <Button
        text="Reset"
        title="Reset All"
        onClick={() => ipcRenderer.send("reset-all")}
      />
      <Button
        text="↻"
        title="Reboot"
        onClick={() => ipcRenderer.send("restart")}
      />
    </Set>
  );
}
