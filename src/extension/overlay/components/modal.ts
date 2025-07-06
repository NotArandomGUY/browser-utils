import Lifecycle from '@ext/overlay/components/lifecycle'
import ModalContent from '@ext/overlay/components/modal/content'
import ModalTopbar from '@ext/overlay/components/modal/topbar'
import { buildClass, ClassNameProps } from '@ext/overlay/style/class'
import van, { ChildDom } from 'vanjs-core'

const modalStack: ModalLifecycle[] = []

export interface ModalProps extends ClassNameProps {
  title: string
  content: ChildDom
  onClose(): void
}

class ModalLifecycle extends Lifecycle<ModalProps> {
  private static readonly ID = Lifecycle.getId('modal')

  public static override define(): void {
    Lifecycle.define(ModalLifecycle, ModalLifecycle.ID)
  }

  public static override create(props: ModalProps): ModalLifecycle {
    return Lifecycle.create(props, ModalLifecycle.ID) as ModalLifecycle
  }

  public constructor() {
    super()

    this.onKeyDown = this.onKeyDown.bind(this)
  }

  protected override onCreate({ parentClassName, title, content, onClose }: ModalProps): void {
    const { classList } = this

    const className = buildClass(parentClassName, 'modal')
    classList.add(className)

    const { body, activeElement } = document

    body.addEventListener('keydown', this.onKeyDown)

    if (activeElement instanceof HTMLElement) activeElement.blur()

    van.add(
      this,
      ModalTopbar({ parentClassName: className, title, onCloseClick: onClose }),
      ModalContent({ parentClassName: className }, ...(Array.isArray(content) ? content : [content]))
    )
    modalStack.unshift(this)
  }

  protected override onDestroy(): void {
    modalStack.splice(modalStack.indexOf(this), 1)

    document.body.removeEventListener('keydown', this.onKeyDown)
  }

  private getAllFocusable(): HTMLElement[] {
    return Array.from(this.querySelectorAll<HTMLElement>('[tabindex="0"],button,input,select'))
  }

  private onKeyDown(event: KeyboardEvent): void {
    const { key, shiftKey } = event

    if (modalStack[0] !== this || key !== 'Tab') return

    const focusable = this.getAllFocusable()
    if (focusable.length === 0) {
      event.preventDefault()
      return
    }

    const { activeElement } = document

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (!this.contains(activeElement)) {
      event.preventDefault()
      first.focus()
      return
    }

    const begin = shiftKey ? last : first
    const end = shiftKey ? first : last

    if (activeElement === end) {
      event.preventDefault()
      begin.focus()
    }
  }
}

ModalLifecycle.define()

const Modal = ModalLifecycle.create

export default Modal