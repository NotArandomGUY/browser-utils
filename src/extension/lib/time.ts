import { ceil, floor, max, min } from '@ext/global/math'

const DATE_PADDING = [4, 2, 2]
const TIME_PADDING = [2, 2, 2]

export type DateLike = Date | string | number

const normalizeDate = (date: DateLike): Date => {
  return new Date(date)
}

const resetDate = (date: DateLike): Date => {
  date = normalizeDate(date)
  date.setFullYear(2000, 1, 1)
  return date
}

const resetTime = (date: DateLike): Date => {
  date = normalizeDate(date)
  date.setHours(0, 0, 0, 0)
  return date
}

export class DateTimeRange {
  public begin: Date
  public end: Date

  public constructor(begin: DateLike = Date.now(), end: DateLike = Date.now()) {
    this.begin = normalizeDate(begin)
    this.end = normalizeDate(end)
  }

  public getBeginTime(): number {
    return this.begin.getTime()
  }

  public getEndTime(): number {
    return this.end.getTime()
  }

  public getElapsedTime(): number {
    return max(0, this.getEndTime() - this.getBeginTime())
  }

  public withBegin(begin: DateLike): DateTimeRange {
    return new DateTimeRange(
      max(normalizeDate(begin).getTime(), this.begin.getTime()),
      this.end,
    )
  }

  public withEnd(end: DateLike): DateTimeRange {
    return new DateTimeRange(
      this.begin,
      min(this.end.getTime(), normalizeDate(end).getTime()),
    )
  }
}

export const secMs = (sec: number): number => {
  return sec * 1000
}

export const minMs = (min: number): number => {
  return secMs(min * 60)
}

export const hourMs = (hour: number): number => {
  return minMs(hour * 60)
}

export const dayMs = (day: number): number => {
  return hourMs(day * 24)
}

export const monthMs = (month: number): number => {
  return dayMs(month * 31)
}

export const yearMs = (year: number): number => {
  return monthMs(year * 12)
}

export const compareDateTimeLT = (left: DateLike, right: DateLike): boolean => {
  return normalizeDate(left).getTime() < normalizeDate(right).getTime()
}

export const compareDateTimeGT = (left: DateLike, right: DateLike): boolean => {
  return normalizeDate(left).getTime() > normalizeDate(right).getTime()
}

export const compareDateTimeLE = (left: DateLike, right: DateLike): boolean => {
  return normalizeDate(left).getTime() <= normalizeDate(right).getTime()
}

export const compareDateTimeGE = (left: DateLike, right: DateLike): boolean => {
  return normalizeDate(left).getTime() >= normalizeDate(right).getTime()
}

export const isDateInRange = (date: DateLike, dateRange: DateTimeRange): boolean => {
  const current = resetTime(date)
  const begin = resetTime(dateRange.begin)
  const end = resetTime(dateRange.end)

  return begin.getTime() <= current.getTime() && current.getTime() < end.getTime()
}

export const isTimeInRange = (time: DateLike, timeRange: DateTimeRange): boolean => {
  const current = resetDate(time)
  const begin = resetDate(timeRange.begin)
  const end = resetDate(timeRange.end)

  return begin.getTime() <= current.getTime() && current.getTime() < end.getTime()
}

export const ceilAlignDateTime = (date: DateLike, intervalMs: number, offsetMs: number = 0): Date => {
  if (intervalMs <= 0) intervalMs = 1
  date = normalizeDate(date)
  date.setTime((ceil(date.getTime() / intervalMs) * intervalMs) + offsetMs)
  return date
}

export const floorAlignDateTime = (date: DateLike, intervalMs: number, offsetMs: number = 0): Date => {
  if (intervalMs <= 0) intervalMs = 1
  date = normalizeDate(date)
  date.setTime((floor(date.getTime() / intervalMs) * intervalMs) + offsetMs)
  return date
}

export const dateTimeOffset = (date: DateLike, offset: number): Date => {
  return new Date(normalizeDate(date).getTime() + offset)
}

export const toDateString = (date: DateLike, padding = true): string => {
  date = normalizeDate(date)
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  ].map((v, i) => v.toString().padStart((padding ? DATE_PADDING[i] : 0) ?? 0, '0')).join('-')
}

export const toTimeString = (date: DateLike, padding = true): string => {
  date = normalizeDate(date)
  return [
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ].map((v, i) => v.toString().padStart((padding ? TIME_PADDING[i] : 0) ?? 0, '0')).join(':')
}

export const toDateTimeString = (date: DateLike, padding = true): string => {
  return [toDateString(date, padding), toTimeString(date, padding)].join(' ')
}

export const toDateNumbers = (date: DateLike, padding = true): string => {
  return toDateString(date, padding).replace(/-/g, '')
}

export const toTimeNumbers = (date: DateLike, padding = true): string => {
  return toTimeString(date, padding).replace(/:/g, '')
}

export const toDateTimeNumbers = (date: DateLike, padding = true): string => {
  return toDateTimeString(date, padding).replace(/[-:\s]/g, '')
}