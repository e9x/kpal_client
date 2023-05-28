/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import { ipcRenderer } from "electron";
import Store from "electron-store";
import { gameURL } from "./regex.js";

const info = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8")
) as { version: string };

declare global {
  function pressButton(code: number): void;
}

declare let menuClassName: HTMLDivElement;
declare let curGameInfo: HTMLDivElement;
declare let mapInfo: HTMLDivElement;
declare let timerVal: HTMLDivElement;
declare let serverURL: HTMLInputElement;
declare let inGameUI: HTMLDivElement;
declare let endUI: HTMLDivElement;
declare let endTimer: HTMLDivElement;
declare let instructions: HTMLDivElement;
declare let killsIcon: HTMLImageElement;
declare let deathsIcon: HTMLImageElement;

const config = new Store();

interface Feature {
  name?: string;
  value?: any;
  disabled?: boolean;
  html: () => string;
  menu?: (v: any) => void;
  preload?: (v: any) => void;
  hide?: boolean;
}

export default class Tools {
  watermark: { el: HTMLDivElement | null };
  death: { el: null; count: number };
  hosting: { obs: null };
  header: { html: () => string };
  features: Record<string, Feature>;
  constructor() {
    this.watermark = {
      el: null,
    };
    this.death = {
      el: null,
      count: 0,
    };
    this.hosting = {
      obs: null,
    };

    this.header = {
      html: () => {
        return `
					<a href="#clientHeader">Client</a>
					 |
					<a href="#matchmakingHeader">Match Making</a>
					 |
					<a href="#moddingHeader">Modding</a>`;
      },
    };
    this.features = {
      clientHeader: {
        name: "Client",
        html: () => {
          return `
						<div id="clientHeader" class="setHed">
							${this.features.clientHeader.name}
						</div>`;
        },
      },
      serverURL: {
        name: "Server URL",
        value: "https://krunker.io",
        html: () => {
          return `
						<div class="settName">
							${this.features.serverURL.name}
							<a id='serverURL' class='label' style='color: green' onclick="window.tools.triggerEvent('serverURL', this.innerText)">${this.features.serverURL.value}</a>
						</div>`;
        },
        menu: (v) => {
          this.clipboardCopy(v);
        },
      },
      joinGame: {
        name: "Join Game",
        html: () => {
          return `
						<div class="settName">
							${this.features.joinGame.name}
							<div class="actionButton" onclick="window.tools.triggerEvent('joinGame')">Random</div>
							<div class="actionButton" onclick="window.tools.triggerEvent('joinGame', joinGame.value, false)">Go</div>
			            	<input id="joinGame" type="text" placeholder="Game URL" name="text" value="" oninput=""/>
						</div>`;
        },
        menu: (v) => {
          ipcRenderer.send(
            "join-game",
            v && v.match(gameURL) ? v : "https://krunker.io"
          );
        },
      },
      betaLink: {
        name: "Visit Beta",
        html: () => {
          return `
						<div class="settName">
							${this.features.betaLink.name}
							<a class='label' style='color: orange' onclick="window.tools.triggerEvent('betaLink')">https://beta.krunker.io/</a>
						</div>`;
        },
        menu: () => {
          ipcRenderer.send("visit-beta");
        },
      },
      vsync: {
        name: "VSYNC",
        value: config.get("tools_vsync", true),
        html: () => {
          return `
						<div class="settName">
							${this.features.vsync.name}
							<label class="switch" style="margin-left: 8px">
								<input type="checkbox" onclick="window.tools.triggerEvent('vsync', this.checked)" ${
                  this.features.vsync.value ? "checked" : ""
                } ${this.features.vsync.disabled ? "disabled" : ""}>
								<span class="slider" style="${
                  this.features.vsync.disabled ? "background-color: red" : ""
                }"></span>
							</label>
						</div>`;
        },
        preload: () => {
          alert("Changes will be made on restart");
        },
      },
      d3d9: {
        name: "DX9 Rendering",
        value: config.get("tools_d3d9", false),
        html: () => {
          return `
						<div class="settName">
							${this.features.d3d9.name}
							<label class="switch" style="margin-left: 8px">
								<input type="checkbox" onclick="window.tools.triggerEvent('d3d9', this.checked)" ${
                  this.features.d3d9.value ? "checked" : ""
                } ${this.features.d3d9.disabled ? "disabled" : ""}>
								<span class="slider" style="${
                  this.features.d3d9.disabled ? "background-color: red" : ""
                }"></span>
							</label>
						</div>`;
        },
        preload: () => {
          alert("Changes will be made on restart");
        },
      },
      colorProfile: {
        name: "Color Profile",
        value: config.get("tools_colorProfile", "default"),
        html: () => {
          const profiles = [
            ["default", "Default"],
            ["srgb", "sRGB"],
            ["generic-rgb", "Generic RGB"],
            ["color-spin-gamma24", "Color spin with gamma 2.4"],
          ];
          return `
						<div class="settName">
							${this.features.colorProfile.name}
							<select onchange="window.tools.triggerEvent('colorProfile', this.value)">
								${profiles
                  .map(
                    (v) =>
                      `<option value="${v[0]}" ${
                        this.features.colorProfile.value == v[0]
                          ? "selected"
                          : ""
                      }>${v[1]}</option>`
                  )
                  .join("")}
							</select>
						</div>`;
        },
        preload: () => {
          alert("Changes will be made on restart");
        },
      },
      rebootResetAll: {
        html: () => {
          return `
						<div class="settName">
							<a> </a>
							<a style="float: right; font-size: 20px" onclick="window.tools.triggerEvent('rebootResetAll', this.innerText.toLowerCase(), false)">Reset All</a>
							 <h style="float: right; padding-left: 5px; padding-right: 5px;"> | </h>
							<a style="float: right; font-size: 20px" onclick="window.tools.triggerEvent('rebootResetAll', this.innerText.toLowerCase(), false)">Reboot</a>
						</div>`;
        },
        preload: (v) => {
          switch (v) {
            case "reset all":
              if (
                confirm("Are you sure you want to clear all client settings?")
              ) {
                config.clear();
                alert("Settings Cleared! Client will now restart");
                ipcRenderer.send("restart");
              }
              break;
            case "reboot":
              alert("Client will now restart");
              ipcRenderer.send("restart");
              break;
          }
        },
      },
      matchmakingHeader: {
        name: "Match Making",
        html: () => {
          return `
						<br><div id="matchmakingHeader" class="setHed">
							${this.features.matchmakingHeader.name}
						</div>`;
        },
      },
      autoSearch: {
        name: "Auto-Search",
        value: config.get("tools_autoSearch", false),
        html: () => {
          return `
						<div class="settName">
							${this.features.autoSearch.name}
							<label class="switch">
								<input type="checkbox" onclick="window.tools.triggerEvent('autoSearch', this.checked)" ${
                  this.features.autoSearch.value ? "checked" : ""
                } ${this.features.autoSearch.disabled ? "disabled" : ""}>
								<span class="slider" style="${
                  this.features.autoSearch.disabled
                    ? "background-color: red"
                    : ""
                }"></span>
							</label>
						</div>`;
        },
      },
      filterSelect: {
        name: "Filters",
        value: [
          config.get("tools_region", "any"),
          config.get("tools_mode", "any"),
          config.get("tools_map", "any"),
          config.get("tools_type", "any"),
        ],
        html: () => {
          const regions = [
            ["de-fra", "FRA"],
            ["us-fl", "MIA"],
            ["us-ca-sv", "SV"],
            ["sgp", "SIN"],
            ["jb-hnd", "TOK"],
            ["au-syd", "SYD"],
          ];
          const modes = [
            ["ctf", "CTF"],
            ["ffa", "FFA"],
            ["tdm", "TDM"],
            ["point", "POINT"],
          ];
          const maps = [
            ["Burg", "Burg"],
            ["Littletown", "Littletown"],
            ["Sandstorm", "Sandstorm"],
            ["Subzero", "Subzero"],
          ];
          const types = [
            ["public", "Public"],
            ["custom", "Custom"],
          ];
          return `
						<div class="settName">
							${this.features.filterSelect.name}
							<select id="filterRegion" onchange="window.tools.triggerEvent('region', this.value)">
								<option value="any" ${
                  this.features.filterSelect.value[0] == "any" ? "selected" : ""
                }>Region</option>
								${regions
                  .map(
                    (v) =>
                      `<option value="${v[0]}" ${
                        this.features.filterSelect.value[0] == v[0]
                          ? "selected"
                          : ""
                      }>${v[1]}</option>`
                  )
                  .join("")}
		                    </select>
							<select id="filterMode" onchange="window.tools.triggerEvent('mode', this.value)">
								<option value="any" ${
                  this.features.filterSelect.value[1] == "any" ? "selected" : ""
                }>Mode</option>
								${modes
                  .map(
                    (v) =>
                      `<option value="${v[0]}" ${
                        this.features.filterSelect.value[1] == v[0]
                          ? "selected"
                          : ""
                      }>${v[1]}</option>`
                  )
                  .join("")}
							</select>
							<select id="filterMap" onchange="window.tools.triggerEvent('map', this.value)">
								<option value="any" ${
                  this.features.filterSelect.value[2] == "any" ? "selected" : ""
                }>Map</option>
								${maps
                  .map(
                    (v) =>
                      `<option value="${v[0]}" ${
                        this.features.filterSelect.value[2] == v[0]
                          ? "selected"
                          : ""
                      }>${v[1]}</option>`
                  )
                  .join("")}
							</select>
							<select id="filterType" onchange="window.tools.triggerEvent('type', this.value)">
								<option value="any" ${
                  this.features.filterSelect.value[3] == "any" ? "selected" : ""
                }>Type</option>
								${types
                  .map(
                    (v) =>
                      `<option value="${v[0]}" ${
                        this.features.filterSelect.value[3] == v[0]
                          ? "selected"
                          : ""
                      }>${v[1]}</option>`
                  )
                  .join("")}
							</select>
						</div>`;
        },
      },
      minPlayersSlider: {
        name: "Min Players",
        value: config.get("tools_minPlayersSlider", 0),
        html: () => {
          return `
						<div class="settName">
							${this.features.minPlayersSlider.name}
							<input id="minPlayersNumber" type="number" class="sliderVal" min="0" max="8" value="${this.features.minPlayersSlider.value}" oninput="window.tools.triggerEvent('minPlayersSlider', this.value); minPlayersSlider.value = this.value;">
			            	<div class="slidecontainer">
			            		<input id="minPlayersSlider" type="range" min="0" max="8" step="1" value="${this.features.minPlayersSlider.value}" class="sliderM" oninput="window.tools.triggerEvent('minPlayersSlider', this.value); minPlayersNumber.value = this.value;">
			            	</div>
						</div>`;
        },
      },
      maxPlayersSlider: {
        name: "Max Players",
        value: config.get("tools_maxPlayersSlider", 8),
        html: () => {
          return `
						<div class="settName">
							${this.features.maxPlayersSlider.name}
							<input id="maxPlayersNumber" type="number" class="sliderVal" min="0" max="8" value="${this.features.maxPlayersSlider.value}" oninput="window.tools.triggerEvent('maxPlayersSlider', this.value); maxPlayersSlider.value = this.value;">
			            	<div class="slidecontainer">
			            		<input id="maxPlayersSlider" type="range" min="0" max="8" step="1" value="${this.features.maxPlayersSlider.value}" class="sliderM" oninput="window.tools.triggerEvent('maxPlayersSlider', this.value); maxPlayersNumber.value = this.value;">
			            	</div>
						</div>`;
        },
      },
      searchMatch: {
        name: "Search",
        html: () => {
          return `
						<div class="settName">
							<a id="searchMatchStatus" style="font-size: 20px; text-decoration: none; color: orange"> </a>
							<a style="float: right; font-size: 20px" onclick="window.tools.triggerEvent('searchMatch')">${this.features.searchMatch.name}</a>
						</div>`;
        },
        preload: () => {
          this.searchMatch();
        },
      },
      moddingHeader: {
        name: "Modding",
        html: () => {
          return `
						<br><div id="moddingHeader" class="setHed">
							${this.features.moddingHeader.name}
						</div>`;
        },
      },
      customModels: {
        name: "Custom Models",
        value: config.get("tools_customModels", false),
        html: () => {
          return `
						<div class="settName">
							${this.features.customModels.name}
							<label class="switch" style="margin-left: 8px">
								<input type="checkbox" onclick="window.tools.triggerEvent('customModels', this.checked)" ${
                  this.features.customModels.value ? "checked" : ""
                }>
								<span class="slider"></span>
							</label>
						</div>`;
        },
        preload: () => {
          alert("Changes will be made on restart");
        },
        menu: (v) => {
          ["folderModels"].forEach((n) => {
            const el = document.getElementById(`${n}Hdr`);
            if (el) el.style.display = v ? "block" : "none";
          });
        },
      },
      folderModels: {
        name: "Folder",
        value: config.get("tools_folderModels", ""),
        hide: !config.get("tools_customModels", false),
        html: () => {
          return `
						<div id="folderModelsHdr" class="settName indent" style="display: ${
              this.features.folderModels.hide ? "none" : "block"
            }">
							${this.features.folderModels.name}
							<div class="actionButton" href="javascript:;" onclick="window.tools.openFolder().then(folder => {window.tools.triggerEvent('folderModels', folder); folderModels.value = folder})">Import</div>
			            	<input id="folderModels" type="text" placeholder="Model Path" name="text" value="${
                      this.features.folderModels.value
                    }" oninput="window.tools.triggerEvent('folderModels', this.value)"/>
						</div>`;
        },
      },
    };
  }

