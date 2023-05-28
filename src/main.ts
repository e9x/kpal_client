/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import { readdirSync, statSync } from "fs";
import { cpus } from "os";
import { join } from "path";
import { pathToFileURL } from "url";
import DiscordRPC from "discord-rpc";
import { app, BrowserWindow, ipcMain, Menu, shell } from "electron";
import type { Event } from "electron";
import localshortcut from "electron-localshortcut";
import Store from "electron-store";
import { autoUpdater } from "electron-updater";
import { gameURL } from "./regex.js";

const clientId = "566623836628582412";
DiscordRPC.register(clientId);
const rpc = new DiscordRPC.Client({ transport: "ipc" });
const time = new Date();

// Store.initRenderer()
// new Store() allows use in renderer
const config = new Store();
const DEBUG = process.argv.includes("--dev") || false;
const AMD_CPU = cpus()
  .map((c) => c.model.toLowerCase())
  .join("")
  .includes("amd");

class ClientSession {
  splashWindow: BrowserWindow | null = null;
  gameWindow: BrowserWindow | null = null;
  menuWindow: BrowserWindow | null = null;

  constructor() {
    this.splashWindow = null;
    this.gameWindow = null;
    this.menuWindow = null;

    this.setAppSwitches();
    this.initDiscordRPC();

    app.on("ready", () => this.initSplashWindow());
    app.on("activate", () => {
      if (!this.splashWindow || !this.gameWindow || !this.menuWindow)
        this.initSplashWindow();
    });

    app.on("window-all-closed", () => app.quit());
    app.on("before-quit", () => {
      // @ts-ignore
      localshortcut.unregisterAll();
      this.gameWindow?.close();
    });
  }

  start() {
    this.initGameWindow();
    this.initMenuWindow();

    this.initKeybinds();
  }

  setAppSwitches() {
    // if (DEBUG) app.commandLine.appendSwitch("--remote-debugging-port", "9222");

    //if (DEBUG) app.commandLine.appendSwitch('show-fps-counter');
    app.commandLine.appendSwitch("--in-process-gpu");

    if (!config.get("tools_vsync", true)) {
      app.commandLine.appendSwitch("disable-frame-rate-limit");
      if (AMD_CPU) {
        app.commandLine.appendSwitch("disable-zero-copy");
        app.commandLine.appendSwitch("ui-disable-partial-swap");
      }
    }
    app.commandLine.appendSwitch(
      "force-color-profile",
      config.get("tools_colorProfile", "default") as string
    );
    app.commandLine.appendSwitch("disable-http-cache");
    app.commandLine.appendSwitch("ignore-gpu-blacklist", "true");
    if (config.get("tools_d3d9", false)) {
      app.commandLine.appendSwitch("use-angle", "d3d9");
      app.commandLine.appendSwitch("renderer-process-limit", "100");
      app.commandLine.appendSwitch("max-active-webgl-contexts", "100");
    }
  }

