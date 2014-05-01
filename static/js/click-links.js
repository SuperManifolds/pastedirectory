(function (mod) {
	if (typeof exports == "object" && typeof module == "object") // CommonJS
		mod(require("../../lib/codemirror"));
	else if (typeof define == "function" && define.amd) // AMD
		define(["../../lib/codemirror"], mod);
	else // Plain browser env
		mod(CodeMirror);
})(function (CodeMirror) {
	"use strict";
	CodeMirror.defineOption("makeLinksClickable", false, function (cm, val, old) {
		var prev = old && old != CodeMirror.Init;
		if (val && !prev) {
			cm.on("mousedown", onmouseup);
		} else if (!val && prev) {
			cm.off("mousedown", onmouseup);
		}
	});
	function onmouseup(cm, e) {
		if (!e.target.classList.contains("cm-link")) return;
		var link = e.target.innerHTML;
		if (link.match(/^www\./)) {
			link = "http://" + link;
		}
		window.open(link, '_blank');
	}
});
