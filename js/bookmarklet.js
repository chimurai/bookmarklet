(function () {
  const BOOKMARKLET = {
    HEADER: 'javascript:(async function(){',
    FOOTER: '})()'
  }

  init()

  function init () {
    const { codeMirrorSource, codeMirrorOutput } = createEditors(window.CodeMirror)

    codeMirrorSource.on('drop', (instance, e) => {
      setTimeout(function () {
        const bookmarklet = instance.getSelection()
        const decoded = decodeURI(bookmarklet).replace(BOOKMARKLET.HEADER, '').replace(BOOKMARKLET.FOOTER, '')
        instance.setValue(decoded)
      })
    });

    codeMirrorSource.on('change', persistCodeMirrorOnChange) // persist to sessionStorage
    codeMirrorSource.on('change', updateTryItButton) // update try it button
    loadPersistedBookMarklet()

    const dialog = document.querySelector('dialog')
    dialog.querySelector('.close').addEventListener('click', () => dialog.close())
    document.getElementById('create').addEventListener('click', (e) => createBookmarklet(e, codeMirrorSource, codeMirrorOutput, dialog))
  }

  function createEditors (CodeMirror) {
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

    const bookmarkletEncoded = createBookmarkletUri(codeMirrorSource.getValue())

    dialog.showModal()

    codeMirrorOutput.setValue(bookmarkletEncoded)
    document.getElementById('output-link').href = bookmarkletEncoded
    document.querySelector('.bookmarklet-name').innerHTML = document.getElementById('name').value;

  }

  function createBookmarkletUri(sourceCode) {
    const reStripComments = /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm
    const bookmarklet = `${BOOKMARKLET.HEADER}${sourceCode.replace(reStripComments, '$1')}${BOOKMARKLET.FOOTER}`
    const bookmarkletEncoded = encodeURI(bookmarklet)
    return bookmarkletEncoded;
  }

  /**
   * Persist the bookmarklet in sessionStorage, so it can be restored on page reload
   */
  function persistCodeMirrorOnChange(instance, e) {
    const bookmarklet = getBookMarklet();
    window.sessionStorage.setItem('bookmarklet-name', bookmarklet.name);
    window.sessionStorage.setItem('bookmarklet-code', bookmarklet.code);
  }

  function updateTryItButton(instance, e) {
    const bookMarkletUri = createBookmarkletUri(instance.getValue());
    document.getElementById('try-it').onclick = () => window.location.href = bookMarkletUri;
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
    } else {
      setBookMarklet({name: 'My Bookmarklet', code: `// your bookmarklet code
alert('Hello world')`});
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
