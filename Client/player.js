////////////////////////////////////////////////////////////////////
//                  This is the file responsible                  //
//                 for all player related actions,                //
//                  moving, checking positions                    //
//                          drawing, etc                          //
////////////////////////////////////////////////////////////////////



//define a 'player' object literal
var player = {
    id: undefined,
    room: undefined,
    name: "noname",
    ready: false,
    x: 1,
    y: 1,
    number_of_moves: 0, //not really used anywhere yet
    time: 0
};

//function that gets executed on every key press
function keydown(key) {
    //if the game has begun start checking which key was pressed
    if(game_begin == true){
        //check which key was pressed to determine in which direction (if any) the player should move in
        switch(key){
        case key_w: case key_up:
            move(0, -1);
            break;
        case key_a: case key_left:
            move(-1 , 0);
            break;
        case key_s: case key_down:
            move(0, 1);
            break;
        case key_d: case key_right:
            move(1, 0);
            break;
        }
    }
};

//function that check whether the player has taken the key and is at the exit position
function checkForEnd(){
    //check if the key has been taken
    if(player.x == maze.size - 2 && player.y == maze.size - 2){
        is_key_taken = true;
    }
    //check if the key is taken and if player is in the exit position
    if(player.x == 0 && player.y == 1 && is_key_taken){
        socket.emit('end', {player: player, seed: seed});
        console.log("game end sent to server");
    }
}

//this function defines how the player moves around the maze
function move(x, y){
    if(maze.array[player.x + x][player.y + y] != maze.cell.wall){
        player.x += x;
        player.y += y;
        player.number_of_moves++;

        checkForEnd();

        socket.emit('room mate coordinate sync', player);
    }
}
