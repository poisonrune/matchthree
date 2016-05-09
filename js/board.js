matchThree.board = (function(){

	var settings;
	var tiles;
	var cols, rows;
	var baseScore;
	var numTileTypes;

	function init(startJewels, callback) {
		dBug("init called");
		settings = matchThree.settings;
		numTileTypes = settings.numTileTypes;
		baseScore = settings.baseScore;
		cols = settings.cols;
		rows = settings.rows;
		if (startJewels) {
			tiles = startJewels;
		} else {	
			fillBoard();
		}

		if(callback){
			callback();
		}
	}

	function fillBoard() {
		dBug("Filling board");
		var x, y;

		tiles = [];

		for(x = 0; x < cols; x++){
			tiles[x] = [];
			for(y = 0; y < rows; y++) {
				do {
					type = randomTile();
				} while ((type === getTile(x-1, y) && type === getTile(x-2,y)) || (type === getTile(x, y-1) && type === getTile(x, y-2)));
				tiles[x][y] = type;
			}
		}

		// try again if new board has no moves
		if (!hasMoves()) {
			fillBoard();
		}
	}

	function getTile(x,y) {
		var retVal = -1;
		if (!(x < 0 || x > cols-1 || y < 0 || y > rows-1)) {
			retVal = tiles[x][y];
		}
		return retVal;
	}

	function randomTile() {
		return Math.floor(Math.random() * numTileTypes);
	}

	function checkChain(x,y) {
		var type = getTile(x,y);
		var left, down, up, right;

		left = down = up = right = 0;
		while (type == getTile(x + right + 1, y)) { right++; }
		while (type == getTile(x - left - 1, y)) { left++; }
		while (type == getTile(x, y + up + 1)) { up++; }
		while (type == getTile(x, y - down - 1)) { down++; }
		return Math.max(left + 1 + right, up + 1 + down);
	}

	function canSwap(x1, y1, x2, y2) {
		var type1 = getTile(x1,y1),
			type2 = getTile(x2,y2),
			chain;

		if (!isAdjacent(x1, y1, x2, y2)) {
			return false;
		}
		// temp swap tiles
		tiles[x1][y1] = type2;
		tiles[x2][y2] = type1;

		chain = (checkChain(x2, y2) > 2 ||
				 checkChain(x1, y1) > 2);

		// swap back
		tiles[x1][y1] = type1;
		tiles[x2][y2] = type2;

		return chain;
	}

	// returns true if (x1,y1) is adjacent to (x2,y2)
	function isAdjacent(x1, y1, x2, y2) {
		var dx = Math.abs(x1 - x2),
			dy = Math.abs(y1 - y2);
		return (dx + dy === 1);
	}

	// returns a 2 dimensional map of chain-lengths
	function getChains() {
		var x, y,
			chains = [];

		for (x = 0; x < cols; x++) {
			chains[x] = []
			for (y = 0; y < rows; y++) {
				chains[x][y] = checkChain(x, y);
			}
		}
		return chains;
	}

	function check(events) {
		var chains = getChains(),
			hadChains = false, score = 0,
			removed = [], moved = [], gaps = [],  events = events || [];

			for (var x = 0; x < cols; x++) {
					gaps[x] = 0;
					for (var y = rows-1; y >= 0; y--) {
						if (chains[x][y] > 2) {
							hadChains = true;
							gaps[x]++;
							removed.push({
								x : x, y : y,
								type : getTile(x, y)
							});

							// add points to score
							score += baseScore *
									 Math.pow(2, (chains[x][y] - 3));

						} else if (gaps[x] > 0) {
							moved.push({
								toX : x, toY : y + gaps[x],
								fromX : x, fromY : y,
								type : getTile(x,y)
							});
							tiles[x][y + gaps[x]] = getTile(x, y);
						}
					}
				}

				// fill from top
				for (var x = 0; x < cols; x++) {
					for (y = 0; y < gaps[x]; y++) {
							tiles[x][y] = randomTile();
							moved.push({
								toX : x, toY : y,
								fromX : x, fromY : y - gaps[x],
								type : tiles[x][y]
							});
					}
				}

				if ( hadChains ) {
					events.push({
						type : "remove",
						data : removed
					}, {
						type : "score",
						data : score
					}, {
						type : "move",
						data : moved
					});
					// refill if no more
					if (!hasMoves()) {
						fillBoard();
						events.push({
							type : 'refill',
							data : getBoard()
						});
					}
		 
		            return check(events);
				} else {
					return events;
				}
	}

	// returns true if there's still moves left
	function hasMoves() {
		for (var x = 0; x < cols; x++) {
			for (var y = 0; y < rows; y++) {
				if (canTileMove(x, y)) {
					return true;
				}
			}
		}
		return false;
	}

	// returns true if (x,y) are in valid position and if
	// the jewel at (x,y) can be swapped with neighbour
	function canTileMove(x, y) {
		return(
				( x > 0 && canSwap(x, y, x - 1, y)) ||
                ( x < cols - 1 && canSwap(x, y, x + 1, y)) ||
                ( y > 0 && canSwap(x, y, x, y - 1)) ||
                ( y < rows - 1 && canSwap(x, y, x, y + 1))
			);
	}

	function getBoard() {
		var copy = [],
			x;

		for (x = 0; x < cols; x++) {
			copy[x] = tiles[x].slice(0);
		}
		return copy;
	}


	function swap(x1, y1, x2, y2, callback) {

		var tmp, swap1, swap2,
		events = [];
		swap1 = {
			type : "move",
			data : [{
				type : getTile(x1, y1),
				fromX : x1, fromY : y1, toX : x2, toY : y2
			},{
				type : getTile(x2, y2),
				fromX : x2, fromY : y2, toX : x1, toY : y1
			}]
		};
		swap2 = {
			type : "move",
			data : [{
				type : getTile(x2, y2),
				fromX : x1, fromY : y1, toX : x2, toY : y2
			},{
				type : getTile(x1, y1),
				fromX : x2, fromY : y2, toX : x1, toY : y1
			}]
		};
		if (isAdjacent(x1, y1, x2, y2)) {
			events.push(swap1);
			if (canSwap(x1, y1, x2, y2)) {
				tmp = getTile(x1, y1);
				tiles[x1][y1] = getTile(x2, y2);
				tiles[x2][y2] = tmp;
				events = events.concat(check());
			} else {
				events.push(swap2, {type : "badswap"});
			}
			callback(events);
		}
	}

	function dBugBoard() {
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
		dBugBoard : dBugBoard,
		canSwap : canSwap,
		getBoard : getBoard,
		swap : swap
	}

})();