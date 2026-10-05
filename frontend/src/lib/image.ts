async function decode(file: File): Promise<ImageBitmap | HTMLImageElement | null> {
  try {
    return await createImageBitmap(file)
  } catch {
    // fall through
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function compress(file: File, max = 1024) {
  const source = await decode(file)
  if (!source) return ""
  const width = "naturalWidth" in source ? source.naturalWidth : source.width
  const height = "naturalHeight" in source ? source.naturalHeight : source.height
  const scale = Math.min(1, max / Math.max(width, height, 1))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  if ("close" in source) source.close()
  return canvas.toDataURL("image/jpeg", 0.7)
}
