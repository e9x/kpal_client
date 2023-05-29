import { cpus } from "os";
import { join } from "path";
import { pathToFileURL } from "url";
import DiscordRPC from "discord-rpc";
import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from "electron";
import type { Event } from "electron";
import localshortcut from "electron-localshortcut";
import { autoUpdater } from "electron-updater";
import config from "./config.js";
import { searchMatch } from "./matchmaker.js";
import { editorURL, gameURL, socialURL, viewerURL } from "./regex.js";
import { addSwapper, initSwapper } from "./swapper.js";

const clientId = "566623836628582412";
DiscordRPC.register(clientId);
const rpc = new DiscordRPC.Client({ transport: "ipc" });
const time = new Date();

const DEBUG = process.argv.includes("--dev");
const SANDBOX = process.argv.includes("--sandbox");
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
let socialWindow: BrowserWindow | null = null;
let editorWindow: BrowserWindow | null = null;
let viewerWindow: BrowserWindow | null = null;

app.on("ready", () => {
  initSwapper();
  initSplashWindow();
});

app.on("activate", () => {
  if (!splashWindow || !gameWindow) initSplashWindow();
});

app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => {
  if (gameWindow) {
    localshortcut.unregisterAll(gameWindow);
    gameWindow.close();
  }
});

function start() {
  initGameWindow(
    SANDBOX ? "https://krunker.io/?sandbox" : "https://krunker.io/"
  );
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
    if (DEBUG) {
      splashWindow?.webContents.openDevTools({
        mode: "undocked",
      });
      setTimeout(start, 1000);
    } else checkForUpdates();
  });
}

function listenNav(window: BrowserWindow) {
  function nav(event: Event, url: string, newWindow: boolean) {
    if (socialURL.test(url)) {
      if (window !== socialWindow || newWindow) {
        event.preventDefault();
        initSocialWindow(url);
      }
    } else if (editorURL.test(url)) {
      if (window !== editorWindow || newWindow) {
        event.preventDefault();
        initEditorWindow(url);
      }
    } else if (viewerURL.test(url)) {
      if (window !== viewerWindow || newWindow) {
        event.preventDefault();
        initViewerWindow(url);
      }
    } else if (gameURL.test(url)) {
      if (window !== gameWindow || newWindow) {
        event.preventDefault();
        initGameWindow(url);
      }
    } else {
      event.preventDefault();
      shell.openExternal(url);
    }
  }

  window.webContents.addListener("did-navigate", (event, url) =>
    nav(event, url, false)
  );
  window.webContents.addListener("new-window", (event, url) =>
    nav(event, url, true)
  );
}

function initGameWindow(url: string) {
  if (gameWindow) return gameWindow.loadURL(url);

  gameWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    show: false,
    webPreferences: {
      enableRemoteModule: false,
      preload: join(__dirname, "preload.js"),
    },
  });

  gameWindow.setMenu(null);
  gameWindow.loadURL(url);

  gameWindow.addListener("focus", () => {
    rpc
      .setActivity({
        state: "Idle",
        largeImageKey: "logo",
        startTimestamp: new Date(),
      })
      .catch(() => {
        //
      });
  });

  gameWindow.once("ready-to-show", () => {
    gameWindow?.show();
    setTimeout(() => splashWindow?.close(), 1e3);
    if (config.get("tools_fullScreen")) gameWindow?.setFullScreen(true);
    if (DEBUG)
      gameWindow?.webContents.openDevTools({
        mode: "undocked",
      });
  });

  gameWindow.on("closed", () => {
    gameWindow = null;
  });

  listenNav(gameWindow);

  addSwapper(gameWindow);

  if (process.platform == "darwin")
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        {
          label: "Application",
          submenu: [
            {
              label: "About Application",
              role: "about",
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
              role: "undo",
            },
            {
              label: "Redo",
              accelerator: "Shift+CmdOrCtrl+Z",
              role: "redo",
            },
            { type: "separator" },
            { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
            {
              label: "Copy",
              accelerator: "CmdOrCtrl+C",
              role: "copy",
            },
            {
              label: "Paste",
              accelerator: "CmdOrCtrl+V",
              role: "paste",
            },
            {
              label: "Select All",
              accelerator: "CmdOrCtrl+A",
              role: "selectAll",
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
    return modelsFolder;
  });
}

function initSocialWindow(url: string) {
  if (socialWindow) return socialWindow.loadURL(url);

  socialWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
  });

  socialWindow.setMenu(null);
  socialWindow.loadURL(url);

  socialWindow.addListener("focus", () => {
    rpc
      .setActivity({
        state: "Social",
        largeImageKey: "logo",
        startTimestamp: new Date(),
      })
      .catch(() => {
        //
      });
  });

  socialWindow.once("ready-to-show", () => {
    socialWindow?.show();
    if (DEBUG)
      socialWindow?.webContents.openDevTools({
        mode: "undocked",
      });
  });

  socialWindow.on("closed", () => {
    socialWindow = null;
  });

  listenNav(socialWindow);
}

