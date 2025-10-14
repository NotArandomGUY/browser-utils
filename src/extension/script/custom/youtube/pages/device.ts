import van from 'vanjs-core'

const { button, div, input, table, tbody, td, th, tr } = van.tags

const DEVICE_LABEL_KEY = 'bu-device-label'
const RESET_KEYS = ['yt.leanback.default::mdx-device-id', 'yt.leanback.default::yt_mdx_screen']

const YTDevicePage = (): Element => {
  const label = van.state(localStorage.getItem(DEVICE_LABEL_KEY) ?? '')

  const handleSaveClick = (): void => {
    const value = label.val.trim()
    if (value.length > 0) {
      localStorage.setItem(DEVICE_LABEL_KEY, value)
    } else {
      localStorage.removeItem(DEVICE_LABEL_KEY)
    }

    for (const key of RESET_KEYS) localStorage.removeItem(key)

    location.reload()
  }

  const elem = div(
    { style: 'display:flex;flex-direction:column;' },
    table(
      tbody(
        tr(
          th({ style: 'width:1px;' }, 'Label'),
          td(input({ style: 'width:100%;', placeholder: 'My Device', value: label, oninput: e => label.val = e.target.value }))
        )
      )
    ),
    button({ onclick: handleSaveClick }, 'Save & Reload')
  )

  return elem
}

export default YTDevicePage