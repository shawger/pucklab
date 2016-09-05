// For test app the method for loading data changes.
// When the webserver is running, it will get it from there
// but for the static example, this is not possible so just 
// include the data inside this script.
// Get the url for the data.
//var urlString = String(window.location);

// The game structure is /game/season/team/gameNum.
// The data structure is /data/game/season/team/gameNum.
// so to get the data url replace /game with /data/game.

//var gameIndex = urlString.indexOf("/game");
//var reducedURL = urlString.slice(gameIndex);
//var dataURL = reducedURL.replace("/game", "/data/game");

// Open the json, parse and pass data to drawing functions.
//d3.json(dataURL, function(error, data) {
//    drawGameGraph(data);
//    statsGraph(data);
//});

var data = loadData();

drawGameGraph(data);
statsGraph(data);

//#############################################
// DRAWING FUNCTIONS
//#############################################

// Draw a graph that represents thee flow of a game using d3.
function drawGameGraph(data) {

    // Load the data
    // var data = loadData();
    // Store the length of the game.
    var gameLength = data.results.gameLength;

    // We want to put 'for' and 'against' events on the same graph so we need
    // to combine the events.
    // In this case we are combining 'attempts' for the entire game.
    var events = combineEvents(data, 'attempts', 0, gameLength);

    // Set size of graph
    var graphWidth = $("#game-graph")
        .width();
    var graphheight = $("#game-graph")
        .height();

    // Set the dimensions of the canvas / graph.
    var margin = {
            top: 30,
            right: 20,
            bottom: 30,
            left: 20
        },
        width = graphWidth - margin.left - margin.right,
        height = graphheight - margin.top - margin.bottom;

    // Setup x and y.
    var x = d3.scaleLinear()
        .range([width, 0]);
    var y = d3.scaleLinear()
        .range([0, height]);

    // Define the statline for attempts which is simply
    // the attempt dif vs time.
    var valueline = d3.line()
        .y(function(d) {
            return y(d.time);
        })
        .x(function(d) {
            return x(d.dif);
        });

    // Adds the svg canvas to the game-graph div and
    // setup position and margins.
    var svg = d3.select("#game-graph")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Scale the range of the data.
    // X should be the same magnitude in both the positive and negative
    // directions.
    var maxPosX = Math.abs(d3.max(events, function(d) {
        return d.dif;
    }));

    var maxNegX = Math.abs(d3.min(events, function(d) {
        return d.dif;
    }));

    var posX = 0;
    var negX = 0;

    if (maxPosX > maxNegX) { // Match the negX to the posX.
        posX = maxPosX;
        negX = -1 * maxPosX;
    } else {                // Match the posX to the negX.
        posX = maxNegX;
        negX = -1 * maxNegX;
    }

    y.domain([0, gameLength]);

    // For the x, and 6 (3 pos, 3 neg) to the domain, to give room
    // for goal indications (they could be outside the min or
    // max attempts).
    x.domain([negX - 3, posX + 3]);

    // Tooltip for a goal or attempt.
    // Tooltip will show when the attempt or goal icon is moused over.
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0]) // Shop tip above attempt or goal.
        .html(function(d) {

            // Time is in seconds since start. Convert to MM:SS.
            timeRaw = d.time;
            minutes = Math.abs(((timeRaw / 60) - 1))
                .toFixed(0)
                .toString();

            //Add a leading 0 if not there.
            if (minutes.length == 1) {
                minutes = '0' + minutes;
            }
            seconds = (timeRaw % 60).toString();

            // Add a leading 0 if not there.
            if (seconds.length == 1) {
                seconds = '0' + seconds;
            }
            time = minutes + ":" + seconds;

            // Determine the for/against teams.
            if (d.for) {
                team1 = d.team.abv;
                team2 = d.against.abv;
            } else {
                team1 = d.against.abv;
                team2 = d.team.abv;
            }

            // Return the html for a tooltip.
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

    // Set up the Y-axis.
    // There are actually 2 axis being setup:
    // -Periods (major)
    // -Minutes (minor)
    // For both of axis I needed to create a left and right
    // axis so they could extend left and right of the axis.

    // Y Axis left major.
    svg.append("g")
        .attr("class", "y-axis y-axis-left")
        .attr("transform", "translate(" + width / 2 + ",0)")
        .call(d3.axisLeft(y)
            .tickValues(majorAxis(0, gameLength))
            .tickFormat(function(d, i) {
                return majorAxisLabels(d, gameLength)
            })
            .tickSize(width / 2 - 30));

    // Y Axis right major.
    svg.append("g")
        .attr("class", "y-axis y-axis-right")
        .attr("transform", "translate(" + width / 2 + ",0)")
        .call(d3.axisRight(y)
            .tickValues(majorAxis(0, gameLength))
            .tickFormat(function(d, i) {
                return majorAxisLabels(d, gameLength)
            })
            .tickSize(width / 2 - 30));

    // Y Axis left minor.
    svg.append("g")
        .attr("class", "y-axis-sub y-axis-sub-right")
        .attr("transform", "translate(" + width / 2 + ",0)")
        .call(d3.axisRight(y)
            .tickValues(subMinorAxis(0, gameLength))
            .tickFormat(function(d, i) {
                "";
            }));

    // Y axis right minor.
    svg.append("g")
        .attr("class", "y-axis-sub y-axis-sub-left")
        .attr("transform", "translate(" + width / 2 + ",0)")
        .call(d3.axisLeft(y)
            .tickValues(subMinorAxis(0, gameLength))
            .tickFormat(function(d, i) {
                "";
            }));

    // Add a grid to the graph. Grid lines will represent
    // different attempt differences.
    // The tick labels are the abs value. Without this, anything
    // right of the 0 is negative. Instead of doing that, add
    // labels to the axis saying which team has the advantage.
    svg.append("g")
        .attr("class", "grid")
        .style("stroke-dasharray", ("3, 3"))
        .call(d3.axisTop(x)
            .scale(x)
            .ticks(5)
            .tickSize(-height, 0, 0)
            .tickFormat(function(d){return Math.abs(d)}))
            .attr('transform', 'translate(0,-3)');

    // Set up tooltip explaining what attempts are and how they are used
    var attemptsTip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html("Attempt difference is a good indicator<br>"+
              "of the flow of a game.<br><br>"+
              "The attempts for each team is calculated:<br><br>"+
              "  <i>goals + shots + misses + blocked shots</i><br><br>"+
              "Generally the bigger difference between<br>"+
              "attempts by a team and attempts by their<br>"+
              "opponent, represents a bigger advantage<br>"+
              " in play.");

    svg.call(attemptsTip);

    // Add labels to the x axis explaing which directions represent
    // the advantage for what team.
    svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate("+ (width/4) +",-20)")
            .text("<- " + data.for.team.abv + " Advantage")
            .on('mouseover', attemptsTip.show)
            .on('mouseout', attemptsTip.hide);

    svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate("+ (width - (width/4)) +",-20)")
            .text(data.against.team.abv + " Advantage ->")
            .on('mouseover', attemptsTip.show)
            .on('mouseout', attemptsTip.hide);

    // Add the statLine to the graph.
    var statLine = svg.append("path")
        .attr("class", "line")
        .attr("d", valueline(events));

    // Graph the points along the statline
    // Each point is a attempt. Different attempt
    // type have different symbols.
    // Add tooltips to the points as well.
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
            .size(15))
        .attr("transform", function(d) {
            return "translate(" + x(d.dif) + "," + y(d.time) + ")";
        })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);


    // Each goal is shown as a big dot, offset from the main statline
    // and connected to the statline with a line. For goals will be
    // right of the line, and against will be to the left.

    // For Goals - Lines
    var forGoalLines = svg.selectAll("line.forGoals")
        .data(data.for.goals)
        .enter()
        .append('line')
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
        .attr("stroke-width", "1")
        .attr("stroke", "grey")
        .attr("class", "forTeam");

    // For Goals - Circles
    // Select the for goals containers.
    var forNode = svg.selectAll("g forCircles")
        .data(data.for.goals)

    // Draw the for goals circles container.
    var forNodeEnter = forNode.enter()
        .append("g")
        .attr("class", "forTeamGoal")
        .attr("transform", function(d) {
            return "translate(" + (x(d.stats.dif.attempts) - 50) + "," + y(d.time) +
                ")";
        })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)

    // Draw the cirlcle in the for goals circles container.
    var forCircle = forNodeEnter.append("circle")
        .attr("r", 15)

    // Put the current goals scored by the scoring team in the
    // for goals circles container.
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
    // Select the against goals circle containers.
    var againstNode = svg.selectAll("g againstCircles")
        .data(data.against.goals)

    // Draw the against goals circle containers.
    var againstNodeEnter = againstNode.enter()
        .append("g")
        .attr("class", "againstTeamGoal")
        .attr("transform", function(d) {
            return "translate(" + (x(d.stats.dif.attempts) + 50) + "," + y(d.time) +
                ")";
        })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

    // Add circles to the against goals circle containers
    var forCircle = againstNodeEnter.append("circle")
        .attr("r", 15);

    // Add text describing the goals scored by the against team
    // to the against goals circle containers.
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

    // Add handlers for control of the graph.
    // Here, there are buttons that will zoom to periods.
    // The buttons will also change headings for the graph.
    $("#1-period")
        .click(function() {
            zoomGameGraph(data, 0, 1200, x, y, width, height);
            $("span#flow-title").text("1st Period Flow");
        });
    $("#2-period")
        .click(function() {
            zoomGameGraph(data, 1200, 2400, x, y, width, height);
            $("span#flow-title").text("2nd Period Flow");
        });
    $("#3-period")
        .click(function() {
            zoomGameGraph(data, 2400, 3600, x, y, width, height);
            $("span#flow-title").text("3rd Period Flow");
        });
    $("#ot-period")
        .click(function() {
            zoomGameGraph(data, 3600, gameLength, x, y, width, height);
            $("span#flow-title").text("OT Flow");
        });
    $("#all-period")
        .click(function() {
            zoomGameGraph(data, 0, gameLength, x, y, width, height);
            $("span#flow-title").text("Game Flow");
        });
}

