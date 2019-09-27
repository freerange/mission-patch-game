class MainMenu extends Phaser.Scene
{
  init (data)
  {
    this.locked = data.locked;
  }

  preload ()
  {
    //Game waits for web fonts to load before starting
    let font1 = new FontFaceObserver('Indie Flower');
    let font2 = new FontFaceObserver('Saira Stencil One');
    font1.load().then(function () {});
    font2.load().then(function () {});

    //Loads all assets
    this.load.image('laptop_0', 'assets/laptop.png');
    this.load.image('target', 'assets/cursor.png');
    // this.load.image('table', 'assets/table.png');
    this.load.image('sky', 'assets/sky.png');

    //Patch Designs
    this.load.image('patch_1', 'assets/patch.png');
    this.load.image('patch_2', 'assets/patch-2.png');
    this.load.image('patch_3', 'assets/patch-3.png');
    this.load.image('patch_4', 'assets/patch-4.png');
    this.load.image('patch_5', 'assets/patch-5.png');

    //Vector Graphics Images
    this.load.svg('note', 'assets/post_it.svg', {
      width: 100,
      height: 200
    });
    this.load.svg('pad', 'assets/note_pad.svg', {
      scale: 1.8
    });
    this.load.svg('lock', 'assets/Lock-Icon.svg', {
      width: 50,
      height: 100
    });

    //Spritesheet assets
    this.load.multiatlas('office', 'assets/spritesheets/office/Office.json', 'assets/spritesheets/office');
    this.load.spritesheet('emoji', 'assets/spritesheets/emoji.png', { frameWidth: 122, frameHeight: 122 });
    this.load.spritesheet('laptop_1', 'assets/spritesheets/laptop.png', { frameWidth: 252, frameHeight: 202 });
    this.load.spritesheet('laptop_2', 'assets/spritesheets/laptop-blue.png', { frameWidth: 252, frameHeight: 202 });
    this.load.spritesheet('laptop_3', 'assets/spritesheets/laptop-red.png', { frameWidth: 252, frameHeight: 202 });
    this.load.spritesheet('laptop_4', 'assets/spritesheets/laptop-green.png', { frameWidth: 252, frameHeight: 202 });

    //Particle Assets
    this.load.atlas('shapes', 'assets/particles/shapes.png', 'assets/particles/shapes.json');
    this.load.text('blast', 'assets/particles/Blast.json');
    this.load.text('explosion', 'assets/particles/Explosion.json');

    //Sound assets taken and edited from freesound.com
    this.load.audio('gong', 'sounds/266566__gowlermusic__gong-hit(edited).wav');
    this.load.audio('throw', 'sounds/322224__liamg-sfx__arrow-nock.wav');
    this.load.audio('laptThrow', 'sounds/60013__qubodup__whoosh(edited).wav');
    this.load.audio('smack', 'sounds/37186__volivieri__newspapers-large-hard(edited).wav');
    this.load.audio('hit', 'sounds/399294__komit__synth-sparkle(edited).wav');
    this.load.audio('crash', 'sounds/267482__lightdj__book-dropping-2(edited).wav');
    this.load.audio('timesUp', 'sounds/198841__bone666138__analog-alarm-clock(edited).wav');
    this.load.audio('results', 'sounds/182369__kingsrow__fire-crackling-01(edited).wav');
    this.load.audio('blocked', 'sounds/327737__distillerystudio__error-02.wav');
    this.load.audio('hover', 'sounds/320148__owlstorm__paper-sketchbook-page-flips-1(edited).wav');
    this.load.audio('select', 'sounds/63318__flag2__page-turn-please-turn-over-pto-paper-turn-over(edited).wav');

    //Done to prevent sound stacking when inactive
    this.sound.pauseOnBlur = false;
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

      function launchButton(x, y, stickers, laptops, seconds, mode, title, description) {
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
              master.sound.play('select');
              master.scene.pause();
              master.scene.launch('info', { titleName: title.replace("\n", " "), description: description,
                stickersAtOnce: stickers, totalLaptopsToGet: laptops, countdownSeconds: seconds, modeSelect: mode });
            }
        })
        .on('pointerover', () => {
          master.sound.play('hover');
          gameModeText.setStyle({ fill: '#808'});
        })
        .on('pointerout', () => gameModeText.setStyle({ fill: '#000' }) );

        gameModeText.setAlign('center');
        gameModeText.setPosition(Math.floor(postItNote.x + ((postItNote.width/2)-(gameModeText.width/2))), Math.floor(postItNote.y + (postItNote.height/2) - (gameModeText.height/2)));

        return gameModeText;
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
          this.sound.play('select');

          //Buttons to start modes
          var chuckButton = launchButton((config.width/2) - 170, (config.height/2)-100, 5, 100, 150, 1, 'Chuck\nmode',
            'Catch the incoming flying laptops by sticking them \nwith a mission patch within two minutes. Move \nthe cursor around the screen and click to throw \na sticker.');
          var bounceButton = launchButton((config.width/2) + 70, (config.height/2)-100, 3, 10, 30, 0, 'Bounce\nmode',
            'Stop the laptops from bouncing around by \nsticking them with a mission patch before time \nruns out.');

          if(this.locked) {
            bounceButton.destroy();
            var lock = this.add.sprite(0, 0, 'lock').setOrigin(0, 0)
            .setInteractive()
            .on('pointerdown', (pointer)=> {
              this.sound.play('blocked');
            });
            lock.setPosition(Math.floor(postItNotes[1].x + ((postItNotes[1].width/2)-(lock.width/2))), Math.floor(postItNotes[1].y + (postItNotes[1].height/2) - (lock.height/2)));

          }
        }
      })
      .on('pointerover', () => {
        this.sound.play('hover');
        startButton.setStyle({ fill: '#808'})
      })
      .on('pointerout', () => startButton.setStyle({ fill: '#000' }) );

      startButton.setPosition(Math.floor(rect.x + ((rect.width/2)-(startButton.width/2))), Math.floor(rect.y + (rect.height/2)));
  }
}
