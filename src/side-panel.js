let previousCSS = '';

async function handleSubmit(e) {
  e.preventDefault();
  const data = new FormData(e.target);
  const {
    textColor, fontFamily, fontSize, lineHeight,
    pageBackground, pageWidth, pageMargin, pagePadding, pageBorder, pageBorderRadius,
    editorBackground
  } = Object.fromEntries(data.entries());

  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  let newCSS = ''; // final formatting won't be pretty, but we're prioritizing code readability

  // --- font ---

  if (textColor !== '') {
    newCSS += `
      .super-editor-content-wrapper, #editorContent p span, #editorContent p font {
        color: ${textColor} !important;
      }
    `;
  }

  if (fontFamily !== '') {
    newCSS += `
      .editor-content-wrapper, .mediumEditorSpace p, #editorContent p span, #editorContent p font {
        font-family: ${fontFamily} !important;
      }
    `;
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
