//Run the script
//Get the url for the data
var urlString = String(window.location);

//The game structure is /game/season/team/gameNum
//The data structure is /data/game/season/team/gameNum
//so to get the data url replace /game with /data/game

var gameIndex = urlString.indexOf("/game");
var reducedURL = urlString.slice(gameIndex);
var dataURL = reducedURL.replace("/game", "/data/game");

//Open the json, parse and pass data to drawing functions
d3.json(dataURL, function(error, data) {
    drawGameGraph(data);
    statsGraph(data);
});

//#############################################
// DRAWING FUNCTIONS
//#############################################
// Draw a graph that represents thee flow of a game using d3
function drawGameGraph(data) {
    //Load the data
    //var data = loadData();
    //Store the length of the game
    var gameLength = data.results.gameLength;
    // We want to put 'for' and 'against' events on the same graph so we need
    // to combine the events.
    // In this case we are combining 'attempts' for the entire game
    var events = combineEvents(data, 'attempts', 0, gameLength);
    //Set size of graph
    var graphWidth = $("#game-graph")
        .width();
    var graphheight = $("#game-graph")
        .height();
    // Set the dimensions of the canvas / graph
    var margin = {
            top: 30,
            right: 20,
            bottom: 30,
            left: 20
        },
        width = graphWidth - margin.left - margin.right,
        height = graphheight - margin.top - margin.bottom;
    // Set the ranges
    var x = d3.scaleLinear()
        .range([width, 0]);
    var y = d3.scaleLinear()
        .range([0, height]);
    // Define the statline
    var valueline = d3.line()
        .y(function(d) {
            return y(d.time);
        })
        .x(function(d) {
            return x(d.dif);
        });
    // Adds the svg canvas
    var svg = d3.select("#game-graph")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    // Scale the range of the data
    // Y should be the same magnitude in both the positive and negative
    // directions
    var maxPosX = Math.abs(d3.max(events, function(d) {
        return d.dif;
    }));
    var maxNegX = Math.abs(d3.min(events, function(d) {
        return d.dif;
    }));
    var posX = 0;
    var negX = 0;
    if (maxPosX > maxNegX) {
        posX = maxPosX;
        negX = -1 * maxPosX;
    } else {
        posX = maxNegX;
        negX = -1 * maxNegX;
    }
    y.domain([0, gameLength]);
    x.domain([negX - 3, posX + 3]);
    //Tooltip for a goal
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            //Time is in seconds since start. Convert to MM:SS
            timeRaw = d.time;
            minutes = Math.abs(((timeRaw / 60) - 1))
                .toFixed(0)
                .toString()
                //Add a leading 0 if not there
            if (minutes.length == 1) {
                minutes = '0' + minutes
            }
            seconds = (timeRaw % 60)
                .toString()
                //Add a leading 0 if not there
            if (seconds.length == 1) {
                seconds = '0' + seconds
            }
            time = minutes + ":" + seconds;
            //Determine the for/against teams
            if (d.for) {
                team1 = d.team.abv;
                team2 = d.against.abv;
            } else {
                team1 = d.against.abv;
                team2 = d.team.abv;
            }
            return '<div class="row title">' +
                d.team.abv + ' ' + d.type.toUpperCase() +
                '</div>' +
                '<div class="row centered">' +
                'Time: ' + time +
                '</div>' +
                '<div class="row centered">' +
                d.shooter.name +
                '</div>' +
                '<div class="stats">' +
                '<div class="row">' +
                '<div class="col-xs-4"> </div>' +
                '<div class="col-xs-4">' + team1 + '</div>' +
                '<div class="col-xs-4">' + team2 + '</div>' +
                '</div>' +
                '<div class="row">' +
                '<div class="col-xs-4"> Goals </div>' +
                '<div class="col-xs-4">' + d.stats.for.goals + '</div>' +
                '<div class="col-xs-4">' + d.stats.against.goals + '</div>' +
                '</div>' +
                '<div class="row">' +
                '<div class="col-xs-4"> Atmps </div>' +
                '<div class="col-xs-4">' +
                d.stats.for.attempts +
                '(' +
                d.stats.ratio.attempts.toFixed(2) +
                ')</div>' +
                '<div class="col-xs-4">' +
                d.stats.against.attempts +
                '(' + (1 - d.stats.ratio.attempts).toFixed(2) +
                ')</div>' +
                '</div></div>'
        })
    svg.call(tip);
    // Set up the Y-axis
    // There are actually 2 axis being setup:
    // -Periods (major)
    // -Minutes (minor)
    // For both of axis I needed to create a left and right
    // axis so they could extend left and right of the axis
    svg.append("g")
        .attr("class", "y-axis y-axis-left")
        .attr("transform", "translate(" + width / 2 + ",0)")
        .call(d3.axisLeft(y)
            .tickValues(majorAxis(0, gameLength))
            .tickFormat(function(d, i) {
                return majorAxisLabels(d, gameLength)
            })
            .tickSize(width / 2 - 30));
    svg.append("g")
        .attr("class", "y-axis y-axis-right")
        .attr("transform", "translate(" + width / 2 + ",0)")
        .call(d3.axisRight(y)
            .tickValues(majorAxis(0, gameLength))
            .tickFormat(function(d, i) {
                return majorAxisLabels(d, gameLength)
            })
            .tickSize(width / 2 - 30));
    svg.append("g")
        .attr("class", "y-axis-sub y-axis-sub-right")
        .attr("transform", "translate(" + width / 2 + ",0)")
        .call(d3.axisRight(y)
            .tickValues(subMinorAxis(0, gameLength))
            .tickFormat(function(d, i) {
                "";
            }));
    svg.append("g")
        .attr("class", "y-axis-sub y-axis-sub-left")
        .attr("transform", "translate(" + width / 2 + ",0)")
        .call(d3.axisLeft(y)
            .tickValues(subMinorAxis(0, gameLength))
            .tickFormat(function(d, i) {
                "";
            }));
    svg.append("g")
        .attr("class", "grid")
        .style("stroke-dasharray", ("3, 3"))
        .call(d3.axisTop(x)
            .scale(x)
            .ticks(5)
            .tickSize(-height, 0, 0))
        // Add the statLine to the graph
    var statLine = svg.append("path")
        .attr("class", "line")
        .attr("d", valueline(events));
    // Graph the points along the statline
    // Each point is a attempt. Different attempt
    // type have different symbols
    var point = svg.selectAll("point")
        .data(events)
        .enter()
        .append("path")
        .attr("class", "point")
        .attr("d", d3.symbol()
            .type(function(d) {
                if (d.type == "goal") {
                    return d3.symbolDiamond;
                } else if (d.type == "shot") {
                    return d3.symbolCircle;
                } else {
                    return d3.symbolCross;
                }
            })
            .size(10))
        .attr("transform", function(d) {
            return "translate(" + x(d.dif) + "," + y(d.time) + ")";
        })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);
    // Each goal is shown as a big dot, offset from the main statline
    // and connected to the statline with a line. For goals will be
    // right of the line, and against will be to the left
    // For Goals - Lines
    var forGoalLines = svg.selectAll("line.forGoals")
        .data(data.for.goals)
        .enter()
        .append('line')
        .attr("x1", function(d) {
            return x(d.stats.dif.attempts);
        })
        //.attr("x2", x(posX))
        .attr("x2", function(d) {
            return x(d.stats.dif.attempts) - 50;
        })
        .attr("y1", function(d) {
            return y(d.time);
        })
        .attr("y2", function(d) {
            return y(d.time);
        })
        .attr("stroke-width", "1")
        .attr("stroke", "grey")
        .attr("class", "forTeam");
    // For Goals - Circles
    var forNode = svg.selectAll("g forCircles")
        .data(data.for.goals)
    var forNodeEnter = forNode.enter()
        .append("g")
        .attr("class", "forTeamGoal")
        .attr("transform", function(d) {
            return "translate(" + (x(d.stats.dif.attempts) - 50) + "," + y(d.time) +
                ")";
        })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
    var forCircle = forNodeEnter.append("circle")
        .attr("r", 15)
    forNodeEnter.append("text")
        .attr("dx", function(d) {
            return -4
        })
        .attr("dy", function(d) {
            return 4
        })
        .text(function(d) {
            return d.stats.for.goals
        })
        // Against Goals - Lines
    var againstGoalLines = svg.selectAll("line.againstGoals")
        .data(data.against.goals)
        .enter()
        .append('line')
        .attr("x1", function(d) {
            return x(d.stats.dif.attempts);
        })
        .attr("x2", function(d) {
            return x(d.stats.dif.attempts) + 50;
        })
        .attr("y1", function(d) {
            return y(d.time);
        })
        .attr("y2", function(d) {
            return y(d.time);
        })
        .attr("stroke-width", "1")
        .attr("stroke", "black")
        .attr("class", "againstTeam");
    // Against Goals - Circles
    var againstNode = svg.selectAll("g againstCircles")
        .data(data.against.goals)
    var againstNodeEnter = againstNode.enter()
        .append("g")
        .attr("class", "againstTeamGoal")
        .attr("transform", function(d) {
            return "translate(" + (x(d.stats.dif.attempts) + 50) + "," + y(d.time) +
                ")";
        })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);
    var forCircle = againstNodeEnter.append("circle")
        .attr("r", 15)
    againstNodeEnter.append("text")
        .attr("dx", function(d) {
            return -4
        })
        .attr("dy", function(d) {
            return 4
        })
        .text(function(d) {
            return d.stats.against.goals
        })

    // Add handlers for control of the graph
    // Here, there are buttons that will zoom to periods
    $("#1-period")
        .click(function() {
            zoomGameGraph(data, 0, 1200, x, y, width, height);
            $("h2#flow-title").text("1st Period Flow");
        });
    $("#2-period")
        .click(function() {
            zoomGameGraph(data, 1200, 2400, x, y, width, height);
            $("h2#flow-title").text("2nd Period Flow");
        });
    $("#3-period")
        .click(function() {
            zoomGameGraph(data, 2400, 3600, x, y, width, height);
            $("h2#flow-title").text("3rd Period Flow");
        });
    $("#ot-period")
        .click(function() {
            zoomGameGraph(data, 3600, gameLength, x, y, width, height);
            $("h2#flow-title").text("OT Flow");
        });
    $("#all-period")
        .click(function() {
            zoomGameGraph(data, 0, gameLength, x, y, width, height);
            $("h2#flow-title").text("Game Flow");
        });
}
// Zooms into a period on the game graph
// The main line and plot points (based on attempts)
// will be shifted according to the starting value for a time
// period
function zoomGameGraph(data, start, end, x, y, width, height) {
    // Store the length of the game
    var gameLength = data.results.gameLength;

    // Get the new data
    var events = combineEvents(data, 'attempts', start, end);

    //Apply a shift to the data. This way you can see the flow in the given
    //time frame easier

    //Get the dif at the start
    var startDif = events[0].dif;

    //The shift is the negative value of the first dif
    var difShift = -startDif;

    //Shift the data to match the time period
    events = shiftEventsDif(events,difShift);

    // Get all the for goals during the time
    var forGoals = filterEvents(data.for.goals, start, end);

    forGoals = shiftAttemptsDif(forGoals,difShift);

    // Get all the against goals for the time
    var againstGoals = filterEvents(data.against.goals, start, end);

    againstGoals = shiftAttemptsDif(againstGoals,difShift);

    //Set the range of the data again
    //make it so the graph goes equally in the positive and negative directions
    var maxPosX = Math.abs(d3.max(events, function(d) {
        return d.dif;
    }));
    var maxNegX = Math.abs(d3.min(events, function(d) {
        return d.dif;
    }));
    var posX = 0;
    var negX = 0;
    if (maxPosX > maxNegX) {
        posX = maxPosX;
        negX = -1 * maxPosX;
    } else {
        posX = maxNegX;
        negX = -1 * maxNegX;
    }
    y.domain([start, end]);
    x.domain([negX - 3, posX + 3]);

    //Create the statline
    var valueline = d3.line()
        .y(function(d) {
            return y(d.time);
        })
        .x(function(d) {
            return x(d.difShift);
        });

    // Select the section we want to apply our changes to
    var svg = d3.select("#game-graph");
    // Re-scale the y axis. There are 4. 2 main axis (left right)
    // and 2 subaxis (left right)
    var yAxisLeft = svg.transition()
        .select(".y-axis-left")
        .duration(750)
        .call(d3.axisLeft(y)
            .tickValues(majorAxis(start, end))
            .tickFormat(function(d, i) {
                return majorAxisLabels(d, gameLength)
            })
            .tickSize(width / 2 - 30));
    var yAxisRight = svg.transition()
        .select(".y-axis-right")
        .duration(750)
        .call(d3.axisRight(y)
            .tickValues(majorAxis(start, end))
            .tickFormat(function(d, i) {
                return majorAxisLabels(d, gameLength)
            })
            .tickSize(width / 2 - 30));
    var yAxisRightSub = svg.transition()
        .select(".y-axis-sub-right")
        .duration(750)
        .call(d3.axisRight(y)
            .tickValues(subMinorAxis(0, gameLength))
            .tickFormat(function(d, i) {
                "";
            }));
    var yAxisLeftSub = svg.transition()
        .select(".y-axis-sub-left")
        .duration(750)
        .call(d3.axisLeft(y)
            .tickValues(subMinorAxis(0, gameLength))
            .tickFormat(function(d, i) {
                "";
            }));
    // Move the line
    var line = svg.transition()
        .select(".line")
        .attr("d", valueline(events))
        .duration(750);

    // Move the points
    // For points that are no longer in the graph, hide them,
    // and make visable again when they are in the chart area
    var points = svg.selectAll(".point")
        .data(events)
    points.transition()
        .attr("transform", function(d) {
            return "translate(" + x(d.difShift) + "," + y(d.time) + ")";
        })
        .style("visibility", "visible")
        .duration(750);
    points.exit()
        .transition()
        .style("visibility", "hidden");
    // Move the goal circles
    // For circles that are no longer in the graph, hide them,
    // and make visable again when they are in the chart area
    // For
    var forCircles = svg.selectAll("g.forTeamGoal")
        .data(forGoals);
    forCircles.transition()
        .attr("transform", function(d) {
            return "translate(" +
                (x(d.stats.difShift) - 50) +
                "," +
                y(d.time) + ")";
        })
        .style("visibility", "visible")
        .duration(750);
    forCircles.exit()
        .transition()
        .style("visibility", "hidden");
    //Against
    var againstCircles = svg.selectAll("g.againstTeamGoal")
        .data(againstGoals);
    againstCircles.transition()
        .attr("transform", function(d) {
            return "translate(" +
                (x(d.stats.difShift) + 50) +
                "," +
                y(d.time) +
                ")";
        })
        .style("visibility", "visible")
        .duration(750);
    againstCircles.exit()
        .transition()
        .style("visibility", "hidden");
    // Move the goal lines
    // For lines that are no longer in the graph, hide them,
    // and make visable again when they are in the chart area
    // For
    var forGoalLines = svg.selectAll("line.forTeam")
        .data(forGoals);
    forGoalLines.transition()
        .attr("x1", function(d) {
            return x(d.stats.difShift);
        })
        .attr("x2", function(d) {
            return x(d.stats.difShift) - 50;
        })
        .attr("y1", function(d) {
            return y(d.time);
        })
        .attr("y2", function(d) {
            return y(d.time);
        })
        .style("visibility", "visible")
        .duration(750);
    forGoalLines.exit()
        .transition()
        .style("visibility", "hidden");
    //Against
    var againstGoalLines = svg.selectAll("line.againstTeam")
        .data(againstGoals);
    againstGoalLines.transition()
        .attr("x1", function(d) {
            return x(d.stats.difShift);
        })
        .attr("x2", function(d) {
            return x(d.stats.difShift) + 50;
        })
        .attr("y1", function(d) {
            return y(d.time);
        })
        .attr("y2", function(d) {
            return y(d.time);
        })
        .style("visibility", "visible")
        .duration(750);
    againstGoalLines.exit()
        .transition()
        .style("visibility", "hidden");
}
//Draw goals for bar

