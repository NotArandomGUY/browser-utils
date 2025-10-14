import { buildClass, ClassNameProps } from '@ext/common/preload/overlay/style/class'
import van, { ChildDom } from 'vanjs-core'

const { button, div, h6 } = van.tags

export interface ModalTopbarProps extends ClassNameProps {
  title: string
  onCloseClick(): void
}

const ModalTopbar = ({ parentClassName, title, onCloseClick }: ModalTopbarProps): ChildDom => {
  const className = buildClass(parentClassName, 'topbar')

  return div(
    { class: className },
    h6({ class: buildClass(className, 'title') }, title),
    button({ class: buildClass(className, 'close-btn'), onclick: onCloseClick }, 'X')
  )
}

export default ModalTopbar