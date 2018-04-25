////////////////////////////////////////////////////////////////////
//                 This file is solely responsible                //
//                  for attaching event listeners                 //
//                    that wait for some input                    //
//                        from the server                         //
////////////////////////////////////////////////////////////////////



socket.on('leaguetable', function(data){
    //conver the array of objects to array of array (a simple 2d array)
    var outputData = [];
    for(var i = 0; i < data.length; i++) {
        var input = data[i];
        outputData.push([input.user_name, input.seed, input.time]);
    }

    //dynamically fill the league table with information from the database
    for(let i = 0; i < outputData.length; i++){
        for(let j = 0; j < LEAGUE_TABLE_COLUMNS; j++){
            document.getElementById("table_row" + i + j).innerHTML = outputData[i][j];
        }
    }
});

//event that fires when the server sends someone's name to the client
socket.on('name given', function(room_mate_data){
    console.log("name given received");

    //make sure that the HTML element gets appended only once
    if(!is_joined_player_appended[room_mate_data.id]){
        document.body.appendChild(joined_player_status[room_mate_data.id]);
        document.body.appendChild(ready_button[room_mate_data.id])
        is_joined_player_appended[room_mate_data.id] = true;
    }

    //if the name received is the current player's name make the value "You joined"
    if(player.id == room_mate_data.id){
        joined_player_status[player.id].value = "You joined";
    }
    else{
        joined_player_status[room_mate_data.id].value = room_mate_data.name + " joined";
    }
    joined_player_status[room_mate_data.id].style.top = ((room_mate_data.id + 1) * 40) + "px";

    //check to determine what properties the HTML element shoud have
    if(player.id == room_mate_data.id){
        ready_button[player.id].setAttribute("class", "own_ready_button");
        ready_button[player.id].value = "Ready?";
    }
    else{
        ready_button[room_mate_data.id].setAttribute("class", "ready_button");
        ready_button[room_mate_data.id].value = "Waiting...";
    }
    ready_button[room_mate_data.id].style.top = ((room_mate_data.id + 1) * 40) + "px";
});

//event that fires when a player in the rooms clicks the ready button
socket.on('ready', function(room_mate_data){
    console.log("ready received");
    if(player.id == room_mate_data.id){
        ready_button[player.id].disabled = true;
        //makes sure no animation happens after person has readied
        ready_button[player.id].setAttribute("class", "ready_button");
    }
    ready_button[room_mate_data.id].style.color = "#03EF24";
    ready_button[room_mate_data.id].style.border = "solid #03EF24 5px";
    ready_button[room_mate_data.id].value = "Ready";

    ready_player[room_mate_data.id] = true;
});

//event that fires when a player has moved and his coordinates are received
socket.on('room mate coordinate sync', function(room_mate_data){
    //This works because socket io emits events to clients in order - meaning 1st person in the room gets synced first, second person gets synced second, etc...
    if(number_of_room_mates_synced < MAX_PLAYERS_PER_ROOM){
        room_mate.push(room_mate_data);

        number_of_room_mates_synced++;

        if(number_of_room_mates_synced == MAX_PLAYERS_PER_ROOM - 1){
            // delay before drawing players - without it a hard to reproduce but still ocurring bug might happen in which room_mate[player.id] is undefined - it is possible that the room_mate array has not been filled completely yet?!?! and the delay makes sure the array is completely filled before allowig access to it
            setTimeout(function(){
                initial_sync = true;
            }, 100);
        }
    }
    else{
        room_mate[room_mate_data.id] = room_mate_data;
    }

    console.log("Data of player " + (room_mate_data.id + 1) + " synced");
});

//event listener that updates the timer
socket.on('timer', function(timer){
    console.log("timer received");

    player.time = timer;
});

//event that fires only if the current socket is a host
socket.on('host', function(room_id){
    console.log("Host of room " + room_id);

    player.id = 0;
    player.room = room_id;

    input_seed.placeholder = "waiting for players";
    input_seed.disabled = true;
});

//event that fires only if the current scoket is a member
socket.on('member', function(member){
    console.log("Member " + member.id + " of room " + member.room);

    player.id = member.id;
    player.room = member.room;

    input_seed.placeholder = "waiting for host to seed";
    input_seed.disabled = true;
});

//event that gets fired once the room has been filled with players
socket.on('full room', function(){
    console.log("full room");

    ready_button[player.id].disabled = false;
});

//socket that fires once the socket receives the seed form the server
socket.on('seed', function(value){
    seed = value;
    console.log("seed " + seed +  " received");

    //seed the RNG with the passed seed
    Math.seedrandom(seed);

    initMaze();

    //initial coordination sync happens before the player has moved
    socket.emit('room mate coordinate sync', player);
});

//socket that fires once the socket receives the start event form the server
socket.on('start', function(){
    game_begin = true;
    input_seed.remove();
    document.getElementById("canvas-id").focus();
    console.log("game started");
});

//socket that fires once the socket receives the end event form the server - when a player wins
socket.on('end', function(member){
    game_begin = false;
    game_ended = true;

    winner = member;

    if(winner.id == player.id){
        console.log("You won");
    }
    else{
        console.log("Player " + winner.id + " (" + winner.name + ") won");
    }

    console.log("game ended");
});

//event that gets fired every time someone disconnects from a room
socket.on('socket dead', function(id){
    //if the host disconnects refresh the page as there would be no one to input seed
    if (id == 0){
        location.reload();
    }

    joined_player_status[id].style.color = "#FF0000";
    joined_player_status[id].style.border = "solid #FF0000 5px";
    joined_player_status[id].value = "disconnected";
    ready_button[id].value = "Dead";
    ready_button[id].setAttribute("class", "ready_button");

    joined_player_status[id].style.top = ((id + 1) * 40) + "px";
    ready_button[id].style.top = ((id + 1) * 40) + "px";

    document.body.appendChild(joined_player_status[id]);
    document.body.appendChild(ready_button[id])
});
