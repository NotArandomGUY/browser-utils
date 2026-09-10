import { Configuration, defineConfig } from 'webpack'
import { merge } from 'webpack-merge'
import common from './webpack.common'

export default defineConfig(env => common(env).map(c => merge<Configuration>(c, {
  mode: 'production',
  cache: {
    type: 'filesystem'
  }
})))