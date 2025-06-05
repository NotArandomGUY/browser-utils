let nextDialogId = 0

export default async function dialog<T extends string[]>(title: string, content: string, action: T, canClose: boolean): Promise<T[number] | 'Close'> {
  return new Promise<T[number]>((resolve, reject) => {
    const id = nextDialogId++

    const modalHeader = $('<div class="modal-header">')
      .append($(`<h1 class="modal-title fs-5" id="dialog${id}-modal-label">`).text(title))

    const modalFooter = $('<div class="modal-footer">')

    let firstAction = true
    for (const act of action) {
      $(`<button type="button" class="btn btn-${firstAction ? 'primary' : 'secondary'}" data-action="${act}">`)
        .text(act)
        .appendTo(modalFooter)

      firstAction = false
    }

    if (canClose) {
      modalHeader.append($('<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" data-action="Close">'))
      modalFooter.append($('<button type="button" class="btn btn-secondary" data-action="Close">').text('Close'))
    }

    const modal = $(`<div class="modal fade" id="dialog${id}-modal" tabindex="-1" aria-labelledby="dialog${id}-modal-label" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">`)
      .append(
        $('<div class="modal-dialog">')
          .append(
            $('<div class="modal-content">')
              .append(modalHeader)
              .append($('<div class="modal-body">').text(content))
              .append(modalFooter)
          )
      )
      .appendTo(document.body)

    let lastAction: T[number] | 'Close' = 'Close'
    modal.on('click', e => {
      const { target } = e

      const targetAction = target.getAttribute('data-action')
      if (targetAction == null) return

      lastAction = targetAction
      modal.modal('hide')
    })
    modal.on('hidden.bs.modal', () => {
      resolve(lastAction)
      modal.remove()
    })

    modal.modal('show')
  })
}