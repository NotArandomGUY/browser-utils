import { buildClass, ClassNameProps } from '@ext/common/preload/overlay/style/class'
import van, { ChildDom } from 'vanjs-core'

const { div } = van.tags

export interface ModalContentProps extends ClassNameProps { }

const ModalContent = ({ parentClassName }: ModalContentProps, ...child: ChildDom[]): ChildDom => {
  const className = buildClass(parentClassName, 'content')

  return div({ class: className }, ...child)
}

export default ModalContent