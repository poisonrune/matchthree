matchThree.display = (function(){
	var animations = [];
	var paused;
	var cursor;
	var canvas, ctx;
	var cols, rows;
	var tileSize;
	var firstRun = true;
	var tileSprite;
	var previousCycle;

	function setup() {
		var $ = matchThree.dom.$;
		var settings = matchThree.settings;
		var boardElement = $("#screen-game .game-board")[0];

		cols = settings.cols;
		rows = settings.rows;

		canvas = document.createElement("canvas");
		ctx = canvas.getContext("2d");
		matchThree.dom.addClass(canvas, "board");

		var rect = boardElement.getBoundingClientRect();
		canvas.width = rect.width;
		canvas.height = rect.height;
		tileSize = rect.width / cols;

		boardElement.appendChild(createBackground());
		boardElement.appendChild(canvas);

		previousCycle = Date.now();
		requestAnimationFrame(cycle);
	}

	function cycle() {
		var time = Date.now();
		
		if (!paused) {
			// hide cursor while animating
			if (animations.length === 0 ) {
				renderCursor(time);
			}
			renderAnimatons(time, previousCycle);
		}
		previousCycle = time;
		requestAnimationFrame(cycle);
	}

	function pause() {
		paused = true;
	}

	function resume(pauseTime) {
		paused = false;
		for (var i=0; i<animations.length; i++) {
			animations[i].startTime += pauseTime;
		}
	}

	function init(callback){
		paused = false;
		if(firstRun) {
			setup();
			tileSprite = new Image();
			tileSprite.addEventListener("load", callback, false);
			tileSprite.src = "images/jewels" + tileSize + ".png";
			firstRun = false;
		} else {
			callback();
		}
	}

	function createBackground() {
		var bg = document.createElement("canvas");
		var bgctx = bg.getContext("2d");

		matchThree.dom.addClass(bg, "board-bg");
		bg.width = cols * tileSize;
		bg.height = rows * tileSize;

		bgctx.fillStyle = "rgba(255,255,255,0.15)";
		for(var x = 0; x < cols; x++) {
			for (var y = 0; y < rows; y++) {
				if((x + y) % 2){
					bgctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
				}
			}
		}
		return bg;
	}

	function drawTile(type, x, y, scale, rot) {
		ctx.save();
		if (typeof scale !== "undefined" && scale > 0) {
			ctx.beginPath();
			ctx.translate(
				(x + 0.5) * tileSize,
				(y + 0.5) * tileSize
			);

			ctx.scale(scale, scale);
			if (rot) {
				ctx.rotate(rot);
			}

			ctx.translate(
				-(x + 0.5) * tileSize,
				-(y + 0.5) * tileSize
			);
		}

		ctx.drawImage(tileSprite,
			type * tileSize, 0, tileSize, tileSize,
			x * tileSize, y * tileSize,
			tileSize, tileSize
		);
		ctx.restore();
	}

	function clearCursor() {
		if (cursor) {
			var x = cursor.x,
				y = cursor.y;
			clearTile(x, y);
			drawTile(tiles[x][y], x, y);
		}
	}

	function clearTile(x, y) {
		ctx.clearRect(
			x * tileSize, y * tileSize, tileSize, tileSize
			);
	}

	function setCursor(x, y, selected) {
		clearCursor();
		if (arguments.length > 0) {
			cursor = {
				x : x,
				y : y,
				seleted : selected
			};
		} else {
			cursor = null;
		}
	}

	function renderCursor(time) {
		if (!cursor) {
			return;
		}
		var x = cursor.x;
			y = cursor.y;
			t1 = (Math.sin(time / 200) + 1) / 2;
			t2 = (Math.sin(time / 400) + 1) / 2;

		clearCursor();

		if (cursor.selected) {
			ctx.save();
			ctx.globalCompositeOperation = "lighter";
			ctx.globalAlpha = 0.8 * t1;
			drawTile(tiles[x][y], x, y);
			ctx.restore();
		}
		ctx.save();
		ctx.lineWidth = 0.05 * tileSize;
		ctx.strokeStyle = "rgba(250,250,150," + (0.5 + .5 * t2) + ")";
		ctx.strokeRect(
			(x + 0.05) * tileSize, (y + 0.05) * tileSize,
			0.9 * tileSize, 0.9 * tileSize
		);
		ctx.restore();
	}

	function redraw(newTiles, callback) {
		var x,y;
		tiles = newTiles;
		ctx.clearRect(0,0,canvas.width, canvas.height);
		for(x = 0; x < cols; x++) {
			for(y = 0; y < rows; y++){
				drawTile(tiles[x][y], x, y);
			}
		}
		callback();
	}

	// Temp animation functions
	function moveTiles(movedTiles, callback) {
		console.log("test");
		var n = movedTiles.length,
				oldCursor = cursor;
			cursor = null;

		movedTiles.forEach(function(e) {
    		var x = e.fromX, y = e.fromY,
    		    dx = e.toX - e.fromX,
    	       	dy = e.toY - e.fromY,
    	       	dist = Math.abs(dx) + Math.abs(dy);
    	    addAnimation(200 * dist, {
    			before : function(pos) {
    				pos = Math.sin(pos * Math.PI / 2);
    				clearTile(x + dx * pos, y + dy * pos);
    			},
    			render : function(pos) {
    				pos = Math.sin(pos * Math.PI / 2);
    				drawTile(
    					e.type,
    					x + dx * pos, y + dy * pos
    				);
    			},
    			done : function() {
    				if (--n == 0) {
    					cursor = oldCursor;
    					callback();
    				}
    			}
    		});
    	});
	}

	function removeTiles(removedTiles, callback) {
		console.log("test");
		var n = removedTiles.length;
    	removedTiles.forEach(function(e) {
    		addAnimation(400, {
    			before : function() {
    				clearTile(e.x, e.y);
    			},
    			render : function(pos) {
    				ctx.save();
    				ctx.globalAlpha = 1 - pos;
    				drawTile(
    					e.type, e.x, e.y,
    					1 - pos, pos * Math.PI * 2
    					);
    				ctx.restore();
    			},
    			done : function() {
    				if (--n == 0) {
    					callback();
    				}
    			}
    		});
    	});
	}

	function refill(newTiles, callback) {
		var lastJewel = 0;
		addAnimation(1000, {
			render : function(pos) {
				var thisJewel = Math.floor(pos * cols * rows),
				i, x, y;
				for (i = lastJewel; i < thisJewel; i++) {
					x = i % cols;
					y = Math.floor(i / cols);
					clearTile(x, y);
					drawTile(newTiles[x][y], x, y);
				}
				lastJewel = thisJewel;
				matchThree.dom.transform(canvas,
					"rotateX(" + (360 * pos) + "deg)");
			},
			done : function() {
				canvas.style.webkitTransform = "";
				callback();
			}
		});
	}

	function levelUp(callback) {
		addAnimation(1000, {
			before : function(pos) {
				var j = Math.floor(pos * rows * 2),
				x, y;
				for (y=0, x=j; y<rows; y++, x--) {
					if (x >= 0 && x < cols) { // boudary check
						clearTile(x, y);
						drawTile(tiles[x][y], x, y);
					}
				}
			},
			render : function(pos) {
				var j = Math.floor(pos * rows * 2),
				x, y;
				ctx.save(); // save state
				ctx.globalCompositeOperation = "lighter";
				for (y=0, x=j; y<rows; y++, x--) {
					if (x >= 0 && x < cols) {
						drawTile(tiles[x][y], x, y, 1.1);
					}
				}
				ctx.restore();
			},
			done : callback
		});
	}

	function gameOver(callback) {
		addAnimation(1000, {
			render : function(pos) {
				canvas.style.left =
					0.2 * pos * (Math.random() - 0.5) + "em";
				canvas.style.top =
					0.2 * pos * (Math.random() - 0.5) + "em";
			},
			done : function() {
				canvas.style.left = "0";
				canvas.style.top = "0";
				explode(callback);
			}
		});
	}

	function explode(callback) {
		var pieces = [],
			piece,
			x, y;
		for (x=0; x<cols; x++) {
			for (y=0; y<rows; y++){
				piece = {
					type : tiles[x][y],
					pos : {
						x : x + 0.5,
						y : y + 0.5,
					},
					vel : {
						x : (Math.random() - 0.5) * 20,
						y : -Math.random() * 10
					},
					rot : (Math.random() - 0.5) * 3
				}
				pieces.push(piece);
			}
		}

		addAnimation(2000, {
			before : function(pos) {
				ctx.clearRect(0,0,canvas.width,canvas.height);
			},
			render : function(pos, delta) {
				explodePieces(pieces, pos, delta);
			},
			done : callback
		});
	}

	function explodePieces(pieces, pos, delta) {
		var piece, i;
		for (i=0; i<pieces.length; i++) {
			piece = pieces[i];

			piece.vel.y += 50 * delta;
			piece.pos.y += piece.vel.y * delta;
			piece.pos.x += piece.vel.x * delta;

			if (piece.pos.x < 0 || piece.pos.x > cols) {
				piece.pos.x = Math.max(0, piece.pos.x);
				piece.pos.x = Math.min(cols, piece.pos.x);
				piece.vel.x *= -1;
			}

			ctx.save();
			ctx.globalCompositeOperation = "lighter";
			ctx.translate(piece.pos.x * tileSize,
						  piece.pos.y * tileSize);
			ctx.rotate(piece.rot * pos * Math.PI * 4);
			ctx.translate(-piece.pos.x * tileSize,
						  -piece.pos.y * tileSize);
			drawTile(piece.type,
				piece.pos.x - 0.5,
				piece.pos.y - 0.5
			);
			ctx.restore();
		}
	}

	function addAnimation(runTime, fncs) {
		var anim = {
			runTime : runTime,
			startTime : Date.now(),
			pos : 0,
			fncs : fncs
		};
		animations.push(anim);
	}

	function renderAnimatons(time, lastTime) {
		var anims = animations.slice(0), // copy list
				n = anims.length,
				animTime,
				anim,
				i;

		// can before () function
		for (i=0;i<n;i++) {
			anim = anims[i];
			if (anim.fncs.before) {
				anim.fncs.before(anim.pos);
			}
			anim.lastPos = anim.pos;
			animTime = (lastTime - anim.startTime);
			anim.pos = animTime / anim.runTime;
			anim.pos = Math.max(0, Math.min(1, anim.pos));
		}

		animations = []; // reset animation list

		for (i=0;i<n;i++) {
			anim = anims[i];
			anim.fncs.render(anim.pos, anim.pos - anim.lastPos);
			if (anim.pos == 1) {
				if (anim.fncs.done) {
					anim.fncs.done();
				}
			} else {
				animations.push(anim);
			}

		}
	}


	return {
		init : init,
		redraw : redraw,
		setCursor : setCursor,
		moveTiles : moveTiles,
		removeTiles : removeTiles,
		refill : refill,
		pause : pause,
		resume : resume,
		levelUp : levelUp,
		gameOver : gameOver
	};
})();