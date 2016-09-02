import scrape

'''game = dict()

game = scrape.scrapeRoster("c:\\Users\\nicka\\dev\\moneypuck\\rawHtml\\rosters\\20072008_774.HTM",game)

game = scrape.scrapePlayByPlay("c:\\Users\\nicka\\dev\\moneypuck\\rawHtml\\playbyplay\\20072008_774.HTM",game)'''

from pymongo import MongoClient

def main():
    client = MongoClient()
    db = client.moneypuck
    games = db['games']


    goalsRegScoredPipeline = [{"$match": {"_id": "20074"+"h"}},
                        {"$project": {"_id": 0,"results":1,"for.stats":1,"against.stats":1}}]
    
    print list(games.aggregate(goalsRegScoredPipeline))

#Run the script
if __name__ == "__main__":
    main()
