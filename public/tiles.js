// ===============================================
// Functions related to the manipulation of tiles

// ===============================================
// Transfers selection (i.e. the state of being selected) from one tile to another.
//   A selected tile is highlighted with a transparent red border, and becomes draggable.
function transferSelection(targetTile, focusedTiles, tiles) {
    if(targetTile != focusedTiles.selectedTile) {
        // remove highlight on previously selected tile
        tiles[focusedTiles.selectedTile].attr({ stroke: 'none', cursor: 'auto' });
        // set undrag on previously selected tile
        tiles[focusedTiles.selectedTile].undrag();

        // highlight tile with red stroke
        tiles[targetTile].attr({ stroke: '#802', 'stroke-width': 3*scale_factor, 'stroke-opacity': 0.5, cursor: 'move' });
        // make tile draggable
        tiles[targetTile].drag(ongoingDrag, onStartDrag, onEndDrag);

        focusedTiles.selectedTile = targetTile;
    }
}

// ===============================================
// Callbacks for dragging tiles
function ongoingDrag(dx, dy) {
    this.attr({ x: Math.round(this.ox + dx*scale_factor), y: Math.round(this.oy + dy*scale_factor) });
}

function onStartDrag() {
    this.ox = this.attr("x");
    this.oy = this.attr("y");
}

function onEndDrag() {
    // report new final position and angle to server
    var tileTheta = this._.transform[0][1];
    // console.log("dragged tile angle is " + tileTheta);
    updateTilePosition(focusedTiles.selectedTile, this.attr("x"), this.attr("y"), tileTheta);
}

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
    tiles[data.tile_id].node.onclick = function() {
        transferSelection(data.tile_id, focusedTiles, tiles);
    };
    // by default, select new tile
    transferSelection(data.tile_id, focusedTiles, tiles);

    socket.emit('broadcast', data);
    // @TODO - prevent full rendering until confirmation of insertion in the database has been reported back.
}

// ===============================================
// Transfers selection, removes previously selected tile from the tiles array, and reports tile_id 
// to the server for deletion from the database.
function deleteSelectedTile(tiles) {
    // Does a tile to be deleted exist?
    if(countElements(tiles) == 0 || focusedTiles.selectedTile == null) {
        return;
    } else {
        var tbd_id = focusedTiles.selectedTile;  // 'tbd_id' --> 'to be deleted ID'
        console.log("Initiating deletion of tile_id " + tbd_id);

        // Transfer selection to another tile before deleting this one
        if(countElements(tiles) >= 2) {
            var newSelection;
            for(newSelection of tiles) {
                // Check if newSelection is a distinct tile from "tbd" (and not pointed at a hole).
                if(tiles.indexOf(newSelection) != -1 && tiles.indexOf(newSelection) != tbd_id) {
                    break;
                }
            }
            transferSelection(tiles.indexOf(newSelection), focusedTiles, tiles);
        } else {
            // We have no other tile to which to transfer selection. 
            focusedTiles.selectedTile = null;
        }

        tiles[tbd_id][0].remove();
        delete tiles[tbd_id];

        console.log("Sending 'broadcast' => delete tile_id " + tbd_id);

        var data = {
            op: 'd',
            tile_id: tbd_id,
        };

        socket.emit('broadcast', data);
    }
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

