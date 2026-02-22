
const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
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
let phoneCallSound;
let meowSound;
let interactionText;
let interactionHint;
let thoughtCloud;
let thoughtText;
let thoughtHint;
let inventoryUI;
let volumeUI;
let etoMneSound;
let giveText;
let giveHint;
let shareHint;
let selectedItemIndex = 0;
let selectionArrow;
let isPassingItem = false;
let inventoryVisible = false;
let dialogueVisible = false;
let inventoryItems = ['proplan', 'felix', 'beer'];

const game = new Phaser.Game(config);

function preload() {
    this.load.image('BackGroundScene1', 'assets/images/backgrounds/BackGroundScene1.png');
    this.load.image('VikaHero', 'assets/images/characters/VikaHero.png');
    this.load.image('DauletHero', 'assets/images/characters/DauletHero.png');
    this.load.image('GeraltHero', 'assets/images/characters/GeraltHero.png');
    this.load.image('YenneferHero', 'assets/images/characters/YenneferHero.png');
    this.load.audio('backgroundMusic', 'assets/music/Hoobastank The Reason.mp3');
    this.load.audio('phoneCall', 'assets/music/PhoneCall.mp3');
    this.load.audio('meow', 'assets/music/Meow.mp3');
    this.load.audio('etoMne', 'assets/music/EtoMne.mp3');

    // Inventory items
    this.load.image('proplan', 'assets/images/items/proplan.png');
    this.load.image('felix', 'assets/images/items/felix.png');
    this.load.image('beer', 'assets/images/items/beer.png');
}

