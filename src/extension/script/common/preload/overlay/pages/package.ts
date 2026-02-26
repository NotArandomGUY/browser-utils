import { buildClass, ClassNameProps } from '@ext/common/preload/overlay/style/class'
import { floor } from '@ext/global/math'
import { entries } from '@ext/global/object'
import { Feature, FeatureGroup, FeatureState, getAllFeatureGroup, getFeatureGroupDisableMask, setFeatureGroupDisableMask } from '@ext/lib/feature'
import van, { State } from 'vanjs-core'

const { button, div, h1, p, table, tbody, td, th, thead, tr } = van.tags

export interface PackagePageProps extends ClassNameProps {
  updateStatus: State<string>
  onUpdateClick(): void
}

interface FeatureGroupTableItemProps extends ClassNameProps {
  groupId: string
  group: FeatureGroup
}

interface FeatureTableItemProps extends ClassNameProps {
  groupId: string
  featureId: number
  feature: Feature
  visible: State<boolean>
  groupEnabled: State<boolean>
}

const FeatureGroupTableItem = ({ parentClass, groupId, group }: FeatureGroupTableItemProps): HTMLTableRowElement[] => {
  const classPath = [...parentClass, 'feature'] as const
  const expanded = van.state(false)
  const enabled = van.state(((getFeatureGroupDisableMask(groupId)[0] ?? 0) & 1) === 0)

  const handleToggleClick = (): void => {
    let mask = getFeatureGroupDisableMask(groupId)
    if (mask.length === 0) mask = new Uint8Array(1)

    mask[0] ^= 1
    setFeatureGroupDisableMask(groupId, mask)

    enabled.val = (mask[0] & 1) === 0
  }

  return [
    tr(
      { class: buildClass(...classPath, []) },
      td({ class: buildClass(...classPath, 'shrink', []), rowSpan: () => 1 + (expanded.val ? group.featureMap.size : 0) }, groupId),
      td(button({ onclick() { expanded.val = !expanded.val } }, () => expanded.val ? 'Collapse' : 'Expand')),
      td({ class: buildClass(...classPath, 'shrink', []) }, button({ onclick: handleToggleClick }, () => enabled.val ? 'Disable All' : 'Enable All'))
    ),
    ...Array.from(group.featureMap.entries()).map(e => FeatureTableItem({
      parentClass: classPath,
      groupId,
      featureId: e[0],
      feature: e[1],
      visible: expanded,
      groupEnabled: enabled
    }))
  ]
}

const FeatureTableItem = ({ parentClass, groupId, featureId, feature, visible, groupEnabled }: FeatureTableItemProps): HTMLTableRowElement => {
  const enabled = van.state(feature.getState() === FeatureState.ACTIVE)

  van.derive(() => enabled.val = groupEnabled.val ? feature.getState() === FeatureState.ACTIVE : false)

  const handleToggleClick = (): void => {
    const index = floor((featureId + 1) / 8)
    const bit = 1 << ((featureId + 1) % 8)

    let mask = getFeatureGroupDisableMask(groupId)
    if (mask.length <= index) {
      const newMask = new Uint8Array(index + 1)
      newMask.set(mask)
      mask = newMask
    }

    mask[index] ^= bit
    setFeatureGroupDisableMask(groupId, mask)

    enabled.val = (mask[index] & bit) === 0
  }

  return tr(
    { class: buildClass(...parentClass, 'shrink', []), style: () => visible.val ? '' : 'display:none;' },
    td({ style: 'text-align:left!important' }, feature.getName() ?? `ID-${featureId}`),
    td(button({ disabled: feature.getState() === FeatureState.INACTIVE, onclick: handleToggleClick }, () => enabled.val ? 'Disable' : 'Enable'))
  )
}

const PackagePage = ({ parentClass, updateStatus, onUpdateClick }: PackagePageProps): Element => {
  const classPath = [...parentClass, 'page', 'package'] as const
  const featureGroupMap = van.derive(getAllFeatureGroup)

  return div(
    { class: `${buildClass(...parentClass, 'page', [])} ${buildClass(...classPath, [])}` },
    h1('Update'),
    div(
      { style: 'display:flex;flex-direction:row;align-items:center;gap:0.5em' },
      button({ onclick: onUpdateClick }, 'Check for update'),
      p(() => `Status: ${updateStatus.val}`)
    ),
    h1('Feature switches'),
    table(
      thead(
        tr(th('Group'), th('Feature'), th('Action'))
      ),
      tbody(entries(featureGroupMap.val).flatMap(e => FeatureGroupTableItem({ parentClass: classPath, groupId: e[0], group: e[1] })))
    )
  )
}

export default PackagePage