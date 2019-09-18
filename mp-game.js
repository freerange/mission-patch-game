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
  this.load.image('patch', 'assets/patch.png');

  //Spritesheet assets
  this.load.multiatlas('office', 'assets/spritesheets/office/Office.json', 'assets/spritesheets/office');
  this.load.multiatlas('laptop_1', 'assets/spritesheets/laptop/Laptop.json', 'assets/spritesheets/laptop');

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

  var laptopFrames = this.anims.generateFrameNames('laptop_1', {
    start: 1, end: 4, zeroPad: 4, suffix: '.png'
  });

  function animateLaptop (laptop, key) {
    //Will animate if a certain laptop type is assigned
    if(laptop.texture.key == key) {
      laptop.setFrame('0001.png');
      laptop.body.setSize(157, 101);
      master.anims.create({ key: 'open/close_' + laptop.data.values.laptopID,
        frames: laptopFrames, duration: 350, repeat: 0, yoyo: true });
      laptop.anims.play('open/close_' + laptop.data.values.laptopID);
      laptop.data.values.currentTimer = master.time.addEvent(
      {
          delay: 1500,
          callback: ()=> {
            laptop.anims.play('open/close_' + laptop.data.values.laptopID);
          },
          callbackScope: this,
          loop: true
      });
    }
  }

  function foo (x, y, laptopMode, delayActive) {
    var laptop = laptops.create(x, y, 'laptop_' + Phaser.Math.Between(0, 1));

    laptop.setData({ laptopMode: laptopMode, hasSticker: false, delayActive: delayActive,
      laptopID: -1, currentTimer: null });

    laptop.data.values.laptopID = laptops.children.entries.length - 1;

    return laptop;
  }

  function createMode0Laptop (laptop, bounce, mode) {
    var laptop = foo(Phaser.Math.Between(0, config.width), Phaser.Math.Between(0, config.height), mode, false);

    animateLaptop(laptop, 'laptop_1');

    var velX = (laptop.x > (config.width/2)) ? -1 : 1;
    var velY = (laptop.y > (config.height/2)) ? -1 : 1;
    laptop.setVelocity(Phaser.Math.Between(400, 600) * velX,
      Phaser.Math.Between(400, 600) * velY);
    laptop.setBounce(bounce);
    laptop.setScale(0.625);
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

                master.sound.add('laptThrow', {
                  volume: Phaser.Math.FloatBetween(0.2, 0.4),
                  rate: 1.0 + Phaser.Math.FloatBetween(-0.1, 0.1)
                }).play();
                laptop.enableBody(true, pos.x, pos.y, true, true);
                laptop.data.values.delayActive = false;

                var velX = (laptop.x > (config.width/2)) ? -1 : 1;
                var velY = (laptop.y > (config.height/2)) ? -1.35 : -0.5;
                laptop.setVelocity(Phaser.Math.Between(300, 600) * velX,
                  Phaser.Math.Between(400, 600) * velY);
                laptop.setScale(1.25);
              },
              callbackScope: this,
              loop: false
            }
          )
        },
        callbackScope: this,
        loop: false
      });
  }

  function createMode1Laptop (laptop, bounce, mode) {
    var pos = chooseLaptopStartPosition();
    //Sets up laptop
    laptop = foo(pos.x, pos.y, mode, true);

    animateLaptop(laptop, 'laptop_1');

    laptop.disableBody(true, true);

    var msPerLaptop = (countdownSeconds * 1000)/laptopsAtOnce;

    var laptSetDelay = (msPerLaptop * laptSpread) +
      Phaser.Math.Between(-(msPerLaptop/2), (msPerLaptop/2));

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
      delay: countdownSeconds * 1000,                // ms
      callback: ()=> {
      },
      callbackScope: this,
      loop: false
    });

  // var tab = this.physics.add.staticSprite(0, 0, 'table').setOrigin(0, 0);
  // tab.disableBody(true, true);

  tar = this.physics.add.staticSprite(0, 0, 'target').setOrigin(0, 0);

  //Stickers are being prepped
  for(var i = 0; i < stickersAtOnce; i++)
  {

    stickers.create(0, 0, 'patch');
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

    if(lapt.data.values.currentTimer != null)
      lapt.data.values.currentTimer.remove();

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
    return master.add.text(x, y, text, { fontFamily: "Arial, Carrois Gothic SC", fontSize: '32px', fill: '#000' });
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
    var correctLaptopFrame = laptop.frame.name == '__BASE' || laptop.frame.name == '0001.png';

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
      if(laptops.children.entries[j].data.values.currentTimer != null) {
        laptops.children.entries[j].data.values.currentTimer.remove();
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
          // finish.play();
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
            },
            callbackScope: this,
            loop: false
            });
        },
        callbackScope: this,
        loop: false
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
    //This is a test sound; will change later
    this.load.audio('gong', 'sounds/266566__gowlermusic__gong-hit(edited).wav');
  }
  create ()
  {
      //Title
      var title = this.add.text(0, 0, 'Mission Patch Game',
        {fontFamily: "Arial, Carrois Gothic SC", fontSize: '30px', fontStyle: 'bold'});
        title.setPosition((config.width/2) - Math.floor(title.width/2), (config.height/2) - 180);

      var master = this;

      title.setPosition(Math.floor((config.width/2) - (title.width/2)), (config.height/2) - 180);

      //Button to launch mode select
      var graphics = this.add.graphics();
      var rect = new Phaser.Geom.Rectangle(0, 0, 200, 100);
      rect.setPosition((config.width/2)-(rect.width/2), (config.height/2)-50);
      graphics.fillStyle('#000');
      graphics.fillRectShape(rect);

      //Taken from Phaser button tutorial (snowbillr.github.io/blog//2018-07-03-buttons-in-phaser-3/)
      const startButton = this.add.text(rect.x + 70, rect.y + 35, 'Start',
      {fontFamily: "Arial, Carrois Gothic SC", fontSize: '24px'})
      .setInteractive()
      .on('pointerdown', (pointer)=> {
        if(pointer.leftButtonDown())
        {
          startButton.destroy();
          graphics.clear();
          var rect2 = new Phaser.Geom.Rectangle(0, 0, 165, 50);
          rect2.setPosition((config.width/2)-(rect2.width + 20), (config.height/2)-50);
          graphics.fillRectShape(rect2);

          //Button to start bounce mode
          const bounceButton = master.add.text(rect2.x + 10, rect2.y + 10, 'Bounce mode',
            {fontFamily: "Arial, Carrois Gothic SC", fontSize: '24px'})
            .setInteractive()
            .on('pointerdown', (pointer)=> {
                if(pointer.leftButtonDown())
                {
                  bounceButton.setStyle({ fill: '#aa0'});
                  master.sound.play('gong');
                  master.scene.start('mainGame', { stickersAtOnce: 3, laptopsAtOnce: 8, countdownSeconds: 30, modeSelect: 0});
                  master.scene.stop();
                }
              })
              .on('pointerover', () => bounceButton.setStyle({ fill: '#ff0'}) )
              .on('pointerout', () => bounceButton.setStyle({ fill: '#fff' }) );

              var rect3 = new Phaser.Geom.Rectangle(0, 0, 165, 50);
              rect3.setPosition((config.width/2) + 20, (config.height/2)-50);
              graphics.fillRectShape(rect3);

              //Button to start chuck mode
              const chuckButton = master.add.text(rect3.x + 10, rect3.y + 10, 'Chuck mode',
                {fontFamily: "Arial, Carrois Gothic SC", fontSize: '24px'})
                .setInteractive()
                .on('pointerdown', (pointer)=> {
                    if(pointer.leftButtonDown())
                    {
                      chuckButton.setStyle({ fill: '#aa0'});
                      // master.sound.play('gong');
                      master.scene.start('chuckMode');
                      master.scene.stop();
                    }
                  })
                  .on('pointerover', () => chuckButton.setStyle({ fill: '#ff0'}) )
                  .on('pointerout', () => chuckButton.setStyle({ fill: '#fff' }) );

        }
      })
      .on('pointerover', () => startButton.setStyle({ fill: '#ff0'}) )
      .on('pointerout', () => startButton.setStyle({ fill: '#fff' }) );
  }

}

