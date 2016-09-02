'''
PuckLab webapp!

Uses python(flask) and mongo db
'''

from flask import Flask, send_from_directory
from flask.ext.pymongo import PyMongo
import src.views.index as index
import src.views.game
import src.data.game

app = Flask(__name__)

# Mongodb connection

app.config['MONGO_DBNAME'] = 'pucklab'
mongo = PyMongo(app)

'''
Serve Static Files
'''


@app.route('/javascript/<path:path>')
def send_javascript(path):
    return send_from_directory('javascript', path)


@app.route('/style/<path:path>')
def send_style(path):
    return send_from_directory('style', path)


@app.route('/fonts/<path:path>')
def send_font(path):
    return send_from_directory('fonts', path)

'''
Serve the fun stuff
'''



@app.route("/")
def indexView():

    return index.Render(mongo.db)

# Serve a game
@app.route("/game/<int:season>/<team>/<int:gameNum>")
def gameView(season,team,gameNum):
    return src.views.game.Render(mongo.db,season,team,gameNum)

# Serve some game data
@app.route("/data/game/<int:season>/<team>/<int:gameNum>")
def gameData(season,team,gameNum):
    return src.data.game.Data(mongo.db,season,team,gameNum)



if __name__ == "__main__":
    app.run(debug=True)
