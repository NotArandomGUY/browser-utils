import { buildClass, ClassNameProps } from '@ext/overlay/style/class'
import van, { ChildDom } from 'vanjs-core'

const { div } = van.tags

export interface OverlayBackdropProps extends ClassNameProps {
  onClick?(): void
}

const Backdrop = ({ parentClassName, onClick }: OverlayBackdropProps): ChildDom => {
  const className = buildClass(parentClassName, 'backdrop')

  return div({ class: className, onclick: onClick ?? null })
}

export default Backdrop