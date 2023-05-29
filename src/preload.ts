import "./tools.js";
import { ipcRenderer } from "electron";
import config from "./config.js";
import { drawKPalTheme } from "./kpalTheme.js";
import { editorURL, gameURL, viewerURL } from "./regex.js";

const changePlayerListHotKey = () =>
  localStorage.setItem("cont_listKey", "113");
changePlayerListHotKey();

const fixMenuIcons = () => {
  for (const el of document.querySelectorAll<HTMLDivElement>(".menuItemIcon"))
    el.style.height = "60px";
};

document.addEventListener("DOMContentLoaded", () => {
  if (config.get("tools_theme")) drawKPalTheme();

  if (editorURL.exec(location.href) || viewerURL.exec(location.href)) {
    window.onbeforeunload = null;
  } else if (gameURL.exec(location.href)) {
    fixMenuIcons();
  }
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
