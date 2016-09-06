from pymongo import MongoClient

STATS = ["goals",
         "shots",
         "attempts"]

forAgainst = ["for",
              "against"]


def main():

    # Connect to the db
    client = MongoClient()
    db = client.pucklab
    games = db['games']

    # Go through all the games

    gameCursor = games.find()

    for game in gameCursor:

        # First do total stats
        (results, forStats, awayStats, combinedRatio, combinedDif) = gameStats(
            game["_id"], games)

        games.update_one({"_id": game["_id"]},
                         {"$set": {"results": results,
                                   "for.stats": forStats,
                                   "against.stats": awayStats,
                                   "ratio": combinedRatio,
                                   "dif": combinedDif}})

        for statType in STATS:

            statForPl = statPl(game["_id"], "for", statType)
            statFor = games.aggregate(statForPl)

            for stat in statFor:

                id = str(stat['for'][statType]['_id'])
                time = stat['for'][statType]['time']

                stats = currentStats(game["_id"], games, time)

                field = "for." + statType + "._id"
                fieldSelector = "for." + statType + ".$.stats"

                games.update({"_id": game["_id"], field: id},
                             {"$set": {fieldSelector: stats}})

            statAgainstPl = statPl(game["_id"], "against", statType)
            statAgainst = games.aggregate(statAgainstPl)

            for stat in statAgainst:

                id = str(stat['against'][statType]['_id'])
                time = stat['against'][statType]['time']

                stats = currentStats(game["_id"], games, time)

                field = "against." + statType + "._id"
                fieldSelector = "against." + statType + ".$.stats"

                games.update({"_id": game["_id"], field: id},
                             {"$set": {fieldSelector: stats}})


# Fills in some important stats at a certain time


def currentStats(gameId, db, time):

    stats = dict()
    stats['for'] = dict()
    stats['against'] = dict()
    stats['ratio'] = dict()
    stats['dif'] = dict()

    for stat in STATS:

        forPl = countStatAtTime(gameId, "for", stat, time)
        forResults = db.aggregate(forPl)

        # There should only be one result (with a count)
        for result in forResults:
            stats['for'][stat] = result['count']

        # There was no search results, so nothing was found
        # That means it is a big fat 0
        if stat not in stats['for']:
            stats['for'][stat] = 0

        againstPl = countStatAtTime(gameId, "against", stat, time)
        againstResults = db.aggregate(againstPl)

        # There should only be one result (with a count)
        for result in againstResults:
            stats['against'][stat] = result['count']

        # There was no search results, so nothing was found
        # That means it is a big fat 0
        if stat not in stats['against']:
            stats['against'][stat] = 0

        # Determine the stat ratio
        if(stats['for'][stat] + stats['against'][stat] == 0):
            stats['ratio'][stat] = 0
        else:
            stats['ratio'][stat] = float(stats['for'][stat]) / \
                (float(stats['for'][stat]) +
                 float(stats['against'][stat]))

        # Determine the stat dif
        stats['dif'][stat] =  stats['for'][stat] - stats['against'][stat]

        if(stat == 'goals'):

            start = int(time/1200)

            end = time

            forPl = countStatAtTimePeriod(gameId, "for", "attempts",start,end)
            forResults = db.aggregate(forPl)

            forCount = 0
            results = list(forResults)
            if(len(results) > 0):
                forCount = results[0]['count']

            againtPl = countStatAtTimePeriod(gameId, "against", "attempts",start,end)
            againtResults = db.aggregate(againtPl)

            againstCount = 0
            results = list(againtResults)
            if(len(results) > 0):
                againstCount = results[0]['count']

            print forCount - againstCount

            stats['dif']['currentAttempts'] = forCount - againstCount

    return stats