function statsGraph(data) {

    //Define the start and end of the games
    var start = 0;
    var end = data.results.gameLength;
    var statSums = summaryStats(data, start, end);
    var graphWidth = $("#for-goals-graph")
        .width();
    var graphHeight = $("#for-goals-graph")
        .height();
    var y = d3.scaleBand()
        .range([0, graphHeight])
        .padding(0.1);
    var x = d3.scaleLinear()
        .range([0, graphWidth]);
    var svg = d3.select("#for-goals-graph")
        .append("svg")
        .attr("width", graphWidth)
        .attr("height", graphHeight)
    y.domain(statSums.map(function(d) {
        return d.type;
    }));
    x.domain([0, 1]);
    svg.selectAll(".bar")
        .data(statSums)
        .enter()
        .append("rect")
        //.attr("class", "bar")
        .attr("class", function(d) {
            if (d.for) {
                return "bar for-bar"
            } else {
                return "bar against-bar"
            }
        })
        .attr("y", function(d) {
            return y(d.type);
        })
        .attr("width", function(d) {
            return x(d.ratio) / 2;
        })
        .attr("x", function(d) {
            if (d.for) {
                return graphWidth / 2 - x(d.ratio) / 2;
            } else {
                return graphWidth / 2;
            }
        })
        .attr("height", y.bandwidth());
    svg.selectAll(".bar-labels")
        .data(statSums)
        .enter()
        .append("text")
        .attr("class", "bar-labels")
        .attr("text-anchor", "middle")
        .attr("y", function(d) {
            return y(d.type) + y.bandwidth() - 5;
        })
        .attr("x", function(d) {
            return graphWidth / 2;
        })
        .text(function(d) {
            return d.type;
        })
    svg.selectAll(".bar-values")
        .data(statSums)
        .enter()
        .append("text")
        .attr("class", "bartext")
        .attr("text-anchor", "middle")
        .attr("y", function(d) {
            return y(d.type) + y.bandwidth() - 5;
        })
        .attr("x", function(d) {
            if (d.for && d.ratio < 0.4) {
                return graphWidth / 2 - x(d.ratio) / 2 - 60;
            } else if (d.for && d.ratio >= 0.4) {
                return graphWidth / 2 - x(d.ratio) / 2 + 40;
            } else if (!d.for && d.ratio < 0.4) {
                return graphWidth / 2 + x(d.ratio) / 2 + 60;
            } else {
                return graphWidth / 2 + x(d.ratio) / 2 - 40;
            }
        })
        .text(function(d) {
            return d.total + "(" + d.ratio.toFixed(2) + ")";
        })
    $("#1-period")
        .click(function() {
            zoomStats(data, 0, 1200, x, y);
            $("h2#stats-title").text("1st Period Stats");
        });
    $("#2-period")
        .click(function() {
            zoomStats(data, 1200, 2400, x, y);
            $("h2#stats-title").text("2nd Period Stats");
        });
    $("#3-period")
        .click(function() {
            zoomStats(data, 2400, 3600, x, y);
            $("h2#stats-title").text("3rd Period Stats");
        });
    $("#ot-period")
        .click(function() {
            zoomStats(data, 3600, 3900, x, y);
            $("h2#stats-title").text("OT Stats");
        });
    $("#all-period")
        .click(function() {
            zoomStats(data, 0, end, x, y);
            $("h2#stats-title").text("Game Stats");
        });
}

