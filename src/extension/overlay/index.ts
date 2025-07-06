import Backdrop from '@ext/overlay/components/backdrop'
import Modal from '@ext/overlay/components/modal'
import Tab, { TabPageProps } from '@ext/overlay/components/tab'
import FeaturePage from '@ext/overlay/pages/feature'
import { buildClass } from '@ext/overlay/style/class'
import van from 'vanjs-core'

const { div } = van.tags

export interface OverlayProps {
  onClose(): void
}

const additionalPageSet = new Set<TabPageProps>()

export function registerOverlayPage(title: string, content: Element): void {
  additionalPageSet.add({ title, content })
}

function Overlay({ onClose }: OverlayProps): HTMLDivElement {
  const className = buildClass('bu-overlay')

  return div(
    { class: className },
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
        ]
      })
    })
  )
}

window.addEventListener('load', () => {
  import(/* webpackMode: "eager" */'@ext/overlay/style/overlay.css').catch(console.warn)
})

export default Overlay