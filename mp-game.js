var mainGame = new Phaser.Class(function()
{
  var master;

  var tar;
  var stickersAtOnce;
  var laptopsAtOnce;

  var howManyLaptopsHaveStickers;
  var stickersLeft;
  var modeSelect;

  var countdownTimer;
  var countdownSeconds;
  var timerText;

  var scoreText;
  var stickerText;

  var countdownCheck;
  var currentFrame;

  var gameDelay;
  var gameOver = false;

  var particle1, particle2;

return {
Extends: Phaser.Scene,

init: function(data)
{
  stickersAtOnce = data.stickersAtOnce;
  laptopsAtOnce = data.laptopsAtOnce;
  countdownSeconds = data.countdownSeconds;
  modeSelect = data.modeSelect;
},

preload: function()
{
  //Loads all assets
  this.load.image('laptop_0', 'assets/laptop.png');
  this.load.image('target', 'assets/cursor.png');
  this.load.image('sky', 'assets/sky.png');

  //Patch Designs
  this.load.image('patch_1', 'assets/patch.png');
  this.load.image('patch_2', 'assets/patch-2.png');
  this.load.image('patch_3', 'assets/patch-3.png');
  this.load.image('patch_4', 'assets/patch-4.png');
  this.load.image('patch_5', 'assets/patch-5.png');

  //Spritesheet assets
  this.load.multiatlas('office', 'assets/spritesheets/office/Office.json', 'assets/spritesheets/office');
  this.load.spritesheet('laptop_1', 'assets/spritesheets/laptop.png', { frameWidth: 252, frameHeight: 202 });
  this.load.spritesheet('laptop_2', 'assets/spritesheets/laptop-blue.png', { frameWidth: 252, frameHeight: 202 });
  this.load.spritesheet('laptop_3', 'assets/spritesheets/laptop-red.png', { frameWidth: 252, frameHeight: 202 });
  this.load.spritesheet('laptop_4', 'assets/spritesheets/laptop-green.png', { frameWidth: 252, frameHeight: 202 });

  //Particle Assets
  this.load.atlas('shapes', 'assets/particles/shapes.png', 'assets/particles/shapes.json');
  this.load.text('blast', 'assets/particles/Blast.json');
  this.load.text('explosion', 'assets/particles/Explosion.json');

  //Sound assets taken and edited from freesound.com
  this.load.audio('throw', 'sounds/322224__liamg-sfx__arrow-nock.wav');
  this.load.audio('laptThrow', 'sounds/60013__qubodup__whoosh(edited).wav');
  this.load.audio('smack', 'sounds/37186__volivieri__newspapers-large-hard(edited).wav');
  this.load.audio('hit', 'sounds/399294__komit__synth-sparkle(edited).wav');
  this.load.audio('crash', 'sounds/221528__unfa__glass-break(edited).wav');
  this.load.audio('timesUp', 'sounds/198841__bone666138__analog-alarm-clock(edited).wav');
  this.load.audio('results', 'sounds/182369__kingsrow__fire-crackling-01(edited).wav')

  //Done to prevent sound stacking when inactive
  this.sound.pauseOnBlur = false;

  // this.load.image('table', 'assets/table.png');
},

create: function()
{

  //Resets variable on repeat (will delete once bug is figured out)
  gameDelay = null;


  howManyLaptopsHaveStickers = 0;

  stickersLeft = (modeSelect == 0) ? 20 : -1;

  //Game Background
  background = this.add.sprite(0, 0, 'office', '0001.png').setOrigin(0, 0);
  background.setScale(config.width/800, config.height/600);

  //Game Particles
  particle1 = this.add.particles('shapes',  new Function('return '
    + this.cache.text.get('blast'))());
  particle1.emitters.list[0].on = false;

  // particle2 = this.add.particles('shapes',  new Function('return '
  //   + this.cache.text.get('explosion'))());
  // particle2.emitters.list[0].on = false;

  //Launch Groups
  laptops = this.physics.add.group();
  stickers = this.physics.add.group();

  //Collisions
  var lapColl = this.physics.add.collider(laptops, laptops);
  this.physics.add.overlap(laptops, stickers, hitLaptop, null, this);

  //Referenced for time and key press events
  var master = this;

  //Always starts at 1
  var laptSpread = 1;



  function animateLaptop (laptop, key, duration, delay) {
    //Will animate if a certain laptop type is assigned
    if(laptop.texture.key == key) {
      laptop.setFrame(0);
      laptop.body.setSize(157, 101);
      var laptopFrames = master.anims.generateFrameNames(key, { start: 0, end: 3 });
      master.anims.create({ key: 'open/close_' + laptop.data.values.laptopID, frames: laptopFrames, duration: duration, repeat: 0, yoyo: true });

      laptop.anims.play('open/close_' + laptop.data.values.laptopID);

      laptop.once('animationcomplete', ()=> {
        master.time.addEvent(
        {
            delay: delay,
            callback: ()=> {
              laptop.anims.play('open/close_' + laptop.data.values.laptopID);
              delay = delay + duration;

              master.time.addEvent(
              {
                  delay: delay,
                  callback: ()=> {
                    laptop.anims.play('open/close_' + laptop.data.values.laptopID);
                  },
                  loop: true
              });
            }
        });
      });
    }
  }

  function isLaptopTypeAnimated (laptop) {
    animateLaptop(laptop, 'laptop_1', 350, 750);
    animateLaptop(laptop, 'laptop_2', 750, 1000);
    animateLaptop(laptop, 'laptop_3', 500, 250);
    animateLaptop(laptop, 'laptop_4', 150, 500);
  }

  function generateLaptop (x, y, laptopMode, delayActive) {
    var laptop = laptops.create(x, y, 'laptop_' + Phaser.Math.Between(0, 4));
    laptop.setData({ laptopMode: laptopMode, hasSticker: false, delayActive: delayActive, laptopID: -1 });
    laptop.data.values.laptopID = laptops.children.entries.length - 1;

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
    master.time.addEvent(
      {
        delay: delay - 750,                // ms
        callback: ()=> {
          var x, y;

          if(pos.y > config.height) {
            y = pos.y - 100;
            x = Phaser.Math.Clamp(pos.x, 125, config.width - 200)
          } else {
            y = Phaser.Math.Clamp(pos.y, 40, config.height - 40);
            x = (pos.x > (config.width/2)) ? config.width - 100 : 50;
          }

          var readyText = master.add.text(x, y, 'Ready?',
            { fontFamily: "Arial, Carrois Gothic SC", fontSize: '20px',
            fontStyle: 'bold', fill: '#2E2ED1' });

          timer = master.time.addEvent(
            {
              delay: 750,
              callback: ()=> {
                readyText.destroy();

                master.time.addEvent(
                {
                    delay: Phaser.Math.Between(0, 1000),
                    callback: ()=> {
                      isLaptopTypeAnimated(laptop);
                    }
                });
                master.sound.add('laptThrow', {
                  volume: Phaser.Math.FloatBetween(0.2, 0.4),
                  rate: 1.0 + Phaser.Math.FloatBetween(-0.1, 0.1)
                }).play();
                laptop.enableBody(true, pos.x, pos.y, true, true);
                laptop.data.values.delayActive = false;

                var velX = (laptop.x > (config.width/2)) ? -1 : 1;
                var velY = (laptop.y > (config.height/2)) ? -1.35 : -0.5;
                laptop.setVelocity(Phaser.Math.Between(300, 600) * velX, Phaser.Math.Between(400, 600) * velY);
                laptop.setScale(1 + Phaser.Math.FloatBetween(0.0, 0.25));
              }
            }
          )
        }
      });
  }

  function createMode1Laptop (laptop, bounce, mode) {
    //Sets up laptop
    var pos = chooseLaptopStartPosition();
    laptop = generateLaptop(pos.x, pos.y, mode, true);

    laptop.disableBody(true, true);



    var msPerLaptop = (countdownSeconds * 1000)/laptopsAtOnce;
    var laptSetDelay = (msPerLaptop * laptSpread) + Phaser.Math.Between(-(msPerLaptop/2), (msPerLaptop/2));
    laptSetDelay = Phaser.Math.Clamp(laptSetDelay, 500, (countdownSeconds * 1000) - 1);

    throwLaptop(laptop, pos, laptSetDelay);
  }


  function createLaptop(laptop, bounce, mode)
  {
    // Mode 0 = Bounce mode
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
  for(var i = 0; i < laptopsAtOnce; i++)
  {
    var laptop;
    createLaptop(laptop, Phaser.Math.FloatBetween(0.95, 1.02), modeSelect);
    laptSpread++;
  }

  //Sets timer depending on countdown seconds
  countdownTimer = this.time.addEvent(
  {
    delay: countdownSeconds * 1000
  });

  // var tab = this.physics.add.staticSprite(0, 0, 'table').setOrigin(0, 0);
  // tab.disableBody(true, true);

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
    master.sound.add('hit', {
      volume: 0.6,
      rate: 1.0 + Phaser.Math.FloatBetween(-0.15, 0.15)
    }).play();

    stick.data.values.currentLaptop = index;
    stick.data.values.lapDiffX = stick.x - lapt.x;
    stick.data.values.lapDiffY = stick.y - lapt.y;
    stick.body.setAllowGravity(false);

    if(!particle1.emitters.list[0].on) {
      particle1.emitters.list[0].on = true;
      particle1.emitters.list[0].setPosition(0, 0);
    }

    particle1.emitters.list[0].startFollow(lapt);
  }

  function setUIText(x, y, text) {
    return master.add.text(x, y, text, { fontFamily: "Saira Stencil One, Arial, Carrois Gothic SC", fontSize: '32px', fill: '#000' });
  }

  //UI Text
  scoreText = setUIText(16, 16, howManyLaptopsHaveStickers + ' out of ' + laptopsAtOnce + ' Patched');
  timerText = setUIText(config.width - 190, 16, 'Timer: ' + (countdownSeconds - Math.floor(countdownTimer.getElapsedSeconds())));
  stickerText = (modeSelect == 0) ? setUIText(config.width - 240, 540, 'Stickers Left: ' + stickersLeft) : this.add.text(0, 0, '');

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

            //Makes laptops stop and fall in bounce mode
            if(lapt.data.values.laptopMode == 0) {
              lapt.disableBody(true, false);
              lapt.enableBody(true, lapt.x, lapt.y, true, true);

              lapt.setCollideWorldBounds(false);
            }
            scoreText.setText(howManyLaptopsHaveStickers + ' out of ' + laptopsAtOnce + ' Patched');
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
      if(!gameOver || (modeSelect == 0 && stickersLeft > 0))
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

              master.sound.add('throw', {
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
      master.scene.pause();
      master.scene.launch('pauseMenu');
    }
  });
},

update: function()
{
  master = this;

  //Dynamic background based on amount of laptops patched
  var laptopsPerFrame = Math.floor(howManyLaptopsHaveStickers/(laptopsAtOnce/25));
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

  for(var i in stickers.children.entries)
  {
    //Gives moving from camera effect
    if(stickers.children.entries[i].active && stickers.children.entries[i].data.values.patchSticking)
    {
      if(stickers.children.entries[i].scale > 0.1)
      {
          stickers.children.entries[i].scale -= 0.035;
          stickers.children.entries[i].setScale(stickers.children.entries[i].scale, stickers.children.entries[i].scale);
      }
      //Will drop when shrunk to a certain size
      else
      {
          this.sound.add('smack', { volume: 0.8 }).play();
          stickers.children.entries[i].disableBody(true, false);
          stickers.children.entries[i].enableBody(true, stickers.children.entries[i].x, stickers.children.entries[i].y, true, true);
          stickers.children.entries[i].data.values.patchSticking = false;
      }
    }

    //Keeps position relative to laptop
    if(stickers.children.entries[i].data.values.currentLaptop != -1) {
      stickers.children.entries[i].setPosition(
        laptops.children.entries[stickers.children.entries[i].data.values.currentLaptop].x + stickers.children.entries[i].data.values.lapDiffX,
        laptops.children.entries[stickers.children.entries[i].data.values.currentLaptop].y + stickers.children.entries[i].data.values.lapDiffY
      );
    }
    //Disables sticker when offscreen
    if(stickers.children.entries[i].active && stickers.children.entries[i].y > config.height + stickers.children.entries[i].height + 50) {
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
        this.sound.add('crash', { volume: Phaser.Math.FloatBetween(0.6, 0.7), rate: 1.0 + Phaser.Math.FloatBetween(-0.04, 0.04) }).play();
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
        stickers.children.entries[stickerIndex].disableBody(true, true);
      }
    }

    //In bounce mode, laptops will leave the screen when the time runs out
    if((countdownSeconds - countdownTimer.getElapsedSeconds() <= 0 || stickersLeft == 0) && modeSelect == 0
    && (stickers.countActive(true) == 0 || (stickers.countActive(true) > 0
    && stickers.children.entries.findIndex((stick) => { return stick.scale > 0.1 && stick.active }) == -1)))
      laptops.children.entries[j].setCollideWorldBounds(false);
  }

  function gameOverSequence(endText, resultsText)
  {
    master.sound.play('timesUp');
    timerText.setText(endText);
    gameOver = true;
    gameDelay = master.time.addEvent(
      {
        delay: 2000,                // ms
        callback: ()=> {
          scoreText.setText('');
          timerText.setText('');
          stickerText.setText('');
          tar.disableBody(true, true);
          var finish = master.sound.add('results');
          finish.play();
          // particle2.emitters.list[0].on = true;

          var finishText = master.add.text(0, 0, resultsText,
          { fontFamily: "Arial, Carrois Gothic SC", fontSize: '45px',
          fontStyle: 'bold', fill: '#000' });
          finishText.setPosition(Math.floor((config.width/2) - (finishText.width/2)),
            (config.height/2) - 50);

          // particle2.emitters.list[0].setPosition(finishText.width/2, (finishText.height/2) + 10);
          // particle2.emitters.list[0].startFollow(finishText);
          master.time.addEvent(
            {
            delay: 5000,
            callback: ()=> {
              gameOver = false;
              var menuScene = master.scene.get('mainMenu');
              for(var i in laptops.children.entries)
              {
                if(laptops.children.entries[i].texture.key == 'laptop_1')
                  master.anims.remove('open/close_' + laptops.children.entries[i].data.values.laptopID);
              }
              stickersLeft = 20;
              finish.stop();
              menuScene.scene.restart();
              master.scene.stop();
            }
            });
        }
      });
  }


  if(countdownCheck == null)
    countdownCheck = countdownSeconds;

  //Stops game if all laptops are patched
  if(countdownTimer.paused) {
    if(gameDelay == null)
    {
      gameOverSequence('Finish!', 'All laptops are Patched');
    }
  }

  if(howManyLaptopsHaveStickers == laptopsAtOnce)
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
      if(gameDelay == null && (stickers.countActive(true) == 0 || (stickers.countActive(true) > 0
      && stickers.children.entries.findIndex((stick) => { return stick.scale > 0.1 }) == -1)))
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
}
}}());

