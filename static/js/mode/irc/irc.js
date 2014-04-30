(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode('IRC History', function(config) {

	var specialChars = /[\]\]\<\>]/;

	var Context = function(tokenizer, parent) {
	this.next = tokenizer;
	this.parent = parent;
	};

	var Token = function(name, context, eos) {
	this.name = name;
	this.context = context;
	};

	var State = function() {
	this.context = new Context(next, null);
	this.expectVariable = true;
	};

	State.prototype.userIndent = function(indentation) {
	this.userIndentationDelta = indentation > 0 ? (indentation / config.indentUnit - this.indentation) : 0;
	};

	var next = function(stream, context, state) {
		var token = new Token(null, context, false);
		var aChar = stream.next();

		if (aChar === '[') {
			token = nextIRCTime(stream, new Context(nextIRCTime, context));
	    } else if (aChar === '<') {
			stream.eat(/[@&+%!~]/);
	    	token = nextIRCNick(stream, new Context(nextIRCNick, context));
	    } else if (aChar === '*') {
			if(stream.eat('*') && stream.eat('*')) {
				token = nextIRCJPQ(stream, new Context(nextIRCJPQ, context));				
			}
		}
	
		return token;
	};
 
    var nextIRCTime = function(stream, context) {
		stream.eatWhile(/[\d:]/);
		var tok = new Token('null', context.parent, true);
		if(stream.eat(']')) {
		  tok.name = 'comment';
		}
		return tok;
    };
	
    var nextIRCNick = function(stream, context) {
		stream.eatWhile(/[\w\d_\-^{}\]\]`\\]/);
		var tok = new Token('null', context.parent, true);	  
		if(stream.eat('>')) {
		  tok.name = 'def';
		}
		return tok;
    };
	
	var nextIRCJPQ = function(stream, context) {
		stream.eatWhile(/.+/);
		var tok = new Token('string-2', context.parent, true);	  
		return tok;		
	}
	 
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

    };

  });

  CodeMirror.defineMIME('irc', {name: 'IRC History'});

  });