  initSplashWindow() {
    this.splashWindow = new BrowserWindow({
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

    this.splashWindow.setMenu(null);
    this.splashWindow.loadURL(
      pathToFileURL(join(__dirname, "../html/splash.html")).toString()
    );

    this.splashWindow.once("ready-to-show", () => {
      this.splashWindow?.show();
      if (DEBUG)
        this.splashWindow?.webContents.openDevTools({
          mode: "undocked",
        });
      this.checkForUpdates();
    });
  }

  initGameWindow() {
    this.gameWindow = new BrowserWindow({
      width: 1600,
      height: 900,
      show: false,
      webPreferences: {
        webSecurity: false,
        enableRemoteModule: false,
        preload: join(__dirname, "preload.js"),
      },
    });
    this.gameWindow.setMenu(null);
    this.gameWindow.loadURL("https://krunker.io", {
      extraHeaders: "pragma: no-cache\n",
    });

    this.gameWindow.once("ready-to-show", () => {
      this.splashWindow?.close();
      this.gameWindow?.show();
      if (DEBUG)
        this.gameWindow?.webContents.openDevTools({
          mode: "undocked",
        });
    });

    const modelsFolder = config.get("tools_folderModels", "") as string;
    const modelsData: {
      filter: { urls: string[] };
      files: Record<string, string>;
    } = { filter: { urls: [] }, files: {} };

    if (modelsFolder.length > 0 && config.get("tools_customModels", false)) {
      const readFolder = (dir: string) =>
        readdirSync(dir).forEach((file) => {
          const fullPath = `${dir}/${file}`;
          if (statSync(fullPath).isDirectory()) {
            readFolder(fullPath);
          } else {
            const krURL =
              "https://krunker.io" + fullPath.replace(modelsFolder, "");
            modelsData.filter.urls.push(krURL);
            modelsData.files[krURL] = pathToFileURL(fullPath).toString();
          }
        });

      readFolder(modelsFolder);

      if (modelsData.filter.urls.length > 0) {
        this.gameWindow.webContents.session.webRequest.onBeforeRequest(
          modelsData.filter,
          (data, callback) => {
            callback({
              cancel: false,
              redirectURL: modelsData.files[data.url] || data.url,
            });
          }
        );
      }
    }

    const navClosure = (event: Event, url: string) => {
      event.preventDefault();
      if (gameURL.exec(url)) {
        this.gameWindow?.loadURL(url, { extraHeaders: "pragma: no-cache\n" });
      } else {
        shell.openExternal(url);
      }
    };

    this.gameWindow.webContents.on("will-navigate", navClosure);
    this.gameWindow.webContents.on("new-window", navClosure);

    this.gameWindow.on("focus", () => {
      if (this.menuWindow) this.menuWindow.hide();
    });
    this.gameWindow.on("closed", () => {
      this.gameWindow = null;
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
              // @ts-ignore
              { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
              {
                label: "Redo",
                accelerator: "Shift+CmdOrCtrl+Z",
                // @ts-ignore
                selector: "redo:",
              },
              { type: "separator" },
              // @ts-ignore
              { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
              // @ts-ignore
              { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
              {
                label: "Paste",
                accelerator: "CmdOrCtrl+V",
                // @ts-ignore
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
  }

  initMenuWindow() {
    this.menuWindow = new BrowserWindow({
      width: 800,
      height: 600,
      frame: false,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      show: false,
      parent: this.gameWindow!,
      webPreferences: {
        enableRemoteModule: false,
        preload: join(__dirname, "menu.js"),
      },
    });
    this.menuWindow.setMenu(null);
    this.menuWindow.loadURL(
      pathToFileURL(join(__dirname, "../html/menu.html")).toString()
    );

    this.menuWindow.once("ready-to-show", () => {
      if (DEBUG)
        this.menuWindow?.webContents.openDevTools({
          mode: "undocked",
        });
    });
    this.menuWindow.on("closed", () => {
      this.menuWindow = null;
    });

    ipcMain.on("restart", () => {
      app.relaunch();
      app.quit();
    });

    ipcMain.on("join-game", (event, url: string) => {
      this.gameWindow?.loadURL(url, {
        extraHeaders: "pragma: no-cache\n",
      });
    });

    ipcMain.on("visit-beta", () => {
      this.gameWindow?.loadURL("https://beta.krunker.io", {
        extraHeaders: "pragma: no-cache\n",
      });
    });

    ipcMain.on("resetSearchMatchMsg", () => {
      this.menuWindow?.webContents.executeJavaScript(
        'document.getElementById("searchMatchStatus").innerText = " ";'
      );
    });

    ipcMain.on("gameWindowKey", (event, key: string, val: any) => {
      this.gameWindow?.webContents.executeJavaScript(
        `window.tools.features[${JSON.stringify(key)}].value = ${JSON.stringify(
          val
        )}`
      );
    });

    ipcMain.on("gameWindowKeyPreload", (event, key: string, val: any) => {
      this.gameWindow?.webContents.executeJavaScript(
        `window.tools.features[${JSON.stringify(key)}].preload(${JSON.stringify(
          val
        )})`
      );
    });

    ipcMain.on(
      "sendStatus",
      (
        event,
        elName: string,
        msg = " ",
        status = "neutral",
        timeout = null
      ) => {
        this.menuWindow?.webContents
          .executeJavaScript(
            `${elName}.style.color = "${
              status == "good"
                ? "green"
                : status == "neutral"
                ? "orange"
                : "red"
            }";` + `${elName}.innerText = "${msg}";`
          )
          .then(() => {
            if (timeout)
              setInterval(
                () =>
                  this.menuWindow?.webContents.executeJavaScript(
                    `${elName}.innerText = " ";`
                  ),
                timeout
              );
          });
      }
    );

    this.gameWindow?.webContents.on("did-navigate-in-page", (event, url) => {
      if (gameURL.exec(url) && url.includes("?")) {
        this.menuWindow?.webContents.send("server-url", url);
      }
    });
  }

  initKeybinds() {
    localshortcut.register("Esc", () => {
      this.gameWindow?.webContents.executeJavaScript(
        "document.exitPointerLock();"
      );
    });
    localshortcut.register("F5", () => {
      this.gameWindow?.reload();
    });
    localshortcut.register("F11", () => {
      this.gameWindow?.setFullScreen(!this.gameWindow.isFullScreen());
    });
    localshortcut.register("Alt+F4", () => {
      app.quit();
    });
    localshortcut.register("Tab", () => {
      if (!this.menuWindow?.isVisible() && this.gameWindow?.isVisible()) {
        this.menuWindow?.show();
      } else {
        this.menuWindow?.hide();
        this.gameWindow?.focus();
      }
    });
  }

  checkForUpdates() {
    if (DEBUG || process.platform == "darwin") return this.start();
    autoUpdater.on("download-progress", (data) => {
      this.splashWindow?.webContents.send(
        "download-progress",
        Math.floor(data.percent)
      );
    });
    autoUpdater.on("update-available", () => {
      this.splashWindow?.webContents.send("update-available");
    });
    autoUpdater.once("update-not-available", () => {
      this.splashWindow?.webContents.send("update-not-available");
      this.start();
    });
    autoUpdater.on("update-downloaded", () => {
      autoUpdater.quitAndInstall();
    });
    autoUpdater.on("error", (error) => {
      this.splashWindow?.webContents.send("error", error.toString());
      // start later
      setTimeout(() => this.start(), 5e3);
    });
    autoUpdater.checkForUpdates();
  }

  initDiscordRPC() {
    const getSeconds = (timeText: string) => {
      const tokens = timeText.split(":").map((x) => parseInt(x));
      return tokens[0] * 60 + tokens[1];
    };

    const imageKey = (className: string) => {
      return className.replace(/\s/g, "_").toLowerCase();
    };

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
        joinSecret: this.gameWindow?.webContents.getURL(),
      });
    });
    ipcMain.on("idle", () => {
      time.setTime(Date.now());
      rpc.setActivity({
        state: "Idle",
        largeImageKey: "logo",
        startTimestamp: time,
      });
    });
    ipcMain.on("social", () => {
      time.setTime(Date.now());
      rpc.setActivity({
        state: "Social",
        largeImageKey: "logo",
        startTimestamp: time,
      });
    });
    ipcMain.on("editor", () => {
      time.setTime(Date.now());
      rpc.setActivity({
        state: "Editor",
        largeImageKey: "logo",
        startTimestamp: time,
      });
    });
    ipcMain.on("viewer", () => {
      time.setTime(Date.now());
      rpc.setActivity({
        state: "Viewer",
        largeImageKey: "logo",
        startTimestamp: time,
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
        this.gameWindow?.loadURL(secret, {
          extraHeaders: "pragma: no-cache\n",
        });
      });
    });
    rpc.login({ clientId }).catch(console.error);
  }
}

new ClientSession();
