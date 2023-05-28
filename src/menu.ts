import Tools from "./tools.js";

declare let header: HTMLDivElement;
declare let page: HTMLDivElement;

declare global {
  // eslint-disable-next-line no-var
  var tools: Tools;
}

window.tools = new Tools();

window.addEventListener("DOMContentLoaded", () => {
  const html = window.tools.menu();
  header.innerHTML = html[0];
  page.innerHTML = html[1];
});
