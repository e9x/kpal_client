/// <reference types="krunker-ui/window" />

declare type GameActivityData =
  | GameActivityLoadedData
  | GameActivityPartialData;

declare interface GameActivityPartialData {
  id: null;
  time: null;
  user: string;
  class: {
    name: string;
    index: string;
  };
  map: null;
  mode: null;
  custom: boolean;
}

declare interface GameActivityLoadedData {
  id: string;
  time: number;
  user: string;
  class: {
    name: string;
    index: string;
  };
  map: string;
  mode: string;
  custom: boolean;
}

declare function getGameActivity(): GameActivityData;
