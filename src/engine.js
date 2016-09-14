var chars = []

var engine = {};

engine.step = 4;

function charalist() {
    if ("charas" in engine.currentLevel["Level"]) {
        listofcharas = engine.currentLevel["Level"]["charas"]
        if (listofcharas[0] == "") {
            return []
        }
        var count = listofcharas.length;
        var returnvalue = []

        for (var i = 0; i < count; i++) {
            var item = listofcharas[i];
            returnvalue.push(new char(item[0], item[1], item[2]))
        }

        return returnvalue
    } else {
        return []
    }
}

engine.checkMapBoundaries = function(_char, px, py, mapw, maph) {
    if (_char.facing == "up") {
        return (py > 0)
    } else if (_char.facing == "left") {
        return (px > 0)
    } else if (_char.facing == "right") {
        return (px < mapw)
    } else if (_char.facing == "down") {
        return (py < maph)
    }
    return True
}

engine.facingPosition = function(_char, px, py) {
    var facing = _char.facing
    if (facing == "up") {
        return [py - 1, px]
    } else if (facing == "left") {
        return [py, px - 1]
    } else if (facing == "right") {
        return [py, px + 1]
    } else {
        return [py + 1, px]
    }
    console.log("error facing! char: " + _char + " ;position: " + px + ", " + py)
    return false
}

engine.charWalkSteps = function(_char, walkSteps) {
    _char.steps -= walkSteps;
    if (_char.facing == "up") {
        _char.mapy -= walkSteps;
    } else if (_char.facing == "left") {
        _char.mapx -= walkSteps;
    } else if (_char.facing == "right") {
        _char.mapx += walkSteps;
    } else if (_char.facing = "down") {
        _char.mapy += walkSteps;
    }
}

engine.charaLookToPlayer = function(chara) {
    var ppx = Math.floor(player.mapx / 32),
        ppy = Math.floor(player.mapy / 32) + 1;
    var cpx = Math.floor(chara.mapx / 32),
        cpy = Math.floor(chara.mapy / 32) + 1;

    var resx = cpx - ppx
    var resy = cpy - ppy

    if (resx == 0 && resy < 0) {
        return "down"
    } else if (resx == 0 && resy > 0) {
        return "up"
    } else if (resx < 0) {
        return "right"
    } else {
        return "left"
    }
    console.log("error facing!" + resx + " , " + resy)
    return false
}

engine.charaLookAwayPlayer = function(chara) {
    var ppx = Math.floor(player.mapx / 32),
        ppy = Math.floor(player.mapy / 32) + 1;
    var cpx = Math.floor(chara.mapx / 32),
        cpy = Math.floor(chara.mapy / 32) + 1;

    var resx = cpx - ppx
    var resy = cpy - ppy

    if (resx == 0 && resy < 0) {
        return "up"
    } else if (resx == 0 && resy > 0) {
        return "down"
    } else if (resx < 0) {
        return "left"
    } else {
        return "right"
    }
    console.log("error facing!" + resx + " , " + resy)
    return false
}

engine.randomDirection = function() {
    var directions = ["down", "up", "right", "left", "down"]
    return directions[Math.floor(Math.random() * 4)]
}

engine.isCharFacingPlayer = function(_char) {
    var ppx = Math.floor(_char.mapx / 32),
        ppy = Math.floor(_char.mapy / 32) + 1;

    var cpx = Math.floor(player.mapx / 32),
        cpy = Math.floor(player.mapy / 32) + 1;

    if (ppx - cpx == 1 && cpy - ppy == 0 && _char.facing == "left") {
        return true
    } else if (ppx - cpx == -1 && cpy - ppy == 0 && _char.facing == "right") {
        return true
    } else if (ppx - cpx == 0 && cpy - ppy == 1 && _char.facing == "down") {
        return true
    } else if (ppx - cpx == 0 && cpy - ppy == -1 && _char.facing == "up") {
        return true
    }
    return false
}


