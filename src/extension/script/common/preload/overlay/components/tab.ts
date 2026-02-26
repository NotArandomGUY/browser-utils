import TabContent from '@ext/common/preload/overlay/components/tab/content'
import TabTopbar from '@ext/common/preload/overlay/components/tab/topbar'
import { buildClass, ClassNameProps } from '@ext/common/preload/overlay/style/class'
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

const Tab = ({ parentClass, tabs, initIndex = 0, onTabChange }: TabProps): ChildDom => {
  const classPath = [...parentClass, 'tab'] as const
  const currentIndex = van.state(initIndex)
  const previousIndex = van.state(initIndex)

  van.derive(() => {
    if (currentIndex.val === previousIndex.val) return

    onTabChange?.(currentIndex.val)
    previousIndex.val = currentIndex.val
  })

  return div(
    { class: buildClass(...classPath, []) },
    (tabs.length > 1 ? TabTopbar({ parentClass: classPath, tabs: tabs.map(tab => tab.title), index: currentIndex }) : null),
    TabContent({ parentClass: classPath, tabs: tabs.map(tab => tab.content), index: currentIndex })
  )
}

export default Tab