//Run the script
//Get the url for the data
//var urlString = String(window.location);

//The game structure is /game/season/team/gameNum
//The data structure is /data/game/season/team/gameNum
//so to get the data url replace /game with /data/game

//var gameIndex = urlString.indexOf("/game");
//var reducedURL = urlString.slice(gameIndex);
//var dataURL = reducedURL.replace("/game", "/data/game");

//For the static file the json file is game-data.json

//var dataURL = 'game-data.json';

//Open the json, parse and pass data to drawing functions
//d3.json(dataURL, function(error, data) {
//    drawGameGraph(data);
//    statsGraph(data);
//});

var data = loadData();

drawGameGraph(data);
statsGraph(data);

//

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
            zoomGameGraph(data, 0, 1200, x, y, width, height, valueline);
            $("h2#flow-title").text("1st Period Flow");
        });
    $("#2-period")
        .click(function() {
            zoomGameGraph(data, 1200, 2400, x, y, width, height, valueline);
            $("h2#flow-title").text("2nd Period Flow");
        });
    $("#3-period")
        .click(function() {
            zoomGameGraph(data, 2400, 3600, x, y, width, height, valueline);
            $("h2#flow-title").text("3rd Period Flow");
        });
    $("#ot-period")
        .click(function() {
            zoomGameGraph(data, 3600, gameLength, x, y, width, height, valueline);
            $("h2#flow-title").text("OT Flow");
        });
    $("#all-period")
        .click(function() {
            zoomGameGraph(data, 0, gameLength, x, y, width, height, valueline);
            $("h2#flow-title").text("Game Flow");
        });
}
// Zooms into a period on the game graph

