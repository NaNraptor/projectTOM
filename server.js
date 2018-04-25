    ////////////////////////////////////////////////////////////////////
//                     This is the server side                    //
//                     script file that manages                   //
//                     the server and incoming                    //
//                       socket connections                       //
////////////////////////////////////////////////////////////////////

//require file-system mosule - allows reading and writing to files
var fs = require('fs');
//require https module - for secure connections using ssl
var https = require('https');
//import express.js - server managment module
var express = require('express');
//assign it to variable app
var app = express();

const https_port = 443, http_port = 80;
//create a server and pass in app as a request handler
var server = https.createServer({
    key: fs.readFileSync('./ssl/privatekey'),
    cert: fs.readFileSync('./ssl/certificate'),
    ca: fs.readFileSync('./ssl/intermediate'),
    requestCert: false,
    rejectUnauthorized: false
},app).listen(443, function(){
    console.log("Secure server listening on port: " + https_port);
});
//binds the server object we created to socket.io
var io = require('socket.io')(server);
//immport node postgre moudule that allows database communication
var pg = require('pg');
//var format = require('pg-format');

//set up plain http server that will be redirecting all http traffic to the https server
var http = express();
//set up a route to redirect http to https
http.get('*', function(req, res) {
    res.redirect('https://' + req.headers.host + req.url)//, function(){
//	window.location.reload(true);
//    });
});

//have it listen on the default http port
http.listen(http_port, function(){
    console.log("Unsecure server listening on port: " + http_port + " and redirecting all traffic to secure server");
});

//this means that when a 'get' request is made to ‘/client’, all the static files will be put inside the root folder under ‘/client’.
app.use(express.static(__dirname + '/client'));

//same with this, however here the directory is '/client/images'
app.use(express.static(__dirname + '/client/images'));