function zoomStats(data, start, end, x, y) {

    var statSums = summaryStats(data, start, end);
    var graphWidth = $("#for-goals-graph")
        .width();
    var graphHeight = $("#for-goals-graph")
        .height()
    y.domain(statSums.map(function(d) {
        return d.type;
    }));
    x.domain([0, 1]);
    var svg = d3.select("#for-goals-graph");
    var bars = svg.selectAll("rect.bar")
        .data(statSums);
    bars.transition()
        .attr("width", function(d) {
            return x(d.ratio) / 2;
        })
        .attr("x", function(d) {
            if (d.for) {
                return graphWidth / 2 - x(d.ratio) / 2;
            } else {
                return graphWidth / 2;
            }
        })
        .duration(750);
    var stats = svg.selectAll("text.bartext")
        .data(statSums);
    stats.transition()
        .attr("x", function(d) {
            if (d.for && d.ratio < 0.4) {
                return graphWidth / 2 - x(d.ratio) / 2 - 60;
            } else if (d.for && d.ratio >= 0.4) {
                return graphWidth / 2 - x(d.ratio) / 2 + 40;
            } else if (!d.for && d.ratio < 0.4) {
                return graphWidth / 2 + x(d.ratio) / 2 + 60;
            } else {
                return graphWidth / 2 + x(d.ratio) / 2 - 40;
            }
        })
        .text(function(d) {
            return d.total + "(" + d.ratio.toFixed(2) + ")";
        })
}
//#############################################
// UTILITY FUNCTIONS
//#############################################
// Load json data from page

