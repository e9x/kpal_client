import { ipcRenderer } from "electron";
import Picker from "krunker-ui/components/Picker";
import { Set } from "krunker-ui/components/Set";
import Switch from "krunker-ui/components/Switch";
import { useRef } from "react";
import config from "../config.js";

export default function ModdingSection() {
  const modelsRef = useRef<HTMLInputElement | null>(null);

  return (
    <Set title="Modding">
      <Switch
        title="Resource Swapper"
        defaultChecked={config.get("tools_customModels")}
        onChange={(e) =>
          config.set("tools_customModels", e.currentTarget.checked)
        }
      />
      <Picker
        title="Swapper Folder"
        defaultValue={config.get("tools_folderModels")}
        attention
        description="Requires restart"
        ref={modelsRef}
        onChange={(e) =>
          config.set("tools_folderModels", e.currentTarget.value)
        }
        onBrowse={async () => {
          const folder = (await ipcRenderer.invoke(
            "pick-models-folder"
          )) as string;
          config.set("tools_folderModels", folder);
          if (modelsRef.current) modelsRef.current.value = folder;
        }}
      />
    </Set>
  );
}
