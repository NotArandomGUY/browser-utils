import TabContent from '@ext/overlay/components/tab/content'
import TabTopbar from '@ext/overlay/components/tab/topbar'
import { buildClass, ClassNameProps } from '@ext/overlay/style/class'
import van, { ChildDom } from 'vanjs-core'

const { div } = van.tags

export interface TabPageProps {
  title: string
  content: Element
}

export interface TabProps extends ClassNameProps {
  tabs: TabPageProps[]
}

function Tab({ parentClassName, tabs }: TabProps): ChildDom {
  const className = buildClass(parentClassName, 'tab')
  const index = van.state(0)

  return div(
    { class: className },
    (tabs.length > 1 ? TabTopbar({ parentClassName: className, tabs: tabs.map(tab => tab.title), index }) : null),
    TabContent({ parentClassName: className, tabs: tabs.map(tab => tab.content), index })
  )
}

export default Tab