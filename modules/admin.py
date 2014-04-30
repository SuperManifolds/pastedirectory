#!/usr/bin/python
# -*- coding: utf-8 -*-

from flask import Blueprint, render_template

admin_controller = Blueprint('admin_controller', 'admin_controller',
                        template_folder='templates')
