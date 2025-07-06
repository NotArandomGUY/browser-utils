import { SkipSegmentEntry } from '@ext/site/youtube/module/player/smart-skip'
import van, { ChildDom, State } from 'vanjs-core'

const { table, tbody, td, th, thead, tr } = van.tags
const { floor } = Math

export interface YTSkipSegmentPageProps {
  segments: State<SkipSegmentEntry[]>
}

function getTimestamp(time: number): string {
  const sec = floor(time / 1e3)

  return [
    Math.floor(sec / 3600),
    floor(sec / 60) % 60,
    sec % 60
  ].map(n => n.toString().padStart(2, '0')).join(':')
}

function YTSkipSegmentTableItem({ startTimeMs, endTimeMs, category }: SkipSegmentEntry): ChildDom {
  return tr(td(category ?? 'unknown'), td(getTimestamp(startTimeMs)), td(getTimestamp(endTimeMs)))
}

function YTSkipSegmentPage({ segments }: YTSkipSegmentPageProps): Element {
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