////////////////////////////////////////////////////////////////////
//                This is the file that handles a                 //
//                    lot of initialisations                      //
//                  for some global variables,                    //
//              dynamic HTML objects and constants                //
////////////////////////////////////////////////////////////////////



//define some global variables that will be used later on
const MAX_PLAYERS_PER_ROOM = 5, LEAGUE_TABLE_COLUMNS = 3;
var game_begin = false, game_ended = false, is_name_entered = false, ready_player = [], are_all_ready = false, seed;
var winner;
var ready_button = [], is_joined_player_appended = [], joined_player_status = [];
var room_mate = [], number_of_room_mates_synced = 0, initial_sync = false, room_mate_colour = [];
var is_key_taken = false;
var is_get_out_appended = false, font_size = 80, is_not_shown = true;
var is_winner_appended = false;

//defining variables and setting some of their attributes to hold the dynamic html elements
var input_seed = document.createElement("input");
input_seed.setAttribute("class", "center_input");
input_seed.maxLength = "2";

var input_name = document.createElement("input");
document.body.appendChild(input_name);
input_name.setAttribute("class", "center_input");
input_name.style.width = "300px";
input_name.placeholder = "name";
input_name.maxLength = "8";
input_name.onkeydown = handleInputNameKeyDown;
input_name.focus();

var get_out_message = document.createElement("input");

var winner_message = document.createElement("input");

var start_again_button = document.createElement("input");
start_again_button.setAttribute("id", "start_again_button");
start_again_button.type = "button";
start_again_button.value = "Start Again";
start_again_button.onclick = handleStartAgain;


for(let i = 0; i < MAX_PLAYERS_PER_ROOM; i++){
    //create dynamic html elemts that will display the status of the player
    joined_player_status[i] = document.createElement("input");
    joined_player_status[i].setAttribute("class", "joined_player_status");
    joined_player_status[i].disabled = true;

    //check variable  for whether the status element is appended
    is_joined_player_appended[i] = false;

    //create dynamic html elemts that will display a button letting the player press and indicate he is ready to begin the game
    ready_button[i] = document.createElement("input");
    ready_button[i].type = "button";
    ready_button[i].disabled = true;
    ready_button[i].onclick = handleReady;

    //initialy no one is ready so set all elements in the 'ready' array to false
    ready_player[i] = false;

    //get a random colour for every 'room mate'
    room_mate_colour[i] = getRndColor();
}

//function that gets executed when the 'ready' button has been pressed
function handleReady(){
    player.ready = true;

    //tell the server that this player is ready
    socket.emit('ready', player);
    console.log("ready sent to server");
}

//fires every time a key is pressed when the input seed field is focused
function handleInputSeedKeyDown(e) {
    //if the key is enter check whether the value has a parsable integer value and if so send it to the server
    if (e.keyCode == key_enter) {
        if(!isNaN(parseInt(input_seed.value))){
            socket.emit('seed', {seed: parseInt(input_seed.value), id: player.room});
            console.log("seed sent to server");
        }
        else if(isNaN(parseInt(input_seed.value))){
            input_seed.value = "";
            input_seed.placeholder = "number please";
        }
    }
}

//fires every time a key is pressed when the input name field is focused
function handleInputNameKeyDown(e){
    //if the key is enter display the input seed field
    if (e.keyCode == key_enter) {
        document.body.appendChild(input_seed);

        input_name.remove();

        is_name_entered = true;
    }
}

//fires when the player decides to start a new game
function handleStartAgain(){
    location.reload(true);
}

//interval that continuously checks if the name has been entered and if it has, send it to the server
var recheck_status = setInterval(function(){
    if(is_name_entered){
        player.name = input_name.value;

        socket.emit('name given', player);
        console.log("name sent");

        //once the name has been sent to the server clear the interval
        clearInterval(recheck_status);
    }
}, 500);

//interval that continuously checks if all players are ready
var recheck_all_ready = setInterval(function(){
    //if all the elements in the array satisfy this condition execute the code in the if statement
    if(ready_player.every(el => el == true)){
        //if 'player' is host
        if(player.id == 0){
            input_seed.disabled = false;
            input_seed.focus();
            input_seed.placeholder = "seed";
            input_seed.onkeydown = handleInputSeedKeyDown;

            //once the input has been handled,clear the interval
            clearInterval(recheck_all_ready);
        }
    }
}, 500);