function initEditorWindow(url: string) {
  if (editorWindow) return editorWindow.loadURL(url);

  editorWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
  });

  editorWindow.setMenu(null);
  editorWindow.loadURL(url);

  editorWindow.addListener("focus", () => {
    rpc
      .setActivity({
        state: "Editor",
        largeImageKey: "logo",
        startTimestamp: new Date(),
      })
      .catch(() => {
        //
      });
  });

  editorWindow.once("ready-to-show", () => {
    editorWindow?.show();
    if (DEBUG)
      editorWindow?.webContents.openDevTools({
        mode: "undocked",
      });
  });

  editorWindow.on("closed", () => {
    socialWindow = null;
  });

  listenNav(editorWindow);
}

function initViewerWindow(url: string) {
  if (viewerWindow) return viewerWindow.loadURL(url);

  viewerWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
  });

  viewerWindow.setMenu(null);
  viewerWindow.loadURL(url);

  viewerWindow.addListener("focus", () => {
    rpc
      .setActivity({
        state: "Viewer",
        largeImageKey: "logo",
        startTimestamp: new Date(),
      })
      .catch(() => {
        //
      });
  });

  viewerWindow.once("ready-to-show", () => {
    viewerWindow?.show();
    if (DEBUG)
      editorWindow?.webContents.openDevTools({
        mode: "undocked",
      });
  });

  viewerWindow.on("closed", () => {
    viewerWindow = null;
  });

  listenNav(viewerWindow);
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
    gameWindow?.webContents.send("exit-pointer-lock");
  });

  // Find match according to filters
  localshortcut.register(gameWindow, "F3", () => {
    gameSearchMatch();
  });

  // Find random match
  localshortcut.register(gameWindow, "F4", () => {
    gameWindow?.webContents.loadURL("https://krunker.io/");
  });

  localshortcut.register(gameWindow, "F5", () => {
    gameWindow?.reload();
  });

  localshortcut.register(gameWindow, "F11", () => {
    const fullscreen = !gameWindow?.isFullScreen();
    config.set("tools_fullScreen", fullscreen);
    gameWindow?.setFullScreen(fullscreen);
  });

  localshortcut.register(gameWindow, "Alt+F4", () => {
    app.quit();
  });
}

function checkForUpdates() {
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
    dialog
      .showMessageBox(splashWindow!, {
        type: "error",
        title: "Download Failed",
        message: err.toString(),
        buttons: ["OK"],
      })
      .then(() => start());
  });
  autoUpdater.checkForUpdates();
}

function initDiscordRPC() {
  const imageKey = (className: string) =>
    className.replace(/\s/g, "_").toLowerCase();

  let loadStart = Date.now();
  let loaded = false;

  const isLoadedData = (
    data: GameActivityData
  ): data is GameActivityLoadedData => data.id !== null;

  function parseActivity(data?: GameActivityData): DiscordRPC.Presence {
    if (!data || !isLoadedData(data))
      return {
        startTimestamp: loadStart,
        largeImageKey: "logo",
        state: "Loading",
      };

    if (!loaded) {
      loaded = true;
      loadStart = Date.now();
    }

    return {
      details: data.map,
      state: `Playing ${data.mode}`,
      largeImageKey: "logo",
      largeImageText: data.user,
      smallImageKey: imageKey(data.class.name),
      smallImageText: data.class.name,
      endTimestamp: time,
      partyId: "krunker",
      joinSecret: gameWindow?.webContents.getURL(),
    };
  }

  ipcMain.on("game-activity", (event, data?: GameActivityData) => {
    rpc.setActivity(parseActivity(data)).catch(() => {
      //
    });
  });

  rpc.on("ready", () => {
    rpc.subscribe("ACTIVITY_JOIN", ({ secret }: { secret: string }) => {
      gameWindow?.loadURL(secret);
    });
  });

  rpc.login({ clientId }).catch(() => {
    //
  });
}
