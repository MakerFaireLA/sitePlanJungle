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

    if(tile.tile_id > max_tile_id) {
        max_tile_id = tile.tile_id;
    }

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
    switch(direction) {
        case 'up':
            tile = retrieveTileLocationFromHTML(tile_id);
            $('#id-' + tile_id).css('top', tile.screen.y-1);
            tile.screen.y -= 1;
            break;
        case 'down':
            tile = retrieveTileLocationFromHTML(tile_id);
            $('#id-' + tile_id).css('top', tile.screen.y+1);
            tile.screen.y += 1;
            break;
        case 'left':
            tile = retrieveTileLocationFromHTML(tile_id);
            $('#id-' + tile_id).css('left', tile.screen.x-1);
            tile.screen.x -= 1;
            break;
        case 'right':
            tile = retrieveTileLocationFromHTML(tile_id);
            $('#id-' + tile_id).css('left', tile.screen.x+1);
            tile.screen.x += 1;
            break;
        case 'ccw':
            tile = retrieveTileAngleFromHTML(tile_id);
            $('#id-' + tile_id).css('transform', `rotateZ(${tile.theta-1}deg)`);
            break;
        case 'cw':
            tile = retrieveTileAngleFromHTML(tile_id);
            $('#id-' + tile_id).css('transform', `rotateZ(${tile.theta+1}deg)`);
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

// ===============================================
// Given a tile_id, return a tile struct containing limited tile data, i.e. only the tile_id
// and the new angle.
function retrieveTileAngleFromHTML(tile_id) {
    var tile = {'tile_id':tile_id};
    tile.theta = parseInt($('#id-' + tile_id)[0].style.transform.replace(/[^\d]/g, ''), 10);
    return tile;
}

// ===============================================
// Delete a tile from the GUI given its tile_id.  Returns a limited tile struct.
function deleteTileHTML(tile_id) {
    $('#id-' + tile_id).remove();
    if(tile_id === max_tile_id) {
        max_tile_id--;
        // There's no guarantee that simply decrementing max_tile_id is correct.  OTOH,
        //   we only need to maintain rough bounds here.
        // @TODO - fix this once I've implemented a front-end array of current tile_id's
        //   or a scan of div's.
    }
    var tile = {'tile_id':tile_id};
    return tile;
}

// ===============================================
// Takes a userRef string, splits it on the separation character, checks if the head 
// matches the prefix and if so returns the value extracted from the tail, otherwise 
// it returns 'undefined'. The separation character is taken to be the last character 
// in the prefix.
// 
// For example, if the userRef is 'Ex-26' (for the exhibitor 26 tile) and the prefix 
// is 'Ex-', the code will detect a match and return the value 26.
function splitAndCompareUserRef(userRefPrefix, userRef) {
    const separator = userRefPrefix.charAt(-1);

    var sample = userRef.split(separator);
    // @TODO - must check that only 2 pieces came out of the split
    var testPrefix = sample[0] + separator;
    if(testPrefix == userRefPrefix) {
        return parseInt(sample[-1], 10);
    } else {
        return undefined;
    }
}