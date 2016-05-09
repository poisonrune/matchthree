matchThree.board = (function(){
	var settings, worker, messageCount, callbacks;
	var dom = matchThree.dom;

	function post(command, data, callback) {
		callbacks[messageCount] = callback;
		worker.postMessage({
			id : messageCount,
			command : command,
			data : data
		});
		messageCount++;
	}

	function messageHandler(event) {
		var message = event.data;
		dBug(event.data);
		tiles = message.tiles;
		if(callbacks[message.id]) {
			callbacks[message.id](message.data);
			delete callbacks[message.id];
		}
	}

	function init(startJewels, callback) {
		settings = matchThree.settings;
		rows = settings.rows;
		cols = settings.cols;
		messageCount = 0;
		callbacks = [];
		worker = new Worker("js/board.worker.js");
		dom.bind(worker, "message", messageHandler);
		var data = {settings : matchThree.settings, startJewels : startJewels};
		post("init", data, callback);
	}

	function swap(x1,y1,x2,y2, callback) {
		post("swap", {
			x1 : x1,
			y1 : y1,
			x2 : x2,
			y2 : y2
		}, callback);
	}

	function getBoard() {
		var copy = [];
		var x;

		for(x = 0; x < cols; x++) {
			copy[x] = tiles[x].slice(0);
		}
		return copy;
	}

	function getTile(x,y) {
		var retVal = -1;
		if (!(x < 0 || x > cols-1 || y < 0 || y > rows-1)) {
			retVal = tiles[x][y];
		}
		return retVal;
	}

	function dBugTileBoard() {
		var str = "";
		for(var y = 0; y < rows; y++){
			for (var x = 0; x < cols; x++) {
				str += getTile(x,y) + " ";
			}
			str += "\r\n";
		}
		dBug(str);
	}

	function dBug(data) {
		console.log(data);
	}

	return {
		init : init,
		swap : swap,
		getBoard : getBoard,
		dBugTileBoard : dBugTileBoard
	}


})();