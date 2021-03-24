// main
//initialize Phaser, start the game0

var GAME_WIDTH = 700; //1600;
var GAME_HEIGHT = 1000; //1080;
var scale = 1.0;

var game;


window.onload = function () {
    var renderFormat = Phaser.AUTO;
    //pixi is breaking on my galaxy tab 2, this checks for similar hardware and forces them to drop to canvas
    if (window.WebGLRenderingContext) {
        var canvas = document.createElement("canvas");
        var names = ["webgl", "experimental-webgl", "moz-webgl"];
        var gl;
        var numVertix = 8;
        for (var i in names) {
            try {
                gl = canvas.getContext(names[i]);
                if (gl && typeof gl.getParameter == "function") {
                    numVertix = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
                }
            } catch (e) { }
        }
        if (numVertix < 16) renderFormat = Phaser.CANVAS;
    }
    console.log("renderFormat:" + renderFormat);

    game = new Phaser.Game(GAME_WIDTH, GAME_HEIGHT,
        renderFormat);
    game.state.add("PlayGame", playGame);
    game.state.start("PlayGame");

    window.addEventListener("resize", resize);
};

function resize() {
    /*    var ratio = window.innerHeight / GAME_HEIGHT;
        var width = (GAME_WIDTH * ratio);*/
    var height = window.innerHeight;
    /*    console.log(window.innerWidth, window.innerHeight)
        if (width > window.innerWidth) {
            width = window.innerWidth - 5;
            height = window.innerWidth / GAME_WIDTH * GAME_HEIGHT - 5;
        }
        console.log(">", width, height)
        game.width = Math.round(width)*/
    console.log(">", height)
    //game.height = Math.round(height)
    //game.renderer.view.style.height = Math.round(height) + "px";
    /*    game.renderer.view.style.height = Math.round(height) + "px";
        game.renderer.view.style.width = Math.round(width) + "px";
        */
}

var main = function (game) { };
main.prototype = {
    preload: function () {
        //this should be the loader if needed
    },
    create: function () {

    }
}