class PauseMenu extends Phaser.Scene
{
  preload ()
  {
    // this.load.image('button', 'assets/button.png');
  }

  create ()
  {
    //Resume Button
    var graphics = this.add.graphics();
    var rect = new Phaser.Geom.Rectangle((config.width/2) - 103, (config.height/2) + 150, 95, 30);
    graphics.fillStyle('#cf9830');
    graphics.fillRectShape(rect);

    //Quit Button
    var rect2 = new Phaser.Geom.Rectangle((config.width/2) + 97, (config.height/2) + 150, 50, 30);
    graphics.fillStyle('#cf9830');
    graphics.fillRectShape(rect2);

    //Text for "paused"
    this.add.text((config.width/2) - 50, config.height/2, 'Paused',
      {fontFamily: "Arial, Carrois Gothic SC", fontSize: '30px', fontStyle: 'bold', fill: '#000'});

    //Interactable resume text for continuing ongoing game
    const resumeButton = this.add.text((config.width/2)-100, (config.height/2) + 150, 'Resume',
    {fontFamily: "Arial, Carrois Gothic SC", fontSize: '24px', fill: '#fff'})
    .setInteractive()
    .on('pointerdown', (pointer)=> {
      if(pointer.leftButtonDown())
      {
        resumeButton.setStyle({ fill: '#aa0'});
        this.scene.resume('mainGame');
        this.scene.stop();
      }
    })
    .on('pointerover', () => resumeButton.setStyle({ fill: '#ff0'}) )
    .on('pointerout', () => resumeButton.setStyle({ fill: '#fff' }) );

    //Interactable quit text for going back to the main menu
    const quitButton = this.add.text((config.width/2) + 100, (config.height/2) + 150, 'Quit',
    {fontFamily: "Arial, Carrois Gothic SC", fontSize: '24px', fill: '#fff'})
    .setInteractive()
    .on('pointerdown', (pointer)=> {
      if(pointer.leftButtonDown())
      {
        quitButton.setStyle({ fill: '#aa0'});
        this.scene.start('mainMenu');
        this.scene.stop('mainGame');
        this.scene.stop();
      }
    })
    .on('pointerover', () => quitButton.setStyle({ fill: '#ff0'}) )
    .on('pointerout', () => quitButton.setStyle({ fill: '#fff' }) );
  }
}

