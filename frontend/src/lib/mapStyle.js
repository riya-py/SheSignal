// No API key needed — CARTO's free basemap tiles, attribution required (included in SafetyMap).
// Swap these for a MapTiler/Stadia style + key later if you want vector tiles or higher usage limits.
export function getMapStyle(theme) {
  const tiles =
    theme === "dark"
      ? ["https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
         "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
         "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"]
      : ["https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
         "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
         "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"];

  return {
    version: 8,
    sources: {
      basemap: {
        type: "raster",
        tiles,
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    },
    layers: [{ id: "basemap", type: "raster", source: "basemap" }],
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  };
}