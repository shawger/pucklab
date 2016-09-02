#!/bin/bash          

cd ..
cd webapp
export FLASK_APP=pucklab.py
export FLASK_DEBUG=1
flask run