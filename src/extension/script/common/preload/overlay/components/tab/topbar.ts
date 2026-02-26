import TabButton from '@ext/common/preload/overlay/components/tab/button'
import { buildClass, ClassNameProps } from '@ext/common/preload/overlay/style/class'
import van, { ChildDom, State } from 'vanjs-core'

const { div } = van.tags

export interface TabTopbarProps extends ClassNameProps {
  tabs: string[]
  index: State<number>
}

const TabTopbar = ({ parentClass, tabs, index }: TabTopbarProps): ChildDom => {
  const classPath = [...parentClass, 'topbar'] as const

  return div(
    { class: buildClass(...classPath, []) },
    tabs.map((title, i) => TabButton({
      parentClass: classPath,
      title,
      active: van.derive(() => index.val === i),
      onClick() { index.val = i }
    }))
  )
}

export default TabTopbar