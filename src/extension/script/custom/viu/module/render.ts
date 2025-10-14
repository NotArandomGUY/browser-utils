import { playerIsPlaying } from '@ext/custom/viu/module/player'
import { VIU_STATE } from '@ext/custom/viu/state'
import { floor, min } from '@ext/global/math'
import { monitorSelector } from '@ext/lib/dom'
import { Feature } from '@ext/lib/feature'
import Logger from '@ext/lib/logger'
import { toCanvas } from 'qrcode'

const logger = new Logger('VIU-RENDER')

const deactivateCallbacks: (() => void)[] = []

let container: HTMLDivElement | null = null
let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let qrWidth: number = 0
let qrHeight: number = 0

function renderText(color: string, text: string) {
  if (ctx == null) return

  ctx.font = `900 ${floor(qrWidth / 12)}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.shadowColor = 'black'
  ctx.shadowBlur = 8
  ctx.lineWidth = 6
  ctx.strokeText(text, qrWidth / 2, qrHeight / 2, qrWidth - 8)
  ctx.fillStyle = color
  ctx.fillText(text, qrWidth / 2, qrHeight / 2, qrWidth - 8)
}

function render() {
  if (container == null || canvas == null || ctx == null) return

  if (document.fullscreenElement == null) {
    const { width, height } = container.getBoundingClientRect()
    const rectSize = min(width, height)

    qrWidth = canvas.width = rectSize - 8
    qrHeight = canvas.height = rectSize - 8
  } else {
    qrWidth = canvas.width = 200
    qrHeight = canvas.height = 200
  }

  ctx.clearRect(0, 0, qrWidth, qrHeight)

  if (VIU_STATE.peerId.length === 0) {
    renderText('yellow', 'Connecting...')
    return
  }

  toCanvas(canvas, btoa(`pc=client&pn=bu-remote&peer-id=${encodeURIComponent(VIU_STATE.peerId)}`), {
    margin: 2,
    width: qrWidth,
    color: {
      dark: '#6f064cff',
      light: VIU_STATE.connectedPeer > 0 ? '#38fa58ff' : '#5bc8feff'
    }
  })

  if (VIU_STATE.connectedPeer <= 0) return

  renderText('white', `${VIU_STATE.connectedPeer} Connected`)
}

export function updateCanvasStyle(): void {
  if (canvas == null || container == null) return

  const { style, parentElement } = canvas

  const isCorrectContainer = parentElement === (document.fullscreenElement ?? container)
  if (!isCorrectContainer) parentElement?.removeChild(canvas)

  if (document.fullscreenElement != null) {
    style.display = playerIsPlaying() ? 'none' : 'block'
    style.position = 'fixed'
    style.top = '5em'
    style.right = '8px'
    style.width = 'initial'
    style.height = 'initial'

    if (isCorrectContainer) return

    document.querySelector('video')?.parentElement?.appendChild(canvas)
  } else {
    style.display = 'initial'
    style.position = 'initial'
    style.top = 'initial'
    style.right = 'initial'
    style.width = '100%'
    style.height = '100%'

    if (isCorrectContainer) return

    container.appendChild(canvas)
  }
}

export default class ViuRenderModule extends Feature {
  protected activate(): boolean {
    window.addEventListener('fullscreenchange', updateCanvasStyle)

    const timer = setInterval(render, 500)

    deactivateCallbacks.push(
      /*
      monitorSelector<HTMLDivElement>('#qr_code', (element) => {
        container = element
    
        logger.info('found container')
      }),
      */
      monitorSelector<SVGElement>('svg[aria-label=PCCW],div[class="flex gap-x-2"]', (element) => {
        if (container != null && document.body.contains(container)) return

        container = <HTMLDivElement>element.parentElement
        if (container == null) return

        container.id = 'alt_qr_code'
        container.style.padding = '8px'
        container.style.width = '256px'
        container.style.height = '256px'
        container.innerHTML = '<canvas />'

        logger.debug('found container')
      }),
      monitorSelector<HTMLCanvasElement>(/*'#qr_code canvas'*/'#alt_qr_code canvas', (element) => {
        canvas = element
        ctx = canvas.getContext('2d')
        updateCanvasStyle()

        logger.debug('found canvas')
      }),
      () => clearInterval(timer)
    )

    return true
  }

  protected deactivate(): boolean {
    window.removeEventListener('fullscreenchange', updateCanvasStyle)
    deactivateCallbacks.splice(0).forEach(callback => callback())

    return true
  }
}