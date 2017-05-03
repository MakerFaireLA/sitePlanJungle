var env = require('node-env-file');
var express = require('express');
var app = express();

// https://medium.com/@rafaelvidaurre/managing-environment-variables-in-node-js-2cb45a55195f
var dotenv = require('dotenv'); // for reading environment variables from a local .env file
dotenv.load();

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

app.get('/app.js', function(request, response, next) {
    response.sendFile('app.js', options, function(err) {
        if(err) {
            next(err);
        } else {
            console.log('Sent: app.js');
        }
    });
});

// Setup the database
var MongoClient = require('mongodb').MongoClient;

MongoClient.connect(process.env.MONGODB_URI, function (err, db) {
    if (err) throw err;

    // WebSocket Portion
    // WebSockets work with the HTTP Server
    //   Putting back the WebSockets method using instructions in
    //   http://stackoverflow.com/questions/21365044/cant-get-socket-io-js
    var port = process.env.PORT || 8080;
    var server = app.listen(port, function () {
        console.log('Server started on port ' + port);
    });
    var io = require('socket.io').listen(server);


    // Register a callback function to run when we have an individual connection.
    // This is run for each individual user that connects.
    io.sockets.on('connection', function (socket) {
        console.log("We have a new client: " + socket.id);

        // When this user emits, client side: socket.emit('otherevent', some data);
        socket.on('obj', function (data) {
            // Data comes in as whatever was sent, including objects
            console.log("Received: 'obj' => tile_id " + data.tile_id + " at " + data.x + " " + data.y);

            db.collection('testbed').updateOne(
                { "tile_id": data.tile_id },
                {
                    $set: {
                        "location": {
                            'x': data.x,
                            'y': data.y
                        }
                    }
                });

            // Send it to all other clients
            socket.broadcast.emit('obj', data);
            // This is a way to send to everyone, including sender
            // io.sockets.emit('message', "this goes to everyone");
        });

        socket.on('disconnect', function () {
            console.log("Client has disconnected");
        });
    });
});