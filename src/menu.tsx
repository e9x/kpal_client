import { readFileSync } from "fs";
import { join } from "path";
import ClientSection from "./sections/client.js";
import MatchmakingSection from "./sections/matchmaking.js";
import ModdingSection from "./sections/modding.js";

const info = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8")
) as { version: string };

export function drawWatermark() {
  const el = document.createElement("div");
  el.innerText = "Krunker Client v" + info.version;
  Object.assign(el.style, {
    fontSize: "8pt",
    color: "black",
    opacity: "0.1",
    backgroundColor: "white",
    zIndex: "1000",
    bottom: "0",
    right: "0",
    margin: "auto",
    position: "absolute",
  } as CSSStyleDeclaration);
  document.addEventListener("DOMContentLoaded", () =>
    document.body.appendChild(el)
  );
}

export default function KPalMenu() {
  return (
    <>
      <ClientSection />
      <MatchmakingSection />
      <ModdingSection />
    </>
  );
}
