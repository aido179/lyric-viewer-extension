/*
Popup.js
This file is run when the popup.html file is rendered.
ie. When the user clicks on the extension icon.
*/

$(document).ready(function(){
  // immediately activate the lyric selection interface
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {messageType: "activateViewerFromPopup"});
    window.close()
  });
});
