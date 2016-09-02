# Data Structure for a game

## Concepts

- Each item is a collection of stats and events from a game from the point of view of a single team. This means that for each game in real life there are 2 game records (one for the home team and one for the away team).

- The stats and events are split between 'for' and 'against'. Any 'for' stat or event is something about the team whos game record it is, and against is the team they are playing

- A lot of the data is redundant and this is to optimize retrieval.

## Access

Query the data using json.

Use a post request to /json/game/<season>/<team abv>/<game number> and the game data will be sent.

## Structure

A lot of the sub dicts and sub collections are redundant (like team, player etc), so I will treat them as separate objects and describe once.

game<dict> The main game object
  - id<string> The id of the game. The format is <season><gameNum><h/a>.
  - date<datestring> The date of the game.
  - home<int> 1 == the for team is home, 0 is away.
  - results<dict>
      - win<int> 1 for a win, 0 for a loss.
      - points<int> How many points were earned.
      - type<string> What type of final score was it? REG/OT/SO.
      - gameLength<int> The length of the game in seconds.
  - for<dict> Stats and events related to the 'for' team.
      - number<int> The game number in the season for team.
      - team<team> The for team.
      - players<playerList> The roster for the for team
      - stats<dict> Some game stats for the team.
          - goals<statSummary> Summary of goals scored.
          - shots<statSummary> Summary of shots taken.
          - misses<statSummary> Summary of misses.
          - attempts<statSummary> Sum of Goals, shots, misses, blockedshots.
      - goals<eventsList> All the goals scored.
      - shots<eventList> All the shots taken.
      - misses<eventList> All the misses.
      - attempts<eventList> All the goals+shots+misses+blocks taken.

### Sub Dicts and sub collections

team<dict>
  - name<string> The name of a team.
  - abv<sting> The team abbreviation.
  - div<string> The division of the team.
  - conference<string> The conference of the team.

playerList<list> A list of players.
  - player<player> A player (there are many of these)

player<dict> A player.
  - name<string> Name of player.
  - number<int> Player number.
  - pos<string> Position of player. (C,LW,RW,D,G)
  - cap<string> Capitancy of player (blank,C or A)

statSummary<dict> A summary of stats for a game.
  - for<statsByPeriod> The for stat per/period.
  - against<statsByPeriod> The against stat per/period.
  - ratio<statsByPeriod> The ratio of for stats vs against stat per/period.
  - dif<statsByPeriod> The dif (for - against) of the stat per/period

statsByPeriod<dict> Stats broken down by period.
  - 1<int> Stat in 1rst period.
  - 2<int> Stat in 2nd period.
  - 3<int> Stat in 3rd period.
  - 4<int> Stat in OT period.
  - 5<int> Stat in SO period.
  - reg<int> Stat in regulation time (periods 1,2,3).
  - total<int> Stat total through periods (1,2,3 and OT).

eventList<list> List of events. Events are things like goals and attempts.
  - event<dict> An event. There will be many of these in an eventList
      - time<int> Time of event.
      - period<int> Period of event.
      - strength<string> Player strength at time of event (EV,PP,PK).
      - type<string> Type of an event (goal,attempt, etc..)
      - onIceFor<playerList> List of players on the ice against.
      - onIceAgainst<playerList> List of players on the ice against.
      - shooter<player> Players who took the shot (where applicable).
      - stats<dict> Stats at time of event.
          - for<dict> For stats at time of event.
              -goals<int> Goals for at time of event.
              -shots<int> Shots for at time of event.
              -misses<int> Misses for at time of event.
              -attempts<int> Attempts for at time of event.
          - against<dict> Against stats at time of event.
              -goals<int> Goals against at time of event.
              -shots<int> Shots against at time of event.
              -misses<int> Misses against at time of event.
              -attempts<int> Attempts against at time of event.
          - dif<dict> Dif of stats (for-against) at time of event.
              -goals<int> Goal dif at time of event.
              -shots<int> Shot dif at time of event.
              -misses<int> Miss dif at time of event.
              -attempts<int> Attempt dif against at time of event.
          - dif<dict> Ratio of stats (for/(for+against)) at time of event.
              -goals<int> Goal ratio at time of event.
              -shots<int> Shot ratio at time of event.
              -misses<int> Miss ratio at time of event.
              -attempts<int> Attempt ratio against at time of event.