function loadData() {
    return JSON.parse($('#data')
        .html());
}
// Create an array of tick values for the main axis.
// These are the start/end of game and the intermissions
// which are every 20 minutes (1200s)

function majorAxis(start, end) {
    var axis = [];
    for (i = start; i <= end; i++) {
        if (i % 1200 == 0 || i == end) {
            axis = axis.concat(i);
        }
    }
    return axis;
}
// Create an array of labels for the main axis.
// Basically label the start and end of games and
// label the period intermissions.

function majorAxisLabels(time, gameLength) {
    if (time == 0) {
        return "START";
    } else if (time == gameLength) {
        return "END";
    } else if (time % 1200 == 0) {
        return time / 1200 + " INT"
    }
}
// Create an array that in the position
// of ticks on a subaxis. For the subaxis
// the ticks are on the minutes (every 60s)

function subMinorAxis(start, end) {
    var axis = [];
    for (i = start; i <= end; i++) {
        if (i % 60 == 0) {
            axis = axis.concat(i);
        }
    }
    return axis;
}
// Returns a subset of events that are between a certain
// time

function filterEvents(data, start, end) {
    var newData = [];
    for (i = 0; i < data.length; i++) {
        if (data[i].time >= start && data[i].time <= end) {
            newData = newData.concat(data[i]);
        }
    }
    return newData;
}
// combineEvents combines for and against events of a certian kind
// during a certain time

