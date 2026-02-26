import { buildClass, ClassNameProps } from '@ext/common/preload/overlay/style/class'
import van, { ChildDom } from 'vanjs-core'

const { div } = van.tags

export interface OverlayBackdropProps extends ClassNameProps {
  onClick?(): void
}

const Backdrop = ({ parentClass, onClick }: OverlayBackdropProps): ChildDom => {
  return div({ class: buildClass(...parentClass, 'backdrop', []), onclick: onClick ?? null })
}

export default Backdrop