function char(chara, x, y) {
    this['chara'] = resources['charas'][chara]
    this['nocolision'] = this.chara.properties.nocolision
    this['charaset'] = resources['charasets'][this['chara']['charaset']]
    this['pushable'] = this.chara.properties.pushable
    this['facing'] = 'down';
    this['steps'] = 0;
    this['waits'] = 0;
    this['mapx'] = x * 32;
    this['mapy'] = (y - 1) * 32;
    this['movstack'] = clone(this['chara']['movements']);
    this['stopped'] = false;
    this['curr_animation'] = false;
    this['mapheight'] = engine.currentLevel["Level"]["colision"].length-1;
    this['mapwidth'] = engine.currentLevel["Level"]["colision"][0].length;
    this['checkMapBoundaries'] = function(px, py, mapw, maph) {
        return engine.checkMapBoundaries(this, px, py, mapw, maph)
    }
    this['facingPosition'] = function(px, py) {
        return engine.facingPosition(this, px, py)
    }
    this['isFacingPlayer'] = function() {
        return engine.isCharFacingPlayer(this)
    }
    this['imediate'] = (this.chara.actions.type[1] == 1);
    this['followPlayer'] = function() {
        this.facing = engine.charaLookToPlayer(this)
    }
    this['awayPlayer'] = function() {
        this.facing = engine.charaLookAwayPlayer(this)
    }

    this['update'] = function() {
        if (printer.isShown) return;

        if (this.steps == 0 && this.waits == 0 && this.stopped == false) {
            if (this['movstack'].length > 0) {
                var px = Math.floor(this.mapx / 32),
                    py = Math.floor(this.mapy / 32) + 1;
                var moveToDo = this['movstack'].shift();
                if (moveToDo[0] == "move") {
                    if (moveToDo[1] == "follow") {
                        this.followPlayer()
                    } else if (moveToDo[1] == "away") {
                        this.awayPlayer()
                    } else if (moveToDo[1] == "random") {
                        this.facing = engine.randomDirection()
                    } else {
                        this.facing = moveToDo[1]
                    }


                    var fpos = this.facingPosition(px, py)
                    if (this.imediate) {
                        if (this.isFacingPlayer()) {
                            var playerpx = Math.floor(player.mapx / 32),
                                playerpy = Math.floor(player.mapy / 32) + 1;
                            eventInChar(this, [0, 1], [playerpy - 1, playerpx])
                        }
                    }
                    if (this.checkMapBoundaries(px, py, this.mapwidth, this.mapheight) &&
                        engine.currentLevel["Level"]["colision"][fpos[0]][fpos[1]] == 0) {
                        this.steps = 32
                    } else {
                        this.waits = 16
                    }

                }
                if (moveToDo[0] == "face") {
                    if (moveToDo[1] == "follow") {
                        this.followPlayer()
                    } else if (moveToDo[1] == "away") {
                        this.awayPlayer()
                    } else if (moveToDo[1] == "random") {
                        this.facing = engine.randomDirection()
                    } else {
                        this.facing = moveToDo[1]
                    }
                    this.waits = 16
                }
            } else {
                if (this['chara']['movements'] != []) {
                    this['movstack'] = clone(this['chara']['movements'])
                }
            }

        } else if (this.steps > 0 && this.waits == 0 && this.stopped == false) {
            engine.charWalkSteps(this, engine.step)
        } else if (this.waits > 0 && this.stopped == false) {
            this.waits -= 2;
        }
    };
}

