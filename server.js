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
    io.sockets.on('connection', function(socket) {
        console.log("We have a new client: " + socket.id);

        // ------------------------------------------------
        // Info sent on the 'broadcast' channel will be rebroadcast to all other clients
        //   in order that all users remain in sync.
        socket.on('broadcast', function(data) {
            // 'broadcast' channel listener
            //     supports all CRUD operations
            if(!('op' in data)) {
                console.log("Error: 'broadcast' => data received with unspecified operation (no op found).");
                // @TODO - Should probably throw an error here if the op param is not found in data.
                // @TODO - Need to check that value of 'op' is 'c', 'r', 'u' or 'd' and if not, throw an error.
                //     Or perhaps I should just use a switch statement and have the default throw an error.

            } else if(data.op == 'u') {
                // ------------------------------
                // Update operation implementation
                console.log("Received: 'broadcast' => update tile_id " + data.tile_id + " to " + data.x + " " + data.y 
                    + " and theta " + data.theta + " etc...");

                db.collection(process.env.MONGODB_COLLECTION).updateOne(
                    { "tile_id": data.tile_id },
                    {
                        $set: {
                            "location": {
                                'x': data.x,
                                'y': data.y
                            },
                            "dimensions": {
                                'x': data.dimx,
                                'y': data.dimy
                            },
                            "theta": data.theta,
                            "color": data.color,
                            "userRef": data.userRef,
                            "userLabel": data.userLabel
                        }
                    }, function (err) {
                        if (err) {
                            console.log("Error: Unable to update database for tile_id " + data.tile_id);
                            throw err;
                        } else {
                            // Send it to all other clients
                            socket.broadcast.emit('broadcast', data);
                        }
                    });

            } else if(data.op == 'c') {
                // ------------------------------
                // Create operation implementation
                console.log("Received: 'broadcast' => create tile_id " + data.tile_id + " at " + data.x + " " + data.y 
                    + " with theta " + data.theta + " etc...");

                db.collection(process.env.MONGODB_COLLECTION).insertOne(
                    {'tile_id': data.tile_id, 'location':{'x': data.x, 'y':data.y}, 'theta': data.theta, 
                    'dimensions':{'x': data.dimx, 'y': data.dimy}, 'color': data.color,
                    'userRef': data.userRef, 'userLabel': data.userLabel},
                    function(err) {
                        if(err) {
                            console.log("Error: Unable to insert new tile in database for tile_id " + data.tile_id);
                            throw err;
                        } else {
                            // Send it to all other clients
                            socket.broadcast.emit('broadcast', data);
                        }
                    });
            } else if(data.op == 'd') {
                // ------------------------------
                // Delete operation implementation
                console.log("Received: 'broadcast' => delete tile_id " + data.tile_id);

                db.collection(process.env.MONGODB_COLLECTION).deleteOne(
                    {'tile_id': data.tile_id},
                    function(err) {
                        if(err) {
                            console.log("Error: Failed to delete tile_id " + data.tile_id + " from database.");
                            throw err;
                        } else {
                            // rebroadcast to all other clients
                            socket.broadcast.emit('broadcast', data);
                        }
                    });

            } else if(data.op == 'r') {
                // ------------------------------
                // Read operation implementation
                console.log("Received: 'broadcast' => read tile_id " + data.tile_id);

                db.collection(process.env.MONGODB_COLLECTION).findOne(
                    {'tile_id': data.tile_id},
                    function(err, doc) {
                        if(err) {
                            console.log("Error: Read op failed to find tile_id " + data.tile_id + " in database.");
                            throw err;
                        } else {
                            var update = {
                                op: 'u',
                                tile_id: data.tile_id,
                                x: data.x,
                                y: data.y,
                                dimx: data.dimx,
                                dimy: data.dimy,
                                theta: data.theta,
                                color: data.color,
                                userRef: data.userRef,
                                userLabel: data.userLabel
                            };

                            socket.emit('broadcast', update);
                        }
                    });
            }
        });

        // ------------------------------------------------
        // 'server' channel listener 
        //     Handles non-CRUD requests (that are not to be re-broadcast)
        //     These are generally client->server only.
        socket.on('server', function(message) {
            console.log("Received: 'server' => request for initialization on all tiles.");

            db.collection(process.env.MONGODB_COLLECTION).find({ 'tile_id': { $exists: true } }).toArray(function (err, res) {
                if(err) {
                    console.log("Error: failed to retrieve tile data from database, will not be able to initialize client.");
                    throw err;
                } else {
                    for (var key in res) {
                        sendTileInitData(socket, res[key].tile_id, res[key].location.x, res[key].location.y, 
                            res[key].dimensions.x, res[key].dimensions.y, res[key].theta, res[key].color, 
                            res[key].userRef, res[key].userLabel);
                    }
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
// Send client tile initialization data
function sendTileInitData(tunnel, tile_id_Arg, xArg, yArg, dimxArg, dimyArg, thetaArg, colorArg, userRefArg, userLabelArg) {
    console.log("Send 'broadcast' => initialize (op = 'c') tile_id " + tile_id_Arg + " at " + xArg + " " + yArg
        + " with theta " + thetaArg + " etc...");

    var data = {
        op: 'c',
        tile_id: tile_id_Arg,
        x: xArg,
        y: yArg,
        dimx: dimxArg,
        dimy: dimyArg,
        theta: thetaArg,
        color: colorArg,
        userRef: userRefArg,
        userLabel: userLabelArg
    };

    tunnel.emit('broadcast', data);
}
