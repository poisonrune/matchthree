matchThree.screens["screen-mainmenu"] = (function(){
	var dom = matchThree.dom;
	var firstRun = true;

	function setup() {
		matchThree.dom.bind("#screen-mainmenu ul.menu", "click", function(e){
			if(e.target.nodeName.toLowerCase() === "button"){
				var action = e.target.getAttribute("name");
				matchThree.showScreen(action);
			}
		});
	}

	function run() {
		if(firstRun) {
			setup();
			firstRun = false;
		}
	}

	return {
		run: run
	};
})();