import TabButton from '@ext/overlay/components/tab/button'
import { buildClass, ClassNameProps } from '@ext/overlay/style/class'
import van, { ChildDom, State } from 'vanjs-core'

const { div } = van.tags

export interface TabTopbarProps extends ClassNameProps {
  tabs: string[]
  index: State<number>
}

const TabTopbar = ({ parentClassName, tabs, index }: TabTopbarProps): ChildDom => {
  const className = buildClass(parentClassName, 'topbar')

  return div(
    { class: className },
    tabs.map((title, i) => TabButton({
      parentClassName: className,
      title,
      active: van.derive(() => index.val === i),
      onClick() { index.val = i }
    }))
  )
}

export default TabTopbar