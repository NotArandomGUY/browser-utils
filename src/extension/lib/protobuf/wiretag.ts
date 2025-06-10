export const enum WireType {
  VARINT = 0,
  FIXED64 = 1,
  LENGTH_DELIMITED = 2,
  START_GROUP = 3,
  END_GROUP = 4,
  FIXED32 = 5
}

export function getTagWireType(tag: number): WireType {
  return tag & 0x7
}

export function getTagFieldNumber(tag: number): number {
  return tag >> 3
}

export function makeTag(fieldNumber: number, wireType: WireType): number {
  return (fieldNumber << 3) | wireType
}