  private triggerEvent(key: string, val: any, store = true) {
    val = val == undefined ? null : val;
    if (val != null && store) config.set(`tools_${key}`, val);
    if (Object.keys(this.features).includes(key)) {
      if (val != null && this.features[key].value != undefined) {
        this.features[key].value = val;

        ipcRenderer.send("gameWindowKey", key, val);
      }
      if (this.features[key].menu) this.features[key].menu!(val);
      if (this.features[key].preload)
        ipcRenderer.send("gameWindowKeyPreload", key, val);
    }
  }

  private clipboardCopy(text: string) {
    const temp = document.createElement("textarea");
    temp.value = text;
    temp.style.zIndex = "-1";
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
  }

  private listenServerURL() {
    ipcRenderer.on("server-url", (event, url: string) => {
      serverURL.innerText = url;
    });
  }

  private searchMatch() {
    const filter = {
      region: config.get("tools_region", "any"),
      mode: config.get("tools_mode", "any"),
      map: config.get("tools_map", "any"),
      type: config.get("tools_type", "any"),
      minPlayers: config.get("tools_minPlayersSlider", 0) as number,
      maxPlayers: config.get("tools_maxPlayersSlider", 8) as number,
    };

    console.log(filter);

    this.sendStatus("searchMatchStatus", "Searching...", "neutral");

    fetch(
      "https://matchmaker.krunker.io/game-list?hostname=" + location.hostname
    )
      .then((data) => data.json())
      .then((json) => {
        const matches = json.filter(
          (match: {
            data: { i: unknown[]; cs: boolean };
            region: unknown;
            clients: number;
          }) => {
            return match.data.i
              ? (filter.region == "any"
                  ? true
                  : match.region == filter.region) &&
                  (filter.mode == "any"
                    ? true
                    : match.data.i.includes(filter.mode)) &&
                  (filter.map == "any"
                    ? true
                    : match.data.i.includes(filter.map)) &&
                  (filter.type == "any"
                    ? true
                    : match.data.cs == (filter.type == "custom")) &&
                  match.clients >= filter.minPlayers &&
                  match.clients <= filter.maxPlayers
              : false;
          }
        );
        if (matches.length > 0) {
          this.sendStatus("searchMatchStatus", "Match Found", "good");
          const randomMatch =
            matches[Math.floor(Math.random() * matches.length)];
          location.href =
            "https://krunker.io/?game=" +
            randomMatch.id +
            "&n=" +
            new Date().getTime();
        } else {
          this.sendStatus("searchMatchStatus", "No Matches Found", "bad");
          if (config.get("tools_autoSearch", false)) {
            this.searchMatch();
          } else {
            alert("No Matches Found :(");
          }
        }
      });
  }

