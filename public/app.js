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

    requestAllTiles();

    // ------------------------------------
    // Render buttons
    var button = [];
    // A button included to trigger various debugging related activities.
    button.push(paper.rect(450, 450, 40, 40).attr({fill: '#005'}));
    button[0].node.onclick = function() {
        createNewTile(paper, tiles);
    };

    // ------------------------------------
    // We will receive (as well as send) tile location updates on the broadcast channel
    socket.on('broadcast', function(data) {
        console.log("Received: 'broadcast' => tile_id " + data.tile_id + " at " + data.x + " " + data.y);

        if(data.tile_id in tiles) {
            // Tile is already in array; update the data for the tile.
            tiles[data.tile_id].attr({ x: data.x, y: data.y });
        } else {
            // This is a new tile; add it at the specified location.
            tiles.push(paper.rect(data.x, data.y, 80, 50).attr({fill: '#000', 'fill-opacity': 0.5, stroke: 'none'}));
            tiles[data.tile_id].node.onclick = function() {
                stealSelection(data.tile_id, focusedTiles, tiles);
            };

            // If this is tile 0 we are inserting, then select it as well.
            //    (JavaScript does force us to write ugly code, does it not?)
            if( data.tile_id == 0) {
                tiles[0].attr({ stroke: '#802', 'stroke-width': 3, 'stroke-opacity': 0.5, cursor: 'move' });
                // make tile 0 draggable
                tiles[0].drag(ongoingDrag, onStartDrag, onEndDrag);
                focusedTiles.selectedTile = 0;
            }
        }
    });
}

// ===============================================
// OnClick callback making tiles draggable
function stealSelection(thisTileNum, focusedTiles, tiles) {
    if(thisTileNum != focusedTiles.selectedTile) {
        // remove highlight on previously selected tile
        tiles[focusedTiles.selectedTile].attr({ stroke: 'none', cursor: 'auto' });
        // set undrag on previously selected tile
        tiles[focusedTiles.selectedTile].undrag();

        // highlight tile with red stroke
        tiles[thisTileNum].attr({ stroke: '#802', 'stroke-width': 3, 'stroke-opacity': 0.5, cursor: 'move' });
        // make tile draggable
        tiles[thisTileNum].drag(ongoingDrag, onStartDrag, onEndDrag);

        focusedTiles.selectedTile = thisTileNum;
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
        stealSelection(data.tile_id, focusedTiles, tiles);
    };
    stealSelection(data.tile_id, focusedTiles, tiles);

    socket.emit('broadcast', data);
    // @TODO - prevent full rendering until confirmation of insertion in the database has been reported back.
}

// ===============================================
// Send message on server channel requesting update of tile position
function requestTilePosition(id) {
    console.log("Sending: 'server' => requesting update of tile_id " + id);

    var message = {
        tile_id: id
    };

    socket.emit('server', message);
}

// ===============================================
// Send message on server channel requesting update on ALL tiles 
function requestAllTiles() {
    console.log("Sending: 'server' => requesting update on all tiles");

    // Any message received by the server on the 'server' channel that lacks the 'tile_id' key
    // will generate the full dump of all tile data.
    socket.emit('server', {});
}
