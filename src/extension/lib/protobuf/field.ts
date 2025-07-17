import type { Message, MessageDefinition } from '@ext/lib/protobuf/message'
import { type ValueData, ValueType } from '@ext/lib/protobuf/value'

// NOTE: using short property name to reduce build size
export type FieldDefinition<T extends ValueType = ValueType, R extends boolean = boolean, D extends MessageDefinition = MessageDefinition> = {
  fi: number
  ft: T
  fr: R
  fd?: () => R extends true ? ValueData<T>[] : ValueData<T>
} & (T extends ValueType.MESSAGE ? { fm: new () => Message<D> } : {})

export type NonRepeatedFieldData<D extends FieldDefinition> = D extends FieldDefinition<ValueType.MESSAGE, boolean, infer D> ? Message<D> : ValueData<D['ft']>
export type FieldData<D extends FieldDefinition> = D['fr'] extends true ? NonRepeatedFieldData<D>[] : NonRepeatedFieldData<D>

const pbf_default = <D extends FieldDefinition>(fieldDefinition: D, fd?: ReturnType<NonNullable<D['fd']>>): D => {
  return fd == null ? fieldDefinition : { ...fieldDefinition, fd: () => fd }
}

export const pbf_repeat = <const T extends ValueType, const D extends MessageDefinition>(fieldDefinition: FieldDefinition<T, false, D>): FieldDefinition<T, true, D> => {
  return { ...fieldDefinition, fr: true }
}

export const pbf_dbl = (fi: number, fd?: number): FieldDefinition<ValueType.DOUBLE, false> => {
  return pbf_default({ fi, ft: ValueType.DOUBLE, fr: false }, fd)
}
export const pbf_flt = (fi: number, fd?: number): FieldDefinition<ValueType.FLOAT, false> => {
  return pbf_default({ fi, ft: ValueType.FLOAT, fr: false }, fd)
}
export const pbf_i32 = (fi: number, fd?: number): FieldDefinition<ValueType.INT32, false> => {
  return pbf_default({ fi, ft: ValueType.INT32, fr: false }, fd)
}
export const pbf_i64 = (fi: number, fd?: unknown): FieldDefinition<ValueType.INT64, false> => {
  return pbf_default({ fi, ft: ValueType.INT64, fr: false }, fd)
}
export const pbf_u32 = (fi: number, fd?: number): FieldDefinition<ValueType.UINT32, false> => {
  return pbf_default({ fi, ft: ValueType.UINT32, fr: false }, fd)
}
export const pbf_u64 = (fi: number, fd?: unknown): FieldDefinition<ValueType.UINT64, false> => {
  return pbf_default({ fi, ft: ValueType.UINT64, fr: false }, fd)
}
export const pbf_si32 = (fi: number, fd?: number): FieldDefinition<ValueType.SINT32, false> => {
  return pbf_default({ fi, ft: ValueType.SINT32, fr: false }, fd)
}
export const pbf_si64 = (fi: number, fd?: unknown): FieldDefinition<ValueType.SINT64, false> => {
  return pbf_default({ fi, ft: ValueType.SINT64, fr: false }, fd)
}
export const pbf_f32 = (fi: number, fd?: number): FieldDefinition<ValueType.FIXED32, false> => {
  return pbf_default({ fi, ft: ValueType.FIXED32, fr: false }, fd)
}
export const pbf_f64 = (fi: number, fd?: unknown): FieldDefinition<ValueType.FIXED64, false> => {
  return pbf_default({ fi, ft: ValueType.FIXED64, fr: false }, fd)
}
export const pbf_sf32 = (fi: number, fd?: number): FieldDefinition<ValueType.SFIXED32, false> => {
  return pbf_default({ fi, ft: ValueType.SFIXED32, fr: false }, fd)
}
export const pbf_sf64 = (fi: number, fd?: unknown): FieldDefinition<ValueType.SFIXED64, false> => {
  return pbf_default({ fi, ft: ValueType.SFIXED64, fr: false }, fd)
}
export const pbf_bol = (fi: number, fd?: unknown): FieldDefinition<ValueType.BOOL, false> => {
  return pbf_default({ fi, ft: ValueType.BOOL, fr: false }, fd)
}
export const pbf_str = (fi: number, fd?: unknown): FieldDefinition<ValueType.STRING, false> => {
  return pbf_default({ fi, ft: ValueType.STRING, fr: false }, fd)
}
export const pbf_bin = (fi: number, fd?: unknown): FieldDefinition<ValueType.BYTES, false> => {
  return pbf_default({ fi, ft: ValueType.BYTES, fr: false }, fd)
}
export const pbf_msg = <D extends MessageDefinition>(fi: number, fm: new () => Message<D>, fd?: unknown): FieldDefinition<ValueType.MESSAGE, false, D> => {
  return pbf_default({ fi, ft: ValueType.MESSAGE, fm, fr: false }, fd)
}