var player = {};
player.setup = function() {
    player['charaset'] = resources.playerCharaset;
    player['mapx'] = init['Player']['initPosX'];
    player['mapy'] = init['Player']['initPosY'];
    player['facing'] = init['Player']['facing'];
    player['party'] = init['Player']['party']
    player['steps'] = 0;
    player['waits'] = 0;
    player['running'] = false;
    player['curr_animation'] = false;
    player['checkMapBoundaries'] = function(px, py, mapw, maph) {
        return engine.checkMapBoundaries(player, px, py, mapw, maph)
    }

    player['update'] = function() {

        if (printer.isShown) return;

        var px = Math.floor(player.mapx / 32),
            py = Math.floor(player.mapy / 32) + 1;
        var mapheight = engine.currentLevel["Level"]["colision"].length-1;
        var mapwidth = engine.currentLevel["Level"]["colision"][0].length;

        if (player.steps == 0 && player.waits == 0) {
            var dirkey = engine.dirKeyActive()
            if (dirkey) {
                engine.mapEventBlocked = false
                player.mapx = px * 32,
                    player.mapy = (py - 1) * 32
                player.facing = dirkey
                var fpos = player.facingPosition()
                if (player.checkMapBoundaries(px, py, mapwidth, mapheight)) {
                    var charFacing = engine.playerFaceChar()
                    if(charFacing.pushable){
                        charFacing.movstack.push(['move','away'])
                    }
                    if (engine.currentLevel["Level"]["colision"][fpos[0]][fpos[1]] == 0 && !(charFacing.nocolision)) {
                        player.steps = 32;
                        if (charFacing) {
                            eventInChar(charFacing, [0, 1], [py - 1, px])
                        }
                    } else {
                        feedbackEng.play('stop')
                        HID.inputs[dirkey].active = false
                    }
                } else {
                    feedbackEng.play('stop')
                    HID.inputs[dirkey].active = false
                }
            } else if (HID.inputs["accept"].active) {
                var charFacing = engine.playerFaceChar()
                if (charFacing) {
                    if (eventInChar(charFacing, [1, 0], [py - 1, px])) {
                        HID.inputs["accept"].active = false
                        engine.waitTime(400);
                    } else {
                        player.waits = 16
                    }
                } else {
                    if (py - 1 > 0 && px - 1 > 0 && px + 1 < engine.currentLevel["Level"]["events"].length && px + 1 < engine.currentLevel["Level"]["events"].length) {
                        var fpos = player.facingPosition()
                        if (eventInMap(engine.currentLevel["Level"], [1, 0], fpos)) {
                            HID.inputs["accept"].active = false
                            engine.waitTime(400);
                        }
                    }

                }
            } else if (HID.inputs["cancel"].active) {
                HID.inputs["cancel"].active = false
                engine.mapMenu.activate()
            }

        } else if (player.waits == 0) {
            engine.charWalkSteps(player, engine.step)

            if (player.running) {
                if (!(player.steps == 0)) {
                    engine.charWalkSteps(player, engine.step)
                }
            }
            if ((player.mapx%32==0) && (player.mapy%32==0)) {
                var px = Math.floor(player.mapx / 32),
                    py = Math.floor(player.mapy / 32) + 1;
                if (eventInMap(engine.currentLevel["Level"], [0, 1], [py, px])) {
                    HID.inputs["accept"].active = false
                    engine.mapEventBlocked = true
                }
            }
        } else {
            player.waits -= 1
        }
    };
}

engine.resetBlocks = function() {
    actions.blockCounter = 0;
    actions.blockStack = new Array();
    actions.blockStack.push(actions.blockCounter.valueOf());
};

engine.setup = function() {
    engine.toggle = false;
    engine.currentLevel = null;
    engine.levels = null;
    engine.paused = false;
    engine.mapEventBlocked = false;
    engine.frameCount = 0;
    engine.timer = null;
    engine.waitKey = false;
    engine.waitTimeSwitch = false;
    engine.minimumWait = false;
    engine.atomStack = new Array();
    engine.alertStack = new Array();
    engine.st = {};
    engine.st.vars = {};
    engine.resetBlocks()
    engine.state = "startScreen"
    engine.questionBoxUndef = -1
    engine.questionBoxAnswer = engine.questionBoxUndef
    engine.menuSetup()
}

