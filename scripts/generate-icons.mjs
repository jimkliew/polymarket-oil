import { createCanvas } from 'canvas'
import fs from 'fs'

function makeIcon(size, outPath) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#0a0f1e'
  ctx.fillRect(0, 0, size, size)
  ctx.font = `${size * 0.55}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('\u{1F6E2}', size / 2, size / 2)
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'))
}

fs.mkdirSync('public/icons', { recursive: true })
makeIcon(192, 'public/icons/icon-192.png')
makeIcon(512, 'public/icons/icon-512.png')
console.log('Icons generated.')
