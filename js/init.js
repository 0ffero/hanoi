if (vars.DEBUG===true) { console.log('Initialising...'); }

var config = {
    title: "HANOI",
    type: Phaser.WEBGL,

    backgroundColor: '#000000',
    disableContextMenu: true,

    height: vars.canvas.height,
    width: vars.canvas.width,

    scale: {
        parent: 'HANOI',
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: vars.canvas.width,
        height: vars.canvas.height,
    },

    scene: {
        preload: preload,
        create: create,
        update: update,
        pack: {
            files: [
                { type: 'image', key: 'loadingImage', url: 'assets/images/mainScreen.png' }
            ]
        }
    }
};

var game = new Phaser.Game(config);


/*
█████ ████  █████ █      ███  █████ ████  
█   █ █   █ █     █     █   █ █   █ █   █ 
█████ ████  ████  █     █   █ █████ █   █ 
█     █   █ █     █     █   █ █   █ █   █ 
█     █   █ █████ █████  ███  █   █ ████  
*/
var startTime = new Date();
function preload() {
    scene = this;
    scene.load.setPath('assets');
    scene.add.image(vars.canvas.cX, vars.canvas.cY, 'loadingImage').setName('loadingImage').setDepth(100);
    vars.files.loadAssets();
}



/*
█████ ████  █████ █████ █████ █████ 
█     █   █ █     █   █   █   █     
█     ████  ████  █████   █   ████  
█     █   █ █     █   █   █   █     
█████ █   █ █████ █   █   █   █████ 
*/
function create() {
    let endTime = new Date();
    let totalTime = endTime - startTime; startTime=undefined;
    // INITIALISE VARIABLES, OBJECTS & ARRAYS
    vars.init();
    vars.localStorage.init();
    vars.groups.init();
    vars.audio.init();

    if (totalTime < 2500) { setTimeout( ()=> { init(); }, 2500-totalTime); } else { init(); }
}




function init() {
    let li = scene.children.getByName('loadingImage');
    scene.tweens.add({ targets: li, alpha: 0, duration: 500 })
    // UI
    vars.UI.init();
    // DRAW GAME PIECES
    vars.game.init();
    // INPUT
    vars.input.init();
}