// Zooms into a period on the game graph.
// The main line and plot points (based on attempts)
// will be shifted according to the starting value for a time
// period.
function zoomGameGraph(data, start, end, x, y, width, height) {

    // Store the length of the game
    var gameLength = data.results.gameLength;

    // Get the new data. Combine events will combine for
    // and against attempts into a single sorted list.
    // combineEvents will also only include events during the
    // specfied time.
    var events = combineEvents(data, 'attempts', start, end);

    // Apply a shift to the data. This way you can see the flow in the given
    // time frame easier.

    // Get the dif at the start
    var startDif = events[0].dif;

    // The shift is the negative value of the first dif
    if(events[0].for){
      var difShift = -startDif + 1;
    }
    else{
      var difShift = -startDif - 1;
    }

    // Shift the attempts to match the time period. Eg all periods
    // start with 0 and the attempt difference rather than the
    // attempt difference from the previous period.
    events = shiftEventsDif(events,difShift);

    // Get all the for goals during the time
    var forGoals = filterEvents(data.for.goals, start, end);

    // For drawing the goals, also include the shift so they
    // are displayed in the correct position.
    forGoals = shiftAttemptsDif(forGoals,difShift);

    // Get all the against goals for the time
    var againstGoals = filterEvents(data.against.goals, start, end);

    // For drawing the goals, also include the shift so they
    // are displayed in the correct position.
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

    // Setup the x and y domains to match the current data
    y.domain([start, end]);
    x.domain([negX - 3, posX + 3]);

    // Create the statline.
    // This is almost the same statline as for the initial drawing
    // accept it graphs the shifted dif rather than the actual dif.
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

    // Y Axis left primary
    var yAxisLeft = svg.transition()
        .select(".y-axis-left")
        .duration(750)
        .call(d3.axisLeft(y)
            .tickValues(majorAxis(start, end))
            .tickFormat(function(d, i) {
                return majorAxisLabels(d, gameLength)
            })
            .tickSize(width / 2 - 30));

    // Y Axis right primary
    var yAxisRight = svg.transition()
        .select(".y-axis-right")
        .duration(750)
        .call(d3.axisRight(y)
            .tickValues(majorAxis(start, end))
            .tickFormat(function(d, i) {
                return majorAxisLabels(d, gameLength)
            })
            .tickSize(width / 2 - 30));

    // Y Axis left sub
    var yAxisLeftSub = svg.transition()
        .select(".y-axis-sub-left")
        .duration(750)
        .call(d3.axisLeft(y)
            .tickValues(subMinorAxis(0, gameLength))
            .tickFormat(function(d, i) {
                "";
            }));

    // Y Axis right sub
    var yAxisRightSub = svg.transition()
        .select(".y-axis-sub-right")
        .duration(750)
        .call(d3.axisRight(y)
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

    // Calc the point size. The point size depends on the length of
    // the time if it is a period of less, the point size is 35,
    // 15 if not.
    var pointSize = 15;

    if(end-start <= 1200){
      pointSize = 35;
    }

    // The symbol of the point cannot be transformed easily,
    // So for the symbol of the point, simply re-draw before
    // moving the points.
    points.attr("d", d3.symbol()
            .type(function(d) {
              if (d.type == "goal") {
                  return d3.symbolDiamond;
              } else if (d.type == "shot") {
                  return d3.symbolCircle;
              } else {
                  return d3.symbolCross;
              }
            })
        .size(pointSize))

    // Move the points
    // Points moved will be set to visible. Everything else will
    // be hidden.
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
    // Goals moved will be set to visible. Everything else will
    // be hidden.
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

    // Move against goals.
    // Goals moved will be set to visible. Everything else will
    // be hidden.
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
    // Goal lines moved will be set to visible. Everything else will
    // be hidden.
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
    // Goal lines moved will be set to visible. Everything else will
    // be hidden.
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

// The stats grapg will compare selected stats for a team
// side by side using bars and numbers.
function statsGraph(data) {

    //Define the start and end of the games
    var start = 0;
    var end = data.results.gameLength;

    // Get the summary data
    var statSums = summaryStats(data, start, end);

    // Set the graph height and width
    var graphWidth = $("#game-stats")
        .width();
    var graphHeight = $("#game-stats")
        .height();

    // Set up the x and y for the graph
    var y = d3.scaleBand()
        .range([0, graphHeight])
        .padding(0.1);
    var x = d3.scaleLinear()
        .range([0, graphWidth]);

    // Draw the stats graph on the game-stats div.
    var svg = d3.select("#game-stats")
        .append("svg")
        .attr("width", graphWidth)
        .attr("height", graphHeight)

    // Setup the x and y domains

    // The y domain is a list of differnt stats
    y.domain(statSums.map(function(d) {
        return d.type;
    }));

    // The x domain will be 0-1 (all stats are graphed as a %)
    x.domain([0, 1]);

    // Add the bars
    svg.selectAll(".bar")
        .data(statSums)
        .enter()
        .append("rect")

        .attr("class", function(d) { // Style depends on for/against
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
            return x(d.ratio) / 2; // Width is 1/2 the chart
        })
        .attr("x", function(d) {
            if (d.for) { // For is on the left side (starts before 0.5)
                return graphWidth / 2 - x(d.ratio) / 2;
            } else { // Against is on the right side (stats at 0.5)
                return graphWidth / 2;
            }
        })
        .attr("height", y.bandwidth());

    // Add labels to the bars (the type of stat)
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

    // Add text to the bars to describe the stat
    // These values will be the stat total and the pct
    // of the stat.
    svg.selectAll(".bar-values")
        .data(statSums)
        .enter()
        .append("text")
        .attr("class", "bartext")
        .attr("text-anchor", "middle")
        .attr("y", function(d) {
            return y(d.type) + y.bandwidth() - 2;
        })
        .attr("x", function(d) {
          if (d.for) {
            return graphWidth / 4;}
          else{
            return graphWidth - (graphWidth / 4);}})
        .text(function(d) {
            return d.total + "(" + d.ratio.toFixed(2) + ")";
        })

    // Add handlers to the period buttons to allow user to zoom to a
    // period.
    // Also modify heading text.
    $("#1-period")
        .click(function() {
            zoomStats(data, 0, 1200, x, y);
            $("span#stats-title").text("1st Period Stats");
        });
    $("#2-period")
        .click(function() {
            zoomStats(data, 1200, 2400, x, y);
            $("span#stats-title").text("2nd Period Stats");
        });
    $("#3-period")
        .click(function() {
            zoomStats(data, 2400, 3600, x, y);
            $("span#stats-title").text("3rd Period Stats");
        });
    $("#ot-period")
        .click(function() {
            zoomStats(data, 3600, 3900, x, y);
            $("span#stats-title").text("OT Stats");
        });
    $("#all-period")
        .click(function() {
            zoomStats(data, 0, end, x, y);
            $("span#stats-title").text("Game Stats");
        });
}

// Zooms the stats graph to a certain period
// The stats diplayed will be specific to that period
function zoomStats(data, start, end, x, y) {

    // Get the stats for the time period
    var statSums = summaryStats(data, start, end);

    // Set the width and height of the graph
    var graphWidth = $("#game-stats")
        .width();
    var graphHeight = $("#game-stats")
        .height()

    // The y domain is a list of differnt stats
    y.domain(statSums.map(function(d) {
        return d.type;
    }));

    // The x domain is 0 to 1
    x.domain([0, 1]);

    // Select the game-stats div to modify (zoom)
    var svg = d3.select("#game-stats");

    // Select the bars and move them according to the
    // 'zoomed' data
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

    // Select the stat text and move along with the bars.
    var stats = svg.selectAll("text.bartext")
        .data(statSums);
    stats.transition()
        .text(function(d) {
            return d.total + "(" + d.ratio.toFixed(2) + ")";
        })
}
//#############################################
// UTILITY FUNCTIONS
//#############################################

// Load json data from page.
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
// the ticks are on the minutes (every 60s).
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
// time.
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
// during a certain time.
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

// Find stats over a given length of time
function summaryStats(data, start, end) {

    // The idea here is that every attempt also includes some stats
    // about the game so for
    // Get all the events (for and against) during a time period
    // The list of attempts is also sorted.
    var attempts = combineEvents(data, "attempts", start, end)

    //If there are no attempts return an empty list.
    if (attempts.length == 0) {
        return [];
    }

    // If there is only 1 event and the start is not 0, we can't
    // tell the stats during the time frame.
    if (attempts.length == 1 && start > 0) {
        return [];
    }

    // Here is where we make the stats.
    startAttempt = attempts[0];
    endAttempt = attempts[attempts.length - 1];

    // Create a list of stats to make
    stats = ['goals', 'attempts', 'shots'];

    var statSums = [];
    for (i = 0; i < stats.length; i++) {

        // Get the for stats
        var forStatStart = startAttempt.stats.for[stats[i]];

        // The first stat will include the stat in its summary
        // so we need to get rid of it.
        if (startAttempt.type + "s" == stats[i] && startAttempt.for == 1) {
            forStatStart = forStatStart - 1;
        }

        // Get the for stats.
        var forStatEnd = endAttempt.stats.for[stats[i]];

        // Get the against stats.
        var againstStatStart = startAttempt.stats.against[stats[i]];

        // The first stat will include the stat in its summary
        // so we need to get rid of it.
        if (startAttempt.type + "s" == stats[i] && startAttempt.for == 0) {
            againstStatStart = againstStatStart - 1;
        }
        // The end stat will just be the last stat
        var againstStatEnd = endAttempt.stats.against[stats[i]];

        // Calc the values.
        var forStat = forStatEnd - forStatStart;
        var againstStat = againstStatEnd - againstStatStart;
        var ratio = calcRatio(forStat, againstStat);

        // The against ratio will be 1-ratio unless the
        // forstat and the against stat are both 0.
        var againstRatio = 0;
        if (forStat > 0 || againstStat > 0) {
            againstRatio = 1 - ratio;
        }

        //Build the data structures and put into array.
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

// Create a ratio between 2 variables.
// If both variables a 0 return 0.
function calcRatio(varA, varB) {
    if (varA + varB == 0) {
        return 0;
    } else {
        return varA / (varA + varB);
    }
}

// Shift dif of events.
function shiftEventsDif(events,shift){

  for(i = 0; i < events.length;i++){
    events[i].difShift = events[i].dif + shift;
  }
  return events;
}

// Shift dif of a goal or attempt.
function shiftAttemptsDif(events,shift){
  for(i = 0; i < events.length;i++){
    events[i].stats.difShift = events[i].stats.dif.attempts + shift;
  }
  return events;
}

function loadData(){
return {
    "_id": "2015534h", 
    "against": {
        "attempts": [
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "MARK LETESTU", 
                    "number": "55", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 1, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "dif": {
                        "attempts": 7, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 8, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "ratio": {
                        "attempts": 0.8888888888888888, 
                        "goals": 0, 
                        "shots": 1.0
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 238, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "TEDDY PURCELL", 
                    "number": "16", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 2, 
                        "goals": 0, 
                        "shots": 1
                    }, 
                    "dif": {
                        "attempts": 6, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 8, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "ratio": {
                        "attempts": 0.8, 
                        "goals": 0, 
                        "shots": 0.8333333333333334
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 304, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "ERIC GRYBA", 
                    "number": "62", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 3, 
                        "goals": 0, 
                        "shots": 1
                    }, 
                    "dif": {
                        "attempts": 5, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 8, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "ratio": {
                        "attempts": 0.7272727272727273, 
                        "goals": 0, 
                        "shots": 0.8333333333333334
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 311, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "MATT HENDRICKS", 
                    "number": "23", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 4, 
                        "goals": 0, 
                        "shots": 1
                    }, 
                    "dif": {
                        "attempts": 6, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 10, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "ratio": {
                        "attempts": 0.7142857142857143, 
                        "goals": 0, 
                        "shots": 0.8333333333333334
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 395, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "IIRO PAKARINEN", 
                    "number": "26", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 5, 
                        "goals": 0, 
                        "shots": 1
                    }, 
                    "dif": {
                        "attempts": 5, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 10, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "ratio": {
                        "attempts": 0.6666666666666666, 
                        "goals": 0, 
                        "shots": 0.8333333333333334
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 402, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "LAURI KORPIKOSKI", 
                    "number": "28", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 6, 
                        "goals": 0, 
                        "shots": 1
                    }, 
                    "dif": {
                        "attempts": 8, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 14, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "ratio": {
                        "attempts": 0.7, 
                        "goals": 0, 
                        "shots": 0.8571428571428571
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 518, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "LAURI KORPIKOSKI", 
                    "number": "28", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 7, 
                        "goals": 0, 
                        "shots": 1
                    }, 
                    "dif": {
                        "attempts": 7, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 14, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "ratio": {
                        "attempts": 0.6666666666666666, 
                        "goals": 0, 
                        "shots": 0.8571428571428571
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 523, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "MATT HENDRICKS", 
                    "number": "23", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 8, 
                        "goals": 0, 
                        "shots": 2
                    }, 
                    "dif": {
                        "attempts": 6, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 14, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "ratio": {
                        "attempts": 0.6363636363636364, 
                        "goals": 0, 
                        "shots": 0.75
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 530, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "RYAN NUGENT-HOPKINS", 
                    "number": "93", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 9, 
                        "goals": 0, 
                        "shots": 2
                    }, 
                    "dif": {
                        "attempts": 6, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 15, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "ratio": {
                        "attempts": 0.625, 
                        "goals": 0, 
                        "shots": 0.7777777777777778
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 578, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "DARNELL NURSE", 
                    "number": "25", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 10, 
                        "goals": 0, 
                        "shots": 2
                    }, 
                    "dif": {
                        "attempts": 5, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 15, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "ratio": {
                        "attempts": 0.6, 
                        "goals": 0, 
                        "shots": 0.7777777777777778
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 584, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "JORDAN EBERLE", 
                    "number": "14", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 11, 
                        "goals": 0, 
                        "shots": 3
                    }, 
                    "dif": {
                        "attempts": 4, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 15, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "ratio": {
                        "attempts": 0.5769230769230769, 
                        "goals": 0, 
                        "shots": 0.7
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 593, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "ANDREJ SEKERA", 
                    "number": "2", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 12, 
                        "goals": 0, 
                        "shots": 3
                    }, 
                    "dif": {
                        "attempts": 3, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 15, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "ratio": {
                        "attempts": 0.5555555555555556, 
                        "goals": 0, 
                        "shots": 0.7
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 644, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "IIRO PAKARINEN", 
                    "number": "26", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 13, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 15, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "ratio": {
                        "attempts": 0.5357142857142857, 
                        "goals": 0, 
                        "shots": 0.6363636363636364
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 681, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "NIKITA NIKITIN", 
                    "number": "86", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 14, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 15, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "ratio": {
                        "attempts": 0.5172413793103449, 
                        "goals": 0, 
                        "shots": 0.6363636363636364
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 692, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "JUSTIN SCHULTZ", 
                    "number": "19", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 15, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 15, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0, 
                        "shots": 0.6363636363636364
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 698, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "DARNELL NURSE", 
                    "number": "25", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 16, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 15, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "ratio": {
                        "attempts": 0.4838709677419355, 
                        "goals": 0, 
                        "shots": 0.6363636363636364
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 705, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "ANDREJ SEKERA", 
                    "number": "2", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 17, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": -2, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 15, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "ratio": {
                        "attempts": 0.46875, 
                        "goals": 0, 
                        "shots": 0.6363636363636364
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 796, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "TAYLOR HALL", 
                    "number": "4", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 18, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": -3, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 15, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "ratio": {
                        "attempts": 0.45454545454545453, 
                        "goals": 0, 
                        "shots": 0.5833333333333334
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 815, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BENOIT POULIOT", 
                    "number": "67", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 19, 
                        "goals": 1, 
                        "shots": 6
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 19, 
                        "goals": 0, 
                        "shots": 9
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.0, 
                        "shots": 0.6
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 981, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BENOIT POULIOT", 
                    "number": "67", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 20, 
                        "goals": 2, 
                        "shots": 7
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 19, 
                        "goals": 0, 
                        "shots": 9
                    }, 
                    "ratio": {
                        "attempts": 0.48717948717948717, 
                        "goals": 0.0, 
                        "shots": 0.5625
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1091, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "TAYLOR HALL", 
                    "number": "4", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 21, 
                        "goals": 2, 
                        "shots": 8
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 20, 
                        "goals": 0, 
                        "shots": 10
                    }, 
                    "ratio": {
                        "attempts": 0.4878048780487805, 
                        "goals": 0.0, 
                        "shots": 0.5555555555555556
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1199, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BENOIT POULIOT", 
                    "number": "67", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 22, 
                        "goals": 2, 
                        "shots": 9
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 21, 
                        "goals": 0, 
                        "shots": 10
                    }, 
                    "ratio": {
                        "attempts": 0.4883720930232558, 
                        "goals": 0.0, 
                        "shots": 0.5263157894736842
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1268, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BENOIT POULIOT", 
                    "number": "67", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 23, 
                        "goals": 2, 
                        "shots": 10
                    }, 
                    "dif": {
                        "attempts": -2, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 21, 
                        "goals": 0, 
                        "shots": 10
                    }, 
                    "ratio": {
                        "attempts": 0.4772727272727273, 
                        "goals": 0.0, 
                        "shots": 0.5
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1290, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "ERIC GRYBA", 
                    "number": "62", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 24, 
                        "goals": 2, 
                        "shots": 10
                    }, 
                    "dif": {
                        "attempts": -3, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 21, 
                        "goals": 0, 
                        "shots": 10
                    }, 
                    "ratio": {
                        "attempts": 0.4666666666666667, 
                        "goals": 0.0, 
                        "shots": 0.5
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1296, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "TEDDY PURCELL", 
                    "number": "16", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 25, 
                        "goals": 2, 
                        "shots": 11
                    }, 
                    "dif": {
                        "attempts": -4, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 21, 
                        "goals": 0, 
                        "shots": 10
                    }, 
                    "ratio": {
                        "attempts": 0.45652173913043476, 
                        "goals": 0.0, 
                        "shots": 0.47619047619047616
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1366, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "TAYLOR HALL", 
                    "number": "4", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 26, 
                        "goals": 2, 
                        "shots": 11
                    }, 
                    "dif": {
                        "attempts": -5, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 21, 
                        "goals": 0, 
                        "shots": 10
                    }, 
                    "ratio": {
                        "attempts": 0.44680851063829785, 
                        "goals": 0.0, 
                        "shots": 0.47619047619047616
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1367, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BENOIT POULIOT", 
                    "number": "67", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 27, 
                        "goals": 2, 
                        "shots": 12
                    }, 
                    "dif": {
                        "attempts": -5, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 22, 
                        "goals": 1, 
                        "shots": 11
                    }, 
                    "ratio": {
                        "attempts": 0.4489795918367347, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.4782608695652174
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1421, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "NIKITA NIKITIN", 
                    "number": "86", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 28, 
                        "goals": 2, 
                        "shots": 12
                    }, 
                    "dif": {
                        "attempts": -6, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 22, 
                        "goals": 1, 
                        "shots": 11
                    }, 
                    "ratio": {
                        "attempts": 0.44, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.4782608695652174
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1426, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "LAURI KORPIKOSKI", 
                    "number": "28", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 29, 
                        "goals": 2, 
                        "shots": 13
                    }, 
                    "dif": {
                        "attempts": -7, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 22, 
                        "goals": 1, 
                        "shots": 11
                    }, 
                    "ratio": {
                        "attempts": 0.43137254901960786, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.4583333333333333
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1462, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "TAYLOR HALL", 
                    "number": "4", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 30, 
                        "goals": 2, 
                        "shots": 14
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 29, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "ratio": {
                        "attempts": 0.4915254237288136, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5483870967741935
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1629, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "TEDDY PURCELL", 
                    "number": "16", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 31, 
                        "goals": 3, 
                        "shots": 15
                    }, 
                    "dif": {
                        "attempts": 5, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 36, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "ratio": {
                        "attempts": 0.5373134328358209, 
                        "goals": 0.25, 
                        "shots": 0.5945945945945946
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1821, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "ANDREJ SEKERA", 
                    "number": "2", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 32, 
                        "goals": 3, 
                        "shots": 16
                    }, 
                    "dif": {
                        "attempts": 5, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 37, 
                        "goals": 1, 
                        "shots": 23
                    }, 
                    "ratio": {
                        "attempts": 0.5362318840579711, 
                        "goals": 0.25, 
                        "shots": 0.5897435897435898
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1859, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "ANDREJ SEKERA", 
                    "number": "2", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 33, 
                        "goals": 3, 
                        "shots": 16
                    }, 
                    "dif": {
                        "attempts": 4, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 37, 
                        "goals": 1, 
                        "shots": 23
                    }, 
                    "ratio": {
                        "attempts": 0.5285714285714286, 
                        "goals": 0.25, 
                        "shots": 0.5897435897435898
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1874, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BENOIT POULIOT", 
                    "number": "67", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 34, 
                        "goals": 3, 
                        "shots": 16
                    }, 
                    "dif": {
                        "attempts": 3, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 37, 
                        "goals": 1, 
                        "shots": 23
                    }, 
                    "ratio": {
                        "attempts": 0.5211267605633803, 
                        "goals": 0.25, 
                        "shots": 0.5897435897435898
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1895, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BENOIT POULIOT", 
                    "number": "67", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 35, 
                        "goals": 3, 
                        "shots": 16
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 37, 
                        "goals": 1, 
                        "shots": 23
                    }, 
                    "ratio": {
                        "attempts": 0.5138888888888888, 
                        "goals": 0.25, 
                        "shots": 0.5897435897435898
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1915, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "MARK LETESTU", 
                    "number": "55", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 36, 
                        "goals": 3, 
                        "shots": 17
                    }, 
                    "dif": {
                        "attempts": 4, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 40, 
                        "goals": 2, 
                        "shots": 25
                    }, 
                    "ratio": {
                        "attempts": 0.5263157894736842, 
                        "goals": 0.4, 
                        "shots": 0.5952380952380952
                    }
                }, 
                "strength": "PP", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2002, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BENOIT POULIOT", 
                    "number": "67", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 37, 
                        "goals": 3, 
                        "shots": 17
                    }, 
                    "dif": {
                        "attempts": 3, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 40, 
                        "goals": 2, 
                        "shots": 25
                    }, 
                    "ratio": {
                        "attempts": 0.5194805194805194, 
                        "goals": 0.4, 
                        "shots": 0.5952380952380952
                    }
                }, 
                "strength": "PP", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2007, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "TEDDY PURCELL", 
                    "number": "16", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 38, 
                        "goals": 3, 
                        "shots": 18
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 40, 
                        "goals": 2, 
                        "shots": 25
                    }, 
                    "ratio": {
                        "attempts": 0.5128205128205128, 
                        "goals": 0.4, 
                        "shots": 0.5813953488372093
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2075, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "LUKE GAZDIC", 
                    "number": "20", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 39, 
                        "goals": 3, 
                        "shots": 18
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 40, 
                        "goals": 2, 
                        "shots": 25
                    }, 
                    "ratio": {
                        "attempts": 0.5063291139240507, 
                        "goals": 0.4, 
                        "shots": 0.5813953488372093
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2108, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "IIRO PAKARINEN", 
                    "number": "26", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 40, 
                        "goals": 3, 
                        "shots": 19
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 40, 
                        "goals": 2, 
                        "shots": 25
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.4, 
                        "shots": 0.5681818181818182
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2122, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BENOIT POULIOT", 
                    "number": "67", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 41, 
                        "goals": 3, 
                        "shots": 19
                    }, 
                    "dif": {
                        "attempts": 5, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 46, 
                        "goals": 3, 
                        "shots": 29
                    }, 
                    "ratio": {
                        "attempts": 0.5287356321839081, 
                        "goals": 0.5, 
                        "shots": 0.6041666666666666
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2312, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "JORDAN EBERLE", 
                    "number": "14", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 42, 
                        "goals": 3, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 4, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 46, 
                        "goals": 3, 
                        "shots": 29
                    }, 
                    "ratio": {
                        "attempts": 0.5227272727272727, 
                        "goals": 0.5, 
                        "shots": 0.5918367346938775
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2327, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "JORDAN EBERLE", 
                    "number": "14", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 43, 
                        "goals": 3, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 3, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 46, 
                        "goals": 3, 
                        "shots": 29
                    }, 
                    "ratio": {
                        "attempts": 0.5168539325842697, 
                        "goals": 0.5, 
                        "shots": 0.5918367346938775
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2333, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "MATT HENDRICKS", 
                    "number": "23", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 44, 
                        "goals": 3, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 4, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 48, 
                        "goals": 4, 
                        "shots": 30
                    }, 
                    "ratio": {
                        "attempts": 0.5217391304347826, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.6
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2482, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "LAURI KORPIKOSKI", 
                    "number": "28", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 45, 
                        "goals": 3, 
                        "shots": 21
                    }, 
                    "dif": {
                        "attempts": 3, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 48, 
                        "goals": 4, 
                        "shots": 30
                    }, 
                    "ratio": {
                        "attempts": 0.5161290322580645, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5882352941176471
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2492, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "MARK LETESTU", 
                    "number": "55", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 46, 
                        "goals": 3, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 48, 
                        "goals": 4, 
                        "shots": 30
                    }, 
                    "ratio": {
                        "attempts": 0.5106382978723404, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5769230769230769
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2499, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "MATT HENDRICKS", 
                    "number": "23", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 47, 
                        "goals": 3, 
                        "shots": 23
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 48, 
                        "goals": 4, 
                        "shots": 30
                    }, 
                    "ratio": {
                        "attempts": 0.5052631578947369, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5660377358490566
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2500, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "ERIC GRYBA", 
                    "number": "62", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 48, 
                        "goals": 3, 
                        "shots": 23
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 48, 
                        "goals": 4, 
                        "shots": 30
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5660377358490566
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2510, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "NIKITA NIKITIN", 
                    "number": "86", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 49, 
                        "goals": 3, 
                        "shots": 23
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 48, 
                        "goals": 4, 
                        "shots": 30
                    }, 
                    "ratio": {
                        "attempts": 0.4948453608247423, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5660377358490566
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2513, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "DARNELL NURSE", 
                    "number": "25", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 50, 
                        "goals": 3, 
                        "shots": 23
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 51, 
                        "goals": 4, 
                        "shots": 31
                    }, 
                    "ratio": {
                        "attempts": 0.504950495049505, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5740740740740741
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2607, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "TAYLOR HALL", 
                    "number": "4", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 51, 
                        "goals": 3, 
                        "shots": 23
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 52, 
                        "goals": 4, 
                        "shots": 31
                    }, 
                    "ratio": {
                        "attempts": 0.5048543689320388, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5740740740740741
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2691, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "JUSTIN SCHULTZ", 
                    "number": "19", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 52, 
                        "goals": 3, 
                        "shots": 24
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 52, 
                        "goals": 4, 
                        "shots": 31
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5636363636363636
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2700, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "RYAN NUGENT-HOPKINS", 
                    "number": "93", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 53, 
                        "goals": 3, 
                        "shots": 24
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 52, 
                        "goals": 4, 
                        "shots": 31
                    }, 
                    "ratio": {
                        "attempts": 0.49523809523809526, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5636363636363636
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2785, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "MATT HENDRICKS", 
                    "number": "23", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 54, 
                        "goals": 3, 
                        "shots": 25
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 54, 
                        "goals": 4, 
                        "shots": 31
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5535714285714286
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 2910, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BENOIT POULIOT", 
                    "number": "67", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 55, 
                        "goals": 3, 
                        "shots": 25
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 55, 
                        "goals": 4, 
                        "shots": 31
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5535714285714286
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 3006, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "JORDAN EBERLE", 
                    "number": "14", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 56, 
                        "goals": 3, 
                        "shots": 26
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 55, 
                        "goals": 4, 
                        "shots": 31
                    }, 
                    "ratio": {
                        "attempts": 0.4954954954954955, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.543859649122807
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 3043, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "TAYLOR HALL", 
                    "number": "4", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 57, 
                        "goals": 3, 
                        "shots": 26
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 59, 
                        "goals": 4, 
                        "shots": 33
                    }, 
                    "ratio": {
                        "attempts": 0.5086206896551724, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.559322033898305
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 3253, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "TEDDY PURCELL", 
                    "number": "16", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 58, 
                        "goals": 3, 
                        "shots": 27
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 59, 
                        "goals": 4, 
                        "shots": 33
                    }, 
                    "ratio": {
                        "attempts": 0.5042735042735043, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.55
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 3263, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "RYAN NUGENT-HOPKINS", 
                    "number": "93", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 59, 
                        "goals": 3, 
                        "shots": 27
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 59, 
                        "goals": 4, 
                        "shots": 33
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.55
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 3305, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "TAYLOR HALL", 
                    "number": "4", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 60, 
                        "goals": 3, 
                        "shots": 28
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 59, 
                        "goals": 4, 
                        "shots": 33
                    }, 
                    "ratio": {
                        "attempts": 0.4957983193277311, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5409836065573771
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 3348, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "TEDDY PURCELL", 
                    "number": "16", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 61, 
                        "goals": 3, 
                        "shots": 29
                    }, 
                    "dif": {
                        "attempts": -2, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 59, 
                        "goals": 4, 
                        "shots": 33
                    }, 
                    "ratio": {
                        "attempts": 0.49166666666666664, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.532258064516129
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 3356, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "DARNELL NURSE", 
                    "number": "25", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 62, 
                        "goals": 3, 
                        "shots": 29
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 61, 
                        "goals": 4, 
                        "shots": 35
                    }, 
                    "ratio": {
                        "attempts": 0.4959349593495935, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.546875
                    }
                }, 
                "strength": "SH", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 3404, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "MARK LETESTU", 
                    "number": "55", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 63, 
                        "goals": 3, 
                        "shots": 30
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 2
                    }, 
                    "for": {
                        "attempts": 64, 
                        "goals": 5, 
                        "shots": 37
                    }, 
                    "ratio": {
                        "attempts": 0.5039370078740157, 
                        "goals": 0.625, 
                        "shots": 0.5522388059701493
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 3560, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "TEDDY PURCELL", 
                    "number": "16", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 64, 
                        "goals": 3, 
                        "shots": 30
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 2
                    }, 
                    "for": {
                        "attempts": 64, 
                        "goals": 5, 
                        "shots": 37
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.625, 
                        "shots": 0.5522388059701493
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 3574, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "TAYLOR HALL", 
                    "number": "4", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 65, 
                        "goals": 3, 
                        "shots": 31
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": 2
                    }, 
                    "for": {
                        "attempts": 64, 
                        "goals": 5, 
                        "shots": 37
                    }, 
                    "ratio": {
                        "attempts": 0.49612403100775193, 
                        "goals": 0.625, 
                        "shots": 0.5441176470588235
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 3594, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "DARNELL NURSE", 
                    "number": "25", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 66, 
                        "goals": 3, 
                        "shots": 31
                    }, 
                    "dif": {
                        "attempts": -2, 
                        "goals": 2
                    }, 
                    "for": {
                        "attempts": 64, 
                        "goals": 5, 
                        "shots": 37
                    }, 
                    "ratio": {
                        "attempts": 0.49230769230769234, 
                        "goals": 0.625, 
                        "shots": 0.5441176470588235
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 3598, 
                "type": "miss"
            }
        ], 
        "goals": [
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BENOIT POULIOT", 
                    "number": "67", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 19, 
                        "goals": 1
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 19, 
                        "goals": 0
                    }, 
                    "ratio": {
                        "attempts": 0.5
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 981, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BENOIT POULIOT", 
                    "number": "67", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 20, 
                        "goals": 2
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 19, 
                        "goals": 0
                    }, 
                    "ratio": {
                        "attempts": 0.48717948717948717
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1091, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "TEDDY PURCELL", 
                    "number": "16", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 31, 
                        "goals": 3
                    }, 
                    "dif": {
                        "attempts": 5, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 36, 
                        "goals": 1
                    }, 
                    "ratio": {
                        "attempts": 0.5373134328358209
                    }
                }, 
                "team": {
                    "abv": "EDM"
                }, 
                "time": 1821, 
                "type": "goal"
            }
        ], 
        "stats": {
            "goals": {
                "1": 2, 
                "2": 1, 
                "3": 0, 
                "4": 0, 
                "5": 0, 
                "reg": 3, 
                "total": 3
            }
        }, 
        "team": {
            "abv": "EDM"
        }
    }, 
    "date": "2015-12-27", 
    "for": {
        "attempts": [
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "SEAN MONAHAN", 
                    "number": "23", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 0, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 1, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "ratio": {
                        "attempts": 1.0, 
                        "goals": 0, 
                        "shots": 0
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 78, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "MASON RAYMOND", 
                    "number": "21", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 0, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 2, 
                        "goals": 0, 
                        "shots": 1
                    }, 
                    "ratio": {
                        "attempts": 1.0, 
                        "goals": 0, 
                        "shots": 1.0
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 82, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "MASON RAYMOND", 
                    "number": "21", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 0, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "dif": {
                        "attempts": 3, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 3, 
                        "goals": 0, 
                        "shots": 2
                    }, 
                    "ratio": {
                        "attempts": 1.0, 
                        "goals": 0, 
                        "shots": 1.0
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 109, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "DOUGIE HAMILTON", 
                    "number": "27", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 0, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "dif": {
                        "attempts": 4, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 4, 
                        "goals": 0, 
                        "shots": 2
                    }, 
                    "ratio": {
                        "attempts": 1.0, 
                        "goals": 0, 
                        "shots": 1.0
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 115, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "KRIS RUSSELL", 
                    "number": "4", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 0, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "dif": {
                        "attempts": 5, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 5, 
                        "goals": 0, 
                        "shots": 3
                    }, 
                    "ratio": {
                        "attempts": 1.0, 
                        "goals": 0, 
                        "shots": 1.0
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 124, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "DERYK ENGELLAND", 
                    "number": "29", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 0, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "dif": {
                        "attempts": 6, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 6, 
                        "goals": 0, 
                        "shots": 3
                    }, 
                    "ratio": {
                        "attempts": 1.0, 
                        "goals": 0, 
                        "shots": 1.0
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 132, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JOHNNY GAUDREAU", 
                    "number": "13", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 0, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "dif": {
                        "attempts": 7, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 7, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "ratio": {
                        "attempts": 1.0, 
                        "goals": 0, 
                        "shots": 1.0
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 197, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JIRI HUDLER", 
                    "number": "24", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 0, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "dif": {
                        "attempts": 8, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 8, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "ratio": {
                        "attempts": 1.0, 
                        "goals": 0, 
                        "shots": 1.0
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 204, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "KRIS RUSSELL", 
                    "number": "4", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 3, 
                        "goals": 0, 
                        "shots": 1
                    }, 
                    "dif": {
                        "attempts": 6, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 9, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "ratio": {
                        "attempts": 0.75, 
                        "goals": 0, 
                        "shots": 0.8333333333333334
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 328, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "LANCE BOUMA", 
                    "number": "17", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 3, 
                        "goals": 0, 
                        "shots": 1
                    }, 
                    "dif": {
                        "attempts": 7, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 10, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "ratio": {
                        "attempts": 0.7692307692307693, 
                        "goals": 0, 
                        "shots": 0.8333333333333334
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 344, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JOHNNY GAUDREAU", 
                    "number": "13", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 5, 
                        "goals": 0, 
                        "shots": 1
                    }, 
                    "dif": {
                        "attempts": 6, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 11, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "ratio": {
                        "attempts": 0.6875, 
                        "goals": 0, 
                        "shots": 0.8571428571428571
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 417, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "KRIS RUSSELL", 
                    "number": "4", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 5, 
                        "goals": 0, 
                        "shots": 1
                    }, 
                    "dif": {
                        "attempts": 7, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 12, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "ratio": {
                        "attempts": 0.7058823529411765, 
                        "goals": 0, 
                        "shots": 0.8571428571428571
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 466, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "MARKUS GRANLUND", 
                    "number": "60", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 5, 
                        "goals": 0, 
                        "shots": 1
                    }, 
                    "dif": {
                        "attempts": 8, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 13, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "ratio": {
                        "attempts": 0.7222222222222222, 
                        "goals": 0, 
                        "shots": 0.8571428571428571
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 484, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "SAM BENNETT", 
                    "number": "93", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 5, 
                        "goals": 0, 
                        "shots": 1
                    }, 
                    "dif": {
                        "attempts": 9, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 14, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "ratio": {
                        "attempts": 0.7368421052631579, 
                        "goals": 0, 
                        "shots": 0.8571428571428571
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 496, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "DENNIS WIDEMAN", 
                    "number": "6", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 8, 
                        "goals": 0, 
                        "shots": 2
                    }, 
                    "dif": {
                        "attempts": 7, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 15, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "ratio": {
                        "attempts": 0.6521739130434783, 
                        "goals": 0, 
                        "shots": 0.7777777777777778
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 570, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "MIKAEL BACKLUND", 
                    "number": "11", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 18, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": -2, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 16, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "ratio": {
                        "attempts": 0.47058823529411764, 
                        "goals": 0, 
                        "shots": 0.5833333333333334
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 828, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "TJ BRODIE", 
                    "number": "7", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 18, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 17, 
                        "goals": 0, 
                        "shots": 8
                    }, 
                    "ratio": {
                        "attempts": 0.4857142857142857, 
                        "goals": 0, 
                        "shots": 0.6153846153846154
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 850, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "SAM BENNETT", 
                    "number": "93", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 18, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 18, 
                        "goals": 0, 
                        "shots": 9
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0, 
                        "shots": 0.6428571428571429
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 867, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "DERYK ENGELLAND", 
                    "number": "29", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 18, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 19, 
                        "goals": 0, 
                        "shots": 9
                    }, 
                    "ratio": {
                        "attempts": 0.5135135135135135, 
                        "goals": 0, 
                        "shots": 0.6428571428571429
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 873, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "MICHEAL FERLAND", 
                    "number": "79", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 20, 
                        "goals": 2, 
                        "shots": 7
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 20, 
                        "goals": 0, 
                        "shots": 10
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.0, 
                        "shots": 0.5882352941176471
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1182, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JIRI HUDLER", 
                    "number": "24", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 21, 
                        "goals": 2, 
                        "shots": 8
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 21, 
                        "goals": 0, 
                        "shots": 10
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.0, 
                        "shots": 0.5555555555555556
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1259, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JOHNNY GAUDREAU", 
                    "number": "13", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 26, 
                        "goals": 2, 
                        "shots": 11
                    }, 
                    "dif": {
                        "attempts": -4, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 22, 
                        "goals": 1, 
                        "shots": 11
                    }, 
                    "ratio": {
                        "attempts": 0.4583333333333333, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1390, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "KRIS RUSSELL", 
                    "number": "4", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 29, 
                        "goals": 2, 
                        "shots": 13
                    }, 
                    "dif": {
                        "attempts": -6, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 23, 
                        "goals": 1, 
                        "shots": 12
                    }, 
                    "ratio": {
                        "attempts": 0.4423076923076923, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.48
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1479, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "SAM BENNETT", 
                    "number": "93", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 29, 
                        "goals": 2, 
                        "shots": 13
                    }, 
                    "dif": {
                        "attempts": -5, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 24, 
                        "goals": 1, 
                        "shots": 12
                    }, 
                    "ratio": {
                        "attempts": 0.4528301886792453, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.48
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1497, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "MARKUS GRANLUND", 
                    "number": "60", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 29, 
                        "goals": 2, 
                        "shots": 13
                    }, 
                    "dif": {
                        "attempts": -4, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 25, 
                        "goals": 1, 
                        "shots": 13
                    }, 
                    "ratio": {
                        "attempts": 0.46296296296296297, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1510, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JIRI HUDLER", 
                    "number": "24", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 29, 
                        "goals": 2, 
                        "shots": 13
                    }, 
                    "dif": {
                        "attempts": -3, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 26, 
                        "goals": 1, 
                        "shots": 14
                    }, 
                    "ratio": {
                        "attempts": 0.4727272727272727, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5185185185185185
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1541, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "TJ BRODIE", 
                    "number": "7", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 29, 
                        "goals": 2, 
                        "shots": 13
                    }, 
                    "dif": {
                        "attempts": -2, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 27, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "ratio": {
                        "attempts": 0.48214285714285715, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5357142857142857
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1548, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "MIKAEL BACKLUND", 
                    "number": "11", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 29, 
                        "goals": 2, 
                        "shots": 13
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 16
                    }, 
                    "ratio": {
                        "attempts": 0.49122807017543857, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5517241379310345
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1570, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JOHNNY GAUDREAU", 
                    "number": "13", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 29, 
                        "goals": 2, 
                        "shots": 13
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 29, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5666666666666667
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1604, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "SEAN MONAHAN", 
                    "number": "23", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 30, 
                        "goals": 2, 
                        "shots": 14
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 30, 
                        "goals": 1, 
                        "shots": 18
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5625
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1638, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "MARK GIORDANO", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 30, 
                        "goals": 2, 
                        "shots": 14
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 31, 
                        "goals": 1, 
                        "shots": 18
                    }, 
                    "ratio": {
                        "attempts": 0.5081967213114754, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5625
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1646, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "MARK GIORDANO", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 30, 
                        "goals": 2, 
                        "shots": 14
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 32, 
                        "goals": 1, 
                        "shots": 19
                    }, 
                    "ratio": {
                        "attempts": 0.5161290322580645, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5757575757575758
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1653, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "MATT STAJAN", 
                    "number": "18", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 30, 
                        "goals": 2, 
                        "shots": 14
                    }, 
                    "dif": {
                        "attempts": 3, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 33, 
                        "goals": 1, 
                        "shots": 20
                    }, 
                    "ratio": {
                        "attempts": 0.5238095238095238, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5882352941176471
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1674, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "SAM BENNETT", 
                    "number": "93", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 30, 
                        "goals": 2, 
                        "shots": 14
                    }, 
                    "dif": {
                        "attempts": 4, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 34, 
                        "goals": 1, 
                        "shots": 21
                    }, 
                    "ratio": {
                        "attempts": 0.53125, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.6
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1688, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "SAM BENNETT", 
                    "number": "93", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 30, 
                        "goals": 2, 
                        "shots": 14
                    }, 
                    "dif": {
                        "attempts": 5, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 35, 
                        "goals": 1, 
                        "shots": 21
                    }, 
                    "ratio": {
                        "attempts": 0.5384615384615384, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.6
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1689, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "DENNIS WIDEMAN", 
                    "number": "6", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 30, 
                        "goals": 2, 
                        "shots": 14
                    }, 
                    "dif": {
                        "attempts": 6, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 36, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "ratio": {
                        "attempts": 0.5454545454545454, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.6111111111111112
                    }
                }, 
                "strength": "PP", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1729, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "DAVID JONES", 
                    "number": "19", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 31, 
                        "goals": 3, 
                        "shots": 15
                    }, 
                    "dif": {
                        "attempts": 6, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 37, 
                        "goals": 1, 
                        "shots": 23
                    }, 
                    "ratio": {
                        "attempts": 0.5441176470588235, 
                        "goals": 0.25, 
                        "shots": 0.6052631578947368
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1849, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "MARKUS GRANLUND", 
                    "number": "60", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 35, 
                        "goals": 3, 
                        "shots": 16
                    }, 
                    "dif": {
                        "attempts": 3, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 38, 
                        "goals": 1, 
                        "shots": 24
                    }, 
                    "ratio": {
                        "attempts": 0.5205479452054794, 
                        "goals": 0.25, 
                        "shots": 0.6
                    }
                }, 
                "strength": "SH", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1968, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "MATT STAJAN", 
                    "number": "18", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 35, 
                        "goals": 3, 
                        "shots": 16
                    }, 
                    "dif": {
                        "attempts": 4, 
                        "goals": -2
                    }, 
                    "for": {
                        "attempts": 39, 
                        "goals": 1, 
                        "shots": 24
                    }, 
                    "ratio": {
                        "attempts": 0.527027027027027, 
                        "goals": 0.25, 
                        "shots": 0.6
                    }
                }, 
                "strength": "PP", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1971, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "MATT STAJAN", 
                    "number": "18", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 35, 
                        "goals": 3, 
                        "shots": 16
                    }, 
                    "dif": {
                        "attempts": 5, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 40, 
                        "goals": 2, 
                        "shots": 25
                    }, 
                    "ratio": {
                        "attempts": 0.5333333333333333, 
                        "goals": 0.4, 
                        "shots": 0.6097560975609756
                    }
                }, 
                "strength": "SH", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1972, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "MASON RAYMOND", 
                    "number": "21", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 40, 
                        "goals": 3, 
                        "shots": 19
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 41, 
                        "goals": 2, 
                        "shots": 25
                    }, 
                    "ratio": {
                        "attempts": 0.5061728395061729, 
                        "goals": 0.4, 
                        "shots": 0.5681818181818182
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2141, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "DENNIS WIDEMAN", 
                    "number": "6", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 40, 
                        "goals": 3, 
                        "shots": 19
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 42, 
                        "goals": 2, 
                        "shots": 25
                    }, 
                    "ratio": {
                        "attempts": 0.5121951219512195, 
                        "goals": 0.4, 
                        "shots": 0.5681818181818182
                    }
                }, 
                "strength": "SH", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2157, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "SEAN MONAHAN", 
                    "number": "23", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 40, 
                        "goals": 3, 
                        "shots": 19
                    }, 
                    "dif": {
                        "attempts": 3, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 43, 
                        "goals": 2, 
                        "shots": 26
                    }, 
                    "ratio": {
                        "attempts": 0.5180722891566265, 
                        "goals": 0.4, 
                        "shots": 0.5777777777777777
                    }
                }, 
                "strength": "PP", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2165, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "MARK GIORDANO", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 40, 
                        "goals": 3, 
                        "shots": 19
                    }, 
                    "dif": {
                        "attempts": 4, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 44, 
                        "goals": 3, 
                        "shots": 27
                    }, 
                    "ratio": {
                        "attempts": 0.5238095238095238, 
                        "goals": 0.5, 
                        "shots": 0.5869565217391305
                    }
                }, 
                "strength": "PP", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2207, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "SAM BENNETT", 
                    "number": "93", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 40, 
                        "goals": 3, 
                        "shots": 19
                    }, 
                    "dif": {
                        "attempts": 5, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 45, 
                        "goals": 3, 
                        "shots": 28
                    }, 
                    "ratio": {
                        "attempts": 0.5294117647058824, 
                        "goals": 0.5, 
                        "shots": 0.5957446808510638
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2300, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "SAM BENNETT", 
                    "number": "93", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 40, 
                        "goals": 3, 
                        "shots": 19
                    }, 
                    "dif": {
                        "attempts": 6, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 46, 
                        "goals": 3, 
                        "shots": 29
                    }, 
                    "ratio": {
                        "attempts": 0.5348837209302325, 
                        "goals": 0.5, 
                        "shots": 0.6041666666666666
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2302, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JOHNNY GAUDREAU", 
                    "number": "13", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 43, 
                        "goals": 3, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 4, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 47, 
                        "goals": 4, 
                        "shots": 30
                    }, 
                    "ratio": {
                        "attempts": 0.5222222222222223, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.6
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2368, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "MARK GIORDANO", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 43, 
                        "goals": 3, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 5, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 48, 
                        "goals": 4, 
                        "shots": 30
                    }, 
                    "ratio": {
                        "attempts": 0.5274725274725275, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.6
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2395, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "MARK GIORDANO", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 49, 
                        "goals": 3, 
                        "shots": 23
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 49, 
                        "goals": 4, 
                        "shots": 30
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5660377358490566
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2531, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "LANCE BOUMA", 
                    "number": "17", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 49, 
                        "goals": 3, 
                        "shots": 23
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 50, 
                        "goals": 4, 
                        "shots": 30
                    }, 
                    "ratio": {
                        "attempts": 0.5050505050505051, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5660377358490566
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2560, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JOHNNY GAUDREAU", 
                    "number": "13", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 49, 
                        "goals": 3, 
                        "shots": 23
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 51, 
                        "goals": 4, 
                        "shots": 31
                    }, 
                    "ratio": {
                        "attempts": 0.51, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5740740740740741
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2599, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JOHNNY GAUDREAU", 
                    "number": "13", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 50, 
                        "goals": 3, 
                        "shots": 23
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 52, 
                        "goals": 4, 
                        "shots": 31
                    }, 
                    "ratio": {
                        "attempts": 0.5098039215686274, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5740740740740741
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2620, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "MARK GIORDANO", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 53, 
                        "goals": 3, 
                        "shots": 24
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 53, 
                        "goals": 4, 
                        "shots": 31
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5636363636363636
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2831, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "DENNIS WIDEMAN", 
                    "number": "6", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 53, 
                        "goals": 3, 
                        "shots": 24
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 54, 
                        "goals": 4, 
                        "shots": 31
                    }, 
                    "ratio": {
                        "attempts": 0.5046728971962616, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5636363636363636
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2867, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "LANCE BOUMA", 
                    "number": "17", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 54, 
                        "goals": 3, 
                        "shots": 25
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 55, 
                        "goals": 4, 
                        "shots": 31
                    }, 
                    "ratio": {
                        "attempts": 0.5045871559633027, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5535714285714286
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2948, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "MIKAEL BACKLUND", 
                    "number": "11", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 56, 
                        "goals": 3, 
                        "shots": 26
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 56, 
                        "goals": 4, 
                        "shots": 32
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5517241379310345
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 3056, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "DAVID JONES", 
                    "number": "19", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 56, 
                        "goals": 3, 
                        "shots": 26
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 57, 
                        "goals": 4, 
                        "shots": 32
                    }, 
                    "ratio": {
                        "attempts": 0.504424778761062, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5517241379310345
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 3157, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JOHNNY GAUDREAU", 
                    "number": "13", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 56, 
                        "goals": 3, 
                        "shots": 26
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 58, 
                        "goals": 4, 
                        "shots": 32
                    }, 
                    "ratio": {
                        "attempts": 0.5087719298245614, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5517241379310345
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 3198, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "MIKAEL BACKLUND", 
                    "number": "11", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 56, 
                        "goals": 3, 
                        "shots": 26
                    }, 
                    "dif": {
                        "attempts": 3, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 59, 
                        "goals": 4, 
                        "shots": 33
                    }, 
                    "ratio": {
                        "attempts": 0.5130434782608696, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.559322033898305
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 3234, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "SEAN MONAHAN", 
                    "number": "23", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 61, 
                        "goals": 3, 
                        "shots": 29
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 60, 
                        "goals": 4, 
                        "shots": 34
                    }, 
                    "ratio": {
                        "attempts": 0.49586776859504134, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.5396825396825397
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 3367, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JIRI HUDLER", 
                    "number": "24", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 61, 
                        "goals": 3, 
                        "shots": 29
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 61, 
                        "goals": 4, 
                        "shots": 35
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.546875
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 3371, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "MIKAEL BACKLUND", 
                    "number": "11", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 62, 
                        "goals": 3, 
                        "shots": 29
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 62, 
                        "goals": 4, 
                        "shots": 35
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.5714285714285714, 
                        "shots": 0.546875
                    }
                }, 
                "strength": "PP", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 3450, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "MARK GIORDANO", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 62, 
                        "goals": 3, 
                        "shots": 29
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 2
                    }, 
                    "for": {
                        "attempts": 63, 
                        "goals": 5, 
                        "shots": 36
                    }, 
                    "ratio": {
                        "attempts": 0.504, 
                        "goals": 0.625, 
                        "shots": 0.5538461538461539
                    }
                }, 
                "strength": "PP", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 3480, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "MICHEAL FERLAND", 
                    "number": "79", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 62, 
                        "goals": 3, 
                        "shots": 29
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": 2
                    }, 
                    "for": {
                        "attempts": 64, 
                        "goals": 5, 
                        "shots": 37
                    }, 
                    "ratio": {
                        "attempts": 0.5079365079365079, 
                        "goals": 0.625, 
                        "shots": 0.5606060606060606
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 3551, 
                "type": "shot"
            }
        ], 
        "goals": [
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JOHNNY GAUDREAU", 
                    "number": "13", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 26, 
                        "goals": 2
                    }, 
                    "dif": {
                        "attempts": -4, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 22, 
                        "goals": 1
                    }, 
                    "ratio": {
                        "attempts": 0.4583333333333333
                    }
                }, 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1390, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "MATT STAJAN", 
                    "number": "18", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 35, 
                        "goals": 3
                    }, 
                    "dif": {
                        "attempts": 5, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 40, 
                        "goals": 2
                    }, 
                    "ratio": {
                        "attempts": 0.5333333333333333
                    }
                }, 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1972, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "MARK GIORDANO", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 40, 
                        "goals": 3
                    }, 
                    "dif": {
                        "attempts": 4, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 44, 
                        "goals": 3
                    }, 
                    "ratio": {
                        "attempts": 0.5238095238095238
                    }
                }, 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2207, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "name": "JOHNNY GAUDREAU", 
                    "number": "13", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 43, 
                        "goals": 3
                    }, 
                    "dif": {
                        "attempts": 4, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 47, 
                        "goals": 4
                    }, 
                    "ratio": {
                        "attempts": 0.5222222222222223
                    }
                }, 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2368, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "EDM"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "MARK GIORDANO", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 62, 
                        "goals": 3
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 2
                    }, 
                    "for": {
                        "attempts": 63, 
                        "goals": 5
                    }, 
                    "ratio": {
                        "attempts": 0.504
                    }
                }, 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 3480, 
                "type": "goal"
            }
        ], 
        "number": 35, 
        "stats": {
            "goals": {
                "1": 0, 
                "2": 4, 
                "3": 1, 
                "4": 0, 
                "5": 0, 
                "reg": 5, 
                "total": 5
            }
        }, 
        "team": {
            "abv": "CGY"
        }
    }, 
    "home": 1, 
    "ratio": {
        "goals": {
            "1": 0, 
            "2": 0, 
            "3": 1, 
            "4": 0, 
            "5": 0, 
            "reg": 0, 
            "total": 0
        }
    }, 
    "results": {
        "gameLength": 3600, 
        "type": "REG", 
        "win": 1
    }, 
    "season": 2015
}; 
}

