// ===============================================
// Global variables
var socket;
var focusedTiles = {};

// ===============================================
// Main Routine 
window.onload = function() { 
    var paper = new Raphael(document.getElementById('canvas_container'), 500, 500);

    // Communication with the database takes place through this socket
    socket = io.connect('/');

    var img = paper.image("http://i.imgur.com/L9uSTVr.png", 0, 0, 3024, 2160);

    var tiles = [];

    // tile 0
    tiles.push(paper.rect(210, 200, 80, 50).attr({fill: '#000', 'fill-opacity': 0.5, stroke: 'none'}));
    tiles[0].node.onclick = function() {
        stealSelection(0, focusedTiles, tiles);
    };
    requestTilePosition(0);

    // select tile 0
    tiles[0].attr({ stroke: '#802', 'stroke-width': 3, 'stroke-opacity': 0.5, cursor: 'move'});
    // make tile 0 draggable
    tiles[0].drag(ongoingDrag, onStartDrag, onEndDrag);
    focusedTiles.selectedTile = 0;

    // tile 1
    tiles.push(paper.rect(210, 265, 80, 50).attr({fill: '#000', 'fill-opacity': 0.5, stroke: 'none'}));
    tiles[1].node.onclick = function() {
        stealSelection(1, focusedTiles, tiles);
    };
    requestTilePosition(1);

    // tile 2
    // Tile 2 is a just a button included to trigger various debugging related activities.
    tiles.push(paper.rect(450, 450, 40, 40).attr({fill: '#005'}));
    tiles[2].node.onclick = function() {
        requestTilePosition(1);
    };

    // ------------------------------------
    // We will receive (as well as send) tile location updates on the broadcast channel
    // @TODO - Why is this never getting triggered?
    socket.on('broadcast', function(data) {
        console.log("Received: 'broadcast' => tile_id " + data.tile_id + " at " + data.x + " " + data.y);

        tiles[data.tile_id].attr({ x: data.x, y: data.y });
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
        tile_id: id,
        x: xpos,
        y: ypos
    };

    // Send that object to the socket
    socket.emit('broadcast', data);
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
