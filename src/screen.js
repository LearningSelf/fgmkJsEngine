// screen.js
//  This code defines the biggest chunk of how things are draw
// in the canvas. This code is gigantic, it should be split
// somehow, but I have no idea how.
//  The screen.loop defines the drawing order of everything.
// depends on camera.js

printBox = {};
printBox.show = function() {
    screen.printBox.targetFrame = 0
    screen.printBox.anim = 'fadeIn'
}

printBox.isShown = function() {
    if (screen.printBox.anim == 'box') {
        return true
    } else {
        return false
    }
}

printBox.close = function() {
    screen.printBox.targetFrame = screen.printBox.frameMax
    screen.printBox.anim = 'fadeOut'
};


var screen = {};
screen.paused = false;
screen.WIDTH = 416;
screen.HEIGHT = 704;
screen.GWIDTH = screen.WIDTH;
screen.GHEIGHT = screen.WIDTH;
screen.GSTARTX = 0;
screen.GSTARTY = 0;
screen.RATIO = null;
screen.currentWidth = null;
screen.currentHeight = null;
screen.canvas = null;
screen.ctx = null;
screen.frameCount = 0;
screen.timer = null;
screen.engine = null;
screen.mobile = false;

screen.setEngine = function(engine) {
    this.engine = engine;
}

screen.drawChara = function(charaset, animation, frameNumber, position) {
    if (position[0] < this.GSTARTX - 32 || position[0] > this.GWIDTH + 32 || position[1] < this.GSTARTY - 64 || position[1] > this.GHEIGHT + 64) {
        return
    }

    screen.ctx.drawImage(charaset,
        32 * animation[frameNumber][0], 64 * animation[frameNumber][1],
        32, 64,
        this.GSTARTX + position[0], this.GSTARTY + position[1],
        32, 64);
}

screen.drawText = function(text, posx, posy, size) {
    size = (typeof size === "undefined") ? 2 : size;
    textBuffer.drawText(text, posx, posy, size);
}

screen.drawTile = function(tileset, tile, position) {
    screen.ctx.drawImage(tileset,
        32 * tile[0], 32 * tile[1], 32, 32,
        this.GSTARTX + position[0], this.GSTARTY + position[1], 32, 32);
}

screen.drawImage = function(image, position) {
    screen.ctx.drawImage(image, this.GSTARTX + position[0], this.GSTARTY + position[1])
}

screen.drawFace = function(faceset, tile, position, multiplix) {
    multiplix = (typeof multiplix === "undefined") ? 2 : multiplix;
    screen.ctx.drawImage(faceset,
        64 * tile[0], 64 * tile[1], 64, 64,
        this.GSTARTX + position[0], this.GSTARTY + position[1], 64 * multiplix, 64 * multiplix);
}

screen.flashMonster = function(monster, color) {
    monster.flashcolor = color
    monster.flash = 10
}

screen.shakeMonster = function(monster) {
    monster.shake = 10
}

screen.drawMonster = function(monster, position) {
    var tempalpha = screen.ctx.globalAlpha;
    var modx = 0
    var mody = 0

    if (monster.dead) {
        return
    }

    if (monster.selected && monster.flash == 0) {
        screen.flashMonster(monster, '#111111')
    }
    if (monster.shake > 0) {
        monster.shake--
            modx = Math.floor(8 * Math.random()) * 4
        mody = Math.floor(8 * Math.random()) * 4
    }

    if (monster.flash > 0) {

        screen.ctx.drawImage(screen.flashColor(resources.monsterimg, monster.flashcolor),
            64 * monster.monsterImg[0], 64 * monster.monsterImg[1],
            64, 64,
            this.GSTARTX + position[0] + modx, this.GSTARTY + position[1] + mody,
            128, 128);

        screen.ctx.globalAlpha = 1 * monster.flash / 10;

        monster.flash--

    }

    screen.ctx.drawImage(resources.monsterimg,
        64 * monster.monsterImg[0], 64 * monster.monsterImg[1],
        64, 64,
        this.GSTARTX + position[0] + modx, this.GSTARTY + position[1] + mody,
        128, 128);

    screen.ctx.globalAlpha = tempalpha

    screen.ctx.fillStyle = '#ffffff';
    screen.drawText("hp:" + monster.hp, position[0], position[1] - 32);
    screen.drawText(" /" + monster.hpmax, position[0], position[1] - 8);
}

