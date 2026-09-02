// CARTO's free anonymous raster tiles now require an API key (started returning an
// "API KEY REQUIRED" watermark instead of serving tiles). Using OpenStreetMap's own
// standard tile server instead — genuinely free, no key, no signup.
// Note: OSM's tile.openstreetmap.org has no official dark variant, so dark mode reuses
// the same tiles with a CSS filter applied in index.css (.maplibregl-canvas in dark mode).
export function getMapStyle(theme) {
  const tiles = [
    "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
    "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
    "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
  ];

  return {
    version: 8,
    sources: {
      basemap: {
        type: "raster",
        tiles,
        tileSize: 256,
        maxzoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    },
    layers: [
      {
        id: "basemap",
        type: "raster",
        source: "basemap",
        // Neutral dark map: fully desaturated (no hue-rotate, so no purple/
        // color-inverted tint) then darkened via brightness so it reads as a
        // true grayscale dark basemap instead of a recolored one.
        paint:
          theme === "dark"
            ? {
                "raster-saturation": -1,
                "raster-brightness-min": 0,
                "raster-brightness-max": 0.5,
                "raster-contrast": 0.1,
              }
            : {},
      },
    ],
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  };
}