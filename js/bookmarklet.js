// @ts-check
(function () {
  /**
   * @typedef BookmarkletData
   * @prop {string} name Bookmarklet name
   * @prop {string} code Bookmarklet code
   */

  class EditorFactory {
    #CodeMirror = globalThis.CodeMirror;

    createEditor(textAreaId) {
      return this.#CodeMirror.fromTextArea(document.getElementById(textAreaId), {
        autofocus: true,
        lineNumbers: true,
        indentUnit: 2,
        tabSize: 2,
        indentWithTabs: false,
        mode: { name: 'javascript', globalVars: true },
        extraKeys: { 'Ctrl-Space': 'autocomplete' },
        theme: 'monokai',
      });
    }

    createReadOnlyEditor(textAreaId) {
      return this.#CodeMirror.fromTextArea(document.getElementById(textAreaId), {
        mode: { name: 'javascript', globalVars: true },
        lineWrapping: true,
        readOnly: true,
        theme: 'default',
      });
    }
  }

  class Bookmarklet {
    static #BOOKMARKLET = {
      HEADER: 'javascript:(async function(){',
      FOOTER: '})()',
    };

    static toSource(bookmarklet) {
      return decodeURI(bookmarklet).replace(this.#BOOKMARKLET.HEADER, '').replace(this.#BOOKMARKLET.FOOTER, '');
    }
    static toBookmarklet(sourceCode) {
      const reStripComments = /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm;
      const code = `${this.#BOOKMARKLET.HEADER}${sourceCode.replace(reStripComments, '$1')}${this.#BOOKMARKLET.FOOTER}`;
      return encodeURI(code);
    }
  }

  class BookmarkletUrlHash {
    /** Prefix used in URL hash. Example: https://chimurai.github.io/bookmarklet/#/data=... */
    static #LOCATION_HASH_PREFIX = '/data=';

    static hasUrlHashBookmarklet() {
      return document.location.hash.includes(this.#LOCATION_HASH_PREFIX);
    }

    static fromUrlHash() {
      const hash = document.location.hash;
      const base64 = hash.replace(`#${this.#LOCATION_HASH_PREFIX}`, '');
      const data = this.decodeBase64(base64);
      return data;
    }

    /**
     * @param {BookmarkletData} data
     */
    static toUrlHash(data) {
      const base64 = this.encodeBase64(data);
      document.location.hash = `${this.#LOCATION_HASH_PREFIX}${base64}`;
    }

    /**
     * @param {BookmarkletData} data
     * @return {string} base64 encoded string
     */
    static encodeBase64(data) {
      const str = JSON.stringify(data);

      // fix: InvalidCharacterError: Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range
      // when emoji's are used for example.
      const encoder = new TextEncoder();
      const bytes = encoder.encode(str); // UTF-8 bytes
      const binaryStr = String.fromCharCode(...bytes);

      return btoa(binaryStr);
    }

    /**
     * @param {string} b64 base64 encoded string
     * @return {BookmarkletData} decoded data
     */
    static decodeBase64(b64) {
      const binaryStr = atob(b64);
      const bytes = Uint8Array.from(binaryStr, (c) => c.charCodeAt(0));
      const string = new TextDecoder().decode(bytes);

      return JSON.parse(string);
    }
  }

  init();

  function init() {
    const editorFactory = new EditorFactory();
    const codeMirrorSource = editorFactory.createEditor('source');
    const codeMirrorOutput = editorFactory.createReadOnlyEditor('output-code');

    codeMirrorSource.on('drop', (instance, e) => {
      setTimeout(function () {
        const bookmarklet = instance.getSelection();
        const decoded = Bookmarklet.toSource(bookmarklet);
        instance.setValue(decoded);
      });
    });

    codeMirrorSource.on('change', persistCodeMirrorOnChange); // persist to sessionStorage
    codeMirrorSource.on('change', updateTryItButton); // update try it button

    if (BookmarkletUrlHash.hasUrlHashBookmarklet()) {
      // try to parse shared bookmarklet from url hash
      try {
        const { name, code } = BookmarkletUrlHash.fromUrlHash();
        setBookMarklet({ name, code });
        setTimeout(() => document.getElementById('create').click());
      } catch (err) {
        // ignore errors
      } finally {
        document.location.hash = '';
      }
    } else {
      loadPersistedBookMarklet();
    }

    const dialog = document.querySelector('dialog');
    dialog.querySelector('.close').addEventListener('click', () => dialog.close());
    document.getElementById('create').addEventListener('click', (e) => createBookmarklet(e, codeMirrorSource, codeMirrorOutput, dialog));
    document.getElementById('share').addEventListener('click', (e) => shareBookmarklet(e, codeMirrorSource, codeMirrorOutput));
  }

  function createBookmarklet(e, codeMirrorSource, codeMirrorOutput, dialog) {
    e.preventDefault();

    const bookmarkletEncoded = Bookmarklet.toBookmarklet(codeMirrorSource.getValue());

    dialog.showModal();

    codeMirrorOutput.setValue(bookmarkletEncoded);
    document.getElementById('output-link').href = bookmarkletEncoded;
    document.querySelector('.bookmarklet-name').innerHTML = document.getElementById('name').value;
  }

  async function shareBookmarklet(e, codeMirrorSource, codeMirrorOutput, dialog) {
    e.preventDefault();
    /** @type {BookmarkletData} */
    const data = {
      name: document.getElementById('name').value,
      code: codeMirrorSource.getValue(),
    };

    BookmarkletUrlHash.toUrlHash(data);

    await navigator.clipboard.writeText(document.location);
    alert('URL copied to clipboard');
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
    const bookMarkletUri = Bookmarklet.toBookmarklet(instance.getValue());
    document.getElementById('try-it').onclick = () => (window.location.href = bookMarkletUri);
  }

  /**
   * Load the bookmarklet from sessionStorage
   */
  function loadPersistedBookMarklet() {
    /** @type {BookmarkletData} */
    const persistedBookmarklet = {
      name: window.sessionStorage.getItem('bookmarklet-name'),
      code: window.sessionStorage.getItem('bookmarklet-code'),
    };
    if (persistedBookmarklet.name && persistedBookmarklet.code) {
      setBookMarklet(persistedBookmarklet);
    } else {
      setBookMarklet({
        name: 'My Bookmarklet',
        code: `alert('Hello world'); // your bookmarklet code

// drop and drop existing bookmarklet to edit`,
      });
    }
  }

  /**
   * @returns {BookmarkletData}
   */
  function getBookMarklet() {
    return {
      name: document.getElementById('name').value,
      code: document.querySelector('.CodeMirror').CodeMirror.getValue(),
    };
  }

  /**
   * @param {BookmarkletData} data
   */
  function setBookMarklet({ name, code }) {
    document.getElementById('name').value = name;
    document.querySelector('.CodeMirror').CodeMirror.setValue(code);
  }
})();
