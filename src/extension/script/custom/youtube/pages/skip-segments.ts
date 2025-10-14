import { SkipSegmentEntry } from '@ext/custom/youtube/module/player/smart-skip'
import { floor } from '@ext/global/math'
import van, { ChildDom, State } from 'vanjs-core'

const { table, tbody, td, th, thead, tr } = van.tags

export interface YTSkipSegmentPageProps {
  segments: State<SkipSegmentEntry[]>
}

const getTimestamp = (time: number): string => {
  const sec = floor(time / 1e3)

  return [
    floor(sec / 3600),
    floor(sec / 60) % 60,
    sec % 60
  ].map(n => n.toString().padStart(2, '0')).join(':')
}

const YTSkipSegmentTableItem = ({ startTimeMs, endTimeMs, category }: SkipSegmentEntry): ChildDom => {
  return tr(td(category ?? 'unknown'), td(getTimestamp(startTimeMs)), td(getTimestamp(endTimeMs)))
}

const YTSkipSegmentPage = ({ segments }: YTSkipSegmentPageProps): Element => {
  return table(
    thead(tr(th('Category'), th('Begin Time'), th('End Time'))),
    () => tbody(
      segments.val.length > 0 ?
        segments.val.map(YTSkipSegmentTableItem) :
        tr(td({ colSpan: 3 }, 'No skip segments in this video'))
    )
  )
}

export default YTSkipSegmentPage