import YTOfflineMediaCache from '@ext/custom/youtube/proto/ytom/cache'
import YTOfflineMediaCaption from '@ext/custom/youtube/proto/ytom/caption'
import YTOfflineMediaEntity from '@ext/custom/youtube/proto/ytom/entity'
import YTOfflineMediaStream from '@ext/custom/youtube/proto/ytom/stream'
import { pbf_msg, pbf_repeat, pbf_str, pbf_u32 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const YTOfflineMediaMetadata = createMessage({
  version: pbf_u32(1),
  id: pbf_str(2),
  entities: pbf_repeat(pbf_msg(10, YTOfflineMediaEntity)),
  streams: pbf_repeat(pbf_msg(11, YTOfflineMediaStream)),
  captions: pbf_repeat(pbf_msg(12, YTOfflineMediaCaption)),
  images: pbf_repeat(pbf_msg(13, YTOfflineMediaCache))
})

export default YTOfflineMediaMetadata