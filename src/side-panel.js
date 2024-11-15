// TODO: theme creation/saving
// have a dropdown of all saved themes, with buttons to load, delete, or overwrite with current form data
// save them as a list of values for all form fields
// loading a theme should trigger a save on all form fields, like with the change event

// TODO: import/export of all themes as JSON or whatever
// needed for moving between computers, among other things

let previousCSS = '';

// inject CSS according to form values
async function handleSubmit(e) {
  e.preventDefault();
  const data = new FormData(e.target);
  const {
    textColor, fontFamily, fontURL, fontSize, lineHeight,
    pageBackground, pageWidth, pageMargin, pagePadding, pageBorderRadius,
    pageBorder, pageBorderLeft, pageBorderRight, pageBorderTop, pageBorderBottom,
    editorBackground
  } = Object.fromEntries(data.entries());

  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  let newCSS = ''; // final formatting won't be pretty, but we're prioritizing code readability/extensibility

  // --- font ---

  if (textColor !== '') {
    newCSS += `
      .super-editor-content-wrapper, #editorContent p span, #editorContent p font, #editorContent p b {
        color: ${textColor} !important;
      }
    `;
  }

  if (fontFamily !== '') {
    newCSS += `
      .editor-content-wrapper, .mediumEditorSpace p, #editorContent p span, #editorContent p font, #editorContent p b {
        font-family: ${fontFamily} !important;
      }
    `;
  }

  if (fontURL !== '') {
    // @import statement doesn't work from within insertCSS for some reason, maybe a scoping problem?
    // inject the import directly into the page using a script instead
    chrome.scripting.executeScript({
      func: (fontURL) => {
        const existingStyle = document.head.querySelector('#fourtw-style-extension-font');
        if (existingStyle) existingStyle.remove();

        document.head.insertAdjacentHTML('afterbegin', `
          <style id="fourtw-style-extension-font">
            @import url('${fontURL}');
          </style>
        `);
      },
      args: [fontURL],
      target: { tabId: tab.id },
    });
  }

  if (fontSize !== '') {
    newCSS += `.super-editor-content-wrapper { font-size: ${fontSize}; }`;
  }

  if (lineHeight !== '') {
    newCSS += `#editorContent { line-height: ${lineHeight} !important; }`;
  }

  // --- page ---

  if (pageBackground !== '') {
    newCSS += `#editorContent { background: ${pageBackground}; }`;
  }

  if (pageMargin !== '') {
    newCSS += `#editorContent { margin: ${pageMargin}; }`;
  }

  if (pagePadding !== '') {
    newCSS += `#editorContent { padding: ${pagePadding}; }`;
  }

  if (pageWidth !== '') {
    newCSS += `#editorContent { max-width: ${pageWidth}; }`;
  }

  if (pageBorderRadius !== '') {
    newCSS += `#editorContent { border-radius: ${pageBorderRadius}; }`;
  }

  // --- page border ---

  if (pageBorder !== '') {
    newCSS += `#editorContent { border: ${pageBorder}; }`;
  }

  if (pageBorderLeft !== '') {
    newCSS += `#editorContent { border-left: ${pageBorderLeft}; }`;
  }

  if (pageBorderRight !== '') {
    newCSS += `#editorContent { border-right: ${pageBorderRight}; }`;
  }

  if (pageBorderTop !== '') {
    newCSS += `#editorContent { border-top: ${pageBorderTop}; }`;
  }

  if (pageBorderBottom !== '') {
    newCSS += `#editorContent { border-bottom: ${pageBorderBottom}; }`;
  }

  // --- editor ---

  if (editorBackground !== '') {
    newCSS += `
      .super-editor-content-wrapper {
        background: ${editorBackground};
        background-position: center;
        background-size: cover;
      }
    `;
  }

  // --- combined ---

  if (pageBackground !== '' || editorBackground !== '') {
    newCSS += `#editorContent p span, #editorContent p font { background-color: transparent !important; }`;
  }

  chrome.scripting.removeCSS({
    css: previousCSS,
    target: { tabId: tab.id },
  });

  chrome.scripting.insertCSS({
    css: newCSS,
    target: { tabId: tab.id },
  });

  previousCSS = newCSS;
  chrome.storage.local.set({ previousCSS });
}

// store value of input to persist it between panel openings
function saveInputState(input) {
  const key = 'latest-' + input.name;
  const value = input.value;
  chrome.storage.local.set({ [key]: value });
}

chrome.storage.local.get(null, (storage) => {
  // restore input values from the last time the panel was opened
  document.querySelectorAll('form input').forEach(input => {
    const key = 'latest-' + input.name;
    if (storage[key]) input.value = storage[key];
  });

  // restore previous CSS in case panel was closed and reopened without refreshing page
  if (storage.previousCSS) previousCSS = storage.previousCSS;

  // load saved themes
  const themes = {};
  const themeKeys = Object.keys(storage).filter(key => key.indexOf('theme-') === 0);
  themeKeys.forEach(key => {
    themes[key.replace('theme-', '')] = JSON.parse(storage[key]);
  });

  // if no themes are present, start with a default one
  if (Object.keys(themes).length === 0) {
    themes['No theme'] = {};
  }

  // add themes to dropdown
  const themeSelect = document.querySelector('.theme-select');
  Object.keys(themes).forEach(key => {
    themeSelect.insertAdjacentHTML('beforeend', `
      <option value="${key}">${key}</option>
    `);
  });

  // set up form behavior
  document.querySelector('form').addEventListener('submit', handleSubmit);
  document.querySelectorAll('form input').forEach(input => input.addEventListener('change', (e) => saveInputState(e.target)));
});
