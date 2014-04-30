#!/usr/bin/python
# -*- coding: utf-8 -*-

from flask import Blueprint, render_template, abort

error_handlers = Blueprint('error_handlers', __name__,
                        template_folder='templates')


@error_handlers.app_errorhandler(400)
def page_not_found(error):
	return render_template('errors/400.html'), 400

@error_handlers.app_errorhandler(401)
def page_not_found(error):
	return render_template('errors/401.html'), 401

@error_handlers.app_errorhandler(403)
def page_not_found(error):
	return render_template('errors/403.html'), 403

@error_handlers.app_errorhandler(404)
def page_not_found(error):
	return render_template('errors/404.html'), 404

@error_handlers.app_errorhandler(405)
def page_not_found(error):
	return render_template('errors/405.html'), 405

@error_handlers.app_errorhandler(406)
def page_not_found(error):
	return render_template('errors/406.html'), 406

@error_handlers.app_errorhandler(408)
def page_not_found(error):
	return render_template('errors/408.html'), 408

@error_handlers.app_errorhandler(409)
def page_not_found(error):
	return render_template('errors/409.html'), 409

@error_handlers.app_errorhandler(410)
def page_not_found(error):
	return render_template('errors/410.html'), 410

@error_handlers.app_errorhandler(411)
def page_not_found(error):
	return render_template('errors/411.html'), 411

@error_handlers.app_errorhandler(412)
def page_not_found(error):
	return render_template('errors/412.html'), 412

@error_handlers.app_errorhandler(413)
def page_not_found(error):
	return render_template('errors/413.html'), 413

@error_handlers.app_errorhandler(414)
def page_not_found(error):
	return render_template('errors/414.html'), 414

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