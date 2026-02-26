import { buildClass, ClassNameProps } from '@ext/common/preload/overlay/style/class'
import van, { ChildDom } from 'vanjs-core'

const { div } = van.tags

export interface ModalContentProps extends ClassNameProps { }

const ModalContent = ({ parentClass }: ModalContentProps, ...child: ChildDom[]): ChildDom => {
  return div({ class: buildClass(...parentClass, 'content', []) }, ...child)
}

export default ModalContent