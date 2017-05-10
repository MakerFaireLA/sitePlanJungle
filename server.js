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

app.use(express.static('public'));

// Setup the database
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

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


    // ===============================================
    // Register a callback function to run when we have an individual connection.
    // This is run for each individual user that connects.
    io.sockets.on('connection', function (socket) {
        console.log("We have a new client: " + socket.id);

        // ------------------------------------------------
        // The broadcast channel is shared by all clients
        socket.on('broadcast', function (data) {
            // Data comes in as whatever was sent, including objects
            console.log("Received: 'broadcast' => tile_id " + data.tile_id + " at " + data.x + " " + data.y);

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
            socket.broadcast.emit('broadcast', data);
            // This is a way to send to everyone, including sender
            // io.sockets.emit('message', "this goes to everyone");
        });

        // ------------------------------------------------
        // The server channel is for receiving requests from clients only
        socket.on('server', function(message) {
            console.log("Received: 'server' => request for update of tile_id " + message.tile_id);

            db.collection('testbed').findOne({ 'tile_id': message.tile_id }, function(err, res) {
                assert.equal(null, err);
                // console.log("Retrieved from database res: " + res);
                if(res != null) {
                    updateTilePosition(socket, message.tile_id, res.location.x, res.location.y);
                } else {
                    console.log("ERROR: Received request for tile_id " + message.tile_id 
                        + "; unable to pull match in database.");
                }
            });
        });

        // ------------------------------------------------
        socket.on('disconnect', function () {
            console.log("Client has disconnected");
        });
    });
});

// ===============================================
// Send updated tile position through the socket to the client
function updateTilePosition(tunnel, id, xpos, ypos) {
    console.log("Send position: " + xpos + " " + ypos + " for tile_id: " + id);

    // Make a little object with x and y
    var data = {
        tile_id: id,
        x: xpos,
        y: ypos
    };

    // Send that object to the socket
    tunnel.emit('broadcast', data);
}
