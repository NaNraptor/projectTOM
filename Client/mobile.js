////////////////////////////////////////////////////////////////////
//                  This file is used fully,                      //
//                 only if the client connects                    //
//                    with a mobile device                        //
////////////////////////////////////////////////////////////////////



//defining a 'button' object literal from which all other buttons will inherit attributes
var button = {
    x: undefined,
    y: undefined,
    size: {
        x: 70,
        y: 70
    }
};

//defining buttons that all inherit the attributes of the 'button' object literal
var up_button = Object.create(button);
var left_button = Object.create(button);
var down_button = Object.create(button);
var right_button = Object.create(button);

//function that updates the mobile button offsets, depending on the screen size and 'onresize' events
function getMobileButtonOffsets(){
    up_button.x = (canvas.width - up_button.size.x) / 1.2;
    up_button.y = canvas.height - 260;
    left_button.x = (canvas.width - left_button.size.x) / 1.2 - 80;
    left_button.y = canvas.height - 180;
    down_button.x = (canvas.width - down_button.size.x) / 1.2;
    down_button.y = canvas.height - 100;
    right_button.x = (canvas.width - right_button.size.x) / 1.2 + 80;
    right_button.y = canvas.height - 180;
}

//function that draws the mobile buttons
function getMobileGraphics(){
    //only display these graphics if the device is a mobile phone (or tablet)
    if(is_mobile){
        ctxt.fillStyle = "#e33ef1";
        ctxt.fillRect(up_button.x, up_button.y, up_button.size.x, up_button.size.y);
        ctxt.fillRect(left_button.x, left_button.y, left_button.size.x, left_button.size.y);
        ctxt.fillRect(down_button.x, down_button.y, down_button.size.x, down_button.size.y);
        ctxt.fillRect(right_button.x, right_button.y, right_button.size.x, right_button.size.y);
    }
}

//function that is called whenever a button is pressed to ensure that the player coordinates change accordingly
function mobileMove(){
    //only allow movement if the game has begun
    if(game_begin == true){
        if(isInside(mouse, up_button)){
            move(0, -1);
        }
        else if(isInside(mouse, left_button)){
            move(-1 , 0);
        }
        else if(isInside(mouse, down_button)){
            move(0, 1);
        }
        else if(isInside(mouse, right_button)){
            move(1, 0);
        }
    }
}

//function that get called when there is a 'mouseup' event, the mouse up event listener is attached in the js file support.js
function mouseup() {
    mobileMove();
};
