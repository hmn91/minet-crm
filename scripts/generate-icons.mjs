// Generates minimal PNG icons for MiNet CRM PWA
// Uses only Node.js built-ins (zlib, fs, crypto)
import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function crc32(buf) {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c
  }
  let crc = 0xffffffff
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (~crc) >>> 0
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.concat([typeBytes, data])
  const crcVal = Buffer.alloc(4)
  crcVal.writeUInt32BE(crc32(crcBuf))
  return Buffer.concat([len, typeBytes, data, crcVal])
}

function makePNG(size, drawFn) {
  // RGBA pixel buffer
  const pixels = new Uint8Array(size * size * 4)

  // Fill background: #2563eb (blue)
  for (let i = 0; i < size * size; i++) {
    pixels[i * 4 + 0] = 0x25  // R
    pixels[i * 4 + 1] = 0x63  // G
    pixels[i * 4 + 2] = 0xeb  // B
    pixels[i * 4 + 3] = 0xff  // A
  }

  drawFn(pixels, size)

  // Build filtered rows (filter type 0 = None per row)
  const rows = []
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4)
    row[0] = 0 // filter None
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      row[1 + x * 4 + 0] = pixels[idx + 0]
      row[1 + x * 4 + 1] = pixels[idx + 1]
      row[1 + x * 4 + 2] = pixels[idx + 2]
      row[1 + x * 4 + 3] = pixels[idx + 3]
    }
    rows.push(row)
  }

  const rawData = Buffer.concat(rows)
  const compressed = deflateSync(rawData, { level: 6 })

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0)
  ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8   // bit depth
  ihdrData[9] = 6   // RGBA
  ihdrData[10] = 0  // compression
  ihdrData[11] = 0  // filter
  ihdrData[12] = 0  // interlace

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// Draw a white "M" + network nodes
function drawIcon(pixels, size) {
  const scale = size / 192

  function setPixel(x, y, r, g, b, a = 255) {
    x = Math.round(x); y = Math.round(y)
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = a
  }

  function fillRect(x, y, w, h, r, g, b) {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++)
        setPixel(Math.round(x + dx), Math.round(y + dy), r, g, b)
  }

  function fillCircle(cx, cy, radius, r, g, b) {
    for (let dy = -radius; dy <= radius; dy++)
      for (let dx = -radius; dx <= radius; dx++)
        if (dx*dx + dy*dy <= radius*radius)
          setPixel(Math.round(cx+dx), Math.round(cy+dy), r, g, b)
  }

  function drawLine(x0, y0, x1, y1, thickness, r, g, b) {
    const dx = x1 - x0, dy = y1 - y0
    const len = Math.sqrt(dx*dx + dy*dy)
    for (let t = 0; t <= len; t += 0.5) {
      const x = x0 + (dx / len) * t
      const y = y0 + (dy / len) * t
      fillCircle(x, y, thickness / 2, r, g, b)
    }
  }

  const s = scale
  const W = 255, A = 255

  // Rounded rect background (already blue) — draw white rounded rect
  const pad = 20 * s
  const rr = 36 * s
  // Approximate rounded rect with fillRect + corner circles
  fillRect(pad + rr, pad, size - 2*(pad+rr), size - 2*pad, W, W, W)
  fillRect(pad, pad + rr, size - 2*pad, size - 2*(pad+rr), W, W, W)
  fillCircle(pad + rr, pad + rr, rr, W, W, W)
  fillCircle(size - pad - rr, pad + rr, rr, W, W, W)
  fillCircle(pad + rr, size - pad - rr, rr, W, W, W)
  fillCircle(size - pad - rr, size - pad - rr, rr, W, W, W)

  // Blue network nodes and lines on white background
  const cx = size / 2
  const cy = size / 2
  const nR = 12 * s  // node radius
  const lineW = 6 * s

  // Center node
  const nodes = [
    [cx, cy - 32 * s],          // top
    [cx - 44 * s, cy + 20 * s], // bottom-left
    [cx + 44 * s, cy + 20 * s], // bottom-right
  ]

  const bR = 0x25, bG = 0x63, bB = 0xeb

  // Lines between nodes
  drawLine(nodes[0][0], nodes[0][1], nodes[1][0], nodes[1][1], lineW, bR, bG, bB)
  drawLine(nodes[0][0], nodes[0][1], nodes[2][0], nodes[2][1], lineW, bR, bG, bB)
  drawLine(nodes[1][0], nodes[1][1], nodes[2][0], nodes[2][1], lineW, bR, bG, bB)

  // Nodes
  nodes.forEach(([nx, ny]) => fillCircle(nx, ny, nR, bR, bG, bB))

  // Central hub
  fillCircle(cx, cy, nR * 1.3, bR, bG, bB)
}

// Output
const outDir = join(__dirname, '../public/icons')
mkdirSync(outDir, { recursive: true })

for (const size of [192, 512]) {
  const png = makePNG(size, drawIcon)
  writeFileSync(join(outDir, `pwa-${size}x${size}.png`), png)
  console.log(`✓ pwa-${size}x${size}.png`)
}

// Maskable icon — full bleed, no padding
function drawMaskable(pixels, size) {
  const cx = size / 2, cy = size / 2
  const s = size / 192
  const nR = 16 * s
  const lineW = 8 * s
  const bR = 0x25, bG = 0x63, bB = 0xeb
  const W = 255

  // White everywhere (already blue bg)
  const nodes = [
    [cx, cy - 40 * s],
    [cx - 55 * s, cy + 26 * s],
    [cx + 55 * s, cy + 26 * s],
  ]

  function setPixel(x, y, r, g, b) {
    x = Math.round(x); y = Math.round(y)
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = 255
  }
  function fillCircle(cx, cy, radius, r, g, b) {
    for (let dy = -radius; dy <= radius; dy++)
      for (let dx = -radius; dx <= radius; dx++)
        if (dx*dx + dy*dy <= radius*radius)
          setPixel(Math.round(cx+dx), Math.round(cy+dy), r, g, b)
  }
  function drawLine(x0, y0, x1, y1, thickness, r, g, b) {
    const dx = x1 - x0, dy = y1 - y0
    const len = Math.sqrt(dx*dx + dy*dy)
    for (let t = 0; t <= len; t += 0.5) {
      fillCircle(x0 + (dx/len)*t, y0 + (dy/len)*t, thickness/2, r, g, b)
    }
  }

  nodes.forEach(([nx, ny], i) => {
    nodes.forEach(([nx2, ny2], j) => {
      if (j > i) drawLine(nx, ny, nx2, ny2, lineW, W, W, W)
    })
  })
  nodes.forEach(([nx, ny]) => fillCircle(nx, ny, nR, W, W, W))
  fillCircle(cx, cy, nR * 1.4, W, W, W)
}

const maskable = makePNG(192, drawMaskable)
writeFileSync(join(outDir, 'maskable-192x192.png'), maskable)
console.log('✓ maskable-192x192.png')
console.log('Done!')
