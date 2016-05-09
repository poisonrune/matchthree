var matchThree = (function(){ // anonymous function

	var scriptQueue = [];
	var numResourcesLoaded = 0;
	var numResources = 0;
	var executeRunning = false;
	var settings = {
		rows : 8,
		cols : 8,
		baseScore : 100,
		numTileTypes : 7,
		baseLevelTimer : 60000,
		baseLevelScore : 1500,
		baseLevelExp : 1.05,
		controls : {
			// keyboard
			KEY_UP : "moveUp",
			KEY_LEFT : "moveLeft",
			KEY_DOWN : "moveDown",
			KEY_RIGHT : "moveRight",
			KEY_ENTER : "selectJewel",
			KEY_SPACE : "selectJewel",
			// mouse and touch
			CLICK : "selectJewel",
			TOUCH : "selectJewel",
			// gamepad
			BUTTON_A: "selectJewel",
			LEFT_STICK_UP: "moveUp",
			LEFT_STICK_DOWN: "moveDown",
			LEFT_STICK_LEFT: "moveLeft",
			LEFT_STICK_RIGHT: "moveRight"
		}
	};

	function hasWebWorkers() {
		var workers = false;
		workers = ("Worker" in window);
		dBug("have workers: " + workers);
		return workers;
	}

	function preload(src) {
		var image = new Image();
		image.src = src;
	}

	function getLoadProgress() {
		return numResourcesLoaded / numResources;
	}

	function executeScriptQueue() {
		var next = scriptQueue[0];
		var first, script;

		if(next && next.loaded) {
			executerunning = true;

			scriptQueue.shift();
			first = document.getElementsByTagName("script")[0];
			script = document.createElement("script");
			script.onload = function() {
				if (next.callback) {
					next.callback();
				}
				executeScriptQueue();
			};
			script.src = next.src;
			first.parentNode.insertBefore(script, first);
		} else {
			executeRunning = false;
		}
	}

	function load(src, callback){
		var image, queueEntry;

		numResources++;

		queueEntry = {
			src : src,
			callback : callback,
			loaded : false
		};
		scriptQueue.push(queueEntry);

		image = new Image();
		image.onload = image.onerror = function() {
			numResourcesLoaded++;
			queueEntry.loaded = true;
			if(!executeRunning) {
				executeScriptQueue();
			}
		};
		image.src = src;

	}

	function showScreen(screenId){
		var dom = matchThree.dom;
		var $ = dom.$;
		var activeScreen = $("#game .screen.active")[0]; 
		var screen = $("#" + screenId)[0];

		if(activeScreen) {
			dom.removeClass(activeScreen, "active");
		}
		dom.addClass(screen, "active");

		// run the screen module
		matchThree.screens[screenId].run();

	}

	function isStandalone() {
		return (window.navigator.standalone !== false);
	}

	function setup(){
		dBug("success");
		// disable native touchmove behavior to
		// prevent overscroll
		matchThree.dom.bind(document, "touchmove", function(event) {
			event.preventDefault();
		});
		
		// hide the address bar on Android devices
		if (/Android/.test(navigator.userAgent)) {
			matchThree.dom.$("html")[0].style.height = "200%";
			setTimeout(function() {
				window.scrollTo(0, 1);
			}, 0);
		}

		if (isStandalone()) {
			matchThree.showScreen("screen-splash");
			} else {
				matchThree.showScreen("screen-install");
			}
	}

	function dBug(data) {
		console.log(data);
	}

	return {
		load : load,
		setup : setup,
		showScreen : showScreen,
		screens : {},
		isStandalone: isStandalone,
		settings: settings,
		hasWebWorkers : hasWebWorkers,
		preload : preload,
		getLoadProgress : getLoadProgress,
		screens : {}
	};
})();