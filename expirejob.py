#!/usr/bin/python
# -*- coding: utf-8 -*-
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
from datetime import timedelta

client = MongoClient()
db = client.pastedirectory
uploads = db.uploads.find()

for upload in uploads:
	if int(upload["expires"]) is not 0:
		expireTime = datetime.strptime(upload["time"], "%Y-%m-%d %H:%M:%S") + timedelta(minutes=int(upload["expires"]))
		if expireTime <= datetime.now():
			print("Deleting: " + str(upload["_id"]))
			db.uploads.remove({"_id": upload["_id"] })
			
		if upload["firstOpen"]:
			destructTime = datetime.strptime(upload["firstOpen"], "%Y-%m-%d %H:%M:%S") + timedelta(minutes=5)
			if destructTime <= datetime.now():
				print("Deleting: " + str(upload["_id"]))
				db.uploads.remove({"_id": upload["_id"] })

accessattempts = db.accessattempts.find()
for attempt in accessattempts:
	expireTime = datetime.strptime(attempt["time"], "%Y-%m-%d %H:%M:%S") + timedelta(minutes=60)
	if expireTime <= datetime.now():
		db.accessattempts.remove({"_id": attempt["_id"]})