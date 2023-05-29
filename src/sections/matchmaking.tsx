import { ipcRenderer } from "electron";
import Button from "krunker-ui/components/Button";
import Select from "krunker-ui/components/Select";
import { Set } from "krunker-ui/components/Set";
import Slider from "krunker-ui/components/Slider";
import Switch from "krunker-ui/components/Switch";
import Text from "krunker-ui/components/Text";
import config from "../config.js";
import { gameModes, gameRegions } from "../matchmaker.js";

export default function MatchmakingSection() {
  return (
    <Set title="Matchmaking">
      <Switch
        title="Auto-Search"
        defaultChecked={config.get("tools_autoSearch")}
        onChange={(e) =>
          config.set("tools_autoSearch", e.currentTarget.checked)
        }
      />
      <Select
        title="Region"
        defaultValue={config.get("tools_region")}
        onChange={(e) => config.set("tools_region", e.currentTarget.value)}
      >
        <option value="default">Default</option>
        <option value="any">Any</option>
        {...Object.entries(gameRegions).map(([id, name], i) => (
          <option key={i} value={id}>
            {name}
          </option>
        ))}
      </Select>
      <Select
        title="Mode"
        defaultValue={config.get("tools_mode")}
        onChange={(e) => config.set("tools_mode", e.currentTarget.value)}
      >
        <option value="any">Any</option>
        {...gameModes.map((mode, i) => (
          <option key={i} value={mode}>
            {mode}
          </option>
        ))}
      </Select>
      <Text
        title="Map"
        description="Leave empty for any map"
        defaultValue={config.get("tools_map")}
        onChange={(e) => config.set("tools_map", e.currentTarget.value)}
      />
      <Select
        title="Type"
        defaultValue={config.get("tools_type")}
        onChange={(e) => config.set("tools_type", e.currentTarget.value)}
      >
        <option value="public">Public</option>
        <option value="custom">Custom</option>
        <option value="any">Any</option>
      </Select>
      <Slider
        title="Minimum Players"
        min={0}
        max={8}
        defaultValue={config.get("tools_minPlayersSlider")}
        onChange={(e) =>
          config.set("tools_minPlayersSlider", e.currentTarget.valueAsNumber)
        }
      />
      <Slider
        title="Maximum Players"
        min={0}
        max={8}
        defaultValue={config.get("tools_minPlayersSlider")}
        onChange={(e) =>
          config.set("tools_minPlayersSlider", e.currentTarget.valueAsNumber)
        }
      />
      <Button
        text="🔎"
        title="Search"
        onClick={() => ipcRenderer.send("search-match")}
      />
    </Set>
  );
}
