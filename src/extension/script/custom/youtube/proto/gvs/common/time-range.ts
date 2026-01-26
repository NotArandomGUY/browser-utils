import { pbf_i32, pbf_i64 } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

const TimeRange = createMessage({
  startTicks: pbf_i64(1),
  duration: pbf_i64(2),
  timescale: pbf_i32(3)
})

export default TimeRange