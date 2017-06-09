// ===============================================
// Global variables
var socket;

// The following items had to be moved up here simply so that scale_factor would be global and thus 
// it would be available in the ongoingDrag function.  God I hate pre-prototyped functions.
var image_size_pixels = {'x': 3024, 'y': 2160};
var console_size_phys = {'x':300000 /* mm */};
var aspect_ratio = image_size_pixels.y/image_size_pixels.x;
console_size_phys.y = aspect_ratio*console_size_phys.x;
var scale_factor = console_size_phys.x/image_size_pixels.x /* mm/pixel */;

// These two unfortunate globals keep track of the offset when the user picks up a tile
// to drag it.  Since only one element can be dragged at a time I don't anticipate any 
// issue with keeping a single copy of the data as a global.
// @TODO - Find a way to store this data in the tile element rather than as a global
//   simply because this is so ugly.
var grab_deltax;
var grab_deltay;

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
    // Install callback responsible for handling dragging of tiles on mousemove
    $(document).mousemove(function(event) {
        // There should only be one element on the page with a 'move' attached,
        // that one being the one selected when mousedown was triggered. That 
        // is why it is safe to operate 'mousemove' at document level.  
        // Furthermore this insures that 'mousemove' will still operate even if 
        // the mouse drifts off of the element being dragged.
        $('.moveTile').css('left', event.pageX - grab_deltax).css('top', event.pageY - grab_deltay);
    });

    // ------------------------------------
    // Install callback responsible for handling dropping of tiles
    $(document).mouseup(function(event) {
        $('.moveTile').removeClass('moveTile');
    });

    // // ------------------------------------
    // // Render buttons
    // var buttons = [];
    // // Create new tile button.
    // buttons.push(paper.rect(450*scale_factor, 450*scale_factor, 40*scale_factor, 40*scale_factor).attr({fill: '#005'}));
    // buttons[0].node.onclick = function() {
    //     createDefaultTile(paper, tiles);
    // };
    // buttons.push(paper.rect(10*scale_factor, 450*scale_factor, 40*scale_factor, 40*scale_factor).attr({fill: '#500'}));
    // buttons[1].node.onclick = function() {
    //     deleteSelectedTile(tiles);
    // };

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

            renderTile(data);

        } else if(data.op == 'c') {
            // ------------------------------
            // Create operation implementation
            console.log("Received: 'broadcast' => create (op = 'c') tile_id " + data.tile_id + " at " + data.x + " " + data.y + " with theta " + data.theta);

            renderTile(data);

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
