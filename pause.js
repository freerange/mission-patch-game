class PauseMenu extends Phaser.Scene
{
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
    // this.load.image('title-office', 'assets/spritesheets/office/Office-4.png'); //Not sure if I need to load this?
        resumeButton.setStyle({ fill: '#404'});
        this.sound.play('select');
        this.scene.resume('mainGame');
        this.scene.stop();
      }
    })
    .on('pointerover', () => {
      this.sound.play('hover');
      resumeButton.setStyle({ fill: '#808'});
    })
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
        this.sound.play('select');
        this.scene.start('mainMenu');
        this.scene.stop('mainGame');
        this.scene.stop();
      }
    })
    .on('pointerover', () => {
      this.sound.play('hover');
       quitButton.setStyle({ fill: '#808'});
     })
    .on('pointerout', () => quitButton.setStyle({ fill: '#000' }) );

    quitButton.setPosition(Math.floor(rect2.x + ((rect2.width/2)-(quitButton.width/2))), Math.floor(rect2.y + (rect2.height/2)))
  }
}
