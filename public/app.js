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
    
    var paper = new Raphael(document.getElementById('canvas_container'), image_size_pixels.x, image_size_pixels.y);
    socket = io.connect('/');
    // https://www.justinmccandless.com/post/making-sense-of-svg-viewboxs-madness/
    // The ViewBox creates a child element of the parent SVG and defines a distinct coordinate system 
    // tied to it.  We will take advantage of this new coordinate freedom to define our own physical 
    // coords tied to the map.  In this coordinate system 1 unit in this app will correspond to 1 mm 
    // measured in the Van Nuys Civic Center Plaza.  I intend to avoid the use of floats in this code, 
    // thus I have chosen 1 mm since that exceeds the finest resolution I ever expect this code to need 
    // for any purpose.    
    paper.setViewBox(0, 0, console_size_phys.x, console_size_phys.y);
    paper.canvas.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    // Render the image at full scale in the physical coords and thus the two will be tied together.
    var img = paper.image("http://i.imgur.com/L9uSTVr.png", 0, 0, console_size_phys.x, console_size_phys.y);

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
    // Attempting to follow this recipe...
    // https://stackoverflow.com/questions/37299775/raphael-drag-object-after-rotation
    var dx_p = (dx - this.ox)*scale_factor;
    var dy_p = (dy - this.oy)*scale_factor;
    this.transform("...T" + dx_p + "," + dy_p);
    this.ox = dx;
    this.oy = dy;
    //this.attr({ x: Math.round(this.ox + dx_p), y: Math.round(this.oy + dy_p) });
}

function onStartDrag() {
    this.ox = 0;
    this.oy = 0;
}

function onEndDrag() {
    // report new final position and angle to server
    var tileTheta = this._.transform[0][1];
    // console.log("dragged tile angle is " + tileTheta);
    updateTilePosition(focusedTiles.selectedTile, this.attr("x"), this.attr("y"), tileTheta);
    // @TODO - I suspect that this.attr("x") and this.attr("y") produce the location in the 
    // wrong coordinate system.  When I reload I find that the tiles have moved back to their
    // undragged locations again.  This needs to be debugged.
}

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

// ===============================================
// Send message on server channel requesting update on ALL tiles 
function requestAllTiles() {
    console.log("Sending: 'server' => requesting initialization on all tiles");

    // Any message received by the server on the 'server' channel that lacks the 'tile_id' key
    // will generate the full dump of all tile data.
    socket.emit('server', {});
}
