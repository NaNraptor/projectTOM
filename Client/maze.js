////////////////////////////////////////////////////////////////////
//                 This is the client side file                   //
//                  responsible for generating                    //
//                  the maze using the DFS and                    //
//                 Fisher-Yates algorithms, for                   //
//                  displaying the maze and for                   //
//                 calculating what the visual                    //
//                 of the maze should look like                   //
////////////////////////////////////////////////////////////////////



//create maze object literal with a subclass "cell" and another one "offset"
var maze = {
    array: [],
    max_px_size: 600,
    size: 35, //size in terms of number of cells keep it under 200 - too much recursion errors if more
    cell: {
        door: 3,
        key: 2,
        wall: 1,
        path: 0,
        px_size: 0,
        max_px_size: 30,
        px_space: 2
    },
    offset: {
        x: 0,
        y: 0
    }
};

//determining size of cells for different resolutions, note: can be optimised
function setCellSize(length){
    //makes sure that the space between maze cells looks 'the right size' when the cells themselves are smaller
    if(maze.size > 40){
        maze.cell.px_space = 1;
    }
    else if(maze.size > 70){
        maze.cell.px_space = 0;
    }

    //calculate the space between maze cells using this formula
    maze.cell.px_size = Math.floor((length - 40 - (maze.size - 1) * maze.cell.px_space) / maze.size);

    //if the calculated cell size is too big, shrink to the set maximum value
    if(maze.cell.px_size > maze.cell.max_px_size) {
        maze.cell.px_size = maze.cell.max_px_size;
    }
}

//function that calculates the maze offsets ans size depending on the screen size
function getMazeOffsets(){
    //keep maze in the middle
    maze.offset.x = (canvas.width - maze.size * (maze.cell.px_size + maze.cell.px_space)) / 2;
    maze.offset.y = (canvas.height - maze.size * (maze.cell.px_size + maze.cell.px_space)) / 2;
    //determine cell pixel size
    if(canvas.height <= canvas.width){
        setCellSize(canvas.height);
    }
    else{
        setCellSize(canvas.width);
    }
}

//define the variables that are going to keep the dynamic image elements
var key_image = new Image();
key_image.src = "key.png";

var wall_image = new Image();
wall_image.src = "wall.png";

var door_image = new Image();
door_image.src = "door.png";

var padlock_image = new Image();
padlock_image.src = "padlock.png";

//function that defines how the maze should be drawn
function getMazeGraphics(){
    //a nested loop used to traverse the 2d array containing all the cells
    for(let i = 0; i < maze.size; i++){
        for(let j = 0; j < maze.size; j++){
            //if the current position is a path make sure to draw it with #f6f6f6 colour
            if(maze.array[i][j] == maze.cell.path){
                ctxt.fillStyle = "#f6f6f6";
                ctxt.fillRect(maze.offset.x + i * (maze.cell.px_size + maze.cell.px_space), maze.offset.y + j * (maze.cell.px_size + maze.cell.px_space), maze.cell.px_size, maze.cell.px_size);
            }
            //if the current positoin is the door, check whether the key is taken or not to draw the appropriate image, either a padlock or a door
            else if(maze.array[i][j] == maze.cell.door){
                if(!is_key_taken){
                    ctxt.drawImage(padlock_image, maze.offset.x + i * (maze.cell.px_size + maze.cell.px_space), maze.offset.y + j * (maze.cell.px_size + maze.cell.px_space), maze.cell.px_size, maze.cell.px_size);
                }
                else{
                    ctxt.drawImage(door_image, maze.offset.x + i * (maze.cell.px_size + maze.cell.px_space), maze.offset.y + j * (maze.cell.px_size + maze.cell.px_space), maze.cell.px_size, maze.cell.px_size);
                }
            }
            //if the current position is a wall make sure to draw it using the predefined image file
            else if(maze.array[i][j] == maze.cell.wall){
                ctxt.drawImage(wall_image, maze.offset.x + i * (maze.cell.px_size + maze.cell.px_space), maze.offset.y + j * (maze.cell.px_size + maze.cell.px_space), maze.cell.px_size, maze.cell.px_size);
            }
            //if the current position is the position of the key AND the key is not taken, draw the key cell using the predefined 'key' image
            else if(maze.array[i][j] == maze.cell.key && !is_key_taken){
                ctxt.drawImage(key_image, maze.offset.x + i * (maze.cell.px_size + maze.cell.px_space), maze.offset.y + j * (maze.cell.px_size + maze.cell.px_space), maze.cell.px_size, maze.cell.px_size);
            }
        }
    }
}

