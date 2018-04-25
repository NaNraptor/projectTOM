////////////////////////////////////////////////////////////////////
//                     This is the file that is                   //
//                    responsible for connecting                  //
//                   the client to the server and                 //
//                    then defining some of the                   //
//                     most important functions                   //
////////////////////////////////////////////////////////////////////



//connect the socket to the server and make sure that the connection is secure and the socket tries to reconnect if the heartbeat fails
socket = io.connect("10.24.76.77", {secure: true, reconnection: true});
//socket = io.connect("192.168.0.7", {secure: true, reconnection: true});
//socket = io.connect("https://theonlinemaze.co.uk", {secure: true, reconnection: true});


//if a connection error is received inform the user that he is unable to reach the server
socket.once('connect_error', function() {
    input_seed.placeholder = "CONNECTION FAILED (check log)";
    console.log("ip OF SERVER SPECIFIED IN main.js IS PROBABLY WRONG OR SERVER IS UP BUT NOT ACCEPTING SOCKET CONNECTOINS");
});

//an update function that gets executed every 150ms
function slowUpdate(){
    getMazeOffsets();
    getMobileButtonOffsets();
}

//an update function that gets executed every 10ms - not currently used as nothing needs to be updated as often as 10ms
function update() {
};

//definition of the draw function that gets called in support.js
function draw() {
    getMobileGraphics();
    getMazeGraphics();
    getTimerGraphics();
    getGameInfoGraphics();
    getKeyMessageGraphics();
    getRoomMateGraphics();
    displayWinner();
};
