function loadBookMarkletExample(name) {
  const example = BOOKMARKLET_EXAMPLES.get(name);

  if (example) {
    setBookMarklet(example);
  }
}

/** @type Map<string, {name: string, code: string}> */
const BOOKMARKLET_EXAMPLES = new Map();

/**
 * https://css-tricks.com/web-development-bookmarklets/#activating-design-mode
 */
BOOKMARKLET_EXAMPLES.set('design-mode', {
  name: 'designMode',
  code: `document.designMode = document.designMode !== "on" ? "on" : "off"`,
});

/**
 * https://css-tricks.com/web-development-bookmarklets/#applying-a-background-to-everything
 */
BOOKMARKLET_EXAMPLES.set('* background', {
  name: '* background',
  code: `document.querySelectorAll('*').forEach(el => el.style.backgroundColor='rgba(0, 0, 0, .1)')`,
});

/**
 * https://css-tricks.com/web-development-bookmarklets/#color-widget-bookmark
 */
BOOKMARKLET_EXAMPLES.set('color-picker', {
  name: 'color picker',
  code: `let input = document.createElement("input");
input.setAttribute("type","color");
input.addEventListener("input", (e) => { navigator.clipboard.writeText(e.target.value) });
input.addEventListener("change", (e) => { input.remove() });
document.head.append(input);
input.click();`,
});


BOOKMARKLET_EXAMPLES.set('wayback-machine', {
  name: 'Wayback Machine',
  code: `window.open('https://web.archive.org/web/*/' + window.location.href)`,
});

BOOKMARKLET_EXAMPLES.set('jQuery', {
  name: 'jQuery',
  code: `async function injectScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.onload = resolve;
    script.onerror = reject;
    script.src = url;
    document.head.appendChild(script);
  })
}

await injectScript('https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js')

const jQuery = $.noConflict(true);

jQuery(document).ready(($) => {
  alert('jquery loaded: ' + $.prototype.jquery)
})`,
});

/**
 * https://kickassapp.com
 */
BOOKMARKLET_EXAMPLES.set('Kick Ass', {
  name: '🚀 Kick Ass',
  code: `async function injectScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.onload = resolve;
    script.onerror = reject;
    script.src = url;
    document.head.appendChild(script);
  })
}

injectScript('https://hi.kickassapp.com/kickass.js');`
});