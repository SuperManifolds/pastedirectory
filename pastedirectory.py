#!/usr/bin/python
# -*- coding: utf-8 -*-
import uuid
from flask import Flask, render_template, request, session, url_for, escape, make_response, abort, redirect
from pymongo import MongoClient
from bson.objectid import ObjectId
from bson.json_util import dumps
from time import strftime
from security import AESEncryption
from ConfigParser import SafeConfigParser
import hashlib
import urllib
import os
import sys
import json
import httplib2
import re
import os

parser = SafeConfigParser()
parser.read('config.ini')


app = Flask(__name__)

if parser.get('webserver', 'force_https'):
	try:
		from flask_sslify import SSLify
		sslify = SSLify(app, permanent=True)
	except ImportError:
		pass
	
if parser.get('application', 'debug'):
	app.debug = True

app.secret_key = parser.get('application', 'secret_key')
app.config['MAX_CONTENT_LENGTH'] = parser.get('webserver', 'uploadsize') * 1024 * 1024
APPLICATION_NAME = parser.get('application', 'name')

client = MongoClient()
db = client.pastedirectory

@app.route('/')
def index():
	common_languagelist = db.languages.find({"common": True})
	languagelist = db.languages.find({"common": None}).sort("API", 1)
	theme = request.cookies.get("theme")
	if theme is None:
		theme = "nox"
	defaultlanguage = request.cookies.get("language")
	if defaultlanguage is None:
		defaultlanguage = "c"
	mirrorlang = db.languages.find_one({"API": defaultlanguage})
	defaultexpire = request.cookies.get("expires")
	if defaultexpire is None:
		defaultexpire = 0
	return render_template('index.html',
						languages=languagelist,
						common_languages = common_languagelist,
						theme=theme,
						mirrorlang=mirrorlang)

@app.route('/<uploadid>')
def paste(uploadid):
	post = db.uploads.find_one({"id": uploadid})
	if post:
		common_languagelist = db.languages.find({"common": True})
		languagelist = db.languages.find({"common": None}).sort("API", 1)
		theme = request.cookies.get("theme")
		if theme is None:
			theme = "nox"
		defaultexpire = request.cookies.get("expires")
		if defaultexpire is None:
			defaultexpire = 0
		mirrorlang = db.languages.find_one({"API": post["language"]})
		if request.headers.get('User-Agent').startswith("Textual") or "AppEngine" in request.headers.get('User-Agent'):
			abort(403)
		if post["self_destruct"] and hashlib.sha256(request.remote_addr).hexdigest() != post["author"]:
			db.uploads.remove({ "id": uploadid })
		if post.get("encrypted"):
			if request.args.get("key"):
				postData = AESEncryption().decode(urllib.unquote(request.args.get("key")), post["data"])
				if postData:
					post["data"] = postData
				else:
					return render_template('encrypted.html', uploadid=uploadid, decryptFailed=True)
			else:
				return render_template('encrypted.html', uploadid=uploadid)
					
		return render_template('post.html',
							languages=languagelist,
							common_languages = common_languagelist,
							theme=theme,
							post=post,
							mirrorlang=mirrorlang,
							requestaddress=hashlib.sha256(request.remote_addr).hexdigest())
	else:
		abort(404)
	
@app.route('/api/language/list')
def api_language_list():
	languagelist = db.languages.find({}).sort("API", 1)
	return dumps(languagelist)

@app.route('/api/language/get')
def api_language_get():
	if request.args.get("lang") is not None:
		language = db.languages.find({"API": request.args.get("lang")})
		if language is not None:
			return dumps(language)
		else:
			return json.dumps(
				{"error": { "message": "Language not found.", "code": "LANG_NOT_FOUND" } }
			)
	else:
		return json.dumps(
			{"error": { "message": "You must define a language in the query.", "code": "FIELD_REQUIRED lang" } }
		)

@app.route('/api/post', methods=['POST', 'GET'])
def api_post():
	if request.method == 'POST':
		if request.form.get('data', None) is None:
			return json.dumps(
				{"error": { "message": "No post data was received", "code": "FIELD_REQUIRED data" } }
			)
		if request.form.get('lang', None) is None:
			return json.dumps(
					{"error": { "message": "Language was not defined", "code": "FIELD_REQUIRED lang" } }
				)
		language = db.languages.find({"API": request.form['lang']})
		if language is None:
			return json.dumps(
						{"error": { "message": "Language not found.", "code": "LANG_NOT_FOUND" } }
				)
		uniqueid = uuid.uuid4().hex[:20]
		expires = request.form.get('expires', None)
		if expires is None:
				expires = 0
		encryptionKey = request.form.get('encrypt', None)
		if encryptionKey is None:
			db.uploads.insert({ "id": uniqueid, "author": hashlib.sha256(request.remote_addr).hexdigest(), "time": strftime("%Y-%m-%d %H:%M:%S"), "data": request.form['data'], "language": request.form['lang'], "expires": expires, "self_destruct": request.form.get('self_destruct', None) })
			if request.form.get('redirect', None) is not None:
				return redirect('/' + uniqueid)
			else:
				return json.dumps({ "result": { "id": uniqueid, "url":  getServerLink(request) + uniqueid }})
		else:
			encryptedData = AESEncryption().encode(encryptionKey, request.form['data'])
			db.uploads.insert({ "id": uniqueid, "author": hashlib.sha256(request.remote_addr).hexdigest(), "time": strftime("%Y-%m-%d %H:%M:%S"), "data": encryptedData, "language": request.form['lang'], "expires": expires, "self_destruct": request.form.get('self_destruct', None), "encrypted": True })
		if request.form.get('redirect', None) is not None:
			return redirect('/' + uniqueid + "?key=" + urllib.quote(encryptionKey))
		else:
			return json.dumps({ "result": { "id": uniqueid, "url": getServerLink(request) + uniqueid, "key": encryptionKey }})
	else:
		return json.dumps(
			{"error": { "message": "Method not allowed. Please use HTTP POST", "code": "405" } }
		), 405
	
def getServerLink(request):
	if parser.get('webserver', 'wsgi'):
		return getRequestProtocol(request) + "://" + request.environ['SERVER_NAME'] + "/"
	else:
		return getRequestProtocol(request) + "://" + parset.get('webserver', 'host') + ":5000/"
		
def getRequestProtocol(request):
	if 'wsgi.url_scheme' in request.environ:
		return request.environ['wsgi.url_scheme']
	else:
		return 'http'

@app.errorhandler(401)
def page_not_found(error):
	return render_template('errors/401.html'), 401

@app.errorhandler(403)
def page_not_found(error):
	return render_template('errors/403.html'), 403

@app.errorhandler(404)
def page_not_found(error):
	return render_template('errors/404.html'), 404

@app.errorhandler(415)
def page_not_found(error):
	return render_template('errors/415.html'), 415

@app.errorhandler(416)
def page_not_found(error):
	return render_template('errors/416.html'), 416

@app.errorhandler(417)
def page_not_found(error):
	return render_template('errors/417.html'), 417

@app.errorhandler(418)
def page_not_found(error):
	return render_template('errors/418.html'), 418

@app.errorhandler(426)
def page_not_found(error):
	return render_template('errors/426.html'), 426

@app.errorhandler(428)
def page_not_found(error):
	return render_template('errors/428.html'), 428

@app.errorhandler(429)
def page_not_found(error):
	return render_template('errors/429.html'), 429

@app.errorhandler(500)
def internal_server_error(error):
	return render_template('errors/500.html', ERROR_MSG=error), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0')