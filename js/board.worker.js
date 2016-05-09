var matchThree = {};
importScripts("board.js");

addEventListener("message", function(event) {
	var board = matchThree.board;
	var message = event.data;

	switch(message.command) {
		case "init":
			matchThree.settings = message.data.settings;
			board.init(message.data.startJewels, callback);
			break;
		case "swap":
			board.swap(
					message.data.x1, message.data.y1,
					message.data.x2, message.data.y2,
					callback
				);
			break;
	}

	function callback(data) {
		postMessage({
			id : message.id,
			data : data,
			tiles : board.getBoard()
		});
	}
}, false);