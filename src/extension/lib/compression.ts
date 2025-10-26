const { CompressionStream, DecompressionStream } = globalThis

const readStream = async (stream: ReadableStream): Promise<Uint8Array<ArrayBuffer>> => {
  const reader = stream.getReader()
  const chunks: Uint8Array<ArrayBuffer>[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (value != null) chunks.push(value)
    if (done) break
  }

  return new Uint8Array(await new Blob(chunks).arrayBuffer())
}

export const isCompressionSupported = (): boolean => CompressionStream != null && DecompressionStream != null

export const compress = async (data: BlobPart, format: CompressionFormat): Promise<Uint8Array<ArrayBuffer>> => {
  return await readStream(new Blob([data]).stream().pipeThrough(new CompressionStream(format)))
}

export const decompress = async (data: BlobPart, format: CompressionFormat): Promise<Uint8Array<ArrayBuffer>> => {
  return await readStream(new Blob([data]).stream().pipeThrough(new DecompressionStream(format)))
}