//send an index.html file when a 'get' request is fired to the given route, which is ‘*’ (meaning everything that is requested) in this case
app.get('/',function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

//tell the server to listen on port 80
//const port = 80;
//server.listen(port);
//console.log("Server started. Port: " + port);

//define a constant to hold the configuration values for the PostgreSQL database pass:jVGtcSaw@4hx
const db_config = {
    user: "postgres",
    host: 'localhost',
    database: "TOM_DB",
    password: "jVGtcSaw@4hx",
    port: 5432
};

//instanciate a new pool for connections to the database using the config object literal
const pool = new pg.Pool(db_config);

//setting some global variables and some constants
const MAX_PLAYERS_PER_ROOM = 5, MAX_ROOMS = 100;

var room_index = 0;
var room = [];
//fill the room array with objects that contain the following attributes
for (let i = 0; i < MAX_ROOMS; i++){
    room.push({
        id: undefined,
        host: undefined,
        is_started: false,
        timer: 0,
        member: []
    });
}

//connect to the database before anything else - note: if there is an error nothing will work as the rest of the code is encompassed by the pool.connect's callback function
pool.connect(function(err, client, done) {
    //on error display the error stack and break execution
    if(err) {
        return console.error('connection error, could not connect to db', err);
    }

    //attach an event listener that listens for successfull conections from clients and then executes the callback function, passing the received socket as parameter
    io.sockets.on('connection', function(socket){
        //defining interval variables that allow clearing the interval once it stops being needed
        var ready_interval, name_given_interval;

        //get the top ten times regardless of seed - this sould be changed once enough data has been collected
        pool.query('SELECT "user_name", "seed", "time"  FROM "Users" JOIN "Times" ON "pk_user_id"="fk_user_id" ORDER BY "time" ASC LIMIT 10;', function(err, result) {

            socket.emit('leaguetable', result.rows);

        });

        //once a successfull connection between each socket and the server is established, make the client join an 'arbitary' channel (room)
        socket.join(room_index, function(){
            console.log("ALIVE - Socket " + socket.id + " connected in room " + room_index);

            //distinguish between hosts and different members -> the length of the current room is 1 then the socket is host, if it is more than 1 then the socket is just a regular member
            if(room[room_index].member.length == 0){
                room[room_index].id = room_index;
                room[room_index].host = socket;
                // host is also the first member
                room[room_index].member.push(socket);

                //if the current socket is host emit the 'host' event that notifies him of being the host in the current room
                socket.emit('host', room[room_index].id);

                //attach 'seed' event for every host socket
                room[room_index].host.on('seed', function(room_mate){
                    //as soon as the host receives the seed it sends it all clients in his room
                    io.sockets.in(room[room_mate.id].id).emit('seed', room_mate.seed);
                    //once the seed has been sent the 'start' event get sent to make sure the game begins
                    io.sockets.in(room[room_mate.id].id).emit('start');

                    //makes sure that room is started and the server will send the 'timer' event to it once the room has been filled
                    room[room_mate.id].is_started = true;

                    //initialise timer and start sending it to all the clients to make sure their time is always the same - it is managed solely on the server to prevent players from cheating by changing their time (timer is updated once every 100 milliseconds = 0.1 seconds)
                    setInterval(function(){
                        if(room[room_mate.id].is_started){
                            room[room_mate.id].timer += 100;
                            io.sockets.in(room[room_mate.id].id).emit('timer', room[room_mate.id].timer);
                        }
                    }, 100);
                });
            }
            //in case the connected socket is not first in the room notify it of the fact it is just a member
            else{
                room[room_index].member.push(socket);

                socket.emit('member', {id: room[room_index].member.length - 1, room: room[room_index].id});
            }

            //tell all sockets in the room that another socket just set a name, and keep on resending the messages so that when a new socket joins they will get the message too, with a maximum delay of 1000 milliseconds = 1 second
            socket.on('name given', function(room_mate){
                name_given_interval = setInterval(function(){
                    //if the game has been filled clear the interval as no more players would be joining the room
                    if(room[room_mate.room].member.length == MAX_PLAYERS_PER_ROOM){
                        clearInterval(name_given_interval);
                    }
                    io.sockets.in(room_mate.room).emit('name given', room_mate);
                }, 1000);
            });

            //tell all sockets in the room that another socket just clicked the 'ready' button, and keep on resending the messages so that when a new socket joins they will get the message too, with a maximum delay of 100 milliseconds = 0.1 second
            socket.on('ready', function(room_mate){
                ready_interval = setInterval(function(){
                    //if the game has been filled clear the interval as no more players would be joining the room
                    if(room[room_mate.room].member.length == MAX_PLAYERS_PER_ROOM){
                        clearInterval(ready_interval);
                    }
                    io.sockets.in(room_mate.room).emit('ready', room_mate);
                }, 100);
            });

            //continuosly sync player coordinates- note: this does not ensure fair play and players not using the console to change the values of their coordinates
            socket.on('room mate coordinate sync', function(room_mate){
                io.sockets.in(room_mate.room).emit('room mate coordinate sync', room_mate);
            });

            //attach an 'end' event that listens for a client reaching the end, after such an event is fired,it gets emitted to all clients in the room in order for the winner to be displayed
            socket.on('end', function(data){
                io.sockets.in(data.player.room).emit('end', data.player);

                //makes sure that room is now closed and the server will not attempt to send the 'timer' event to it anymore
                room[data.player.room].is_started = false;

                //write the winner name and seed into the database
                pool.query('INSERT INTO "Users"("user_name", "seed") VALUES ($1, $2)', [data.player.name, data.seed], function(err, result) {

                    var temp_pk_user_id;

                    //get the primary key id of the player that just got fed into the database
                    pool.query('SELECT "pk_user_id" FROM "Users" WHERE "Users"."user_name"=$1', [data.player.name], function(err, result) {

                        temp_pk_user_id = parseInt(result.rows[0].pk_user_id);

                        //insert the time and the foreign key into the "Times" table
                        pool.query('INSERT INTO "Times"("time", "fk_user_id") VALUES ($1, $2)', [data.player.time, temp_pk_user_id]);
                    });
                });
            });

            //changes the room index once the room has been filled so that no other sockets can join it
            if(room[room_index].member.length == MAX_PLAYERS_PER_ROOM){
                //send the 'full room' event once the room has been filled with players
                io.sockets.to(room[room_index].id).emit('full room');

                room_index++;
            }
        });

        //attach an event listening for sockets disconnecting (closing tab, refreshing tab, loosing internet connection, etc)
        socket.on('disconnect', function(){
            var found = false;

            //traverse all the rooms untill the dead socket is found so that it can be removed and not traversed anymore (i is the numerical id of the room)
            for(let i = 0; i <= room_index; i++){
                //this ensures that once a match is found the traversing stops, greatly optimises performance as when there are too many rooms and players, a lot of traversions can be done after the disconnected socket is found
                if(found) break;

                //j is the numerical id of the socket
                for(let j = 0; j < room[i].member.length; j++){
                    if(room[i].member[j].id == socket.id){
                        //remove disconnected socket from array
                        //room[i].member.splice(j, 1); // will be useful for better room mamnagement
                        room[i].member[j] = 0;

                        //if the host disconnects change the toom as there would be no one to input seed
                        if(j == 0){
                            room_index++;
                        }

                        console.log("DEAD - Socket " + socket.id + " disconnected from room " + room[i].id);

                        //workarounds of stupid room management
                        io.sockets.in(room[i].id).emit('ready', {id: j});
                        io.sockets.in(i).emit('room mate coordinate sync', {id: j, room: i, name: "", ready: true, x: 1, y: 1, number_of_moves: 0, time: 0});

                        //tell all sockets in the room that the player with id 'j' has disconnected
                        io.sockets.in(room[i].id).emit('socket dead', j);

                        //if a socket disconnects the intervals must be cleared to prevent the info about the disconnected socket from reappearing in other player's games. Once a new player joins the intervals get reset as normal
                        clearInterval(ready_interval);
                        clearInterval(name_given_interval);
                        found = true;
                        break;
                    }
                }
            }
        });
    });
});














// /ALTER SEQUENCE "Users_pk_user_id_seq" RESTART WITH 1;
// /SELECT * FROM "Users" JOIN "Times" ON "Users"."pk_user_id"="Times"."fk_user_id";
// /SELECT "user_name", "seed", "time"  FROM "Users" JOIN "Times" ON "pk_user_id"="fk_user_id" ORDER BY "time" ASC LIMIT 10;
// /UPDATE "Users" SET "user_name" = 'msiley<img src="x" onerror="alert(1)">' WHERE "pk_user_id" = '21';
