const PLAYER_SPEED = 20;
const PLAYER_WIDTH = 40;

const LAZER_SPEED = 30;

const ENEMY_PATHS = [
    [
        120, 120,
        234, 311,
        615, 76,
        875, 120,
    ],
    [
        120, 120,
        192, 276,
        510, 433,
        782, 283,
        875, 120,
    ],
    [
        120, 120,
        476, 432,
        574, 325,
        444, 281,
        542, 458,
        743, 361,
        875, 120,
    ],
    [
        120, 120,
        239, 27,
        765, 25,
        875, 120,
    ],
    [
        120, 120,
        519, 457,
        875, 120,
    ],
    [
        120, 120,
        226, 292,
        395, 69,
        538, 291,
        715, 86,
        792, 280,
        875, 120,
    ],
    [
        120, 120,
        72, 315,
        947, 319,
        875, 120,
    ]
];

class SpaceSwarm extends Phaser.Scene {
    
    titleText;
    pressSpaceText;

    wave = 0;
    remainingInWave = 5;

    character;
    lazers = [];
    aKey; dKey; spaceKey;
    canShoot = true;
    canShootTimeout;

    spawnInterval;
    enemies = [];
    enemyLazers = [];

    constructor() {
        super("Game");
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.atlasXML("spritesheet", "spritesheet.png", "spritesheet.xml");
        this.load.audio("explosion", ["explosion.ogg"]);
        this.load.audio("laser1", ["laser1.ogg"]);
        this.load.audio("laser2", ["laser2.ogg"]);
    }

    create() {
        this.character = this.add.sprite(500, 700, "spritesheet", "playerShip1_blue.png");

        this.aKey = this.input.keyboard.addKey("A");
        this.dKey = this.input.keyboard.addKey("D");
        this.spaceKey = this.input.keyboard.addKey("space");

        this.initGame();
    }

    initGame() {
        this.character.x = 500;
        this.wave = 0;
        this.setupWave()
        this.spawnInterval = setInterval(() => {
            if(this.remainingInWave == 0) {
                return;
            }
            this.remainingInWave--;
            var x = 100;
            if(Math.random() > 0.5) {
                x = 875;
            }
            var enemy = {
                sprite: this.add.follower(new Phaser.Curves.Spline([]), x, 120, "spritesheet", "enemyRed1.png"),
                shootInterval: null,
                moveTimeout: null
            };
            this.enemies.push(enemy);
            this.moveEnemy(enemy);
            enemy.shootInterval = setInterval(() => {
                if(this.wave == 0) {
                    return;
                }
                if(Math.random() < 0.5 && Math.abs(enemy.sprite.x - this.character.x) < 100) {
                    var lazer = this.add.sprite(enemy.sprite.x, enemy.sprite.y + 20, "spritesheet", "laserRed01.png");
                    lazer.rotation = Math.PI;
                    this.sound.play("laser2");
                    this.enemyLazers.push(lazer);
                }
            }, 300);
        }, 1500);
    }

    setupWave() {
        while(this.enemies.length > 0) {
            this.deleteEnemy(this.enemies[0]);
        }
        if(this.wave == 0) {
            this.character.x = 500;
            this.titleText = this.add.text(245, 200, "Space Swarm", { fontFamily: "VT323", fontSize: 120, color: "cyan" });
            this.titleText.depth = 1;
            this.pressSpaceText = this.add.text(300, 500, "Press SPACE to play...", { fontFamily: "VT323", fontSize: 48 });
            this.pressSpaceText.depth = 1;
        }
        else if(this.wave == -1) {
            this.character.x = 500;
            this.titleText = this.add.text(260, 200, "Game Over", { fontFamily: "VT323", fontSize: 120, color: "red" });
            this.titleText.depth = 1;
            this.pressSpaceText = this.add.text(300, 500, "Press SPACE to play again...", { fontFamily: "VT323", fontSize: 48 });
            this.pressSpaceText.depth = 1;
        }
        else if(this.wave == -2) {
            this.character.x = 500;
            this.titleText = this.add.text(300, 200, "You Win!", { fontFamily: "VT323", fontSize: 120, color: "green" });
            this.titleText.depth = 1;
            this.pressSpaceText = this.add.text(250, 500, "Press SPACE to play again...", { fontFamily: "VT323", fontSize: 48 });
            this.pressSpaceText.depth = 1;
        }
        else {
            this.titleText.destroy();
            this.pressSpaceText.destroy();
        }
        if(this.wave == 0 || this.wave == 1) {
            this.remainingInWave = 5;
        }
    }

