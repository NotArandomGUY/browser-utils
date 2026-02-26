import { buildClass, ClassNameProps } from '@ext/common/preload/overlay/style/class'
import van, { ChildDom } from 'vanjs-core'

const { button, div, h6 } = van.tags

export interface ModalTopbarProps extends ClassNameProps {
  title: string
  onCloseClick(): void
}

const ModalTopbar = ({ parentClass, title, onCloseClick }: ModalTopbarProps): ChildDom => {
  const classPath = [...parentClass, 'topbar'] as const

  return div(
    { class: buildClass(...classPath, []) },
    h6({ class: buildClass(...classPath, 'title', []) }, title),
    button({ class: buildClass(...classPath, 'close-btn', []), onclick: onCloseClick }, 'X')
  )
}

export default ModalTopbar