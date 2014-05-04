function LanguageEstimator() {
	this.estimateLanguage = function(text) {
		if (text.length > 100000) {
			text= text.substring(0, 1000000);
		}
		//text = text.replace(/\n|\r/g, "");
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
		"syntaxTokens": [/([[\w]*)\s*([[\w_]*)\(.*\)\s*\{(.*)\}/g, /#include\s*[\"\<]([[\w_\-\.\/]*)[\"\>]/g],
		"keywordTokens": ["struct", "_Packed", "violatile", "typedef", "register", "extern", "sizeof", "auto", "#ifdef", "#endif", "#else"]
	},
	{
		"name": "cplus",
		"caseSensitive": true,
		"syntaxTokens": [/([[\w]*)\s*([[\w_]*)::([[\w_]*)\(.*\)\s*\{(.*)/g, /([[\w]*)\s*([[\w_]*)\(.*\)\s*\{(.*)\}/g, /#include\s*[\"\<]([[\w_\-\.\/]*)[\"\>]/g],
		"keywordTokens": ["#ifndef", "#if", "#else", "#endif", "extern", "typedef", "namespace", "public:", "private:", "alignas", "alignof", "explicit", "const_cast", "constexpr"]
	},
	{
		"name": "csharp",
		"caseSensitive": true,
		"syntaxTokens": [/using\s*([[\w_\.]*);/g, /(public|private|protected|internal)\s*(partial|static|abstract)?\s*([[\w_]*)\s*([[\w_\.]*)(\(.*\))?\s*(\:\s*([[\w_\.]*))\s*\{.*\}/g],
		"keywordTokens": ["using", "namespace", "abstract", "sealed", "sizeof", "ushort", "interface", "protected", "throw", "extern", "override", "implicit", "delegate", "unchecked"]
	},
	{
		"name": "css",
		"caseSensitive": false,
		"syntaxTokens": [/([\.#]?)([[\w_-]*)(\[.*\])?\s*\{\s*(.*)\}/g],
		"keywordTokens": ["body", "div", "@font-face", "height", "width", ":before", ":after", ":hover", ":active", "font-family", "font-size", "border", "-webkit-", "-moz-", "margin"]
	},
	{
		"name": "diff",
		"caseSensitive": true,
		"syntaxTokens": [/^index [\w]*..[\w]* [\w]*$/gm, /^\@\@ [-+][0-9,.]* [-+][0-9,.]* \@\@/gm, /^([\+]|[\-]){1,3}/gm],
		"keywordTokens": ["diff", "index", "@@"],
		"headers": [/^@@ [-+][0-9,.]* [-+][0-9,.]* @@/gm]
	},
	{
		"name": "html",
		"caseSensitive": false,
		"syntaxTokens": [/<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/g],
		"keywordTokens": ["meta", "img", "body", "div", "head", "html", "br", "class", "id", "header", "link", "script"],
		"headers": [/<!DOCTYPE\s*html>/gi, /<!DOCTYPE\s*HTML\s*PUBLIC\s*"-\/\/W3C\/\/DTD\s*HTML/gi]
	},
	{
		"name": "ini",
		"caseSensitive": true,
		"syntaxTokens": [/^\[[\w_\-]*\]$/gm, /^[\w_\-]*=.*$/],
		"keywordTokens": []
	},
	{
		"name": "irc",
		"caseSensitive": false,
		"syntaxTokens": [/^([\(\[])?([0-9\+\-\:TAPMtapm]){5,50}/gm, /<(.)?[\w_\\\[\]\{\}\`\^\|]*>/g],
		"keywordTokens": ["join", "part", "quit", "topic", "nick", "kick", "mode"]
	},
	{
		"name": "java",
		"caseSensitive": true,
		"syntaxTokens": [/(import|package)\s*([[\w_\.]*);/g, /(public|private|protected|internal)\s(static|abstract)?\s*(final|const)?\s*([[\w_]*)\s*([[\w_]*)\s*(implements|extends)?\s*([[\w_]*)\s*(\(.*)\)\s*{.*}/g],
		"keywordTokens": ["package", "import", "assert", "abstract", "synchronized", "strictfp", "implements", "goto", "native", "instanceof", "interface", "extends"]
	},
	{
		"name": "jinja2",
		"caseSensitive": true,
		"syntaxTokens": [/\{%\s*[\w"._!=><"\-\/\(\) ]*%}/gm, /^%\s*[\w"._!=><"\-\/\(\) ]*/gm, /<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/g],
		"keywordTokens": ["for", "extends", "block", "endblock", "from", "autoescape", "endfor"]
	},
	{
		"name": "js",
		"caseSensitive": true,
		"syntaxTokens": [/function\s*\t*([[\w_]*)\((.*)\)/g, /var\s*([[\w_]*)\s*\t*=\s*\t*(.*)/g, /if\s*\((.*)\)\s*/g],
		"keywordTokens": ["undefined", "NaN", "function", "default", "var", "typeof", "debugger", "prototype", "window.", "document.", "navigator.", "parseInt"]
	},
	{
		"name": "json",
		"caseSensitive": true,
		"syntaxTokens": [/"[\w$_\-]*":\s*([\[].*[\]]|"[^"]*"|[0-9.]*|true|false|-[Ee])/g],
		"keywordTokens": []
	},
	{
		"name": "less",
		"caseSensitive": true,
		"syntaxTokens": [/\$[\w-_]*:.*/gm, /^@base:\s*.*;/gm, /([\.#])([\w-_])*\(.*\) when \(.*\)(\s.*)?{/gm, /([\.#]?)([[\w_-]*)\(.*\);/gm, /^[#!]?([\w]+)\s*([\w]+):/gm],
		"keywordTokens": ["base", "when", "body", "div", "@font-face", "height", "width", ":before", ":after", ":hover", ":active", "font-family", "font-size", "border", "-webkit-", "-moz-", "margin"]
	},
	{
		"name": "markdown",
		"caseSensitive": true,
		"syntaxTokens": [/(__|\*\*).*(__|\*\*)/g, /(!)?\[.*\]\(.*\)/g],
		"keywordTokens": ["====", "----", "###"]
	},
	{
		"name": "mirc",
		"caseSensitive": false,
		"syntaxTokens": [/on [\*0-9]{1,3}:[\w]*:([\w_\\\[\]\{\}\`\^\|]*:)?.*:[\?\#\*]: {/gi],
		"keywordTokens": ["on", "alias", "dialog"],
		"headers": [/on [\*0-9]{1,3}:[\w]*:([\w_\\\[\]\{\}\`\^\|]*:)?.*:[\?\#\*]: {/gi]
	},
	{
		"name": "mssql",
		"caseSensitive": false,
		"syntaxTokens": [/SELECT [\w\-_, \*]* FROM [\w\-_]*/gmi, /SELECT TOP\([0-9]\)*[\w\-_, \*]* FROM [\w\-_]*/],
		"keywordTokens": ["select", "from", "where", "order by", "limit", "offset", "create", "table", "database", "index"]
	},
	{
		"name": "mysql",
		"caseSensitive": false,
		"syntaxTokens": [/SELECT [\w\-_, \*]* FROM [\w\-_]*/gmi],
		"keywordTokens": ["select", "from", "where", "order by", "limit", "offset", "create", "table", "database", "index"]
	},
	{
		"name": "objc",
		"caseSensitive": true,
		"syntaxTokens": [/@property\s*\(.*\)\s*([[\w_]*)\s*(\*)?([[\w_]*);/g, /-\s*\(([[\w_]*)\)([[\w_]*)\:\(([[\w_]*)\s(\*)?\)([[\w_]*)/g, /\+\s*\(([[\w_]*)\)([[\w_]*)\:\(([[\w_]*)\s(\*)?\)([[\w_]*)/g, /if\s*\((.*)\)\s*/g, /#include\s*[\"\<]([[\w_\-\.\/]*)[\"\>]/g],
		"keywordTokens": ["IBAction", "IBOutlet", "module", "strong", "assign", "@autoreleasepool", "@end", "@try", "@catch", "@class", "@interface", "@implementation", "@protocol", "@public", "@private", "@selector", "@synthesize", "nonatomic", "retain", "YES", "NO", "nil"]
	},
	{
		"name": "perl",
		"caseSensitive": true,
		"syntaxTokens": [/(package|use)\s*[\w_\/]*(\:\:[\w_\/]*)?.*;/g, /sub\s*[A-Za-z._]*\s*(\(.*\))?\s*{.*}/g, /(my)?\s*\$([\w]*)\s*=/g, /\$[\w_]*->[\w_]*/g],
		"keywordTokens": ["use", "our", "sub", "my", "end", "sleep", "printf", "chdir", "exec", "eval", "split", "$self"],
		"headers": [/#![\w_\/]*\/perl/g]
	},
	{
		"name": "php",
		"caseSensitive": true,
		"syntaxTokens": [/<\?(php)?\s*(.*)\?>/g, /(include(_once)?|require(_once)?)\s*([[\w_\-\.\/'"]*);/g, /if\s*\(.*\)\s*({)?.*(})?/g],
		"keywordTokens": ["global", "die", "print", "require_once", "require", "include", "include_once", "instanceof", "unset", "enddeclare", "extends", "foreach", "declare"]
	},
	{
		"name": "properties",
		"caseSensitive": true,
		"syntaxTokens": [/^(\s*)[\w._\-]*\s*(=|:).*$/gmi],
		"keywordTokens": []
	},
	{
		"name": "python",
		"caseSensitive": true,
		"syntaxTokens": [/(from\s*([[\w_\-\.\/'"]*))?\s*import\s*([[\w_\-\.\/'"]*)\s*(as ([[\w_]*))/g, /(class|def)\s*([\w_-]*)\(.*\):/g],
		"keywordTokens": ["def", "and", "as", "del", "from", "not", "elif", "global", "assert", "pass", "yield", "except", "import", "lambda", "exec"],
		"headers": [/#![\w_\/]*\/python/g]
	},
	{
		"name": "ruby",
		"caseSensitive": true,
		"syntaxTokens": [/require\s*([[\w_\-\.\/'"]*)/g, /class\s*[A-Za-z._]*(\s*<\s*[A-Za-z._]*)?/g, /def\s*[A-Za-z._]*(\([\w_\-,.]*\))?.*end/g],
		"keywordTokens": ["def", "end", "begin", "rescue"]
	},
	{
		"name": "scss",
		"caseSensitive": true,
		"syntaxTokens": [/\$[\w-_]*:.*;/g, /@include\s*[\w_-]*\(.*\);/, /([\.#:&]*?)([[\w_-]*)(\[.*\])?\s*\{\s*(.*)\}/g],
		"keywordTokens": ["@include", "@import", "@extend", "body", "div", "@font-face", "height", "width", ":before", ":after", ":hover", ":active", "font-family", "font-size", "border", "-webkit-", "-moz-", "margin"]
	},
	{
		"name": "sql",
		"caseSensitive": false,
		"syntaxTokens": [/SELECT [\w\-_, \*]* FROM [\w\-_]*\(.*/gmi],
		"keywordTokens": ["select", "from", "where", "order by", "limit", "offset", "create", "table", "database", "index", "row_number"]
	},
	{
		"name": "vb",
		"caseSensitive": true,
		"syntaxTokens": [/imports\s*([[\w_\.]*);/g, /(Public|Private)?\s*(Class|Sub)\s*([[\w_\.]*)\(.*\)(.*)End Sub/g],
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