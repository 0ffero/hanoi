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
    vars.groups.init();
    vars.audio.init();
    vars.localStorage.init();

    if (totalTime < 1000) {
        setTimeout( ()=> {
            init();
        }, 1000-totalTime);
    } else {
        init();
    }
}




function init() {
    let li = scene.children.getByName('loadingImage');
    scene.tweens.add({
        targets: li,
        alpha: 0,
        duration: 500
    })
    // DRAW GAME BOARD
    // INPUT
    vars.input.init();
    // UI
    vars.UI.init();
    vars.game.init();
}