function zoomGameGraph(data, start, end, x, y, width, height, valueline) {
    // Store the length of the game
    var gameLength = data.results.gameLength;
    // Get the new data
    var events = combineEvents(data, 'attempts', start, end);
    // Get all the for goals during the time
    var forGoals = filterEvents(data.for.goals, start, end);
    // Get all the against goals for the time
    var againstGoals = filterEvents(data.against.goals, start, end);
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
            return "translate(" + x(d.dif) + "," + y(d.time) + ")";
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
                (x(d.stats.dif.attempts) - 50) +
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
                (x(d.stats.dif.attempts) + 50) +
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
            return x(d.stats.dif.attempts);
        })
        .attr("x2", function(d) {
            return x(d.stats.dif.attempts) - 50;
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

function loadData(){
	data = {
    "_id": "20158a", 
    "against": {
        "attempts": [
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "VLADIMIR TARASENKO", 
                    "number": "91", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 1, 
                        "goals": 0, 
                        "shots": 1
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 0, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "ratio": {
                        "attempts": 0.0, 
                        "goals": 0, 
                        "shots": 0.0
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 24, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "VLADIMIR TARASENKO", 
                    "number": "91", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 2, 
                        "goals": 0, 
                        "shots": 2
                    }, 
                    "dif": {
                        "attempts": -2, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 0, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "ratio": {
                        "attempts": 0.0, 
                        "goals": 0, 
                        "shots": 0.0
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 30, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "COLTON PARAYKO", 
                    "number": "55", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 3, 
                        "goals": 0, 
                        "shots": 2
                    }, 
                    "dif": {
                        "attempts": -3, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 0, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "ratio": {
                        "attempts": 0.0, 
                        "goals": 0, 
                        "shots": 0.0
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 35, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JADEN SCHWARTZ", 
                    "number": "17", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 4, 
                        "goals": 0, 
                        "shots": 2
                    }, 
                    "dif": {
                        "attempts": -4, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 0, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "ratio": {
                        "attempts": 0.0, 
                        "goals": 0, 
                        "shots": 0.0
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 82, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "KEVIN SHATTENKIRK", 
                    "number": "22", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 5, 
                        "goals": 0, 
                        "shots": 3
                    }, 
                    "dif": {
                        "attempts": -5, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 0, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "ratio": {
                        "attempts": 0.0, 
                        "goals": 0, 
                        "shots": 0.0
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 212, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "VLADIMIR TARASENKO", 
                    "number": "91", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 6, 
                        "goals": 0, 
                        "shots": 3
                    }, 
                    "dif": {
                        "attempts": -6, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 0, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "ratio": {
                        "attempts": 0.0, 
                        "goals": 0, 
                        "shots": 0.0
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 372, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JORI LEHTERA", 
                    "number": "12", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 7, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": -7, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 0, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "ratio": {
                        "attempts": 0.0, 
                        "goals": 0, 
                        "shots": 0.0
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 379, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "ROBBY FABBRI", 
                    "number": "15", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 8, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": -8, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 0, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "ratio": {
                        "attempts": 0.0, 
                        "goals": 0, 
                        "shots": 0.0
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 406, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "VLADIMIR TARASENKO", 
                    "number": "91", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 9, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": -9, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 0, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "ratio": {
                        "attempts": 0.0, 
                        "goals": 0, 
                        "shots": 0.0
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 410, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "DAVID BACKES", 
                    "number": "42", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 10, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": -8, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 2, 
                        "goals": 0, 
                        "shots": 1
                    }, 
                    "ratio": {
                        "attempts": 0.16666666666666666, 
                        "goals": 0, 
                        "shots": 0.16666666666666666
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 545, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "ROBBY FABBRI", 
                    "number": "15", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 11, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": -7, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 4, 
                        "goals": 0, 
                        "shots": 3
                    }, 
                    "ratio": {
                        "attempts": 0.26666666666666666, 
                        "goals": 0, 
                        "shots": 0.375
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 635, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "ALEX PIETRANGELO", 
                    "number": "27", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 12, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": -2, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 10, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "ratio": {
                        "attempts": 0.45454545454545453, 
                        "goals": 0, 
                        "shots": 0.5833333333333334
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 830, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "VLADIMIR TARASENKO", 
                    "number": "91", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 13, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": -3, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 10, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "ratio": {
                        "attempts": 0.43478260869565216, 
                        "goals": 0, 
                        "shots": 0.5833333333333334
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 874, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "VLADIMIR TARASENKO", 
                    "number": "91", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 14, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": -4, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 10, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "ratio": {
                        "attempts": 0.4166666666666667, 
                        "goals": 0, 
                        "shots": 0.5833333333333334
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 885, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "VLADIMIR TARASENKO", 
                    "number": "91", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 15, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": -5, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 10, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "ratio": {
                        "attempts": 0.4, 
                        "goals": 0, 
                        "shots": 0.5833333333333334
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 917, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "TROY BROUWER", 
                    "number": "36", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 16, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "dif": {
                        "attempts": -5, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 11, 
                        "goals": 0, 
                        "shots": 8
                    }, 
                    "ratio": {
                        "attempts": 0.4074074074074074, 
                        "goals": 0, 
                        "shots": 0.5714285714285714
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 976, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JADEN SCHWARTZ", 
                    "number": "17", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 17, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "dif": {
                        "attempts": -4, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 13, 
                        "goals": 1, 
                        "shots": 9
                    }, 
                    "ratio": {
                        "attempts": 0.43333333333333335, 
                        "goals": 1.0, 
                        "shots": 0.6
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 1119, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "KEVIN SHATTENKIRK", 
                    "number": "22", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 18, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "dif": {
                        "attempts": -5, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 13, 
                        "goals": 1, 
                        "shots": 9
                    }, 
                    "ratio": {
                        "attempts": 0.41935483870967744, 
                        "goals": 1.0, 
                        "shots": 0.5625
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 1129, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "DAVID BACKES", 
                    "number": "42", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 19, 
                        "goals": 0, 
                        "shots": 8
                    }, 
                    "dif": {
                        "attempts": -5, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 14, 
                        "goals": 1, 
                        "shots": 10
                    }, 
                    "ratio": {
                        "attempts": 0.42424242424242425, 
                        "goals": 1.0, 
                        "shots": 0.5555555555555556
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 1161, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "VLADIMIR TARASENKO", 
                    "number": "91", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 20, 
                        "goals": 0, 
                        "shots": 8
                    }, 
                    "dif": {
                        "attempts": -6, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 14, 
                        "goals": 1, 
                        "shots": 10
                    }, 
                    "ratio": {
                        "attempts": 0.4117647058823529, 
                        "goals": 1.0, 
                        "shots": 0.5555555555555556
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 1189, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "ALEXANDER STEEN", 
                    "number": "20", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 21, 
                        "goals": 0, 
                        "shots": 9
                    }, 
                    "dif": {
                        "attempts": -7, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 14, 
                        "goals": 1, 
                        "shots": 10
                    }, 
                    "ratio": {
                        "attempts": 0.4, 
                        "goals": 1.0, 
                        "shots": 0.5263157894736842
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 1236, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "ALEXANDER STEEN", 
                    "number": "20", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 22, 
                        "goals": 0, 
                        "shots": 9
                    }, 
                    "dif": {
                        "attempts": -7, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 15, 
                        "goals": 1, 
                        "shots": 11
                    }, 
                    "ratio": {
                        "attempts": 0.40540540540540543, 
                        "goals": 1.0, 
                        "shots": 0.55
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 1274, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JADEN SCHWARTZ", 
                    "number": "17", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 23, 
                        "goals": 0, 
                        "shots": 9
                    }, 
                    "dif": {
                        "attempts": -7, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 16, 
                        "goals": 1, 
                        "shots": 12
                    }, 
                    "ratio": {
                        "attempts": 0.41025641025641024, 
                        "goals": 1.0, 
                        "shots": 0.5714285714285714
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 1312, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "STEVE OTT", 
                    "number": "9", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 24, 
                        "goals": 0, 
                        "shots": 10
                    }, 
                    "dif": {
                        "attempts": -6, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 18, 
                        "goals": 1, 
                        "shots": 14
                    }, 
                    "ratio": {
                        "attempts": 0.42857142857142855, 
                        "goals": 1.0, 
                        "shots": 0.5833333333333334
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 1397, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "KEVIN SHATTENKIRK", 
                    "number": "22", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 25, 
                        "goals": 0, 
                        "shots": 11
                    }, 
                    "dif": {
                        "attempts": -7, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 18, 
                        "goals": 1, 
                        "shots": 14
                    }, 
                    "ratio": {
                        "attempts": 0.4186046511627907, 
                        "goals": 1.0, 
                        "shots": 0.56
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 1525, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "DAVID BACKES", 
                    "number": "42", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 26, 
                        "goals": 0, 
                        "shots": 12
                    }, 
                    "dif": {
                        "attempts": -7, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 19, 
                        "goals": 1, 
                        "shots": 14
                    }, 
                    "ratio": {
                        "attempts": 0.4222222222222222, 
                        "goals": 1.0, 
                        "shots": 0.5384615384615384
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 1613, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "VLADIMIR TARASENKO", 
                    "number": "91", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 27, 
                        "goals": 1, 
                        "shots": 13
                    }, 
                    "dif": {
                        "attempts": -8, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 19, 
                        "goals": 1, 
                        "shots": 14
                    }, 
                    "ratio": {
                        "attempts": 0.41304347826086957, 
                        "goals": 0.5, 
                        "shots": 0.5185185185185185
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 1750, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "CARL GUNNARSSON", 
                    "number": "4", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 13
                    }, 
                    "dif": {
                        "attempts": -9, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 19, 
                        "goals": 1, 
                        "shots": 14
                    }, 
                    "ratio": {
                        "attempts": 0.40425531914893614, 
                        "goals": 0.5, 
                        "shots": 0.5185185185185185
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 1773, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "DAVID BACKES", 
                    "number": "42", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 29, 
                        "goals": 1, 
                        "shots": 14
                    }, 
                    "dif": {
                        "attempts": -8, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 21, 
                        "goals": 1, 
                        "shots": 14
                    }, 
                    "ratio": {
                        "attempts": 0.42, 
                        "goals": 0.5, 
                        "shots": 0.5
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 1840, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "DMITRIJ JASKIN", 
                    "number": "23", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 30, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "dif": {
                        "attempts": -5, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 25, 
                        "goals": 1, 
                        "shots": 16
                    }, 
                    "ratio": {
                        "attempts": 0.45454545454545453, 
                        "goals": 0.5, 
                        "shots": 0.5161290322580645
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 1952, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "TROY BROUWER", 
                    "number": "36", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 31, 
                        "goals": 1, 
                        "shots": 16
                    }, 
                    "dif": {
                        "attempts": -6, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 25, 
                        "goals": 1, 
                        "shots": 16
                    }, 
                    "ratio": {
                        "attempts": 0.44642857142857145, 
                        "goals": 0.5, 
                        "shots": 0.5
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 1971, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "TROY BROUWER", 
                    "number": "36", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 32, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "dif": {
                        "attempts": -4, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "ratio": {
                        "attempts": 0.4666666666666667, 
                        "goals": 0.5, 
                        "shots": 0.5
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2109, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "VLADIMIR TARASENKO", 
                    "number": "91", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 33, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "dif": {
                        "attempts": -5, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "ratio": {
                        "attempts": 0.45901639344262296, 
                        "goals": 0.5, 
                        "shots": 0.5
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2126, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "VLADIMIR TARASENKO", 
                    "number": "91", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 34, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "dif": {
                        "attempts": -6, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "ratio": {
                        "attempts": 0.45161290322580644, 
                        "goals": 0.5, 
                        "shots": 0.5
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2132, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "ALEXANDER STEEN", 
                    "number": "20", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 35, 
                        "goals": 1, 
                        "shots": 18
                    }, 
                    "dif": {
                        "attempts": -7, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "ratio": {
                        "attempts": 0.4444444444444444, 
                        "goals": 0.5, 
                        "shots": 0.4857142857142857
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2186, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "COLTON PARAYKO", 
                    "number": "55", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 36, 
                        "goals": 1, 
                        "shots": 19
                    }, 
                    "dif": {
                        "attempts": -8, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "ratio": {
                        "attempts": 0.4375, 
                        "goals": 0.5, 
                        "shots": 0.4722222222222222
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2245, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "KYLE BRODZIAK", 
                    "number": "28", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 37, 
                        "goals": 1, 
                        "shots": 19
                    }, 
                    "dif": {
                        "attempts": -9, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "ratio": {
                        "attempts": 0.4307692307692308, 
                        "goals": 0.5, 
                        "shots": 0.4722222222222222
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2262, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JADEN SCHWARTZ", 
                    "number": "17", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 38, 
                        "goals": 1, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": -10, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "ratio": {
                        "attempts": 0.42424242424242425, 
                        "goals": 0.5, 
                        "shots": 0.4594594594594595
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2288, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "KEVIN SHATTENKIRK", 
                    "number": "22", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 39, 
                        "goals": 1, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": -11, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "ratio": {
                        "attempts": 0.417910447761194, 
                        "goals": 0.5, 
                        "shots": 0.4594594594594595
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2340, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "KEVIN SHATTENKIRK", 
                    "number": "22", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 40, 
                        "goals": 1, 
                        "shots": 21
                    }, 
                    "dif": {
                        "attempts": -12, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "ratio": {
                        "attempts": 0.4117647058823529, 
                        "goals": 0.5, 
                        "shots": 0.4473684210526316
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2356, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JAY BOUWMEESTER", 
                    "number": "19", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 41, 
                        "goals": 1, 
                        "shots": 21
                    }, 
                    "dif": {
                        "attempts": -13, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "ratio": {
                        "attempts": 0.4057971014492754, 
                        "goals": 0.5, 
                        "shots": 0.4473684210526316
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2361, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JAY BOUWMEESTER", 
                    "number": "19", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 42, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": -14, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "ratio": {
                        "attempts": 0.4, 
                        "goals": 0.5, 
                        "shots": 0.4358974358974359
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2399, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JOEL EDMUNDSON", 
                    "number": "6", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 43, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": -11, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 32, 
                        "goals": 1, 
                        "shots": 19
                    }, 
                    "ratio": {
                        "attempts": 0.4266666666666667, 
                        "goals": 0.5, 
                        "shots": 0.4634146341463415
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2553, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "KYLE BRODZIAK", 
                    "number": "28", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 44, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": -9, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 35, 
                        "goals": 1, 
                        "shots": 21
                    }, 
                    "ratio": {
                        "attempts": 0.4430379746835443, 
                        "goals": 0.5, 
                        "shots": 0.4883720930232558
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2662, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "ALEXANDER STEEN", 
                    "number": "20", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 45, 
                        "goals": 1, 
                        "shots": 23
                    }, 
                    "dif": {
                        "attempts": -9, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 36, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "ratio": {
                        "attempts": 0.4444444444444444, 
                        "goals": 0.5, 
                        "shots": 0.4888888888888889
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2737, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "VLADIMIR TARASENKO", 
                    "number": "91", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 46, 
                        "goals": 1, 
                        "shots": 23
                    }, 
                    "dif": {
                        "attempts": -9, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 37, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "ratio": {
                        "attempts": 0.4457831325301205, 
                        "goals": 0.5, 
                        "shots": 0.4888888888888889
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2824, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "COLTON PARAYKO", 
                    "number": "55", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 47, 
                        "goals": 1, 
                        "shots": 23
                    }, 
                    "dif": {
                        "attempts": -9, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 38, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "ratio": {
                        "attempts": 0.4470588235294118, 
                        "goals": 0.5, 
                        "shots": 0.4888888888888889
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2883, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "COLTON PARAYKO", 
                    "number": "55", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 48, 
                        "goals": 1, 
                        "shots": 24
                    }, 
                    "dif": {
                        "attempts": -10, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 38, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "ratio": {
                        "attempts": 0.4418604651162791, 
                        "goals": 0.5, 
                        "shots": 0.4782608695652174
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2904, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "KEVIN SHATTENKIRK", 
                    "number": "22", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 49, 
                        "goals": 1, 
                        "shots": 24
                    }, 
                    "dif": {
                        "attempts": -8, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 41, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "ratio": {
                        "attempts": 0.45555555555555555, 
                        "goals": 0.5, 
                        "shots": 0.4782608695652174
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2953, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "RYAN REAVES", 
                    "number": "75", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 50, 
                        "goals": 1, 
                        "shots": 25
                    }, 
                    "dif": {
                        "attempts": -9, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 41, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "ratio": {
                        "attempts": 0.45054945054945056, 
                        "goals": 0.5, 
                        "shots": 0.46808510638297873
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2959, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "ROBBY FABBRI", 
                    "number": "15", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 51, 
                        "goals": 2, 
                        "shots": 26
                    }, 
                    "dif": {
                        "attempts": -10, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 41, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "ratio": {
                        "attempts": 0.44565217391304346, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.4583333333333333
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2969, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "COLTON PARAYKO", 
                    "number": "55", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 52, 
                        "goals": 2, 
                        "shots": 26
                    }, 
                    "dif": {
                        "attempts": -11, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 41, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "ratio": {
                        "attempts": 0.44086021505376344, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.4583333333333333
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 3104, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JADEN SCHWARTZ", 
                    "number": "17", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 53, 
                        "goals": 2, 
                        "shots": 27
                    }, 
                    "dif": {
                        "attempts": -12, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 41, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "ratio": {
                        "attempts": 0.43617021276595747, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.4489795918367347
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 3123, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "TROY BROUWER", 
                    "number": "36", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 54, 
                        "goals": 2, 
                        "shots": 28
                    }, 
                    "dif": {
                        "attempts": -9, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 45, 
                        "goals": 1, 
                        "shots": 25
                    }, 
                    "ratio": {
                        "attempts": 0.45454545454545453, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.4716981132075472
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 3356, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "COLTON PARAYKO", 
                    "number": "55", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 55, 
                        "goals": 2, 
                        "shots": 29
                    }, 
                    "dif": {
                        "attempts": -9, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 46, 
                        "goals": 1, 
                        "shots": 25
                    }, 
                    "ratio": {
                        "attempts": 0.45544554455445546, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.46296296296296297
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 3399, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "ALEXANDER STEEN", 
                    "number": "20", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 56, 
                        "goals": 2, 
                        "shots": 30
                    }, 
                    "dif": {
                        "attempts": -8, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 48, 
                        "goals": 1, 
                        "shots": 25
                    }, 
                    "ratio": {
                        "attempts": 0.46153846153846156, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.45454545454545453
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 3511, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "TROY BROUWER", 
                    "number": "36", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 57, 
                        "goals": 3, 
                        "shots": 31
                    }, 
                    "dif": {
                        "attempts": -8, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 49, 
                        "goals": 1, 
                        "shots": 25
                    }, 
                    "ratio": {
                        "attempts": 0.46226415094339623, 
                        "goals": 0.25, 
                        "shots": 0.44642857142857145
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 3582, 
                "type": "goal"
            }
        ], 
        "goals": [
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "VLADIMIR TARASENKO", 
                    "number": "91", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 27, 
                        "goals": 1
                    }, 
                    "dif": {
                        "attempts": -8, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 19, 
                        "goals": 1
                    }, 
                    "ratio": {
                        "attempts": 0.41304347826086957
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 1750, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "ROBBY FABBRI", 
                    "number": "15", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 51, 
                        "goals": 2
                    }, 
                    "dif": {
                        "attempts": -10, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 41, 
                        "goals": 1
                    }, 
                    "ratio": {
                        "attempts": 0.44565217391304346
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 2969, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "TROY BROUWER", 
                    "number": "36", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 57, 
                        "goals": 3
                    }, 
                    "dif": {
                        "attempts": -8, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 49, 
                        "goals": 1
                    }, 
                    "ratio": {
                        "attempts": 0.46226415094339623
                    }
                }, 
                "team": {
                    "abv": "STL"
                }, 
                "time": 3582, 
                "type": "goal"
            }
        ], 
        "stats": {
            "goals": {
                "1": 0, 
                "2": 1, 
                "3": 2, 
                "4": 0, 
                "5": 0, 
                "reg": 3, 
                "total": 3
            }
        }, 
        "team": {
            "abv": "STL"
        }
    }, 
    "date": "2015-10-08", 
    "for": {
        "attempts": [
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "ERIC GRYBA", 
                    "number": "62", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 9, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": -8, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 1, 
                        "goals": 0, 
                        "shots": 1
                    }, 
                    "ratio": {
                        "attempts": 0.1, 
                        "goals": 0, 
                        "shots": 0.2
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 447, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "OSCAR KLEFBOM", 
                    "number": "77", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 9, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": -7, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 2, 
                        "goals": 0, 
                        "shots": 1
                    }, 
                    "ratio": {
                        "attempts": 0.18181818181818182, 
                        "goals": 0, 
                        "shots": 0.2
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 530, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "JUSTIN SCHULTZ", 
                    "number": "19", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 10, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": -7, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 3, 
                        "goals": 0, 
                        "shots": 2
                    }, 
                    "ratio": {
                        "attempts": 0.23076923076923078, 
                        "goals": 0, 
                        "shots": 0.2857142857142857
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 569, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "TAYLOR HALL", 
                    "number": "4", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 10, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": -6, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 4, 
                        "goals": 0, 
                        "shots": 3
                    }, 
                    "ratio": {
                        "attempts": 0.2857142857142857, 
                        "goals": 0, 
                        "shots": 0.375
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 618, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "JUSTIN SCHULTZ", 
                    "number": "19", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 11, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": -6, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 5, 
                        "goals": 0, 
                        "shots": 3
                    }, 
                    "ratio": {
                        "attempts": 0.3125, 
                        "goals": 0, 
                        "shots": 0.375
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 686, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "BENOIT POULIOT", 
                    "number": "67", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 11, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": -5, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 6, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "ratio": {
                        "attempts": 0.35294117647058826, 
                        "goals": 0, 
                        "shots": 0.4444444444444444
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 701, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "MATT HENDRICKS", 
                    "number": "23", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 11, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": -4, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 7, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "ratio": {
                        "attempts": 0.3888888888888889, 
                        "goals": 0, 
                        "shots": 0.5
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 723, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "LAURI KORPIKOSKI", 
                    "number": "28", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 11, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": -3, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 8, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "ratio": {
                        "attempts": 0.42105263157894735, 
                        "goals": 0, 
                        "shots": 0.5454545454545454
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 755, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "ERIC GRYBA", 
                    "number": "62", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 11, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": -2, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 9, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "ratio": {
                        "attempts": 0.45, 
                        "goals": 0, 
                        "shots": 0.5454545454545454
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 767, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "NAIL YAKUPOV", 
                    "number": "10", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 11, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 10, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "ratio": {
                        "attempts": 0.47619047619047616, 
                        "goals": 0, 
                        "shots": 0.5833333333333334
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 778, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "MATT HENDRICKS", 
                    "number": "23", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 15, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": -4, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 11, 
                        "goals": 0, 
                        "shots": 8
                    }, 
                    "ratio": {
                        "attempts": 0.4230769230769231, 
                        "goals": 0, 
                        "shots": 0.6153846153846154
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 968, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "GRIFFIN REINHART", 
                    "number": "8", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 16, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "dif": {
                        "attempts": -4, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 12, 
                        "goals": 0, 
                        "shots": 8
                    }, 
                    "ratio": {
                        "attempts": 0.42857142857142855, 
                        "goals": 0, 
                        "shots": 0.5714285714285714
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1027, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "RYAN NUGENT-HOPKINS", 
                    "number": "93", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 16, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "dif": {
                        "attempts": -3, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 13, 
                        "goals": 1, 
                        "shots": 9
                    }, 
                    "ratio": {
                        "attempts": 0.4482758620689655, 
                        "goals": 1.0, 
                        "shots": 0.6
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1042, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "GRIFFIN REINHART", 
                    "number": "8", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 18, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "dif": {
                        "attempts": -4, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 14, 
                        "goals": 1, 
                        "shots": 10
                    }, 
                    "ratio": {
                        "attempts": 0.4375, 
                        "goals": 1.0, 
                        "shots": 0.5882352941176471
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1147, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "MATT HENDRICKS", 
                    "number": "23", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 21, 
                        "goals": 0, 
                        "shots": 9
                    }, 
                    "dif": {
                        "attempts": -6, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 15, 
                        "goals": 1, 
                        "shots": 11
                    }, 
                    "ratio": {
                        "attempts": 0.4166666666666667, 
                        "goals": 1.0, 
                        "shots": 0.55
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1245, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "LAURI KORPIKOSKI", 
                    "number": "28", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 22, 
                        "goals": 0, 
                        "shots": 9
                    }, 
                    "dif": {
                        "attempts": -6, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 16, 
                        "goals": 1, 
                        "shots": 12
                    }, 
                    "ratio": {
                        "attempts": 0.42105263157894735, 
                        "goals": 1.0, 
                        "shots": 0.5714285714285714
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1280, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "ANDREJ SEKERA", 
                    "number": "2", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 23, 
                        "goals": 0, 
                        "shots": 9
                    }, 
                    "dif": {
                        "attempts": -6, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 17, 
                        "goals": 1, 
                        "shots": 13
                    }, 
                    "ratio": {
                        "attempts": 0.425, 
                        "goals": 1.0, 
                        "shots": 0.5909090909090909
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1357, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "TAYLOR HALL", 
                    "number": "4", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 23, 
                        "goals": 0, 
                        "shots": 9
                    }, 
                    "dif": {
                        "attempts": -5, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 18, 
                        "goals": 1, 
                        "shots": 14
                    }, 
                    "ratio": {
                        "attempts": 0.43902439024390244, 
                        "goals": 1.0, 
                        "shots": 0.6086956521739131
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1359, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "MARK LETESTU", 
                    "number": "55", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 25, 
                        "goals": 0, 
                        "shots": 11
                    }, 
                    "dif": {
                        "attempts": -6, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 19, 
                        "goals": 1, 
                        "shots": 14
                    }, 
                    "ratio": {
                        "attempts": 0.4318181818181818, 
                        "goals": 1.0, 
                        "shots": 0.56
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1567, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "GRIFFIN REINHART", 
                    "number": "8", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 13
                    }, 
                    "dif": {
                        "attempts": -8, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 20, 
                        "goals": 1, 
                        "shots": 14
                    }, 
                    "ratio": {
                        "attempts": 0.4166666666666667, 
                        "goals": 0.5, 
                        "shots": 0.5185185185185185
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1826, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "MARK FAYNE", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 13
                    }, 
                    "dif": {
                        "attempts": -7, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 21, 
                        "goals": 1, 
                        "shots": 14
                    }, 
                    "ratio": {
                        "attempts": 0.42857142857142855, 
                        "goals": 0.5, 
                        "shots": 0.5185185185185185
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1832, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "LUKE GAZDIC", 
                    "number": "20", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 29, 
                        "goals": 1, 
                        "shots": 14
                    }, 
                    "dif": {
                        "attempts": -7, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 22, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "ratio": {
                        "attempts": 0.43137254901960786, 
                        "goals": 0.5, 
                        "shots": 0.5172413793103449
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1864, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "OSCAR KLEFBOM", 
                    "number": "77", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 29, 
                        "goals": 1, 
                        "shots": 14
                    }, 
                    "dif": {
                        "attempts": -6, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 23, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "ratio": {
                        "attempts": 0.4423076923076923, 
                        "goals": 0.5, 
                        "shots": 0.5172413793103449
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1875, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "TEDDY PURCELL", 
                    "number": "16", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 29, 
                        "goals": 1, 
                        "shots": 14
                    }, 
                    "dif": {
                        "attempts": -5, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 24, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "ratio": {
                        "attempts": 0.4528301886792453, 
                        "goals": 0.5, 
                        "shots": 0.5172413793103449
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1934, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "TEDDY PURCELL", 
                    "number": "16", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 29, 
                        "goals": 1, 
                        "shots": 14
                    }, 
                    "dif": {
                        "attempts": -4, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 25, 
                        "goals": 1, 
                        "shots": 16
                    }, 
                    "ratio": {
                        "attempts": 0.46296296296296297, 
                        "goals": 0.5, 
                        "shots": 0.5333333333333333
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1939, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "MARK LETESTU", 
                    "number": "55", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 31, 
                        "goals": 1, 
                        "shots": 16
                    }, 
                    "dif": {
                        "attempts": -5, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 26, 
                        "goals": 1, 
                        "shots": 16
                    }, 
                    "ratio": {
                        "attempts": 0.45614035087719296, 
                        "goals": 0.5, 
                        "shots": 0.5
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2029, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "MATT HENDRICKS", 
                    "number": "23", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 31, 
                        "goals": 1, 
                        "shots": 16
                    }, 
                    "dif": {
                        "attempts": -4, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 27, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "ratio": {
                        "attempts": 0.46551724137931033, 
                        "goals": 0.5, 
                        "shots": 0.5151515151515151
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2056, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "ANDREJ SEKERA", 
                    "number": "2", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 31, 
                        "goals": 1, 
                        "shots": 16
                    }, 
                    "dif": {
                        "attempts": -3, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "ratio": {
                        "attempts": 0.4745762711864407, 
                        "goals": 0.5, 
                        "shots": 0.5151515151515151
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2060, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "RYAN NUGENT-HOPKINS", 
                    "number": "93", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 42, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": -13, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 29, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "ratio": {
                        "attempts": 0.4084507042253521, 
                        "goals": 0.5, 
                        "shots": 0.4358974358974359
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2435, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "ANTON LANDER", 
                    "number": "51", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 42, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": -12, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 30, 
                        "goals": 1, 
                        "shots": 18
                    }, 
                    "ratio": {
                        "attempts": 0.4166666666666667, 
                        "goals": 0.5, 
                        "shots": 0.45
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2479, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "CONNOR MCDAVID", 
                    "number": "97", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 42, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": -11, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 31, 
                        "goals": 1, 
                        "shots": 19
                    }, 
                    "ratio": {
                        "attempts": 0.4246575342465753, 
                        "goals": 0.5, 
                        "shots": 0.4634146341463415
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2513, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "OSCAR KLEFBOM", 
                    "number": "77", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 42, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": -10, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 32, 
                        "goals": 1, 
                        "shots": 19
                    }, 
                    "ratio": {
                        "attempts": 0.43243243243243246, 
                        "goals": 0.5, 
                        "shots": 0.4634146341463415
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2532, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "JUSTIN SCHULTZ", 
                    "number": "19", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 43, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": -10, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 33, 
                        "goals": 1, 
                        "shots": 19
                    }, 
                    "ratio": {
                        "attempts": 0.4342105263157895, 
                        "goals": 0.5, 
                        "shots": 0.4634146341463415
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2569, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "TAYLOR HALL", 
                    "number": "4", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 43, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": -9, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 34, 
                        "goals": 1, 
                        "shots": 20
                    }, 
                    "ratio": {
                        "attempts": 0.44155844155844154, 
                        "goals": 0.5, 
                        "shots": 0.47619047619047616
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2578, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "CONNOR MCDAVID", 
                    "number": "97", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 43, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": -8, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 35, 
                        "goals": 1, 
                        "shots": 21
                    }, 
                    "ratio": {
                        "attempts": 0.44871794871794873, 
                        "goals": 0.5, 
                        "shots": 0.4883720930232558
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2586, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "MATT HENDRICKS", 
                    "number": "23", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 44, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": -8, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 36, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "ratio": {
                        "attempts": 0.45, 
                        "goals": 0.5, 
                        "shots": 0.5
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2699, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "TEDDY PURCELL", 
                    "number": "16", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 45, 
                        "goals": 1, 
                        "shots": 23
                    }, 
                    "dif": {
                        "attempts": -8, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 37, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "ratio": {
                        "attempts": 0.45121951219512196, 
                        "goals": 0.5, 
                        "shots": 0.4888888888888889
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2768, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "ERIC GRYBA", 
                    "number": "62", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 46, 
                        "goals": 1, 
                        "shots": 23
                    }, 
                    "dif": {
                        "attempts": -8, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 38, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "ratio": {
                        "attempts": 0.4523809523809524, 
                        "goals": 0.5, 
                        "shots": 0.4888888888888889
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2845, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "TEDDY PURCELL", 
                    "number": "16", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 48, 
                        "goals": 1, 
                        "shots": 24
                    }, 
                    "dif": {
                        "attempts": -9, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 39, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "ratio": {
                        "attempts": 0.4482758620689655, 
                        "goals": 0.5, 
                        "shots": 0.4782608695652174
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2926, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "RYAN NUGENT-HOPKINS", 
                    "number": "93", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 48, 
                        "goals": 1, 
                        "shots": 24
                    }, 
                    "dif": {
                        "attempts": -8, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 40, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "ratio": {
                        "attempts": 0.45454545454545453, 
                        "goals": 0.5, 
                        "shots": 0.4782608695652174
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2932, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "JUSTIN SCHULTZ", 
                    "number": "19", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 48, 
                        "goals": 1, 
                        "shots": 24
                    }, 
                    "dif": {
                        "attempts": -7, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 41, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "ratio": {
                        "attempts": 0.4606741573033708, 
                        "goals": 0.5, 
                        "shots": 0.4782608695652174
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2933, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "NAIL YAKUPOV", 
                    "number": "10", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 53, 
                        "goals": 2, 
                        "shots": 27
                    }, 
                    "dif": {
                        "attempts": -11, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 42, 
                        "goals": 1, 
                        "shots": 23
                    }, 
                    "ratio": {
                        "attempts": 0.4421052631578947, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.46
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 3243, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "MARK FAYNE", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 53, 
                        "goals": 2, 
                        "shots": 27
                    }, 
                    "dif": {
                        "attempts": -10, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 43, 
                        "goals": 1, 
                        "shots": 24
                    }, 
                    "ratio": {
                        "attempts": 0.4479166666666667, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.47058823529411764
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 3312, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "ANTON SLEPYSHEV", 
                    "number": "42", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 53, 
                        "goals": 2, 
                        "shots": 27
                    }, 
                    "dif": {
                        "attempts": -9, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 44, 
                        "goals": 1, 
                        "shots": 25
                    }, 
                    "ratio": {
                        "attempts": 0.4536082474226804, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.4807692307692308
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 3328, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "GRIFFIN REINHART", 
                    "number": "8", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 53, 
                        "goals": 2, 
                        "shots": 27
                    }, 
                    "dif": {
                        "attempts": -8, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 45, 
                        "goals": 1, 
                        "shots": 25
                    }, 
                    "ratio": {
                        "attempts": 0.45918367346938777, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.4807692307692308
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 3343, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "JUSTIN SCHULTZ", 
                    "number": "19", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 54, 
                        "goals": 2, 
                        "shots": 28
                    }, 
                    "dif": {
                        "attempts": -8, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 46, 
                        "goals": 1, 
                        "shots": 25
                    }, 
                    "ratio": {
                        "attempts": 0.46, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.4716981132075472
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 3392, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "ANDREJ SEKERA", 
                    "number": "2", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 55, 
                        "goals": 2, 
                        "shots": 29
                    }, 
                    "dif": {
                        "attempts": -8, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 47, 
                        "goals": 1, 
                        "shots": 25
                    }, 
                    "ratio": {
                        "attempts": 0.46078431372549017, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.46296296296296297
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 3439, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "name": "ANDREJ SEKERA", 
                    "number": "2", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 55, 
                        "goals": 2, 
                        "shots": 29
                    }, 
                    "dif": {
                        "attempts": -7, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 48, 
                        "goals": 1, 
                        "shots": 25
                    }, 
                    "ratio": {
                        "attempts": 0.46601941747572817, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.46296296296296297
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 3441, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "RYAN NUGENT-HOPKINS", 
                    "number": "93", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 56, 
                        "goals": 2, 
                        "shots": 30
                    }, 
                    "dif": {
                        "attempts": -7, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 49, 
                        "goals": 1, 
                        "shots": 25
                    }, 
                    "ratio": {
                        "attempts": 0.4666666666666667, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.45454545454545453
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 3563, 
                "type": "miss"
            }
        ], 
        "goals": [
            {
                "against": {
                    "abv": "STL"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "RYAN NUGENT-HOPKINS", 
                    "number": "93", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 16, 
                        "goals": 0
                    }, 
                    "dif": {
                        "attempts": -3, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 13, 
                        "goals": 1
                    }, 
                    "ratio": {
                        "attempts": 0.4482758620689655
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1042, 
                "type": "goal"
            }
        ], 
        "number": 1, 
        "stats": {
            "goals": {
                "1": 1, 
                "2": 0, 
                "3": 0, 
                "4": 0, 
                "5": 0, 
                "reg": 1, 
                "total": 1
            }
        }, 
        "team": {
            "abv": "EDM"
        }
    }, 
    "home": 0, 
    "ratio": {
        "goals": {
            "1": 1, 
            "2": 0, 
            "3": 0, 
            "4": 0, 
            "5": 0, 
            "reg": 0, 
            "total": 0
        }
    }, 
    "results": {
        "gameLength": 3600, 
        "type": "REG", 
        "win": 0
    }, 
    "season": 2015
}
return data;}
