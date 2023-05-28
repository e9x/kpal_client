import { ipcRenderer } from "electron";
import { editorURL, gameURL, socialURL, viewerURL } from "./regex.js";
import Tools from "./tools.js";

declare global {
  // eslint-disable-next-line no-var
  var tools: Tools;
}

window.tools = new Tools();

const changePlayerListHotKey = () =>
  localStorage.setItem("cont_listKey", "113");
changePlayerListHotKey();

const initDiscordRPC = () => {
  if (gameURL.exec(location.href)) ipcRenderer.send("idle");
  if (socialURL.exec(location.href)) ipcRenderer.send("social");
  if (editorURL.exec(location.href)) ipcRenderer.send("editor");
  if (viewerURL.exec(location.href)) ipcRenderer.send("viewer");
};

const fixMenuIcons = () => {
  for (const el of document.querySelectorAll<HTMLDivElement>(".menuItemIcon"))
    el.style.height = "60px";
};

document.addEventListener("DOMContentLoaded", () => {
  initDiscordRPC();

  if (editorURL.exec(location.href) || viewerURL.exec(location.href)) {
    window.onbeforeunload = null;
  } else if (gameURL.exec(location.href)) {
    fixMenuIcons();
    tools.preload();
  }
});
