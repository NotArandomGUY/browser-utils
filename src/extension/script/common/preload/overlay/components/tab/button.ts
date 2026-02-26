import { buildClass, ClassNameProps } from '@ext/common/preload/overlay/style/class'
import van, { ChildDom, State } from 'vanjs-core'

const { button } = van.tags

export interface TabButtonProps extends ClassNameProps {
  title: string
  active: State<boolean>
  onClick(): void
}

const TabButton = ({ parentClass, title, active, onClick }: TabButtonProps): ChildDom => {
  return button(
    { class: () => buildClass(...parentClass, 'btn', [active.val ? 'active' : 'inactive']), onclick: onClick },
    title
  )
}

export default TabButton