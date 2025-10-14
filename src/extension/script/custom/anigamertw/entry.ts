import { fetch } from '@ext/global/network'
import { assign, getPrototypeOf } from '@ext/global/object'
import Hook, { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'
import type vjs from '@ext/types/videojs.d.ts'

interface AdHandlerPlayOptions {
  adId: string
  adUrl: string
  adSid: string
  adType: string
  sponsorText: string
  enableAd: boolean
}

const logger = new Logger('ANI.GAMER')

logger.info('initializing...')

function init(plugin: typeof vjs.Plugin): void {
  class AdHandler extends plugin {
    public constructor(player: vjs.Player, options?: object) {
      super(player, options)
    }

    public play(sn: number, options: AdHandlerPlayOptions, callback: () => void): void {
      logger.debug('attempt to play ad:', sn, options)
      fetch(`/ajax/videoCastcishu.php?s=${options.adSid}&sn=${sn}`).finally(() => setTimeout(() => {
        fetch(`/ajax/videoCastcishu.php?s=${options.adSid}&sn=${sn}&ad=end`).finally(callback)
      }, 30e3))
    }

    public destroy(): void {
      return
    }
  }

  class M3U8 extends plugin.getPlugin('m3u8') {
    public constructor(player: vjs.Player, options?: object) {
      super(player, options)

      const setState = (this as unknown as { setState(state: object): void }).setState
      assign(this, {
        setState(state: object) {
          setState.call(this, { ...state, enableAgeGate: false })
        }
      })
    }
  }

  plugin.deregisterPlugin('adHandler')
  plugin.registerPlugin('adHandler', AdHandler)
  plugin.deregisterPlugin('m3u8')
  plugin.registerPlugin('m3u8', M3U8)
}

Object.assign = new Hook(Object.assign).install(ctx => {
  const [target] = ctx.args
  if (!('player' in target)) return HookResult.EXECUTION_IGNORE

  const ctor = getPrototypeOf(getPrototypeOf(target)).constructor
  if (!('BASE_PLUGIN_NAME' in ctor)) return HookResult.EXECUTION_IGNORE

  init(ctor)
  Object.assign = ctx.origin

  return HookResult.ACTION_UNINSTALL | HookResult.EXECUTION_IGNORE
}).call

logger.info('initialized')
