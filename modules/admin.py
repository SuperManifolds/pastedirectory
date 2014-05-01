#!/usr/bin/python
# -*- coding: utf-8 -*-

from flask import Blueprint, render_template
import subprocess
import tempfile
import os

admin_controller = Blueprint('admin_controller', 'admin_controller',
                        template_folder='templates')


@admin_controller.route('/admin/exportlanguages')
def exportlanguages():
	mTempfile = tempfile.NamedTemporaryFile()
	proc = subprocess.call(['mongoexport', '-d', 'pastedirectory', '-c', 'devlanguages', '-o', mTempfile.name])
	with open (mTempfile.name, "r") as myfile:
		return myfile.read()
	