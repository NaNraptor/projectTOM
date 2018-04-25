////////////////////////////////////////////////////////////////////
//             This is the first client side file                 //
//             from the load sequence, it defines                 //
//                  the most important, global                    //
//                 variables that will be used                    //
//                throughout the entire project.                  //
//                 It is also responsible for                     //
//                checking whether the device                     //
//             is a mobile phone and requesting                   //
//                    next animation frame                        //
////////////////////////////////////////////////////////////////////



var canvas = document.getElementById("canvas-id");

const endlessCanvas = true;

//set the initial values for the width and heght of the canvas and then continuously resize the canvas width and height if the window has been resized
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.onresize = adapt;
function adapt() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

//this is the variable that contains all of the methods used for drawing 2d graphics on a canvas
var ctxt = canvas.getContext("2d");

//define initial mouse coordinates as an object literal
var mouse = {
    x: 0,
    y: 0
};

//define some ASCII keycodes
const key_left = 37;
const key_up = 38;
const key_right = 39;
const key_down = 40;
const key_w = 87;
const key_a = 65;
const key_s = 83;
const key_d = 68;
const key_enter = 13;

//define an array that keeps track of which keys have been pressed
var isKeyPressed = [];
for (i = 0; i < 256; ++i) {
    isKeyPressed.push(0);
}

//requesting animation frames that will make the 'draw' function work properly when updating the canvas. The frames will be requested once every 1000/30 milliseconds which is about 33 frames per seconds
var reqAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
    setTimeout(callback, 1000 / 30);
};


//redraw function that gets called on every new frame
function redraw() {
    //on each redraw clear the canvas and set the global alpha(opacity) to 1(100%)
    ctxt.clearRect(0, 0, canvas.width, canvas.height);
    ctxt.globalAlpha = 1;

    //call progammer's 'draw' function
    draw();
    //request the next frame after everything has been drawn
    reqAnimationFrame(redraw);
};

//this is a type of an update function that continuously gets executed - it is used when certain variables need updating, such as the offsets of certain objects or images on the screen. There is also a quicker update function that can be used if a variable nneds to be updated more frequently

//Note the function is passed as a reference which means it does not get saved in the stack and therefore will not cause buffer overflow error
function callSlowUpdate(){
    slowUpdate();
    setTimeout(callSlowUpdate, 150);
}

function callupdate() {
    update();
    setTimeout(callupdate, 10);
};

var is_mobile = false;
//the 'init' function that gets called once the body of the page has loaded
function init() {
    if ('ontouchstart' in window || navigator.maxTouchPoints) {
        is_mobile = true;

        //AS OF VERSION 1.1.5 THE SUPPORT FOR MOBILES WILL BE DROPPED DUE TO THE LEAGUE TABLE REQUIRING TOO MUCH SCREEN SPACE
        //SUPPORT FOR MOBILE PHONES WAS BROUGHT BACK IN VERSION 1.1.7 AS LEAGUE TABLES IS NOW HIDDEN WHEN USING MOBILE PHONES
        document.getElementById("leaguetable").style.display = "none";

        alert("For best experience make me fullscreen\n(quickly swipe either up or down) - doesn't always work :D");
        //makes the address bar on mobile phones disappear after a swipe
        window.addEventListener("load",function() {
            setTimeout(function(){
                window.scrollTo(0, 1);
            }, 1000);
        });
    }
    //define native JavaScript mouse events
    window.addEventListener("mousemove", function (e) {
        mouse.x = e.pageX - canvas.offsetLeft;
        mouse.y = e.pageY - canvas.offsetTop;
    });
    if (typeof mousemove != "undefined") {
        window.addEventListener("mousemove", mousemove);
    }
    if (typeof mouseup != "undefined") {
        window.addEventListener("mouseup", mouseup);
    }
    if (typeof mousedown != "undefined") {
        window.addEventListener("mousedown", mousedown);
    }

    //define native JavaScript key press events
    if (typeof keydown != "undefined") {
        window.addEventListener("keydown", function (e) {
            isKeyPressed[e.keyCode] = 1;
            keydown(e.keyCode);
        });
    }
    else {
        window.addEventListener("keydown", function (e) {
            isKeyPressed[e.keyCode] = 1;
        });
    }
    if (typeof keyup != "undefined") {
        window.addEventListener("keyup", function (e) {
            isKeyPressed[e.keyCode] = 0;
            keyup(e.keyCode);
        });
    }
    else {
        window.addEventListener("keyup", function (e) {
            isKeyPressed[e.keyCode] = 0;
        });
    }

    //check whether the draw function is properly defined - not absolutely necessary but helps debugging
    if (typeof draw == "undefined") {
        redraw = function () {
            ctxt.clearRect(0, 0, canvas.width, canvas.height);
            ctxt.globalAlpha = 1;
            ctxt.fillStyle = "#FF0000";
            ctxt.font = "20px Arial";
            ctxt.fillText("Press <F12> for error info! (function 'draw' was undefined)", 40, 40);
        };
    }

    //call 'caller' functions once the body of the index has loaded
    redraw();
    callupdate();
    callSlowUpdate();
};

//helper function that returns random colour as a string
function getRndColor() {
    var r = 255 * Math.random()|0,
        g = 255 * Math.random()|0,
        b = 150 * Math.random()|0;
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}

//helper function that checks whether object 1 is inside object 2
function isInside(object1, object2){
    if (object1.x >= object2.x){
        if (object1.x <= object2.x + object2.size.x){
            if (object1.y >= object2.y){
                if (object1.y <= object2.y + object2.size.y){
                    return true;
                }
            }
        }
    }
    return false;
}


//augmenting native DOM functions to provide direct element removal
// Element.prototype.remove = function() {
//     this.parentElement.removeChild(this);
// }
// NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
//     for(var i = this.length - 1; i >= 0; i--) {
//         if(this[i] && this[i].parentElement) {
//             this[i].parentElement.removeChild(this[i]);
//         }
//     }
// }
