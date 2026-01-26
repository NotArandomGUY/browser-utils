import { pbf_bol, pbf_i32, pbf_msg } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

export const enum SearchSortBy {
  RELEVANCE = 0,
  RATING = 1,
  UPLOAD_DATE = 2,
  VIEW_COUNT = 3,
}

export const enum SearchFilterTime {
  UNSPECIFIED = 0,
  HOUR = 1,
  TODAY = 2,
  WEEK = 3,
  MONTH = 4,
  YEAR = 5
}

export const enum SearchFilterType {
  UNSPECIFIED = 0, // anything else except 5 seems to work
  VIDEOS = 1,
  CHANNELS = 2, // 8 also seems to work
  PLAYLISTS = 3,
  MOVIES = 4,
  SHORTS = 9
}

export const enum SearchFilterDuration {
  LT4 = 1,
  GT20 = 2,
  GT4_LT20 = 3,
  LT3 = 4,
  GT3_LT20 = 5
}

export const SearchFilterParams = createMessage({
  time: pbf_i32(1),
  type: pbf_i32(2),
  duration: pbf_i32(3),
  featureHD: pbf_bol(4),
  featureSubtitle: pbf_bol(5),
  featureCC: pbf_bol(6),
  feature3D: pbf_bol(7),
  featureLive: pbf_bol(8),
  featurePurchased: pbf_bol(9),
  feature4K: pbf_bol(14),
  feature360: pbf_bol(15),
  featureLocation: pbf_bol(23),
  featureHDR: pbf_bol(25),
  feature180: pbf_bol(26)
})

const SearchParams = createMessage({
  sortBy: pbf_i32(1),
  filter: pbf_msg(2, SearchFilterParams)
})

export default SearchParams