import TabContent from '@ext/overlay/components/tab/content'
import TabTopbar from '@ext/overlay/components/tab/topbar'
import { buildClass, ClassNameProps } from '@ext/overlay/style/class'
import van, { ChildDom } from 'vanjs-core'

const { div } = van.tags

export interface TabPageProps {
  title: string
  content: ChildDom
}

export interface TabProps extends ClassNameProps {
  tabs: TabPageProps[]
  initIndex?: number
  onTabChange?(index: number): void
}

const Tab = ({ parentClassName, tabs, initIndex = 0, onTabChange }: TabProps): ChildDom => {
  const className = buildClass(parentClassName, 'tab')
  const currentIndex = van.state(initIndex)
  const previousIndex = van.state(initIndex)

  van.derive(() => {
    if (currentIndex.val === previousIndex.val) return

    onTabChange?.(currentIndex.val)
    previousIndex.val = currentIndex.val
  })

  return div(
    { class: className },
    (tabs.length > 1 ? TabTopbar({ parentClassName: className, tabs: tabs.map(tab => tab.title), index: currentIndex }) : null),
    TabContent({ parentClassName: className, tabs: tabs.map(tab => tab.content), index: currentIndex })
  )
}

export default Tab