class BounceModeInstructions extends Phaser.Scene
{
  preload ()
  {
    this.load.audio('gong', 'sounds/266566__gowlermusic__gong-hit(edited).wav');

    this.load.image('preview', 'assets/bounce-mode-example.png');
  }

  create ()
  {
    //Title
    var title = this.add.text(0, 0, 'Bounce Mode',
      {fontFamily: "Arial, Carrois Gothic SC", fontSize: '30px', fontStyle: 'bold'});
      title.setPosition((config.width/2) - Math.floor(title.width/2), (config.height/2) - 260);

    //Description
    this.add.text((config.width/2) - 390, (config.height/2)+105,
      'Stop the laptops from bouncing around by sticking them with a mission patch before time runs out',
      {fontFamily: "Arial, Carrois Gothic SC", fontSize: '18px'});

      var previewPic = this.add.image(config.width/2, config.height/2 - 60, 'preview');
      previewPic.setScale(0.5);

    //Button to Start Game
    const playButton = this.add.text(rect.x + 10, rect.y+10, 'Play',
      {fontFamily: "Arial, Carrois Gothic SC", fontSize: '24px'})
      .setInteractive()
      .on('pointerdown', (pointer)=> {
          if(pointer.leftButtonDown())
          {
            playButton.setStyle({ fill: '#aa0'});
            this.sound.play('gong');
            this.scene.start('mainGame', { stickersAtOnce: 3, laptopsAtOnce: 8, countdownSeconds: 30, modeSelect: 0});
            this.scene.stop();
          }
        })
        .on('pointerover', () => playButton.setStyle({ fill: '#ff0'}) )
        .on('pointerout', () => playButton.setStyle({ fill: '#fff' }) );
  }
}

class ChuckModeInstructions extends Phaser.Scene
{
  preload ()
  {
    this.load.audio('gong', 'sounds/266566__gowlermusic__gong-hit(edited).wav');

    this.load.image('preview', 'assets/chuck-mode-example.png');
  }

  create ()
  {
    var graphics = this.add.graphics();

    //Title
    var title = this.add.text(0, 0, 'Chuck Mode',
      {fontFamily: "Arial, Carrois Gothic SC", fontSize: '30px', fontStyle: 'bold'});
      title.setPosition((config.width/2) - Math.floor(title.width/2), (config.height/2) - 260);

    //Description
    this.add.text((config.width/2) - 350, (config.height/2)+105,
      'Catch the incoming flying laptops by sticking them with a mission patch within two minutes',
      {fontFamily: "Arial, Carrois Gothic SC", fontSize: '18px'});

    this.add.text((config.width/2) - 350, (config.height/2)+135,
      'Move the cursor around the screen and click to throw a sticker',
      {fontFamily: "Arial, Carrois Gothic SC", fontSize: '18px'});

    var previewPic = this.add.image(config.width/2, config.height/2 - 60, 'preview');
    previewPic.setScale(0.5);

    //Button to start game
    var rect = new Phaser.Geom.Rectangle((config.width/2)-25, (config.height/2)+185, 65, 50);
    rect.setPosition((config.width/2)-25, (config.height/2)+185);
    graphics.fillStyle('#cf9830');
    graphics.fillRectShape(rect);

    const playButton = this.add.text(rect.x + 10, rect.y+10, 'Play',
      {fontFamily: "Arial, Carrois Gothic SC", fontSize: '24px'})
      .setInteractive()
      .on('pointerdown', (pointer)=> {
          if(pointer.leftButtonDown())
          {
            playButton.setStyle({ fill: '#aa0'});
            this.sound.play('gong');
            this.scene.start('mainGame', { stickersAtOnce: 5, laptopsAtOnce: 60, countdownSeconds: 120, modeSelect: 1});
            this.scene.stop();
          }
        })
        .on('pointerover', () => playButton.setStyle({ fill: '#ff0'}) )
        .on('pointerout', () => playButton.setStyle({ fill: '#fff' }) );
  }
}

var config =
{
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#00f',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 700 },
            debug: true
        }
    }
};

var game = new Phaser.Game(config);

//List of scenes for game
game.scene.add('mainMenu', MainMenu);
game.scene.add('mainGame', mainGame);
game.scene.add('pauseMenu', PauseMenu);
game.scene.add('chuckMode', ChuckModeInstructions);
game.scene.add('bounceMode', BounceModeInstructions);

game.scene.start('mainMenu');
