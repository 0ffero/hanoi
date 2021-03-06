var numArray = Phaser.Utils.Array.NumberArray;

function update() {
    if (scene.children.getByName('timerInt')!==null && vars.game.timer.totalTime===-1 && vars.game.firstMove===false) {
        vars.game.timer.update();
    }
}

var vars = {
    DEBUG: false,

    version: 0.995,

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

    dev: {
        piecesAlpha: function(_alpha=0.2) {
            if (vars.DEBUG) { console.log(`%cSetting pieces alpha to ${_alpha}`, consts.console.info); }
            scene.children.each( (c)=> {
                if (c.name.includes('piece')) {
                    c.setAlpha(_alpha);
                }
            })
        }
    },

    files: {
        newLook: true,

        audio: {
            load: function() {
                scene.load.audio('liftPiece',    'audio/lift.ogg');
                scene.load.audio('dropPiece',    'audio/drop.ogg');
                scene.load.audio('perfectScore', 'audio/perfectScore.ogg');
                scene.load.audio('sparkler',     'audio/sparkler.ogg');
            }
        },

        images: {
            init: function() {
                scene.load.image('background',   'images/background.jpg');
                scene.load.image('difficultyH',  'images/difficultyHeading.png');
                scene.load.image('options',      'images/options.png');
                scene.load.image('perfectScore', 'images/perfectScoreWAlpha.png');
                scene.load.image('restart',      'images/restart.png');
                scene.load.image('startSpike',   'images/startSpike.png');
                scene.load.image('spark1',       'particles/white.png');
                scene.load.image('whitePixel',   'images/whitePixel.png');
                scene.load.image('winner',       'images/winner.png');
                if (vars.files.newLook===false) {
                    scene.load.image('base',  'images/base.png');
                    scene.load.image('piece', 'images/piece.png');
                    scene.load.image('spike', 'images/spike.png');
                } else {
                    // NEW LOOK
                    scene.load.image('nl_base',   'images/newLook/base.png');
                    scene.load.image('nl_spike',  'images/newLook/spike.png');
                    scene.load.image('nl_pieceB', 'images/newLook/pieceB.png');
                    scene.load.image('nl_pieceF', 'images/newLook/pieceF.png');
                }

                scene.load.spritesheet('difficultyButtons', 'images/difficultyButtons-ext.png', { frameWidth: 200, frameHeight: 200, margin: 1, spacing: 2 })
                scene.load.spritesheet('spikeOptions', 'images/spikeOptions-ext.png', { frameWidth: 200, frameHeight: 200, margin: 1, spacing: 2 })
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
            if (vars.DEBUG) { console.log('Initialising Groups'); }
            scene.groups = {};
            scene.groups.pegs   = scene.add.group().setName('pegsGroup');
            scene.groups.pieces = {}
            let pieceGroups = Phaser.Utils.Array.NumberArray(0,vars.game.difficulty-1);
            pieceGroups.forEach( (c)=> {
                scene.groups.pieces['piece_' + c] = scene.add.group().setName('piece_' + c);
            })
            scene.groups.ui = scene.add.group().setName('uiGroup');
            scene.groups.uiSO = scene.add.group().setName('uiSpikeOptionsGroup');

            scene.groups.winnerUI = scene.add.group().setName('winnerUIGroup');
        },

        rebuildPieceGroups: function() {
            if (vars.DEBUG) { ('Rebuildng groups'); }
            let pieceGroups = Phaser.Utils.Array.NumberArray(0,vars.game.difficulty-1);
            pieceGroups.forEach( (c)=> {
                scene.groups.pieces['piece_' + c] = scene.add.group().setName('piece_' + c);
            })
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

            let gV = vars.game;
            if (lS.hanoi_difficulty===undefined) {
                lS.hanoi_difficulty=3; gV.difficulty=3;
            } else {
                gV.difficulty = ~~(lS.hanoi_difficulty);
            }

            if (lS.hanoi_times===undefined) {
                let levels = Phaser.Utils.Array.NumberArray(3,7);
                let times = 3600;
                let timesObject = { }
                levels.forEach( (c)=> {
                    [0,1,2].forEach( (s)=> {
                        if (s===0) { timesObject[c] = []; }
                        timesObject[c].push(times);
                    })
                })
                gV.timer.bestTimes = timesObject;
                let timeString = JSON.stringify(timesObject);
                lS.hanoi_times = timeString;
            } else {
                gV.timer.bestTimes = JSON.parse(lS.hanoi_times);
            }
        },

        resetScores: function() {
            let lS = window.localStorage;
            lS.hanoi_scores = '3:9999;4:9999;5:9999;6:9999;7:9999';
        },

        saveDifficulty: function(_difficulty) {
            let lS = window.localStorage;
            lS.hanoi_difficulty=_difficulty;
        },

        saveScores: function() {
            let lS = window.localStorage; let scores = vars.player.scores;
            let scoreStr = '';
            [3,4,5,6,7].forEach( (c)=> { scoreStr += c.toString() + ':' + scores[c] + ';'; })
            lS.hanoi_scores = scoreStr;
        },

        saveTime: function() {
            let lS = window.localStorage;
            let gV = vars.game;
            let newTime = gV.timer.totalTime;
            vars.UI.timeUpdate(null,newTime);
            let difficulty = gV.difficulty;
            let times = gV.timer.bestTimes[difficulty];
            let timeIsGood = false;
            times.forEach( (c, i)=>{
                if (timeIsGood===false) {
                    if (newTime<c) {
                        if (vars.DEBUG) { console.log(`Players time ${newTime} is a best time. Saving. It will be placed in position ${i}`); }
                        timeIsGood=true;
                        times.splice(i,0,newTime); times.pop();
                        lS.hanoi_times = JSON.stringify(gV.timer.bestTimes);
                        vars.UI.bestTimesUpdate();
                    }
                }
            })
        }
    },

    // GAME
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
        basePieceY: 768,
        difficultyLevels: [3,4,5,6,7], // basically the piece count
        difficulty: 3,
        difficultyMax: 7,
        firstMove: true,
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

        bestScoreForDifficultyCheck: function(_difficulty,_pMoves) {
            if (vars.DEBUG) { ('Checking for high score.'); }
            let bestScore = vars.player.scores[_difficulty];
            if (_pMoves<bestScore) {
                vars.player.scores[_difficulty]=_pMoves;
                vars.UI.bestScoreUpdate();
                return true;
            }
            return false;
        },

        checkForWin() {
            let gV = vars.game;
            [1,2,3].forEach( (c)=>{
                if (gV.piecePositions['spike_' + c].length===gV.difficulty) {
                    if (c!==gV.initialPosition) { // win found
                        gV.timer.end(); // end the timer
                        gV.winner();
                    }
                }
            })
        },

        clearPickUpVars: function(){
            let gV = vars.game;
            let spikeOver = -1;
            if (gV.spikeOver!==-1) {
                if (vars.files.newLook===true) {
                    spikeOver = ~~(gV.spikeOver.replace('spikeNL_',''));
                } else {
                    spikeOver = ~~(gV.spikeOver.replace('spike_',''));
                }
                if (gV.spikeFrom!==spikeOver) { vars.player.moves++; vars.UI.updateMoveCount(); }
            }
            gV.liftedPiece = -1;
            gV.spikeFrom = -1;
            gV.spikeOver = -1;
        },

        generateSolution: function() {
            let movingTo = getRandom([2,3])
            h(vars.game.difficulty,vars.game.initialPosition,movingTo);
        },

        hideWinnerObjects: function() {
            let winnerObjects = ['winnerImage','perfectScore'];
            winnerObjects.forEach( (c)=>{
                switch (c) {
                    case 'winnerImage': 
                        let w = scene.children.getByName(c);
                        w.setAlpha(0);
                        w.y = vars.canvas.cY + vars.canvas.cY/2;
                    break;
                    case 'perfectScore': 
                        let p = scene.children.getByName(c);
                        p.setAlpha(0).setVisible(false).setScale(2);
                    break;
                }
            })
        },

        restart: function(difficultyChange=false, _lvl) {
            let gV = vars.game;
            if (difficultyChange===false) {
                _lvl=gV.difficulty;
            }
            if (_lvl>=3 && _lvl<=7) {
                vars.game.firstMove = true;
                // RE-INIT ALL THE THINGS
                // reset the moves
                vars.player.moves=0;
                vars.UI.updateMoveCount();

                // reset moving vars
                gV.clearPickUpVars();

                // destroy all the current pieces (based on current difficulty, hence why we set it after this...)
                let pieces = Phaser.Utils.Array.NumberArray(0, gV.difficulty-1);
                pieces.forEach( (s)=> {
                    scene.groups.pieces['piece_' + s].children.each( (c)=> {
                        c.destroy();
                    })
                })
                scene.groups.pieces = {}

                // RESET THE WINNER STUFF (shown when player wins)
                gV.hideWinnerObjects();

                // STOP THE FIREWORKS IF THEYRE STILL RUNNING (happens after player wins a game)
                vars.particles.fireworksDisable();

                // empty out the spikes data
                gV.piecePositions = { spike_1: [], spike_2: [], spike_3: [] }

                // stop the restart button bouncing
                if (vars.UI.winnerTween!==null) {
                    vars.UI.winnerTween.stop();
                    vars.UI.winnerTween=null;
                    scene.children.getByName('UI_restart').setScale(0.666);
                }


                // UPDATE TO THE NEW DIFFICULTY
                gV.difficulty = _lvl;


                // BEGIN GAME
                // first update the best score and difficulty text
                vars.UI.bestScoreUpdate();
                vars.UI.bestTimesUpdate();
                // Build the sizes of each piece
                vars.pieces.nlSetPieceSizes();
                // build the new groups for the pieces
                vars.groups.rebuildPieceGroups();

                // OK, everything has been reset. Initialise the pieces
                if (vars.files.newLook===true) {
                    if (vars.DEBUG) { console.log('Initialising the pieces for new look'); }
                    vars.pieces.nlDrawPieces();
                } else {
                    if (vars.DEBUG) { console.log('Initialising the pieces for the old look'); }
                    vars.pieces.drawPieces();
                }
                gV.timer.reset();
            } else {
                console.error('An invalid difficulty was selected!');
            }
        },

        setDifficulty: function(_lvl) {
            if (_lvl !== vars.game.difficulty) {
                vars.localStorage.saveDifficulty(_lvl);
                console.clear();
                if (vars.DEBUG) { console.log('%cDifferent difficulty level selected\n\nSetting difficulty and restarting the game.', consts.console.important); }
                vars.game.restart(true, _lvl);
                // fade out the options
                vars.options.hide();
            } else {
                if (vars.DEBUG) { console.log('Same difficulty level selected. Hiding the options'); }
                // NOTE : Would if be better to restart the game here? Or just hide the options?
                // Theyve clicked on options, so the assumption is that theyre here for a reason... right?
                // If thats the case. What would the user expect by clicking on the same difficulty?
                // A reset of the same difficulty level? (There's already a restart button)

                // OR: Just them saying they want to go back to their game (the options buttons and black background already does that)

                // At the minute, ill just be hiding the the options
                vars.options.hide();
            }
        },

        timer: {
            bestTimes: -1,
            startTime: -1,
            totalTime: -1,
            end: function() { // this function ends the timer, but also checks if the new time is better than the old one
                // get the time taken to win
                let endTime = new Date();
                let tV = vars.game.timer;
                tV.totalTime = (endTime - tV.startTime)/1000;
                tV.startTime=-1;
                vars.localStorage.saveTime();
            },

            reset: function() {
                scene.children.getByName('timerInt').setText('0');
                scene.children.getByName('timerInt_S').setText('0');
            },

            start: function() {
                let tV = vars.game.timer;
                tV.totalTime = -1;
                tV.startTime = new Date();
            },

            update: function() {
                let currentTime = new Date();
                vars.UI.timeUpdate(currentTime - vars.game.timer.startTime);
            }

        },

        winner: function(){
            vars.UI.winner();
        }

    },

    input: {
        pieceMoving: false,
        init: function() {
            scene.input.on('gameobjectdown', function (pointer, object) {
                if (vars.options.areVisible===false) {
                    let gV = vars.game; let pV = vars.pieces;
                    // PLAYER IS PLAYING THE GAME
                    if (object.name.includes('piece_') || object.name.includes('spike_')) {
                        vars.input.moveRequest(object.name);
                    } else if (object.name.includes('pieceF_') || object.name.includes('pieceB_') || object.name.includes('spikeNL_')) {
                        if (gV.liftedPiece===-1) {
                            if (gV.firstMove===true) { gV.firstMove=false; gV.timer.start(); }
                            if (vars.DEBUG) { console.log(`Lifting piece with name: ${object.name}`); }
                            pV.nlLiftPiece(object.name);
                        } else { // dropping the current piece
                            if (vars.DEBUG) { console.log('%cDropping Piece', consts.console.importantish); }
                            pV.nlDropPiece(object);
                        }
                    } else {
                        if (object.name==='UI_options') {
                            if (vars.DEBUG) { console.log('Showing Options Screen'); }
                            vars.options.show();
                        } else if (object.name==='UI_restart') {
                            console.clear();
                            if (vars.DEBUG) { console.log('Restarting the game'); }
                            vars.game.restart(false);
                        } else if (object.name==='background' && gV.liftedPiece!==-1 && gV.spikeOver!==-1) {
                            if (vars.DEBUG) { console.log('%cDropping Piece', consts.console.importantish); }
                            // figure out what piece
                            let piece = scene.children.getByName(gV.liftedPiece.replace('piece_','pieceF_'));
                            pV.nlDropPiece(piece);
                        } else {
                            if (vars.DEBUG) { console.error(`UNKNOWN PIECE with name: ${object.name} (clicked)`); }
                        }
                    }
                } else {
                    // OPTIONS SCREEN IS VISIBLE
                    if (object.name==='optionsBG' || object.name==='UI_options') {
                        if (vars.DEBUG) { console.log('Hiding the options screen'); }
                        vars.options.hide();
                    } else if (object.name.includes('difficulty_')) {
                        let difficultyLevel = ~~(object.name.replace('difficulty_',''));
                        vars.game.setDifficulty(difficultyLevel);
                    } else if (object.name === 'o_selectedSpike') {
                        vars.options.showStartSpikeOptions();
                    } else if (object.name.includes('spikeStart_')) {
                        let ssID = ~~(object.name.replace('spikeStart_',''));
                        vars.options.changeStartSpike(ssID);
                    } else {
                        console.error(`Player clicked an unhandled object called ${object.name}`);
                    }
                }
            })

            scene.input.on('gameobjectover', function (pointer, object) {
                if (vars.options.areVisible===false) {
                    let gV = vars.game;
                    if (gV.liftedPiece!==-1 && object.name.includes('spike_')) { // move the floating piece to this spikes x position
                        vars.input.hoverRequest(object.name);
                    } else if (gV.liftedPiece!==-1 && object.name.includes('spikeNL_')) {
                        if (vars.DEBUG) { console.log('Found hovering piece. Dealing with spike over'); }
                        vars.pieces.nlHoverRequest(object);
                    } else  if (gV.liftedPiece!==-1 && object.name.includes('piece')) {
                        let spikeID = object.getData('spike');
                        if ('spikeNL_' + spikeID!==vars.game.spikeOver) {
                            if (vars.DEBUG) { console.log(`Found hovering piece. Dealing with piece over.\nPiece is currently on spike: ${spikeID}`); }
                            let spikeObject = scene.children.getByName('spikeNL_' + spikeID);
                            vars.pieces.nlHoverRequest(spikeObject);
                        }
                    } else {
                        // This fires so often ive disabled it
                        // its the hover over, but its only needed
                        // for spikes and moving the floating piece
                        // (which have been accounted for up there ^^)
                        //console.log('UNHANDLED PIECE with name: ' + object.name + ' (hover)');
                    }
                }
            });

        },


        disable: function() {
            if (vars.DEBUG) { console.log('%cStopped all input.', consts.console.important); }
            scene.input.enabled=false;
        },

        dropPiece: function() {
            let gV = vars.game;
            let liftedPiece = gV.liftedPiece;
            let spike = gV.spikeOver;
            let spikeData = gV.piecePositions[spike];
            let pieceObject = scene.children.getByName(liftedPiece);
            let duration = consts.durations.pieceMove;

            if (vars.input.isMoveValid(spike,spikeData,parseInt(liftedPiece.replace('piece_','')))) {
                let spikeID = parseInt(spike.replace('spike_', ''));
                let yOffset = vars.pieces.yPositions[spikeData.length];

                pieceObject.setData({ 'moving': false, 'spike': spikeID });
                gV.piecePositions[spike].push(liftedPiece);
                gV.clearPickUpVars();

                scene.tweens.add({ targets: pieceObject, y: yOffset, duration: duration })
                scene.sound.play('dropPiece');
                vars.game.checkForWin();
            } else {
                scene.tweens.add({ targets: pieceObject, y: pieceObject.y+50, yoyo: true, duration: duration })
            }
        },

        enable: function() {
            scene.input.enabled=true;
            if (vars.DEBUG) { console.log('%cInput enabled again.', consts.console.important); }
        },

        getSpikeIDfromPiece: function(_pieceName) {
            return scene.children.getByName(_pieceName).getData('spike');
        },

        hoverRequest: function(_spikeName) {
            if (vars.DEBUG) { console.log(`Moving hovering piece to be above ${_spikeName}`); }
            let duration = consts.durations.pieceMove;
            vars.game.spikeOver = _spikeName;
            let piece = scene.children.getByName(vars.game.liftedPiece);
            let spikeX = scene.children.getByName(_spikeName).x;
            scene.tweens.add({ targets: piece, x: spikeX, duration: duration })
        },

        isMoveValid: function(_spike, _spikeData, _liftedPiece) {
            if (vars.DEBUG) { console.log(`Lifted Piece: ${_liftedPiece}`); }
            let valid = true;
            if (_spikeData.length>0) {
                _spikeData.forEach( (c)=> {
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
                if (vars.DEBUG) { console.log('Find the top piece on this spike'); }
                spikeNum = piece.replace('spike_','');
                let spikeData = vars.game.piecePositions['spike_' + spikeNum];
                piece  = spikeData.pop();
            } else { // we need to check that the piece clicked on is at the top of the spike
                // grab the top piece
                if (vars.DEBUG) { console.log('Finding the top piece on this spike'); }
                spikeNum = vars.input.getSpikeIDfromPiece(piece);
                let spikeData = vars.game.piecePositions['spike_' + spikeNum];
                piece  = spikeData.pop();
            }

            if (vars.DEBUG) { console.log('Lifting ' + piece); }
            vars.game.liftedPiece = piece;
            let object = scene.children.getByName(piece);
            vars.game.spikeFrom = spikeNum;
            object.setData('moving', true);
            let duration = consts.durations.pieceMove;
            scene.tweens.add({ targets: object, y: 100, duration: duration })
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

    options: {
        areVisible: false,

        init: function() {
            // OPTIONS BUTTON & RESTART BUTTONS
            let depths = consts.depths;
            scene.add.image(1700, 985, 'restart').setName('UI_restart').setTint(0x20ff00).setScale(0.666).setDepth(depths.ui).setInteractive();
            scene.add.image(1830, 985, 'options').setName('UI_options').setTint(0x20ff00).setDepth(depths.options+1).setInteractive();

            // OPTIONS
            // BACKGROUND
            let bg = scene.add.image(vars.canvas.cX, vars.canvas.cY, 'whitePixel').setName('optionsBG').setTint(0x0).setScale(vars.canvas.width, vars.canvas.height).setAlpha(0.9).setDepth(depths.options-1).setVisible(false).setInteractive();
            scene.groups.ui.add(bg);
            // DIFFICULTY TITLE
            let dH = scene.add.image(vars.canvas.cX, 100, 'difficultyH').setDepth(consts.depths.options).setName('difficultyH').setVisible(false);
            scene.groups.ui.add(dH);
            // DIFFICULTY OPTIONS
            let dLevels = Phaser.Utils.Array.NumberArray(3,7);
            dLevels.forEach( (c)=> {
                let x = 480 + ((c-3)*240);
                let difC = scene.add.image(x, vars.canvas.cY-225, 'difficultyButtons', c-3).setName('difficulty_' + c).setDepth(depths.options+1).setVisible(false).setInteractive();
                scene.groups.ui.add(difC);
            })
            // RANDOM SPIKE
            let sS = scene.add.image(815, 600, 'startSpike').setDepth(consts.depths.options).setVisible(false);
            let sRO = scene.add.image(1300, 600, 'spikeOptions',1).setDepth(consts.depths.options).setScale(0.7).setVisible(false).setName('o_selectedSpike').setInteractive();
            scene.groups.ui.addMultiple([sS,sRO]);
            [4,3,2,1].forEach( (c)=> {
                let sO = scene.add.image(1300-(150*(4-c)),750,'spikeOptions',c).setName('spikeStart_'+c).setDepth(depths.options).setScale(0.7).setVisible(false).setAlpha(0).setInteractive();
                scene.groups.uiSO.add(sO);
            })
        },

        changeStartSpike: function(_ssID) {
            if (vars.DEBUG) { console.log(`New spike start ID: ${_ssID}`); }
            if (_ssID>0 && _ssID<5) {
                if (vars.DEBUG) { console.log('   Valid ID... changing the start spike.'); }
                if (_ssID!==4) {
                    vars.game.initialPosition = _ssID;
                } else {
                    if (vars.DEBUG) { console.log(`Setting random spike`); }
                    vars.game.initialPosition = Phaser.Math.RND.integerInRange(1,3);
                    if (vars.DEBUG) { console.log(`   spike id ${vars.game.initialPosition} selected`); }
                }

                // hide the options
                vars.options.hide();
                // restart the game
                vars.game.restart(false);

            } else {
                console.error('Invalid Spike ID. Must be an integer between 1 and 4');
            }
        },

        hide: function() {
            let oV = vars.options;
            if (oV.areVisible===true) {
                oV.areVisible=false;
                scene.groups.ui.children.each( (c)=> {
                    c.setVisible(false);
                })
                scene.groups.uiSO.children.each((c)=> {
                    c.setVisible(false).setAlpha(0);
                })
            }
        },

        show: function() {
            let oV = vars.options;
            if (oV.areVisible===false) {
                oV.areVisible=true;
                scene.groups.ui.children.each( (c)=> {
                    c.setVisible(true);
                })
            }
        },

        showStartSpikeOptions: function() {
            [4,3,2,1].forEach( (c)=> {
                let o = scene.children.getByName('spikeStart_'+c);
                o.setVisible(true);
                scene.tweens.add({
                    targets: o,
                    alpha: 1,
                    delay: 25*(4-c),
                    durations: 100
                })
            })
        }

    },

    particles: {
        fireworks: [],
        fireworksVisible: false,

        init: function() {
            vars.particles.createFireworks();
        },

        createFireworks: function() {
            let fA = vars.particles.fireworks;
            let nlOffset = 0;
            if (vars.files.newLook) { 
                nlOffset = 120;
            }
            vars.game.spikePositionsX.forEach( (c)=>{
                let particle = scene.add.particles('spark1').setName('particle_' + c).setDepth(consts.depths.winUI).createEmitter({
                    active: false, x: c, y: 210+nlOffset,
                    speed: { min: 200, max: 400 }, angle: { min: 250, max: 290 },
                    scale: { start: 0.6, end: 0 }, tint: { min: 0xff0000, max: 0xffff00 },
                    blendMode: 'SCREEN', lifespan: 600, gravityY: 600
                });
                fA.push(particle);
                //scene.groups.winnerUI.add(particle); // you cant add the emitter to a group (If I really need to I can move createEmitter to the next line. probably not necessary)
            })
        },

        fireworksDisable: function() {
            let pV = vars.particles;
            pV.fireworks.forEach( (c)=> {
                c.visible=false; c.active=false;
            })
            vars.audio.sparklers(false);
            pV.fireworksVisible=false;
        },

        fireworksEnable: function() {
            let pV = vars.particles;
            pV.fireworks.forEach( (c)=> {
                c.active = true;
                c.setVisible(true);
            })
            vars.audio.sparklers(true);
            pV.fireworksVisible=true;
        }
    },

    pieces: {
        newLook: {
            pushes: [] // this stores the y push between each piece
        },
        sizes: [],
        spacing: 2,
        tints: [],
        yPositions: [],
        yOffsets: [],

        backSetOffsets: function() {
            let gV = vars.game;
            Phaser.Utils.Array.NumberArray(0,gV.difficulty-1).forEach( (c)=> {
                let f = scene.children.getByName('pieceF_' + c);
                let b = scene.children.getByName('pieceB_' + c);
                b.setData('frontOffset',f.y-b.y);
            })
        },

        drawPieces: function() {

        },

        getStack: function(_spikeID) {
            if (Number.isInteger(_spikeID)) {
                let gV = vars.game;
                let stack = gV.piecePositions['spike_' + _spikeID];
                return stack;
            } else {
                console.error('The spike ID must be an integer');
                return false;
            }
        },

        nlCreateYPushes: function() {
            if (vars.DEBUG) { console.log(`%cThis is an important function.\nIt Sets up the offset for each position on a spike.\nIts needed to push the pieces away from the previous piece.`, consts.console.importantish); }
            let a = Phaser.Utils.Array.NumberArray(1,vars.game.difficulty-1);
            let pushes = vars.pieces.newLook.pushes;
            pushes.push(10);
            let push=10;
            let div = 10/(vars.game.difficulty-2);
            a.forEach( (c)=> {
                push -= div;
                pushes.push(push);
            })
            pushes.pop();
        },

        nlDrawPieces: function() {
            let gV = vars.game;
            let spikePositionsX = gV.spikePositionsX;
            let pieceSpike = gV.initialPosition;
            let piecePositions = gV.piecePositions['spike_' + pieceSpike];
            let pieceSizes = vars.pieces.sizes;
            let x = spikePositionsX[pieceSpike-1];
            let pieceGroups = Phaser.Utils.Array.NumberArray(0,gV.difficulty-1);
            let depths = consts.depths;
            
            let roygbiv = consts.roygbiv;
            roygbiv = roygbiv.slice(0,gV.difficulty).reverse();
            let baseY = gV.basePieceY;
            pieceGroups.forEach( (c,i)=> {
                let scale = pieceSizes[c];
                let tint = roygbiv[i];
                // the Y position for front and back will be set after its been generated as mentioned at the top
                let b = scene.add.image(x,0,'nl_pieceB').setName('pieceB_' + c).setDepth(depths.spikes-1).setScale(scale).setTint(tint).setInteractive().setData({ 'id': i, 'spike': pieceSpike, 'moving': false });
                let f = scene.add.image(x,0+(66*scale),'nl_pieceF').setName('pieceF_' + c).setDepth(depths.spikes+1).setScale(scale).setTint(tint).setInteractive().setData({ 'id': i, 'spike': pieceSpike, 'moving': false });
                let dH = f.displayHeight; // this is the actual height after scaling
                // this and the 0.623 below are quite complex but are 
                // ~ 0.35 y offset (based on percentage of the F sprite that centres its curve with the spike bottom y)
                // - half the height of the piece as a percent and vice versa. they are needed because phaser places 
                // images etc as centred (origin=0.5). Attempting to use and origin of 0 makes things even more complex (ironically)
                let yOffset = dH*0.155; let yAbove = dH-yOffset;
                let upperDH = dH*0.623;
                let yF = baseY-yOffset; f.y=yF;
                let yB = yF - upperDH; b.y=yB;
                f.setData({ bottomOffset: yOffset, upperSize: yAbove, height: dH, minY: f.y });
                scene.groups.pieces['piece_' + c].addMultiple([b,f]);
                piecePositions.push('piece_' + c);
            })

            if (vars.DEBUG) { console.log('%cPlacing the pieces in the proper positions...', consts.console.important); }
            let pieceArray = pieceGroups;
            pieceArray.splice(0,1);
            let pV = vars.pieces;
            pieceArray.forEach( (c)=>{ pV.nlGetYpositionForPiece(c); })
            pV.backSetOffsets();
            pV.nlCreateYPushes();
            pV.updatePositions(true);
            if (vars.DEBUG) { console.log('%c...COMPLETE.', consts.console.important); }
        },

        nlDropPiece: function(object) {
            let gV = vars.game; let pV = vars.pieces;
            let liftedPieceID = ~~(gV.liftedPiece.replace('piece_',''));
            if (object.name.includes('spike')) {
                if (vars.DEBUG) { console.log(`Dropping piece with name: ${gV.liftedPiece} on spike: ${object.name}`); }
                let spikeID = ~~(object.name.replace('spikeNL_',''));
                pV.nlGetYpositionForPiece(liftedPieceID,spikeID);
            } else {
                if (vars.DEBUG) { console.log('User clicked a piece... checking if its the floating piece'); }
                let pieceName = object.name;
                let pieceID=-1;
                if (pieceName.includes('F')) {
                    if (vars.DEBUG) { console.log('They clicked on the front of a piece'); }
                    pieceID = ~~(pieceName.replace('pieceF_',''));
                } else {
                    pieceID = ~~(pieceName.replace('pieceB_',''));
                }
                if (liftedPieceID===pieceID) { // it is the lifted piece
                    if (vars.DEBUG) { console.log('Dropping piece on to spike with name ' + gV.spikeOver); }
                    let spikeID = ~~(gV.spikeOver.replace('spikeNL_',''));
                    pV.nlGetYpositionForPiece(liftedPieceID,spikeID);
                } else {
                    let spikeID = vars.input.getSpikeIDfromPiece(object.name)
                    pV.nlGetYpositionForPiece(liftedPieceID,spikeID);
                    return true;
                }
            }
        },

        nlDropPieceReset: function(_f,_b,_spikeID) {
            if (Number.isInteger(_spikeID) && _spikeID!==-1) {
                _f.setData({ moving: false, spike: _spikeID });
                _b.setData({ moving: false, spike: _spikeID });
            } else {
                if (vars.DEBUG) { console.log(`Error: Invalid Spike ID (${_spikeID})`); }
                return false;
            }
        },

        nlGetFloatingPieceNames: function() { // deals with floating piece
            // CHANGES THE OLD LOOK NAME TO NEW LOOK NAME
            let piece = vars.game.liftedPiece;
            let pieceF  = piece.replace('piece_', 'pieceF_');
            let pieceB  = piece.replace('piece_', 'pieceB_');
            return [pieceF,pieceB];
        },

        nlGetYpositionForPiece: function(_pieceID, _spikeID) {
            if (Number.isInteger(_pieceID)) {
                // get stack data
                if (!Number.isInteger(_spikeID)) {
                    // WE ARE INITIALISING THE PIECES (ie GAME IS INITIALISING)
                    let f0 = scene.children.getByName('pieceF_' + (_pieceID-1));
                    let f1 = scene.children.getByName('pieceF_' + _pieceID);
                    let newYPos = f0.y - ~~(f0.getData('upperSize')) + ~~(f1.getData('bottomOffset')*2);
                    let yDiff = f1.y-newYPos;
                    if (vars.DEBUG) { console.log(`New Y Pos: ${newYPos}. yDiff: ${yDiff}`); }
                    let b1 = scene.children.getByName('pieceB_' + _pieceID); b1.y-=yDiff;
                    b1.setData('yDiff', yDiff);
                    f1.y = newYPos;
                    return true;
                } else {
                    // THE GAME IS RUNNING
                    let pV = vars.pieces;
                    let stack = pV.getStack(_spikeID);
                    let gV = vars.game;
                    let valid = false;
                    let duration = consts.durations.pieceMove;
                    if (stack.length===0) {
                        // this is the bottom piece for this spike, no calculation needed
                        // THIS IS ALWAYS VALID (as we're dropping the piece on to an empty spike)
                        let f = scene.children.getByName('pieceF_' + _pieceID);
                        let b = scene.children.getByName('pieceB_' + _pieceID);

                        let frontNewY = f.getData('minY');
                        let backOffset = b.getData('frontOffset');
                        // animate the piece
                        scene.tweens.add({ targets: f, y: frontNewY, duration: duration })
                        scene.tweens.add({ targets: b, y: (frontNewY-backOffset), duration: duration })
                        gV.piecePositions['spike_' + _spikeID].push('piece_' + _pieceID);
                        pV.nlDropPieceReset(f,b,_spikeID);
                        gV.clearPickUpVars();
                        valid = true;
                    } else {
                        // get the top piece of the stack
                        let piece = vars.pieces.getStack(_spikeID);
                        let lowerPieceID = ~~(piece[piece.length-1].replace('piece_',''));

                        let f0 = scene.children.getByName('pieceF_' + lowerPieceID); // this is the piece that will be below our hovering piece
                        let f1 = scene.children.getByName('pieceF_' + _pieceID);
                        let b1 = scene.children.getByName('pieceB_' + _pieceID);

                        // check if this move is valid
                        if (pV.nlIsMoveValid(lowerPieceID, _pieceID, _spikeID)) {
                            let frontNewY = f0.y - ~~(f0.getData('upperSize')) + ~~(f1.getData('bottomOffset')) + f1.getData('bottomOffset');
                            let backOffset = b1.getData('frontOffset');

                            // we need to animate this pieces position
                            scene.tweens.add({ targets: f1, y: frontNewY, duration: duration })
                            scene.tweens.add({ targets: b1, y: (frontNewY-backOffset), duration: duration })

                            // then we reset all the things...
                            gV.piecePositions['spike_' + _spikeID].push('piece_' + _pieceID);
                            pV.nlDropPieceReset(f1,b1,_spikeID);
                            gV.clearPickUpVars();
                            valid = true;
                        } else {
                            if (vars.DEBUG) { console.log('%cThis move is invalid!', consts.console.importantish); }
                            // make the floating piece do a cute little bounce
                            scene.tweens.add({ targets: f1, y: f1.y+100, duration: duration, yoyo: true })
                            scene.tweens.add({ targets: b1, y: b1.y+100, duration: duration, yoyo: true })
                            return false;
                        }
                    }

                    if (valid===true) {
                        if (vars.DEBUG) { console.log('Valid move. Checking for win'); }
                        scene.sound.play('dropPiece'); vars.game.checkForWin();
                    }
                    return valid;
                }
            } else {
                console.error('Piece ID must be numeric!');
                return false;
            }
        },

        nlHoverRequest: function(_object) {
            let gV = vars.game;
            if (_object.name!==gV.spikeOver) {
                if (vars.DEBUG) { console.log('Different spike found, hover request allowed.'); }
                // get the x position of this spike
                let spikeX = _object.x;
                gV.spikeOver = _object.name;
                let duration = consts.durations.pieceMove;
                let pieces = vars.pieces.nlGetFloatingPieceNames();
                let f = scene.children.getByName(pieces[0]);
                let b = scene.children.getByName(pieces[1]);
                scene.tweens.add({ targets: f, x: spikeX, duration: duration })
                scene.tweens.add({ targets: b, x: spikeX, duration: duration })
            }
        },

        nlIsMoveValid: function(lowerPieceID, ourPieceID) {
            if (vars.DEBUG && vars.VERBOSE) { console.log('Checking if this move is valid. Currently returns true. This function has been simplified to a single line as weve already done all the hard work. Its a remnant from the old piece code.'); }
            if (lowerPieceID<ourPieceID) {
                return true;
            } else {
                return false;
            }
        },

        nlLiftPiece: function(_pieceName) {
            let gV = vars.game;
            if (gV.spikeFrom===-1) {
                let piece = _pieceName;
                let spikeNum = -1;
                if (_pieceName.includes('spikeNL_')) {
                    if (vars.DEBUG) { console.log('Find the top piece on this spike'); }
                    spikeNum = piece.replace('spikeNL_','');
                    let spikeData = gV.piecePositions['spike_' + spikeNum];
                    piece  = spikeData.pop();
                } else { // we need to check that the piece clicked on is at the top of the spike
                    // grab the top piece
                    if (vars.DEBUG) { console.log('Finding the top piece, in case the clicked on piece isnt it.'); }
                    spikeNum = vars.input.getSpikeIDfromPiece(piece);
                    let spikeData = gV.piecePositions['spike_' + spikeNum];
                    piece  = spikeData.pop();
                }
                gV.spikeFrom = spikeNum;
                gV.spikeOver = 'spikeNL_' + spikeNum;

                let toY = 250;
                if (vars.DEBUG) { console.log('Lifting pieces F and B for: ' + piece); }
                gV.liftedPiece = piece;
                let pieceNames = vars.pieces.nlGetFloatingPieceNames();
                let f = scene.children.getByName(pieceNames[0]);
                let b = scene.children.getByName(pieceNames[1]);

                f.setData('moving', true); b.setData('moving', true);

                let offsetY = f.y-toY;
                let duration = consts.durations.pieceMove;
                scene.tweens.add({ targets: f, y: f.y-offsetY, duration: duration })
                scene.tweens.add({ targets: b, y: b.y-offsetY, duration: duration })
                scene.sound.play('liftPiece');
            }
        },

        nlSetPieceSizes: function() {
            let gV = vars.game;
            let difficulty = gV.difficulty
            let totalPieces=difficulty-1;
            let pieceArray = Phaser.Utils.Array.NumberArray(0,totalPieces);
            let div = 50/totalPieces;
            let pieceSizes = [];
            pieceArray.forEach( (c)=> {
                pieceSizes.push(~~((100-(div*c))*100)/10000);
            })
            vars.pieces.sizes = pieceSizes;
        },

        nlShowPiecesData: function() {
            let gV = vars.game;
            for (let o=0; o<gV.difficulty; o++) {
                let f = scene.children.getByName('pieceF_' + o);
                let b = scene.children.getByName('pieceB_' + o);

                if (vars.DEBUG) { 
                    console.log(`%cFRONT: name: ${f.name} y: ${f.y} (minY: ${f.getData('minY')}) ${f.getData('bottomOffset')} ${f.getData('upperSize')}`, consts.console.info);
                    console.log(`%cBACK: yDiff: ${b.getData('yDiff')} Front Offset: ${b.getData('frontOffset')}`, consts.console.info);
                }
            }
        },

        setHeights: function(_ys,_offsets) {
            let nl = vars.pieces.newLook;
            nl.ys=_ys;
            nl.offsets = _offsets;
        },

        updatePositions: function() {
            let offsets = [...vars.pieces.newLook.pushes]; // shallow copy
            let offset = 0;
            numArray(1,vars.game.difficulty-1).forEach( (c)=> {
                offset += ~~(offsets.splice(0,1));
                let f = scene.children.getByName('pieceF_' + c);
                let b = scene.children.getByName('pieceB_' + c);
                f.y -= offset;
                b.y -= offset;
            })
        }
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
        optionsVisible: false,
        winnerTween: null,


        init: function() {
            let gV = vars.game;
            // BACKGROUND
            scene.add.image(vars.canvas.cX, vars.canvas.cY, 'background').setName('background').setInteractive();
            // WELCOME TEXT
            let tints  = consts.tints;
            let depths = consts.depths;
            vars.UI.welcomeMessage('Welcome to the Tower of Hanoi');

            // spikes (positions)
            let pieceWidth = 400; let pieceSpacing = 30;
            let x = 200; let spikeXoffset = x + 340; let xInc=pieceWidth+pieceSpacing;
            let y = 500; let Xs = [];
            [1,2,3].forEach( (c)=> {
                let actualX = (c-1)*xInc+spikeXoffset-10;
                Xs.push(actualX);
                if (vars.files.newLook===false) {
                    scene.add.image(actualX, y, 'spike').setName('spike_' + c).setInteractive();
                }
            })
            gV.spikePositionsX = Xs;

            if (vars.files.newLook===true) {
                vars.UI.initNewLook();
            } else {
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
                tempArray.forEach((c)=> {
                    let actualY = ~~((y - (pieceHeight*c)-(pieceHeight/2)-2 - (pieceSpacingY*c)) + 0.5);
                    vars.pieces.yPositions.push(actualY);
                    let colourBottom = pieceTints[pTLen - c]; // we build the stack from base up, so the colours need to do the same (or it could get confusing)
                    let colourTop = pieceTints[pTLen - (c+1)];
                    scene.add.image(spikeXoffset-10, actualY, 'piece').setName('piece_' + c).setScale(pieceWidth,pieceScaleHeight).setTint(colourTop,colourTop,colourBottom,colourBottom).setData({ 'id': c, 'spike': spike, 'moving': false }).setInteractive();
                    piecePositions.push('piece_' + c);
                    pieceWidth-=0.1;
                })
                vars.UI.initOthers();
            }

        },
        initNewLook: function() {
            // build the scale first
            vars.pieces.nlSetPieceSizes();

            let depths = consts.depths;
            // base
            scene.add.image(vars.canvas.cX,820,'nl_base').setName('new_base').setDepth(depths.base);
            // spikes
            let gV = vars.game;
            let spikePositionsX = gV.spikePositionsX;
            [0,1,2].forEach( (c)=>{
                let s = scene.add.image(spikePositionsX[c], 550, 'nl_spike').setDepth(depths.spikes).setTint(0x999999).setName('spikeNL_' + (c+1)).setInteractive();
                scene.groups.pegs.add(s);
            })

            vars.pieces.nlDrawPieces();
            vars.UI.initOthers(true);
        },
        initOthers: function(_nl=false) {
            let depth = consts.depths.ui;
            let depthWinner = consts.depths.winUI;
            // MOVES TAKEN
            let offset = 5;
            let nlOffset = 0;
            if (_nl!==false) { nlOffset=30; }

            [810+offset+nlOffset,810+nlOffset].forEach( (c,i)=> {
                let alpha = 1; let colour = '#F00';
                let ext = '';
                if (i===0) { alpha=0.5; colour='#000'; ext = '_S' }
                let textCSS = Object.assign({}, consts.text.default); // shallow bit kinda deep copy
                textCSS.color = colour;
                let strokeC = consts.tints.darkRed;
                scene.add.text(1500 - (i*offset), c, 'Moves: ', textCSS).setStroke(strokeC, 6).setFontSize(48).setName('movesText' + ext).setAlpha(alpha).setDepth(depth);
                scene.add.text(1700 - (i*offset), c, '0', textCSS).setStroke(strokeC, 6).setFontSize(48).setName('movesInt' + ext).setAlpha(alpha).setDepth(depth);
                scene.add.text(200 - (i*offset), c, 'Current Time: ', textCSS).setStroke(strokeC, 6).setFontSize(48).setName('timerText' + ext).setAlpha(alpha).setDepth(depth);
                scene.add.text(530 - (i*offset), c, '0', textCSS).setStroke(strokeC, 6).setFontSize(48).setName('timerInt' + ext).setAlpha(alpha).setDepth(depth);
            })

            // WINNER IMAGE
            let cX = vars.canvas.cX;
            let cY = vars.canvas.cY;
            let wI = scene.add.image(cX, cY + cY/2, 'winner').setName('winnerImage').setAlpha(0).setDepth(depthWinner);
            scene.groups.winnerUI.add(wI);

            // DIFFICULTY AND BEST SCORE
            vars.UI.bestScoreForDifficulty();
            vars.UI.bestTimesInit();

            // PERFECT SCORE
            let pS = scene.add.image(vars.canvas.cX, vars.canvas.cY, 'perfectScore').setName('perfectScore').setAlpha(0).setVisible(false).setScale(2).setDepth(depthWinner+1);
            scene.groups.winnerUI.add(pS);

            // INIT FIREWORKS PARTICLES
            vars.particles.init();

            // OPTIONS SCREEN
            vars.options.init();

            vars.game.timer.start();
        },

        bestScoreForDifficulty: function() { // This function shows the players best score for this difficulty as well as the current difficulty level
            let difficulty = vars.game.difficulty;
            let strokeC = consts.tints.darkRed;
            scene.add.text(1370,40,'Current Difficulty: '.toUpperCase() + difficulty + '\nBest Score: '.toUpperCase() + vars.player.scores[difficulty], { color: consts.tintsToHTML('yellow') }).setStroke(strokeC, 6).setFontSize(40).setAlign('right').setName('difficultyTxt');
        },

        bestScoreUpdate: function() {
            let difficulty = vars.game.difficulty;
            let t = scene.children.getByName('difficultyTxt');
            let msg = 'Current Difficulty: '.toUpperCase() + difficulty + '\nBest Score: '.toUpperCase() + vars.player.scores[difficulty]
            t.setText(msg);
        },

        bestTimesInit: function() {
            let gV = vars.game;
            let difficulty = gV.difficulty;
            let times = gV.timer.bestTimes[difficulty];
            let timesText = 'Best Times\n';
            times.forEach( (c)=> {
                if (c!=3600) { // valid user time
                    timesText += c + 's\n';
                }
            })
            scene.add.text(1680, 140, timesText, { color: consts.tintsToHTML('yellow') }).setStroke(0x0, 6).setFontSize(32).setAlign('right').setName('bestTimesText');
        },

        bestTimesUpdate: function() {
            let gV = vars.game;
            let difficulty = gV.difficulty;
            let textObject = scene.children.getByName('bestTimesText');
            let times = gV.timer.bestTimes[difficulty];
            let timesText = 'Best Times\n';
            times.forEach( (c)=> {
                if (c!=3600) { // valid user time
                    timesText += c + 's\n';
                }
            })
            textObject.setText(timesText);
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
            p.setVisible(true);
            scene.tweens.add({ targets: p, delay: 2500, scale: 1, duration: 500, ease: 'Cubic.easeIn', onComplete: vars.audio.perfectScore })
            scene.tweens.add({ targets: p, delay: 2500, alpha: 1, duration: 100 })
        },

        timeUpdate: function(_delta,_newTime) {
            if (_delta===null) { _delta = _newTime*1000; }
            scene.children.getByName('timerInt').setText((_delta/1000).toFixed(3));
            scene.children.getByName('timerInt_S').setText((_delta/1000).toFixed(3));
        },

        updateMoveCount: function() {
            scene.children.getByName('movesInt').setText(vars.player.moves);
            scene.children.getByName('movesInt_S').setText(vars.player.moves);
        },

        welcomeMessage: function(_msg) {
            let xStart = 410; let xInc = 38;
            let y = 990;
            if (_msg.length>0) {
                let msgArray = _msg.split('');
                msgArray.forEach( (l, i)=> {
                    [1.0,0.8,0.6,0.4,0.2].forEach( (a)=> {
                        let x = xStart + (i*xInc);
                        let colour = '#A00';
                        if (a<1) { colour = '#f80' }
                        let c = scene.add.text(x,y,l, { fontStyle: 'bold', color: colour, fontSize: 64 }).setAlpha(a).setDepth(10*a);
                        scene.tweens.add({
                            // messing about with the x var is pretty trippy eg x: x+30
                            targets: c, delay: i*17+((1-a) * 100), y: y-80, duration: 500, yoyo: true, repeat: -1, ease: 'Quad.easeInOut'
                        })
                    })
                })
            }
        },

        winner: function() {
            let c = scene.children.getByName('winnerImage');
            scene.tweens.add({ targets: c, y: vars.canvas.cY, duration: 2000, alpha: 1 })
            
            // is this score better than the current high score?
            let pV = vars.player;
            let gV = vars.game;
            let difficulty = gV.difficulty;
            let pMoves = pV.moves;
            if (gV.bestScoreForDifficultyCheck(difficulty,pMoves)===true) {
                vars.localStorage.saveScores();
            }

            let perfectGame = Math.pow(2,difficulty)-1;
            if (pMoves===perfectGame) {
                // colour cycle the win image
                vars.UI.colourTweenWinner();
                vars.UI.showPerf();
            }
            vars.particles.fireworksEnable();

            // bounce the restart button to make it obvious how you start a new game.
            let a = scene.children.getByName('UI_restart');
            vars.UI.winnerTween = scene.tweens.add({ targets: a, scale: 1, duration: 2000, yoyo: true, repeat: -1, ease: 'Bounce.easeIn' })
        }

    }

}