function combineEvents(data, stat, start, end) {
    var events = []

    //For stats
    for (i = 0; i < data.for[stat].length; i++) {
        var event = {};
        var time = data.for[stat][i]['time'];
        //If the time is in the given range, include it in the data
        if (time >= start && time <= end) {
            event = data.for[stat][i];
            event['time'] = data.for[stat][i]['time'];
            event['dif'] = data.for[stat][i]['stats']['dif'][stat];
            event['for'] = 1;
            event['type'] = data.for[stat][i]['type'];
            events = events.concat(event);
        }
    }
    //Against stats
    for (i = 0; i < data.against[stat].length; i++) {
        var event = {};
        var time = data.against[stat][i]['time'];
        //If the time is in the given range, include it in the data
        if (time >= start && time <= end) {
            event = data.against[stat][i];
            event['time'] = data.against[stat][i]['time'];
            event['dif'] = data.against[stat][i]['stats']['dif'][stat];
            event['for'] = 0;
            event['type'] = data.against[stat][i]['type'];
            events = events.concat(event);
        }
    }
    //Sort the events by time
    events.sort(function(a, b) {
        return a.time - b.time;
    });
    return events;
}
// Create a tooltip for an event

function goalToolTip(goal) {
    return goal.stats.for.goals + "<br>" + goal.time;
}
// Find stats over a given length of time