class MainMenu extends Phaser.Scene
{
  preload ()
  {
    this.load.multiatlas('office', 'assets/spritesheets/office/Office.json', 'assets/spritesheets/office');

    this.load.svg('note', 'assets/post_it.svg', {
      width: 100,
      height: 200
    });
  }

  create ()
  {
      var background = this.add.sprite(0, 0, 'office', '0025.png').setOrigin(0, 0);
      background.setTint(0x999999);

      //Title
      var title1 = this.add.text(0, 0, 'Mission Patch Game', {fontFamily: "Saira Stencil One, Arial, Carrois Gothic SC", fontSize: '60px', fontStyle: 'bold'});
      title1.setPosition((config.width/2) - Math.floor(title1.width/2), (config.height/2) - 180);

      var master = this;

      title1.setPosition(Math.floor((config.width/2) - (title1.width/2)), (config.height/2) - 180);

      var postItNotes = [];

      function launchButton(x, y, source, stickers, laptops, seconds, mode, title, description) {
        var postItNote = master.add.sprite(x, y, 'note');
        postItNotes.push(postItNote);
        postItNote.setOrigin(0, 0);

        const gameModeText = master.add.text(0, 0, title, {fontFamily: "Indie Flower, Arial, Carrois Gothic SC", fontSize: '24px', fill: '#000' })
        .setInteractive()
        .on('pointerdown', (pointer)=> {
            if(pointer.leftButtonDown())
            {
              gameModeText.setStyle({ fill: '#404'});
              title1.destroy();
              for( var i in postItNotes) {
                postItNotes[i].destroy();
              }
              postItNotes = [];
              // gameModeText.destroy();
              master.scene.pause();
              master.scene.launch('info', { instructionSource: source, titleName: title.replace("\n", " "), description: description,
                stickersAtOnce: stickers, laptopsAtOnce: laptops, countdownSeconds: seconds, modeSelect: mode });
            }
        })
        .on('pointerover', () => gameModeText.setStyle({ fill: '#808'}) )
        .on('pointerout', () => gameModeText.setStyle({ fill: '#000' }) );

        gameModeText.setAlign('center');
        gameModeText.setPosition(Math.floor(postItNote.x + ((postItNote.width/2)-(gameModeText.width/2))), Math.floor(postItNote.y + (postItNote.height/2) - (gameModeText.height/2)));
      }

      //Button to launch mode select
      var rect = this.add.sprite((config.width/2) - 50, (config.height/2) - 100, 'note').setOrigin(0, 0);
      //Taken from Phaser button tutorial (snowbillr.github.io/blog//2018-07-03-buttons-in-phaser-3/)
      const startButton = this.add.text(0, 0, 'Start', {fontFamily: "Indie Flower, Arial, Carrois Gothic SC", fontSize: '24px', fill: '#000' })
      .setInteractive()
      .on('pointerdown', (pointer)=> {
        if(pointer.leftButtonDown())
        {
          startButton.destroy();
          rect.destroy();

          //Buttons to start modes
          var bounceButton = launchButton((config.width/2)- 170, (config.height/2)-100, 'assets/bounce-mode-example.png', 3, 8, 30, 0, 'Bounce\nmode',
            'Stop the laptops from bouncing around by \nsticking them with a mission patch before time \nruns out.');
          var chuckButton = launchButton((config.width/2) + 70, (config.height/2)-100, 'assets/chuck-mode-example.png', 5, 100, 120, 1, 'Chuck\nmode',
            'Catch the incoming flying laptops by sticking them \nwith a mission patch within two minutes. Move \nthe cursor around the screen and click to throw \na sticker.');
        }
      })
      .on('pointerover', () => startButton.setStyle({ fill: '#808'}) )
      .on('pointerout', () => startButton.setStyle({ fill: '#000' }) );

      startButton.setPosition(Math.floor(rect.x + ((rect.width/2)-(startButton.width/2))), Math.floor(rect.y + (rect.height/2)));
  }

}