function create() {
    // Background
    const bgImage = this.add.image(960, 540, 'BackGroundScene1');
    bgImage.setDisplaySize(1920, 1080);

    // Music
    music = this.sound.add('backgroundMusic', { loop: true, volume: 0.5 });
    music.play();
    phoneCallSound = this.sound.add('phoneCall', { loop: false });
    meowSound = this.sound.add('meow', { loop: false });
    etoMneSound = this.sound.add('etoMne', { loop: false });

    // Player - Start at starting left corner
    player = this.physics.add.sprite(300, 900, 'VikaHero');
    player.setCollideWorldBounds(true);
    
    // Scaling to 160px height
    const vikaScale = 160 / player.height;
    player.setScale(vikaScale);
    // Refresh physics body to match scaled size
    player.setBodySize(player.width, player.height); 
    player.refreshBody();
    
    player.setY(1000 - (player.displayHeight / 2)); // Move to ground (moved slightly up)

    // NPCs
    npcs = this.physics.add.staticGroup();
    
    // Position NPCs closer to the middle of the scene
    const daulet = npcs.create(700, 900, 'DauletHero').setName('Daulet');
    const geralt = npcs.create(1000, 900, 'GeraltHero').setName('Geralt');
    const yennefer = npcs.create(1300, 900, 'YenneferHero').setName('Yennefer');

    daulet.setDisplaySize(daulet.width * (160 / daulet.height), 160);
    geralt.setDisplaySize(geralt.width * (80 / geralt.height), 80);
    yennefer.setDisplaySize(yennefer.width * (80 / yennefer.height), 80);

    daulet.setY(1000 - (daulet.displayHeight / 2));
    geralt.setY(1000 - (geralt.displayHeight / 2));
    yennefer.setY(1000 - (yennefer.displayHeight / 2));

    // Refresh bodies to match new display sizes for static group
    daulet.refreshBody();
    geralt.refreshBody();
    yennefer.refreshBody();

    // Breathing clouds (simple particles) for each NPC
    const particleConfig = {
        scale: { start: 0.1, end: 0 },
        alpha: { start: 0.5, end: 0 },
        speed: 10,
        lifespan: 1000,
        frequency: 2000,
        gravityY: -20,
        tint: 0xffffff
    };

    // Simple breathing animation for NPCs using tweens
    npcs.getChildren().forEach(npc => {
        const originalHeight = npc.displayHeight;
        this.tweens.add({
            targets: npc,
            displayHeight: originalHeight * 1.05,
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
        const emitter = this.add.particles(npc.x, npc.y - npc.displayHeight / 2, 'star', particleConfig);
        emitter.startFollow(npc, 0, -npc.displayHeight / 2);
    });

    // Interaction UI
    interactionText = this.add.text(0, 0, 'Поговорить', { 
        fontSize: '18px', 
        fill: '#fff', 
        backgroundColor: '#000',
        padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setVisible(false).setDepth(10);

    interactionHint = this.add.text(0, 0, 'E', { 
        fontSize: '14px', 
        fill: '#000', 
        backgroundColor: '#fff',
        padding: { x: 4, y: 1 }
    }).setOrigin(0.5).setVisible(false).setDepth(11);

    giveText = this.add.text(0, 0, 'Дать', { 
        fontSize: '18px', 
        fill: '#fff', 
        backgroundColor: '#000',
        padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setVisible(false).setDepth(10);

    giveHint = this.add.text(0, 0, 'F', { 
        fontSize: '14px', 
        fill: '#000', 
        backgroundColor: '#fff',
        padding: { x: 4, y: 1 }
    }).setOrigin(0.5).setVisible(false).setDepth(11);

    // Thought Cloud (Simple rectangle for now)
    thoughtCloud = this.add.graphics().setVisible(false).setDepth(20);
    thoughtCloud.fillStyle(0xffffff, 1);
    thoughtCloud.fillRoundedRect(0, 0, 160, 60, 10);
    thoughtCloud.lineStyle(2, 0x000000, 1);
    thoughtCloud.strokeRoundedRect(0, 0, 160, 60, 10);
    
    thoughtText = this.add.text(0, 0, 'Testing build 2', { 
        fontSize: '16px', 
        fill: '#000' 
    }).setOrigin(0.5).setVisible(false).setDepth(21);

    thoughtHint = this.add.text(0, 0, 'Нажмите E', { 
        fontSize: '12px', 
        fill: '#fff',
        backgroundColor: '#444',
        padding: { x: 3, y: 1 }
    }).setOrigin(0.5).setVisible(false).setDepth(22);

    // Share Hint (Gray box above dialogue)
    shareHint = this.add.text(0, 0, 'Нажмите F, чтобы поделиться', { 
        fontSize: '16px', 
        fill: '#fff',
        backgroundColor: '#808080', // Gray box
        padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setVisible(false).setDepth(25);

    // Inventory UI
    inventoryUI = this.add.container(960, 540).setScrollFactor(0).setVisible(false).setDepth(100);
    const bg = this.add.graphics();
    bg.fillStyle(0xffffcc, 1); // Bright yellow-ish background
    bg.fillRoundedRect(-200, -150, 400, 300, 10);
    bg.lineStyle(4, 0x000000, 1);
    bg.strokeRoundedRect(-200, -150, 400, 300, 10);
    inventoryUI.add(bg);

    const invTitle = this.add.text(0, -120, 'Викин Рюкзачок 🎒', { fontSize: '32px', fill: '#000', fontFamily: 'Times New Roman' }).setOrigin(0.5);
    inventoryUI.add(invTitle);

    const invInfo = this.add.text(0, -80, 'Выберите предмет с помощью стрелочек, нажмите F, чтобы поделиться предметом', { 
        fontSize: '14px', 
        fill: '#000', 
        fontFamily: 'Times New Roman',
        align: 'center',
        wordWrap: { width: 350 }
    }).setOrigin(0.5);
    inventoryUI.add(invInfo);

    inventoryItems.forEach((key, index) => {
        const itemImg = this.add.image(-100 + (index * 100), 0, key).setDisplaySize(80, 80);
        const itemText = this.add.text(-100 + (index * 100), 60, key.charAt(0).toUpperCase() + key.slice(1), { fontSize: '18px', fill: '#000', fontFamily: 'Times New Roman' }).setOrigin(0.5);
        inventoryUI.add(itemImg);
        inventoryUI.add(itemText);
    });

    selectionArrow = this.add.text(-100, -85, '▼', { fontSize: '30px', fill: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
    inventoryUI.add(selectionArrow);

    // Input
    cursors = this.input.keyboard.createCursorKeys();
    keys = this.input.keyboard.addKeys('E,F');

    // Volume Control UI (Top Right)
    volumeUI = this.add.container(1750, 100).setScrollFactor(0).setDepth(1000); // Moved lower and more to the left
    const volText = this.add.text(0, 0, 'Volume: 50%', { fontSize: '24px', fill: '#000', fontFamily: 'Times New Roman' }).setOrigin(1, 0.5);
    const volUp = this.add.text(10, 0, '+', { fontSize: '28px', fill: '#000', backgroundColor: '#ccc', padding: {x: 10, y: 5}, fontFamily: 'Times New Roman' }).setOrigin(0, 0.5).setInteractive();
    const volDown = this.add.text(50, 0, '-', { fontSize: '28px', fill: '#000', backgroundColor: '#ccc', padding: {x: 12, y: 5}, fontFamily: 'Times New Roman' }).setOrigin(0, 0.5).setInteractive();
    const volMute = this.add.text(90, 0, 'Mute', { fontSize: '24px', fill: '#000', backgroundColor: '#ccc', padding: {x: 10, y: 5}, fontFamily: 'Times New Roman' }).setOrigin(0, 0.5).setInteractive();
    
    volumeUI.add([volText, volUp, volDown, volMute]);

    this.sound.setVolume(0.5); // Initial volume at 50%

    volUp.on('pointerdown', () => {
        let newVol = Math.min(this.sound.volume + 0.1, 1);
        this.sound.setVolume(newVol);
        volText.setText(`Volume: ${Math.round(newVol * 100)}%`);
    });

    volDown.on('pointerdown', () => {
        let newVol = Math.max(this.sound.volume - 0.1, 0);
        this.sound.setVolume(newVol);
        volText.setText(`Volume: ${Math.round(newVol * 100)}%`);
    });

    volMute.on('pointerdown', () => {
        this.sound.setVolume(0);
        volText.setText(`Volume: 0%`);
    });
}

let activeNPC = null;

function handleNearNPC(player, npc) {
    activeNPC = npc;
}

function update() {
    // Check if player is near any NPC
    let isNearAnyNPC = false;
    let nearestNPC = null;

    npcs.getChildren().forEach(npc => {
        // Use distance-based check as it's more reliable for interaction than overlap sometimes
        const distance = Phaser.Math.Distance.Between(player.x, player.y, npc.x, npc.y);
        if (distance < 80) {
            nearestNPC = npc;
            isNearAnyNPC = true;
        }
    });

    activeNPC = nearestNPC;

    // Player Movement (No Jump, No Gravity)
    if (!inventoryVisible && !dialogueVisible) {
        if (cursors.left.isDown) {
            player.setVelocityX(-160);
            player.setFlipX(true);
        } else if (cursors.right.isDown) {
            player.setVelocityX(160);
            player.setFlipX(false);
        } else {
            player.setVelocityX(0);
        }
    } else {
        player.setVelocityX(0);
    }

    // Interaction UI Logic
    if (activeNPC) {
        if (!dialogueVisible && !inventoryVisible) {
            interactionText.setPosition(activeNPC.x, activeNPC.y - (activeNPC.displayHeight / 2) - 30).setVisible(true);
            interactionHint.setPosition(activeNPC.x, activeNPC.y - (activeNPC.displayHeight / 2) - 60).setVisible(true);
            giveText.setVisible(false);
            giveHint.setVisible(false);
            shareHint.setVisible(false);
        } else if (dialogueVisible) {
            interactionText.setVisible(false);
            interactionHint.setVisible(false);
            giveText.setVisible(false);
            giveHint.setVisible(false);
            shareHint.setPosition(activeNPC.x, activeNPC.y - (activeNPC.displayHeight / 2) - 160).setVisible(true);
        } else if (isPassingItem && !inventoryVisible) {
            // After dialogue, show Give (F) hint
            interactionText.setVisible(false);
            interactionHint.setVisible(false);
            giveText.setPosition(activeNPC.x, activeNPC.y - (activeNPC.displayHeight / 2) - 30).setVisible(true);
            giveHint.setPosition(activeNPC.x, activeNPC.y - (activeNPC.displayHeight / 2) - 60).setVisible(true);
            shareHint.setVisible(false);
        }
        
        if (Phaser.Input.Keyboard.JustDown(keys.E)) {
            if (dialogueVisible) {
                hideThoughtCloud();
                isPassingItem = false;
            } else if (!inventoryVisible) {
                showThoughtCloud.call(this, activeNPC);
                isPassingItem = true; // Enable sharing while dialogue is open
            }
        }

        if (isPassingItem && Phaser.Input.Keyboard.JustDown(keys.F) && !inventoryVisible && dialogueVisible) {
            inventoryVisible = true;
            inventoryUI.setVisible(true);
            hideThoughtCloud(); // Close the dialogue when inventory opens
            isPassingItem = false; 
        }
    } else {
        interactionText.setVisible(false);
        interactionHint.setVisible(false);
        giveText.setVisible(false);
        giveHint.setVisible(false);
        shareHint.setVisible(false);
        if (dialogueVisible) {
            hideThoughtCloud.call(this);
        }
        inventoryVisible = false;
        inventoryUI.setVisible(false);
        isPassingItem = false;
    }

    // Inventory selection logic
    if (inventoryVisible) {
        if (Phaser.Input.Keyboard.JustDown(cursors.left)) {
            selectedItemIndex = (selectedItemIndex - 1 + inventoryItems.length) % inventoryItems.length;
        } else if (Phaser.Input.Keyboard.JustDown(cursors.right)) {
            selectedItemIndex = (selectedItemIndex + 1) % inventoryItems.length;
        }
        selectionArrow.setX(-100 + (selectedItemIndex * 100));

        if (Phaser.Input.Keyboard.JustDown(keys.F) || Phaser.Input.Keyboard.JustDown(keys.E)) {
            // Confirm passing item
            const item = inventoryItems[selectedItemIndex];
            handleItemPass.call(this, activeNPC, item);
            inventoryVisible = false;
            inventoryUI.setVisible(false);
        }
    }
}

function handleItemPass(npc, item) {
    if (!npc) return;
    
    let success = false;
    if (npc.name === 'Daulet' && item === 'beer') success = true;
    if (npc.name === 'Geralt' && item === 'proplan') success = true;
    if (npc.name === 'Yennefer' && item === 'felix') success = true;

    if (success) {
        etoMneSound.play();
        console.log(`${npc.name} received ${item}`);
    } else {
        console.log(`${npc.name} doesn't want ${item}`);
    }
}

function showThoughtCloud(npc) {
    if (!this.time) return; // Guard for context issues
    thoughtCloud.setPosition(npc.x - 80, npc.y - (npc.displayHeight / 2) - 130).setVisible(true);
    thoughtText.setPosition(npc.x, npc.y - (npc.displayHeight / 2) - 110).setVisible(true);
    thoughtHint.setPosition(npc.x, npc.y - (npc.displayHeight / 2) - 85).setVisible(true);
    dialogueVisible = true;
    
    if (npc.name === 'Daulet') {
        phoneCallSound.play();
    } else if (npc.name === 'Geralt' || npc.name === 'Yennefer') {
        meowSound.play();
    }
}

function hideThoughtCloud() {
    thoughtCloud.setVisible(false);
    thoughtText.setVisible(false);
    thoughtHint.setVisible(false);
    shareHint.setVisible(false);
    dialogueVisible = false;
}
