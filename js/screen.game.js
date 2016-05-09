matchThree.screens["screen-game"] = ( function(){
	var firstRun = true;
	var paused, pausedStart;
	var cursor;

	function setLevelTimer(reset) {
		var $ = matchThree.dom.$;
		if (gameState.timer) {
			clearTimeout(gameState.timer);
			gameState.timer = 0;
		}
		if (reset) {
			gameState.startTime = Date.now();
			gameState.endTime =
				matchThree.settings.baseLevelTimer *
				Math.pow(gameState.level,
						-0.05 * gameState.level);
		}

			var delta = gameState.startTime +
						gameState.endTime - Date.now(),
				percent = (delta / gameState.endTime) * 100,
				progress = $("#screen-game .time .indicator")[0];
			if (delta < 0) {
				gameOver();
			} else {
				progress.style.width = percent + "%";
				gameState.timer = setTimeout(setLevelTimer, 30);
			}
	}

	function startGame() {
		var board = matchThree.board;
		var display = matchThree.display;
		var storage = matchThree.storage;

		gameState = {
            level : 0,
            score : 0,
            timer : 0, // seTimeout reference
            startTime : 0, // time at start of level
            endTime : 0 // time to gamae over
        };

        updateGameInfo();

        var activeGame = storage.get("activeGameData"),
        	useActiveGame,
        	startJewels;

        if (activeGame) {
        	useActiveGame = window.confirm("Do you want to continue your previous game?");
        	if (useActiveGame) {
        		var now = Date.now();
        		gameState.level = activeGame.level;
        		gameState.score = activeGame.score;
        		gameState.startTime = now - activeGame.time;
				gameState.endTime = activeGame.endTime;
				startJewels = activeGame.jewels;
        	}
        }
        //setLevelTimer(true);
        matchThree.audio.initialize();
		board.init(startJewels, function(){
			display.init(function(){
				cursor = {
						x:0,
						y:0,
						selected:false
					};
				display.redraw(board.getBoard(), function(){
					if (useActiveGame) {
						setLevelTimer();
					} else {
						advancelevel();
					}
				});
			});
		});
		paused = false;

		var dom = matchThree.dom;
			overlay = dom.$("#screen-game .pause-overlay")[0];
		overlay.style.display = "none";
	}

	function announce(str) {
		var dom = matchThree.dom,
			$ = dom.$,
			element = $("#screen-game .announcement")[0];
		element.innerHTML = str;
		dom.removeClass(element, "zoomfade");
		setTimeout(function(){
			dom.addClass(element, "zoomfade");
		}, 1);
	}

	function advancelevel() {
		gameState.level++;
		announce("Level" + gameState.level);
		updateGameInfo();
		gameState.startTime = Date.now();
		gameState.endTime = matchThree.settings.baseLevelTimer *
			Math.pow(gameState.level, -0.05 * gameState.level);
		setLevelTimer(true);

		matchThree.audio.play("levelup");
		matchThree.display.levelUp();
	}

	function setCursor(x, y, select) {
		cursor.x = x;
		cursor.y = y;
		cursor.selected = select;
		matchThree.display.setCursor(x, y, select);
	}

	function selectJewel(x,y) {
		if (paused) {
			return;
		}
		if (arguments.length === 0) { // first run shit
			selectJewel(cursor.x, cursor.y);
			return;
		}
		if (cursor.selected) {
			var dx = Math.abs(x - cursor.x),
				dy = Math.abs(y - cursor.y),
				dist = dx + dy;

			if (dist === 0) {
				// deselected the selected jewel
				setCursor(x,y, false);
			} else if (dist == 1) {
				// selected an adjacent jewel
				matchThree.board.swap(cursor.x, cursor.y, x, y, playBoardEvents);
				setCursor(x,y,false);

			} else {
				// selected a different jewle
				setCursor(x,y,true);
			}
		} else {
			setCursor(x,y,true);
		}
	}

	function playBoardEvents(events) {
		var display = matchThree.display;
		if (events.length > 0) {
			var boardEvent = events.shift(),
			next = function() {
                    playBoardEvents(events);
                };
		switch (boardEvent.type){
			case "move" :
				display.moveTiles(boardEvent.data, next);
				break;
			case "remove" :
				matchThree.audio.play("match");
				display.removeTiles(boardEvent.data, next);
				break;
			case "refill" :
				announce("No moves!");
				display.refill(boardEvent.data, next);
				break;
			case "score" :
				addScore(boardEvent.data);
				next();
				break;
			case "badswap" :
				matchThree.audio.play("badswap");
                next();
                break;
			default:
				next();
				break;
		}

		} else {
			display.redraw(matchThree.board.getBoard(), function() { 
				// good to go again
			});
		}
	}

	function moveCursor(x, y) {
		if (paused) {
			return;
		}
		var settings = matchThree.settings;
		if (cursor.selected) {
			x += cursor.x;
			y += cursor.y;

			if (x >= 0 && x < settings.cols && y >= 0 && y < settings.rows) {
				selectJewel(x, y);
			}
		} else {
			x = (cursor.x + x + settings.cols) % settings.cols;
			y = (cursor.y + y + settings.rows) % settings.rows;
			setCursor(x, y, false);
		}
	}

	// moving cursors
	function moveUp() {
		moveCursor(0, -1);
	}

	function moveDown() {
		moveCursor(0, 1);
	}

	function moveLeft() {
		moveCursor(-1, 0);
	}

	function moveRight() {
		moveCursor(1, 0);
	}



	function pauseGame() {
		if (paused) {
			return; // do nothing if already paused
		}
		var dom = matchThree.dom;
		overlay = dom.$("#screen-game .pause-overlay")[0];
			overlay.style.display = "block";

		paused = true;
		pausedStart = Date.now();
		clearTimeout(gameState.timer);
		matchThree.display.pause();
	}

	function resumeGame() {
		var dom = matchThree.dom;
		overlay = dom.$("#screen-game .pause-overlay")[0];
			overlay.style.display = "none";

		paused = false;

		var pauseTime = Date.now() - pausedStart;
		gameState.startTime += pauseTime;
		setLevelTimer();
		matchThree.display.resume(pauseTime);
	}

	function updateGameInfo() {
		var $ = matchThree.dom.$;
		$("#screen-game .score span")[0].innerHTML =
		gameState.score;
		$("#screen-game .level span")[0].innerHTML =
		gameState.level;
	}

	function addScore(points) {
		var settings = matchThree.settings,
			nextLevelAt = Math.pow(
				settings.baseLevelScore,
				Math.pow(settings.baseLevelExp,
						 gameState.level-1)
				);
		gameState.score += points;
		if (gameState.score >= nextLevelAt) {
			advancelevel();
		}
		updateGameInfo();
	}

	function setup() {
		var dom = matchThree.dom;
		var input = matchThree.input;
		dom.bind("footer button.exit", "click", exitGame);
		dom.bind("footer button.exit", "click", exitGame);
		dom.bind("footer button.pause", "click", pauseGame);
		dom.bind(".pause-overlay", "click", resumeGame);
		matchThree.input.initialize();

		input.bind("selectJewel", selectJewel);
		input.bind("moveUp", moveUp);
		input.bind("moveDown", moveDown);
		input.bind("moveLeft", moveLeft);
		input.bind("moveRight", moveRight);
	}

	function saveGameData() {
		matchThree.storage.set("activeGameData", {
			level : gameState.level,
			score : gameState.score,
			time : Date.now() - gameState.startTime,
			endTime : gameState.endTime,
			jewels : matchThree.board.getBoard()
		});
	}

	function exitGame() {
		pauseGame();
		var confirmed = window.confirm("Do you want to return to the main menu?");
		if(confirmed) {
			saveGameData();
			matchThree.showScreen("screen-mainmenu");
		} else {
			resumeGame();
		}
	}

	function gameOver() {
		matchThree.display.gameOver(function() {
		announce("Game over");
		matchThree.audio.play("gameover");
		});

		matchThree.storage.set("activeGameData", null);
		matchThree.storage.set("lastScore", gameState.score);
		setTimeout(function() {
			matchThree.showScreen("screen-scores");
		}, 2500);
	}

	function run() {
		if(firstRun) {
			setup();
			firstRun = false;
		}
		startGame();
	}

	return {
		run : run
	};
})();