import { pbf_bol, pbf_i32, pbf_msg, pbf_repeat, pbf_str } from '@ext/lib/protobuf/field'
import { createMessage } from '@ext/lib/protobuf/message'
import ScriptNetHeaderInfo from '@ext/proto/script/net/header-info'

export const enum ScriptNetDomainType {
  FIRST_PARTY = 0,
  THIRD_PARTY
}

export const enum ScriptNetRequestMethod {
  OTHER = 0,
  CONNECT,
  DELETE,
  GET,
  HEAD,
  OPTIONS,
  PATCH,
  POST,
  PUT
}

export const enum ScriptNetResourceType {
  OTHER = 0,
  MAIN_FRAME,
  SUB_FRAME,
  STYLESHEET,
  SCRIPT,
  IMAGE,
  FONT,
  OBJECT,
  XMLHTTPREQUEST,
  PING,
  CSP_REPORT,
  MEDIA,
  WEBSOCKET,
  WEBTRANSPORT,
  WEBBUNDLE
}

// chrome.declarativeNetRequest.RuleCondition
const ScriptNetRuleCondition = createMessage({
  domainType: pbf_i32(1),
  isUrlFilterCaseSensitive: pbf_bol(2),
  urlFilter: pbf_str(3),
  regexFilter: pbf_str(4),
  initiatorDomains: pbf_repeat(pbf_str(10)),
  excludedInitiatorDomains: pbf_repeat(pbf_str(11)),
  requestDomains: pbf_repeat(pbf_str(12)),
  excludedRequestDomains: pbf_repeat(pbf_str(13)),
  requestMethods: pbf_repeat(pbf_i32(14)),
  excludedRequestMethods: pbf_repeat(pbf_i32(15)),
  resourceTypes: pbf_repeat(pbf_i32(16)),
  excludedResourceTypes: pbf_repeat(pbf_i32(17)),
  tabIds: pbf_repeat(pbf_i32(18)),
  excludedTabIds: pbf_repeat(pbf_i32(19)),
  responseHeaders: pbf_repeat(pbf_msg(20, ScriptNetHeaderInfo)),
  excludedResponseHeaders: pbf_repeat(pbf_msg(21, ScriptNetHeaderInfo))
})

export default ScriptNetRuleCondition