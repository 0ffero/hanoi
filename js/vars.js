var vars = {
    DEBUG: true,

    version: 0.5,

    init: function() {
        let redInc = 1114112; let blueInc = 17; let div=2;
        let pT = vars.pieces.tints;
        for (r=0; r<16/div; r++) { // create 8 colours
            let red = redInc * (15-r*div); let blue = blueInc*(r*div); let colour = red+blue;
            pT.push(colour);
        }
    },

    // ENGINE FUNCTIONS
    canvas: {
        width: 1920, height: 1080,
        cX: 1920/2, cY: 1080/2,
    },

    durations: {
        pieceMoveUpMax     : 250,
        pieceMoveAcrossMax : 250,
        pieceMoveDownMax   : 250
    },

    files: {
        audio: {
            load: function() {
                scene.load.audio('liftPiece', 'audio/lift.ogg');
                scene.load.audio('dropPiece', 'audio/drop.ogg');
                scene.load.audio('perfectScore', 'audio/perfectScore.ogg');
                scene.load.audio('sparkler', 'audio/sparkler.ogg');
            }
        },

        images: {
            init: function() {
                scene.load.image('background',   'images/background.jpg');
                scene.load.image('base',         'images/base.png');
                scene.load.image('perfectScore', 'images/perfectScoreWAlpha.png');
                scene.load.image('piece',        'images/piece.png');
                scene.load.image('spike',        'images/spike.png');
                scene.load.image('winner',       'images/winner.png');
                scene.load.image('spark1',       'particles/white.png');
                //scene.load.spritesheet('key', 'images/filename.png', { frameWidth: 100, frameHeight: 100 })
                //scene.load.atlas('key', 'images/filename.png', 'images/filename.json');
            }
        },

        loadAssets: function() {
            let fV = vars.files;
            fV.audio.load();
            fV.images.init();
        }
    },

    groups: {
        init: function() {
            scene.groups = { };
            scene.groups.pegs   = scene.add.group().setName('pegsGroup');
            scene.groups.pieces = scene.add.group().setName('piecesGroup');
            scene.groups.ui     = scene.add.group().setName('uiGroup');
        }
    },

    localStorage: {
        init: function() {
            let lS = window.localStorage;
            if (lS.hanoi_scores===undefined) { 
                lS.hanoi_scores = '3:9999;4:9999;5:9999;6:9999;7:9999';
            } else {
                let pScores = vars.player.scores;
                let scoreSet = lS.hanoi_scores.split(';');
                scoreSet.forEach( (c)=> {
                    let scores = c.split(':');
                    pScores[scores[0]] = parseInt(scores[1]);
                })
            }
        },
    
        resetScores: function() {
            let lS = window.localStorage;
            lS.hanoi_scores = '3:9999;4:9999;5:9999;6:9999;7:9999';
        },

        saveScores: function() {
            let lS = window.localStorage; let scores = vars.player.scores;
            let scoreStr = '';
            [...[3,4,5,6,7]].forEach( (c)=> { scoreStr += c.toString() + ':' + scores[c] + ';'; })
            lS.hanoi_scores = scoreStr;
        }
    },

    // GAME

    animate: {
        mvoePiece: function(_position) {
            
        },
    },

    audio: {
        init: function() {
            scene.sound.volume=0.2;
        },

        perfectScore: function() {
            scene.sound.play('perfectScore');
        },

        pieceMoveUp: function() {

        },

        pieceMoveDown: function() {

        },

        sparklers: function(_enable=true) {
            if (_enable===true) {
                scene.sound.play('sparkler', {loop: true})
            } else {
                scene.sound.stopByKey('sparkler');
            }
        }
    },

    game: {
        basePieceY: 790,
        difficultyLevels: [3,4,5,6,7], // basically the piece count
        difficulty: 3,
        difficultyMax: 7,
        initialPosition: 1,
        liftedPiece: -1,
        pieceHeight: 160,
        piecePositions: { spike_1: [], spike_2: [], spike_3: [] },
        solution: [],
        spikeOver: -1,
        spikeFrom: -1,
        spikePositionsX: [],

        init: function() {
            
        },

        checkForWin() {
            let gV = vars.game;
            [...[1,2,3]].forEach( (c)=>{
                if (gV.piecePositions['spike_' + c].length===gV.difficulty) {
                    if (c!==gV.initialPosition) { // win found
                        vars.game.winner();
                    }
                }
            })
        },

        clearPickUpVars: function(){
            let gV = vars.game;
            if (gV.spikeFrom!==gV.spikeOver) { vars.player.moves++; vars.UI.updateMoveCount(); }
            gV.liftedPiece = -1;
            gV.spikeFrom = -1;
            gV.spikeOver = -1;
        },

        generateSolution: function() {
            let movingTo = getRandom([2,3])
            h(vars.game.difficulty,vars.game.initialPosition,movingTo);
        },

        restart: function() {
            vars.player.moves=0;
        },

        winner: function(){
            vars.UI.winner();
        }

    },

    input: {
        init: function() {
            scene.input.on('gameobjectdown', function (pointer, object) {
                if (object.name.includes('piece_') || object.name.includes('spike_')) {
                    vars.input.moveRequest(object.name);
                }
            })

            scene.input.on('gameobjectover', function (pointer, object) {
                let gV = vars.game;
                if (gV.liftedPiece!==-1 && object.name.includes('spike_')) { // move the floating piece to this spikes x position
                    vars.input.hoverRequest(object.name);
                }
            });

        },

        dropPiece: function() {
            let gV = vars.game;
            let liftedPiece = gV.liftedPiece;
            let spike = gV.spikeOver;
            let spikeData = gV.piecePositions[spike];
            let pieceObject = scene.children.getByName(liftedPiece);

            if (vars.input.isMoveValid(spike,spikeData,parseInt(liftedPiece.replace('piece_','')))) {
                let spikeID = parseInt(spike.replace('spike_', ''));
                let yOffset = vars.pieces.yPositions[spikeData.length];

                pieceObject.setData({ 'moving': false, 'spike': spikeID });
                gV.piecePositions[spike].push(liftedPiece);
                gV.clearPickUpVars();

                scene.tweens.add({ targets: pieceObject, y: yOffset, duration: 250 })
                scene.sound.play('dropPiece');
                vars.game.checkForWin();
            } else {
                scene.tweens.add({ targets: pieceObject, y: pieceObject.y+50, yoyo: true, duration: 250 })
            }
        },

        getSpikeIDfromPiece: function(_pieceName) {
            return scene.children.getByName(_pieceName).getData('spike');
        },

        hoverRequest: function(_spikeName) {
            console.log('Moving hovering piece to be above ' + _spikeName);
            vars.game.spikeOver = _spikeName;
            let piece = scene.children.getByName(vars.game.liftedPiece);
            let spikeX = scene.children.getByName(_spikeName).x;
            scene.tweens.add({ targets: piece, x: spikeX, duration: 250 })
        },

        isMoveValid: function(_spike, _spikeData, _liftedPiece) {
            console.log('Lifted Piece: ' + _liftedPiece);
            let valid = true;
            if (_spikeData.length>0) {
                [..._spikeData].forEach( (c)=> {
                    if (parseInt(c.replace('piece_',''))>_liftedPiece) { valid=false; }
                })
            }

            return valid;
        },

        liftPiece: function(_pieceName) {
            // is this the piece theyve clicked on or the spike?
            let piece = _pieceName;
            let spikeNum = -1;
            if (_pieceName.includes('spike_')) {
                console.log('Find the top piece on this spike');
                spikeNum = piece.replace('spike_','');
                let spikeData = vars.game.piecePositions['spike_' + spikeNum];
                piece  = spikeData.pop();
            } else { // we need to check that the piece clicked on is at the top of the spike
                // grab the top piece
                console.log('Finding the top piece on this spike');
                spikeNum = vars.input.getSpikeIDfromPiece(piece);
                let spikeData = vars.game.piecePositions['spike_' + spikeNum];
                piece  = spikeData.pop();
            }

            console.log('Lifting ' + piece);
            vars.game.liftedPiece = piece;
            let object = scene.children.getByName(piece);
            vars.game.spikeFrom = spikeNum;
            object.setData('moving', true);
            scene.tweens.add({ targets: object, y: 100, duration: 250 })
            scene.sound.play('liftPiece');
        },

        moveRequest: function(_name) {
            let gV = vars.game; let iV = vars.input;
            if (gV.liftedPiece===-1) { // lifting a piece
                iV.liftPiece(_name);
            } else { // dropping the current piece
                iV.dropPiece();
            }
        }
    },

    particles: {
        fireworks: [],

        init: function() {
            vars.particles.createFireworks();
        },

        createFireworks: function() {
            let fA = vars.particles.fireworks;
            vars.game.spikePositionsX.forEach( (c)=>{
                let particle = scene.add.particles('spark1').createEmitter({
                    active: false,
                    x: c, y: 210,
                    speed: { min: 200, max: 400 },
                    angle: { min: 250, max: 290 },
                    scale: { start: 0.6, end: 0 },
                    tint: { min: 0xff0000, max: 0xffff00 },
                    blendMode: 'SCREEN', lifespan: 600, gravityY: 600
                });
                fA.push(particle);
            })
        },

        fireworksDisable: function() {
            vars.particles.fireworks.forEach( (c)=> {
                c.visible=false; c.active=false;
            })
        },

        fireworksEnable: function() {
            vars.particles.fireworks.forEach( (c)=> {
                c.active=true;
            })
        }
    },

    pieces: {
        spacing: 2,
        tints: [],
        yPositions: []
    },

    player: {
        currentMove: 0,
        moves: 0,
        scores: {
            3: -1, 4: -1, 5: -1, 6: -1, 7: -1
        }
    },

    tweens: {
        winner: -1,
    },

    UI: {
        init: function() {
            let gV = vars.game;
            // BACKGROUND
            scene.add.image(vars.canvas.cX, vars.canvas.cY, 'background');
            // WELCOME TEXT
            let tints  = consts.tints;
            let depths = consts.depths;
            vars.UI.welcomeMessage('Welcome to the Tower of Hanoi');
            //scene.add.text(vars.canvas.cX, 900, 'Welcome to the Tower of Hanoi').setFontSize(64).setTint(tints.red).setName('welcomeText').setFontStyle('bold').setOrigin(0.5).setDepth(depths.ui);

            // spikes (positions)
            let pieceWidth = 400; let pieceSpacing = 30;
            let x = 200; let spikeXoffset = x + 340; let xInc=pieceWidth+pieceSpacing;
            let y = 500; let Xs = [];
            [...[1,2,3]].forEach( (c)=> {
                let actualX = (c-1)*xInc+spikeXoffset-10;
                Xs.push(actualX);
                scene.add.image(actualX, y, 'spike').setName('spike_' + c).setInteractive();
            })
            gV.spikePositionsX = Xs;

            // DRAW BASE
            scene.add.image(vars.canvas.cX, 830, 'base');

            // CREATE THE PIECES
            let spike = gV.initialPosition;
            let piecePositions = gV.piecePositions['spike_' + spike];
            let difficulty = vars.game.difficulty;
            let imageHeight = vars.game.pieceHeight;
            let pieceHeight = ~~(3*imageHeight/difficulty);
            gV.pieceHeight = pieceHeight;
            let pieceScaleHeight = pieceHeight/160;
            let pieceSpacingY = vars.pieces.spacing;
            let tempArray = Phaser.Utils.Array.NumberArray(0,difficulty-1);
            pieceWidth=1; // normalise the width so we can change its scale
            y=vars.game.basePieceY;
            let pieceTints = vars.pieces.tints;
            let pTLen = pieceTints.length-1;
            [...tempArray].forEach((c)=> {
                let actualY = ~~((y - (pieceHeight*c)-(pieceHeight/2)-2 - (pieceSpacingY*c)) + 0.5);
                vars.pieces.yPositions.push(actualY);
                let colourBottom = pieceTints[pTLen - c]; // we build the stack from base up, so the colours need to do the same (or it could get confusing)
                let colourTop = pieceTints[pTLen - (c+1)];
                scene.add.image(spikeXoffset-10, actualY, 'piece').setName('piece_' + c).setScale(pieceWidth,pieceScaleHeight).setTint(colourTop,colourTop,colourBottom,colourBottom).setData({ 'id': c, 'spike': spike, 'moving': false }).setInteractive();
                piecePositions.push('piece_' + c);
                pieceWidth-=0.1;
            })

            scene.add.text(1500, 810, 'Moves: ').setFontSize(48).setTint(tints.black).setName('movesText');
            scene.add.text(1700, 810, '0').setFontSize(48).setTint(tints.black).setName('movesInt');

            scene.add.image(vars.canvas.cX, vars.canvas.cY + vars.canvas.cY/2, 'winner').setName('winnerImage').setAlpha(0);

            // perfect score
            scene.add.image(vars.canvas.cX, vars.canvas.cY, 'perfectScore').setName('perfectScore').setAlpha(0).setVisible(false).setScale(2);

            // init fireworks particles
            vars.particles.init();
        },

        colourTweenWinner: function() {
            let target = scene.children.getByName('winnerImage');
            if (target.alpha===0) { if (vars.tweens.winner!==-1) { vars.tweens.winner.remove(); vars.tweens.winner!=-1; } }
            let oC = vars.UI.colourTweenWinner;
            vars.tweens.winner = scene.tweens.addCounter({
                from: 0, to: 255, duration: 1000, yoyo: true,
                onUpdate:  function (tween) { if (target.alpha===0) {  if (vars.tweens.winner!==-1) { vars.tweens.winner.remove(); vars.tweens.winner!=-1; } } else { const value = Math.floor(tween.getValue()); if (target.alpha!==0) { target.setTint(Phaser.Display.Color.GetColor(255-value, 255, 0)); } else { if (vars.tweens.winner!==-1) { vars.tweens.winner.remove(); } } } },
                onComplete: oC
            });
        },

        showPerf: function() {
            let p = scene.children.getByName('perfectScore');
            p.setVisible(true).setDepth(5);
            scene.tweens.add({ targets: p, delay: 2500, scale: 1, duration: 500, ease: 'Cubic.easeIn', onComplete: vars.audio.perfectScore })
            scene.tweens.add({ targets: p, delay: 2500, alpha: 1, duration: 100 })
        },

        updateMoveCount: function() {
            scene.children.getByName('movesInt').setText(vars.player.moves);
        },

        welcomeMessage: function(_msg) {
            let xStart = 410; let xInc = 38;
            let y = 950;
            let alpha = 1;
            if (_msg.length>0) {
                let msgArray = _msg.split('');
                msgArray.forEach( (l, i)=> {
                    [1.0,0.8,0.6,0.4,0.2].forEach( (a)=> {
                        let x = xStart + (i*xInc);
                        let colour = '#333';
                        if (a<1) { colour = '#f00' }
                        let c = scene.add.text(x,y,l, { fontStyle: 'bold', color: colour, fontSize: 64 }).setAlpha(a);
                        scene.tweens.add({
                            targets: c, delay: i*17+((1-a) * 100), y: y-80, duration: 500, yoyo: true, repeat: -1, ease: 'Quad.easeInOut'
                        })
                    })
                })
            }
        },

        winner: function() {
            let c = scene.children.getByName('winnerImage');
            c.setDepth(1);
            scene.tweens.add({ targets: c, y: vars.canvas.cY, duration: 2000, alpha: 1 })

            let best = Math.pow(2,vars.game.difficulty)-1;
            if (vars.player.moves===best) {
                // colour cycle the win image
                vars.UI.colourTweenWinner();
                vars.UI.showPerf();
            }
            vars.particles.fireworksEnable();
            vars.audio.sparklers(true);
        }

    }

}