(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode('Objective-C', function(config) {

  var specialChars = /[+\-\/\\*~<>=%|&?!.,:;^]/;
  var keywords = /return|true|false|nil|self|super|thisContext|BOOL|int|protocol|property|protocol|synchronized|nonatomic|strong|copy|assign|for|while|implementation|interface|end\b/;

  var Context = function(tokenizer, parent) {
    this.next = tokenizer;
    this.parent = parent;
  };

  var Token = function(name, context, eos) {
    this.name = name;
    this.context = context;
    this.eos = eos;
  };

  var State = function() {
    this.context = new Context(next, null);
    this.expectVariable = true;
    this.indentation = 0;
    this.userIndentationDelta = 0;
  };

  State.prototype.userIndent = function(indentation) {
    this.userIndentationDelta = indentation > 0 ? (indentation / config.indentUnit - this.indentation) : 0;
  };

  var next = function(stream, context, state) {
    var token = new Token(null, context, false);
    var aChar = stream.next();

    if (aChar === '/') {
		if(stream.eat('*')) {		
			token = nextBlockComment(stream, new Context(nextBlockComment, context));
		} else if (stream.eat('/')) {
			token = nextLineComment(stream, new Context(nextLineComment, context));			
		}
	  
    } else if (aChar === '@') {
		if(stream.eat('"')) {
			token = nextString(stream, new Context(nextString, context));
		} else {
	        stream.eatWhile(specialChars);
	        token.name = 'operator';
	        token.eos = true;
	  	}
    } else if (aChar === '#') {
      if (stream.peek() === '\'') {
        stream.next();
        token = nextSymbol(stream, new Context(nextSymbol, context));
      } else {
        if (stream.eatWhile(/[^\n\/]/))
          token.name = 'string-2';
        else
          token.name = 'meta';
		  token.eos = true;
      }
    } else if (aChar === '$') {
      if (stream.next() === '<') {
        stream.eatWhile(/[^ >]/);
        stream.next();
      }
      token.name = 'string-2';

    } else if (aChar === '|' && state.expectVariable) {
      token.context = new Context(nextTemporaries, context);

    } else if (/[\[\]{}()]/.test(aChar)) {
      token.name = 'bracket';
      token.eos = /[\[{(}]/.test(aChar);

      if (aChar === '[') {
        state.indentation++;
      } else if (aChar === ']') {
        state.indentation = Math.max(0, state.indentation - 1);
      }

    } else if (specialChars.test(aChar)) {
      stream.eatWhile(specialChars);
	  if (aChar !== ';')	  
      	token.name = 'operator';
      token.eos = true;

    } else if (/\d/.test(aChar)) {
      stream.eatWhile(/[\w\d]/);
      token.name = 'number';

    } else if (/[\w_]/.test(aChar)) {
      stream.eatWhile(/[\w\d_]/);
      token.name = state.expectVariable ? (keywords.test(stream.current()) ? 'keyword' : 'variable') : 'null';

    } else {
      token.eos = state.expectVariable;
    }

    return token;
  };
  
  var nextLineComment = function(stream, context) {
    stream.eatWhile(/[^\n\/]/);	
    return new Token('comment', context.parent, true);
  };
  
  var nextBlockComment = function(stream, context) {
    stream.eatWhile(/[^\/]/);
    return new Token('comment', stream.eat('/') ? context.parent : context, true);
  };
  
  var nextString = function(stream, context) {
    stream.eatWhile(/[^"]/);
    return new Token('string', stream.eat('"') ? context.parent : context, false);
  };

  var nextSymbol = function(stream, context) {
    stream.eatWhile(/[^']/);
    return new Token('string-2', stream.eat('\'') ? context.parent : context, false);
  };

  var nextTemporaries = function(stream, context) {
    var token = new Token(null, context, false);
    var aChar = stream.next();

    if (aChar === '|') {
      token.context = context.parent;
      token.eos = true;

    } else {
      stream.eatWhile(/[^|]/);
      token.name = 'variable';
    }

    return token;
  };

  return {
    startState: function() {
      return new State;
    },

    token: function(stream, state) {
      state.userIndent(stream.indentation());

      if (stream.eatSpace()) {
        return null;
      }

      var token = state.context.next(stream, state.context, state);
      state.context = token.context;
      state.expectVariable = token.eos;

      return token.name;
    },

    blankLine: function(state) {
      state.userIndent(0);
    },

    indent: function(state, textAfter) {
      var i = state.context.next === next && textAfter && textAfter.charAt(0) === ']' ? -1 : state.userIndentationDelta;
      return (state.indentation + i) * config.indentUnit;
    },

    electricChars: ']',
    fold: "brace"
  };

});

CodeMirror.defineMIME('text/x-objc', {name: 'Objective-C'});

});