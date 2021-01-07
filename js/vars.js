var vars = {
    DEBUG: true,

    version: 0.1,

    init: function() {
        
    },

    // ENGINE FUNCTIONS
    canvas: {
        width: 1920, height: 1080,
        cX: 1920/2, cY: 1080/2,
    },

    durations: {
        pieceMoveUpMax     : 500,
        pieceMoveAcrossMax : 500,
        pieceMoveDownMax   : 500
    },

    files: {
        audio: {
            load: function() {
                //scene.load.audio('pieceDrop', 'audio/pieceDrop.ogg');
            }
        },

        images: {
            init: function() {
                scene.load.image('piece', 'images/piece.png');
                scene.load.image('spike', 'images/spike.png');
                scene.load.image('base', 'images/base.png');
                //scene.load.spritesheet('xopieces', 'images/xo.png', { frameWidth: 122, frameHeight: 104})
                //scene.load.atlas('stars', 'images/stars.png', 'images/stars.json');
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

        pieceMoveUp: function() {

        },

        pieceMoveDown: function() {

        }
    },

    game: {
        basePieceY: 790,
        difficultyLevels: [3,4,5,6,7], // basically the piece count
        difficulty: 3,
        difficultyMax: 7,
        initialPosition: 1,
        liftedPiece: -1,
        solution: [],
        pieceHeight: 160,
        piecePositions: { spike_1: [], spike_2: [], spike_3: [] },
        spikeOver: -1,
        spikePositionsX: [],

        init: function() {
            
        },

        checkForWin(_move) {
            
        },


        dropSelectedPiece: function(_position) {
            
        },

        generateSolution: function() {
            let movingTo = getRandom([2,3])
            h(vars.game.difficulty,vars.game.initialPosition,movingTo);
        },

        restart: function() {
            
        },

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
            let liftedPiece = vars.game.liftedPiece;
            let spike = vars.game.spikeOver;
            let spikeData = vars.game.piecePositions[spike];
            let pieceObject = scene.children.getByName(liftedPiece);

            if (vars.input.isMoveValid(spike,spikeData,parseInt(liftedPiece.replace('piece_','')))) {
                let pieceHeight = vars.game.pieceHeight;
                let spikeID = parseInt(spike.replace('spike_', ''));
                //let spikeObject = scene.children.getByName(spike);
                let yOffset = vars.game.basePieceY - (spikeData.length * pieceHeight) - (pieceHeight/2);
                console.log('Dropping ' + pieceObject.name + ' on ' + spike + '\n' + spikeData);

                pieceObject.setData({ 'moving': false, 'spike': spikeID });
                vars.game.piecePositions[spike].push(liftedPiece);
                vars.game.liftedPiece = -1;
                vars.game.spikeOver = -1;

                scene.tweens.add({ targets: pieceObject, y: yOffset, duration: 250 })
            } else {
                scene.tweens.add({
                    targets: pieceObject,
                    y: pieceObject.y+50,
                    yoyo: true,
                    duration: 250
                })
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
            if (_pieceName.includes('spike_')) {
                console.log('Find the top piece on this spike');
                let spikeNum = piece.replace('spike_','');
                let spikeData = vars.game.piecePositions['spike_' + spikeNum];
                piece  = spikeData.pop();
            } else { // we need to check that the piece clicked on is at the top of the spike
                // grab the top piece
                console.log('Finding the top piece on this spike');
                let spikeID = vars.input.getSpikeIDfromPiece(piece);
                let spikeData = vars.game.piecePositions['spike_' + spikeID];
                piece  = spikeData.pop();
            }

            console.log('Lifting ' + piece);
            vars.game.liftedPiece = piece;
            let object = scene.children.getByName(piece);
            object.setData('moving', true);
            scene.tweens.add({ targets: object, y: 100, duration: 250 })
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

    player: {
        currentMove: 0,
        moves: [],
        scores: {
            3: -1, 4: -1, 5: -1, 6: -1, 7: -1
        }
    },

    UI: {
        init: function() {
            let gV = vars.game;
            let spike = gV.initialPosition;
            let piecePositions = gV.piecePositions['spike_' + spike];
            // WELCOME TEXT
            let tints  = consts.tints;
            let depths = consts.depths;
            scene.add.text(vars.canvas.cX, 900, 'Welcome to the Tower of Hanoi').setFontSize(64).setTint(tints.red).setName('welcomeText').setFontStyle('bold').setOrigin(0.5).setDepth(depths.ui);

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
            let difficulty = vars.game.difficulty;
            let imageHeight = vars.game.pieceHeight;
            let pieceHeight = 3*imageHeight/difficulty;
            gV.pieceHeight = pieceHeight;
            let pieceScaleHeight = pieceHeight/160;
            let pieceSpacingY = 3;
            let tempArray = Phaser.Utils.Array.NumberArray(0,difficulty-1);
            pieceWidth=1; // normalise the width so we can change its scale
            y=vars.game.basePieceY;
            [...tempArray].forEach((c)=> {
                scene.add.image(spikeXoffset-10, y - (pieceHeight*c)-(pieceHeight/2)-2 - (pieceSpacingY*c), 'piece').setName('piece_' + c).setScale(pieceWidth,pieceScaleHeight).setTint(0xff0000,0xff0000,0x440000,0x440000).setData({ 'id': c, 'spike': spike, 'moving': false }).setInteractive();
                piecePositions.push('piece_' + c);
                pieceWidth-=0.1;
            })

        },

        updateMoveCount: function() {
            //scene.children.getByName('drawsInt').setText(vars.player.draws);
        },

    }

}