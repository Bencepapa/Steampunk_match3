
var fieldSize = 7;
var orbColors = 6;
var orbSize = 100;
//
var swapSpeed = 200;
var fallSpeed = 500;
var destroySpeed = 400;
var fastFall = true;
//
var gameArray = [];
var removeMap = [];
var orbGroup;
var selectedOrb;
var canPick = true;
//
var hand;
var handTween;
var manager = null;
var emitter = null;

var pressureclock = null;

var fogs = {
    ignoreScrollSpeed: true,
    lifespan: 3000,
    image: 'fogs',
    sendToBack: true,
    vx: { min: -1.5, max: 1.5 },
    vy: 3
};

var difficulty = 0.0;
var difficultyAcc = 0.0001;

var swipe = null;

var playGame = function (game) { }
playGame.prototype = {

    preload: function () {
        game.load.spritesheet("orbs", "assets/sprites/orbs.png", orbSize, orbSize);
        game.load.image("hand", "assets/sprites/hand.png");
        game.load.spritesheet("fogs", "assets/sprites/fogs.png", 64, 64);

        //pressureclock
        game.load.image("eclock", "assets/sprites/ui/clockPress_new.png");
        game.load.image("epointer", "assets/sprites/ui/pointer2.png");
        game.load.image("valve", "assets/sprites/ui/valveMainHorizontal.png");
        game.load.image("panel", "assets/sprites/ui/panel_top.png");
    },

    create: function () {
        game.stage.backgroundColor = "#392019";

        //scaling options
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

        //have the game centered horizontally
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        //screen size will be set automatically
        //scale.setScreenSize(true);

        //game.renderer.view.style.display="block";
        //game.renderer.view.style.marginLeft="auto";
        //game.renderer.view.style.marginRight="auto";

        swipe = new Swipe(game);
        swipe.diagonalDisabled=true;
        drawField();
        showSuggestion();
        canPick = true;
        orbGroup.inputEnableChildren = true;

        var panel = this.game.add.sprite(GAME_WIDTH/2,orbGroup.y, "panel");
        panel.anchor.set(0.5, 1.0);

        pressureclock = new pressureClock(game);
        pressureclock.init(game);

        //game.physics.startSystem(Phaser.Physics.ARCADE);
        emitterGroup = game.add.group();
        emitterGroup.position = orbGroup.position;
        emitter = game.add.emitter(0, 0, 1500);
        emitter.makeParticles(['fogs'], [1, 2, 3]);
        emitter.gravity = -200;
        emitter.setXSpeed(90, -90);
        emitter.setYSpeed(0, -300);
        emitter.setAlpha(1.0, 0.1, 3000) //, Phaser.Easing.Cubic.In);
        emitter.setScale(0.3, 4.5, 0.3, 4.5, 3000);
        //emitter.setScale(0.2, 3.0, 0.2, 3.0, 3000);
        emitterGroup.add(emitter);
        //resize();
    },

    update: function() {
        pressureclock.addPressure(difficulty);
        difficulty += difficultyAcc;
        if (canPick)
        {
            if (pressureclock.pressure > 250)
            {
                canPick=false;
                for (var i = 0; i < fieldSize; i++) {
                    for (var j = 0; j < fieldSize; j++) {
                        if (gameArray[i][j] != null) {
                            var gem = gameArray[i][j].orbSprite;
                            game.add.tween(gem).to({ y: "+1000" },
                                500, Phaser.Easing.Cubic.In, true, 1000 + game.rnd.between(0, 600) - i*200);
                        }
                    }
                }
            }

            var direction = swipe.check();
            if (direction)
            {
                console.log(direction);
                switch (direction.direction)
                {
                    case swipe.DIRECTION_UP:
                        orbMove(0, -1);
                        break;
                    case swipe.DIRECTION_DOWN:
                        orbMove(0, 1);
                        break;
                    case swipe.DIRECTION_LEFT:
                        orbMove(-1, 0);
                        break;
                    case swipe.DIRECTION_RIGHT:
                        orbMove(1, 0);
                        break;
                }
            }
        }
    }
};

function createOrb(row, col) {
    var orb = game.add.sprite(orbSize * col + orbSize / 2, orbSize * row + orbSize / 2, "orbs");
    orb.anchor.set(0.5);
    orb.events.onInputDown.add(orbSelect, this);
    orbGroup.add(orb);
    return orb;
}

