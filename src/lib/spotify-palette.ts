export type SpotifyColors = { primary: string; secondary: string };

const neutral = { primary: "#bababa", secondary: "#929292" };
const bins = 24;
const fullTurn = Math.PI * 2;

function toLinear(value: number) {
  const channel = value / 255;
  return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
}

function toOKLab(red: number, green: number, blue: number) {
  const r = toLinear(red), g = toLinear(green), b = toLinear(blue);
  const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b);
  const m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b);
  const s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
  return {
    lightness: .2104542553 * l + .793617785 * m - .0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + .4505937099 * s,
    b: .0259040371 * l + .7827717662 * m - .808675766 * s,
  };
}

function gamutColor(lightness: number, chroma: number, hue: number) {
  const channels = (c: number) => {
    const a = c * Math.cos(hue), b = c * Math.sin(hue);
    const l = (lightness + .3963377774 * a + .2158037573 * b) ** 3;
    const m = (lightness - .1055613458 * a - .0638541728 * b) ** 3;
    const s = (lightness - .0894841775 * a - 1.291485548 * b) ** 3;
    return [
      4.0767416621 * l - 3.3077115913 * m + .2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s,
      -.0041960863 * l - .7034186147 * m + 1.707614701 * s,
    ];
  };

  let rgb = channels(chroma);
  while (rgb.some((value) => value < 0 || value > 1)) rgb = channels(chroma *= .88);
  return "#" + rgb.map((value) => {
    const channel = value <= .0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - .055;
    return Math.round(channel * 255).toString(16).padStart(2, "0");
  }).join("");
}

export function extractSpotifyColors(pixels: Uint8ClampedArray): SpotifyColors {
  const histogram = Array.from({ length: bins }, () => ({ weight: 0, count: 0, a: 0, b: 0, chroma: 0, lightness: 0 }));
  let visiblePixels = 0;

  for (let offset = 0; offset < pixels.length; offset += 4) {
    if (pixels[offset + 3] < 160) continue;
    visiblePixels += 1;
    const { lightness, a, b } = toOKLab(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
    const chroma = Math.hypot(a, b);
    if (chroma < .037) continue;
    const hue = (Math.atan2(b, a) + fullTurn) % fullTurn;
    const bin = histogram[Math.floor(hue * bins / fullTurn)];
    const weight = chroma * (.65 + .35 * (1 - Math.abs(2 * lightness - 1)));
    bin.count += 1;
    bin.weight += weight;
    bin.a += a * weight;
    bin.b += b * weight;
    bin.chroma += chroma * weight;
    bin.lightness += lightness * weight;
  }

  // Group adjacent hues so a color shared across a bin boundary keeps its full weight.
  const clusters = histogram.map((_, index) => {
    const neighbors = [-1, 0, 1].map((offset) => histogram[(index + offset + bins) % bins]);
    const weight = neighbors.reduce((sum, bin) => sum + bin.weight, 0);
    return {
      index, weight,
      coverage: neighbors.reduce((sum, bin) => sum + bin.count, 0) / Math.max(1, visiblePixels),
      hue: Math.atan2(neighbors.reduce((sum, bin) => sum + bin.b, 0), neighbors.reduce((sum, bin) => sum + bin.a, 0)),
      chroma: neighbors.reduce((sum, bin) => sum + bin.chroma, 0) / (weight || 1),
      lightness: neighbors.reduce((sum, bin) => sum + bin.lightness, 0) / (weight || 1),
    };
  }).sort((a, b) => b.weight - a.weight);
  const primary = clusters.find((cluster) => cluster.coverage >= .055);
  if (!primary) return neutral;
  const secondary = clusters.find((cluster) => {
    const separation = Math.abs(primary.index - cluster.index);
    return Math.min(separation, bins - separation) >= 4 && cluster.coverage >= .09 && cluster.weight >= primary.weight * .22;
  }) ?? primary;

  return {
    primary: gamutColor(.74 + primary.lightness * .07, Math.min(.17, primary.chroma * 1.15), primary.hue),
    secondary: gamutColor(.61 + secondary.lightness * .09, Math.min(.13, secondary.chroma), secondary.hue),
  };
}
