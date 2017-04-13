
var express = require('express');
var app = express();
var expWs = require('express-ws')(app);

// app.use(function(request, response, next) {
//     console.log('middleware');
//     request.testing = 'testing';
//     return next();
// });

var options = 
    {
        root: __dirname,
        dotfiles: 'deny',
        headers: 
            {
                'x-timestamp': Date.now(),
                'x-sent': true
            }
    };


app.get('/', function(request, response, next) {
    response.sendFile('index.html', options, function(err) {
        if(err) {
            next(err);
        } else {
            console.log('Sent: index.html');
        }
    });
});

app.get('/sketch.js', function(request, response, next) {
    response.sendFile('sketch.js', options, function(err) {
        if(err) {
            next(err);
        } else {
            console.log('Sent: sketch.js');
        }
    });
});

app.get('/socket.io.js', function(request, response, next) {
    response.sendFile('socket.io.js', options, function(err) {
        if(err) {
            next(err);
        } else {
            console.log('Sent: socket.io.js');
        }
    });
});

// WebSocket Portion
// using express-ws now that we are converting over to using Express

// Register a callback function to run when we have an individual connection.
// This is run for each individual user that connects.
app.ws('/socket.io/', function(ws, request) {
    ws.on('connection',
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
                    // ws.emit('message', "this goes to everyone");
                }
            );

            socket.on('disconnect', function() {
                console.log("Client has diconnected");
            });
        }
    );
});

var server = app.listen(8080, function() {
    console.log('Server started on port 8080');
});
