async function handleSubmit(e) {
  e.preventDefault();
  const data = new FormData(e.target);
  const entries = Object.fromEntries(data.entries());

  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  chrome.scripting.insertCSS({
    css: `
.mediumEditorSpace p {
  font-family: ${entries.fontFamily} !important;
}
`,
    target: { tabId: tab.id },
  });
}

document.querySelector('form').addEventListener('submit', handleSubmit);
