(function(mod) {
    if (typeof exports == "object" && typeof module == "object") 
        mod(require("../../lib/codemirror"));
    else if (typeof define == "function" && define.amd) 
        define(["../../lib/codemirror"], mod);
    else
        mod(CodeMirror);
})(function(CodeMirror) {
    "use strict";


	CodeMirror.defineMode("links", function(config) {

	document.getElementById('expires').style.display='none';
		
		return { 
	        token: function(stream, state) {
		        return 'comment';
			}

	      };

	    });

 CodeMirror.defineMIME('links', {name: 'links'});

	    });