
'''
A page displaying a game summary
'''

import os
import sys
import json
import jinja2

import time
from datetime import date

# Setup the JINJA envronment
# Setup the JINJA envronment
templatePath = os.path.abspath(os.path.join(os.path.dirname(__file__),
                                            '..',
                                            '..',
                                            'templates'))

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(templatePath),
    extensions=['jinja2.ext.autoescape'],
    autoescape=False)

# For importing other modules!
path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(path)

import pieces.page as page
import data.game

'''
View the main index page
'''


def Render(db, season, team, gameNum):

    p = page.Page(db)

    # Setup the page
    p.title = "PuckLab | %d"\
        " | %s"\
        " | %d" % (season, team, gameNum)

    # p.nav.title = "PuckLab"

    p.nav = None

    # Set up the fields to get from the db
    fields = ["for.team.abv",
              "against.team.abv",
              "date",
              "home",
              "results",
              "for.stats",
              "against.stats"]

    # Get the game data
    game = data.game.gameQuery(db, season, team, gameNum, fields)

    # Fix the date
    game['date'] = game['date'].strftime('%Y-%m-%d')

    # Get the colors for the game
    forTeam = game['for']['team']['abv']
    againstTeam = game['against']['team']['abv']

    (forTeamColor, againstTeamColor) = teamColors(forTeam, againstTeam)

    forTeamStyle = "colors/game-for-" + forTeamColor
    againstTeamStyle = "colors/game-against-" + againstTeamColor

    p.styles = ["game", forTeamStyle, againstTeamStyle]
    p.d3 = True
    p.script = "game"

    template_values = {
        'data': game
    }

    template = JINJA_ENVIRONMENT.get_template('game.html')

    p.content = template.render(template_values)

    return p.render()


def getData(db, season, team, gameNum):

    requiredStats = ["season",
                     "for.team.abv",
                     "for.number"]

    attemptStats = ["date",
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

    include = includeDict(requiredStats + attemptStats)

    pl = [{"$project": include},
          {"$match":
           {"season": season,
            "for.team.abv": team,
            "for.number": gameNum}}]

    gameData = db.games.aggregate(pl)

    return list(gameData)[0]


def includeDict(includeList):

    include = dict()

    for item in includeList:

        include[item] = 1

    return include


'''
Get the color for a team
Each team has 2 colors incase there is
a conflict, in which case the secondary color
of the against team will be used
'''


def teamColors(forTeam, againstTeam):

    teamColors = {
        "L.A": ["yellow", "blue-grey"],
        "ANA": ["orange", "yellow"],
        "CAR": ["red", "blue-grey"],
        "MTL": ["red", "blue"],
        "DET": ["red", "blue-grey"],
        "COL": ["blue", "red"],
        "NSH": ["orange", "blue"],
        "BOS": ["yellow", "blue-grey"],
        "DAL": ["green", "blue-grey"],
        "PHI": ["orange", "blue-grey"],
        "EDM": ["blue", "orange"],
        "STL": ["blue", "yellow"],
        "MIN": ["green", "red"],
        "ATL": ["yellow", "red"],
        "N.J": ["red", "blue-grey"],
        "VAN": ["blue", "green"],
        "TOR": ["blue", "blue-grey"],
        "PHX": ["red", "blue-grey"],
        "OTT": ["red", "blue-grey"],
        "FLA": ["orange", "red"],
        "NYI": ["blue", "orange"],
        "PIT": ["yellow", "blue-grey"],
        "WSH": ["red", "blue"],
        "T.B": ["blue", "yellow"],
        "CGY": ["red", "yellow"],
        "S.J": ["green", "blue-grey"],
        "CBJ": ["blue", "red"],
        "NYR": ["blue", "red"],
        "CHI": ["red", "orange"],
        "BUF": ["blue", "orange"],
        "WPG": ["blue", "red"],
        "ARI": ["red", "blue-grey"]
    }

    forColors = teamColors[forTeam]
    againstColors = teamColors[againstTeam]

    if(forColors[0] != againstColors[0]):

        return (forColors[0], againstColors[0])

    else:

        return (forColors[0], againstColors[1])
