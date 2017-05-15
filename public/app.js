// ===============================================
// Global variables
var socket;
var focusedTiles = {};

// ===============================================
// Main Routine 
window.onload = function() { 
    var paper = new Raphael(document.getElementById('canvas_container'), 500, 500);
    socket = io.connect('/');
    var img = paper.image("http://i.imgur.com/L9uSTVr.png", 0, 0, 3024, 2160);
    var tiles = [];

    // ------------------------------------
    // Load tiles from server
    requestAllTiles();

    // ------------------------------------
    // Render buttons
    var buttons = [];
    // Create new tile button.
    buttons.push(paper.rect(450, 450, 40, 40).attr({fill: '#005'}));
    buttons[0].node.onclick = function() {
        createNewTile(paper, tiles);
    };
    buttons.push(paper.rect(10, 450, 40, 40).attr({fill: '#500'}));
    buttons[1].node.onclick = function() {
        deleteSelectedTile(tiles);
    };

    // ------------------------------------
    // 'broadcast' channel listener
    //     supports all CRUD operations
    socket.on('broadcast', function(data) {
        if (!('op' in data)) {
            console.log("Error: 'broadcast' => data received with unspecified operation (no op found).");
            // @TODO - Should probably throw an error here if the op param is not found in data.
            // @TODO - Need to check that value of 'op' is 'c', 'r', 'u' or 'd' and if not, throw an error.
            //     Or perhaps I should just use a switch statement and have the default throw an error.

        } else if(data.op == 'u') {
            // ------------------------------
            // Update operation implementation
            console.log("Received: 'broadcast' => update tile_id " + data.tile_id + " to " + data.x + " " + data.y);

            tiles[data.tile_id].attr({ x: data.x, y: data.y });

        } else if(data.op == 'c') {
            // ------------------------------
            // Create operation implementation
            console.log("Received: 'broadcast' => create tile_id " + data.tile_id + " at " + data.x + " " + data.y);

            tiles[data.tile_id] = paper.rect(data.x, data.y, 80, 50).attr({fill: '#000', 'fill-opacity': 0.5, stroke: 'none'});
            tiles[data.tile_id].node.onclick = function() {
                transferSelection(data.tile_id, focusedTiles, tiles);
            };

            // If this is tile 0 we are inserting, then assume we are on start-up and select it as well.
            //  (Exactly one tile must always be selected.)
            if( data.tile_id == 0) {
                tiles[0].attr({ stroke: '#802', 'stroke-width': 3, 'stroke-opacity': 0.5, cursor: 'move' });
                // make tile 0 draggable
                tiles[0].drag(ongoingDrag, onStartDrag, onEndDrag);
                focusedTiles.selectedTile = 0;
            }

        } else if(data.op == 'r') {
            // ------------------------------
            // Read operation implementation
            //   Querying clients for tile locations is stupid.
            console.log("Error: 'broadcast' => client queried for tile location.");

            // do nothing

        } else if(data.op == 'd') {
            // ------------------------------
            // Delete operation implementation
            console.log("Received: 'broadcast' => delete tile_id " + data.tile_id);

            tiles[data.tile_id][0].remove();
            delete tiles[data.tile_id];

            // @TODO - What if this is the currently selected tile?  That would leave no selected tile, which is
            //   an invalid state!  No good!  (Not to mention incredibly aggrevating for the user.  We may need to 
            //   find a more graceful way of informing the user that this tile is no more.)

        } // @TODO - else throw error
    });
}

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
        tiles[targetTile].attr({ stroke: '#802', 'stroke-width': 3, 'stroke-opacity': 0.5, cursor: 'move' });
        // make tile draggable
        tiles[targetTile].drag(ongoingDrag, onStartDrag, onEndDrag);

        focusedTiles.selectedTile = targetTile;
    }
}

// ===============================================
// Callbacks for dragging tiles
function ongoingDrag(dx, dy) {
    this.attr({ x: this.ox + dx, y: this.oy + dy });
}

function onStartDrag() {
    this.ox = this.attr("x");
    this.oy = this.attr("y");
}

function onEndDrag() {
    // report new final position to server
    updateTilePosition(focusedTiles.selectedTile, this.attr("x"), this.attr("y"));
}

// ===============================================
// Send updated tile position through the socket back to the database
function updateTilePosition(id, xpos, ypos) {
    console.log("Sending position: " + xpos + " " + ypos + " for tile number: " + id);

    var data = {
        op: 'u',
        tile_id: id,
        x: xpos,
        y: ypos
    };

    socket.emit('broadcast', data);
}

// ===============================================
// Create new tile with max+1 tile_id, render it on map, and report it to the server 
//   for insertion in the database.
function createNewTile(paper, tiles) {
    
    var data = {
        op: 'c',
        tile_id: Math.max(...tiles.keys())+1,
        x: 250,
        y: 250
    };
    // @TODO - allow user to select location where new tile will appear.

    tiles[data.tile_id] = paper.rect(data.x, data.y, 80, 50).attr({fill: '#000', 'fill-opacity': 0.5, stroke: 'none'});
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

// ===============================================
// Send message on server channel requesting update on ALL tiles 
function requestAllTiles() {
    console.log("Sending: 'server' => requesting initialization on all tiles");

    // Any message received by the server on the 'server' channel that lacks the 'tile_id' key
    // will generate the full dump of all tile data.
    socket.emit('server', {});
}
