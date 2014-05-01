#!/usr/bin/python
# -*- coding: utf-8 -*-

from flask import Blueprint, render_template
import subprocess
import os

admin_controller = Blueprint('admin_controller', 'admin_controller',
                        template_folder='templates')


@admin_controller.route('/admin/exportlanguages')
def exportlanguages():
	subprocess.Popen(['mongoexport', '-d', 'pastedirectory', '-c', 'languages', '-o', 'export.json'])
	with open ("export.json", "r") as myfile:
		return myfile.read()
	