//draw the timer  and align it properly with the maze
var x_axis_align_px = 50, y_axis_align_px = 40;
function getTimerGraphics(){
    ctxt.fillStyle = "#03EF24";
    ctxt.font = "30px Arial";
    var min = Math.floor(player.time / 1000 / 60),
        sec = Math.floor(player.time / 1000) - min * 60;
        mis = (player.time - (min * 60 * 1000) - (sec * 1000)) / 10;
    ctxt.fillText("Timer: " + min + ":" + sec + ":" + mis, x_axis_align_px, y_axis_align_px);
}

function getGameInfoGraphics(){
    if(player.id == 0){
        ctxt.fillText(player.name + " (Host)", x_axis_align_px, y_axis_align_px + 50);
    }
    else{
        ctxt.fillText(player.name, x_axis_align_px, y_axis_align_px + 50);
    }
    ctxt.fillText("Room " + player.room, x_axis_align_px, y_axis_align_px + 100);
}

//in case the key is taken a brief message saying "get out" (of the maze) will be shown
function getKeyMessageGraphics(){
    //show the message only if it hasnt been shown before
    if(is_not_shown){
        //show the message only if the key has been taken
        if(is_key_taken){
            //make sure that the text box gets appended only once and not on every redraw
            if(!is_get_out_appended){
                document.body.appendChild(get_out_message);
                get_out_message.setAttribute("id", "get_out_message");
                get_out_message.disabled = true;
                get_out_message.value = "GET OUT";
                get_out_message.style.opacity = 1.0;
                is_get_out_appended = true;
            }

            //define how the size and opacity of the message change on every redraw, to create a fade out effect
            get_out_message.style.fontSize = font_size + "px";
            get_out_message.style.opacity -= 0.02;
            font_size -= 1;
            //if the opacity has reached 0 remove the element from the html
            if(get_out_message.style.opacity == 0.0){
                get_out_message.remove();
                is_not_shown = false;
            }
        }
    }
}

//function that gets called once a winner has been announced
function displayWinner(){
    //only display the winner if the game has ended
    if(game_ended){var winner_message = document.createElement("input");
        //make sure that the winner message gets appended to the html body only once rathar than on every draw
        if(!is_winner_appended){
            document.body.appendChild(winner_message);
            document.body.appendChild(start_again_button);

            winner_message.setAttribute("id", "winner_message");
            winner_message.disabled = true;

            //make sure that if the preson who won is the current player to tell them "you won"
            if(winner.id == player.id){
                winner_message.value = "You won!";
            }
            else{
                winner_message.value = winner.name + " won!";
            }

            is_winner_appended = true;
        }
    }
}

//function that ges called repeatedly in order to display all player coordinates
function getRoomMateGraphics(){
    //only start drawing the room mates after the initial sync is complete - this makes sure that the room mate coordinated do not get accessed while being undefined
    if(initial_sync){
        //traverse all room mates
        for(let i = 0; i < room_mate.length; i++){
            //make sure that the current does not get drawn as a room mate
            if(room_mate[i].id != player.id){
                ctxt.fillStyle = room_mate_colour[i];
                //conversion from maze based coordinates to pixel based ones
                ctxt.fillRect(maze.offset.x + room_mate[i].x * (maze.cell.px_size + maze.cell.px_space), maze.offset.y + room_mate[i].y * (maze.cell.px_size + maze.cell.px_space), maze.cell.px_size, maze.cell.px_size);
            }
        }
        //makes sure that player gets drawn and always overlays room mates
        ctxt.fillStyle = "#0000FF";
        ctxt.fillRect(maze.offset.x + room_mate[player.id].x * (maze.cell.px_size + maze.cell.px_space), maze.offset.y + room_mate[player.id].y * (maze.cell.px_size + maze.cell.px_space), maze.cell.px_size, maze.cell.px_size);
    }
}
