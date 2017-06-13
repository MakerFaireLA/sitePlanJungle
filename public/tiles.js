// ===============================================
// Functions related to the manipulation of tiles

// ===============================================
// Inserts HTML for rendering a tile 
//   To be called everytime a tile is added, moved, or otherwise modified.
//   @TODO - Understand why this works for rerendering an already added tile.
function renderTile(tile) {
    const html = `<div id="id-${tile.tile_id}" class="tile" style="left: ${Math.round(tile.x/scale_factor)}px; 
        top: ${Math.round(tile.y/scale_factor)}px; transform: rotateZ(${tile.theta}deg); 
        height: ${Math.round(tile.dimy/scale_factor)}px; width: ${Math.round(tile.dimx/scale_factor)}px;
        background: ${tile.color};">${tile.userRef}<br>${tile.userLabel}</div>`;
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
// Given a 'event' associated with a tile, return a tile struct containing limited 
//   tile data, i.e. only the tile_id and the new location.
function retrieveTileLocationFromHTML(event) {
    var tile = {};
    tile.tile_id = parseInt(event.target.id.replace(/[^\d]/g, ''), 10);
    tile.x = parseInt($('#' + event.target.id).css('left'), 10);
    tile.y = parseInt($('#' + event.target.id).css('top'), 10);
    // Do not pull any data from the div that wasn't changed by the event!  Thus no angles, 
    // and nothing else either.  The following line was used to extract the angle.  We may 
    // add angle adjustment to the GUI, in which case we may need this line again (and it was
    // non-trivial to figure out.)
    // tile.theta = parseInt($('#' + event.target.id)[0].style.transform.replace(/[^\d]/g, ''), 10);
    return tile;
}
