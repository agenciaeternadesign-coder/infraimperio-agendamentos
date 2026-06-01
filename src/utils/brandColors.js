function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function rgbVar(r, g, b) {
  return `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`
}

function mixWhite([r, g, b], whiteRatio) {
  return rgbVar(r * (1 - whiteRatio) + 255 * whiteRatio, g * (1 - whiteRatio) + 255 * whiteRatio, b * (1 - whiteRatio) + 255 * whiteRatio)
}

function darken([r, g, b], ratio) {
  return rgbVar(r * (1 - ratio), g * (1 - ratio), b * (1 - ratio))
}

function generateShades(primaryHex) {
  const rgb = hexToRgb(primaryHex)
  return {
    50:  mixWhite(rgb, 0.95),
    100: mixWhite(rgb, 0.88),
    200: mixWhite(rgb, 0.76),
    300: mixWhite(rgb, 0.58),
    400: mixWhite(rgb, 0.38),
    500: mixWhite(rgb, 0.18),
    600: mixWhite(rgb, 0.08),
    700: rgbVar(...rgb),
    800: darken(rgb, 0.18),
    900: darken(rgb, 0.44),
  }
}

export function applyBrandColors(primaryHex = '#b91c1c', accentHex = '#d97706') {
  const root = document.documentElement
  const brandShades = generateShades(primaryHex)
  const goldShades  = generateShades(accentHex)

  Object.entries(brandShades).forEach(([k, v]) => root.style.setProperty(`--c-brand-${k}`, v))
  Object.entries(goldShades).forEach(([k, v]) => root.style.setProperty(`--c-gold-${k}`, v))
}
