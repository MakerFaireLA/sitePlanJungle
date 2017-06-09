// ===============================================
// Functions related to the manipulation of tiles

// ===============================================
// Inserts HTML for rendering a tile 
//   To be called everytime a tile is added, moved, or otherwise modified.
//   @TODO - Understand why this works for rerendering an already added tile.
function renderTile(tile) {
    const html = `<div id="id-${tile.tile_id}" class="tile" style="left: ${Math.round(tile.x/scale_factor)}px; top: ${Math.round(tile.y/scale_factor)}px; transform: rotateZ(${tile.theta}deg);"> </div>`;
    $('.container').append(html);

    $('#id-' + tile.tile_id).mousedown(function(event) {
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

// // ===============================================
// // Callbacks for dragging tiles
// function ongoingDrag(dx, dy) {
//     this.attr({ x: Math.round(this.ox + dx*scale_factor), y: Math.round(this.oy + dy*scale_factor) });
// }

// function onStartDrag() {
//     this.ox = this.attr("x");
//     this.oy = this.attr("y");
// }

// function onEndDrag() {
//     // report new final position and angle to server
//     var tileTheta = this._.transform[0][1];
//     // console.log("dragged tile angle is " + tileTheta);
//     updateTilePosition(focusedTiles.selectedTile, this.attr("x"), this.attr("y"), tileTheta);
// }

// ===============================================
// Create new tile with max+1 tile_id, render it on map, and report it to the server 
//   for insertion in the database.
function createDefaultTile(paper, tiles) {
    
    var data = {
        op: 'c',
        tile_id: Math.max(...tiles.keys())+1,
        x: 250*scale_factor,
        y: 250*scale_factor,
        theta: 0 // default tile initial theta
    };
    // @TODO - allow user to select location where new tile will appear.

    tiles[data.tile_id] = paper.rect(data.x, data.y, 80*scale_factor, 50*scale_factor).rotate(data.theta).attr(
        {fill: '#000', 'fill-opacity': 0.5, stroke: 'none'});

    socket.emit('broadcast', data);
    // @TODO - prevent full rendering until confirmation of insertion in the database has been reported back.
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
