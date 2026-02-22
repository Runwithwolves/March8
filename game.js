const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let player;
let cursors;
let keys;
let npcs;
let music;
let interactionText;
let thoughtCloud;
let thoughtText;

const game = new Phaser.Game(config);

function preload() {
    this.load.image('BackGroundScene1', 'assets/images/backgrounds/BackGroundScene1.png');
    this.load.image('VikaHero', 'assets/images/characters/VikaHero.png');
    this.load.image('DauletHero', 'assets/images/characters/DauletHero.png');
    this.load.image('GeraltHero', 'assets/images/characters/GeraltHero.png');
    this.load.image('YenneferHero', 'assets/images/characters/YenneferHero.png');
    this.load.audio('backgroundMusic', 'assets/music/Hoobastank The Reason.mp3');
}

function create() {
    // Background
    this.add.image(400, 300, 'BackGroundScene1');

    // Music
    music = this.sound.add('backgroundMusic', { loop: true });
    music.play();

    // Player
    player = this.physics.add.sprite(400, 500, 'VikaHero');
    player.setCollideWorldBounds(true);

    // NPCs
    npcs = this.physics.add.staticGroup();
    
    const daulet = npcs.create(200, 300, 'DauletHero').setName('Daulet');
    const geralt = npcs.create(400, 300, 'GeraltHero').setName('Geralt');
    const yennefer = npcs.create(600, 300, 'YenneferHero').setName('Yennefer');

    // Simple breathing animation for NPCs using tweens
    npcs.getChildren().forEach(npc => {
        this.tweens.add({
            targets: npc,
            scaleY: 1.05,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Minor shadow (simple ellipse below NPC)
        const shadow = this.add.ellipse(npc.x, npc.y + npc.displayHeight / 2, 40, 10, 0x000000, 0.3);
        this.tweens.add({
            targets: shadow,
            scaleX: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    });

    // Interaction UI
    interactionText = this.add.text(0, 0, 'Поговорить', { 
        fontSize: '18px', 
        fill: '#fff', 
        backgroundColor: '#000',
        padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setVisible(false);

    // Thought Cloud (Simple rectangle for now)
    thoughtCloud = this.add.graphics().setVisible(false);
    thoughtCloud.fillStyle(0xffffff, 1);
    thoughtCloud.fillRoundedRect(0, 0, 150, 40, 10);
    thoughtCloud.lineStyle(2, 0x000000, 1);
    thoughtCloud.strokeRoundedRect(0, 0, 150, 40, 10);
    
    thoughtText = this.add.text(0, 0, 'Test build 1', { 
        fontSize: '16px', 
        fill: '#000' 
    }).setOrigin(0.5).setVisible(false);

    // Input
    cursors = this.input.keyboard.createCursorKeys();
    keys = this.input.keyboard.addKeys('E,F');

    // Physics overlap for interaction detection
    this.physics.add.overlap(player, npcs, handleNearNPC, null, this);
}

let activeNPC = null;

function handleNearNPC(player, npc) {
    activeNPC = npc;
}

function update() {
    // Reset active NPC and UI visibility at the start of update
    // We'll re-set it in the overlap callback if player is still near
    const wasNear = activeNPC;
    activeNPC = null;
    
    // Check overlap again manually or let the physics engine handle it
    // Phaser overlap runs before update, so activeNPC will be set if touching
    
    // Player Movement (No Jump, No Gravity)
    player.setVelocity(0);

    if (cursors.left.isDown) {
        player.setVelocityX(-160);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
    }

    if (cursors.up.isDown) {
        player.setVelocityY(-160);
    } else if (cursors.down.isDown) {
        player.setVelocityY(160);
    }

    // Interaction UI Logic
    if (activeNPC) {
        interactionText.setPosition(activeNPC.x, activeNPC.y - 60).setVisible(true);
        
        if (Phaser.Input.Keyboard.JustDown(keys.E)) {
            showThoughtCloud(activeNPC);
        }
    } else {
        interactionText.setVisible(false);
        hideThoughtCloud();
    }

    // Inventory logic
    if (Phaser.Input.Keyboard.JustDown(keys.F)) {
        console.log("Inventory opened (Test build 1)");
        // Add more inventory logic here if needed
    }
}

function showThoughtCloud(npc) {
    thoughtCloud.setPosition(npc.x - 75, npc.y - 110).setVisible(true);
    thoughtText.setPosition(npc.x, npc.y - 90).setVisible(true);
    
    // Auto hide after 3 seconds
    this.time.delayedCall(3000, () => {
        hideThoughtCloud();
    });
}

function hideThoughtCloud() {
    thoughtCloud.setVisible(false);
    thoughtText.setVisible(false);
}
