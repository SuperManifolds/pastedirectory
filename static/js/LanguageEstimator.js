function LanguageEstimator() {
	this.estimateLanguage = function(text) {
		if (text.length > 100000) {
			text= text.substring(0, 1000000);
		}
		text = text.replace(/\n|\r/g, "");
		var languageResults = [];
		var matchedHeader = null;
		languages.forEach(function(language) {
			var tokenScore = 0;
			var keyScore = 0;
			if (language.headers) {
				language.headers.forEach(function(languageHeader) {
					var rmatch = text.match(languageHeader);
					if (rmatch) matchedHeader = language.name;
				});
			}
			language.syntaxTokens.forEach(function(syntaxToken) {
				var rmatch =  text.match(syntaxToken);
				if (rmatch) tokenScore += rmatch.length;
			});
			language.keywordTokens.forEach(function(keywordToken) {
				var mRegex = language.caseSensitive ? new RegExp(keywordToken, "g") : new RegExp(keywordToken, "gi");
				var rmatch = text.match(mRegex);
				if (rmatch) keyScore += rmatch.length;
			});
			var score = ((tokenScore*10)+keyScore);
			if (score > 0) {
				languageResults.push({"name": language.name, "score": score, "keyScore": keyScore, "tokenScore": tokenScore});
			}
		});
		if (matchedHeader) return matchedHeader;
		languageResults = languageResults.sort(function(a, b) {
			return b.score - a.score;
		});
		if (languageResults.length > 0) {
			console.log(languageResults);
			if (languageResults.length > 1) {
				return languageResults[0].name;
			} else {
				return languageResults[0].name;
			}
		}
		return null;
	};
}

