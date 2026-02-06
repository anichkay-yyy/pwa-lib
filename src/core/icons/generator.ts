import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ICON_SIZES, MASKABLE_ICON, FAVICON_SIZES } from './sizes.js'

export interface GenerateIconsOptions {
  input: string
  outDir: string
}

export interface GeneratedIcon {
  path: string
  size: number
  name: string
  purpose: string
}

/**
 * Generate all PWA icons from a single source image.
 */
export async function generateIcons(options: GenerateIconsOptions): Promise<GeneratedIcon[]> {
  const { input, outDir } = options
  await mkdir(outDir, { recursive: true })

  const source = sharp(input)
  const metadata = await source.metadata()

  if (!metadata.width || !metadata.height || metadata.width < 512 || metadata.height < 512) {
    throw new Error(`Source icon must be at least 512x512px. Got ${metadata.width}x${metadata.height}`)
  }

  const results: GeneratedIcon[] = []

  // Generate standard icons
  for (const entry of ICON_SIZES) {
    const outputPath = join(outDir, entry.name)
    await sharp(input)
      .resize(entry.size, entry.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outputPath)

    results.push({
      path: outputPath,
      size: entry.size,
      name: entry.name,
      purpose: entry.purpose || 'any',
    })
  }

  // Generate maskable icon (with 10% padding for safe zone)
  const maskableOutputPath = join(outDir, MASKABLE_ICON.name)
  const maskableSize = MASKABLE_ICON.size
  const padding = Math.round(maskableSize * 0.1)
  const innerSize = maskableSize - padding * 2

  await sharp(input)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(maskableOutputPath)

  results.push({
    path: maskableOutputPath,
    size: maskableSize,
    name: MASKABLE_ICON.name,
    purpose: 'maskable',
  })

  // Generate favicon.ico (multi-size PNG in ICO container)
  await generateFavicon(input, outDir)

  return results
}

/**
 * Generate a favicon.ico with multiple sizes embedded.
 */
async function generateFavicon(input: string, outDir: string): Promise<void> {
  // Generate individual PNG buffers for each favicon size
  const buffers: Buffer[] = []
  for (const size of FAVICON_SIZES) {
    const buf = await sharp(input)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
    buffers.push(buf)
  }

  // Build ICO file
  const icoBuffer = buildIco(buffers, FAVICON_SIZES)
  await writeFile(join(outDir, 'favicon.ico'), icoBuffer)
}

/**
 * Build a minimal ICO file from PNG buffers.
 */
function buildIco(pngBuffers: Buffer[], sizes: number[]): Buffer {
  const numImages = pngBuffers.length
  const headerSize = 6
  const dirEntrySize = 16
  const dataOffset = headerSize + dirEntrySize * numImages

  // Calculate total size
  let totalDataSize = 0
  for (const buf of pngBuffers) {
    totalDataSize += buf.length
  }

  const ico = Buffer.alloc(dataOffset + totalDataSize)

  // ICO header
  ico.writeUInt16LE(0, 0)          // Reserved
  ico.writeUInt16LE(1, 2)          // Type: ICO
  ico.writeUInt16LE(numImages, 4)  // Number of images

  // Directory entries
  let currentOffset = dataOffset
  for (let i = 0; i < numImages; i++) {
    const offset = headerSize + dirEntrySize * i
    const size = sizes[i] >= 256 ? 0 : sizes[i]
    ico.writeUInt8(size, offset)           // Width
    ico.writeUInt8(size, offset + 1)       // Height
    ico.writeUInt8(0, offset + 2)          // Color palette
    ico.writeUInt8(0, offset + 3)          // Reserved
    ico.writeUInt16LE(1, offset + 4)       // Color planes
    ico.writeUInt16LE(32, offset + 6)      // Bits per pixel
    ico.writeUInt32LE(pngBuffers[i].length, offset + 8)  // Image size
    ico.writeUInt32LE(currentOffset, offset + 12)         // Image offset

    pngBuffers[i].copy(ico, currentOffset)
    currentOffset += pngBuffers[i].length
  }

  return ico
}