engine.menuSetup = function() {

    items.setup(resources.items)
    items.menuUpdate()
    engine.mapMenu = new menu({
        items: items.menu,
        status: {
            action: function() {
                engine.mapMenu.wait = true;
                actions.showStatus("hero");
                engine.atomStack.push([function() {
                    engine.mapMenu.wait = false;
                }, null]);
            },
            index: 1
        },

        config: new menu({
            showFPS: new menu({
                yes: {
                    action: [function() {
                        debug.FPS.show = true
                    }, 'exit'],
                    index: 0
                },

                no: {
                    action: [function() {
                        debug.FPS.show = false
                    }, 'exit'],
                    index: 1
                }
            }, 0),

            walkspeed: new menu({
                x2: {
                    action: [function() {
                        player['running'] = true
                    }, 'exit'],
                    index: 0
                },

                x1: {
                    action: [function() {
                        player['running'] = false
                    }, 'exit'],
                    index: 1
                }
            }, 1),

            back: {
                action: 'exit',
                index: 2
            }
        }, 2),
        exit: {
            action: 'exit',
            index: 3
        }
    });
    menus.setParent(engine.mapMenu);
}

engine.playerFaceChar = function() {
    var count = chars.length;
    for (var i = 0; i < count; i++) {
        var thischar = chars[i];
        if (player != thischar) {
            var ppx = Math.floor(player.mapx / 32),
                ppy = Math.floor(player.mapy / 32) + 1;

            var cpx = Math.floor(thischar.mapx / 32),
                cpy = Math.floor(thischar.mapy / 32) + 1;

            if (ppx - cpx == 1 && cpy - ppy == 0 && player.facing == "left")
                return thischar

            if (ppx - cpx == -1 && cpy - ppy == 0 && player.facing == "right")
                return thischar

            if (ppx - cpx == 0 && cpy - ppy == 1 && player.facing == "down")
                return thischar

            if (ppx - cpx == 0 && cpy - ppy == -1 && player.facing == "up")
                return thischar


        }
    }
    return false
}


engine.updateChars = function() {
    var count = chars.length;
    for (var i = 0; i < count; i++) {
        var thischar = chars[i];
        thischar.update()
    }
}

engine.testWaitForKey = function() {
    if (HID.inputs["accept"].active) {
        engine.waitKey = false;
        HID.inputs["accept"].active = false;
        engine.minimumWait = false;
    } else if (HID.inputs["cancel"].active) {
        engine.waitKey = false;
        HID.inputs["cancel"].active = false;
        engine.minimumWait = false;
    }
};

engine.waitForKey = function(state) {
    engine.waitKey = state;
    engine.minimumWait = false;
    setTimeout(function() {
        engine.minimumWait = true;
    }, 300);
};

engine.waitTime = function(time) {
    engine.waitTimeSwitch = true;
    engine.minimumWait = false;
    setTimeout(function() {
        engine.waitTimeSwitch = false;
    }, time);
}

engine.dirKeyActive = function() {
    if (HID.inputs["up"].active)
        return "up"
    else if (HID.inputs["down"].active)
        return "down"
    else if (HID.inputs["left"].active)
        return "left"
    else if (HID.inputs["right"].active)
        return "right"
    else
        return false

}

engine.loop = function() {
    try {
        if (!this.paused) {

            // update
            if (!engine.waitKey && !engine.waitTimeSwitch) {
                if (menus.isAnyMenuEnabled()) {
                    menus.updateMenuEnabled();
                    engine.runatomStack();
                } else {
                    if (engine.state == "map") {
                        engine.updateChars();
                    } else if (engine.state == "startScreen") {
                        title.startScreen();
                    } else if (engine.state == "battle") {
                        battle.update()
                    }
                    engine.runatomStack();
                }
                engine.alertupdate()

            } else if (this.minimumWait) {
                this.testWaitForKey();
            }


        }

        HID.clearInputs();
        if(engine.toggle){
            HID.processGamepad();
        }
        engine.toggle = !(engine.toggle)
        engine.timer = setTimeout("engine.loop()", 1000 / 60.0);

    } catch (err) {
        alert("engine loop error: " + err);
    }
};

