// TODO: import/export of all themes as JSON or whatever
// needed for moving between computers, among other things

let previousCSS = '';
const themes = {};

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

// helper func that returns an object containing key/value pairs for any form fields with a value
function convertFormToObject() {
  const form = document.querySelector('form');
  const data = new FormData(form);
  const entries = Object.fromEntries(data.entries());
  const entriesWithValue = Object.keys(entries).filter(key => entries[key] !== '')
    .reduce((result, key) => (result[key] = entries[key].toString(), result), {});

  return entriesWithValue;
}

// helper func that takes key/value pairs of form values and applies them to the form
// also wipes fields that aren't in the given data
function applyObjectToForm(formData) {
  document.querySelectorAll('form input').forEach(formField => {
    const fieldName = formField.name;
    if (formData[fieldName]) {
      formField.value = formData[fieldName];
    } else {
      formField.value = '';
    }

    saveInputState(formField);
  });
}

// create and save a new theme using current form values
function createNewTheme() {
  const themeName = window.prompt('A new theme will be created using the current form values. Enter theme name:');
  if (!themeName || themeName === '') return;

  // save theme to local data as well as storage
  const formData = JSON.stringify(convertFormToObject());
  themes[themeName] = formData;
  chrome.storage.local.set({ ['theme-' + themeName]: formData });

  // add an entry to the dropdown and select it
  const themeSelect = document.querySelector('.theme-select');
  themeSelect.insertAdjacentHTML('beforeend', `<option value="${themeName}">${themeName}</option>`);
  themeSelect.value = themeName;
}

// load all storage at once, then do anything that needs it
chrome.storage.local.get(null, (storage) => {
  // apply selected theme to form and submit it
  function loadTheme() {
    const themeName = document.querySelector('.theme-select').value;
    if (themeName === 'Select a theme...') return; // bail if default option is selected

    const response = window.confirm('Are you sure you want to load this theme? Any previous field values will be erased.');
    if(!response) return;

    const formData = storage['theme-' + themeName];
    applyObjectToForm(JSON.parse(formData));

    document.querySelector('.submit-button').click();
  }

  // restore input values from the last time the panel was opened
  document.querySelectorAll('form input').forEach(input => {
    const key = 'latest-' + input.name;
    if (storage[key]) input.value = storage[key];
  });

  // restore previous CSS in case panel was closed and reopened without refreshing page
  if (storage.previousCSS) previousCSS = storage.previousCSS;

  // load saved themes
  const themeKeys = Object.keys(storage).filter(key => key.indexOf('theme-') === 0);
  themeKeys.forEach(key => {
    themes[key.replace('theme-', '')] = JSON.parse(storage[key]);
  });

  // if no themes are present, start with a default one
  if (Object.keys(themes).length === 0) {
    themes['No theme'] = {};
    chrome.storage.local.set({ 'theme-No theme': '{}' });
  }

  // add themes to dropdown
  const themeSelect = document.querySelector('.theme-select');
  Object.keys(themes).forEach(key => {
    themeSelect.insertAdjacentHTML('beforeend', `
      <option value="${key}">${key}</option>
    `);
  });

  // set up behavior
  document.querySelector('#theme-new').addEventListener('click', createNewTheme);
  document.querySelector('#theme-load').addEventListener('click', loadTheme);
  document.querySelector('form').addEventListener('submit', handleSubmit);
  document.querySelectorAll('form input').forEach(input => input.addEventListener('change', (e) => saveInputState(e.target)));
});
