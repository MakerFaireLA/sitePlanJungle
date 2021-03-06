// ===============================================
// Global variables
var socket;
var scale_factor = 121.6 /* mm/pixel */;
// scale_factor is specific to the image loaded in index.html.  Change the image and you must compute a 
// new scale factor.  
// 
// @TODO - Compute scale factor from Google Earth API

// Keeps track of the tile_id on which mousedown() was last triggered.  Effectively this is our
// selected tile.
var lastClickedId;

// There are times when we must perform an order N scan of all the tiles in the system.
// To perform this operation we need to know the bounds 0, ... , id_max of all tiles.
// Let's keep track of id_max on the fly.
var max_tile_id = 0;

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
        reportTileLocFromScreenToServer(retrieveTileLocationViaEvent(event));
        $('.moveTile').removeClass('moveTile');
    });

    // ------------------------------------
    // Install keyboard listeners to handle tile nudging commands
    Mousetrap.bind('ctrl+w', function() {
        var tile = nudgeTile(lastClickedId, 'up');
        reportTileLocFromScreenToServer(tile);
    });
    Mousetrap.bind('ctrl+s', function() {
        var tile = nudgeTile(lastClickedId, 'down');
        reportTileLocFromScreenToServer(tile);
    });
    Mousetrap.bind('ctrl+a', function() {
        var tile = nudgeTile(lastClickedId, 'left');
        reportTileLocFromScreenToServer(tile);
    }); 
    Mousetrap.bind('ctrl+d', function() {
        var tile = nudgeTile(lastClickedId, 'right');
        reportTileLocFromScreenToServer(tile);
    });  
    Mousetrap.bind('ctrl+q', function() {
        var tile = nudgeTile(lastClickedId, 'ccw'); // counter-clockwise
        reportTileAngleToServer(tile);
    });
    Mousetrap.bind('ctrl+e', function() {
        var tile = nudgeTile(lastClickedId, 'cw'); // clockwise
        reportTileAngleToServer(tile);
    });
    
    // ------------------------------------
    // 'broadcast' channel listener
    //     supports all CRUD operations
    socket.on('broadcast', function(data) {
        if (!('op' in data)) {
            console.log("Error: 'broadcast' => data received with unspecified operation (no op found).");
            // @TODO - Should probably throw an error here if the op param is not found in data.
            return;
        }

        switch(data.op) {
            // ------------------------------
            case 'u': // tile data update
                console.log("Received: 'broadcast' => update tile_id " + data.tile_id + " to " + data.x + " " + data.y
                    + " with theta " + data.theta + " etc...");

                // @TODO - Implement an update operation here.  Using renderTile() is incorrect.  We could call moveTile
                //   except that it does not handle changes in theta.
                // renderTile(data);
                break;

            // ------------------------------
            case 'c': // create new tile
                console.log("Received: 'broadcast' => create (op = 'c') tile_id " + data.tile_id + " at " + data.location.x 
                    + " " + data.location.y + " with theta " + data.theta + " etc...");

                renderTile(data);
                break;

            // ------------------------------
            case 'r': // read tile data
                //   Querying clients for tile locations is stupid.
                console.log("Error: 'broadcast' => client queried for tile location.");

                // do nothing
                break;

            // ------------------------------
            case 'd': // delete tile
                console.log("Received: 'broadcast' => delete (op = 'd') tile_id " + data.tile_id);

                // @TODO - reimplement delete operation.
                // tiles[data.tile_id][0].remove();
                // delete tiles[data.tile_id];
                break;
            
            // ------------------------------
            default: 
                // @TODO - Perhaps I should throw an error here since this should never happen.
        }
    });
}


// ===============================================
// ===============================================
// Report creation of new tile to the server
function reportTileCreationToServer(tile) {
    console.log("Sending 'broadcast': created tile_id " + tile.tile_id + " at " + tile.location.x + " " 
        + tile.location.y);

    tile.op = 'c';

    socket.emit('broadcast', tile);
}

// ===============================================
// Send updated tile position back to the server
function reportTileLocFromScreenToServer(tile) {
    var new_x = Math.round(tile.screenloc.x*scale_factor);
    var new_y = Math.round(tile.screenloc.y*scale_factor);

    console.log("Sending 'broadcast': update tile_id " + tile.tile_id + " at " + new_x + " " + new_y);

    var data = {
        op: 'l',  // op 'l' refers to a location-only update.
        tile_id: tile.tile_id,
        x: new_x,
        y: new_y,
    };

    socket.emit('broadcast', data);
}

// ===============================================
// Send updated tile angle to the server
function reportTileAngleToServer(tile) {
    console.log("Sending 'broadcast': update tile_id " + tile.tile_id + " with theta " + tile.theta);

    var data = {
        op: 'a',  // op 'a' refers to an angle-only update.
        tile_id: tile.tile_id,
        theta: tile.theta
    };

    socket.emit('broadcast', data);
}

// ===============================================
// Report tile deletion to the server
function reportTileDeletionToServer(tile) {
    console.log("Sending 'broadcast': deleted tile_id " + tile.tile_id);

    var data = {
        op: 'd',  // op 'd' for delete
        tile_id: tile.tile_id
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
