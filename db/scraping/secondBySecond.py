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

    gameCursor = games.find()

    for game in gameCursor:

    	print game["_id"]

    	#Create the document for snapshots

    	snapshots = dict()

    	second = 0
    	while(second <= game['results']['gameLength']):


    		gameId = game["_id"]

    		snapShot = dict()
    		snapShot['second'] = second
    		snapShot['for'] = dict()
    		snapShot['forEvents'] = dict()
    		snapShot['against'] = dict()
    		snapShot['againstEvents'] = dict()
    		snapShot['dif'] = dict()
    		snapShot['ratio'] = dict()
  
    		for stat in STATS:

    			#The get the pipeline for find the count of a stat
    			#Before or equal to a certian time
    			forPl = countStatAtTime(gameId, "for", stat, second)

    			#Run the query
        		forResults = list(games.aggregate(forPl))

        		#If the query gets a match it will have 1 row
        		#countaining a 'count' field
        		#If the query does not get a match then we know
        		#the stat count is 0
        		snapShot['for'][stat] = 0

        		if(len(forResults) != 0):
        			snapShot['for'][stat] = forResults[0]['count']

        		#The get the pipeline for find the count of a stat
    			#Before or equal to a certian time
    			againstPl = countStatAtTime(gameId, "against", stat, second)

    			#Run the query
        		againstResults = list(games.aggregate(againstPl))

        		#If the query gets a match it will have 1 row
        		#countaining a 'count' field
        		#If the query does not get a match then we know
        		#the stat count is 0
        		snapShot['against'][stat] = 0

        		if(len(againstResults) != 0):
        			snapShot['against'][stat] = againstResults[0]['count']

        		#Dif is the for stat - against stat
        		snapShot['dif'][stat] = snapShot['for'][stat] - snapShot['against'][stat]

        		#ratio is the average amount of the stat for the team
        		if(snapShot['for'][stat] + snapShot['against'][stat] == 0):
        			snapShot['ratio'][stat] = 0
        		else:
        			snapShot['ratio'][stat] = float(snapShot['for'][stat])/\
        									   (float(snapShot['for'][stat]) +\
        									   float(snapShot['against'][stat]))


        		#Query if something happened of this stat type at this second
        		forEventPl = eventAtTime(gameId, "for", stat, second)

        		#Run the query
        		forResults = list(games.aggregate(forEventPl))

        		#Found an event (there should only be one event of a type per second)
        		if(len(forResults) != 0):

        			snapShot['forEvents'][stat] = forResults[0]
        			snapShot['forEvents'][stat]['exists'] = 1

        		else:
        			snapShot['forEvents'][stat] = dict()
        			snapShot['forEvents'][stat]['exists'] = 0

        		#Query if something happened of this stat type at this second
        		againstEventPl = eventAtTime(gameId, "against", stat, second)

        		#Run the query
        		againstResults = list(games.aggregate(againstEventPl))

        		#Found an event (there should only be one event of a type per second)
        		if(len(againstResults) != 0):

        			snapShot['againstEvents'][stat] = againstResults[0]
        			snapShot['againstEvents'][stat]['exists'] = 1

        		else:
        			snapShot['againstEvents'][stat] = dict()
        			snapShot['againstEvents'][stat]['exists'] = 0


        	snapshots[str(second)] = snapShot
    		second += 1

    	games.update({"_id": game["_id"]},
                             {"$set": {"ss": snapshots}})



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

def eventAtTime(id, forAgainst, stat, time):
	
	fieldName = forAgainst + "." + stat
	selector = "$" + fieldName

	eventPL = [{"$match": {"_id": id}},
               {"$unwind": selector},
               {"$project": {"_id": 0,
                             fieldName: 1}},
               {"$match": {fieldName + ".time": {"$eq": time}}}]

   	return eventPL

if __name__ == "__main__":
    main()