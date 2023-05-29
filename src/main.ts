/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import { readdirSync, statSync } from "fs";
import { cpus } from "os";
import { join } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import DiscordRPC from "discord-rpc";
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  protocol,
  shell,
} from "electron";
import type { Event } from "electron";
import localshortcut from "electron-localshortcut";
import { autoUpdater } from "electron-updater";
import config from "./config.js";
import { searchMatch } from "./matchmaker.js";
import { editorURL, gameURL, socialURL, viewerURL } from "./regex.js";

const clientId = "566623836628582412";
DiscordRPC.register(clientId);
const rpc = new DiscordRPC.Client({ transport: "ipc" });
const time = new Date();

const DEBUG = process.argv.includes("--dev") || false;
const AMD_CPU = cpus()
  .map((c) => c.model.toLowerCase())
  .join("")
  .includes("amd");

if (process.argv.includes("--remote-debug"))
  app.commandLine.appendSwitch("--remote-debugging-port", "9222");

//if (DEBUG) app.commandLine.appendSwitch('show-fps-counter');
app.commandLine.appendSwitch("--in-process-gpu");

if (!config.get("tools_vsync")) {
  app.commandLine.appendSwitch("disable-frame-rate-limit");
  if (AMD_CPU) {
    app.commandLine.appendSwitch("disable-zero-copy");
    app.commandLine.appendSwitch("ui-disable-partial-swap");
  }
}
app.commandLine.appendSwitch(
  "force-color-profile",
  config.get("tools_colorProfile")
);

app.commandLine.appendSwitch("disable-http-cache");
app.commandLine.appendSwitch("ignore-gpu-blacklist", "true");

if (config.get("tools_d3d9")) {
  app.commandLine.appendSwitch("use-angle", "d3d9");
  app.commandLine.appendSwitch("renderer-process-limit", "100");
  app.commandLine.appendSwitch("max-active-webgl-contexts", "100");
}

let splashWindow: BrowserWindow | null = null;
let gameWindow: BrowserWindow | null = null;

app.on("ready", () => initSplashWindow());
app.on("activate", () => {
  if (!splashWindow || !gameWindow) initSplashWindow();
});

app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => {
  // @ts-ignore
  localshortcut.unregisterAll();
  gameWindow?.close();
});

protocol.registerSchemesAsPrivileged([
  { scheme: "swapper", privileges: { bypassCSP: true, secure: true } },
]);

function start() {
  initGameWindow();
  initKeybinds();
  initDiscordRPC();
}

function initSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 700,
    height: 300,
    frame: false,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    show: false,
    webPreferences: {
      enableRemoteModule: false,
      preload: join(__dirname, "splash.js"),
    },
  });

  splashWindow.setMenu(null);
  splashWindow.loadURL(
    pathToFileURL(join(__dirname, "../html/splash.html")).toString()
  );

  splashWindow.once("ready-to-show", () => {
    splashWindow?.show();
    if (DEBUG)
      splashWindow?.webContents.openDevTools({
        mode: "undocked",
      });
    checkForUpdates();
  });
}

function initGameWindow() {
  gameWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    show: false,
    webPreferences: {
      enableRemoteModule: false,
      webSecurity: false,
      preload: join(__dirname, "preload.js"),
    },
  });

  gameWindow.setMenu(null);
  gameWindow.loadURL("https://krunker.io");

  gameWindow.once("ready-to-show", () => {
    splashWindow?.close();
    gameWindow?.show();
    if (DEBUG)
      gameWindow?.webContents.openDevTools({
        mode: "undocked",
      });
  });

  protocol.registerFileProtocol(
    "swapper",
    (request, callback) => {
      const url = new URL(request.url);
      callback({
        path: fileURLToPath(url.toString().replace(url.protocol, "file:")),
      });
    },
    (err) => {
      if (err) console.error("Failed to register protocol");
    }
  );

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

  if (swap.filter.urls.length > 0) {
    gameWindow.webContents.session.webRequest.onBeforeRequest(
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

  const navClosure = (event: Event, url: string) => {
    event.preventDefault();
    if (gameURL.exec(url)) {
      gameWindow?.loadURL(url);
    } else {
      shell.openExternal(url);
    }
  };

  gameWindow.webContents.on("will-navigate", navClosure);
  gameWindow.webContents.on("new-window", navClosure);

  gameWindow.on("closed", () => {
    gameWindow = null;
  });

  if (process.platform == "darwin")
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        {
          label: "Application",
          submenu: [
            {
              label: "About Application",
              // @ts-ignore
              selector: "orderFrontStandardAboutPanel:",
            },
            { type: "separator" },
            {
              label: "Quit",
              accelerator: "Command+Q",
              click: () => app.quit(),
            },
          ],
        },
        {
          label: "Edit",
          submenu: [
            {
              label: "Undo",
              accelerator: "CmdOrCtrl+Z",
              selector: "undo:",
            },
            {
              label: "Redo",
              accelerator: "Shift+CmdOrCtrl+Z",
              selector: "redo:",
            },
            { type: "separator" },
            { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
            {
              label: "Copy",
              accelerator: "CmdOrCtrl+C",
              selector: "copy:",
            },
            {
              label: "Paste",
              accelerator: "CmdOrCtrl+V",
              selector: "paste:",
            },
            {
              label: "Select All",
              accelerator: "CmdOrCtrl+A",
              // @ts-ignore
              selector: "selectAll:",
            },
          ],
        },
      ])
    );

  ipcMain.on("restart-optional", async () => {
    const res = await dialog.showMessageBox(gameWindow!, {
      message:
        "A restart is required for changes to take affect. Do you want to restart now?",
      buttons: ["YES", "NO"],
    });

    if (res.response !== 0) return;

    app.relaunch();
    app.quit();
  });

  ipcMain.on("restart", () => {
    app.relaunch();
    app.quit();
  });

  ipcMain.on("reset-all", async () => {
    const res = await dialog.showMessageBox(gameWindow!, {
      message: "Are you sure you want to clear all client settings?",
      buttons: ["YES", "NO"],
    });

    if (res.response !== 0) return;

    config.clear();
    app.relaunch();
    app.quit();
  });

  ipcMain.on("search-match", () => {
    gameSearchMatch();
  });

  ipcMain.handle("pick-models-folder", async () => {
    const res = await dialog.showOpenDialog(gameWindow!, {
      message: "Pick a folder for the resource swapper",
      properties: ["openDirectory"],
    });
    const modelsFolder = res.filePaths[0];
    if (!modelsFolder) return;
    config.set("tools_folderModels", modelsFolder);
    return modelsFolder;
  });
}

