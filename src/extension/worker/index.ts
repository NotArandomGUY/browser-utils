import Logger from '@ext/lib/logger'
import initWorkerInjectorModule from '@ext/worker/module/injector'
import initWorkerNetworkModule from '@ext/worker/module/network'

const logger = new Logger('WORKER')

logger.info('initializing...')

initWorkerInjectorModule()
initWorkerNetworkModule()

logger.info('initialized')