screen.flashColor = function(fg, color) {
    // create offscreen buffer,
    var buffer = document.createElement('canvas');
    buffer.width = fg.width;
    buffer.height = fg.height;
    var bx = buffer.getContext('2d');

    // fill offscreen buffer with the tint color
    bx.fillStyle = color
    bx.fillRect(0, 0, buffer.width, buffer.height);

    // destination atop makes a result with an alpha channel identical to fg, but with all pixels retaining their original color *as far as I can tell*
    bx.globalCompositeOperation = "destination-atop";
    bx.drawImage(fg, 0, 0);

    return buffer
}

screen.init = function() {

    window.addEventListener('resize', screen.resize, false);
    window.addEventListener('orientationchange', screen.resize, false);
    this.RATIO = this.WIDTH / this.HEIGHT;
    this.mobile = window.mobilecheck();
    this.currentWidth = this.WIDTH;
    this.currentHeight = this.HEIGHT;
    this.canvas = document.getElementsByTagName('canvas')[0];
    this.canvas.width = this.WIDTH;
    this.canvas.height = this.HEIGHT;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.font = '32px INFO56';
    this.ORIGINALGSTARTX = this.GSTARTX
    this.ORIGINALGSTARTY = this.GSTARTY
    this.resize();
    screen.HIDcsetup();

    this.pictureStack = new Array();

    this.ua = navigator.userAgent.toLowerCase();
    this.android = this.ua.indexOf('android') > -1 ? true : false;
    this.ios = (this.ua.indexOf('iphone') > -1 || this.ua.indexOf('ipad') > -1) ? true : false;
    window.addEventListener('load', screen.init, false);

    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;
    this.ctx.imageSmoothingEnabled = false;

    addEvent(window, "resize", function() {
        screen.resize()
    });

    (function() {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||
                window[vendors[x] + 'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function() {
                        callback(currTime + timeToCall);
                    },
                    timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
    }());

    screen.rains = new rain(this.ctx, this.GWIDTH, this.GHEIGHT, screen)

    screen.requestAnimationFrame = window.requestAnimationFrame
}

screen.resize = function() {
    screen.ctx.mozImageSmoothingEnabled = false;
    screen.ctx.webkitImageSmoothingEnabled = false;
    screen.ctx.msImageSmoothingEnabled = false;
    screen.ctx.imageSmoothingEnabled = false;

    if (screen.mobile) {
        this.currentHeight = window.innerHeight;
        this.currentWidth = this.currentHeight * this.RATIO;
        if(window.innerWidth < this.currentWidth){
            this.currentWidth = window.innerWidth;
            this.currentHeight = this.currentWidth  / this.RATIO;
        }
    } else {
        if(window.innerHeight > 0.8*window.innerWidth){
            this.GHEIGHT = 416;

            this.currentWidth = window.innerWidth * this.WIDTH / this.GWIDTH
            this.currentHeight = this.currentWidth  / this.RATIO;
        } else  if(window.innerHeight > 0.6*window.innerWidth){
            this.GHEIGHT = 352; //was 288

            this.currentHeight = window.innerHeight * this.HEIGHT / this.GHEIGHT
            this.currentWidth = this.currentHeight * this.RATIO;
        } else {
            this.GHEIGHT = 256; //was 288

            this.currentHeight = window.innerHeight * this.HEIGHT / this.GHEIGHT
            this.currentWidth = this.currentHeight * this.RATIO;
        }

    }
    screen.printBox.setSize()
    camera.setupCanvas()

    if (this.android || this.ios) {
        document.body.style.height = (window.innerHeight + 50) + 'px';
    }

    screen.canvas.style.width = this.currentWidth + 'px';
    screen.canvas.style.height = this.currentHeight + 'px';

    window.setTimeout(function() {
        window.scrollTo(0, 1);
    }, 1);
}

screen.drawButton = function(pHIDItem) {
    if(!(screen.mobile)){ return }

    if (pHIDItem.active) {
        this.ctx.fillStyle = '#ff9900';
        this.ctx.fillRect(pHIDItem.mapX, pHIDItem.mapY + this.GHEIGHT, 96, 96);
    }
}

screen.drawHID = function() {
    if(screen.mobile){

        this.ctx.drawImage(screen.HIDButtons, 0, screen.GHEIGHT)

        var HIDItem;
        for (var tag in HID.inputs) {
            HIDItem = HID.inputs[tag];
            screen.drawButton(HIDItem)
        }
    } else {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, screen.GHEIGHT,screen.GWIDTH,screen.HEIGHT-screen.GHEIGHT)
    }
}

