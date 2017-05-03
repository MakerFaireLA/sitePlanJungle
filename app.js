
// Establish socket connection to server
var socket;

window.onload = function() { 
    var paper = new Raphael(document.getElementById('canvas_container'), 500, 500);

    socket = io.connect('/');

    // Create named event 'obj' and anonymous callback function to handle it
    socket.on('obj',
        // When we receive data simply print it to console for the moment
        function(data) {
            console.log("Got: " + data.x + " " + data.y);
        }
    );

    var img = paper.image("http://i.imgur.com/L9uSTVr.png", 0, 0, 3024, 2160);

    var tiles = [];
    var focusTiles = {};

    // tile 0
    tiles.push(paper.rect(210, 200, 80, 50).attr({fill: '#000', 'fill-opacity': 0.5, stroke: 'none'}));
    tiles[0].node.onclick = function() {
        stealSelection(0, focusTiles, tiles);
    };

    // select tile 0
    tiles[0].attr({ stroke: '#802', 'stroke-width': 3, 'stroke-opacity': 0.5, cursor: 'move' });
    // make tile 0 draggable
    tiles[0].drag(ongoingDrag, onStartDrag, onEndDrag);
    focusTiles.selectedTile = 0;

    // tile 1
    tiles.push(paper.rect(210, 265, 80, 50).attr({fill: '#000', 'fill-opacity': 0.5, stroke: 'none'}));
    tiles[1].node.onclick = function() {
        stealSelection(1, focusTiles, tiles);
    };
}

// ===============================================
// OnClick callback making tiles draggable
function stealSelection(thisTileNum, focusTiles, tiles) {
    if(thisTileNum != focusTiles.selectedTile) {
        // remove highlight on previously selected tile
        tiles[focusTiles.selectedTile].attr({ stroke: 'none', cursor: 'auto' });
        // set undrag on previously selected tile
        tiles[focusTiles.selectedTile].undrag();

        // highlight tile with red stroke
        tiles[thisTileNum].attr({ stroke: '#802', 'stroke-width': 3, 'stroke-opacity': 0.5, cursor: 'move' });
        // make tile draggable
        tiles[thisTileNum].drag(ongoingDrag, onStartDrag, onEndDrag);

        focusTiles.selectedTile = thisTileNum;
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
    sendPosition(this.attr("x"), this.attr("y"));
}

// ===============================================
// Function for sending through the socket
function sendPosition(xpos, ypos) {
    // We are sending!
    console.log("sendpos: " + xpos + " " + ypos);

    // Make a little object with x and y
    var data = {
        x: xpos,
        y: ypos
    };

    // Send that object to the socket
    socket.emit('obj', data);
}
