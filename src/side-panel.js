async function handleClick() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  chrome.scripting.insertCSS({
    css: `
.mediumEditorSpace p {
  font-family: 'Comic Sans MS' !important;
}
`,
    target: { tabId: tab.id },
  });
}

document.querySelector('button').addEventListener('click', handleClick);
