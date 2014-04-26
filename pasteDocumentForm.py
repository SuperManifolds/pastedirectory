#!/usr/bin/python
# -*- coding: utf-8 -*-
from wtforms import Form, BooleanField, TextAreaField, SelectField, TextField, validators

class pasteDocumentForm(Form):
	data = TextAreaField('data', [validators.Required(), validators.length(max=10485760)])
	language = SelectField('lang', [validators.Required()], coerce=str)
	self_destruct = BooleanField('self_destruct', [validators.Optional()], default=False)
	data = TextAreaField('encrypt', [validators.Optional(), validators.length(max=128)])
	expires = SelectField('expires', [validators.required()], coerce=int, choices=[
		(0, 'Never'),
		(10, '10 minutes'),
		(60, '1 hour'),
		(1440, '1 day'),
		(43200, '1 month')]
	)
	
	
	
	