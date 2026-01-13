import { defineProperty } from '@ext/global/object'
import { monitorSelector } from '@ext/lib/dom'
import { Feature } from '@ext/lib/feature'
import InterceptDOM from '@ext/lib/intercept/dom'
import { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'

const logger = new Logger('VIU-ADB')

function skipVideo(video: HTMLVideoElement): void {
  // Set current time to video end & dispatch ended event
  video.currentTime = video.duration
  video.dispatchEvent(new Event('ended'))

  logger.info('skipped video')
}

function registerAdSkipHandler(video: HTMLVideoElement): void {
  // Hide video
  video.style.opacity = '0'

  // Skip video if already playing
  if (!video.paused) skipVideo(video)

  // Add event listener to skip video on play
  video.addEventListener('playing', skipVideo.bind(null, video))
}

class UET {
  public constructor(opts: unknown) {
    logger.debug('uetq options:', opts)
  }

  public push(event: string): void {
    logger.debug('uetq event:', event)
  }
}

export default class ViuAdblockModule extends Feature {
  protected activate(): boolean {
    defineProperty(window, 'UET', { value: UET })

    InterceptDOM.setAppendChildCallback(ctx => {
      const node = ctx.args[0]
      ctx.returnValue = node

      if (node instanceof HTMLScriptElement) {
        if (
          (node.src.length === 0 && (node.textContent == null || node.textContent.length === 0)) ||
          node.src.includes('/_next/static') ||
          node.type === 'application/ld+json' ||
          node.dataset['webpack']
        ) return HookResult.EXECUTION_PASSTHROUGH

        logger.debug('intercepted script element from append', node)
        node.dispatchEvent(new Event('load'))
        return HookResult.EXECUTION_CONTINUE
      }

      return HookResult.EXECUTION_PASSTHROUGH
    })

    monitorSelector<HTMLVideoElement>('video[title="Advertisement"]', (element) => {
      registerAdSkipHandler(element)
      logger.info('registered ad skip handler')
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}