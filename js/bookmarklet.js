(function () {
  init()

  function init () {
    const { codeMirrorSource, codeMirrorOutput } = initEditors()

    persistentCodeMirror(codeMirrorSource);

    const dialog = document.querySelector('dialog')
    dialog.querySelector('.close').addEventListener('click', () => dialog.close())
    document.getElementById('create').addEventListener('click', (e) => createBookmarklet(e, codeMirrorSource, codeMirrorOutput, dialog))
  }

  const BOOKMARKLET = {
    PRE: 'javascript:(function(){',
    POST: '}())'
  }

  function initEditors () {
    const CodeMirror = window.CodeMirror

    const codeMirrorSource = CodeMirror.fromTextArea(document.getElementById('source'), {
      autofocus: true,
      lineNumbers: true,
      indentUnit: 2,
      tabSize: 2,
      indentWithTabs: false,
      mode: {name: 'javascript', globalVars: true},
      extraKeys: {'Ctrl-Space': 'autocomplete'},
      theme: 'monokai'
    })

    codeMirrorSource.on('drop', (instance, e) => {
      setTimeout(function () {
        const bookmarklet = instance.getSelection()
        const decoded = decodeURI(bookmarklet).replace(BOOKMARKLET.PRE, '').replace(BOOKMARKLET.POST, '')
        instance.setValue(decoded)
        console.log(e)
        console.log(e.dataTransfer.files[0])
      })
    })

    const codeMirrorOutput = CodeMirror.fromTextArea(document.getElementById('output-code'), {
      mode: {name: 'javascript', globalVars: true},
      lineWrapping: true,
      readOnly: true,
      theme: 'default'
    })

    return { codeMirrorSource, codeMirrorOutput }
  }

  function createBookmarklet (e, codeMirrorSource, codeMirrorOutput, dialog) {
    e.preventDefault()
    const reStripComments = /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm
    const source = codeMirrorSource.getValue()
    const bookmarklet = `${BOOKMARKLET.PRE}${source.replace(reStripComments, '$1')}${BOOKMARKLET.POST}`
    const bookmarkletEncoded = encodeURI(bookmarklet)

    dialog.showModal()

    codeMirrorOutput.setValue(bookmarkletEncoded)
    document.getElementById('output-link').href = bookmarkletEncoded
    Array.prototype.map.call(document.querySelectorAll('.bookmarklet-name'), (el) => {
      el.innerHTML = document.getElementById('name').value
    })

    codeMirrorOutput.focus()
  }

  function persistentCodeMirror(codeMirrorInstance) {
    // persist sessionStorage
    codeMirrorInstance.on('change', (instance, e) => {
      window.sessionStorage.setItem('bookmarklet-source', instance.getValue());
    })

    // restore from sessionStorage
    const persistedBookmarklet = window.sessionStorage.getItem('bookmarklet-source')
    persistedBookmarklet && codeMirrorInstance.setValue(persistedBookmarklet)
  }

}())
