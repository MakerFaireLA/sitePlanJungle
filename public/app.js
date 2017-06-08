// ===============================================
// Global variables
var socket;
var focusedTiles = {};
// The following items had to be moved up here simply so that scale_factor would be global and thus 
// it would be available in the ongoingDrag function.  God I hate pre-prototyped functions.
var image_size_pixels = {'x': 3024, 'y': 2160};
var console_size_phys = {'x':300000 /* mm */};
var aspect_ratio = image_size_pixels.y/image_size_pixels.x;
console_size_phys.y = aspect_ratio*console_size_phys.x;
var scale_factor = console_size_phys.x/image_size_pixels.x /* mm/pixel */;

// ===============================================
// Main Routine 
window.onload = function() { 
    
    socket = io.connect('/');
    // We will define our own physical coords tied to the map.  In this coordinate system 1 unit in this app will 
    // correspond to 1 mm measured on the ground in the Van Nuys Civic Center Plaza.  I intend to avoid the use 
    // of floats in this code, thus I have chosen 1 mm since that exceeds the finest resolution I ever expect 
    // this code to need for any purpose.

    // ------------------------------------
    // Load tiles from server
    var tiles = [];
    requestAllTiles();

    // ------------------------------------
    // Render buttons
    var buttons = [];
    // Create new tile button.
    buttons.push(paper.rect(450*scale_factor, 450*scale_factor, 40*scale_factor, 40*scale_factor).attr({fill: '#005'}));
    buttons[0].node.onclick = function() {
        createDefaultTile(paper, tiles);
    };
    buttons.push(paper.rect(10*scale_factor, 450*scale_factor, 40*scale_factor, 40*scale_factor).attr({fill: '#500'}));
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
            console.log("Received: 'broadcast' => update tile_id " + data.tile_id + " to " + data.x + " " + data.y 
                + " with theta " + data.theta);

            tiles[data.tile_id].attr({ x: data.x, y: data.y }).rotate(data.theta);

        } else if(data.op == 'c') {
            // ------------------------------
            // Create operation implementation
            console.log("Received: 'broadcast' => create (op = 'c') tile_id " + data.tile_id + " at " + data.x + " " + data.y + " with theta " + data.theta);

            tiles[data.tile_id] = paper.rect(data.x, data.y, 80*scale_factor, 50*scale_factor).rotate(data.theta).attr(
                {fill: '#000', 'fill-opacity': 0.5, stroke: 'none'});
            tiles[data.tile_id].node.onclick = function() {
                transferSelection(data.tile_id, focusedTiles, tiles);
            };

            // If this is tile 0 we are inserting, then assume we are on start-up and select it as well.
            //  (Exactly one tile must always be selected.)
            if( data.tile_id == 0) {
                tiles[0].attr({ stroke: '#802', 'stroke-width': 3*scale_factor, 'stroke-opacity': 0.5, cursor: 'move' });
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
            console.log("Received: 'broadcast' => delete (op = 'd') tile_id " + data.tile_id);

            tiles[data.tile_id][0].remove();
            delete tiles[data.tile_id];

            // @TODO - What if this is the currently selected tile?  That would leave no selected tile, which is
            //   an invalid state!  No good!  (Not to mention incredibly aggrevating for the user.  We may need to 
            //   find a more graceful way of informing the user that this tile is no more.)

        } // @TODO - else throw error
    });
}


// ===============================================
// ===============================================
// Send updated tile position through the socket back to the database
function updateTilePosition(tile_id_Arg, xArg, yArg, thetaArg) {
    console.log("Sending 'broadcast': update tile_id " + tile_id_Arg + " at " + xArg + " " + yArg 
        + " with theta " + thetaArg);

    var data = {
        op: 'u',
        tile_id: tile_id_Arg,
        x: xArg,
        y: yArg,
        theta: thetaArg
    };

    socket.emit('broadcast', data);
}

// ===============================================
// Send message on server channel requesting update on ALL tiles 
function requestAllTiles() {
    console.log("Sending: 'server' => requesting initialization on all tiles");

    // Any message received by the server on the 'server' channel that lacks the 'tile_id' key
    // will generate the full dump of all tile data.
    socket.emit('server', {});
}
