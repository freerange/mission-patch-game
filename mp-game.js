var mainGame = new Phaser.Class(function()
{
  //Base Variables
  var rootScene;
  var modeSelect;

  //Sprite Variables
  var background;
  var laptops;
  var stickers;
  var emotes;
  var tar;
  var particle1, particle2;

  //Sticker/Laptop/Background Integers
  var stickersAtOnce;
  var totalLaptopsToGet;
  var howManyLaptopsHaveStickers;
  var stickersLeft;
  var currentFrame;

  //Timer Variables
  var countdownTimer;
  var countdownSeconds;
  var countdownCheck;
  var timerText;

  //Text Variables
  var scoreText;
  var stickerText;

  //Game Over Variables
  var gameDelay;
  var gameOver = false;
  var modeAlreadyUnlocked = false;

return {
Extends: Phaser.Scene,

init: function(data)
{
  stickersAtOnce = data.stickersAtOnce;
  totalLaptopsToGet = data.totalLaptopsToGet;
  countdownSeconds = data.countdownSeconds;
  modeSelect = data.modeSelect;
},

create: function()
{

  gameDelay = null;


  howManyLaptopsHaveStickers = 0;

  stickersLeft = (modeSelect == 0) ? 20 : -1;

  //Game Background
  background = this.add.sprite(0, 0, 'office', '0001.png').setOrigin(0, 0);
  background.setScale(config.width/800, config.height/600);

  //Game Particles
  particle1 = this.add.particles('shapes',  new Function('return ' + this.cache.text.get('blast'))());
  particle1.emitters.list[0].on = false;

  particle2 = this.add.particles('shapes',  new Function('return '  + this.cache.text.get('celebration'))());
  particle2.emitters.list[0].on = false;

  particle3 = this.add.particles('shapes',  new Function('return '  + this.cache.text.get('results'))());
  particle3.emitters.list[0].on = false;

  //Launch Groups
  laptops = this.physics.add.group();
  stickers = this.physics.add.group();
  emotes = this.physics.add.group();

  //Collisions
  var lapColl = this.physics.add.collider(laptops, laptops);
  this.physics.add.overlap(laptops, stickers, hitLaptop, null, this);

  //Referenced for time and key press events
  var rootScene = this;

  //Always starts at 1
  var laptSpread = 1;

  function animateLaptop (laptop, key, duration, delay) {
    //Will animate if a certain laptop type is assigned
    if(laptop.texture.key == key) {
      laptop.setFrame(0);
      var laptopFrames = rootScene.anims.generateFrameNames(key, { start: 0, end: 3 });
      rootScene.anims.create({ key: 'open/close_' + laptop.data.values.laptopID, frames: laptopFrames, duration: duration, repeat: 0, yoyo: true });

      laptop.anims.play('open/close_' + laptop.data.values.laptopID);
      laptop.once('animationcomplete', ()=> {
        rootScene.time.addEvent(
        {
            delay: delay,
            callback: ()=> {
              laptop.anims.play('open/close_' + laptop.data.values.laptopID);
              var animTimer = rootScene.time.addEvent(
              {
                  delay: delay + duration,
                  loop: true,
                  callback: ()=> {
                    laptop.anims.play('open/close_' + laptop.data.values.laptopID);
                    if(countdownSeconds <= 0 || stickersLeft == 0 || laptop.data.values.hasSticker) {
                      animTimer.remove();
                    }
                  }
              });
            }
        });
      });
    }
  }

  function isLaptopTypeAnimated (laptop) {
    rootScene.time.addEvent(
    {
        delay: Phaser.Math.Between(0, 750),
        callback: ()=> {
          animateLaptop(laptop, 'laptop_1', 350, 750);
          animateLaptop(laptop, 'laptop_2', 750, 1000);
          animateLaptop(laptop, 'laptop_3', 500, 500);
          animateLaptop(laptop, 'laptop_4', 150, 500);
        }
    });
  }

  function generateLaptop (x, y, laptopMode, delayActive) {
    var laptop = laptops.create(x, y, 'laptop_' + Phaser.Math.Between(0, 4));
    laptop.setData({ laptopMode: laptopMode, hasSticker: false, delayActive: delayActive, laptopID: -1 });
    laptop.data.values.laptopID = laptops.children.entries.length - 1;
    if(laptop.frame.name != '__BASE') {
      laptop.body.setSize(157, 101).setOffset(47, 85);
    }

    return laptop;
  }

  function createMode0Laptop (laptop, bounce, mode) {
    var laptop = generateLaptop(Phaser.Math.Between(0, config.width), Phaser.Math.Between(0, config.height), mode, false);
    isLaptopTypeAnimated(laptop);

    var velX = (laptop.x > (config.width/2)) ? -1 : 1;
    var velY = (laptop.y > (config.height/2)) ? -1 : 1;
    laptop.setVelocity(Phaser.Math.Between(400, 600) * velX,
      Phaser.Math.Between(400, 600) * velY);
    laptop.setBounce(bounce);
    laptop.setScale(0.625 + Phaser.Math.FloatBetween(-0.125, 0.125));
    laptop.setCollideWorldBounds(true);
  }

  function randomBoolean() {
    return Phaser.Math.FloatBetween(0, 1) > 0.5;
  }

  function chooseLaptopStartPosition () {
    var posX, posY;

    //Locks Edge Position
    if(randomBoolean()) {
      posX = randomBoolean() ? config.width + 100 : -100;
      posY = Phaser.Math.Between(0,config.height);
    } else {
      posX = Phaser.Math.Between(0,config.width);
      posY = config.height + 50;
    }

    return { x: posX, y: posY };
  }

  function throwLaptop (laptop, pos, delay) {
    //Random delay before chucking
    var timer;
    rootScene.time.addEvent(
    {
      delay: delay - 750,                // ms
      callback: ()=> {
        var x, y;
        var readyPrompt = rootScene.add.sprite(0, 0, 'incoming').setOrigin(0, 0);

        if(pos.y > config.height) {
          y = pos.y - ((readyPrompt.height/2) + 50);
          x = Phaser.Math.Clamp(pos.x, readyPrompt.width/2, config.width - (readyPrompt.width/2))
        } else {
          y = Phaser.Math.Clamp(pos.y, readyPrompt.height/2, config.height - (readyPrompt.height/2));
          x = (pos.x > (config.width/2)) ? config.width - Math.floor(readyPrompt.width/2) : Math.floor(readyPrompt.width/2) - 50;
        }

        readyPrompt.setPosition(x, y);

        //Taken from example here https://codepen.io/yochans/pen/ZPaZGO
        rootScene.tweens.add({
          targets: readyPrompt,
          alpha: 0,
          duration: 750,
          ease: 'Circ'
        }, this);

        timer = rootScene.time.addEvent(
        {
          delay: 750,
          callback: ()=> {
            readyPrompt.destroy();
            isLaptopTypeAnimated(laptop);

            rootScene.sound.add('laptThrow', {
              volume: Phaser.Math.FloatBetween(0.2, 0.4),
              rate: 1.0 + Phaser.Math.FloatBetween(-0.1, 0.1)
            }).play();
            laptop.enableBody(true, pos.x, pos.y, true, true);
            laptop.data.values.delayActive = false;

            var velX = (laptop.x > (config.width/2)) ? -1 : 1;
            var velY = (laptop.y > (config.height/2)) ? -1.35 : -0.5;
            var velInfluence = Math.abs((x-((config.width-Math.floor(readyPrompt.width))/2))/(config.width/2));
            laptop.setVelocity(Phaser.Math.Between(300, 600) * (velX*velInfluence), Phaser.Math.Between(400, 600) * velY);
            laptop.setScale(1 + Phaser.Math.FloatBetween(0.0, 0.25));
          }
        });
      }
    });
  }

  function createMode1Laptop (laptop, bounce, mode) {
    //Sets up laptop
    var pos = chooseLaptopStartPosition();
    laptop = generateLaptop(pos.x, pos.y, mode, true);

    laptop.disableBody(true, true);



    var msPerLaptop = (countdownSeconds * 1000)/totalLaptopsToGet;
    var laptSetDelay = (msPerLaptop * laptSpread) + Phaser.Math.Between(-(msPerLaptop/2), (msPerLaptop/2));
    laptSetDelay = Phaser.Math.Clamp(laptSetDelay, 500, (countdownSeconds * 1000) - 1);

    throwLaptop(laptop, pos, laptSetDelay);
  }


  function createLaptop(laptop, bounce, mode)
  {
    // Mode 0 = Bouncing laptops
    if(mode == 0)
    {
      createMode0Laptop(laptop, bounce, mode);
    }
    //Mode 1 = Chuck mode
    else if(mode == 1)
    {
      createMode1Laptop(laptop, bounce, mode);
    }
    else
      console.log('The selected mode doesn\'t exist');
  }

  //No collision on chuck mode
  if(modeSelect == 1)
    lapColl.destroy();

  //Creates each laptop for game
  for(var i = 0; i < totalLaptopsToGet; i++)
  {
    var laptop;
    createLaptop(laptop, Phaser.Math.FloatBetween(0.95, 1.02), modeSelect);
    laptSpread++;
  }

  //Sets timer depending on countdown seconds
  countdownTimer = this.time.addEvent({ delay: countdownSeconds * 1000 });

  tar = this.physics.add.staticSprite(0, 0, 'target').setOrigin(0, 0);

  var stickersAvailable = 5;
  var stickerIndexes = []
  for(var i = 0; i < stickersAtOnce; i++) {
    stickerIndexes[i] = Phaser.Math.Between(1, stickersAvailable);
    while (stickerIndexes[i] == stickerIndexes[i-1]) {
      stickerIndexes[i] = Phaser.Math.Between(1, stickersAvailable);
    }
  }

  //Stickers are being prepped
  for(var i = 0; i < stickersAtOnce; i++)
  {
    stickers.create(0, 0, 'patch_' + stickerIndexes[i]);
    stickers.children.entries[i].setData({ patchSticking: false, currentLaptop: -1,
      lapDiffX: 0, lapDiffY: 0, stickerOnLaptop: false });
    stickers.children.entries[i].scale = 0.8;
    stickers.children.entries[i].setScale(stickers.children.entries[i].scale,
      stickers.children.entries[i].scale);
    stickers.children.entries[i].disableBody(true, true);


  }

  //Will follow movement of laptop relative to the position where the sticker hit the laptop
  function stickToLaptop (lapt, stick, index)
  {
    rootScene.sound.add('hit', {
      volume: 0.6,
      rate: 1.0 + Phaser.Math.FloatBetween(-0.15, 0.15)
    }).play();

    stick.data.values.currentLaptop = index;
    stick.data.values.lapDiffX = stick.x - lapt.x;
    stick.data.values.lapDiffY = stick.y - lapt.y;
    stick.body.setAllowGravity(false);

    particle1.emitters.list[0].on = true;

    particle1.emitters.list[0].startFollow(lapt);
  }

  function setUIText(x, y, text) {
    return rootScene.add.text(x, y, text, { fontFamily: "Saira Stencil One, Arial, Carrois Gothic SC", fontSize: '32px', fill: '#000' });
  }

  //UI Text
  scoreText = setUIText(16, 16, howManyLaptopsHaveStickers + ' out of ' + totalLaptopsToGet + ' Patched');
  timerText = setUIText(config.width - 190, 16, 'Timer: ' + (countdownSeconds - Math.floor(countdownTimer.getElapsedSeconds())));
  stickerText = (modeSelect == 0) ? setUIText(config.width - 240, 540, 'Stickers Left: ' + stickersLeft) : this.add.text(0, 0, '');

  stickerText.setPosition(config.width - (stickerText.width+20), config.height - (stickerText.height+20));

  for(var i = 0; i < 10; i++) {
    var emote = emotes.create(0, 0, 'emoji', 0);
    emote.setScale(0.35);
    emote.setPosition(40 + ((emote.width * emote.scaleX) * i), config.height - ((emote.height * emote.scaleY) + 20));
    emote.disableBody(true, false);
  }

  function laptopSuccessfullyHit (laptop, sticker, sensetivity) {
    sensetivity = Phaser.Math.Clamp(sensetivity, 0.0, 1.0);

    var stickerShrunk = sticker.scale <= 0.1 && sticker.data.values.patchSticking;
    var stickerHittingLaptop = Math.abs(sticker.x - laptop.x) < (laptop.width * sensetivity) && Math.abs(sticker.y - laptop.y) < (laptop.height * sensetivity);
    var stickerLaptopNotStuck = !sticker.data.values.stickerOnLaptop && !laptop.data.values.hasSticker;
    var correctLaptopFrame = laptop.frame.name == '__BASE' || laptop.frame.name == '0';

    return stickerShrunk && stickerHittingLaptop && stickerLaptopNotStuck && correctLaptopFrame;
  }

  //Overlap check for whether sticker clearly hit the laptop
  function hitLaptop (lapt, stick)
  {
    for(var i in stickers.children.entries)
    {
      //Will only check when sticker is at minimum size
      if(laptopSuccessfullyHit(lapt, stick, 0.5))
      {
            howManyLaptopsHaveStickers++;

            //Prevents overlapping laptops from counting if the sticker is already taken
            lapt.data.values.hasSticker = true;
            stick.data.values.stickerOnLaptop = true;

            //Checks for first overlapping laptop
            stickToLaptop(lapt, stick, lapt.data.values.laptopID);

            if(lapt.frame.name != '__BASE')
              rootScene.anims.remove('open/close_' + lapt.data.values.laptopID);

            //Makes laptops stop and fall in bouncing laptops
            if(lapt.data.values.laptopMode == 0) {
              lapt.setVelocity(0);
              lapt.setCollideWorldBounds(false);
            }
            scoreText.setText(howManyLaptopsHaveStickers + ' out of ' + totalLaptopsToGet + ' Patched');
      }
    }
  }

  function followMouse (sprite, mouse) {
    sprite.x = mouse.x - (sprite.width/2);
    sprite.y = mouse.y - (sprite.height/2);
  }

  //Follow center of reticle
  this.input.on('pointermove', function (pointer) {
      followMouse(tar, pointer);
  });

  //Shoots Sticker
  this.input.on('pointerdown', function (pointer)
  {
    if(pointer.leftButtonDown())
    {
      //Instantly updates position for mobile devices
      if(tar.x != pointer.x - (tar.width/2) || tar.y != pointer.y - (tar.height/2)) {
        followMouse(tar, pointer);
      }
      if(!gameOver)
      {
        for(var i in stickers.children.entries)
        {
          if(stickers.children.entries[i].y > (config.height + stickers.children.entries[i].height)
          || !stickers.children.entries[i].active)
          {
              if(stickersLeft > -1)
                stickersLeft--;

              if(modeSelect == 0)
                stickerText.setText('Stickers Left: ' + stickersLeft);

              rootScene.sound.add('throw', {
                volume: 0.8
              }).play();
              stickers.children.entries[i].enableBody(true, tar.x + ((stickers.children.entries[i].width * 0.1)/2), tar.y + ((stickers.children.entries[i].height * 0.1)/2), true, true);
              stickers.children.entries[i].data.values.patchSticking = true;
              stickers.children.entries[i].scale = 0.8;
              stickers.children.entries[i].setVelocity(0, -175);

              break;
          }
        }
      }
    }
  });

  //Pauses Game
  this.input.keyboard.on('keydown_P', function (event)
  {
    if(!gameOver)
    {
      rootScene.scene.pause();
      rootScene.scene.launch('pauseMenu');
    }
  });
},

update: function()
{
  rootScene = this;

  function progressByFrames (value) {
    return Math.floor(howManyLaptopsHaveStickers/(totalLaptopsToGet/value))
  }

  //Dynamic background based on amount of laptops patched
  var laptopsPerFrame = progressByFrames(25);
  if(currentFrame == null)
    currentFrame = laptopsPerFrame;

  if(laptopsPerFrame != currentFrame) {
    if(laptopsPerFrame == 0)
      background.setFrame('0001.png');
    else if(laptopsPerFrame < 10)
      background.setFrame('000' + laptopsPerFrame + '.png');
    else
      background.setFrame('00' + laptopsPerFrame + '.png');
    currentFrame = laptopsPerFrame;
  }

  var laptopsPerEmote = progressByFrames(10);
  for(var i in emotes.children.entries) {
    if(laptopsPerEmote >= (Number(i) + 1) && emotes.children.entries[i].frame.name == 0) {
      emotes.children.entries[i].setFrame(1);
      particle2.emitters.list[0].explode(250, emotes.children.entries[i].x, emotes.children.entries[i].y);

    }
  }

  for(var i in stickers.children.entries)
  {
    //Gives moving from camera effect
    if(stickers.children.entries[i].active && stickers.children.entries[i].data.values.patchSticking)
    {
      if(stickers.children.entries[i].scale > 0.1)
      {
          stickers.children.entries[i].scale -= 0.070;
          stickers.children.entries[i].setScale(stickers.children.entries[i].scale, stickers.children.entries[i].scale);
      }
      //Will drop when shrunk to a certain size
      else
      {
          this.sound.add('smack', { volume: 0.8 }).play();
          stickers.children.entries[i].setVelocity(0);
          stickers.children.entries[i].data.values.patchSticking = false;
      }
    }

    //Keeps position relative to laptop
    if(stickers.children.entries[i].data.values.currentLaptop != -1) {
      stickers.children.entries[i].setPosition(
        laptops.children.entries[stickers.children.entries[i].data.values.currentLaptop].x + stickers.children.entries[i].data.values.lapDiffX,
        laptops.children.entries[stickers.children.entries[i].data.values.currentLaptop].y + stickers.children.entries[i].data.values.lapDiffY
      );

      if(laptops.children.entries[stickers.children.entries[i].data.values.currentLaptop].frame.name != '__BASE'
      && laptops.children.entries[stickers.children.entries[i].data.values.currentLaptop].frame.name != '0') {
        stickers.children.entries[i].setAlpha(0);
      } else {
        stickers.children.entries[i].setAlpha(1);
      }
    }


    //Disables sticker when offscreen
    if(stickers.children.entries[i].active && stickers.children.entries[i].y > config.height + stickers.children.entries[i].height + 50) {
      stickers.children.entries[i].setAlpha(1);
      stickers.children.entries[i].disableBody(true, true);
    }
  }

  for(var j in laptops.children.entries)
  {
    if(laptops.children.entries[j].active && laptops.children.entries[j].y > config.height + laptops.children.entries[j].height + 50)
    {
      //For optimisation reasons, laptop disables itself when it leaves the screen
      if(laptops.children.entries[j].data.values.hasSticker && particle1.emitters.list[0].on) {
        particle1.emitters.list[0].on = false;
      }

      if(!laptops.children.entries[j].data.values.hasSticker) {
        this.sound.add('crash', { volume: Phaser.Math.FloatBetween(0.2, 0.3), rate: 1.0 + Phaser.Math.FloatBetween(-0.04, 0.04) }).play();
      }
      laptops.children.entries[j].disableBody(true, true);

      //Sticker resets when accompanying laptop leaves the screen
      var stickerIndex = stickers.children.entries.findIndex((stick) => {
        return stick.data.values.currentLaptop == j;
      });
      if(stickerIndex != -1)
      {
        stickers.children.entries[stickerIndex].data.values.currentLaptop = -1;
        stickers.children.entries[stickerIndex].data.values.lapDiffX = 0;
        stickers.children.entries[stickerIndex].data.values.lapDiffY = 0;
        stickers.children.entries[stickerIndex].data.values.stickerOnLaptop = false;
        stickers.children.entries[stickerIndex].body.setAllowGravity(true);
        stickers.children.entries[stickerIndex].setAlpha(1);
        stickers.children.entries[stickerIndex].disableBody(true, true);
      }
    }

    //In bouncing laptops, laptops will leave the screen when the time runs out
    if((countdownSeconds - countdownTimer.getElapsedSeconds() <= 0 || stickersLeft == 0) && modeSelect == 0
    && (stickers.countActive(true) == 0 || (stickers.countActive(true) > 0
    && stickers.children.entries.findIndex((stick) => { return stick.scale > 0.1 && stick.active }) == -1)))
      laptops.children.entries[j].setCollideWorldBounds(false);
  }

  function gameOverSequence(endText, resultsText)
  {
    rootScene.sound.play('timesUp');
    timerText.setText(endText);
    gameOver = true;
    gameDelay = rootScene.time.addEvent(
      {
        delay: 2000,                // ms
        callback: ()=> {
          scoreText.setText('');
          timerText.setText('');
          stickerText.setText('');
          tar.disableBody(true, true);
          var finish = rootScene.sound.add('results');
          finish.play();

          var finishText = rootScene.add.text(0, 0, resultsText,
          { fontFamily: "Arial, Carrois Gothic SC", fontSize: '45px',
          fontStyle: 'bold', fill: '#000' });
          finishText.setPosition(Math.floor((config.width/2) - (finishText.width/2)), (config.height/2) - 50);

          particle3.emitters.list[0].on = true;
          particle3.emitters.list[0].setPosition(finishText.x + (finishText.width/2), (finishText.y + (finishText.height/2)) + 10);
          rootScene.time.addEvent(
            {
            delay: 5000,
            callback: ()=> {
              var menuScene = rootScene.scene.get('mainMenu');
              for(var i in laptops.children.entries)
              {
                if(laptops.children.entries[i].frame.name != '__BASE')
                  rootScene.anims.remove('open/close_' + laptops.children.entries[i].data.values.laptopID);
              }
              stickersLeft = 20;
              var numberOfSmilingEmotes = emotes.children.entries.filter((emot) => { return emot.frame.name == 1 }).length;
              if(numberOfSmilingEmotes >= 4 || modeAlreadyUnlocked) {
                if(!modeAlreadyUnlocked) {
                  finishText.setText('You\'ve unlocked Bouncing Laptops!');
                  finishText.setPosition(Math.floor((config.width/2) - (finishText.width/2)), (config.height/2) - 50);
                  rootScene.time.addEvent({
                    delay: 5000,
                    callback: () => {
                      finish.stop();
                      gameOver = false;
                      modeAlreadyUnlocked = true;
                      menuScene.scene.restart({ locked: false });
                      rootScene.scene.stop();
                    }});
                } else {
                  finish.stop();
                  gameOver = false;
                  menuScene.scene.restart({ locked: false });
                  rootScene.scene.stop();
                }
              } else {
                finish.stop();
                gameOver = false;
                menuScene.scene.restart({ locked: true });
                rootScene.scene.stop();
              }
            }
            });
        }
      });
  }

  //Only generates starting value for countdownCheck to keep variable from being static
  if(countdownCheck == null)
    countdownCheck = countdownSeconds;

  //Stops game if all laptops are patched
  if(countdownTimer.paused) {
    if(gameDelay == null)
    {
      gameOverSequence('Finish!', 'All laptops are Patched');
    }
  }

  if(howManyLaptopsHaveStickers == totalLaptopsToGet)
  {
    if(!countdownTimer.paused)
      countdownTimer.paused = true;
  }
  else
  {
    //Will indicate when last laptop is being chucked
    if(modeSelect == 1 && laptops.children.entries.findIndex((lapt) => { return lapt.data.values.delayActive }) == -1 && laptops.countActive(true) > 0) {
      timerText.setText('Last one!');
    }
    //Will initiate game over sequence when timer runs out
    else if(countdownSeconds - countdownTimer.getElapsedSeconds() <= 0 || stickersLeft == 0)
    {
      if(gameDelay == null && (stickers.countActive(true) == 0 || (modeSelect == 1
        && laptops.children.entries.findIndex((lapt) => { return lapt.data.values.delayActive }) == -1
        && laptops.countActive(true) === 0)))
      {
        if(howManyLaptopsHaveStickers == 0) {
          gameOverSequence('Time\'s up', 'No laptops were patched');
        }
        else if (howManyLaptopsHaveStickers == 1) {
          gameOverSequence('Time\'s up', 'You got 1 laptop');
        }
        else {
          gameOverSequence('Time\'s up', 'You got ' + howManyLaptopsHaveStickers + ' laptops');
        }
      }
    }

    //Will occur if there are no laptops left to chuck and timer hasn't run out yet
    else if(modeSelect == 1 && laptops.children.entries.findIndex((lapt) =>
    { return lapt.data.values.delayActive }) == -1 && laptops.countActive(true) === 0) {
      timerText.setText('No More');
    }
    //Countdown check will be compared against the floor of countdown seconds to see if it has changed; prevents unnecesary updates to second timer
    else if(countdownSeconds - countdownTimer.getElapsedSeconds() > 0 && countdownCheck != countdownSeconds - Math.floor(countdownTimer.getElapsedSeconds()))
    {
      timerText.setText('Timer: ' + (countdownSeconds - Math.floor(countdownTimer.getElapsedSeconds())));
      countdownCheck = countdownSeconds - Math.floor(countdownTimer.getElapsedSeconds());
    }
  }
}}}());
