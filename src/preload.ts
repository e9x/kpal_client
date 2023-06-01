import "./tools.js";
import { ipcRenderer } from "electron";
import config from "./config.js";
import { drawKPalTheme } from "./kpalTheme.js";
import { searchMatch } from "./matchmaker.js";

const changePlayerListHotKey = () =>
  localStorage.setItem("cont_listKey", "113");
changePlayerListHotKey();

document.addEventListener("DOMContentLoaded", () => {
  if (config.get("tools_theme")) drawKPalTheme();
});

function getGameActivitySafe() {
  try {
    return getGameActivity();
  } catch (err) {
    //
  }
}

setInterval(() => {
  ipcRenderer.send("game-activity", getGameActivitySafe());
}, 2000);

ipcRenderer.on("exit-pointer-lock", () => {
  document.exitPointerLock();
});

ipcRenderer.on("search-match", searchMatch);