function summaryStats(data, start, end) {
    // The idea here is that every attempt also includes some stats
    // about the game so for
    //Get all the events (for and against) during a time period
    //The list of attempts is also sorted
    var attempts = combineEvents(data, "attempts", start, end)
        //If there are no attempts return an empty list
    if (attempts.length == 0) {
        return [];
    }
    //If there is only 1 event and the start is not 0, we can't
    //tell the stats during the time frame
    if (attempts.length == 1 && start > 0) {
        return [];
    }
    //Here is where we make the stats
    startAttempt = attempts[0];
    endAttempt = attempts[attempts.length - 1];
    //Create a list of stats to make
    stats = ['goals', 'attempts', 'shots'];
    var statSums = [];
    for (i = 0; i < stats.length; i++) {
        //Get the for stats
        var forStatStart = startAttempt.stats.for[stats[i]];
        //The first stat will include the stat in its summary
        //so we need to get rid of it.
        if (startAttempt.type + "s" == stats[i] && startAttempt.for == 1) {
            forStatStart = forStatStart - 1;
        }
        var forStatEnd = endAttempt.stats.for[stats[i]];
        //Get the against stats
        var againstStatStart = startAttempt.stats.against[stats[i]];
        //The first stat will include the stat in its summary
        //so we need to get rid of it.
        if (startAttempt.type + "s" == stats[i] && startAttempt.for == 0) {
            againstStatStart = againstStatStart - 1;
        }
        var againstStatEnd = endAttempt.stats.against[stats[i]];
        //Calc the values
        var forStat = forStatEnd - forStatStart;
        var againstStat = againstStatEnd - againstStatStart;
        var ratio = calcRatio(forStat, againstStat);
        //The against ratio will be 1-ratio unless the
        //forstat and the against stat are both 0
        var againstRatio = 0;
        if (forStat > 0 || againstStat > 0) {
            againstRatio = 1 - ratio;
        }
        //Build the data structures and put into array
        var forData = {
            "type": stats[i].toUpperCase(),
            "for": true,
            "ratio": ratio,
            "total": forStat
        };
        var againstData = {
            "type": stats[i].toUpperCase(),
            "for": false,
            "ratio": againstRatio,
            "total": againstStat
        };
        statSums.push(forData);
        statSums.push(againstData);
    }
    return statSums;
}
//Create a ratio between 2 variables
//If both variables a 0 return 0
function calcRatio(varA, varB) {
    if (varA + varB == 0) {
        return 0;
    } else {
        return varA / (varA + varB);
    }
}

//Shift dif of events
function shiftEventsDif(events,shift){

  for(i = 0; i < events.length;i++){
    events[i].difShift = events[i].dif + shift;
  }
  return events;
}

//Shift dif of a goal or attempt
function shiftAttemptsDif(events,shift){
  for(i = 0; i < events.length;i++){
    events[i].stats.difShift = events[i].stats.dif.attempts + shift;
  }
  return events;
}
