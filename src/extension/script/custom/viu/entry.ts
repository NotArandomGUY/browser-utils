import ViuAdblockModule from '@ext/custom/viu/module/adblock'
import ViuNetworkModule from '@ext/custom/viu/module/network'
import ViuPlayerModule from '@ext/custom/viu/module/player'
import ViuRemoteModule from '@ext/custom/viu/module/remote'
import ViuRenderModule from '@ext/custom/viu/module/render'
import ViuUserDataModule from '@ext/custom/viu/module/user-data'
import ViuWebpackModule from '@ext/custom/viu/module/webpack'
import { registerFeature, registerFeatureGroup } from '@ext/lib/feature'
import { hideOwnWebpackRuntimeFromGlobal } from '@ext/lib/wprt'

registerFeatureGroup('viu', group => {
  registerFeature(group, ViuAdblockModule)
  registerFeature(group, ViuNetworkModule)
  registerFeature(group, ViuPlayerModule)
  registerFeature(group, ViuRemoteModule)
  registerFeature(group, ViuRenderModule)
  registerFeature(group, ViuWebpackModule)
  registerFeature(group, ViuUserDataModule)

  hideOwnWebpackRuntimeFromGlobal()
}, ['preload'])