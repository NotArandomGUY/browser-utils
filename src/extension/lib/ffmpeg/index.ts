import { entries, fromEntries, keys } from '@ext/global/object'
import { PromiseWithProgress, waitUntil } from '@ext/lib/async'
import { FFmpeg } from '@ext/lib/ffmpeg/message'
import Logger from '@ext/lib/logger'

const logger = new Logger('FFMPEG')

export interface FFmpegInput {
  data: Uint8Array<ArrayBuffer>
  options?: readonly string[]
}

export interface FFmpegOptions<I extends string, O extends string> {
  options?: string[]
  input: Array<readonly [I, FFmpegInput]>
  output: Record<O, readonly string[]>
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

  const session = `/session_${Date.now()}`
  try {
    instance.on('progress', progress)
    await instance.createDir(session)

    await Promise.all(input.map(([name, { data }]) => instance.writeFile(`${session}/${name}`, data)))
    await instance.exec(options.concat(
      input.flatMap(([name, { options = [] }]) => [...options, '-i', `${session}/${name}`]),
      entries<readonly string[]>(output).flatMap(([name, options]) => [...options, `${session}/${name}`])
    ))
    resolve(fromEntries(await Promise.all(keys(output).map(async name => {
      const data = await instance.readFile(`${session}/${name}`)
      if (data.length === 0) throw new Error('invalid output')

      return [name, data]
    }))))
  } catch (error) {
    reject(error)
  } finally {
    instance.listDir(session)
      .then(files => Promise.allSettled(files.map(file => instance.deleteFile(`${session}/${file.name}`))))
      .then(() => instance.deleteDir(session))
      .catch(error => logger.warn('cleanup files error:', error))
    instance.off('progress', progress)
    instances.push(instance)
  }
})