function randomizeOrb(row, col, orb) {
    var randomColor = game.rnd.between(0, orbColors - 1);
    orb.frame = randomColor;
    orb.orbColor = randomColor;
    gameArray[row][col] = {
        orbColor: randomColor,
        orbSprite: orb
    }
}

function drawField() {
    orbGroup = game.add.group();
    orbGroup.inputEnableChildren = true;
    orbGroup.y = 300;
    for (var i = 0; i < fieldSize; i++) {
        gameArray[i] = [];
        for (var j = 0; j < fieldSize; j++) {
            var orb = createOrb(i, j)
            orb.alpha = 0.0;
            game.add.tween(orb).to({ angle: 360, alpha: 1.0 },
                fallSpeed, Phaser.Easing.Circular.InOut, true, i * j * 10 + 1000);

            do {
                randomizeOrb(i, j, orb)
            } while (isMatch(i, j));
        }
    }
    selectedOrb = null;
    handGroup = game.add.group();
    handGroup.position = orbGroup.position;
    hand = game.add.sprite(0, 0, "hand");
    hand.anchor.set(0.5);
    hand.visible = false;
    handGroup.add(hand);
}

function showSuggestion() {
    var matchFound = false;
    for (var i = 0; i < fieldSize - 1; i++) {
        for (var j = 0; j < fieldSize - 1; j++) {
            tmpSwap(i, j, i + 1, j);
            if (matchInBoard()) {
                hand.visible = true;
                hand.alpha = 0.0;
                hand.x = gameArray[i + 1][j].orbSprite.x + 16;
                hand.y = gameArray[i + 1][j].orbSprite.y + 70;
                handTween = game.add.tween(hand).to({
                    y: hand.y + 100
                }, 500, Phaser.Easing.Cubic.Out, true, 5000, -1, true);
                handTween2 = game.add.tween(hand).to({
                    alpha: 1.0
                }, 500, Phaser.Easing.Cubic.Out, true, 5000);
                matchFound = true;
            }
            tmpSwap(i, j, i + 1, j);
            if (matchFound) {
                return;
            }
            tmpSwap(i, j, i, j + 1);
            if (matchInBoard()) {
                hand.visible = true;
                hand.alpha = 0.0;
                hand.x = gameArray[i][j + 1].orbSprite.x + 16;
                hand.y = gameArray[i][j + 1].orbSprite.y + 70;
                handTween = game.add.tween(hand).to({
                    x: hand.x + 100
                }, 500, Phaser.Easing.Cubic.Out, true, 5000, -1, true);
                handTween2 = game.add.tween(hand).to({
                    alpha: 1.0
                }, 500, Phaser.Easing.Cubic.Out, true, 5000);
                matchFound = true;
            }
            tmpSwap(i, j, i, j + 1);
            if (matchFound) {
                return;
            }
        }
    }
    console.log("no match");
}

function tmpSwap(row1, col1, row2, col2) {
    var tmp = gameArray[row1][col1];
    gameArray[row1][col1] = gameArray[row2][col2];
    gameArray[row2][col2] = tmp;
}


function orbSelect(e, pointer) {
    //console.log(e);
    if (canPick) {
        hand.visible = false;
        handTween.stop();
        handTween2.stop();
        var pickedOrb = e; //gemAt(row, col)
        if (pickedOrb != -1) {
            if (selectedOrb == null) {
                pickedOrb.scale.setTo(1.2);
                /* pickedOrb.orbSprite.angle=45*Math.floor(Math.random()*8);*/
                var orb3Tween = game.add.tween(pickedOrb).to({ angle: "+45" },
                    fallSpeed, Phaser.Easing.Cubic.Out, true);
                pickedOrb.bringToTop();
                selectedOrb = pickedOrb;
                //orbGroup.events.onDragUpdate(orbMove);
                //game.input.addMoveCallback(orbMove);
            }
            else {
                if (areTheSame(pickedOrb, selectedOrb)) {
                    selectedOrb.scale.setTo(1);
                    var orb3Tween = game.add.tween(selectedOrb).to({ angle: "-45" },
                        fallSpeed, Phaser.Easing.Cubic.Out, true);
                    selectedOrb = null;
                }
                else {
                    if (areNext(pickedOrb, selectedOrb)) {
                        pickedOrb.scale.setTo(1.2);
                        swapOrbs(selectedOrb, pickedOrb, true);
                    }
                    else {
                        selectedOrb.scale.setTo(1);
                        var orb3Tween = game.add.tween(selectedOrb).to({ angle: "-45" },
                            fallSpeed, Phaser.Easing.Cubic.Out, true);
                        pickedOrb.scale.setTo(1.2);
                        var orb3Tween = game.add.tween(pickedOrb).to({ angle: "-45" },
                            fallSpeed, Phaser.Easing.Cubic.Out, true);
                        selectedOrb = pickedOrb;
                        //orbGroup.events.onDragUpdate(orbMove);
                        //game.input.addMoveCallback(orbMove);
                    }
                }
            }
        }
    }
}

