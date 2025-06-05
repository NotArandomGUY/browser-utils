import { YTObjectSchema, ytv_str } from './common'

export enum YTSizeType {
  SIZE_DEFAULT = 'SIZE_DEFAULT',
  SIZE_SMALL = 'SIZE_SMALL',
  SIZE_LARGE = 'SIZE_LARGE',
  SIZE_XLARGE = 'SIZE_XLARGE',
  SIZE_XSMALL = 'SIZE_XSMALL'
}

export const YTSizeSchema = {
  sizeType: ytv_str(YTSizeType)
} satisfies YTObjectSchema