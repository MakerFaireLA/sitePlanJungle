
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

    var obj = paper.rect(210, 225, 80, 50);
    obj.attr({fill: '#000', stroke: 'none', cursor: "move"});

    function move(dx, dy) {
        this.attr({x: this.ox + dx, y: this.oy + dy});
    }

    function start() {
        this.ox = this.attr("x");
        this.oy = this.attr("y");
    }

    function end() {
        // report new final position to server
        sendposition(this.attr("x"), this.attr("y"));
    }

    obj.drag(move, start, end);
}


// ===============================================
// Function for sending through the socket
function sendposition(xpos, ypos) {
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