function orbDeselect(e) {
    game.input.deleteMoveCallback(orbMove);
};

//var swipemodel = 
var SwipeModel = function() {};
SwipeModel.prototype = {
    up: function(point)     {orbMove(point, 0, -1);},
    down: function(point)   {orbMove(point, 0, 1);},
    left: function(point)   {orbMove(point, -1, 0);},
    right: function(point)  {orbMove(point, 1, 0);},
};

function orbMove(deltaCol, deltaRow) {
    console.log(">", deltaCol, deltaRow);
    if (canPick && selectedOrb)
    {
        /*var selectedOrb = gemAt(getOrbRow(selectedOrb) + deltaRow, getOrbCol(selectedOrb) + deltaCol)
        var distX = pX - selectedOrb.x;
        var distY = pY - selectedOrb.y;
        var deltaRow = 0;
        var deltaCol = 0;*/

        if (deltaRow + deltaCol != 0) {
            var pickedOrb = gemAt(getOrbRow(selectedOrb) + deltaRow, getOrbCol(selectedOrb) + deltaCol);
            console.log(pickedOrb);
            if (pickedOrb != -1) {
                selectedOrb.scale.setTo(1);
                swapOrbs(selectedOrb, pickedOrb.orbSprite, true);
                //game.input.deleteMoveCallback(orbMove);
            }
        }
    }
}

function swapOrbs(orb1, orb2, swapBack) {
    canPick = false;
    var fromColor = orb1.orbColor;
    var fromSprite = orb1;
    var toColor = orb2.orbColor;
    var toSprite = orb2;
    gameArray[getOrbRow(orb1)][getOrbCol(orb1)].orbColor = toColor;
    gameArray[getOrbRow(orb1)][getOrbCol(orb1)].orbSprite = toSprite;
    gameArray[getOrbRow(orb2)][getOrbCol(orb2)].orbColor = fromColor;
    gameArray[getOrbRow(orb2)][getOrbCol(orb2)].orbSprite = fromSprite;
    var orb1Tween = game.add.tween(gameArray[getOrbRow(orb1)][getOrbCol(orb1)].orbSprite).to({
        x: getOrbCol(orb1) * orbSize + orbSize / 2,
        y: getOrbRow(orb1) * orbSize + orbSize / 2,
        angle: "-180"
    }, swapSpeed, Phaser.Easing.Linear.None, true);
    var orb2Tween = game.add.tween(gameArray[getOrbRow(orb2)][getOrbCol(orb2)].orbSprite).to({
        x: getOrbCol(orb2) * orbSize + orbSize / 2,
        y: getOrbRow(orb2) * orbSize + orbSize / 2,
        angle: "+180"
    }, swapSpeed, Phaser.Easing.Linear.None, true);
    orb2Tween.onComplete.add(function () {
        orb1.scale.setTo(1);
        orb2.scale.setTo(1);
        if (!matchInBoard() && swapBack) {
            swapOrbs(orb1, orb2, false);
        }
        else {
            if (matchInBoard()) {
                handleMatches();
            }
            else {
                canPick = true;
                selectedOrb = null;
            }
        }
    });
}

function areNext(orb1, orb2) {
    return Math.abs(getOrbRow(orb1) - getOrbRow(orb2)) + Math.abs(getOrbCol(orb1) - getOrbCol(orb2)) == 1;
}

