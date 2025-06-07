import Logger from '@ext/lib/logger'
import { hideOwnWebpackRuntimeFromGlobal } from '@ext/lib/wprt'
import initYTActionModule from '@ext/site/youtube/module/action'
import initYTBootstrapModule from '@ext/site/youtube/module/bootstrap'
import initYTFixupModule from '@ext/site/youtube/module/fixup'
import initYTLoggingModule from '@ext/site/youtube/module/logging'
import initYTModModule from '@ext/site/youtube/module/mod'
import initYTNetworkModule from '@ext/site/youtube/module/network'
import initYTPlayerModule from '@ext/site/youtube/module/player'
import initYTPremiumModule from '@ext/site/youtube/module/premium'

const logger = new Logger('YT')

logger.info('initializing...')

initYTBootstrapModule()
initYTActionModule()
initYTFixupModule()
initYTLoggingModule()
initYTPlayerModule()
initYTPremiumModule()
initYTNetworkModule()
initYTModModule()

logger.info('initialized')

hideOwnWebpackRuntimeFromGlobal()