import Logger from '@ext/lib/logger'
import { interruptWebpackRuntime } from '@ext/lib/wprt'
import initHoyoAnalysisModule from '@ext/site/hoyo/module/analysis'
import initHoyoLogModule from '@ext/site/hoyo/module/log'
import initHoyoVueModule from '@ext/site/hoyo/module/vue'

const logger = new Logger('HOYO')

logger.info('initializing...')

initHoyoAnalysisModule()
initHoyoLogModule()
initHoyoVueModule()

logger.info('initialized')

interruptWebpackRuntime((chunkLoadingGlobal) => {
  console.log('webpack runtime load:', chunkLoadingGlobal)
  return true
})