function areTheSame(orb1, orb2) {
    return getOrbRow(orb1) == getOrbRow(orb2) && getOrbCol(orb1) == getOrbCol(orb2);
}

function gemAt(row, col) {
    if (row < 0 || row >= fieldSize || col < 0 || col >= fieldSize) {
        return -1;
    }
    return gameArray[row][col];
}

function getOrbRow(orb) {
    return Math.floor(orb.y / orbSize);
}

function getOrbCol(orb) {
    return Math.floor(orb.x / orbSize);
}

function isHorizontalMatch(row, col) {
    return gemAt(row, col).orbColor == gemAt(row, col - 1).orbColor && gemAt(row, col).orbColor == gemAt(row, col - 2).orbColor;
}

function isVerticalMatch(row, col) {
    return gemAt(row, col).orbColor == gemAt(row - 1, col).orbColor && gemAt(row, col).orbColor == gemAt(row - 2, col).orbColor;
}

function isMatch(row, col) {
    return isHorizontalMatch(row, col) || isVerticalMatch(row, col);
}

function matchInBoard() {
    for (var i = 0; i < fieldSize; i++) {
        for (var j = 0; j < fieldSize; j++) {
            if (isMatch(i, j)) {
                return true;
            }
        }
    }
    return false;
}

function handleMatches() {
    removeMap = [];
    for (var i = 0; i < fieldSize; i++) {
        removeMap[i] = [];
        for (var j = 0; j < fieldSize; j++) {
            removeMap[i].push(0);
        }
    }
    handleHorizontalMatches();
    handleVerticalMatches();
    destroyOrbs();
}

function handleVerticalMatches() {
    for (var i = 0; i < fieldSize; i++) {
        var colorStreak = 1;
        var currentColor = -1;
        var startStreak = 0;
        for (var j = 0; j < fieldSize; j++) {
            if (gemAt(j, i).orbColor == currentColor) {
                colorStreak++;
            }
            if (gemAt(j, i).orbColor != currentColor || j == fieldSize - 1) {
                if (colorStreak >= 3) {
                    console.log("VERTICAL :: Length = " + colorStreak + " :: Start = (" + startStreak + "," + i + ") :: Color = " + currentColor);
                    switch (colorStreak) {
                        case 3:
                            for (var k = 0; k < colorStreak; k++) {
                                removeMap[startStreak + k][i]++;
                            }
                            break;
                        case 4:
                            for (var k = 0; k < fieldSize; k++) {
                                removeMap[k][i]++;
                            }
                            break;
                        default:
                            for (var k = 0; k < fieldSize; k++) {
                                for (var l = 0; l < fieldSize; l++) {
                                    if (gemAt(k, l).orbColor == currentColor) {
                                        removeMap[k][l]++;
                                    }
                                }
                            }
                            break;
                    }
                }
                startStreak = j;
                colorStreak = 1;
                currentColor = gemAt(j, i).orbColor;
            }
        }
    }
}

function handleHorizontalMatches() {
    for (var i = 0; i < fieldSize; i++) {
        var colorStreak = 1;
        var currentColor = -1;
        var startStreak = 0;
        for (var j = 0; j < fieldSize; j++) {
            if (gemAt(i, j).orbColor == currentColor) {
                colorStreak++;
            }
            if (gemAt(i, j).orbColor != currentColor || j == fieldSize - 1) {
                if (colorStreak >= 3) {
                    console.log("HORIZONTAL :: Length = " + colorStreak + " :: Start = (" + i + "," + startStreak + ") :: Color = " + currentColor);
                    switch (colorStreak) {
                        case 3:
                            for (var k = 0; k < colorStreak; k++) {
                                removeMap[i][startStreak + k]++;
                            }
                            break;
                        case 4:
                            for (var k = 0; k < fieldSize; k++) {
                                removeMap[i][k]++;
                            }
                            break;
                        default:
                            for (var k = 0; k < fieldSize; k++) {
                                for (var l = 0; l < fieldSize; l++) {
                                    if (gemAt(k, l).orbColor == currentColor) {
                                        removeMap[k][l]++;
                                    }
                                }
                            }
                            break;
                    }
                }
                startStreak = j;
                colorStreak = 1;
                currentColor = gemAt(i, j).orbColor;
            }
        }
    }
}

