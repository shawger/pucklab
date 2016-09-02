from bs4 import BeautifulSoup
from pymongo import MongoClient
import os
from datetime import datetime

#Some parameters
START_YEAR = 2007
END_YEAR = 2007
GAMES_PER_YEAR = 1230
GAMES_LOCKOUT = 720

def main():

    loadMongo()


def loadMongo():

    client = MongoClient()

    db = client.moneypuck

    games = db['games']

    games.delete_many({})

    #parse the games

    currentYear = START_YEAR
    while(currentYear <= START_YEAR):

        if(currentYear == 2012):
            gamesThisYear = GAMES_LOCKOUT
        else:
            gamesThisYear = GAMES_PER_YEAR

        i = 1
        while(i <= gamesThisYear):

            game = parseGame(currentYear,i)

            #reshape the game
            #for everygame there should be 2 records. One for the home team and
            #on for the away team.
            home = game['home']
            away = game['away']

            game.pop("home", None)
            game.pop("away", None)

            homeGame = dict(game);
            homeGame['for'] = home
            homeGame['against'] = away
            homeGame['home'] = 1
            homeGame['_id'] = homeGame['_id'] + "h"

            awayGame = dict(game);
            awayGame['for'] = away
            awayGame['against'] = home
            awayGame['home'] = 0
            awayGame['_id'] = awayGame['_id'] + "a"


            games.insert(homeGame)
            games.insert(awayGame)

            i += 1

        currentYear += 1

    game = parseGame(2007,1)


def parseGame(season,gameNum):

    #Figure out the file names
    rootPath = os.path.dirname(os.path.realpath(__file__))
    rootPath = rootPath.replace("\\scraping","")
    fileName = str(season) + str(season+1) + "_" + str(gameNum) + ".HTM"
    sumFile = rootPath + "\\rawHtml\\summaries\\" + fileName
    rosterFile = rootPath + "\\rawHtml\\rosters\\" + fileName

    #Create a new game dict and fill it up
    game = dict()

    #give the game an id (seaon+gamenum will due)
    game["_id"] = str(season) + str(gameNum)
    print game["_id"]

    game = parseSummary(game,sumFile)
    return game

def parseSummary(game,htmlFile):

    r = open(htmlFile,'r').read()
    r = r.decode('cp1252')

    soup = BeautifulSoup(r,"html.parser")

    #two important subdocs
    game['home'] = dict()
    game['away'] = dict()

    #Get the main table
    mainTable = soup.find("table", {"id": "MainTable"})
    mainTableRows = soup.findAll('tr')

    #Main table is split into several tr's
    #1. Summary info
    summarySoup = mainTableRows[0]
    #2. nothing
    #3. Scoring Summary heading (don't need)
    #4. Scoring Summary
    scorringSoup = mainTableRows[3]
    #5. nothing
    #6. Team names (redundant)
    #7. Penalty Summary
    penaltygSoup = mainTableRows[6]
    #8. nothing
    #9. By period
    byPeriodSoup = mainTableRows[8]
    #10. Nothing
    #11. Power plays
    powerPlaySoup = mainTableRows[10]
    #12. Even strength
    evenStregthSoup = mainTableRows[11]
    #13. nothing
    #14. Goalie summary heading (useless)
    #15. Goalie Summary
    goalieSoup = mainTableRows[14]
    #16. nothing
    #17. Officials and 3 stars
    theRestSoup = mainTableRows[17]

    game = parseSummarySoup(summarySoup,game)

    return game

def parseSummarySoup(soup,game):

    #Everything is stored in tds. It is kinda just hunting for the correct
    #indexes and parsing to get the data
    tds = soup.find("table").findAll('td')

    #For both the home and away teams, the name of the teams is always with
    #the game number, (Game x Home/Away x) we don't need so search a destroy
    #The is also a Match floating around sometimes. Kill this to.
    homeTeam = tds[23].getText().strip()
    gameIndex = homeTeam.index('Game')
    game['home']['name'] = homeTeam[:gameIndex]

    if('Match' in game['home']['name']):
        gameIndex = game['home']['name'].index('Match')
        game['home']['name'] = game['home']['name'][:gameIndex]

    awayTeam = tds[7].getText().strip()
    gameIndex = awayTeam.index('Game')
    game['away']['name'] = awayTeam[:gameIndex]

    if('Match' in game['away']['name']):
        gameIndex = game['away']['name'].index('Match')
        game['away']['name'] = game['away']['name'][:gameIndex]

    #Scores are easy
    game['home']['score'] = int(tds[21].getText().strip())
    game['away']['score'] = int(tds[5].getText().strip())

    dateRaw = tds[12].getText().strip()

    game['date'] = datetime.strptime(dateRaw,"%A, %B %d, %Y")

    '''i = 0
    for td in tds:

        if(td.getText() != ""):

            print str(i) + ": " + td.getText().strip()

        i += 1'''

    return game


def parseRoster(htmlFile):

    r = open(htmlFile,'r').read()
    r = r.decode('cp1252')

    soup = BeautifulSoup(r).encode("utf-8")

    home = dict()
    away = dict()

    #Get team names
    teamHeadings = soup.find_all("td", class_="teamHeading")

    home['name'] = teamHeadings[1].get_text()
    away['name'] = teamHeadings[0].get_text()

    #Get the rosters. They will be in td with class border
    teamRoosters = soup.find_all("td",class_="border")

    #Roster for home will be the 4th table found
    home['players'] = parsePlayers(teamRoosters[3])

    #Roster for away will be the 3rd table found
    away['players'] = parsePlayers(teamRoosters[2])

def parsePlayers(soup):

    rosterDict = dict()

    players = soup.find_all("tr")[1:]

    for player in players:

        playerDict = dict()

        fields = player.find_all("td")

        playerDict['number'] = fields[0].get_text().strip()
        playerDict['pos'] = fields[1].get_text().strip()

        #Name contains if a player is a captian with a (A) or (C).
        #Remove from name and add a captian field
        name = fields[2].get_text()

        if "(C)" in name:
            name = name.replace("(C)","")
            playerDict['cap'] = 'c'

        if "(A)" in name:
            name = name.replace("(A)","")
            playerDict['cap'] = 'A'

        playerDict['name'] = name.strip()

        #Add the player to the roster using number as the key
        rosterDict[playerDict['number']] = playerDict

    return rosterDict

#Run the script
if __name__ == "__main__":
    main()