  sendStatus(elName: string, msg = " ", status = "neutral", timeout = null) {
    ipcRenderer.send("sendStatus", elName, msg, status, timeout);
  }

  resetSearchMatchMsg() {
    //Use document in case menu hasnt loaded on initial start => will return null
    ipcRenderer.send("resetSearchMatchMsg");
  }

  observe(el: HTMLElement, attr: string, callback: (el: HTMLElement) => void) {
    const options =
      attr == "childList"
        ? { childList: true }
        : { attributes: true, attributeFilter: [attr] };
    return new MutationObserver((mutations) => {
      callback(mutations[0].target as HTMLElement);
    }).observe(el, options);
  }

  drawWatermark() {
    const el = document.createElement("div");
    el.innerText = "Krunker Client v" + info.version;
    el.style.cssText = `
        	font-size: 8pt;
        	color: black;
        	opacity: 0.1;
        	background-color: white;
        	z-index: 1000;
        	bottom: 0;
        	right: 0;
        	margin: auto;
        	position: absolute;
        `;
    this.watermark.el = el;
    document.body.appendChild(el);
  }

  drawKillCounter() {
    killsIcon.src = pathToFileURL(
      join(__dirname, "../img/kill.png")
    ).toString();
  }

  drawDeathCounter() {
    deathsIcon.src = pathToFileURL(
      join(__dirname, "../img/death.png")
    ).toString();
  }

