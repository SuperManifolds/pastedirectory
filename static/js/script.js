/* jslint browser: true */
/* global CodeMirror */

var getTheme = readCookie("theme");
if (!getTheme) getTheme = "nox";
if (getTheme === "lux") document.getElementById("myonoffswitch").checked = true;

var myCodeMirror;

var loadview = document.getElementById("loadview");
if (loadview) {
	myCodeMirror = CodeMirror(document.querySelector("main"), {
		theme: getTheme,
		value: decodeURIComponent(loadview.value),
		mode: document.querySelector("meta[name='syntax-language']").getAttribute("data"),
		lineWrapping: true,
		lineNumbers: true,
		styleActiveLine: true,
		matchBrackets: true,
		autofocus: true
	});
	if (window.location.hash) {
		jumpToLine(window.location.hash.substring(1));
	}
} else {
	myCodeMirror = CodeMirror(document.querySelector("main"), {
		theme: getTheme,
		mode: document.querySelector("meta[name='syntax-language']").getAttribute("data"),
		lineWrapping: true,
		styleActiveLine: true,
		matchBrackets: true,
		lineNumbers: true,
		autofocus: true
	});
}

document.getElementById("languages").addEventListener("change", function(e) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "api/language/get?lang=" + e.target.value, true);
	xhr.withCredentials = true;
	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4) {
			var response = JSON.parse(xhr.responseText);
			
			if (response[0].experimental) {
				if (!confirm("Support for this language is still experimental and may not behave as expected. Use at your own risk.")) {
					e.target.value = "text";
					return;
				}
			}
			if (!response.error) {
				var body=document.body;
				var modes = document.querySelectorAll("[rel='syntax']");
				for (var j = 0, jlen = modes.length; j < jlen; j++) {
					body.removeChild(modes[j]);
				}
				for (var i = 0, len = response[0].modes.length; i < len; i++) {
					var script= document.createElement('script');
					script.type= 'text/javascript';
					script.setAttribute("rel", "syntax");
					script.onload = function() {
						myCodeMirror.setOption("mode", response[0].MIME);
					};
					script.src= 'static/js/mode/' + response[0].modes[i] + '/' + response[0].modes[i] + '.js';
					body.appendChild(script);
					createCookie("language", e.target.value, 3652);
				}
			} else {
				alert("Error: " + response.error.message);
			}
		}
	};
	xhr.send();
}, false);

document.getElementById("expires").addEventListener("change", function(e) {
	createCookie("expires", e.target.value);
}, false);

document.getElementById("myonoffswitch").addEventListener("click", function(e) {
	var newTheme = e.target.checked ? "lux" : "nox";
	var stylesheet = document.createElement('link');
	var head = document.getElementsByTagName('head')[0];
	stylesheet.setAttribute("href", "static/css/theme/" + newTheme + ".css");
	stylesheet.setAttribute("rel", "stylesheet");
	stylesheet.setAttribute("data-rel", "theme");
	stylesheet.setAttribute("type", "text/css");
	head.removeChild(head.querySelector("[data-rel='theme']"));
	head.appendChild(stylesheet);
	myCodeMirror.setOption("theme", newTheme);
	createCookie("theme", newTheme, 3652);
}, false);


document.getElementById("submitButton").addEventListener("click", function(e) {
	var pasteLanguage = document.getElementById("languages").value;
	var expireTime = document.getElementById("expires").value;
	var encryptionKey = document.getElementById("encrypt").value;
	var selfDestruct = document.getElementById("self_destruct").checked;
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "api/post" + e.target.value, true);
	xhr.withCredentials = true;
	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4) {
			var response = JSON.parse(xhr.responseText);
			if (!response.error) {
				var redirectLink = window.location = response.result.url;
				if (encryptionKey) redirectLink += "?key=" + encodeURIComponent(response.result.key);
				window.location = redirectLink;
			} else {
				alert("Error: " + response.error);
			}
		}
	};
	var data = new FormData();
	data.append("data", encodeURIComponent(myCodeMirror.getValue()));
	data.append("lang", pasteLanguage);
	data.append("expires", expireTime);
	if (selfDestruct) data.append("self_destruct", 1);
	if (encryptionKey) data.append("encrypt", encryptionKey);
	xhr.send(data);
}, false);

document.getElementById("nav-toggle").addEventListener("click", function(e) {
	if (e.target.classList.contains("active")) {
		e.target.classList.remove("active");
		document.getElementById("more").style.display = "none";
	} else {
		e.target.classList.add("active");
		document.getElementById("more").style.display = "block";
	}
}, false);

function jumpToLine(line) {
	if (line && !isNaN(Number(line))) {
		myCodeMirror.setCursor(Number(line-1),0);
		myCodeMirror.focus();
		var cursor = document.querySelector(".CodeMirror-cursor");
		cursor.scrollIntoView();
    }
}

function createCookie(name, value, expires, path, domain) {
	var cookie = name + "=" + value + ";";
	if (expires) {
		if(expires instanceof Date) {
			if (isNaN(expires.getTime())) {
				expires = new Date();
			}
		} else {
			expires = new Date(new Date().getTime() + parseInt(expires, 10) * 1000 * 60 * 60 * 24);
		}
		cookie += "expires=" + expires.toGMTString() + ";";
	}
	if (path) cookie += "path=" + path + ";";
	if (domain) cookie += "domain=" + domain + ";";
	document.cookie = cookie;
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}