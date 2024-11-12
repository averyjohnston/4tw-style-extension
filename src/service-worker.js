chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(e => console.error(e));

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if(!tab.url) return;
  const url = new URL(tab.url);

  if(url.origin === 'https://app.4thewords.com') {
    chrome.sidePanel.setOptions({
      tabId,
      path: 'src/side-panel.html',
      enabled: true
    });
  } else {
    chrome.sidePanel.setOptions({
      tabId,
      enabled: false
    });
  }
});
