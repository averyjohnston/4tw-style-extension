// TODO: import/export of all themes as JSON or whatever
// needed for moving between computers, among other things
// also export everything before packing extension, just in case storage changes

let previousCSS = '';
let themes = {};

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

  if (fontFamily !== '' && fontURL === '') {
    newCSS = `
      @font-face {
        font-family: ${fontFamily};
        font-style: normal;
        font-weight: normal;
        src: local(${fontFamily});
      }
    ` + newCSS;
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
    newCSS += `.mediumEditorSpace p { font-size: ${fontSize} !important; }`;
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
    newCSS += `
      #editorContent p span, #editorContent p font, #editorContent p b {
        background-color: transparent !important;
      }
    `;
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

// create and save a new theme, and wipe all fields
function createNewTheme() {
  const themeName = window.prompt('A new blank theme will be created. Any previous field values will be erased. Enter theme name:');
  if (!themeName || themeName === '') return;

  // save theme to local data as well as storage
  themes[themeName] = {};
  chrome.storage.local.set({ ['theme-' + themeName]: '{}' });

  // add an entry to the dropdown and select it
  const themeSelect = document.querySelector('.theme-select');
  themeSelect.insertAdjacentHTML('beforeend', `<option value="${themeName}">${themeName}</option>`);
  themeSelect.value = themeName;

  // wipe all form fields
  document.querySelectorAll('form input').forEach(field => field.value = '');
}

// apply selected theme to form and submit it
function loadTheme() {
  const themeName = document.querySelector('.theme-select').value;
  if (themeName === 'Select a theme...') return; // bail if default option is selected

  const formData = themes[themeName];
  applyObjectToForm(formData);

  document.querySelector('.submit-button').click();
}

// overwrite the currently selected theme with current form values
function overwriteTheme() {
  const themeName = document.querySelector('.theme-select').value;
  if (themeName === 'Select a theme...') return; // bail if default option is selected

  const response = window.confirm('Are you sure you want to overwrite this theme with the current form values? This cannot be undone.');
  if (!response) return;

  const formData = convertFormToObject();
  themes[themeName] = formData;
  chrome.storage.local.set({ ['theme-' + themeName]: JSON.stringify(formData) });
}

function renameTheme() {
  const themeSelect = document.querySelector('.theme-select');
  const oldThemeName = themeSelect.value;
  if (oldThemeName === 'Select a theme...') return; // bail if default option is selected

  const newThemeName = window.prompt('Enter new name for this theme:');
  if (!newThemeName) return;

  // update dropdown option
  const themeOption = themeSelect.querySelector(`option[value='${oldThemeName}']`);
  themeOption.value = newThemeName;
  themeOption.innerText = newThemeName;

  // update local data
  themes[newThemeName] = { ...themes[oldThemeName] };
  delete themes[oldThemeName];

  // update storage
  chrome.storage.local.set({ ['theme-' + newThemeName]: JSON.stringify(themes[newThemeName]) });
  chrome.storage.local.remove('theme-' + oldThemeName);
}

function deleteTheme() {
  const themeSelect = document.querySelector('.theme-select');
  const themeName = themeSelect.value;
  if (themeName === 'Select a theme...') return; // bail if default option is selected

  const response = window.confirm('Are you sure you want to delete this theme? This cannot be undone.');
  if (!response) return;

  // remove dropdown option
  const themeOption = themeSelect.querySelector(`option[value='${themeName}']`);
  themeOption.remove();

  // if that was the last option, select the default option instead of leaving the dropdown empty
  if (themeSelect.querySelectorAll('option').length === 1) {
    themeSelect.value = 'Select a theme...';
  }

  // remove from local data and storage
  delete themes[themeName];
  chrome.storage.local.remove('theme-' + themeName);
}

// create and save txt file with themes exported as JSON
function exportThemes() {
  const a = document.createElement('a');
  a.style = 'display: none';
  document.body.appendChild(a);
  const text = JSON.stringify(themes);
  const blob = new Blob([text], { type: 'octet/stream' });
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = '4tw-style-themes-export.txt';
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}

// import themes as JSON
// doesn't look like Chrome extensions have an API for loading files, so this'll have to do
function importThemes() {
  const text = window.prompt('This will replace ALL stored themes. WARNING: This cannot be undone! Proceed carefully!\n\nPaste the contents of the export file here:');
  if (!text) return;

  // note: this needs a lot more error checking/idiot-proofing before this extension should be shared publicly
  const loadedThemes = JSON.parse(text);

  // erase existing themes in storage
  Object.keys(themes).forEach(themeName => {
    chrome.storage.local.remove('theme-' + themeName);
  });

  // set new ones in storage
  Object.keys(loadedThemes).forEach(loadedThemeName => {
    chrome.storage.local.set({ ['theme-' + loadedThemeName]: JSON.stringify(loadedThemes[loadedThemeName]) });
  });

  // replace local themes wholesale
  themes = {...loadedThemes};

  // erase existing themes in dropdown
  const themeSelect = document.querySelector('.theme-select');
  themeSelect.innerHTML = '';

  // add loaded themes to dropdown
  Object.keys(loadedThemes).forEach(key => {
    themeSelect.insertAdjacentHTML('beforeend', `
      <option value="${key}">${key}</option>
    `);
  });
}

// load all storage at once, then do anything that needs it
chrome.storage.local.get(null, (storage) => {
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
  document.querySelector('#theme-save').addEventListener('click', overwriteTheme);
  document.querySelector('#theme-rename').addEventListener('click', renameTheme);
  document.querySelector('#theme-delete').addEventListener('click', deleteTheme);
  document.querySelector('form').addEventListener('submit', handleSubmit);
  document.querySelectorAll('form input').forEach(input => input.addEventListener('change', (e) => saveInputState(e.target)));
  document.querySelector('#exportThemes').addEventListener('click', exportThemes);
  document.querySelector('#importThemes').addEventListener('click', importThemes);
});