screen.HIDcsetup = function() {
    function blendColors(c0, c1, p) {
      var f=parseInt(c0.slice(1),16),t=parseInt(c1.slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF,R2=t>>16,G2=t>>8&0x00FF,B2=t&0x0000FF;
      return "#"+(0x1000000+(Math.round((R2-R1)*p)+R1)*0x10000+(Math.round((G2-G1)*p)+G1)*0x100+(Math.round((B2-B1)*p)+B1)).toString(16).slice(1);
    }
    screen.HIDButtons = document.createElement('canvas');
    screen.HIDButtons.width = screen.WIDTH;
    screen.HIDButtons.height = screen.HEIGHT - screen.GHEIGHT;
    var hx = screen.HIDButtons.getContext('2d');
    hx.fillStyle = '#221F1B';
    hx.fillRect(0, 0, screen.HIDButtons.width, screen.HIDButtons.height);

    var HIDItem;
    for (var tag in HID.inputs) {
        HIDItem = HID.inputs[tag];

        hx.fillStyle = HIDItem.color;
        hx.fillRect(HIDItem.mapX, HIDItem.mapY, 96, 96);
        png_font.ctx = hx;
        png_font.drawText(HIDItem.letter, [HIDItem.mapX + 32, HIDItem.mapY + 8],blendColors('#FFFFFF',HIDItem.color,0.5),4,'#221100');

    }

}

screen.clearAll = function() {
    //this.ctx.fillStyle = '#a0a7b9';
    if(!(debug.showLayer.layer1)){
        this.ctx.clearRect(this.GSTARTX, this.GSTARTY, this.GWIDTH, this.GHEIGHT);
    }
}


screen.printBox = {

  setSize: function() {
      this.Width = screen.GWIDTH;
      this.Height = 96;
      this.X = 0;
      this.Y = screen.GHEIGHT - this.Height;
      this.aSizex = [32, 64, 128, this.Width, this.Width];
      this.aSizey = [32, 32, 48, 48, this.Height];
      this.anim = 'none';
      this.frameMax = this.aSizex.length - 1;
      this.targetFrame = this.frameMax;
  },

    setup: function(imgPrintSet) {
        this.imgPrintSet = imgPrintSet;
        this.setSize()
    },

    printSet: {
      background: { x: 0, y: 0, sizex: 64, sizey: 64 },
      topLeftBox: { x: 64, y: 0, sizex: 16, sizey: 16 },
      topRightBox: { x: 112, y: 0, sizex: 16, sizey: 16 },
      bottomLeftBox: { x: 64, y: 48, sizex: 16, sizey: 16 },
      bottomRightBox: { x: 112, y: 48, sizex: 16, sizey: 16 },
      LeftBox: { x: 64, y: 16, sizex: 16, sizey: 32 },
      RightBox: { x: 112, y: 16, sizex: 16, sizey: 32 },
      TopBox: { x: 80, y: 0, sizex: 32, sizey: 16 },
      BottomBox: { x: 80, y: 48, sizex: 32, sizey: 16 },
      acceptUp: { x: 0, y: 64, sizex: 16, sizey: 16 },
      acceptDown: { x: 16, y: 64, sizex: 16, sizey: 16 },
      upArrow: { x: 64, y: 64, sizex: 32, sizey: 16 },
      downArrow: { x: 64, y: 80, sizex: 32, sizey: 16 }
    },
    printSet_05: {
        background: { x: 0, y: 0, sizex: 64, sizey: 64 },
        topLeftBox: { x: 160, y: 64, sizex: 8, sizey: 8 },
        topRightBox: { x: 184, y: 64, sizex: 8, sizey: 8 },
        bottomLeftBox: { x: 160, y: 88, sizex: 8, sizey: 8 },
        bottomRightBox: { x: 184, y: 88, sizex: 8, sizey: 8 },
        LeftBox: { x: 160, y: 72, sizex: 8, sizey: 16 },
        RightBox: { x: 184, y: 72, sizex: 8, sizey: 16 },
        TopBox: { x: 168, y: 64, sizex: 16, sizey: 8 },
        BottomBox: { x: 168, y: 88, sizex: 16, sizey: 8 },
        acceptUp: { x: 0, y: 64, sizex: 16, sizey: 16 },
        acceptDown: { x: 16, y: 64, sizex: 16, sizey: 16 },
        upArrow: { x: 64, y: 64, sizex: 32, sizey: 16 },
        downArrow: { x: 64, y: 80, sizex: 32, sizey: 16}
    },

    getIcon: function(i) {
       return {x:parseInt(i%4)*64,
               y:parseInt(Math.floor(i/4))*64+96,
               sizex: 64,
               sizey: 64}
    },

    drawButtonAccept: function() {
        var frame = Math.floor(screen.frameCount / 4) % 2
        if (frame == 0) {
            var accept = this.printSet.acceptUp
        } else {
            var accept = this.printSet.acceptDown
        }
        screen.ctx.drawImage(imgPrintSet,
            accept['x'], accept['y'],
            accept['sizex'], accept['sizey'],
            screen.GSTARTX + screen.GWIDTH - 32, screen.GSTARTY + screen.GHEIGHT - 32, accept['sizex'], accept['sizey'])
    },

    drawElement: function(element, x, y, sizex, sizey, imgPrintSet, select, size, ctx) {
        size = (typeof size === "undefined") ? 2 : size;
        select = (typeof select === "undefined") ? 0 : select;
        ctx = (typeof ctx === "undefined") ? screen.ctx : ctx;
        ctx.drawImage(imgPrintSet,
            element['x'] + select * 32 * size, element['y'],
            element['sizex'], element['sizey'],
            screen.GSTARTX + x, screen.GSTARTY + y, sizex, sizey);
    },

    drawBoxAnimation: function() {
        if (this.anim == 'none') {
            return
        } else if (this.anim == 'box') {
            this.targetFrame = this.frameMax
        } else if (this.anim == 'fadeIn') {
            if (this.targetFrame < this.frameMax)
                this.targetFrame++
                else {
                    this.anim = 'box'
                    this.targetFrame = this.frameMax
                }
        } else if (this.anim == 'fadeOut') {
            if (this.targetFrame > 0)
                this.targetFrame--
                else {
                    this.anim = 'none'
                    return
                }
        }

        screen.printBox.drawBox(Math.floor(screen.printBox.X + screen.printBox.Width / 2 - this.aSizex[this.targetFrame] / 2),
            Math.floor(screen.printBox.Y + screen.printBox.Height / 2 - this.aSizey[this.targetFrame] / 2),
            this.aSizex[this.targetFrame],
            this.aSizey[this.targetFrame]);
        if (this.anim == 'box') {
            this.drawButtonAccept()
        }

    },

    drawArrow: function(upordown,x,y){
        var imgPrintSet = screen.printBox.imgPrintSet;
        var arrow = screen.printBox.printSet.upArrow
        if(upordown=='down'){
            arrow = screen.printBox.printSet.downArrow
        }

        screen.printBox.drawElement(arrow, x, y, arrow.sizex, arrow.sizey, imgPrintSet)
    },

    drawBox: function(x, y, sizex, sizey, select,size, ctx) {
        select = (typeof select === "undefined") ? 0 : select;
        size = (typeof size === "undefined") ? 2 : size;
        ctx = (typeof ctx === "undefined") ? screen.ctx : ctx;

        imgPrintSet = screen.printBox.imgPrintSet;


        if(size==2){
          var s = screen['printBox']['printSet']
        } else {
          var s = screen['printBox']['printSet_05']
        }

        if (select == 0) {
            screen.printBox.drawElement(s['background'], x, y, sizex, sizey, imgPrintSet,0,2,ctx);
        }
        screen.printBox.drawElement(s['topLeftBox'], x, y, s['topLeftBox']['sizex'], s['topLeftBox']['sizey'], imgPrintSet, select, size,ctx);
        screen.printBox.drawElement(s['TopBox'],
            x + s['topLeftBox']['sizex'], y,
            sizex - s['topLeftBox']['sizex'] - s['topRightBox']['sizex'], s['TopBox']['sizey'],
            imgPrintSet, select, size,ctx);
        screen.printBox.drawElement(s['topRightBox'],
            x + sizex - s['topRightBox']['sizex'], y,
            s['topRightBox']['sizex'], s['topRightBox']['sizey'],
            imgPrintSet, select, size,ctx);

        screen.printBox.drawElement(s['LeftBox'],
            x, y + s['topLeftBox']['sizey'],
            s['LeftBox']['sizex'], sizey - s['topLeftBox']['sizey'] - s['bottomLeftBox']['sizey'],
            imgPrintSet, select, size,ctx);
        screen.printBox.drawElement(s['RightBox'],
            x + sizex - s['topRightBox']['sizex'], y + s['topRightBox']['sizey'],
            s['RightBox']['sizex'], sizey - s['topRightBox']['sizey'] - s['bottomRightBox']['sizey'],
            imgPrintSet, select, size,ctx);

        screen.printBox.drawElement(s['bottomLeftBox'],
            x, y + sizey - s['bottomLeftBox']['sizey'],
            s['bottomLeftBox']['sizex'], s['bottomLeftBox']['sizey'],
            imgPrintSet, select, size,ctx);
        screen.printBox.drawElement(s['BottomBox'],
            x + s['bottomLeftBox']['sizex'], y + sizey - s['bottomRightBox']['sizey'],
            sizex - s['bottomLeftBox']['sizex'] - s['bottomRightBox']['sizex'], s['BottomBox']['sizey'],
            imgPrintSet, select, size,ctx);
        screen.printBox.drawElement(s['bottomRightBox'],
            x + sizex - s['bottomRightBox']['sizex'], y + sizey - s['bottomRightBox']['sizey'],
            s['bottomRightBox']['sizex'], s['bottomRightBox']['sizey'],
            imgPrintSet, select, size,ctx);

    }

}

screen.effectPixelize2 = function(pixelation) {

    var imageData = this.ctx.getImageData(this.GSTARTX, this.GSTARTY, this.GWIDTH, this.GHEIGHT);
    var data = imageData.data;

    for (var y = 0; y < this.GHEIGHT; y += pixelation) {
        for (var x = 0; x < this.GWIDTH; x += pixelation) {
            var red = data[((this.GWIDTH * y) + x) * 4];
            var green = data[((this.GWIDTH * y) + x) * 4 + 1];
            var blue = data[((this.GWIDTH * y) + x) * 4 + 2];

            for (var n = 0; n < pixelation; n++) {
                for (var m = 0; m < pixelation; m++) {
                    if (x + m < this.GWIDTH) {
                        data[((this.GWIDTH * (y + n)) + (x + m)) * 4] = red;
                        data[((this.GWIDTH * (y + n)) + (x + m)) * 4 + 1] = green;
                        data[((this.GWIDTH * (y + n)) + (x + m)) * 4 + 2] = blue;
                    }
                }
            }
        }
    }
    this.ctx.putImageData(imageData, 0, 0)
};

screen.effectPixelize = function(pixelation) {
    this.ctx.drawImage(this.canvas, this.GSTARTX, this.GSTARTY, this.GWIDTH, this.GHEIGHT, this.GSTARTX, this.GSTARTY, pixelation, pixelation)
    this.ctx.drawImage(this.canvas, this.GSTARTX, this.GSTARTY, pixelation, pixelation, this.GSTARTX, this.GSTARTY, this.GWIDTH, this.GHEIGHT)
};

screen.effectTension1 = function(intensity) {
    this.ctx.drawImage(this.canvas, this.GSTARTX, this.GSTARTY,
        Math.floor(this.GWIDTH / 2), this.GHEIGHT,
        Math.floor(this.GSTARTX - (this.GWIDTH * intensity / 128) / 2), this.GSTARTY,
        Math.floor(this.GWIDTH / 4), this.GHEIGHT)

    this.ctx.drawImage(this.canvas, this.GSTARTX + this.GWIDTH / 2, this.GSTARTY,
        Math.floor(this.GWIDTH / 2), this.GHEIGHT,
        Math.floor(this.GSTARTX + this.GWIDTH / 2 + (this.GWIDTH * intensity / 128) / 2), this.GSTARTY,
        Math.floor(this.GWIDTH / 4), this.GHEIGHT)

    this.ctx.fillStyle = '#000000'
    this.ctx.fillRect(Math.floor(this.GSTARTX + this.GWIDTH / 2 - (this.GWIDTH * intensity / 128) / 2),
        this.GSTARTY,
        Math.floor(this.GWIDTH * intensity / 128),
        this.GHEIGHT);
};

screen.effectColor = function(opacity, color) {
    this.ctx.save()
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = opacity;
    this.ctx.fillRect(this.GSTARTX, this.GSTARTY, this.GWIDTH, this.GHEIGHT);
    this.ctx.restore()
};

screen.shakeEffect = function() {
    if (this.shaking) {
        if (this.shakes > 0) {
            this.shakes--

                if (this.shaking == 'h') {
                    this.GSTARTX = Math.floor(16 * Math.sin(3 * this.shakes / 4) * this.shakes / 16) + this.ORIGINALGSTARTX
                } else {
                    this.GSTARTY = Math.floor(16 * Math.sin(3 * this.shakes / 4) * this.shakes / 16) + this.ORIGINALGSTARTY
                }

        } else if (this.shakes == 0) {
            this.shakes--
                this.GSTARTX = this.ORIGINALGSTARTX
            this.GSTARTY = this.ORIGINALGSTARTY
            this.shaking = false
        }
    }
}

screen.shakeScreen = function(horv) {
    horv = (typeof horv === "undefined") ? 'h' : horv;
    screen.shakes = (typeof screen.shakes === "undefined") ? 0 : screen.shakes
    screen.shakes += 16

    if (horv == 'h') {
        screen.shaking = 'h'
    } else {
        screen.shaking = 'v'
    }
}


screen.effects = {
    selected: null,
    startFrame: 0,
    endFrame: 0,
    intensity: [8, 16, 24, 32, 48, 64, 128],
    keepAfter: false,
    fadeIn: function(params) {
        var changeEffect = params[0]
        var shouldKeepAfter = params[1]
        screen.effects.startFrame = screen.frameCount;
        screen.effects.endFrame = screen.effects.intensity.length;
        screen.effects.selected = changeEffect;
        if (shouldKeepAfter == "keepEffect")
            screen.effects.keepAfter = true;
        else
            screen.effects.keepAfter = false;
    },
    fadeOut: function(params) {
        var changeEffect = params[0]
        var shouldKeepAfter = params[1]
        screen.effects.startFrame = screen.frameCount;
        screen.effects.endFrame = screen.effects.intensity.length;
        screen.effects.selected = changeEffect;
        if (shouldKeepAfter == "keepEffect") {
            screen.effects.keepAfter = true;
        } else
            screen.effects.keepAfter = false;
    },
    noEffect: function() {
        screen.effects.selected = null;
    }
};

screen.drawEffects = function() {
    if (screen.effects.selected == null) {
        return
    }
    if (screen.effects.selected == 'pixelizeFadeIn') {
        var frameToDraw = screen.frameCount - screen.effects.startFrame
        if (frameToDraw >= screen.effects.endFrame) {
            frameToDraw = screen.effects.endFrame - 1
            if (!screen.effects.keepAfter) {
                screen.effects.noEffect()
            }
        }
        screen.effectPixelize(screen.effects.intensity[frameToDraw])
    }
    if (screen.effects.selected == 'pixelizeFadeOut') {
        var frameToDraw = screen.effects.endFrame - screen.frameCount + screen.effects.startFrame
        if (frameToDraw <= 0) {
            frameToDraw = 0
            if (!screen.effects.keepAfter) {
                screen.effects.noEffect()
            }
        }
        screen.effectPixelize(screen.effects.intensity[frameToDraw])
    }
    if (screen.effects.selected == 'blackFadeOut') {
        var frameToDraw = screen.frameCount - screen.effects.startFrame
        if (frameToDraw >= screen.effects.endFrame) {
            frameToDraw = screen.effects.endFrame - 1
            if (!screen.effects.keepAfter) {
                screen.effects.noEffect()
            }
        }
        screen.effectColor(screen.effects.intensity[frameToDraw] / 128, '#000000')
    }
    if (screen.effects.selected == 'blackFadeIn') {
        var frameToDraw = screen.effects.endFrame - screen.frameCount + screen.effects.startFrame
        if (frameToDraw <= 0) {
            frameToDraw = 0
            if (!screen.effects.keepAfter) {
                screen.effects.noEffect()
            }
        }
        screen.effectColor(screen.effects.intensity[frameToDraw] / 128, '#000000')
    }
    if (screen.effects.selected == 'whiteFadeOut') {
        var frameToDraw = screen.frameCount - screen.effects.startFrame
        if (frameToDraw >= screen.effects.endFrame) {
            frameToDraw = screen.effects.endFrame - 1
            if (!screen.effects.keepAfter) {
                screen.effects.noEffect()
            }
        }
        screen.effectColor(screen.effects.intensity[frameToDraw] / 128, '#FFFFFF')
    }
    if (screen.effects.selected == 'whiteFadeIn') {
        var frameToDraw = screen.effects.endFrame - screen.frameCount + screen.effects.startFrame
        if (frameToDraw <= 0) {
            frameToDraw = 0
            if (!screen.effects.keepAfter) {
                screen.effects.noEffect()
            }
        }
        screen.effectColor(screen.effects.intensity[frameToDraw] / 128, '#FFFFFF')
    }
    if (screen.effects.selected == 'tension1') {
        var frameToDraw = screen.frameCount - screen.effects.startFrame - 1
        if (frameToDraw >= screen.effects.endFrame) {
            frameToDraw = screen.effects.endFrame - 1
            if (!screen.effects.keepAfter) {
                screen.effects.noEffect()
            }
        }
        screen.effectTension1(screen.effects.intensity[frameToDraw])
    }
};

screen.drawMonsters = function() {
    for (var i = 0; i < battle.monster.length; i++) {
        screen.drawMonster(battle.monster[i], [Math.floor((i + 1) * screen.GWIDTH / (battle.monster.length + 1) - 64),
            Math.floor(screen.GHEIGHT / 3)
        ])

    }
}

screen.drawMenu = function(menu) {
    var maxOnScreen = menu.maxOnScreen
    var maxItems = menu.itemsLength
  //  var maxItemStringLength = menu.maxItemStringSize()
    var selectedIndex = menu.selectedItem.index

    if (typeof menu.firstItem === "undefined"){
        menu.firstItem = 0
        menu.finalItem = Math.min(maxItems,maxOnScreen)
    }

    if(selectedIndex >= menu.finalItem){
        menu.finalItem = selectedIndex+1
        menu.firstItem = menu.finalItem - maxOnScreen
    } else if (selectedIndex < menu.firstItem) {
        menu.firstItem = selectedIndex
        menu.finalItem = menu.firstItem + maxOnScreen
    }

    if(!(menu.wait)){
        if(menu.finalItem < maxItems){
           screen.printBox.drawArrow('down', menu['drawx']+menu['width']-32,menu['drawy']+menu['height']+16)
        }
        if(menu.firstItem > 0){
           screen.printBox.drawArrow('up', menu['drawx']+menu['width']-32,menu['drawy']+menu['height'])
        }
    }

    screen.printBox.drawBox(menu['drawx'], menu['drawy'],
                            menu['width'], menu['height'],
                            0,
                            menu.menuScale);

    var k=0;
    for (var i = menu.firstItem; i < menu.finalItem; i += 1) {
        if (menu.items[Object.keys(menu.items)[i]].selected) {
            if (menu.wait) {
                screen.printBox.drawBox(menu['drawx'] + 4*menu.menuScale,
                    menu['drawy'] + 8 + menu.fontHeight * k,
                    menu['width'] - 8*menu.menuScale,
                    16*menu.menuScale,
                    1,
                    menu.menuScale);
            } else {
                screen.printBox.drawBox(menu['drawx'] + 4*menu.menuScale,
                    menu['drawy'] + 8 + menu.fontHeight * k,
                    menu['width'] - 8*menu.menuScale,
                    16*menu.menuScale,
                    1 + Math.floor(screen.frameCount / 4) % 2,
                    menu.menuScale);
            }

            if (isInt(menu.items[Object.keys(menu.items)[i]].icon)) {
                var imgPrintSet = screen.printBox.imgPrintSet;
                var icon = screen.printBox.getIcon(menu.items[Object.keys(menu.items)[i]].icon)

                screen.printBox.drawBox(menu['drawx'] + menu['width'],
                    menu['drawy'],
                    icon.sizex + 16,
                    icon.sizey + 16,
                    0);
                screen.printBox.drawElement(icon, menu['drawx'] + menu['width'] + 8, menu['drawy'] + 8, icon.sizex, icon.sizey, imgPrintSet, 0)
            }

        }
        screen.drawText(Object.keys(menu.items)[i], menu['drawx'] + 16, menu['drawy'] + 32+k*menu.fontHeight, menu.menuScale);
        k+=1;
    }

}

screen.drawStatus = function(heroch) {
    var hero = heroch
    var statx = engine.mapMenu.drawx + engine.mapMenu.width;
    var staty = engine.mapMenu.drawy ;
    var statw = screen.GWIDTH - 8 -(engine.mapMenu.drawx + engine.mapMenu.width);
    var stath = screen.GHEIGHT - 16

    screen.printBox.drawBox(statx,
        staty,
        statw,
        stath,
        0,
        2);
    screen.drawFace(resources.faceset, heroch.face, [statx + 112, staty + 16])
    var stats =  heroch.name + "\n" +
                "st: " + heroch.st + "\n" +
                "dx: " + heroch.dx + "\n" +
                "iq: " + heroch.iq + "\n" +
                "hp: " + heroch.hp + "/" + heroch.hpmax + "\n" +
                "level: " + heroch.level + "\n" +
                "xp: "+heroch.xp+ "/" +  heroch.xpnextlevel+"\n" ;
    screen.drawText(stats,statx+8,staty+8+24,2);
    screen.printBox.drawButtonAccept()
}

screen.showpicture = function() {
    if (screen.pictureStack.length > 0) {
        for (var i = 0; i < screen.pictureStack.length; i += 1) {
            if(screen.pictureStack[i].sys){
                screen.drawImage(resources.syspictures[screen.pictureStack[i].image],
                    screen.pictureStack[i].position)
            } else {
                screen.drawImage(resources.pictures[screen.pictureStack[i].image],
                    screen.pictureStack[i].position)
            }

        }
    }
}

screen.clearPicture = function() {
    for (var member in screen.pictureStack) delete screen.pictureStack[member]

    screen.pictureStack.length = 0
}

screen.drawAlert = function(text, index) {
    var xpos = Math.floor(screen.GWIDTH/2-text.length*8);
    screen.drawText(text, xpos, index * 32 + 32);
}

screen.drawAlerts = function() {
    for (var i = 0; i < engine.alertStack.length; i++) {
        screen.drawAlert(engine.alertStack[i][0], i)
    }
}

screen.loop = function() {

        // draw
        screen.frameCount += 1;
        screen.clearAll();

        if (!screen.paused) {

            // update
            screen.shakeEffect()

            if (engine.state == "map") {
                if (debug.showLayer.layer1)
                    camera.drawMapLayer(engine.currentLevel, "layer1");

                if (debug.showLayer.layer2)
                    camera.drawMapLayer(engine.currentLevel, "layer2");

                if (debug.showLayer.layer3)
                    camera.drawSprites();
                //camera.drawChar(player);

                if (debug.showLayer.layer4)
                    camera.drawMapLayer(engine.currentLevel, "layer4");
                screen.rains.DrawRain();
            } else if (engine.state == "startScreen") {
                //do start screen stuff
            } else if (engine.state == "battle") {
                dist.updateBgEffect(dist.efnumb[0])
                screen.drawMonsters()
            }

            screen.showpicture();
            screen.drawEffects();
            screen.drawHID();


            var allMenusLenght = menus.allMenus.length
            for (var menuToDraw=allMenusLenght-1 ; menuToDraw>=0;menuToDraw--) {
                if (menus.allMenus[menuToDraw].enabled) {
                    screen.drawMenu(menus.allMenus[menuToDraw]);
                }
            }

            if (battle.herotoshowstatus) {
                screen.drawStatus(battle.herotoshowstatus)
            }
            screen.printBox.drawBoxAnimation();
            screen.drawAlerts();

            // updates
            printer.update();


        }

        debug.FPS.draw();
        //screen.timer = setTimeout("screen.loop()", 1000/60.0); dropped..
        screen.requestAnimationFrame.call(window, screen.loop)

}

debug = {};

debug.showLayer = {
    layer1: true,
    layer2: true,
    layer3: true,
    layer4: true
};

debug.FPS = {
    counter: 0,
    FPS: 0,
    show: false,
    draw: function() {
        this.counter += 1;
        if (this.show) {
            screen.drawText(this.FPS.toString() + " fps", screen.GSTARTX + 2, screen.GSTARTY + 32);
        }
    },
    loop: function() {
        this.FPS = this.counter;
        this.counter = 0;
        this.timer = setTimeout("debug.FPS.loop()", 1000);
    }


}

// MIT LICENSE
// Copyright (c) 2016 Érico Vieira Porto
//
// Permission is hereby granted, free of charge, to any
// person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the
// Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute,
// sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// You can't claim ownership, use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell any software, images or
// documents that includes characters, assets, or story elements
// of the game distributed along with this engine.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.