engine.runatomStack = function() {
    if (engine.atomStack.length > 0) {
        while (engine.atomStack.length > 0) {
            eventToRun = engine.atomStack.shift();
            if (eventToRun[0] == "block") {
                break
            } else {
                eventToRun[0](eventToRun[1], eventToRun[2]);
            }
        }
    }
};

evalCondition = function(param) {
    var value = eval(param[0])
    return value
}

eventInChar = function(char, evType, position) {
    if (char['chara']['actions']['type'][0] == evType[0] && char['chara']['actions']['type'][1] == evType[1]) {
        char.charwasfacingfirst = char.facing
        char.waits = 16
        var newfacing = player.charaFacingTo(char)
        if (newfacing) {
            char.facing = newfacing
        }
        char.stopped = true
        engine.resetBlocks()
        var aNmb, action, actionAndParam;
        for (aNmb = 0; aNmb < char['chara']['actions']['list'].length; aNmb++) {
            actionAndParam = char['chara']['actions']['list'][aNmb];
            engine.translateActions(actionAndParam[0], actionAndParam[1], position, char);
        }
        engine.atomStack.push([function() {
            char.stopped = false;
            char.facing = char.charwasfacingfirst
        }, '']);
        return true;
    } else {
        return false;
    }
};

player.charaFacingTo = function(chara) {
    var ppx = Math.floor(player.mapx / 32),
        ppy = Math.floor(player.mapy / 32) + 1;
    var cpx = Math.floor(chara.mapx / 32),
        cpy = Math.floor(chara.mapy / 32) + 1;

    var resx = cpx - ppx
    var resy = cpy - ppy

    if (resx == 0 && resy < 0)
        return "down"
    else if (resx == 0 && resy > 0)
        return "up"
    else if (resx < 0 && resy == 0)
        return "right"
    else
        return "left"

    console.log("error facing!")
    return false

}

player.facingPosition = function() {
    var px = Math.floor(player.mapx / 32),
        py = Math.floor(player.mapy / 32) + 1;
    return engine.facingPosition(player, px, py)
}

eventInMap = function(level, evType, position) {
    if (engine.mapEventBlocked) {
        return false
    }

    var event = level["events"][position[0]][position[1]]

    if (event == 0) {
        return false
    }

    engine.resetBlocks()
    if (level['eventsType'][event.toString()][0] == evType[0] && level['eventsType'][event.toString()][1] == evType[1]) {
        var aNmb, action, actionAndParam;
        for (aNmb = 0; aNmb < level['eventsActions'][event.toString()].length; aNmb++) {
            actionAndParam = level['eventsActions'][event.toString()][aNmb];
            engine.translateActions(actionAndParam[0], actionAndParam[1], position);
        }
        return true
    }
};

engine.addItem = function(param) {
    for (var i = 0; i < param.length; i++) {
        items.addItem(param[i])
    }
}

engine.subtractItem = function(param) {
    for (var i = 0; i < param.length; i++) {
        items.subtractItem(param[i])
    }
}

engine.battle = function(param) {
    battle.start(param)
}

engine.changeState = function(param) {
    engine.state = param[0]
}

engine.teleportInPlace = function(param) {
    var px = Math.floor(player.mapx / 32),
        py = Math.floor(player.mapy / 32) + 1;
    var map = param[0]
    engine.teleport([px, py, map])
}

