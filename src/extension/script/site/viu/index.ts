import { registerFeature, registerFeatureGroup } from '@ext/lib/feature'
import { hideOwnWebpackRuntimeFromGlobal } from '@ext/lib/wprt'
import ViuAdblockModule from '@ext/site/viu/module/adblock'
import ViuNetworkModule from '@ext/site/viu/module/network'
import ViuPlayerModule from '@ext/site/viu/module/player'
import ViuRemoteModule from '@ext/site/viu/module/remote'
import ViuRenderModule from '@ext/site/viu/module/render'
import ViuUserDataModule from '@ext/site/viu/module/user-data'
import ViuWebpackModule from '@ext/site/viu/module/webpack'

registerFeatureGroup('viu', group => {
  registerFeature(group, ViuAdblockModule)
  registerFeature(group, ViuNetworkModule)
  registerFeature(group, ViuPlayerModule)
  registerFeature(group, ViuRemoteModule)
  registerFeature(group, ViuRenderModule)
  registerFeature(group, ViuWebpackModule)
  registerFeature(group, ViuUserDataModule)

  hideOwnWebpackRuntimeFromGlobal()
}, ['adblock', 'privacy'])