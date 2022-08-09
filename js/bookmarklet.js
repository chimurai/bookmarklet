(function () {
  init()

  function init () {
    const { codeMirrorSource, codeMirrorOutput } = initEditors()

    persistentCodeMirror(codeMirrorSource);
    loadPersistedBookMarklet()

    const dialog = document.querySelector('dialog')
    dialog.querySelector('.close').addEventListener('click', () => dialog.close())
    document.getElementById('create').addEventListener('click', (e) => createBookmarklet(e, codeMirrorSource, codeMirrorOutput, dialog))
  }

  const BOOKMARKLET = {
    HEADER: 'javascript:(async function(){',
    FOOTER: '})()'
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
        const decoded = decodeURI(bookmarklet).replace(BOOKMARKLET.HEADER, '').replace(BOOKMARKLET.FOOTER, '')
        instance.setValue(decoded)
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
    const bookmarklet = `${BOOKMARKLET.HEADER}${source.replace(reStripComments, '$1')}${BOOKMARKLET.FOOTER}`
    const bookmarkletEncoded = encodeURI(bookmarklet)

    dialog.showModal()

    codeMirrorOutput.setValue(bookmarkletEncoded)
    document.getElementById('output-link').href = bookmarkletEncoded
    document.querySelector('.bookmarklet-name').innerHTML = document.getElementById('name').value;

  }

  /**
   * Persist the bookmarklet in sessionStorage, so it can be restored on page reload
   */
  function persistentCodeMirror(codeMirrorInstance) {
    // persist sessionStorage
    codeMirrorInstance.on('change', (instance, e) => {
      const bookmarklet = getBookMarklet();
      window.sessionStorage.setItem('bookmarklet-name', bookmarklet.name);
      window.sessionStorage.setItem('bookmarklet-code', bookmarklet.code);
    })
  }

  /**
   * Load the bookmarklet from sessionStorage
   */
  function loadPersistedBookMarklet() {
    const persistedBookmarklet = {
      name: window.sessionStorage.getItem('bookmarklet-name'),
      code: window.sessionStorage.getItem('bookmarklet-code')
    }
    if (persistedBookmarklet.name && persistedBookmarklet.code) {
      setBookMarklet(persistedBookmarklet)
    }
  }

})();

/**
 * @returns {{name: string, code: string}}
 */
function getBookMarklet() {
  return {
    name: document.getElementById('name').value,
    code: document.querySelector('.CodeMirror').CodeMirror.getValue()
  }
}

/**
 * 
 * @param {{name: string, code: string}} bookmarklet 
 */
function setBookMarklet({name, code}) {
  document.getElementById('name').value = name
  document.querySelector('.CodeMirror').CodeMirror.setValue(code)
}