var languages = [
	{
		"name": "c",
		"caseSensitive": true,
		"syntaxTokens": [/([[a-zA-Z09]*)\s*([[a-zA-Z0-9_]*)\(.*\)\s*\{(.*)\}/g, /#include\s*[\"\<]([[a-zA-Z0-9_\-\.\/]*)[\"\>]/g],
		"keywordTokens": ["struct", "_Packed", "violatile", "typedef", "register", "extern", "sizeof", "auto", "#ifdef", "#endif", "#else"]
	},
	{
		"name": "cplus",
		"caseSensitive": true,
		"syntaxTokens": [/([[a-zA-Z09]*)\s*([[a-zA-Z0-9_]*)::([[a-zA-Z0-9_]*)\(.*\)\s*\{(.*)/g, /([[a-zA-Z09]*)\s*([[a-zA-Z0-9_]*)\(.*\)\s*\{(.*)\}/g, /#include\s*[\"\<]([[a-zA-Z0-9_\-\.\/]*)[\"\>]/g],
		"keywordTokens": ["#ifndef", "#if", "#else", "#endif", "extern", "typedef", "namespace", "public:", "private:", "alignas", "alignof", "explicit", "const_cast", "constexpr"]
	},
	{
		"name": "csharp",
		"caseSensitive": true,
		"syntaxTokens": [/using\s*([[a-zA-Z0-9_\.]*);/g, /(public|private|protected|internal)\s*(partial|static|abstract)?\s*([[a-zA-Z0-9_]*)\s*([[a-zA-Z0-9_\.]*)(\(.*\))?\s*(\:\s*([[a-zA-Z0-9_\.]*))\s*\{.*\}/g],
		"keywordTokens": ["using", "namespace", "abstract", "sealed", "sizeof", "ushort", "interface", "protected", "throw", "extern", "override", "implicit", "delegate", "unchecked"]
	},
	{
		"name": "css",
		"caseSensitive": false,
		"syntaxTokens": [/([\.#]?)([[a-zA-Z0-9_-]*)(\[.*\])?\s*\{\s*(.*)\}/g],
		"keywordTokens": ["body", "div", "@font-face", "height", "width", ":before", ":after", ":hover", ":active", "font-family", "font-size", "border", "-webkit-", "-moz-", "margin"]
	},
	{
		"name": "irc",
		"caseSensitive": false,
		"syntaxTokens": [/^([\(\[])?([0-9\+\-\:TAPMtapm]){5,50}/gm, /<(.)?[A-Za-z0-9_\\\[\]\{\}\`\^\|]*>/g],
		"keywordTokens": ["join", "part", "quit", "topic", "nick", "kick", "mode"]
	},
	{
		"name": "java",
		"caseSensitive": true,
		"syntaxTokens": [/(import|package)\s*([[a-zA-Z0-9_\.]*);/g, /(public|private|protected|internal)\s(static|abstract)?\s*(final|const)?\s*([[a-zA-Z0-9_]*)\s*([[a-zA-Z0-9_]*)\s*(implements|extends)?\s*([[a-zA-Z0-9_]*)\s*(\(.*)\)\s*{.*}/g],
		"keywordTokens": ["package", "import", "assert", "abstract", "synchronized", "strictfp", "implements", "goto", "native", "instanceof", "interface", "extends"]
	},
	{
		"name": "jinja2",
		"caseSensitive": true,
		"syntaxTokens": [/\{%\s*[A-Za-z0-9"._!=><"\-\/\(\) ]*%}/gm, /^%\s*[A-Za-z0-9"._!=><"\-\/\(\) ]*/gm, /<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/g],
		"keywordTokens": ["for", "extends", "block", "endblock", "from", "autoescape", "endfor"]
	},
	{
		"name": "js",
		"caseSensitive": true,
		"syntaxTokens": [/function\s*\t*([[a-zA-Z0-9_]*)\((.*)\)/g, /var\s*([[a-zA-Z0-9_]*)\s*\t*=\s*\t*(.*)/g, /if\s*\((.*)\)\s*/g],
		"keywordTokens": ["undefined", "NaN", "function", "default", "var", "typeof", "debugger", "prototype", "window.", "document.", "navigator.", "parseInt"]
	},
	{
		"name": "json",
		"caseSensitive": true,
		"syntaxTokens": [/"[A-Za-z0-9$_\-]*":\s*([\[].*[\]]|"[^"]*"|[0-9.]*|true|false|-[Ee])/g],
		"keywordTokens": []
	},
	{
		"name": "html",
		"caseSensitive": false,
		"syntaxTokens": [/<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/g],
		"keywordTokens": ["meta", "img", "body", "div", "head", "html", "br", "class", "id", "header", "link", "script"],
		"headers": [/<!DOCTYPE\s*html>/gi, /<!DOCTYPE\s*HTML\s*PUBLIC\s*"-\/\/W3C\/\/DTD\s*HTML/gi]
	},
	{
		"name": "markdown",
		"caseSensitive": true,
		"syntaxTokens": [/(__|\*\*).*(__|\*\*)/g, /(!)?\[.*\]\(.*\)/g, ],
		"keywordTokens": ["====", "----", "###"]
	},
	{
		"name": "objc",
		"caseSensitive": true,
		"syntaxTokens": [/@property\s*\(.*\)\s*([[a-zA-Z0-9_]*)\s*(\*)?([[a-zA-Z0-9_]*);/g, /-\s*\(([[a-zA-Z0-9_]*)\)([[a-zA-Z0-9_]*)\:\(([[a-zA-Z0-9_]*)\s(\*)?\)([[a-zA-Z0-9_]*)/g, /\+\s*\(([[a-zA-Z0-9_]*)\)([[a-zA-Z0-9_]*)\:\(([[a-zA-Z0-9_]*)\s(\*)?\)([[a-zA-Z0-9_]*)/g, /if\s*\((.*)\)\s*/g, /#include\s*[\"\<]([[a-zA-Z0-9_\-\.\/]*)[\"\>]/g],
		"keywordTokens": ["IBAction", "IBOutlet", "module", "strong", "assign", "@autoreleasepool", "@end", "@try", "@catch", "@class", "@interface", "@implementation", "@protocol", "@public", "@private", "@selector", "@synthesize", "nonatomic", "retain", "YES", "NO", "nil"]
	},
	{
		"name": "perl",
		"caseSensitive": true,
		"syntaxTokens": [/(package|use)\s*[A-Za-z0-9_\/]*(\:\:[A-Za-z0-9_\/]*)?.*;/g, /sub\s*[A-Za-z._]*\s*(\(.*\))?\s*{.*}/g, /(my)?\s*\$([A-Za-z0-9]*)\s*=/g, /\$[A-Za-z0-9_]*->[A-Za-z0-9_]*/g],
		"keywordTokens": ["use", "our", "sub", "my", "end", "sleep", "printf", "chdir", "exec", "eval", "split", "$self"],
		"headers": [/#![A-Za-z0-9_\/]*\/perl/g]
	},
	{
		"name": "php",
		"caseSensitive": true,
		"syntaxTokens": [/<\?(php)?\s*(.*)\?>/g, /(include(_once)?|require(_once)?)\s*([[a-zA-Z0-9_\-\.\/'"]*);/g, /if\s*\(.*\)\s*({)?.*(})?/g],
		"keywordTokens": ["global", "die", "print", "require_once", "require", "include", "include_once", "instanceof", "unset", "enddeclare", "extends", "foreach", "declare"]
	},
	{
		"name": "python",
		"caseSensitive": true,
		"syntaxTokens": [/(from\s*([[a-zA-Z0-9_\-\.\/'"]*))?\s*import\s*([[a-zA-Z0-9_\-\.\/'"]*)\s*(as ([[a-zA-Z0-9_]*))/g, /(class|def)\s*([A-Za-z0-9_-]*)\(.*\):/g],
		"keywordTokens": ["def", "and", "as", "del", "from", "not", "elif", "global", "assert", "pass", "yield", "except", "import", "lambda", "exec"],
		"headers": [/#![A-Za-z0-9_\/]*\/python/g]
	},
	{
		"name": "ruby",
		"caseSensitive": true,
		"syntaxTokens": [/require\s*([[a-zA-Z0-9_\-\.\/'"]*)/g, /class\s*[A-Za-z._]*(\s*<\s*[A-Za-z._]*)?/g, /def\s*[A-Za-z._]*(\([A-Za-z0-9_\-,.]*\))?.*end/g],
		"keywordTokens": ["def", "end", "begin", "rescue"]
	},
	{
		"name": "scss",
		"caseSensitive": true,
		"syntaxTokens": [/\$[A-Za-z0-9-_]*:.*;/g, /@include\s*[A-Za-z0-9_-]*\(.*\);/, /([\.#:&]*?)([[a-zA-Z0-9_-]*)(\[.*\])?\s*\{\s*(.*)\}/g],
		"keywordTokens": ["body", "div", "@font-face", "height", "width", ":before", ":after", ":hover", ":active", "font-family", "font-size", "border", "-webkit-", "-moz-", "margin"]
	},
	{
		"name": "vb",
		"caseSensitive": true,
		"syntaxTokens": [/imports\s*([[a-zA-Z0-9_\.]*);/g, /(Public|Private)?\s*(Class|Sub)\s*([[a-zA-Z0-9_\.]*)\(.*\)(.*)End Sub/g],
		"keywordTokens": ["Dim", "Do", "Sub", "End", "ReDim", "For Each"]
	},
	{
		"name": "xhtml",
		"caseSensitive": false,
		"syntaxTokens": [/<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/g],
		"keywordTokens": ["meta", "img", "body", "div", "head", "html", "br", "class", "id", "header", "link", "script"],
		"headers": [/<!DOCTYPE\s*HTML\s*PUBLIC\s*"-\/\/W3C\/\/DTD\s*XHTML/gi]
	},
	{
		"name": "xml",
		"caseSensitive": false,
		"syntaxTokens": [/<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/g],
		"keywordTokens": [],
		"headers": [/<\?xml\s*version="[0-9.]*"/gi]
	}
];
/*
{
		"name": "",
		"caseSensitive": true,
		"syntaxTokens": [],
		"keywordTokens": []
	},
*/