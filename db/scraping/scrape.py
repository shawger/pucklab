from bs4 import BeautifulSoup
from pymongo import MongoClient
import os
from datetime import datetime
import re

# My libs
import utils

# Some parameters
START_YEAR = 2015
END_YEAR = 2015
GAMES_PER_YEAR = 1230
GAMES_LOCKOUT = 720
RE_LOAD = True


def main():

    # Create a new game dict and make some basic keys for subdicts
    loadDataToMongo()


def loadDataToMongo():

    # Figure out the file names
    rootPath = os.path.abspath(os.path.join(os.path.dirname(__file__),
                                            '..'))

    # connect to mongo
    client = MongoClient()
    db = client.pucklab
    games = db['games']

    if RE_LOAD:
        games.delete_many({})

    currentYear = START_YEAR
    while(currentYear <= END_YEAR):

        # 2012 was a lockout, so adjust games accordingly
        if(currentYear == 2012):
            gamesThisYear = GAMES_LOCKOUT
        else:
            gamesThisYear = GAMES_PER_YEAR

        i = 1
        while(i <= gamesThisYear):

            id = str(currentYear) + str(i)
            print id

            # Only add if not in db, or updating whole db
            if (RE_LOAD or
                games.find({"_id": id + "h"},
                           {"_id": 1}).limit(1).count() == 0 or
                    games.find({"_id": id + "a"},
                               {"_id": 1}).limit(1).count() == 0):

                fileName = str(currentYear) + \
                    str(currentYear + 1) + "_" + str(i) + ".HTM"
                rosterFile = rootPath + "/rawHTML/rosters/" + fileName
                playByPlayFile = rootPath + "/rawHTML/playbyplay/" + fileName

                # Make sure you can read the files in.
                if(os.path.isfile(rosterFile) and
                   os.path.isfile(playByPlayFile)):

                    # Create a new game
                    game = dict()

                    # Add the season
                    game['season'] = currentYear

                    # the roster must be the first scraped because other files
                    # depend on the roster data
                    print "Loading: " + rosterFile
                    game = scrapeRoster(rosterFile, game)

                    print "Loading: " + playByPlayFile
                    game = scrapePlayByPlay(playByPlayFile, game)

                    # split the game into a home record and away record
                    (home, away) = splitAndAddGame(game, id)

                    # save the 2 new records
                    games.insert(home)
                    games.insert(away)

            i += 1

        currentYear += 1


def splitAndAddGame(game, id):

    home = game['home']
    away = game['away']

    game.pop("home", None)
    game.pop("away", None)

    homeGame = dict(game)
    homeGame['for'] = home
    homeGame['against'] = away
    homeGame['home'] = 1
    homeGame['_id'] = id + "h"
    homeGame['date'] = game['date']
    homeGame['season'] = game['season']

    awayGame = dict(game)
    awayGame['for'] = away
    awayGame['against'] = home
    awayGame['home'] = 0
    awayGame['_id'] = id + "a"
    awayGame['date'] = game['date']
    awayGame['season'] = game['season']

    return [homeGame, awayGame]