function destroyOrbs() {
    var destroyed = 0;
        for (var i = 0; i < fieldSize; i++) {
        for (var j = 0; j < fieldSize; j++) {
            if (removeMap[i][j] > 0) {
                emitter.x = gameArray[i][j].orbSprite.x;
                emitter.y = gameArray[i][j].orbSprite.y;
                emitter.start(true, 3000, null, 3);

                var destroyTween = game.add.tween(gameArray[i][j].orbSprite).to({
                    alpha: 0.0, angle: (i + j) % 2 == 0 ? "+180" : "-180"
                }, destroySpeed, Phaser.Easing.Cubic.In, true);
                destroyed++;
                destroyTween.onComplete.add(function (orb) {
                    orb.destroy();
                    destroyed--;
                    if (destroyed == 0) {
                        makeOrbsFall();
                        if (fastFall) {
                            replenishField();
                        }
                    }
                });
                gameArray[i][j] = null;
            }
        }
    }
    if (destroyed>2)
    {
           pressureclock.emit(destroyed);
           pressureclock.addPressure(-destroyed * destroyed * 5);
    }
}

function makeOrbsFall() {
    var fallen = 0;-1
    var restart = false;
    for (var i = fieldSize - 2; i >= 0; i--) {
        for (var j = 0; j < fieldSize; j++) {
            if (gameArray[i][j] != null) {
                var fallTiles = holesBelow(i, j);
                if (fallTiles > 0) {
                    if (!fastFall && fallTiles > 1) {
                        fallTiles = 1;
                        restart = true;
                    }
                    var orb2Tween = game.add.tween(gameArray[i][j].orbSprite).to({
                        y: gameArray[i][j].orbSprite.y + fallTiles * orbSize,
                        angle: (i + j) % 2 == 0 ? "+360" : "-360"
                    }, fallSpeed, Phaser.Easing.Cubic.Out, true);
                    fallen++;
                    orb2Tween.onComplete.add(function () {
                        fallen--;
                        if (fallen == 0) {
                            if (restart) {
                                makeOrbsFall();
                            }
                            else {
                                if (!fastFall) {
                                    replenishField();
                                }
                            }
                        }
                    })
                    gameArray[i + fallTiles][j] = {
                        orbSprite: gameArray[i][j].orbSprite,
                        orbColor: gameArray[i][j].orbColor
                    }
                    gameArray[i][j] = null;
                }
            }
        }
    }
    if (fallen == 0) {
        replenishField();
    }
}

function replenishField() {
    var replenished = 0;
    var restart = false;
    for (var j = 0; j < fieldSize; j++) {
        var emptySpots = holesInCol(j);
        if (emptySpots > 0) {
            if (!fastFall && emptySpots > 1) {
                emptySpots = 1;
                restart = true;
            }
            for (i = 0; i < emptySpots; i++) {
                var orb = createOrb(-(emptySpots - i), j);
                //var orb = createOrb(i, j)
                randomizeOrb(i, j, orb);
                //console.log(orb)
                //orb.alpha = 0;
                var orb2Tween = game.add.tween(orb).to({
                    y: orbSize * i + orbSize / 2,
                    angle: (i + j) % 2 == 0 ? "+360" : "-360",
                    alpha: 1.0
                }, fallSpeed, Phaser.Easing.Cubic.Out, true);
                replenished++;
                orb2Tween.onComplete.add(function () {
                    replenished--;
                    if (replenished == 0) {
                        if (restart) {
                            makeOrbsFall();
                        }
                        else {
                            if (matchInBoard()) {
                                game.time.events.add(250, handleMatches);
                            }
                            else {
                                canPick = true;
                                selectedOrb = null;
                                showSuggestion();
                            }
                        }
                    }
                })
            }
        }
    }
}

function holesBelow(row, col) {
    var result = 0;
    for (var i = row + 1; i < fieldSize; i++) {
        if (gameArray[i][col] == null) {
            result++;
        }
    }
    return result;
}

function holesInCol(col) {
    var result = 0;
    for (var i = 0; i < fieldSize; i++) {
        if (gameArray[i][col] == null) {
            result++;
        }
    }
    return result;
}