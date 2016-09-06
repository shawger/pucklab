# Game App Readme

Nick Shaw
2016-09-02

This app was developed (in part) for the Udacity Data Analyst Nano Degree, Project 6.

## Summary

The game app on PuckLab (my website) is designed to show a visual summary of a hockey game. Generally, when you want to look at what happened in a hockey game you can look at box scores, which tell you things like the final score, total shots, and how many penalties there are. What it doesn't tell you is the 'flow' of the game (did a team play good and just fall apart in the 3rd or maybe they played good but the opposition just got some lucky goals.) and my app shows that by plotting the difference between attempts (shots, goals, etc) of the teams playing.

## Design

### Overall Page Design

Clearly display the teams that are playing, the flow of the game and some key game statistics.

For each game there are 2 teams. A for team and an against team. In general, keep the for team on the left and the against team on the right. Color key aspects on the page by the color as well.

The graphics are designed so that hockey fans should be able to understand the graphics without any additional information. Info boxes are available, so non-hockey fans should also be able to figure out what is going on.

This is part of a larger project that will show this data for every NHL game. I am not covering how that works here, but for the page design it was important to make sure the graphics work for any regular season hockey game.

#### Order of Elements

The page has the following elements:

- Title
- Game Information (who played, what was the score, where was the game played)
- Game Flow Chart
- Game Stats Chart

For title, clearly that goes first.

Next I went with Game Information, because before looking at the graphics the users will need to know what game, between what teams they are looking at.

Next I went with Game Flow Chart. At first I had Game Stats Chart, but I decided that the Game Flow chart should be higher because it is the focus of the page and the Game Stats Chart is supplementary information.

### Game Flow Chart

The main graphic on the page.

Show a line graph that represents the flow of a hockey game.

Plot (and connect) each attempt by the 'for' team and 'against' team. Each attempt will be plotted by the time of the attempt and by the attempt difference between the 'for' team and the 'against' team at the time of the attempt.

- The x axis shows the attempt difference between the 'for' team and the 'against' team at the time of the attempt. The range should be the absolute value of the max difference at any time. This way the dif of 0 is right in the middle.

- The y axis is the game time in seconds.

Features:

 - Display goals on the chart as circles offset from the line. Goals should point toward the team that scored the goal and be colored by the team that scored the goal.

 - When a attempt or goal is moused over, show a tool tip showing details of the attempt or goal.

 - Allow the user to zoom into different periods. As part of a user request, I made it so when a period is zoomed, the chart shifts so the initial difference in attempts is always 0 at the start of a period.

#### Design Choices

**Chart Type** A line chart was chosen because it shows the trend in attempts in a game over the length of a game. Points were added to the chart to show exactly when events (attempts) occurred and what they were (goals, shots, etc..).

**Y Axis** I decided to use the y axis for time because time goes from 0-3600 while the attempts range from about 40 to -40. To better show this information it made more sense to give more room to time, and on webpages there is more room vertically (this is probably arguable, but the trend in web design seems to be pages have much bigger heights than widths). Having the y axis for time also lets me split the page in 2 halfs. Left for the for team and right for the against team.

In addition, if time was son the y axis than one team one be above the other, and visually this would make it seem like one team was more important that the other team,

**X Axis** I decided to have 0 (meaning attempts are even) run right down the middle of the page so it's easy to tell what team has the advantage when the line goes either side of center.

**Goals** Goals are important game events so I gave them special treatment. By putting the larger circles on the graph it is easy to see when the goals happened. I used orientation and color to show who scored the goals.

**Axis Ticks and Tooltips** I choose to keep axis ticks at a minimum so the graph didn't get busy. If a user wants some specific information on a goal or attempt, they can use a tooltip to find out more information.

**Attempt Difference Median Line** I added lines to show the NHL median difference between attempts when a goal is scored, to give the graph some reference to an 'average' NHL game.

### Game Stat Summary Chart

My main objective was building the game flow chart, but having summary stats (like how many total goals were scored) is also useful. Since I am learning and working with d3.js anyway, it made sense to show the game stats visually.

The idea is to show the stats for each team side by side for a quick comparison. For each stat being compared, plot a bar graph showing how the team did (relative to the other team).

Features:

- Color bars based on team color.
- Allow user to zoom to a period, and update the bars to only show data from that period.
- For the stats, show the numbers along with the bars.
- Have the bars for the 'for' and 'against' team be beside each other and go the opposite direction.

Stats To Include:

- Goals
- Shots
- Attempts

#### Design Choices

**Chart Type** I went with bar graphs because they make it easy to compare stats side by side.

**Chart Layout** In keeping with the theme of the page, I put stats for one team left of center and stats for the other team right of center. This way the user can easily go down the page and see what stats/events/scores/advantage is for what team.

**Chart Axis** There are really 2 bar charts. One for the for team and one for the against team. The for team goes to the left and the against team goes to the left.

I went with the category down the y Axis so I could show the stats for both teams beside each other.

**Scaling** All stats are scaled 0-1 (0-100%) and graphed. This is done so stats for a team can be compared (eg how did a teams goals compare to the teams attempts)

### Data and Webserver

For testing and assignment submission I manually edited the html file, moved around the scripts and style sheets, and put the json data directly into the game.js file so it can be used without a webserver.

For the test app I also included a JSON file for reference (data.json) and the code book for the JSON (data.md),

For development and final deployment I used a python Flask webserver and MongoDB for the data. For that whole project go (here)[https://github.com/shawger/pucklab]

Also in the github project are my scripts for downloading the data from the NHL page, parsing the data and loading it into the mongodb.

See the readme.md on the project page for more information on the scraping, backend tools, and frontend tools.

## Feedback

4 people were sent a test version of the page and asked for some comments. Here is a summary of the comments:

Karo (Scientist):

- Not sure what 'game flow' was.
- Some dots of the graph were empty, others were filled.
- Links to NHL page.
- (Not in response, but verbally said) Confusing about what the graphs are supposed to be.

Dan (Hockey Fan):

- Hard to see the tooltops on the graph.
- When zooming into a period, have the graph re-center (start attempt dif at 0).
- Highlight anomalies.
- Show powerplays.

Bev (Teacher):

 - She didn't understand the graph at all. She is not a hockey fan.

Fixed/Added based on comments:

- Added labels to axis, more tooltips and info buttons to describe what is going on.
- When zooming to a period the flow chart re-centers to start the period at 0 attempt difference.
- Made sure all the dots were empty and fixed bug that caused dots to use the wrong symbol when zooming.
- Made dots on flow graph slightly bigger when looking at the entire game, and even bigger when zooming in.

Not Added:

- Anomaly highlighting. Would be pretty cool, but my main goal is to show some graphs and adding this would be quite the project and outside the scope of the assignment.
- Links to NHL players. Also useful but once again outside the scope of this assignment.
- Show powerplays. This is probably the next feature I would (will) add as it gives an even better idea of what is happening in the game. The data wrangling required for this is pretty significant, so for now, I am leaving it out.

Results:

I showed the updated version of the webapp to the testers and overall they were satisfied that the data shown was more clearly described. They still would like more features but who doesn't...

## Resources

- (Material colors less)[https://github.com/mrmlnc/material-color/blob/master/material-color.less]
- (Tutorials from Mike Bostock)[https://bost.ocks.org/mike/]
- (d3.tip.js for tooltips)[https://github.com/Caged/d3-tip]
- (bootstrap for layout)[http://getbootstrap.com/]
