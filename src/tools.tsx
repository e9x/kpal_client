/* eslint-disable @typescript-eslint/no-explicit-any */
import { extendClientSettings } from "./extendSettings.js";
import KPalMenu from "./menu.js";
import { waitFor } from "./util.js";

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

waitFor(
  () =>
    typeof windows === "object" &&
    Array.isArray(windows) &&
    windows.length >= 52
).then(() => {
  extendClientSettings(() => <KPalMenu />);
});
