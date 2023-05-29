export function drawKPalTheme() {
  const sheet = document.styleSheets[0];

  const style = (
    selector: string,
    property: string,
    value: string | null,
    priority?: string
  ) => {
    const rule = (
      [...sheet.cssRules].filter(
        (rule) => rule instanceof CSSStyleRule
      ) as CSSStyleRule[]
    ).find((rule) => !!rule.selectorText && rule.selectorText == selector);

    if (rule) rule.style.setProperty(property, value, priority);
  };

  style(".button", "background-color", "#333");
  style(".buttonR", "background-color", "#333");
  style(".buttonG", "background-color", "#333");
  style(".buttonP", "background-color", "#333");
  style(".button", "box-shadow", "inset 0 -7px 0 0 #222");
  style(".buttonR", "box-shadow", "inset 0 -7px 0 0 #222");
  style(".buttonG", "box-shadow", "inset 0 -7px 0 0 #222");
  style(".buttonP", "box-shadow", "inset 0 -7px 0 0 #222");
  style(".button", "color", "#ff4747");
  style(".buttonR", "color", "#ff47b7", "important");
  style(".buttonP", "color", "#b447ff", "important");
  style(".sliderVal", "background-color", "#ff4747");
  style("input:checked + .slider", "background-color", "#ff4747");
  style(".sliderM::-webkit-slider-thumb", "background-color", "#ff4747");
  style(".hostPresetBtn", "background-color", "#ff4747");
  style(".mapLoadButton", "background-color", "#ff4747");
  style(".xpBarB", "background-color", "#ff4747");
  style(".accountButton", "background-color", "#ff4747");
  style(".terms", "color", "#ff4747");
  style("a", "color", "#ff4747");
  style("a:visited", "color", "#ff4747");
  style(".button.btnRespin", "color", "#ff47b7", "important");
  style(".button.btnRespin", "background-color", "#333");
  style(".joinQueue", "background-color", "#ff4747");
  style(".joinQueue", "box-shadow", "inset 0 -7px 0 0 #cf3c3c");
  style(".joinQueue:hover", "box-shadow", "inset 0 -7px 0 0 #cf3c3c");
  style(".headerBar div", "color", null);
  style(".menuItem:hover", "background", "#ff4747");
  style(".strmViews", "color", "#ff4747");
  style("#serverSearch, #settingSearch", "background-color", "#333");
  style(".settingsHeader", "background-color", "#333");
  style(".serverHeader", "background-color", "#333");
  style(".quickJoin", "background-color", "#ff4747");
  style("#page", "background-color", "#333");
  style("#menuWindow", "background-color", "#333");
  style("#menuWindow", "box-shadow", "#222 0px 9px 0px 0px");
  style("#bodyBorder", "border", "8px solid #242424");
  style(".settName", "color", "rgba(255,255,255,.5)");
  style(".settName, .settNameSmall", "color", "rgba(255,255,255,.5)");
  style(".b", "color", "rgba(255,255,255,.8)");
  style("*", "color", "#eee");
  style("input", "background-color", "#222", "important");
  style("input", "border-color", "#222", "important");
  style(".inputGrey2", "background", "#222");
  style(".inputGrey", "background", "#222");
  style(".formInput", "background", "#222");
  style("::-webkit-scrollbar", "background-color", null);
  style("::-webkit-scrollbar-track", "background-color", "#222");
  style("::-webkit-scrollbar-thumb", "background-color", "#444");
  style(".slider", "background-color", "#222");
  style(".hostToggle", "background", "#ff4747");
  sheet.insertRule("::placeholder { color: rgba(255, 255, 255, 0.2) }", 0);
  sheet.insertRule("#presetSelect { background-color: #222 !important }", 0);
}
