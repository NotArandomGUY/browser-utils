import { pbf_flt, pbf_i32, pbf_i64, pbf_msg, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'

export const GLDeviceInfo = createMessage({
  /*@__MANGLE_PROP__*/glRenderer: pbf_str(1),
  /*@__MANGLE_PROP__*/glEsVersionMajor: pbf_i32(2),
  /*@__MANGLE_PROP__*/glEsVersionMinor: pbf_i32(3)
})

const ClientInfo = createMessage({
  deviceMake: pbf_str(12),
  deviceModel: pbf_str(13),
  clientName: pbf_i32(16),
  clientVersion: pbf_str(17),
  osName: pbf_str(18),
  osVersion: pbf_str(19),
  /*@__MANGLE_PROP__*/acceptLanguage: pbf_str(21),
  /*@__MANGLE_PROP__*/acceptRegion: pbf_str(22),
  screenWidthPoints: pbf_i32(37),
  screenHeightPoints: pbf_i32(38),
  /*@__MANGLE_PROP__*/screenWidthInches: pbf_flt(39),
  /*@__MANGLE_PROP__*/screenHeightInches: pbf_flt(40),
  screenPixelDensity: pbf_i32(41),
  clientFormFactor: pbf_i32(46), // ClientFormFactor
  /*@__MANGLE_PROP__*/gmscoreVersionCode: pbf_i32(50), // e.g. 243731017
  windowWidthPoints: pbf_i32(55),
  windowHeightPoints: pbf_i32(56),
  /*@__MANGLE_PROP__*/androidSdkVersion: pbf_i32(64),
  screenDensityFloat: pbf_flt(65),
  utcOffsetMinutes: pbf_i64(67),
  timeZone: pbf_str(80),
  /*@__MANGLE_PROP__*/chipset: pbf_str(92), // e.g. "qcom;taro"
  /*@__MANGLE_PROP__*/glDeviceInfo: pbf_msg(102, GLDeviceInfo)
})

export default ClientInfo