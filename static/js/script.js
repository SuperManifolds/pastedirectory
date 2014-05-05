/* jslint browser: true */
/* global CodeMirror */
var currentLanguage = '';

var getTheme = readCookie("theme");
if (!getTheme) getTheme = "dark";
if (getTheme === "light") document.getElementById("myonoffswitch").checked = true;
var estimator = new LanguageEstimator();

var mq = window.matchMedia('(max-width: 675px)');
mq.addListener(matchMediaEvent);
matchMediaEvent(mq);
var myCodeMirror;

var loadview = document.getElementById("loadview");
if (loadview) {
	myCodeMirror = CodeMirror(document.querySelector("main"), {
		theme: getTheme,
		value: decodeURIComponent(loadview.value),
		lineWrapping: true,
		lineNumbers: true,
		styleActiveLine: true,
		matchBrackets: true,
		autofocus: true,
		makeLinksClickable: true
	});
	if (window.location.hash) {
		jumpToLine(window.location.hash.substring(1));
	}
} else {
	myCodeMirror = CodeMirror(document.querySelector("main"), {
		theme: getTheme,
		lineWrapping: true,
		styleActiveLine: true,
		matchBrackets: true,
		lineNumbers: true,
		autofocus: true,
		makeLinksClickable: true
	});
}
var mSelector = document.querySelector("meta[name='syntax-language']").getAttribute("data");
if (mSelector !== "auto" && mSelector) loadLanguage(mSelector);

myCodeMirror.getWrapperElement().addEventListener("paste", function(e) {
	var languageSelector = document.getElementById("languages");
	var oldContents = myCodeMirror.getValue();
	var pasteAttempts = 0;
	var pasteTimer = setInterval(function() {
		pasteAttempts++;
		if (pasteAttempts > 60) clearInterval(pasteAttempts);
		var textEditorContents = myCodeMirror.getValue();
		if (textEditorContents !== oldContents) {
			clearInterval(pasteTimer);
			jumpToLine(1);
			if (languageSelector.value == "auto") {
				var getLanguage = estimator.estimateLanguage(myCodeMirror.getValue());
				if (getLanguage !== null) {
					currentLanguage = getLanguage;
					languageSelector.options[languageSelector.selectedIndex].text = "Auto (" + getOptionTextByValue(languageSelector.options, getLanguage) + ")";
					loadLanguage(getLanguage);
				} else {
					document.querySelector(".balloon").classList.add("active");
				}
			}
		}
	}, 50);
});

function matchMediaEvent(e) {
	var expireContainer = document.getElementById("expireContainer");
	var themeSwitch = document.querySelector(".onoffswitch");
	var rawButton = document.getElementById("rawButton");
	if (e.matches) {
		var moreContainer = document.getElementById("more");
		var expireHtml = expireContainer.cloneNode(true);
		var themeHtml = themeSwitch.cloneNode(true);
		expireContainer.parentNode.removeChild(expireContainer);
		themeSwitch.parentNode.removeChild(themeSwitch);
		moreContainer.appendChild(expireHtml);
		moreContainer.appendChild(themeHtml);
		if (rawButton) {
			var rawHtml = rawButton.cloneNode(true);
			rawButton.parentNode.removeChild(rawButton);
			moreContainer.appendChild(rawHtml);
		}
		expireHtml.firstChild.addEventListener("change", onExpireChange, false);
		themeHtml.addEventListener("click", onThemeSwitch, false);
	} else {
		var headerContainer = document.querySelector("header .right");
		var expireHtml = expireContainer.cloneNode(true);
		var themeHtml = themeSwitch.cloneNode(true);
		expireContainer.parentNode.removeChild(expireContainer);
		themeSwitch.parentNode.removeChild(themeSwitch);
		headerContainer.insertBefore(themeHtml,headerContainer.firstChild);
		headerContainer.insertBefore(expireContainer,headerContainer.firstChild);
		if (rawButton) {
			var rawHtml = rawButton.cloneNode(true);
			rawButton.parentNode.removeChild(rawButton);
			headerContainer.insertBefore(rawHtml, headerContainer.firstChild);
		}
		expireHtml.firstChild.addEventListener("change", onExpireChange, false);
		themeHtml.addEventListener("click", onThemeSwitch, false);
	
	}
}

function getOptionTextByValue(options, value) {
	for (var i = 0, len = options.length; i < len; i++) {
		if (options[i].value == value) return options[i].text;
	}
	return null;
}

function loadLanguage(language) {
	var languageSelector = document.getElementById("languages");
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "api/language/get?lang=" +language, true);
	xhr.withCredentials = true;
	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4) {
			var response = JSON.parse(xhr.responseText);
			
			if (response[0].experimental) {
				if (!confirm("Support for this language is still experimental and may not behave as expected. Use at your own risk.")) {
					languageSelector.value = "text";
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
				}
			} else {
				alert("Error: " + response.error.message);
			}
		}
	};
	xhr.send();
}


document.getElementById("languages").addEventListener("change", function(e) {
	document.querySelector(".balloon").classList.remove("active");
	currentLanguage = e.target.value;
	createCookie("language", e.target.value, 3652);
	loadLanguage(e.target.value);
}, false);


function onExpireChange(e) {
	createCookie("expires", e.target.value);
}

function onThemeSwitch(e) {
	var newTheme = e.target.checked ? "light" : "dark";
	var stylesheet = document.createElement('link');
	var head = document.getElementsByTagName('head')[0];
	stylesheet.setAttribute("href", "static/css/theme/" + newTheme + ".css");
	stylesheet.setAttribute("rel", "stylesheet");
	stylesheet.setAttribute("data-rel", "theme");
	stylesheet.setAttribute("type", "text/css");
	head.removeChild(head.querySelector("[data-rel='theme']"));
	head.appendChild(stylesheet);
	myCodeMirror.setOption("theme", newTheme);
	document.body.className = newTheme;
	createCookie("theme", newTheme, 3652);
}


document.getElementById("submitButton").addEventListener("click", function(e) {
	var pasteLanguage = (currentLanguage !== "auto" ? currentLanguage : "text");
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