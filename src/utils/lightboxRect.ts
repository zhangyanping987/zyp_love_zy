export interface ImageRect {
  left: number
  top: number
  width: number
  height: number
}

export function rectFromDOM(rect: DOMRect): ImageRect {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  }
}

export function computeExpandedRect(aspect = 1): ImageRect {
  const maxW = Math.min(window.innerWidth * 0.92, 960)
  const maxH = window.innerHeight * 0.76
  let width = maxW
  let height = width / aspect
  if (height > maxH) {
    height = maxH
    width = height * aspect
  }
  return {
    left: (window.innerWidth - width) / 2,
    top: (window.innerHeight - height) / 2 - 16,
    width,
    height,
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

/** 打开/关闭过渡时长（毫秒） */
export const LIGHTBOX_TRANSITION_MS = 720

export function interpolateRect(from: ImageRect, to: ImageRect, t: number): ImageRect {
  return {
    left: lerp(from.left, to.left, t),
    top: lerp(from.top, to.top, t),
    width: lerp(from.width, to.width, t),
    height: lerp(from.height, to.height, t),
  }
}

export function fallbackOrigin(): ImageRect {
  const size = Math.min(window.innerWidth, window.innerHeight) * 0.2
  return {
    left: (window.innerWidth - size) / 2,
    top: (window.innerHeight - size) / 2,
    width: size,
    height: size,
  }
}
