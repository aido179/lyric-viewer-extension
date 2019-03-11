var selectionTarget = false
var selectionRange = 0
var fontSize = 1 // unused - might be useful if loading from settings?
var numCols = 2 // unused
var page = 0

// Listen for events
// ie. When the user clicks the "doAction" button in the extension popup.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Multiple messages might be passed, so we look for one with the
  // specified request.messageType
  if (request.messageType == "popup_doAction"){
    // Add the viewer box
    // The cover div is necessary to prevent the injected content from screwing with selection
    // Without the cover, the users click could be captured by injected html elements.
    var box = $(`
      <div id="lyric_viewer_extension_content_container">
        <div id="lyric_viewer_extension_content" class="lyric_viewer_extension_no_select">
          <div id="lyric_viewer_extension_instructions">
            <h1>How to:</h1>
            <ol>
              <li>Click anywhere to start</li>
              <li>Click on the lyrics you want to view</li>
              <li>Look at the preview window (top left) to see the selected lyrics</li>
              <li>Move the "Page Content" slider to ensure all lyics are captured</li>
              <li>Click on the preview window to start</li>
            </ol>
            <h2>Controls:</h2>
            <ul>
              <li><b>"Page Content"</b> - grabs more or less of the source web page. Use it to filter out unwanted content, or to get missing lyrics.</li>
              <li><b>"Font Size"</b> - change the font size of selected lyrics.</li>
              <li><b>"# columns"</b> - change the number of displayed columns.</li>
              <li><b>"<" and ">"</b> - Scroll selected lyrics.</li>
              <li><b>"Spacebar" and "right arrow"</b> - scrolls forward.</li>
              <li><b>"backspace" and "left arrow"</b> - scrolls backward.</li>
            <ul>
          </div>
        </div>
        <div id="lyric_viewer_extension_content_cover" class="lyric_viewer_extension_no_select"/>
      </div>
    `).appendTo('body');
    // scale the box when it is clicked.
    box.on('click', function(event){
      event.stopPropagation();
      box.toggleClass('lyric_viewer_extension_content_scaled')
    });
    // add the selection controls box
    var controls = $('<div class="lyric_viewer_extension_no_select"/>').appendTo('body');
    controls.html(`
      <div id="lyric_viewer_extension_selection_controls" class="lyric_viewer_extension_no_select">
        <label for="selectionrange" class="lyric_viewer_extension_no_select">Page Content</label>
        <input type="range"
        id="lyric_viewer_extension_selection_range"
        name="selectionrange"
        min="0"
        max="10"
        value="0"
        class="lyric_viewer_extension_no_select">
        <br>
        <label for="fontrange" class="lyric_viewer_extension_no_select">Font Size</label>
        <input type="range"
        id="lyric_viewer_extension_font_size"
        name="fontrange"
        min="0"
        max="40"
        value="10"
        class="lyric_viewer_extension_no_select">
        <br>
        <label for="fontrange" class="lyric_viewer_extension_no_select"># columns</label>
        <input type="range"
        id="lyric_viewer_extension_num_cols"
        name="colsrange"
        min="1"
        max="10"
        value="2"
        class="lyric_viewer_extension_no_select">
        <br>
        <button id="lyric_viewer_extension_page_back" class="lyric_viewer_extension_no_select"> < </button>
        <button id="lyric_viewer_extension_page_forward" class="lyric_viewer_extension_no_select"> > </button>
      </div>
    `)
    // Add listeners
    $("#lyric_viewer_extension_selection_range").on('input', function(event){
      selectionRange = event.target.value
      updateSelection(false)
    })
    $("#lyric_viewer_extension_font_size").on('input', function(event){
      var newSize = ( event.target.value / 10 ) + "em"
      $("#lyric_viewer_extension_content_container").css('fontSize', newSize)
    })
    $("#lyric_viewer_extension_num_cols").on('input', function(event){
      var newVal = "auto " + event.target.value
      $("#lyric_viewer_extension_content").css('columns', newVal)
    })
    $("#lyric_viewer_extension_page_back").on('click', function(event){
      updatePage(-1)
    })
    $("#lyric_viewer_extension_page_forward").on('click', function(event){
      updatePage(1)
    })

  }
});

$(document).ready(function(){
  // watch text selection to populate lyrics
  $(":not(#lyric_viewer_extension_content)").on('mouseup', function(event){
    event.stopPropagation()
    // Don't do anything if the extension isn't active.
    if ($("#lyric_viewer_extension_content_container").length === 0) return
    // Don't update the selected text when the viewer is clicked.
    if( event.target.id === "lyric_viewer_extension_content") return
    if( $(event.target).hasClass('lyric_viewer_extension_no_select') ) return
    updateSelection(event.target)
  });
});

// watch keystrokes for key based scrolling
$(document).keydown(function(e){
  if ($("#lyric_viewer_extension_content_container").length === 0) return
  if ($("#lyric_viewer_extension_content_container").hasClass("lyric_viewer_extension_content_scaled") ) return
  var forwardKeys = [32, 39] // space and right arrow
  if(forwardKeys.indexOf(e.keyCode) !== -1) {
     e.preventDefault();
     updatePage(1)
     return
  }
  var backKeys = [37, 8] // left arrow and backspace
  if(backKeys.indexOf(e.keyCode) !== -1) {
     e.preventDefault();
     updatePage(-1)
     return
  }
});

function updateSelection(targetInput){
  // Allow an optional targetInput argument to update the currently selected target.
  // otherwise, use the existing one.
  if (targetInput === false || targetInput === undefined){
    target = selectionTarget
  } else {
    selectionTarget = targetInput
    target = targetInput
  }
  // Get content based on the selectionRange
  var content = {}
  if (selectionRange === 0) {
    content = $(target).clone()
  } else {
    content = $(target).parents().eq(selectionRange).clone()
  }
  // Remove extra styles
  removeInlineStylesFromAllDescendants(content)
  // Update the content
  $('#lyric_viewer_extension_content').empty().append(content)
}

function removeInlineStylesFromAllDescendants(element){
  $(element).find('[style]').each(function( index ) {
    $( this ).removeAttr('style');
  });
}

function updatePage(pageInc) {
  if(pageInc < 0){
    // -1 = we are going back
    if (page > 0) page = page-1
  } else {
    // 1 = we are going forward
    var contentWidth = $("#lyric_viewer_extension_content").width()
    var containerWidth = $("#lyric_viewer_extension_content_container").width()
    maxPage = (contentWidth/containerWidth) + 1
    if (page < maxPage) page = page+1
  }
  var newVal = ( page * $("#lyric_viewer_extension_content_container").width() )
  $("#lyric_viewer_extension_content").animate({scrollLeft: newVal}, 350)
}
