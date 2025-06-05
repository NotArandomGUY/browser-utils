import { Configuration } from 'webpack'
import { merge } from 'webpack-merge'
import common from './webpack.common'

export default common.map(c => merge<Configuration>(c, {
  mode: 'production'
}))