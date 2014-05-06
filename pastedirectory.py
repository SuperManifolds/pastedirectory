#!/usr/bin/python
# -*- coding: utf-8 -*-
import uuid
from flask import Flask, render_template, request, session, url_for, escape, make_response, abort, redirect, Blueprint, Response
from flask.ext.assets import Environment, Bundle
from flask.ext.scss import Scss
from pymongo import MongoClient
from bson.objectid import ObjectId
from bson.json_util import dumps
from time import strftime
from ConfigParser import SafeConfigParser
import hashlib
import urllib
import os
import sys
import json
import httplib2
import re
import os

from modules.errors import error_controller
from modules.admin import admin_controller
from modules.security import AESEncryption

os.path.dirname(os.path.abspath(__file__))
parser = SafeConfigParser()
parser.read('config.ini')
app = Flask(__name__)
app.jinja_env.line_statement_prefix = '%'
assets = Environment(app)
app.register_blueprint(error_controller)
app.register_blueprint(admin_controller)

if parser.get('webserver', 'static_url'):
	app.static_url_path = "//"+parser.get('webserver', 'static_url')
	assets.url = parser.get('webserver', 'static_url')

if parser.getboolean('webserver', 'force_https'):
	try:
		from flask_sslify import SSLify
		sslify = SSLify(app, permanent=True)
	except ImportError:
		pass
	
if parser.getboolean('application', 'debug'):
	app.debug = True

Scss(app, static_dir='static/css', asset_dir='static/sass', load_paths=['static/sass'])
app.secret_key = parser.get('application', 'secret_key')
app.config['MAX_CONTENT_LENGTH'] = parser.get('webserver', 'uploadsize') * 1024 * 1024
APPLICATION_NAME = parser.get('application', 'name')

client = MongoClient()
db = client.pastedirectory

def static_url_for(filename):
	if parser.get('webserver', 'static_url'):
		return parser.get('webserver', 'static_url')
	else:
		return url_for('static', filename=filename)
	
app.jinja_env.globals.update(static_url_for=static_url_for)

@app.route('/')
def index():
	common_languagelist = db.languages.find({"common": True}).sort("API", 1)
	languagelist = db.languages.find({"common": {"$in": [False, None]}}).sort("API", 1)
	theme = request.cookies.get("theme")
	if theme is None:
		theme = "dark"
	defaultlanguage = request.cookies.get("language")
	if defaultlanguage is None:
		defaultlanguage = "auto"
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
@app.route('/<uploadid>/raw')
def paste(uploadid):
	post = db.uploads.find_one({"id": uploadid})
	if post:
		common_languagelist = db.languages.find({"common": True}).sort("API", 1)
		languagelist = db.languages.find({"common": {"$in": [False, None]}}).sort("API", 1)
		theme = request.cookies.get("theme")
		if theme is None:
			theme = "dark"
		defaultexpire = request.cookies.get("expires")
		if defaultexpire is None:
			defaultexpire = 0
		mirrorlang = db.languages.find_one({"API": post["language"]})
		if post["self_destruct"] and hashlib.sha256(request.remote_addr).hexdigest() != post["author"]:
			db.uploads.remove({ "id": uploadid })
		if post.get("encrypted"):
			accessAttempts = db.accessattempts.find({"id": uploadid, "author": hashlib.sha256(request.remote_addr).hexdigest()}).count()
			if accessAttempts == 5:
				return render_template('encrypted.html',
										   uploadid=uploadid,
										   decryptFailed=True,
										   locked=True)
			if request.args.get("key"):
				postData = AESEncryption().decode(urllib.unquote(request.args.get("key")), post["data"])
				if postData:
					db.accessattempts.remove({"id": uploadid, "author": hashlib.sha256(request.remote_addr).hexdigest()})
					post["data"] = postData
				else:
					db.accessattempts.insert({"id": uploadid, "author": hashlib.sha256(request.remote_addr).hexdigest(), "time": strftime("%Y-%m-%d %H:%M:%S")})
					return render_template('encrypted.html',
										   uploadid=uploadid,
										   decryptFailed=True,
										   locked=accessAttempts == 4)
			else:
				return render_template('encrypted.html', uploadid=uploadid)
		
		getRoute = request.url_rule
		if '/raw' in getRoute.rule:
			return Response(urllib.unquote(post["data"]), mimetype='text/plain')
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
		if request.form.get('data', None) is None or len(request.form.get('data', None)) == 0:
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
		abort(405)
		
@app.route('/terms')
def terms():
	return render_template('terms.html')
	
def getServerLink(request):
	if parser.getboolean('webserver', 'wsgi'):
		return getRequestProtocol(request) + "://" + request.environ['SERVER_NAME'] + "/"
	else:
		return getRequestProtocol(request) + "://" + parser.get('webserver', 'host') + ":5000/"
		
def getRequestProtocol(request):
	if 'wsgi.url_scheme' in request.environ:
		return request.environ['wsgi.url_scheme']
	else:
		return 'http'


if __name__ == "__main__":
    app.run(host='0.0.0.0')