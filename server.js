
var http = require('http');

var url = require('url');
var path = require('path');

var fs = require('fs');

var server = http.createServer(handleRequest);
server.listen(8080);

console.log('Server started on port 8080');

function handleRequest(request, response) {
    // What did we request?
    var pathname = request.url;

    // If blank let's ask for index.html
    if(pathname == '/') {
        pathname = '/index.html';
    }

    // Ok, what's our file extension?
    var ext = path.extname(pathname);

    // Map extension to file type
    var typeExt = {
        '.html': 'text/html',
        '.js':   'text/javascript',
        '.css':  'text/css'
    };

    // What is it?  Default to plain text
    var contentType = typeExt[ext] || 'text/plain';

    // user file system module
    fs.readFile(__dirname + pathname,
        // Callback function for reading
        function(err, data) {
            // if there is an error
            if(err) {
                response.writeHead(500);
                return response.end('Error loading ' + pathname);
            }
            // Otherwise, send the data, the contents of the file
            response.writeHead(200);
            response.end(data);
        }
    );
}


// WebSocket Portion
// WebSockets work with the HTTP Server
var io = require('socket.io').listen(server);


// Register a callback function to run when we have an individual connection.
// This is run for each individual user that connects.
io.sockets.on('connection',
    // We are given a websocket object in our function
    function(socket) {
        console.log("We have a new client: " + socket.id);

        // When this user emits, client side: socket.emit('otherevent', some data);
        socket.on('mouse',
            function(data) {
                // Data comes in as whatever was sent, including objects
                console.log("Received: 'mouse' " + data.x + " " + data.y);
                // Send it to all other clients
                socket.broadcast.emit('mouse', data);
                // This is a way to send to everyone, including sender
                // io.sockets.emit('message', "this goes to everyone");
            }
        );

        socket.on('disconnect', function() {
            console.log("Client has disconnected");
        });
    }    
);