async function gameSearchMatch() {
  if (!gameWindow) return;

  const defaultRegion = await gameWindow.webContents.executeJavaScript(
    "localStorage.pingRegion7"
  );
  const match = await searchMatch(defaultRegion);

  if (!gameWindow) return;

  if (!match)
    return dialog.showMessageBox(gameWindow!, {
      message: "No Matches Found :(",
    });

  gameWindow.webContents.loadURL(match);
}

function initKeybinds() {
  if (!gameWindow) return;

  localshortcut.register(gameWindow, "Esc", () => {
    gameWindow?.webContents.executeJavaScript("document.exitPointerLock();");
  });

  localshortcut.register(gameWindow, "F4", () => {
    gameSearchMatch();
  });

  localshortcut.register(gameWindow, "F5", () => {
    gameWindow?.reload();
  });

  localshortcut.register(gameWindow, "F11", () => {
    gameWindow?.setFullScreen(!gameWindow.isFullScreen());
  });

  localshortcut.register(gameWindow, "Alt+F4", () => {
    app.quit();
  });
}

function checkForUpdates() {
  if (DEBUG || process.platform == "darwin") return start();
  autoUpdater.on("download-progress", (data) => {
    splashWindow?.webContents.send(
      "download-progress",
      Math.floor(data.percent)
    );
  });
  autoUpdater.on("update-available", () => {
    splashWindow?.webContents.send("update-available");
  });
  autoUpdater.once("update-not-available", () => {
    splashWindow?.webContents.send("update-not-available");
    start();
  });
  autoUpdater.on("update-downloaded", () => {
    autoUpdater.quitAndInstall();
  });
  autoUpdater.on("error", (err) => {
    splashWindow?.webContents.send("error");
    dialog.showErrorBox("Download Failed", err.toString());
    // start later
    setTimeout(() => start(), 5e3);
  });
  autoUpdater.checkForUpdates();
}

function initDiscordRPC() {
  const getSeconds = (timeText: string) => {
    const tokens = timeText.split(":").map((x) => parseInt(x));
    return tokens[0] * 60 + tokens[1];
  };

  const imageKey = (className: string) => {
    return className.replace(/\s/g, "_").toLowerCase();
  };

  gameWindow?.webContents.addListener("did-navigate", (event, input) => {
    time.setTime(Date.now());

    if (gameURL.exec(input))
      rpc.setActivity({
        state: "Idle",
        largeImageKey: "logo",
        startTimestamp: time,
      });

    if (socialURL.exec(input))
      rpc.setActivity({
        state: "Social",
        largeImageKey: "logo",
        startTimestamp: time,
      });

    if (editorURL.exec(input))
      rpc.setActivity({
        state: "Editor",
        largeImageKey: "logo",
        startTimestamp: time,
      });

    if (viewerURL.exec(input))
      rpc.setActivity({
        state: "Viewer",
        largeImageKey: "logo",
        startTimestamp: time,
      });
  });

  ipcMain.on("game-info", (event, text) => {
    const info = JSON.parse(text);
    time.setTime(Date.now() + getSeconds(info.time) * 1000);
    rpc.setActivity({
      details: info.map.split("_")[1],
      state: `Playing ${info.mode}`,
      largeImageKey: "logo",
      largeImageText: info.username,
      smallImageKey: imageKey(info.class),
      smallImageText: info.class,
      endTimestamp: time,
      partyId: "krunker",
      joinSecret: gameWindow?.webContents.getURL(),
    });
  });

  rpc.on("ready", () => {
    rpc.on("RPC_MESSAGE_RECEIVED", (event) => {
      console.log(event);
    });
    rpc.subscribe("ACTIVITY_JOIN_REQUEST", () => {
      console.log("user");
    });
    rpc.subscribe("ACTIVITY_JOIN", ({ secret }: { secret: string }) => {
      gameWindow?.loadURL(secret);
    });
  });
  rpc.login({ clientId }).catch(console.error);
}
