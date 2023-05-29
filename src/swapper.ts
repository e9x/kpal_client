import { readdirSync, statSync } from "fs";
import { join } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import type { BrowserWindow } from "electron";
import { protocol } from "electron";
import config from "./config.js";

protocol.registerSchemesAsPrivileged([
  { scheme: "swapper", privileges: { bypassCSP: true, secure: true } },
]);

export function initSwapper() {
  protocol.registerFileProtocol("swapper", (request, callback) => {
    const url = new URL(request.url);
    callback({
      path: fileURLToPath(url.toString().replace(url.protocol, "file:")),
    });
  });
}

export function addSwapper(window: BrowserWindow) {
  const swap: {
    filter: { urls: string[] };
    files: Record<string, string>;
  } = { filter: { urls: [] }, files: {} };

  const readFolder = (dir: string, assets = true) => {
    const recursive = (dir: string, baseDir: string) => {
      for (const file of readdirSync(dir)) {
        const fullPath = join(dir, file);
        if (statSync(fullPath).isDirectory()) {
          recursive(fullPath, baseDir);
          break;
        }

        const krURL =
          "*://" +
          (assets ? "assets." : "") +
          "krunker.io" +
          fullPath.replace(baseDir, "") +
          "*";

        if (!swap.filter.urls.includes(krURL)) {
          swap.filter.urls.push(krURL);
          const url = pathToFileURL(fullPath);
          swap.files[krURL.replace(/\*/g, "")] = url
            .toString()
            .replace(url.protocol, "swapper:");
        }
      }
    };

    recursive(dir, dir);
  };

  const modelsFolder = config.get("tools_folderModels");

  if (config.get("tools_customModels") && modelsFolder.length > 0)
    readFolder(modelsFolder);

  if (config.get("tools_theme", false))
    readFolder(join(__dirname, "../img/theme"), false);

  if (swap.filter.urls.length > 0)
    window.webContents.session.webRequest.onBeforeRequest(
      swap.filter,
      (data, callback) => {
        callback({
          cancel: false,
          redirectURL:
            swap.files[data.url.replace(/https|http|(\?.*)|(#.*)/gi, "")] ||
            data.url,
        });
      }
    );
}
