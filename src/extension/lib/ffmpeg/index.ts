import { entries, fromEntries, keys } from '@ext/global/object'
import { PromiseWithProgress, waitUntil } from '@ext/lib/async'
import { FFmpeg } from '@ext/lib/ffmpeg/message'
import Logger from '@ext/lib/logger'

const logger = new Logger('FFMPEG')

export interface FFmpegInput {
  data: Uint8Array<ArrayBuffer>
  options?: string[]
}

export interface FFmpegOptions<I extends string, O extends string> {
  options?: string[]
  input: Record<I, FFmpegInput>
  output: Record<O, string[]>
}

const instances: FFmpeg[] = []

const grabInstance = async (): Promise<FFmpeg | null> => {
  try {
    let instance = instances.pop()
    if (instance != null) {
      await waitUntil(() => instance!.loaded)
      return instance
    }

    instance = new FFmpeg()
    instance.on('log', ({ type, message }) => logger.debug(type, message))
    await instance.load()

    return instance
  } catch (error) {
    logger.warn('load core error:', error)
    return null
  }
}

export const execFFmpeg = <I extends string, O extends string>({
  options = [],
  input,
  output
}: FFmpegOptions<I, O>) => new PromiseWithProgress<Record<O, Uint8Array<ArrayBuffer>>, { progress: number, time: number }>(async (resolve, reject, progress) => {
  const instance = await grabInstance()
  if (instance == null) {
    reject(new Error('ffmpeg instance not available'))
    return
  }

  try {
    instance.on('progress', progress)

    await Promise.all(entries<FFmpegInput>(input).map(([name, { data }]) => instance.writeFile(name, data)))
    await instance.exec(options.concat(
      entries<FFmpegInput>(input).flatMap(([name, { options = [] }]) => [...options, '-i', name]),
      entries<string[]>(output).flatMap(([name, options]) => [...options, name])
    ))
    resolve(fromEntries(await Promise.all(keys(output).map(async name => [name, await instance.readFile(name)]))))
  } catch (error) {
    reject(error)
  } finally {
    instance.off('progress', progress)
    instances.push(instance)
  }
})