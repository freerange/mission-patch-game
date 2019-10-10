class Instructions extends Phaser.Scene
{
  init (data)
  {
    this.titleName = data.titleName;
    this.description = data.description;
    this.stickersAtOnce = data.stickersAtOnce;
    this.totalLaptopsToGet = data.totalLaptopsToGet;
    this.countdownSeconds = data.countdownSeconds;
    this.modeSelect = data.modeSelect;
  }

  create ()
  {
    //Notepad for title and description
    var notepad = this.add.sprite(0, 0, 'pad').setOrigin(0, 0);
    notepad.setScale(1.5, 1.1);
    notepad.setSize(notepad.width*notepad.scaleX, notepad.height*notepad.scaleY);
    notepad.setPosition((config.width/2) - (notepad.width/2), ((config.height/8)*3) - (notepad.height/2));
    //Title
    var title = this.add.text(0, 0, this.titleName,
      {fontFamily: "Indie Flower, Arial, Carrois Gothic SC", fontSize: '30px', fill: '#000', fontStyle: 'bold'});
      title.setPosition(notepad.x + ((notepad.width/2) - Math.floor(title.width/2)), Math.floor(notepad.y + 5));

    //Description
    var desc = this.add.text(Math.floor(notepad.x + 10), Math.floor(notepad.y + ((notepad.height/10)*3) - 10),
      this.description, {fontFamily: "Indie Flower, Arial, Carrois Gothic SC", fontSize: '22px', fill: '#000' });

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
            this.scene.start('mainGame', { stickersAtOnce: this.stickersAtOnce, totalLaptopsToGet: this.totalLaptopsToGet, countdownSeconds: this.countdownSeconds, modeSelect: this.modeSelect});
            this.scene.stop('mainMenu');
            this.scene.stop();
          }
        })
        .on('pointerover', () => {
          this.sound.play('hover');
          playButton.setStyle({ fill: '#808'});
        })
        .on('pointerout', () => playButton.setStyle({ fill: '#000' }) );

    playButton.setPosition(Math.floor(playPostItNote.x + ((playPostItNote.width/2)-(playButton.width/2))), Math.floor(playPostItNote.y + (playPostItNote.height/2)));
  }
}
