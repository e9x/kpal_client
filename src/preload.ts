import "./tools.js";
import { editorURL, gameURL, viewerURL } from "./regex.js";

const changePlayerListHotKey = () =>
  localStorage.setItem("cont_listKey", "113");
changePlayerListHotKey();

const fixMenuIcons = () => {
  for (const el of document.querySelectorAll<HTMLDivElement>(".menuItemIcon"))
    el.style.height = "60px";
};

document.addEventListener("DOMContentLoaded", () => {
  if (editorURL.exec(location.href) || viewerURL.exec(location.href)) {
    window.onbeforeunload = null;
  } else if (gameURL.exec(location.href)) {
    fixMenuIcons();
  }
});