def gameStats(gameId, db):

    results = dict()
    forStats = dict()
    againstStats = dict()
    combinedRatio = dict()
    combinedDif = dict()

    for stat in STATS:

        forPl = statInGamePipeline(gameId, "for", stat)
        statForByPeriod = db.aggregate(forPl)
        forStats[stat] = totalStats(statForByPeriod)

        againstPl = statInGamePipeline(gameId, "against", stat)
        statAgainstByPeriod = db.aggregate(againstPl)
        againstStats[stat] = totalStats(statAgainstByPeriod)

        # Determine the stat ratio
        combinedRatio[stat] = combineStatsRatio(forStats[stat],
                                                againstStats[stat])

        # Determine the stat dif
        combinedDif[stat] = combineStatsDif(forStats[stat],
                                            againstStats[stat])

    # Determine a win loss
    if (combinedDif['goals']['reg'] > 0):
        # Its a regulation win
        results['win'] = 1
        results['points'] = 2
        results['type'] = 'REG'
        results['gameLength'] = 3600
    elif(combinedDif['goals']['reg'] < 0):
        # Its a regulation loss
        results['win'] = 0
        results['points'] = 0
        results['type'] = 'REG'
        results['gameLength'] = 3600
    elif (combinedDif['goals']['total'] > 0):
        # Its an OT win
        results['win'] = 1
        results['points'] = 2
        results['type'] = 'OT'
        results['gameLength'] = 3900
    elif (combinedDif['goals']['total'] < 0):
        # Its an OT loss
        results['win'] = 0
        results['points'] = 1
        results['type'] = 'OT'
        results['gameLength'] = 3900
    elif (combinedDif['goals']['5'] > 0):
        # Its an SO win
        results['win'] = 1
        results['points'] = 2
        results['type'] = 'SO'
        results['gameLength'] = 3900
    else:
        # It's an SO loss
        results['win'] = 0
        results['points'] = 1
        results['type'] = 'SO'
        results['gameLength'] = 3900

    return [results, forStats, againstStats, combinedRatio, combinedDif]

# Takes two stats of the same kind and make a ratio from them


def combineStatsRatio(stat1, stat2):

    comb = dict()

    for i in stat1:

        if i in stat2:

            if(stat1[i] == 0 and stat2[i] == 0):
                comb[i] = 0
            else:
                comb[i] = stat1[i] / (stat1[i] + stat2[i])

    return comb

def combineStatsDif(stat1, stat2):

    comb = dict()

    for i in stat1:

        if i in stat2:

            comb[i] = stat1[i] - stat2[i]

    return comb

# Create a mongodb pipeline for retrieving  with certain stats by period

def statInGamePipeline(id, forAgainst, stat):

    fieldName = forAgainst + "." + stat
    selector = "$" + fieldName

    statsPL = [{"$match": {"_id": id}},
               {"$unwind": selector},
               {"$group": {"_id": selector + ".period",
                           "total": {"$sum": 1}}}]

    return statsPL


def statPl(id, forAgainst, stat):

    fieldName = forAgainst + "." + stat
    selector = "$" + fieldName

    statsPL = [{"$match": {"_id": id}},
               {"$unwind": selector},
               {"$project": {"_id": 0,
                             fieldName: 1}}]

    return statsPL


def countStatAtTime(id, forAgainst, stat, time=3900):

    fieldName = forAgainst + "." + stat
    selector = "$" + fieldName

    statsPL = [{"$match": {"_id": id}},
               {"$unwind": selector},
               {"$project": {"_id": 0,
                             fieldName: 1}},
               {"$match": {fieldName + ".time": {"$ne": 0}}},
               {"$match": {fieldName + ".time": {"$lte": time}}},
               {"$group": {"_id": "null", "count": {"$sum": 1}}}]

    return statsPL

def countStatAtTimePeriod(id, forAgainst, stat, start, end):

    fieldName = forAgainst + "." + stat
    selector = "$" + fieldName

    statsPL = [{"$match": {"_id": id}},
               {"$unwind": selector},
               {"$project": {"_id": 0,
                             fieldName: 1}},
               {"$match": {fieldName + ".time": {"$gte": start}}},
               {"$match": {fieldName + ".time": {"$lte": end}}},
               {"$group": {"_id": "null", "count": {"$sum": 1}}}]

    return statsPL



# Parse and store a document containing the counts of different stats
# per period
def totalStats(statPerPeriod):

    stat = dict()

    stat['1'] = 0
    stat['2'] = 0
    stat['3'] = 0
    stat['4'] = 0
    stat['5'] = 0

    for period in statPerPeriod:

        stat[str(period['_id'])] = period['total']

    stat['reg'] = stat['1'] + stat['2'] + stat['3']

    stat['total'] = stat['reg'] + stat['4']

    return stat


# Run the script
if __name__ == "__main__":
    main()
