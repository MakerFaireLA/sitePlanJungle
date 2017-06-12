// ===============================================
// Functions related to the manipulation of tiles

// ===============================================
// Inserts HTML for rendering a tile 
//   To be called everytime a tile is added, moved, or otherwise modified.
//   @TODO - Understand why this works for rerendering an already added tile.
function renderTile(tile) {
    const html = `<div id="id-${tile.tile_id}" class="tile" style="left: ${Math.round(tile.x/scale_factor)}px; 
        top: ${Math.round(tile.y/scale_factor)}px; transform: rotateZ(${tile.theta}deg);">${tile.userRef}<br>${tile.userLabel}</div>`;
    $('.container').append(html);

    $('#id-' + tile.tile_id).mousedown(function(event) {
        grab_deltax = event.pageX - parseInt($(event.target).css('left'), 10);
        grab_deltay = event.pageY - parseInt($(event.target).css('top'), 10);
        $(event.target).addClass('moveTile');
    });
}

// ===============================================
// Modifies the tile's HTML thus changing it's location
//   Effectively moves a tile
//   Since the location is stored in the style tag, we mod its CSS
// function moveTile(newdata) {
//     $('#id-' + newdata.tile_id).css('left', newdata.x).css('top', newdata.y);
// }

// ===============================================
// Given a 'event' associated with a tile, return a tile struct containing the 
//   tile's data: e.g. tile_id, location, angle, etc.
function retrieveTileDataFromHTML(event) {
    var tile = {};
    tile.tile_id = parseInt(event.target.id.replace(/[^\d]/g, ''), 10);
    tile.x = parseInt($('#' + event.target.id).css('left'), 10);
    tile.y = parseInt($('#' + event.target.id).css('top'), 10);
    tile.theta = parseInt($('#' + event.target.id)[0].style.transform.replace(/[^\d]/g, ''), 10);
    return tile;
}

// ===============================================
// Our tiles array may have holes (the sites of previous deletions), in which case tiles.length will be inaccurate.  
// This function will return the correct result despite holes.
function countElements(array) {
    var elemCount = 0;
    array.forEach(function() {
        elemCount++;
    });
    return elemCount;
}