def scrapePlayByPlay(htmlFile, game):

    # Parse the file with BeautifulSoup
    r = open(htmlFile, 'r').read()
    r = r.decode('cp1252')
    soup = BeautifulSoup(r, "html.parser")

    # First  find some game info. Who played, what time and where
    summary = soup.findAll('tr')[0]

    # Send to parser
    game = parseSummary(summary, game)

    # All the events are in tr with calss evenColor
    playsHtml = soup.find_all("tr", class_="evenColor")

    # Parse all the plays
    for playHtml in playsHtml:

        play = dict()
        # All plays have common fields. Lets break these out first

        play = parsePlay(playHtml, play, game)

        # Parse the goal type of play
        if(play['type'] == "GOAL"):

            goal = parseGoal(play, game)

            # Give the goal to the correct team
            # A goal is also a shot and an attempt, so add it
            # those lists to
            if(goal['team']['name'] == game['home']['team']['name']):

                if('goals' not in game['home']):
                    game['home']['goals'] = []

                if('shots' not in game['home']):
                    game['home']['shots'] = []

                if('attempts' not in game['home']):
                    game['home']['attempts'] = []

                goal['against'] = game['away']['team']

                game['home']['goals'].append(goal)
                game['home']['shots'].append(goal)

                goal['type'] = 'goal'

                game['home']['attempts'].append(goal)

            else:
                # drop the team who scored it (not needed)
                if('goals' not in game['away']):
                    game['away']['goals'] = []

                if('shots' not in game['away']):
                    game['away']['shots'] = []

                if('attempts' not in game['away']):
                    game['away']['attempts'] = []

                goal['against'] = game['home']['team']

                game['away']['goals'].append(goal)
                game['away']['shots'].append(goal)

                goal['type'] = 'goal'
                game['away']['attempts'].append(goal)

        elif(play['type'] == "SHOT"):

            shot = parseShot(play, game)
            # Give the shot to the correct team.
            # A shot is also an attempt

            if(shot['team']['name'] == game['home']['team']['name']):
                if('shots' not in game['home']):
                    game['home']['shots'] = []

                if('attempts' not in game['home']):
                    game['home']['attempts'] = []

                shot['against'] = game['away']['team']

                game['home']['shots'].append(shot)

                shot['type'] = 'shot'
                game['home']['attempts'].append(shot)

            else:
                if('shots' not in game['away']):
                    game['away']['shots'] = []

                if('attempts' not in game['away']):
                    game['away']['attempts'] = []

                shot['against'] = game['home']['team']

                game['away']['shots'].append(shot)

                shot['type'] = 'shot'
                game['away']['attempts'].append(shot)

        elif(play['type'] == "MISS"):

            miss = parseMiss(play, game)
            # Give the miss to the correct team.
            # A miss is also an attempt

            if(miss['team']['name'] == game['home']['team']['name']):
                if('misses' not in game['home']):
                    game['home']['misses'] = []

                if('attempts' not in game['home']):
                    game['home']['attempts'] = []

                miss['against'] = game['away']['team']
                game['home']['misses'].append(miss)

                miss['type'] = 'miss'
                game['home']['attempts'].append(miss)

            else:
                if('misses' not in game['away']):
                    game['away']['misses'] = []

                if('attempts' not in game['away']):
                    game['away']['attempts'] = []

                miss['against'] = game['home']['team']
                game['away']['misses'].append(miss)

                miss['type'] = 'miss'
                game['away']['attempts'].append(miss)

        elif(play['type'] == "BLOCK"):

            (attempt, block) = parseBlock(play, game)

            # Give the block and the attempt to the correct
            # teams

            if(attempt['team']['name'] == game['home']['team']['name']):
                if('attempts' not in game['home']):
                    game['home']['attempts'] = []

                if('blocks' not in game['away']):
                    game['away']['blocks'] = []

                attempt['against'] = game['away']['team']

                attempt['type'] = 'block'
                game['home']['attempts'].append(attempt)
                game['away']['blocks'].append(block)

            else:
                if('attempts' not in game['away']):
                    game['away']['attempts'] = []

                if('blocks' not in game['home']):
                    game['home']['blocks'] = []

                attempt['against'] = game['home']['team']
                attempt['type'] = 'block'
                game['away']['attempts'].append(attempt)
                game['home']['blocks'].append(block)

    return game


def parseBlock(play, game):

    # Because we are seperating plays by team and
    # shot blocking has information on both teams
    # we make a block (for the team that blocked the shot)
    # and an attempt for the team that shoot the shot

    block = play.copy()
    attempt = play.copy()
    playText = play["playText"]

    # We don't need the type (because it is a shot) or the playText anymore
    block.pop('type', None)
    block.pop('playText', None)

    attempt.pop('type', None)
    attempt.pop('playText', None)

    # Run this gnarly regex
    regexString = '([A-Z.]+)'\
                  '\s[#]?'\
                  '([0-9]+)'\
                  '.*?BLOCKED\sBY\s+'\
                  '([A-Z.]+)'\
                  '\s[#]?'\
                  '([0-9]+)'

    m = re.search(regexString, playText)

    if(m):
        shootingTeamRaw = m.group(1)
        blockingTeamRaw = m.group(3)
        shootingPlayerRaw = m.group(2)
        blockingPlayerRaw = m.group(4)

        block['team'] = utils.getTeamByAbv(blockingTeamRaw, game['season'])
        attempt['team'] = utils.getTeamByAbv(shootingTeamRaw, game['season'])

        # Figure out how to assign the team names to the attempt and
        # and the block. Also need to figure out what roster to use to
        # assign who was on the ice
        if (attempt['team']['name'] == game['home']['team']['name']):
            attemptRoster = game['home']['players']
            blockRoster = game['away']['players']

            attempt['onIceFor'] = attempt['homeOnIce']
            attempt['onIceAgainst'] = attempt['awayOnIce']

            block['onIceFor'] = attempt['awayOnIce']
            block['onIceAgainst'] = attempt['homeOnIce']

        else:
            attemptRoster = game['away']['players']
            blockRoster = game['home']['players']

            attempt['onIceFor'] = attempt['awayOnIce']
            attempt['onIceAgainst'] = attempt['homeOnIce']

            block['onIceFor'] = attempt['homeOnIce']
            block['onIceAgainst'] = attempt['awayOnIce']

        # We assigned who was on the ice based on for/against so
        # assigning players by home/away does not make sense
        attempt.pop('homeOnIce', None)
        attempt.pop('awayOnIce', None)

        block.pop('homeOnIce', None)
        block.pop('awayOnIce', None)

        attempt['shooter'] = attemptRoster[shootingPlayerRaw]
        block['blocker'] = blockRoster[blockingPlayerRaw]

    return (attempt, block)


