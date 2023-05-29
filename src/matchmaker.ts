import { session } from "electron";
import fetch from "node-fetch";
import config from "./config.js";

export const gameModes: string[] = [
  "Free for All",
  "Team Deathmatch",
  "Hardpoint",
  "Capture the Flag",
  "Parkour",
  "Hide & Seek",
  "Infected",
  "Race",
  "Last Man Standing",
  "Simon Says",
  "Gun Game",
  "Prop Hunt",
  "Boss Hunt",
  "Classic FFA",
  "Deposit",
  "Stalker",
  "King of the Hill",
  "One in the Chamber",
  "Trade",
  "Kill Confirmed",
  "Defuse",
  "Sharp Shooter",
  "Traitor",
  "Raid",
  "Blitz",
  "Domination",
  "Squad Deathmatch",
  "Kranked FFA",
  "Team Defender",
  "Deposit FFA",
  "Carrier",
  "All or Nothing",
  "Mag Dump",
  "Chaos Snipers",
  "Bighead FFA",
  "Zombies",
  "Impulsed",
];

// Prefer to use localStorage.pingRegion7 by default
export const gameRegions: Record<string, string> = {
  "us-nj": "New York",
  "us-il": "Chicago",
  "us-tx": "Dallas",
  "us-wa": "Seattle",
  "us-ca-la": "Los Angeles",
  "us-ga": "Atlanta",
  "nl-ams": "Amsterdam",
  "gb-lon": "London",
  "de-fra": "Frankfurt",
  "us-ca-sv": "Silicon Valley",
  "au-syd": "Sydney",
  "fr-par": "Paris",
  "jb-hnd": "Tokyo",
  "us-fl": "Miami",
  sgp: "Singapore",
  blr: "India",
  "as-mb": "Mumbai",
  brz: "Brazil",
  "me-bhn": "Middle East",
  "af-ct": "South Africa",
  "as-seoul": "South Korea",
  "mx-cmx": "Mexico",
  "eu-stm": "Sweden",
  tor: "Toronto",
  pol: "Poland",
  "us-hi": "Hawaii",
};

type GameAPI = [
  id: string,
  region: string,
  players: number,
  maxPlayers: number,
  data: {
    /**
     * map
     */
    i: string;
    /**
     * mode
     */
    g: number;
    /**
     * custom 0 = false, 1 = true
     */
    c: number;
  }
];

function parseGameAPI(gameAPI: GameAPI) {
  return {
    id: gameAPI[0],
    region: gameAPI[1],
    players: gameAPI[2],
    maxPlayers: gameAPI[2],
    data: {
      map: gameAPI[4].i,
      mode: gameAPI[4].g,
      custom: gameAPI[4].c === 1,
    },
  };
}

export async function searchMatch(defaultRegion: string) {
  const region = config.get("tools_region");
  const mode = config.get("tools_mode");
  const map = config.get("tools_map");
  const type = config.get("tools_type");
  const minPlayers = config.get("tools_minPlayersSlider");
  const maxPlayers = config.get("tools_maxPlayersSlider");

  const targetRegion =
    region === "default" ? defaultRegion : region === "any" ? -1 : region;
  const targetMap = map.trim();
  const targetMode = mode === "any" ? -1 : gameModes.indexOf(mode);

  console.log({ region, mode, map, type, minPlayers, maxPlayers });

  while (true) {
    console.log("searchMatchStatus", "Searching...");

    const res = await fetch(
      "https://matchmaker.krunker.io/game-list?hostname=krunker.io",
      {
        headers: {
          "user-agent": session.defaultSession.getUserAgent(),
        },
      }
    );

    const json = (await res.json()) as {
      games: GameAPI[];
    };

    const matches = json.games.map(parseGameAPI).filter((game) => {
      if (targetRegion !== -1 && game.region !== targetRegion) return false;
      if (targetMode !== -1 && game.data.mode !== targetMode) return false;
      if (targetMap !== "" && !game.data.map.includes(targetMap)) return false;

      if (type !== "any" && game.data.custom !== (type === "custom"))
        return false;

      if (game.players < minPlayers) return false;
      if (game.players > maxPlayers) return false;

      return true;
    });

    if (!matches.length) {
      console.log("searchMatchStatus", "No Matches Found");
      if (config.get("tools_autoSearch")) continue;
      else return;
    }

    const randomMatch = matches[~~(Math.random() * matches.length)];

    console.log("searchMatchStatus", "Match Found", randomMatch);
    return "https://krunker.io/?game=" + randomMatch.id;
  }
}
