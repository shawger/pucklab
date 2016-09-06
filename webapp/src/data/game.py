'''
Serves json data for a page
'''

import os
import sys

import time
from datetime import date
import json

from flask import Response

# For importing other modules!
path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(path)

# Serve data based of season, team and game number
def Data(db, season, team, gameNum):

    # Fields to return from query
    moreFields = ["date",
                    "for.team.name",
                    "against.team.abv",
                    "results.gameLength",
                    "results.win",
                    "results.type",
                    "home",
                    "for.stats.goals",
                    "ratio.goals",
                    "against.stats.goals",
                    "for.attempts.type",
                    "for.attempts.time",
                    "for.attempts.shooter",
                    "for.attempts.team.abv",
                    "for.attempts.against.abv",
                    "for.attempts.stats.for.goals",
                    "for.attempts.stats.for.attempts",
                    "for.attempts.stats.against.goals",
                    "for.attempts.stats.against.attempts",
                    "for.attempts.stats.ratio.attempts",
                    "for.attempts.stats.ratio.goals",
                    "for.attempts.stats.dif.goals",
                    "for.attempts.stats.dif.attempts",
                    "for.attempts.stats.ratio.goals",
                    "for.attempts.stats.ratio.shots",
                    "for.attempts.stats.for.shots",
                    "for.attempts.stats.against.shots",
                    "for.attempts.strength",
                    "against.attempts.type",
                    "against.attempts.time",
                    "against.attempts.shooter",
                    "against.attempts.team.abv",
                    "against.attempts.against.abv",
                    "against.attempts.stats.for.goals",
                    "against.attempts.stats.for.attempts",
                    "against.attempts.stats.against.goals",
                    "against.attempts.stats.against.attempts",
                    "against.attempts.stats.ratio.attempts",
                    "against.attempts.stats.dif.goals",
                    "against.attempts.stats.dif.attempts",
                    "against.attempts.stats.ratio.goals",
                    "against.attempts.stats.ratio.shots",
                    "against.attempts.stats.for.shots",
                    "against.attempts.stats.against.shots",
                    "against.attempts.strength",
                    "for.goals.type",
                    "for.goals.time",
                    "for.goals.shooter",
                    "for.goals.team.abv",
                    "for.goals.against.abv",
                    "for.goals.stats.for.goals",
                    "for.goals.stats.for.attempts",
                    "for.goals.stats.against.goals",
                    "for.goals.stats.against.attempts",
                    "for.goals.stats.ratio.attempts",
                    "for.goals.stats.dif.goals",
                    "for.goals.stats.dif.attempts",
                    "against.goals.type",
                    "against.goals.time",
                    "against.goals.shooter",
                    "against.goals.team.abv",
                    "against.goals.against.abv",
                    "against.goals.stats.for.goals",
                    "against.goals.stats.for.attempts",
                    "against.goals.stats.against.goals",
                    "against.goals.stats.against.attempts",
                    "against.goals.stats.ratio.attempts",
                    "against.goals.stats.dif.goals",
                    "against.goals.stats.dif.attempts",
                    ]

    #Get the game data
    game = gameQuery(db, season, team, gameNum, moreFields)

    if game is None:

        return ""

    # Fix the date
    game['date'] = game['date'].strftime('%Y-%m-%d')

    jsonDump = json.dumps(game,
                          sort_keys=True,
                          indent=4)

    return Response(jsonDump, mimetype='text/json')

'''
Get JSON data for a single game from mongo.
Fields is a list of fields to include in the return
'''
def gameQuery(db, season, team, gameNum, fields):

    # Fields requied for query
    requiredFields = ["season",
                      "for.team.abv",
                      "for.number",
                      "date"]

    # Create the dict used for the mongodb projection
    include = includeDict(requiredFields + fields)

    # Create the pipeline for the mongo query
    pl = [{"$project": include},
          {"$match":
           {"season": season,
            "for.team.abv": team,
            "for.number": gameNum}}]

    # Run the query
    gameData = db.games.aggregate(pl)

    # There should be 1 results in the list if successful
    games = list(gameData)

    # Return nothing if no data found or more then 1
    if(len(games) != 1):
        return None

    else:
        return games[0]

# Makes an include dict for a mongo query
# Every item in the list will be added as the key
# and the field will be: '1'
def includeDict(includeList):

    include = dict()

    for item in includeList:

        include[item] = 1

    return include
