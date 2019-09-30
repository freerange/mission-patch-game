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

game.scene.start('mainMenu', { locked: true });