def parseMiss(play, game):

    miss = play
    playText = play["playText"]

    # We don't need the type (because it is a shot) or the playText anymore
    miss.pop('type', None)
    miss.pop('playText', None)

    # Run this gnarly regex
    regexString = '([A-Z.]+)'\
                  '\s[#]?'\
                  '([0-9]+)'\
                  '.*?,\s'\
                  '([A-Za-z\-]+)'\
                  '.*?([0-9]+)'\
                  '\sft\.'

    m = re.search(regexString, playText)

    if(m):
        teamRaw = m.group(1)
        playerRaw = m.group(2)
        shotTypeRaw = m.group(3)
        distanceRaw = int(m.group(4))

        miss['team'] = utils.getTeamByAbv(teamRaw, game['season'])
        miss['type'] = shotTypeRaw
        miss['distance'] = distanceRaw

        # Assin players to the stat (goal scored and assists)
        # Check if the goal was scored by the home or the road team
        # Also, change the name of the 'oniceHome and onIce against' to
        # for and against
        if (miss['team']['name'] == game['home']['team']['name']):
            roster = game['home']['players']
            miss['onIceFor'] = miss['homeOnIce']
            miss['onIceAgainst'] = miss['awayOnIce']
        else:
            roster = game['away']['players']
            miss['onIceFor'] = miss['awayOnIce']
            miss['onIceAgainst'] = miss['homeOnIce']

        miss.pop('homeOnIce', None)
        miss.pop('awayOnIce', None)

        miss['shooter'] = roster[playerRaw]

    return miss


def parseShot(play, game):

    shot = play
    playText = play["playText"]

    # We don't need the type (because it is a shot) or the playText anymore
    shot.pop('type', None)
    shot.pop('playText', None)

    # Run this gnarly regex
    regexString = '([A-Z.]+)'\
                  '\s([A-Z]+)'\
                  '\s-\s[#]?'\
                  '([0-9]+)'\
                  '.*?,\s'\
                  '([A-Za-z\-]+)'\
                  '.*?'\
                  '([0-9]+)'\
                  '\sft\.'

    m = re.search(regexString, playText)

    if(m):
        teamRaw = m.group(1)
        playerRaw = m.group(3)
        shotTypeRaw = m.group(4)
        distanceRaw = int(m.group(5))

        shot['team'] = utils.getTeamByAbv(teamRaw, game['season'])
        shot['type'] = shotTypeRaw
        shot['distance'] = distanceRaw

        # Assin players to the stat (goal scored and assists)
        # Check if the goal was scored by the home or the road team
        # Also, change the name of the 'oniceHome and onIce against' to
        # for and against
        if (shot['team']['name'] == game['home']['team']['name']):
            roster = game['home']['players']
            shot['onIceFor'] = shot['homeOnIce']
            shot['onIceAgainst'] = shot['awayOnIce']
        else:
            roster = game['away']['players']
            shot['onIceFor'] = shot['awayOnIce']
            shot['onIceAgainst'] = shot['homeOnIce']

        shot.pop('homeOnIce', None)
        shot.pop('awayOnIce', None)

        shot['shooter'] = roster[playerRaw]

    return shot