  genObservers() {
    //Discord RPC
    this.observe(inGameUI, "style", (e: HTMLElement) => {
      if (e.style.display == "block") {
        ipcRenderer.send(
          "game-info",
          JSON.stringify({
            username: localStorage.krunker_username
              ? localStorage.krunker_username
              : "Guest",
            class: menuClassName.innerText,
            mode: curGameInfo.innerText,
            map: mapInfo.innerText,
            time: timerVal.innerText,
          })
        );
      }
    });
    this.observe(endUI, "style", (e: HTMLElement) => {
      if (e.style.display != "none") {
        ipcRenderer.send("idle");
      }
    });

    //Auto-Search
    this.observe(
      instructions,
      "childList",
      (e: { innerText: string | string[] }) => {
        if (this.features.autoSearch.value) {
          if (
            e.innerText.includes("Game is full.") ||
            e.innerText.includes("NoAvailableServers")
          ) {
            this.searchMatch();
          }
        }
      }
    );
    this.observe(endTimer, "childList", (e: { innerText: string }) => {
      if (this.features.autoSearch.value) {
        if (e.innerText.endsWith("01")) {
          this.searchMatch();
        }
      }
    });
  }
  preload() {
    this.drawWatermark();
    this.drawKillCounter();
    this.drawDeathCounter();

    this.resetSearchMatchMsg();

    this.genObservers();
  }

  menu() {
    this.listenServerURL();

    return [
      this.header.html(),
      Object.keys(this.features)
        .map((k) => this.features[k].html())
        .join(""),
    ];
  }
}
