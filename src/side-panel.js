// TODO: keep track of all values and restore them if panel is closed/opened

// TODO: theme creation/saving
// have a dropdown of all saved themes, with buttons to load, delete, or overwrite with current form data
// save them as a list of values for all form fields

// TODO: import/export of all themes as JSON or whatever
// needed for moving between computers, among other things

let previousCSS = '';

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
}

document.querySelector('form').addEventListener('submit', handleSubmit);
