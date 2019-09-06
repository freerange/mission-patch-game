var mainGame = new Phaser.Class(function()
{
  var sticker = [];
  var laptop = [];

  var tar;
  var stickersAtOnce = 5;
  var laptopsAtOnce = 8;

  var laptopsLeft;
  var modeSelect = 0;

  var master;

  var countdownTimer;
  var countdownSeconds = 20;
  var timerText;

  var scoreText;

  var countdownCheck;

  var gameDelay;
  var gameOver = false;

  var particle1, particle2;

  var howManyLaptopsHaveStickers;

return {
Extends: Phaser.Scene,

preload: function()
{
  //Loads all assets
  this.load.image('laptop', 'assets/laptop.png');
  this.load.image('target', 'assets/cursor.png');
  this.load.image('sky', 'assets/sky.png');
  this.load.image('patch', 'assets/patch.png');

  this.load.atlas('shapes', 'assets/particles/shapes.png', 'assets/particles/shapes.json');
  this.load.text('blast', 'assets/particles/Blast.json');
  this.load.text('explosion', 'assets/particles/Explosion.json');

  //Taken and edited from freesound.com
  this.load.audio('throw', 'sounds/322224__liamg-sfx__arrow-nock.wav');
  this.load.audio('laptThrow', 'sounds/60013__qubodup__whoosh(edited).wav');
  this.load.audio('smack', 'sounds/377157__pfranzen__smashing-head-on-wall(edited).wav');
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
  if(gameDelay != null)
    gameDelay = null;

  //Game Background
  background = this.add.image(0, 0, 'sky').setOrigin(0, 0);
  background.setScale(config.width/800, config.height/600);

  //Game Particles
  particle1 = this.add.particles('shapes',  new Function('return '
    + this.cache.text.get('blast'))());
  particle1.emitters.list[0].on = false;

  particle2 = this.add.particles('shapes',  new Function('return '
    + this.cache.text.get('explosion'))());
  particle2.emitters.list[0].on = false;

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

  function createLaptop(laptop, bounce, mode)
  {
    // Mode 0 = Bounce mode
    if(mode == 0)
    {
      laptop = laptops.create(Phaser.Math.Between(0, config.width),
        Phaser.Math.Between(0, config.height), 'laptop');
      laptop.setData({ laptopMode: mode });
      var velX = (laptop.x > (config.width/2)) ? -1 : 1;
      var velY = (laptop.y > (config.height/2)) ? -1 : 1;
      laptop.setVelocity(Phaser.Math.Between(400, 600) * velX,
        Phaser.Math.Between(400, 600) * velY);
      laptop.setBounce(bounce);
      laptop.setCollideWorldBounds(true);
    }
    //Mode 1 = Chuck mode
    else if(mode == 1)
    {
      var posX = Phaser.Math.Between(0, config.width);
      var posY = Phaser.Math.Between(0, config.height);

      //Random starting position from edge
      var compX = Math.abs(posX - (config.width/2));
      var compY = Math.abs(posY - (config.height/2));

      //Locks Edge Position
      if(compX < compY
      || (compX == compY && Phaser.Math.FloatBetween(0, 1) > 0.5))
        posX = (Phaser.Math.Between(0, config.width) > (config.width/2))
          ? config.width + 100 : -100;
      else if(compY <= compX)
        posY = config.height + 50;

      //Sets up laptop
      laptop = laptops.create(posX, posY, 'laptop');
      laptop.setData({ laptopMode: mode, hasSticker: false, delayActive: true });
      laptop.disableBody(true, true);

      var laptSetDelay = (((countdownSeconds * 1000)/laptopsAtOnce) * laptSpread) + Phaser.Math.Between(-(((countdownSeconds * 1000)/laptopsAtOnce)/2), (((countdownSeconds * 1000)/laptopsAtOnce)/2));

      if(laptSetDelay < 500)
        laptSetDelay = 500;
      else if(laptSetDelay > (countdownSeconds * 1000))
        laptSetDelay = (countdownSeconds * 1000);

      //Random delay before chucking
      var timer = master.time.addEvent(
        {
          delay: laptSetDelay,                // ms
          callback: ()=> {
            master.sound.add('laptThrow', {
              volume: Phaser.Math.FloatBetween(0.2, 0.4),
              rate: 1.0 + Phaser.Math.FloatBetween(-0.1, 0.1)
            }).play();
            laptop.enableBody(true, posX, posY, true, true);
            laptop.data.values.delayActive = false;
            var velX = (laptop.x > (config.width/2)) ? -1 : 1;
            var velY = (laptop.y > (config.height/2)) ? -1.5 : -0.5;
            laptop.setVelocity(Phaser.Math.Between(300, 600) * velX,
              Phaser.Math.Between(400, 600) * velY);
            laptop.setBounce(bounce);
            laptop.setScale(1.25);
          },
          callbackScope: this,
          loop: false
        });

      }
      else
        console.log('The selected mode doesn\'t exist');
  }

  //No collision on chuck mode
  if(modeSelect == 1)
    lapColl.destroy();

  for(var i = 0; i < laptopsAtOnce; i++)
  {
    createLaptop(laptop[i], Phaser.Math.FloatBetween(0.95, 1.02), modeSelect);
    laptop[i] = laptops.children.entries[i];
    laptSpread++;
  }


  laptopsLeft = laptops.children.entries.length;

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

    sticker[i] = stickers.create(0, 0, 'patch');
    sticker[i].setData({ patchSticking: false, currentLaptop: -1,
      lapDiffX: 0, lapDiffY: 0, stickerOnLaptop: false });
    sticker[i].scale = 0.8;
    sticker[i].setScale(sticker[i].scale, sticker[i].scale);
    sticker[i].disableBody(true, true);


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
      particle1.emitters.list[0].setPosition((lapt.width/2), (lapt.height/2));
    }

    particle1.emitters.list[0].startFollow(lapt);
  }

  //UI Text
  scoreText = this.add.text(16, 16, (laptopsAtOnce - laptopsLeft)
    + ' out of ' + laptopsAtOnce + ' Patched',
      { fontFamily: "Arial, Carrois Gothic SC", fontSize: '32px', fill: '#000' });
  timerText = this.add.text(config.width - 190, 16, 'Timer: '
    + (countdownSeconds - Math.floor(countdownTimer.getElapsedSeconds())),
      { fontFamily: "Arial, Carrois Gothic SC", fontSize: '32px', fill: '#000' });

  //Overlap check for whether sticker clearly hit the laptop
  function hitLaptop (lapt, stick)
  {
    for(var i in sticker)
    {
      //Determines size of laptop hitbox
      //1 = Full hitbox; 0 = No hitbox; 0.5 = Half hitbox
      var laptopSensetivity = 0.5;

      //Will only check when sticker is at minimum size
      if(stick.scale <= 0.1 && stick.data.values.patchSticking
      && Math.abs(stick.x - lapt.x) < (lapt.width * laptopSensetivity)
      && Math.abs(stick.y - lapt.y) < (lapt.height * laptopSensetivity)
      && !stick.data.values.stickerOnLaptop && !lapt.data.values.hasSticker)
      {
            laptopsLeft--;

            //Prevents overlapping laptops from counting if the sticker is already taken
            lapt.data.values.hasSticker = true;
            stick.data.values.stickerOnLaptop = true;

            //Checks for first overlapping laptop
            for(var i in laptops.children.entries)
            {
              if(laptops.children.entries[i] == lapt)
                stickToLaptop(lapt, stick, i);
            }

            //Makes laptops stop and fall in bounce mode
            if(lapt.data.values.laptopMode == 0)
            {
              lapt.disableBody(true, false);
              lapt.enableBody(true, lapt.x, lapt.y, true, true);

              lapt.setCollideWorldBounds(false);
            }
            scoreText.setText((laptopsAtOnce - laptopsLeft)
                + ' out of ' + laptopsAtOnce + ' Patched');
      }
    }
  }

  //Follow center of reticle
  this.input.on('pointermove', function (pointer)
  {
      tar.x = pointer.x - (tar.width/2);
      tar.y = pointer.y - (tar.height/2);
  });

  //Shoots Sticker
  this.input.on('pointerdown', function (pointer)
  {
    if(pointer.leftButtonDown())
    {
      //Instantly updates position for mobile devices
      if(tar.x != pointer.x - (tar.width/2) || tar.y != pointer.y - (tar.height/2))
      {
        tar.x = pointer.x - (tar.width/2);
        tar.y = pointer.y - (tar.height/2);
      }
      if(!gameOver)
      {
        for(var i in sticker)
        {
          if(sticker[i].y > (config.height + sticker[i].height) || !sticker[i].active)
          {
              master.sound.add('throw', {
                volume: 0.8
              }).play();
              sticker[i].enableBody(true, tar.x + ((sticker[i].width * 0.1)/2),
                tar.y + ((sticker[i].height * 0.1)/2), true, true);
              sticker[i].data.values.patchSticking = true;

              sticker[i].scale = 0.8;
              sticker[i].setVelocity(0, -175);


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
  for(var i in sticker)
  {
    //Gives moving from camera effect
    if(sticker[i].scale > 0.1 && sticker[i].active && sticker[i].data.values.patchSticking)
    {
        sticker[i].scale -= 0.032;
        sticker[i].setScale(sticker[i].scale, sticker[i].scale);
    }
    //Will drop when shrunk to a certain size
    else if(sticker[i].scale <= 0.1 && sticker[i].active && sticker[i].data.values.patchSticking)
    {
        this.sound.add('smack', {
          volume: 0.8
        }).play();
        sticker[i].disableBody(true, false);
        sticker[i].enableBody(true, sticker[i].x, sticker[i].y, true, true);
        sticker[i].data.values.patchSticking = false;
    }

    //Keeps position relative to laptop
    if(sticker[i].data.values.currentLaptop != -1)
      sticker[i].setPosition(laptop[sticker[i].data.values.currentLaptop].x + sticker[i].data.values.lapDiffX,
        laptop[sticker[i].data.values.currentLaptop].y + sticker[i].data.values.lapDiffY);
  }

  for(var j in laptops.children.entries)
  {
    if(laptop[j].active && laptop[j].y > config.height + laptop[j].height + 50)
    {
      //For optimisation reasons, laptop disables itself when it leaves the screen
      if(laptop[j].data.values.hasSticker && particle1.emitters.list[0].on)
        particle1.emitters.list[0].on = false;

      if(!laptop[j].data.values.hasSticker)
        this.sound.add('crash', {
          volume: Phaser.Math.FloatBetween(0.6, 0.7),
          rate: 1.0 + Phaser.Math.FloatBetween(-0.04, 0.04)
        }).play();
      laptop[j].disableBody(true, true);

      //Sticker resets when accompanying laptop leaves the screen
      var stickerIndex = sticker.findIndex((stick) => {
        return stick.data.values.currentLaptop == j;
      });
      if(stickerIndex != -1)
      {
        sticker[stickerIndex].data.values.currentLaptop = -1;
        sticker[stickerIndex].data.values.lapDiffX = 0;
        sticker[stickerIndex].data.values.lapDiffY = 0;
        sticker[stickerIndex].data.values.stickerOnLaptop = false;
        sticker[stickerIndex].body.setAllowGravity(true);
      }
    }

    //In bounce mode, laptops will leave the screen when the time runs out
    if(countdownSeconds - countdownTimer.getElapsedSeconds() <= 0 && modeSelect == 0)
      laptop[j].setCollideWorldBounds(false);
  }


  if(countdownCheck == null)
    countdownCheck = countdownSeconds;

  if(countdownTimer.paused) {
    if(gameDelay == null)
    {
      this.sound.play('timesUp');
      timerText.setText('Finish!');
      gameOver = true;
      gameDelay = this.time.addEvent(
        {
          delay: 2000,                // ms
          callback: ()=> {
            scoreText.setText('');
            timerText.setText('');
            tar.disableBody(true, true);
            var finish = this.sound.add('results');
            finish.play();
            particle2.emitters.list[0].on = true;

            var finishText = this.add.text(0, 0, 'All laptops are Patched',
            { fontFamily: "Arial, Carrois Gothic SC", fontSize: '45px',
            fontStyle: 'bold', fill: '#000' });
            finishText.setPosition(Math.floor((config.width/2) - (finishText.width/2)), (config.height/2) - 50);

            particle2.emitters.list[0].setPosition(finishText.width/2, (finishText.height/2) + 10);
            particle2.emitters.list[0].startFollow(finishText);
            this.time.addEvent(
              {
              delay: 5000,
              callback: ()=> {
                gameOver = false;
                var menuScene = this.scene.get('mainMenu');
                finish.stop();
                menuScene.scene.restart();
                this.scene.stop();
              },
              callbackScope: this,
              loop: false
              });
          },
          callbackScope: this,
          loop: false
        });
    }
  }

  howManyLaptopsHaveStickers = 0;
  for(var i in laptop) {
    if(laptop[i].data.values.hasSticker)
      howManyLaptopsHaveStickers++;
  }

  if(howManyLaptopsHaveStickers == laptopsAtOnce)
  {
    if(!countdownTimer.paused)
      countdownTimer.paused = true;
  }
  else
  {
    //Will indicate when last laptop is being chucked
    if(modeSelect == 1 && laptop.findIndex((lapt) =>
    { return lapt.data.values.delayActive == true }) == -1 && laptops.countActive(true) > 0)
      timerText.setText('Last one!');

    //Will initiate game over sequence when timer runs out
    else if(countdownSeconds - countdownTimer.getElapsedSeconds() <= 0)
    {
      if(gameDelay == null)
      {
        this.sound.play('timesUp');
        timerText.setText('Time\'s up');
        gameOver = true;
        gameDelay = this.time.addEvent(
          {
            delay: 2000,                // ms
            callback: ()=> {
              scoreText.setText('');
              timerText.setText('');
              tar.disableBody(true, true);
              var finish = this.sound.add('results');
              finish.play();
              particle2.emitters.list[0].on = true;

              //Dialog will change depending on how many laptops you have patched
              if(laptopsAtOnce - laptopsLeft == 0)
              {
                var finishText = this.add.text(0, 0, 'No laptops were patched',
                { fontFamily: "Arial, Carrois Gothic SC", fontSize: '45px',
                fontStyle: 'bold', fill: '#000' });
                finishText.setPosition(Math.floor((config.width/2) - (finishText.width/2)), (config.height/2) - 50);
                particle2.emitters.list[0].setPosition(finishText.width/2, (finishText.height/2) + 10);
                particle2.emitters.list[0].startFollow(finishText);
              }
              else if(laptopsAtOnce - laptopsLeft == 1)
              {
                var finishText = this.add.text(0, 0, 'You got ' + (laptopsAtOnce - laptopsLeft) + ' laptop',
                  { fontFamily: "Arial, Carrois Gothic SC", fontSize: '45px', fontStyle: 'bold', fill: '#000' });
                finishText.setPosition(Math.floor((config.width/2) - (finishText.width/2)), (config.height/2) - 50);
                particle2.emitters.list[0].setPosition(finishText.width/2, (finishText.height/2) + 10);
                particle2.emitters.list[0].startFollow(finishText);
              }

              else
              {
                var finishText = this.add.text(0, 0, 'You got ' + (laptopsAtOnce - laptopsLeft) + ' laptops',
                  { fontFamily: "Arial, Carrois Gothic SC", fontSize: '45px', fontStyle: 'bold', fill: '#000' });
                finishText.setPosition(Math.floor((config.width/2) - (finishText.width/2)), (config.height/2) - 50);
                particle2.emitters.list[0].setPosition(finishText.width/2, (finishText.height/2) + 10);
                particle2.emitters.list[0].startFollow(finishText);
              }

              this.time.addEvent(
                {
                delay: 5000,
                callback: ()=> {
                  gameOver = false;
                  var menuScene = this.scene.get('mainMenu');
                  finish.stop();
                  menuScene.scene.restart();
                  this.scene.stop();
                },
                callbackScope: this,
                loop: false
                });
            },
            callbackScope: this,
            loop: false
          });
      }
    }

    //Will occur if there are no laptops left to chuck and timer hasn't run out yet
    else if(modeSelect == 1 && laptop.findIndex((lapt) =>
    { return lapt.data.values.delayActive == true }) == -1 && laptops.countActive(true) === 0)
      timerText.setText('No More');

    //Countdown check will be compared against the floor of countdown seconds to see if it has changed; prevents unnecesary updates to second timer
    else if(countdownSeconds - countdownTimer.getElapsedSeconds() > 0
    && countdownCheck != countdownSeconds - Math.floor(countdownTimer.getElapsedSeconds()))
    {
      timerText.setText('Timer: ' + (countdownSeconds - Math.floor(countdownTimer.getElapsedSeconds())));
      countdownCheck = countdownSeconds - Math.floor(countdownTimer.getElapsedSeconds());
    }
  }
}
}}());

class MainMenu extends Phaser.Scene
{

  create ()
  {
      //Title
      var title = this.add.text(0, 0, 'Mission Patch Game',
        {fontFamily: "Arial, Carrois Gothic SC", fontSize: '30px', fontStyle: 'bold'});
        title.setPosition((config.width/2) - Math.floor(title.width/2), (config.height/2) - 180);


      title.setPosition(Math.floor((config.width/2) - (title.width/2)), (config.height/2) - 180);

      //Button to start game
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
          startButton.setStyle({ fill: '#aa0'});
          this.scene.start('mainGame');
          this.scene.stop();
        }
      })
      .on('pointerover', () => startButton.setStyle({ fill: '#ff0'}) )
      .on('pointerout', () => startButton.setStyle({ fill: '#fff' }) );
  }

}

class PauseMenu extends Phaser.Scene
{
  preload()
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

    // var button1 = this.add.image((config.width/2)-100, (config.height/2) + 150, 'button');
    // button1.setScale(0.25, 0.125);

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
            debug: false
        }
    }
};

var game = new Phaser.Game(config);

//List of scenes for game
game.scene.add('mainMenu', MainMenu);
game.scene.add('mainGame', mainGame);
game.scene.add('pauseMenu', PauseMenu);

game.scene.start('mainMenu');
