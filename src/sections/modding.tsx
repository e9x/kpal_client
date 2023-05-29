import { ipcRenderer } from "electron";
import Picker from "krunker-ui/components/Picker";
import { Set } from "krunker-ui/components/Set";
import Switch from "krunker-ui/components/Switch";
import React, { useState } from "react";
import config from "../config.js";

export default function ModdingSection() {
  const [modelsFolder, setModelsFolder] = useState(
    config.get("tools_folderModels")
  );

  return (
    <Set title="Modding">
      <Switch
        title="Custom Models"
        defaultChecked={config.get("tools_customModels")}
        onChange={(e) =>
          config.set("tools_customModels", e.currentTarget.checked)
        }
      />
      <Picker
        title="Models Folder"
        value={modelsFolder}
        attention
        description="Requires restart"
        onBrowse={async () => {
          setModelsFolder(await ipcRenderer.invoke("pick-models-folder"));
        }}
      />
    </Set>
  );
}