//this is the DFS algorithm that generates the maze
function generateMaze(r, c){
    //create array with the four direction and grab it from the shuffled
    //array that was generated in generateDirection()
    var dirs = generateDirection();
    //start traversing the entire maze
    for (let i = 0; i < dirs.length; i++) {
        //switch statement for the directions
        switch(dirs[i]){
        case 0: // Up
            //whether 2 cells up is out or not
            if (r - 2 <= 0)continue;
            if (maze.array[r - 2][c] != maze.cell.path) {
                maze.array[r - 2][c] = maze.cell.path;
                maze.array[r - 1][c] = maze.cell.path;
                // recursively backtrack when "stuck"
                generateMaze(r - 2, c);
            }
            break;
        case 1: // Right
            // Whether 2 cells to the right is out or not
            if (c + 2 >= maze.size - 1)continue;
            if (maze.array[r][c + 2] != maze.cell.path) {
                maze.array[r][c + 2] = maze.cell.path;
                maze.array[r][c + 1] = maze.cell.path;
                // recursively backtrack when "stuck"
                generateMaze(r, c + 2);
            }
            break;
        case 2: // Down
            //whether 2 cells down is out or not
            if (r + 2 >= maze.size - 1)continue;
            if (maze.array[r + 2][c] != maze.cell.path) {
                maze.array[r + 2][c] = maze.cell.path;
                maze.array[r + 1][c] = maze.cell.path;
                // recursively backtrack when "stuck"
                generateMaze(r + 2, c);
            }
            break;
        case 3: // Left
            //whether 2 cells to the left is out or not
            if (c - 2 <= 0)continue;
            if (maze.array[r][c - 2] != maze.cell.path) {
                maze.array[r][c - 2] = maze.cell.path;
                maze.array[r][c - 1] = maze.cell.path;
                // recursively backtrack when "stuck"
                generateMaze(r, c - 2);
            }
            break;
        }
    }
}

//populate maze array with walls
function populateMaze(){
    for(let i = 0; i < maze.size; i++){
        maze.array[i] = [];
        for(let j = 0; j < maze.size; j++){
            maze.array[i][j] = maze.cell.wall;
        }
    }
}

//generate random direction based on the shuffled array
function generateDirection(){
    var  x = [0, 1, 2, 3];

    x = shuffle(x);

    return x;
}

//help function to shuffle an array using the Fisher-Yates shuffle algorithm
function shuffle(array) {
    //make current element be the last elemnt of the array
    var current_el = array.length, temp, el;

    //while there remain elements to shuffle
    while (current_el) {
    //pick a remaining element
    el = Math.floor(Math.random() * current_el--);

    //swap the picked ramining element with the current element
    temp = array[current_el];
    array[current_el] = array[el];
    array[el] = temp;
    }

    //return the shuffled array
    return array;
}

function initMaze(){
    //generate starting position coordinates that are always odd
    var row = Math.floor(Math.random() * (maze.size - 1) + 1);
    while (row % 2 == 0) {
        row = Math.floor(Math.random() * (maze.size - 1) + 1);
    }
    var col = Math.floor(Math.random() * (maze.size - 1) + 1);
    while (col % 2 == 0) {
        col = Math.floor(Math.random() * (maze.size - 1) + 1);
    }

    //populate the maze with walls
    populateMaze();

    //generate the maze
    generateMaze(row, col);

    //set predefined positions for the starting position of the player and the key
    maze.array[0][1] = maze.cell.door;
    maze.array[maze.size - 2][maze.size - 2] = maze.cell.key;
}


//generate a random seed fot the maze used as "background", before the game is started
Math.seedrandom(Math.floor(Math.random()*999999 + 1));

//init a maze as "background", before the game is started
initMaze();