class PauseMenu extends Phaser.Scene
{
  preload ()
  {
    this.load.svg('note', 'assets/post_it.svg', {
      width: 100,
      height: 200
    });
  }

  create ()
  {
    //Resume Button
    var rect = this.add.sprite((config.width/2) - 133, (config.height/2), 'note').setOrigin(0, 0);

    //Quit Button
    var rect2 = this.add.sprite((config.width/2) + 58, (config.height/2), 'note').setOrigin(0, 0);

    //Text for "paused"
    this.add.text((config.width/2) - 50, config.height/2, 'Paused',
      {fontFamily: "Arial, Carrois Gothic SC", fontSize: '30px', fontStyle: 'bold', fill: '#000'});

    //Interactable resume text for continuing ongoing game
    const resumeButton = this.add.text(0, 0, 'Resume', {fontFamily: "Indie Flower, Arial, Carrois Gothic SC", fontSize: '24px', fill: '#000'})
    .setInteractive()
    .on('pointerdown', (pointer)=> {
      if(pointer.leftButtonDown())
      {
        resumeButton.setStyle({ fill: '#404'});
        this.scene.resume('mainGame');
        this.scene.stop();
      }
    })
    .on('pointerover', () => resumeButton.setStyle({ fill: '#808'}) )
    .on('pointerout', () => resumeButton.setStyle({ fill: '#000' }) );

    resumeButton.setPosition(Math.floor(rect.x + ((rect.width/2)-(resumeButton.width/2))), Math.floor(rect.y + (rect.height/2)));

    //Interactable quit text for going back to the main menu
    const quitButton = this.add.text(0, 0, 'Quit',
    {fontFamily: "Indie Flower, Arial, Carrois Gothic SC", fontSize: '24px', fill: '#000'})
    .setInteractive()
    .on('pointerdown', (pointer)=> {
      if(pointer.leftButtonDown())
      {
        quitButton.setStyle({ fill: '#404'});
        this.scene.start('mainMenu');
        this.scene.stop('mainGame');
        this.scene.stop();
      }
    })
    .on('pointerover', () => quitButton.setStyle({ fill: '#808'}) )
    .on('pointerout', () => quitButton.setStyle({ fill: '#000' }) );

    quitButton.setPosition(Math.floor(rect2.x + ((rect2.width/2)-(quitButton.width/2))), Math.floor(rect2.y + (rect2.height/2)))
  }
}

