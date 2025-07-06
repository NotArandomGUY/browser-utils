import { buildClass, ClassNameProps } from '@ext/overlay/style/class'
import van, { ChildDom, State } from 'vanjs-core'

const { div } = van.tags

export interface TabContentProps extends ClassNameProps {
  tabs: ChildDom[]
  index: State<number>
}

function TabContent({ parentClassName, tabs, index }: TabContentProps): ChildDom {
  const className = buildClass(parentClassName, 'content')

  return () => div({ class: className }, tabs[index.val])
}

export default TabContent