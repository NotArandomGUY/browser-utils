import Backdrop from '@ext/overlay/components/backdrop'
import Lifecycle from '@ext/overlay/components/lifecycle'
import Modal from '@ext/overlay/components/modal'
import Tab, { TabPageProps } from '@ext/overlay/components/tab'
import FeaturePage from '@ext/overlay/pages/feature'
import { buildClass } from '@ext/overlay/style/class'
import styles from '@ext/overlay/style/overlay.css'
import van from 'vanjs-core'

export interface OverlayProps {
  initIndex?: number
  onTabChange?(index: number): void
  onClose(): void
}

const additionalPageSet = new Set<TabPageProps>()

export function registerOverlayPage(title: string, content: Element): void {
  additionalPageSet.add({ title, content })
}

class OverlayLifecycle extends Lifecycle<OverlayProps> {
  private static readonly ID = Lifecycle.getId('overlay')

  public static override define(): void {
    Lifecycle.define(OverlayLifecycle, OverlayLifecycle.ID)
  }

  public static override create(props: OverlayProps): OverlayLifecycle {
    return Lifecycle.create(props, OverlayLifecycle.ID) as OverlayLifecycle
  }

  protected override onCreate({ initIndex, onTabChange, onClose }: OverlayProps): void {
    const { classList } = this

    const className = buildClass('bu-overlay')
    classList.add(className)

    styles.use()

    van.add(
      this,
      Backdrop({ parentClassName: className, onClick: onClose }),
      Modal({
        parentClassName: className,
        title: 'Browser Utils',
        onClose,
        content: Tab({
          parentClassName: className,
          tabs: [
            { title: 'Feature', content: FeaturePage({ parentClassName: className }) },
            ...additionalPageSet.values()
          ],
          initIndex,
          onTabChange
        })
      })
    )
  }

  protected override onDestroy(): void {
    styles.unuse()
  }
}

OverlayLifecycle.define()

const Overlay = OverlayLifecycle.create

export default Overlay