    moveEnemy(enemy) {
        var pathIndex = Math.floor(Math.random() * ENEMY_PATHS.length);
        var points = new Array(...ENEMY_PATHS[pathIndex]);
        enemy.sprite.y = 120;
        if(enemy.sprite.x > this.game.config.width / 2) {
            enemy.sprite.x = 875;
            for(var j = 0; j < points.length / 2; j++) {
                points[j * 2] *= -1;
            }
        } else {
            enemy.sprite.x = 120;
        }
        enemy.sprite.path = new Phaser.Curves.Spline(points);
        enemy.sprite.startFollow({
            duration: 2700
        });
        enemy.moveTimeout = setTimeout(() => this.moveEnemy(enemy), 2700);
    }

    deleteEnemy(enemy) {
        enemy.sprite.destroy();
        if(enemy.shootInterval !== null) {
            clearInterval(enemy.shootInterval);
        }
        if(enemy.moveTimeout !== null) {
            clearTimeout(enemy.moveTimeout);
        }
        var index = this.enemies.indexOf(enemy);
        if(index >= 0) {
            this.enemies.splice(index, 1);
        }
    }
    
    ellipticalCollision(spriteA, scaleA, spriteB, scaleB) {
        var totalRadiusX = (spriteA.width * scaleA + spriteB.width * scaleB) / 2;
        var totalRadiusY = (spriteA.height * scaleA + spriteB.height * scaleB) / 2;

        var offsetX = (spriteB.x - spriteA.x) / totalRadiusX;
        var offsetY = (spriteB.y - spriteA.y) / totalRadiusY;

        return (offsetX * offsetX + offsetY * offsetY) < 1;
    }

    maybeProgressWave() {
        if(this.enemies.length > 0 || this.remainingInWave > 0) {
            return;
        }
        setTimeout(() => {
            this.wave += 1;
            if(this.wave > 1) {
                this.wave = -2;
            }
            this.setupWave();
        }, 500);
    }

    updateControls() {
        if(this.aKey.isDown && this.wave > 0) {
            this.character.x -= PLAYER_SPEED;
            if(this.character.x < (this.character.width / 2)) {
                this.character.x = this.character.width / 2;
            }
        }
        if(this.dKey.isDown && this.wave > 0) {
            this.character.x += PLAYER_SPEED;
            if(this.character.x > this.game.config.width - (this.character.width / 2)) {
                this.character.x = this.game.config.width - (this.character.width / 2);
            }
        }
        if(this.spaceKey.isDown) {
            if(this.wave <= 0) {
                this.wave = 1;
                this.setupWave();
            }
            else if(this.canShoot) {
                this.sound.play("laser1");
                this.lazers.push(this.add.sprite(this.character.x, this.character.y - 20, "spritesheet", "laserBlue01.png"))
                this.canShoot = false;
                this.canShootTimeout = setTimeout(() => {
                    this.canShoot = true;
                    this.canShootTimeout = null;
                }, 300);
            }
        }
    }

    updateEnemyLazers() {
        for(var i = 0; i < this.enemyLazers.length; i++) {
            var hit = false;
            this.enemyLazers[i].y += LAZER_SPEED;
            if(this.ellipticalCollision(this.enemyLazers[i], 1, this.character, 0.8)) {
                hit = true;
            }
            if(this.enemyLazers[i].y - (this.enemyLazers[i].height / 2) > this.game.config.height) {
                hit = true;
            }

            if(hit) {
                this.enemyLazers[i].destroy();
                this.enemyLazers.splice(i, 1);
                i--;
            }
        }
    }

    updateLazers() {
        for(var i = 0; i < this.lazers.length; i++) {
            var hit = false;
            this.lazers[i].y -= LAZER_SPEED;
            for(var j = 0; j < this.enemies.length; j++) {
                if(this.ellipticalCollision(this.lazers[i], 1, this.enemies[j].sprite, 0.8)) {
                    hit = true;
                    this.sound.play("explosion");
                    this.deleteEnemy(this.enemies[j]);
                    this.maybeProgressWave();
                    break;
                }
            }
            if(this.lazers[i].y + (this.lazers[i].height / 2) < 0) {
                hit = true;
            }

            if(hit) {
                this.lazers[i].destroy();
                this.lazers.splice(i, 1);
                i--;
            }
        }
    }

    update() {
        this.updateControls();
        this.updateEnemyLazers();
        this.updateLazers();
    }
}