engine.teleport = function(param) {
    //param = [positionX,positionY,level]
    engine.state = "map"
    engine.currentLevel = resources['levels'][param[2]];
    resources.tileset = resources.tile[engine.currentLevel.Level.tileImage]
    player.mapx = parseInt(param[0], 10) * 32;
    player.mapy = (parseInt(param[1], 10) - 1) * 32;
    player.steps = 0;
    //    player.facing = "down";
    HID.cleanInputs()
    HID.clearInputs()
    chars = new charalist();
    chars.push(player)
    engine.waitTime(100);
}

engine.changeTile = function(param) {
    //param = [tileType,layer,colision,event,positionY,positionX,level]
    //          0      , 1   , 2      , 3   , 4       , 5       , 6
    ///////////////////////////////////////////////////////////////////

    if (param[6] == null || param[6] == "this") {
        var levelToChange = engine.currentLevel
    } else {
        var levelToChange = resources['levels'][param[6]];
    }
    if (param[2] != -1) {
        levelToChange["Level"]["colision"][param[4]][param[5]] = param[2]
    }
    if (param[3] != -1) {
        levelToChange["Level"]["events"][param[4]][param[5]] = param[3]
    }

    levelToChange["Level"][param[1]][param[4]][param[5]] = param[0]
}

engine.changeAllTiles = function(param) {
    //param = [originalTileType, newTileType,layer,colision,event,level]
    //              0          ,     1      ,  2  ,   3    ,  4  ,  5
    ///////////////////////////////////////////////////////////////////

    var originalTile = param[0]
    var newTile = param[1]
    var layer = param[2]

    if (param[5] == null || param[5] == "this") {
        var levelToChange = engine.currentLevel
    } else {
        var levelToChange = resources['levels'][param[5]];
    }
    var h = levelToChange["Level"]["colision"].length
    var w = levelToChange["Level"]["colision"][0].length

    for(var y=0; y<h; y++){
        for (var x=0; x<w; x++){
            var currTile = levelToChange["Level"][layer][y][x]
            if(currTile == originalTile){
                if (param[3] != -1) {
                    levelToChange["Level"]["colision"][y][x] = param[3]
                }
                if (param[4] != -1) {
                    levelToChange["Level"]["events"][y][x] = param[4]
                }

                levelToChange["Level"][layer][y][x] = param[1]
            }
        }
    }
}

engine.evalNum = function(number) {
    var value = number.slice(0)
    if (isNaN(value)) {
        if (value.indexOf("var:") == 0) {
            return engine.st.vars[value.split('var:')[1]]
        } else if (value.indexOf("ans:") == 0) {
            if (value.split('ans:')[1] == "num") {
                return engine.questionBoxAnswer
            } else {
                return engine.questionBoxAnswerStr
            }
        } else if (value.indexOf("lastbattle:") == 0) {
            return battle.lastresult
        } else if (value.indexOf("hero:") == 0) {
            if (value.split('hero:')[1] == "face") {
                return player.facing
            } else if (value.split('hero:')[1] == "x") {
                return Math.floor(player.mapx / 32)
            } else if (value.split('hero:')[1] == "y") {
                return Math.floor(player.mapy / 32) + 1
            }
        } else if (value.indexOf("map:") == 0) {
            if (value.split('map:')[1] == "this" || value.split('map:')[1] == "current" ) {
                return engine.currentLevel.Level.levelName
            }
        } else {
            return value
        }
    } else {
        return +value
    }
}


engine.IF = function(param, blockId) {
    if (engine.testVar(param)) {
        var removeActions = false
        for (var i = 0; i < engine.atomStack.length; i++) {
            if (engine.atomStack[i][0] == engine.ELSE && engine.atomStack[i][2] == blockId) {
                removeActions = true

            }
            if (engine.atomStack[i][0] == engine.END && engine.atomStack[i][2] == blockId) {
                return
            }
            if (removeActions) {
                engine.atomStack.splice(i, 1)
                i--
            }

        }
    } else {
        var actToRun = [0, 0, 0]
        while (engine.atomStack.length > 0 &&
            actToRun[0] != engine.END &&
            actToRun[0] != engine.ELSE ||
            actToRun[2] != blockId) {
            actToRun = engine.atomStack.shift();
        }
    }
}

