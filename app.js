
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

    var tile = paper.rect(210, 225, 80, 50).attr({fill: '#000', 'fill-opacity': 0.5, stroke: 'none', cursor: "move"});
    // for the currently selected tile
    tile.attr({stroke: '#802', 'stroke-width': 3, 'stroke-opacity': 0.5});
    tile.drag(ongoingDrag, onStartDrag, onEndDrag);
}

// ===============================================
// Callbacks for dragging onscreen objects
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