def parseGoal(play, game):

    goal = play
    playText = play["playText"]

    # We don't need the type (because it is a goal) or the playText anymore
    goal.pop('type', None)
    goal.pop('playText', None)

    # Run this gnarly regex
    regexString = '([A-Z\.]+)'\
                  '\s[\#]?'\
                  '([0-9]+)'\
                  '.*?\s'\
                  '([A-Za-z\-]+)'\
                  ',.*?([0-9]+)'\
                  '\sft\.'

    m = re.search(regexString, playText)

    # Put things in their boxes
    if(m):
        teamRaw = m.group(1)
        playerRaw = m.group(2)
        shotTypeRaw = m.group(3)
        distanceRaw = int(m.group(4))

    # Sometimes the main one fails... so try this simple one instead
    if(not m):
        regexString = '([A-Z\.]+)\s[\#]?([0-9]+).*?([0-9]+)\sft\.'
        m = re.search(regexString, playText)

        if(m):
            teamRaw = m.group(1)
            playerRaw = m.group(2)
            distanceRaw = int(m.group(3))
            shotTypeRaw = ""

    # Sometimes even that fails. Maybe there is no distance for for reason
    if(not m):

        regexString = '([A-Z\.]+)\s[\#]?([0-9]+)'
        m = re.search(regexString, playText)

        if(m):
            teamRaw = m.group(1)
            playerRaw = m.group(2)
            distanceRaw = 0
            shotTypeRaw = ""

    # a match was made
    if(m):

        # Assign parsed values to dict
        goal['team'] = utils.getTeamByAbv(teamRaw, game['season'])

        # Shot type can be blank. Only add if not blank
        if(shotTypeRaw != ""):
            goal['type'] = shotTypeRaw

        goal['distance'] = distanceRaw

        # Find the assists for the goals
        assistsRaw = []

        # Some goals have assists
        if("Assists:" in playText):

            # Only the assists part
            assistText = playText.split("Assists:")[1].strip()

            # If there is a ; it splits the assists
            if(";" in assistText):
                assists = assistText.split(";")
            else:
                assists = [(assistText)]

            # Parse each assist and add to the list of assists on
            # a goal (player number)
            for assist in assists:
                m = re.search("\#([0-9]*)", assist)
                if(m):
                    assistsRaw.append(m.group(1))

        # Assin players to the stat (goal scored and assists)
        # Check if the goal was scored by the home or the road team
        # Also, change the name of the 'oniceHome and onIce against' to
        # for and against
        if (goal['team']['name'] == game['home']['team']['name']):
            roster = game['home']['players']
            goal['onIceFor'] = goal['homeOnIce']
            goal['onIceAgainst'] = goal['awayOnIce']
        else:
            roster = game['away']['players']
            goal['onIceFor'] = goal['awayOnIce']
            goal['onIceAgainst'] = goal['homeOnIce']

        goal.pop('homeOnIce', None)
        goal.pop('awayOnIce', None)

        # Assign the goal scorer (call it shooter to keep with
        # shots and shot attemps)
        goal['shooter'] = roster[playerRaw]

        # Assign the assist getters
        goal['assists'] = []
        for a in assistsRaw:
            goal['assists'].append(roster[a])

    return goal


def parsePlay(playHtml, play, game):

    # Get the parts of the play
    playParts = playHtml.findAll('td', recursive=False)

    # Play id is the first field
    play["_id"] = playParts[0].getText().strip()

    # Period is the 2nd td
    periodRaw = playParts[1].getText().strip()

    # Put in period 1 if there is no period
    if(periodRaw == ''):
        periodRaw = '1'
    play['period'] = int(periodRaw)

    # Strength (even, powerplay, or shorthanded)
    strength = playParts[2].getText().strip()

    # Not all plays include a strength
    if(strength != ""):
        play['strength'] = strength

    # Parse the time of the play.
    # The 4th element has time since the start of the period a break <br>
    # Then the time left in the period
    # Convert the time into seconds since the start of the game.
    # Shootout events will not have a time
    rawTime = str(playParts[3].getText().strip())
    if(rawTime == ''):
        timeElapasedRaw = "00:00"
    else:
        colonPos = rawTime.index(":")
        timeElapasedRaw = rawTime[:colonPos + 3]

    # Sometimes a - sneaks in. When this happens the time is bad, so just
    # don't use it
    if(play['period'] < 5 and '-' not in timeElapasedRaw):
        play['time'] = (int(timeElapasedRaw.split(':')[0]) * 60)\
            + ((play['period']) - 1) * 1200\
            + int(timeElapasedRaw.split(':')[1])
    else:
        play['time'] = 3901

    # Get the play type
    play['type'] = playParts[4].getText().strip()

    # Get the play string (needs to be parsed somewhere else)
    play['playText'] = playParts[5].getText().strip()

    homeOnIceParts = playParts[7].findAll('font')

    play['homeOnIce'] = []
    play['awayOnIce'] = []

    for part in homeOnIceParts:

        playerNum = part.getText().strip()
        if(playerNum != ""):
            play['homeOnIce'].append(game['home']['players'][playerNum])

    awayOnIce = playParts[6].findAll('font')

    for part in awayOnIce:

        playerNum = part.getText().strip()
        if(playerNum != ""):
            play['awayOnIce'].append(game['away']['players'][playerNum])

    return play


