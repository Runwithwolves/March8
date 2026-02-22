
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
    pixelArt: true,
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
let inventoryUI;
let inventoryVisible = false;
let inventoryItems = [];

const game = new Phaser.Game(config);

function preload() {
    this.load.image('BackGroundScene1', 'assets/images/backgrounds/BackGroundScene1.png');
    this.load.image('VikaHero', 'assets/images/characters/VikaHero.png');
    this.load.image('DauletHero', 'assets/images/characters/DauletHero.png');
    this.load.image('GeraltHero', 'assets/images/characters/GeraltHero.png');
    this.load.image('YenneferHero', 'assets/images/characters/YenneferHero.png');
    this.load.audio('backgroundMusic', 'assets/music/Hoobastank The Reason.mp3');

    // Inventory items
    this.load.image('proplan', 'assets/images/items/proplan.png');
    this.load.image('felix', 'assets/images/items/felix.png');
    this.load.image('beer', 'assets/images/items/beer.png');
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
    player.setDisplaySize(player.width * (64 / player.height), 64);

    // NPCs
    npcs = this.physics.add.staticGroup();
    
    const daulet = npcs.create(200, 300, 'DauletHero').setName('Daulet');
    const geralt = npcs.create(400, 300, 'GeraltHero').setName('Geralt');
    const yennefer = npcs.create(600, 300, 'YenneferHero').setName('Yennefer');

    daulet.setDisplaySize(daulet.width * (64 / daulet.height), 64);
    geralt.setDisplaySize(geralt.width * (32 / geralt.height), 32);
    yennefer.setDisplaySize(yennefer.width * (32 / yennefer.height), 32);

    // Breathing clouds (simple particles)
    const particles = this.add.particles(0, 0, 'star', {
        scale: { start: 0.1, end: 0 },
        alpha: { start: 0.5, end: 0 },
        speed: 10,
        lifespan: 1000,
        frequency: 2000,
        gravityY: -20,
        tint: 0xffffff
    });

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
        const shadow = this.add.ellipse(npc.x, npc.y + (npc.displayHeight / 2), 40, 10, 0x000000, 0.3);
        this.tweens.add({
            targets: shadow,
            scaleX: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Add breathing cloud to NPC head
        particles.addEmitter({
            follow: npc,
            followOffset: { x: 0, y: -npc.displayHeight / 2 },
            emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-5, -5, 10, 10) }
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
    
    thoughtText = this.add.text(0, 0, 'Testing build 2', { 
        fontSize: '16px', 
        fill: '#000' 
    }).setOrigin(0.5).setVisible(false);

    // Inventory UI
    inventoryUI = this.add.container(400, 300).setScrollFactor(0).setVisible(false).setDepth(100);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRoundedRect(-150, -100, 300, 200, 10);
    bg.lineStyle(2, 0xffffff, 1);
    bg.strokeRoundedRect(-150, -100, 300, 200, 10);
    inventoryUI.add(bg);

    const invTitle = this.add.text(0, -80, 'Inventory', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
    inventoryUI.add(invTitle);

    const itemKeys = ['proplan', 'felix', 'beer'];
    itemKeys.forEach((key, index) => {
        const itemImg = this.add.image(-100 + (index * 100), 0, key).setDisplaySize(50, 50);
        const itemText = this.add.text(-100 + (index * 100), 40, key.charAt(0).toUpperCase() + key.slice(1), { fontSize: '14px', fill: '#fff' }).setOrigin(0.5);
        inventoryUI.add(itemImg);
        inventoryUI.add(itemText);
    });

    // Input
    cursors = this.input.keyboard.createCursorKeys();
    keys = this.input.keyboard.addKeys('E,F');

    // Physics overlap for interaction detection
    // Note: We'll use a property to track if player is currently overlapping an NPC
    this.physics.add.overlap(player, npcs, (player, npc) => {
        activeNPC = npc;
    }, null, this);
}

let activeNPC = null;

function handleNearNPC(player, npc) {
    activeNPC = npc;
}

function update() {
    // We'll check if player is currently overlapping any NPC from the group
    let isNearAnyNPC = false;
    npcs.getChildren().forEach(npc => {
        if (this.physics.overlap(player, npc)) {
            activeNPC = npc;
            isNearAnyNPC = true;
        }
    });

    if (!isNearAnyNPC) {
        activeNPC = null;
    }

    // Player Movement (No Jump, No Gravity)
    player.setVelocity(0);

    // Don't allow movement if inventory is open
    if (!inventoryVisible) {
        if (cursors.left.isDown) {
            player.setVelocityX(-160);
            player.setFlipX(true);
        } else if (cursors.right.isDown) {
            player.setVelocityX(160);
            player.setFlipX(false);
        }
    }

    // Interaction UI Logic
    if (activeNPC) {
        interactionText.setPosition(activeNPC.x, activeNPC.y - (activeNPC.displayHeight / 2) - 30).setVisible(true);
        
        if (Phaser.Input.Keyboard.JustDown(keys.E)) {
            showThoughtCloud(activeNPC);
        }
    } else {
        interactionText.setVisible(false);
        hideThoughtCloud();
    }

    // Inventory logic
    if (Phaser.Input.Keyboard.JustDown(keys.F)) {
        inventoryVisible = !inventoryVisible;
        inventoryUI.setVisible(inventoryVisible);
        console.log("Inventory " + (inventoryVisible ? "opened" : "closed"));
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
