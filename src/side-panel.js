let previousCSS = '';

async function handleSubmit(e) {
  e.preventDefault();
  const data = new FormData(e.target);
  const { fontFamily } = Object.fromEntries(data.entries());

  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const newCSS = `
.mediumEditorSpace p {
  ${fontFamily !== '' && `font-family: ${fontFamily} !important;`}
}
`;

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