engine.END = function() {}

engine.ELSE = function() {}

engine.setVar = function(param) {
    engine.st.vars[param[0]] = engine.evalNum(param[1])
}

engine.varPlusOne = function(param) {
    if (isNaN(engine.st.vars[param[0]])) {
        engine.st.vars[param[0]] = 0
    }
    engine.st.vars[param[0]]++
}

engine.testVar = function(param) {
    var var1 = engine.evalNum(param[0])
    if (var1 == "true") {
        return true
    } else if (var1 == "false") {
        return false
    }
    var operator = param[1]
    var var2 = engine.evalNum(param[2])
    var test = {
        '>': function(a, b) {
            return a > b
        },
        'bigger': function(a, b) {
            return a > b
        },
        'greater': function(a, b) {
            return a > b
        },
        '<': function(a, b) {
            return a < b
        },
        'smaller': function(a, b) {
            return a < b
        },
        'less': function(a, b) {
            return a < b
        },
        '>=': function(a, b) {
            return a >= b
        },
        '<=': function(a, b) {
            return a <= b
        },
        '==': function(a, b) {
            return a == b
        },
        'equal': function(a, b) {
            return a == b
        },
        '=': function(a, b) {
            return a == b
        }
    }
    return test[operator](var1, var2)
}

engine.showPicture = function(param) {
    var picture = {}
    picture["image"] = param[0]
    picture["position"] = [param[1], param[2]]
    if(param[3]=="sys"){
        picture["sys"] = true
    }
    screen.pictureStack.push(picture)
}

engine.stopPicture = function(param) {
    screen.clearPicture()
}

engine.charAutoDelete = function(param, charatodel) {
    var k = -2
    for (var i = 0; i < chars.length; i++) {
        if (chars[i] == charatodel) {
            k = i
            break
        }
    }

    if (chars[k] != engine.player) {
        chars.splice(k, 1);
    }
}

engine.questionBox = function(param) {
    var answers = {}
    engine.questionBoxAnswer = engine.questionBoxUndef
    if (!(typeof engine.questionBoxMenu === "undefined")) {
        engine.questionBoxMenu.mdelete()
    }

    for (var i = 0; i < param.length; i++) {
        (function(i) {
            answers[param[i]] = {
                action: [function() {
                    engine.questionBoxAnswer = i;
                    engine.questionBoxAnswerStr = param[i]
                }, 'exit'],
                index: i
            };
        })(i);
    }
    engine.questionBoxMenu = new menu(answers, undefined, true)
    menus.setParent(engine.questionBoxMenu)
    menus.setAllDrawables()
    engine.questionBoxMenu.activate()
}

engine.proceedBattleTurn = function(param) {
    battle.waitherodecision = false
}

engine.changePlayerAnimation = function(param){
    var animation = param[0]
    if(param[0]=='default'){
        player.curr_animation = false
    } else {
        player.curr_animation = param[0]
    }
}

engine.alert = function(param) {
    var textalert = actions.preText(param[0])
    var textlife = 60
    for (var i = 0; i < engine.alertStack.length; i++) {
        if (engine.alertStack[i][0] == textalert) {
            engine.alertStack[i][1] += textlife
            return
        }
    }
    engine.alertStack.push([textalert, textlife])
}

engine.alertupdate = function() {
    if (engine.alertStack.length > 0) {
        for (var i = 0; i < engine.alertStack.length; i++) {
            engine.alertStack[i][1]--
        }
        engine.alertStack.sort(function(a, b) {
            return a[1] - b[1]
        })
        if (engine.alertStack[0][1] <= 0) {
            engine.alertStack.pop()
        }
    }
}

engine.translateActions = function(action, param, position, charsender) {
    actions[action](param, position, charsender)
};

engine.update = function(frameCount) {
    engine.frameCount = frameCount;
};
