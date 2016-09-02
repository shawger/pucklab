# Game App Readme

Nick Shaw
2016-09-02

This app was developed (in part) for the Udacity Data Analyst Nano Degree, Project 6.

## Summary

The game app on PuckLab (my website) is designed to show a visual summary of a hockey game. Generally, when you want to look at what happened in a hockey game you can look at box scores, which tell you things like the final score, total shots, and how many penalties there are. What it doesn't tell you is the 'flow' of the game (did a team play good and just fall apart in the 3rd) and my app shows that by plotting the difference between attempts (shots, goals, etc) of the teams playing.

## Design

### Overall Page Design

Clearly display the teams that are playing, the flow of the game and some key game statistics.

For each game there are 2 teams. A for team and an against team. In general, keep the for team on the left and the against team on the right. Color key aspects on the page by the color as well.

### Game Flow Chart

The main graphic on the page.

Show a line graph that represents the flow of a hockey game.

Plot (and connect) each attempt by the 'for' team and 'against' team. Each attempt will be plotted by the time of the attempt and by the attempt difference between the 'for' team and the 'against' team at the time of the attempt.

- The x axis show the attempt difference between the 'for' team and the 'against' team at the time of the attempt. The range should be the absolute value of the max difference at any time. This way the dif of 0 is right in the middle.

- The y axis is the game time in seconds.

Features:

 - Display goals on the chart as circles offset from the line. Goals should point toward the team that scored the goal and be colored by the team that scored the goal.

 - When a attempt or goal is moused over, show a tool tip showing details of the attempt or goal.

 - Allow the user to zoom into different periods.

### Game Stat Summary Chart

My main objective was building the game flow chart, but having summary stats (like how many total goals were scored) is also useful. Since I am learning and working with d3.js anyway, it made sense to show the game stats visually.

The idea is to show the stats for each team side by side for a quick comparison. For each stat being compared, plot a bar graph showing how the team did (relative to the other team).

Features:

- Color bars based on team color
- Allow user to zoom to a period, and update the bars to only show data from that period.
- For the stats, show the numbers along with the bars.
- Have the bars for the 'for' and 'against' team be beside each other and go the opposite direction.

Stats To Include:

- Goals
- Shots
- Attempts

### Data and Webserver

For testing and (maybe) assignment submission I manually edited the html file, moved around the scripts and style sheets, and put the json data directly into the game.js file so it can be used without a webserver.

For development and (maybe) final deployment I used a python Flask webserver and MongoDB for the data. For that whole project go (here)[https://github.com/shawger/pucklab]

## Feedback

## Resources

- (Material colors less)[https://github.com/mrmlnc/material-color/blob/master/material-color.less]
- (Tutorials from Mike Bostock)[https://bost.ocks.org/mike/]
- (d3.tip.js for tooltips)[https://github.com/Caged/d3-tip]
