// ===============================================
// Functions related to the manipulation of tiles

// ===============================================
// Inserts HTML for rendering a tile 
//   To be called everytime a tile is added, moved, or otherwise modified.
function renderTile(tile) {
    const html = `<div id="id-${tile.tile_id}" class="tile" style="left: ${Math.round(tile.x/scale_factor)}px; 
        top: ${Math.round(tile.y/scale_factor)}px; transform: rotateZ(${tile.theta}deg); 
        height: ${Math.round(tile.dimy/scale_factor)}px; width: ${Math.round(tile.dimx/scale_factor)}px;
        background: ${tile.color};">${tile.userRef}<br>${tile.userLabel}</div>`;
    $('.container').append(html);

    $('#id-' + tile.tile_id).mousedown(function(event) {
        lastClickedId = parseInt(event.target.id.replace(/[^\d]/g, ''), 10);
        console.log("lastClickedId updated to " + lastClickedId);
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
// Takes instructions in the form of a short string, i.e. 'up', 'down', 'left', 
// 'right' (typically corresponding to the arrow keys), along with a tile_id 
// to act upon, and nudges the tile one pixel in the direction indicated.
//
// Returns the updated short tile struct.
function nudgeTile(tile_id, direction) {
    // first get tile's current location
    var tile = retrieveTileLocationFromHTML(tile_id);

    // now nudge it
    switch(direction) {
        case 'up':
            $('#id-' + tile_id).css('top', tile.screen.y-1);
            tile.screen.y -= 1;
            break;
        case 'down':
            $('#id-' + tile_id).css('top', tile.screen.y+1);
            tile.screen.y += 1;
            break;
        case 'left':
            $('#id-' + tile_id).css('left', tile.screen.x-1);
            tile.screen.x -= 1;
            break;
        case 'right':
            $('#id-' + tile_id).css('left', tile.screen.x+1);
            tile.screen.x += 1;
            break;
        default:
            console.log("Illegal nudge operation selected.");
    };
    return tile;
}

// ===============================================
// Given a 'event' associated with a tile, return a tile struct containing limited 
//   tile data, i.e. only the tile_id and the new location.
function retrieveTileLocationViaEvent(event) {
    var tile = {};
    tile.tile_id = parseInt(event.target.id.replace(/[^\d]/g, ''), 10);
    tile.screen = {};
    tile.screen.x = parseInt($('#' + event.target.id).css('left'), 10);
    tile.screen.y = parseInt($('#' + event.target.id).css('top'), 10);
    // Do not pull any data from the div that wasn't changed by the event!  Thus no angles, 
    // and nothing else either.  The following line was used to extract the angle.  We may 
    // add angle adjustment to the GUI, in which case we may need this line again (and it was
    // non-trivial to figure out.)
    // tile.theta = parseInt($('#' + event.target.id)[0].style.transform.replace(/[^\d]/g, ''), 10);
    return tile;
}

// ===============================================
// Given a tile_id, return a tile struct containing limited tile data, i.e. only the tile_id
// and the new location.
function retrieveTileLocationFromHTML(tile_id) {
    var tile = {'tile_id':tile_id};
    tile.screen = {};
    tile.screen.x = parseInt($('#id-' + tile_id).css('left'), 10);
    tile.screen.y = parseInt($('#id-' + tile_id).css('top'), 10);
    return tile;
}
