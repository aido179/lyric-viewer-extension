
/*
background.js
This file runs as long as the extension is loaded.
Use this for background tasks like keyboard shortcut commands.
*/

var contextClick = function(){
  // Get currently active tab
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    // Send message to contentscript
    if (tabs[0] == undefined) return
    chrome.tabs.sendMessage(tabs[0].id, {messageType: "selectLyricFromContext"});
  });
}

// Set up context menu item.
chrome.contextMenus.create({
  "id":"lyricsViewerContext",
  "title": "View in LyricViewer",
  "contexts":["all"]
});
chrome.contextMenus.onClicked.addListener(contextClick)
