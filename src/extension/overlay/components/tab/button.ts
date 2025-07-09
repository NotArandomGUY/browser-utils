import { buildClass, ClassNameProps } from '@ext/overlay/style/class'
import van, { ChildDom, State } from 'vanjs-core'

const { button } = van.tags

export interface TabButtonProps extends ClassNameProps {
  title: string
  active: State<boolean>
  onClick(): void
}

const TabButton = ({ parentClassName, title, active, onClick }: TabButtonProps): ChildDom => {
  return button(
    { class: () => buildClass(parentClassName, active.val ? 'btn-active' : 'btn'), onclick: onClick },
    title
  )
}

export default TabButton