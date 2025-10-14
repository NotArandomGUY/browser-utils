import Backdrop from '@ext/common/preload/overlay/components/backdrop'
import Lifecycle from '@ext/common/preload/overlay/components/lifecycle'
import Modal from '@ext/common/preload/overlay/components/modal'
import Tab, { TabPageProps } from '@ext/common/preload/overlay/components/tab'
import PackagePage, { PackagePageProps } from '@ext/common/preload/overlay/pages/package'
import { buildClass } from '@ext/common/preload/overlay/style/class'
import styles from '@ext/common/preload/overlay/style/overlay.css'
import van, { ChildDom } from 'vanjs-core'

export interface OverlayProps {
  initIndex?: number

  packageProps: Omit<PackagePageProps, 'parentClassName'>

  onTabChange?(index: number): void
  onClose(): void
}

const additionalPageSet = new Set<TabPageProps>()

export const registerOverlayPage = (title: string, content: ChildDom): void => {
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

  protected override onCreate({ initIndex, packageProps, onTabChange, onClose }: OverlayProps): void {
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
            { title: 'Package', content: PackagePage.bind(null, { ...packageProps, parentClassName: className }) },
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