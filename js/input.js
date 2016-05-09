matchThree.input = (function(){
	var keys = {
		37 : "KEY_LEFT",
		38 : "KEY_UP",
		39 : "KEY_RIGHT",
		40 : "KEY_DOWN",
		13 : "KEY_ENTER",
		32 : "KEY_SPACE",
		65 : "KEY_A",
		66 : "KEY_B",
		67 : "KEY_C",
		/* ... alpha keys 68 - 87 ... */
		88 : "KEY_X",
		89 : "KEY_Y",
		90 : "KEY_Z"
	};

	var inputHandlers;

	function initialize() {
		var dom = matchThree.dom,
			  $ = dom.$,
			  controls = matchThree.settings.controls,
			  board = $("#screen-game .game-board")[0];

		// key board stuff
		dom.bind(document, "keydown", function(event) {
			var keyName = keys[event.keyCode];
			if (keyName && controls[keyName]) {
				event.preventDefault();
				trigger(controls[keyName]);
			}
		});

		inputHandlers = {};
		dom.bind(board, "mousedown", function(event){
			handleClick(event, "CLICK", event);
		});
		dom.bind(board, "touchstart", function(event){
			handleClick(event, "TOUCH", event.targetTouches[0]);
		});
	}

	function bind(action, handler) {
		// bind a handler function to a game state
		if (!inputHandlers[action]) {
			inputHandlers[action] = [];
		}
		inputHandlers[action].push(handler);
	}

	function trigger(action) {
		// trigger a game action
		var handlers = inputHandlers[action],
			args = Array.prototype.slice.call(arguments, 1);
		console.log("Game action: " + action);
		if (handlers) {
			for (var i=0; i<handlers.length; i++) {
				handlers[i].apply(null, args);
			}
		}
	}

	function handleClick(event, control, click) {
		// is any action bound to this input control?
		var settings = matchThree.settings,
			action = settings.controls[control];
		if (!action) {
			return;
		}

		var board = matchThree.dom.$("#screen-game .game-board")[0],
			rect  = board.getBoundingClientRect(),
			relX, relY,
			jewelX, jewelY;

		// click position relative to board
		relX = click.clientX - rect.left;
		relY = click.clientY - rect.top;
		//	jewel coordinates
		jewelX = Math.floor(relX / rect.width * settings.cols);
		jewelY = Math.floor(relY / rect.height * settings.rows);
		// trigger functions bound to action
		trigger(action, jewelX, jewelY);
		// prevent default click behaviour
		event.preventDefault();
	}

	return {
		initialize : initialize,
		bind : bind
	};



})();