class Instructions extends Phaser.Scene
{
  init (data)
  {
    this.instructionSource = data.instructionSource;
    this.titleName = data.titleName;
    this.description = data.description;
    this.stickersAtOnce = data.stickersAtOnce;
    this.laptopsAtOnce = data.laptopsAtOnce;
    this.countdownSeconds = data.countdownSeconds;
    this.modeSelect = data.modeSelect;
  }

  preload ()
  {
    this.load.audio('gong', 'sounds/266566__gowlermusic__gong-hit(edited).wav');

    this.load.image('preview', this.instructionSource);
    this.load.svg('note', 'assets/post_it.svg', {
      width: 100,
      height: 200
    });
    this.load.svg('pad', 'assets/note_pad.svg', {
      scale: 1.8
    });
  }

  create ()
  {
    var notepad = this.add.sprite(0, 0, 'pad').setOrigin(0, 0);
    notepad.setPosition((config.width/2) - (notepad.width/2), ((config.height/8)*3) - (notepad.height/2));
    //Title
    var title = this.add.text(0, 0, this.titleName,
      {fontFamily: "Indie Flower, Arial, Carrois Gothic SC", fontSize: '30px', fill: '#000', fontStyle: 'bold'});
      title.setPosition(notepad.x + ((notepad.width/2) - Math.floor(title.width/2)), Math.floor(notepad.y + 5));

    //Description
    var desc = this.add.text(notepad.x + 10, notepad.y + ((notepad.height/10)*3) - 10,
      this.description, {fontFamily: "Indie Flower, Arial, Carrois Gothic SC", fontSize: '18px', fill: '#000' });

    desc.setLineSpacing(2.5);

    // var previewPic = this.add.image(config.width/2, config.height/2 - 60, 'preview');
    // previewPic.setScale(0.5);

    //Button to start game
    var playPostItNote = this.add.sprite(0, 0, 'note').setOrigin(0, 0);
    playPostItNote.setPosition((config.width/2) - (playPostItNote.width/2), (config.height/2)+75);

    const playButton = this.add.text(0, 0, 'Play',
      {fontFamily: "Indie Flower, Arial, Carrois Gothic SC", fontSize: '24px', fill: '#000' })
      .setInteractive()
      .on('pointerdown', (pointer)=> {
          if(pointer.leftButtonDown())
          {
            playButton.setStyle({ fill: '#404'});
            this.sound.play('gong');
            this.scene.start('mainGame', { stickersAtOnce: this.stickersAtOnce, laptopsAtOnce: this.laptopsAtOnce, countdownSeconds: this.countdownSeconds, modeSelect: this.modeSelect});
            this.scene.stop('mainMenu');
            this.scene.stop();
          }
        })
        .on('pointerover', () => playButton.setStyle({ fill: '#808'}) )
        .on('pointerout', () => playButton.setStyle({ fill: '#000' }) );

    playButton.setPosition(Math.floor(playPostItNote.x + ((playPostItNote.width/2)-(playButton.width/2))), Math.floor(playPostItNote.y + (playPostItNote.height/2)));
  }
}

var config =
{
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 700 },
            debug: false
        }
    }
};

var game = new Phaser.Game(config);

//List of scenes for game
game.scene.add('mainMenu', MainMenu);
game.scene.add('info', Instructions);
game.scene.add('mainGame', mainGame);
game.scene.add('pauseMenu', PauseMenu);

game.scene.start('mainMenu');