def parseSummary(soup, game):

    # Everything is stored in tds. It is kinda just hunting for the correct
    # indexes and parsing to get the data
    tds = soup.find("table").findAll('td')

    # For both the home and away teams, the name of the teams is always with
    # the game number, (Game x Home/Away x) we don't need so search a destroy
    # The is also a Match floating around sometimes. Kill this to.
    homeTeamText = tds[23].getText().strip()
    gameIndex = homeTeamText.index('Game')

    homeTeam = homeTeamText[:gameIndex]

    if('Match' in homeTeam):
        gameIndex = homeTeam.index('Match')
        homeTeam = homeTeam[:gameIndex]

    game['home']['team'] = utils.getTeamByName(homeTeam, game['season'])

    regexString = '.*?([0-9]+).*?([0-9])'
    m = re.search(regexString, homeTeamText)

    if(m):
        game['home']['number'] = int(m.group(1))

    awayTeamText = tds[7].getText().strip()
    gameIndex = awayTeamText.index('Game')
    awayTeam = awayTeamText[:gameIndex]

    if('Match' in awayTeam):
        gameIndex = awayTeam.index('Match')
        awayTeam = awayTeam[:gameIndex]

    game['away']['team'] = utils.getTeamByName(awayTeam, game['season'])

    regexString = '.*?([0-9]+).*?([0-9])'
    m = re.search(regexString, awayTeamText)

    if(m):
        game['away']['number'] = int(m.group(1))

    dateRaw = tds[12].getText().strip()

    game['date'] = datetime.strptime(dateRaw, "%A, %B %d, %Y")

    return game


def scrapeRoster(htmlFile, game):

    # Parse the file with BeautifulSoup
    r = open(htmlFile, 'r').read()
    r = r.decode('cp1252')
    soup = BeautifulSoup(r, "html.parser")

    # make sure the dicts exist in the game
    if ('home' not in game):
        game['home'] = dict()

    if ('away' not in game):
        game['away'] = dict()

    # Get the rosters. They will be in td with class border
    teamRoosters = soup.find_all("td", class_="border")

    # Roster for home will be the 4th table found
    game['home']['players'] = parsePlayers(teamRoosters[3])

    # Also get the scratches and merge
    homeScratches = parsePlayers(teamRoosters[5])
    game['home']['players'].update(homeScratches)

    # Roster for away will be the 3rd table found
    game['away']['players'] = parsePlayers(teamRoosters[2])

    # Also get the scratches and merge
    awayScratches = parsePlayers(teamRoosters[4])
    game['away']['players'].update(awayScratches)

    return game


def parsePlayers(soup):

    rosterDict = dict()

    players = soup.find_all("tr")[1:]

    for player in players:

        playerDict = dict()

        fields = player.find_all("td")

        playerDict['number'] = fields[0].get_text().strip()
        playerDict['pos'] = fields[1].get_text().strip()

        # Name contains if a player is a captian with a (A) or (C).
        # Remove from name and add a captian field
        name = fields[2].get_text()

        if "(C)" in name:
            name = name.replace("(C)", "")
            playerDict['cap'] = 'c'

        if "(A)" in name:
            name = name.replace("(A)", "")
            playerDict['cap'] = 'A'

        playerDict['name'] = name.strip()

        # Add the player to the roster using number as the key
        rosterDict[playerDict['number']] = playerDict

    return rosterDict


# Run the script
if __name__ == "__main__":
    main()
