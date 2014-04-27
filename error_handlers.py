#!/usr/bin/python
# -*- coding: utf-8 -*-

from flask import Blueprint, render_template, abort

error_handlers = Blueprint('error_handlers', __name__,
                        template_folder='templates')

@error_handlers.app_errorhandler(401)
def page_not_found(error):
	return render_template('errors/401.html'), 401

@error_handlers.app_errorhandler(403)
def page_not_found(error):
	return render_template('errors/403.html'), 403

@error_handlers.app_errorhandler(404)
def page_not_found(error):
	return render_template('errors/404.html'), 404

@error_handlers.app_errorhandler(415)
def page_not_found(error):
	return render_template('errors/415.html'), 415

@error_handlers.app_errorhandler(416)
def page_not_found(error):
	return render_template('errors/416.html'), 416

@error_handlers.app_errorhandler(417)
def page_not_found(error):
	return render_template('errors/417.html'), 417

@error_handlers.app_errorhandler(418)
def page_not_found(error):
	return render_template('errors/418.html'), 418

@error_handlers.app_errorhandler(426)
def page_not_found(error):
	return render_template('errors/426.html'), 426

@error_handlers.app_errorhandler(428)
def page_not_found(error):
	return render_template('errors/428.html'), 428

@error_handlers.app_errorhandler(429)
def page_not_found(error):
	return render_template('errors/429.html'), 429

@error_handlers.app_errorhandler(500)
def internal_server_error(error):
	return render_template('errors/500.html', ERROR_MSG=error), 500