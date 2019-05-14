/*
Popup.js
This file is run when the popup.html file is rendered.
ie. When the user clicks on the extension icon.
*/

// DEFAULT VALUES
// The pointer array should allow us to store a dynamic list of favourites
// without running into per-item storage limitations.
var favouritesPointerArray = []
var favourites = {}

$(document).ready(function(){
  $('#action').on('click',function(){
    pushFavourites("test", "test", "test")
  });
  loadFavourites()
});

// Load favourites
// The storage.sync API has limitations on overall storage
// and also on the per item storage. If we used a single array of objects, the
// per item storage could be reached easily.
async function loadFavourites() {
  await chrome.storage.sync.get(null, function(items) {
    // Early return if no data found.
    if (items.favouritesPointerArray === undefined){
      $('#favs-list').empty()
      $('#favs-list').append(`<li>No Favourites Found.</li>`)
      return true
    }
    // Update values and populate the list
    favouritesPointerArray = items.favouritesPointerArray
    favourites = items
    $('#favs-list').empty()
    favouritesPointerArray.forEach((ptr)=>{
      $('#favs-list').append(`<li>${favourites[ptr].title}</li>`)
    })
  });
  return true
}
// Push a url to the stored favourites
// If the url is already stored,
// increment the "hits" (#times it has been viewed)
async function pushFavourites(title, url, dom) {
  // may need to normalise the url...

  // loop through favourites looking for the given title
  var found = false
  var foundKey = -1
  for (let ptr of favouritesPointerArray){
    if (favourites[ptr].title === title){
      found = true
      foundKey = ptr
      break;
    }
  }
  // if it's found, increase the hits and save.
  if (found) {
    favourites[foundKey].hits += 1
    var setObj = favourites
    setObj[foundKey] = favourites[foundKey]
    chrome.storage.sync.set(setObj, function(result) {
      // Load fresh favourites
      loadFavourites()
    });
  } else {
    // if not found, add new fav.
    let newInd = "f" + (favouritesPointerArray.length + 1)
    favouritesPointerArray.push(newInd)
    var setObj = favourites
    setObj['favouritesPointerArray'] = favouritesPointerArray
    setObj[newInd] = {
      "title": title,
      "url": url,
      "hits": 0,
      "viewerDOM": dom
    }
    chrome.storage.sync.set(setObj, function(result) {
      // Load fresh favourites
      loadFavourites()
    });
  }
}
