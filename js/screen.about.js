matchThree.screens["screen-about"] = (function() {
	var firstRun = true;

	function setup() {
		var $ = matchThree.dom.$;
		var backButton = $("#screen-about footer button[name=back]")[0]; // WHY WONT IT WORK!?$%YHUI()P
		matchThree.dom.bind(backButton, "click", function() {
			matchThree.showScreen("screen-mainmenu");
		});
	}
	
	function run() {
		if (firstRun) {
			setup();
			firstRun = false;
		}
	}
	return {
		run : run
	};
})();