import { readFileSync } from "fs";
import { join } from "path";
import { ipcRenderer } from "electron";
import config from "./config";

const info = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8")
) as { version: string };

declare let updateStatus: HTMLDivElement;
declare let version: HTMLDivElement;
declare let logo: HTMLImageElement;

ipcRenderer.on("update-available", () => {
  updateStatus.innerHTML = "Downloading Update";
  updateStatus.style.color = "#ffd542";
});

ipcRenderer.on("download-progress", (event, text) => {
  updateStatus.innerHTML = `Downloading ${text}%`;
  updateStatus.style.color = "#ffd542";
});

ipcRenderer.on("update-not-available", () => {
  updateStatus.innerHTML = `Loading...`;
  updateStatus.style.color = "#ffd542";
});

ipcRenderer.on("error", () => {
  updateStatus.innerHTML = "Download Failed";
  updateStatus.style.color = "#eb5656";
});

window.addEventListener("DOMContentLoaded", () => {
  version.innerText = `v${info.version}`;

  if (config.get("tools_theme")) {
    logo.src = "../img/theme/img/logo_1.png";
    updateStatus.style.color = "#a21dc3";
    version.style.color = "#cc3636";
  }
});
