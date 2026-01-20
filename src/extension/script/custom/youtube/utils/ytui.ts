import { YTValueData, YTValueType } from '@ext/custom/youtube/api/schema'
import { executeYTCommand } from '@ext/custom/youtube/module/core/command'

export interface YTUIDialogButton {
  title: string
  command: YTValueData<{ type: YTValueType.ENDPOINT }>
}

export const ytuiShowDialog = (header: string, content: string[], buttons: [YTUIDialogButton, YTUIDialogButton]): void => {
  executeYTCommand({
    showDialogCommand: {
      panelLoadingStrategy: {
        inlineContent: {
          dialogViewModel: {
            header: {
              dialogHeaderViewModel: {
                headline: { content: header }
              }
            },
            content: {
              basicContentViewModel: {
                paragraphs: content.map(paragraph => ({ text: { content: paragraph } }))
              }
            },
            footer: {
              panelFooterViewModel: {
                primaryButton: {
                  buttonViewModel: {
                    title: buttons[0].title,
                    style: 'BUTTON_VIEW_MODEL_STYLE_MONO',
                    type: 'BUTTON_VIEW_MODEL_TYPE_FILLED',
                    onTap: {
                      innertubeCommand: buttons[0].command
                    }
                  }
                },
                secondaryButton: {
                  buttonViewModel: {
                    title: buttons[1].title,
                    style: 'BUTTON_VIEW_MODEL_STYLE_MONO',
                    type: 'BUTTON_VIEW_MODEL_TYPE_TONAL',
                    onTap: {
                      innertubeCommand: buttons[1].command
                    }
                  }
                },
                shouldHideDivider: true
              }
            }
          }
        }
      }
    }
  })
}

export const ytuiShowToast = (message: string, duration: number): void => {
  executeYTCommand({
    openPopupAction: {
      durationHintMs: duration,
      popup: {
        notificationActionRenderer: {
          responseText: { simpleText: message }
        },
        overlayToastRenderer: {
          title: { simpleText: message }
        }
      },
      popupType: 'TOAST'
    }
  })
}