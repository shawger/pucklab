
//Data loading sing this script rather
//than webserver
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
//   drawGameGraph(data);
//    statsGraph(data);
//});

var data = getData();

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
            .text("<- " + data.for.team.abv + " Attempt Advantage")
            .on('mouseover', attemptsTip.show)
            .on('mouseout', attemptsTip.hide);

    svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate("+ (width - (width/4)) +",-20)")
            .text(data.against.team.abv + " Attempt Advantage ->")
            .on('mouseover', attemptsTip.show)
            .on('mouseout', attemptsTip.hide);

    // Labels for the y axis (the time)
    svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate("+ (width+10) +","+(height/2)+")rotate(90)")
            .text("<-Time (mins)->")

    svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate("+ (0-10) +","+(height/2)+")rotate(270)")
            .text("<-Time (mins)->")

    // Add lines for when a team is expected to score

    //Create a tool tip for the average for attempts
    var avgForAttemptsTip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html("Median attempt difference at the<br>" +
              "time of a goal in the NHL. When the <br>" +
              "plot is left of this line, " + data.for.team.abv + " is more<br>" +
              "likey to score.");

    //Create a tool tip for the average against attempts
    var avgAgainstAttemptsTip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html("Median attempt difference at the<br>" +
              "time of a goal in the NHL. When the <br>" +
              "plot is right of this line, " + data.against.team.abv + " is more<br>" +
              "likey to score.");

    svg.call(avgForAttemptsTip);
    svg.call(avgAgainstAttemptsTip);

    // For team
    svg.append("line")
        .attr("x1", x(2))  //<<== change your code here
        .attr("y1", 0)
        .attr("x2", x(2))  //<<== and here
        .attr("y2", height)
        .style("stroke-width", 1)
        .style("fill", "none")
        .attr("class", "forTeamAverage")
        .on('mouseover', avgForAttemptsTip.show)
        .on('mouseout', avgForAttemptsTip.hide);

    // Against team
    svg.append("line")
        .attr("x1", x(-2))  //<<== change your code here
        .attr("y1", 0)
        .attr("x2", x(-2))  //<<== and here
        .attr("y2", height)
        .style("stroke-width", 1)
        .style("fill", "none")
        .attr("class", "againstTeamAverage")
        .on('mouseover', avgAgainstAttemptsTip.show)
        .on('mouseout', avgAgainstAttemptsTip.hide);

    // Labels for the lines
    svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate("+ x(2) +",-6)")
            .text("MED(2)")
            .attr("class", "axisTick")
            .on('mouseover', avgForAttemptsTip.show)
            .on('mouseout', avgForAttemptsTip.hide);

    svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate("+ x(-2) +",-6)")
            .text("MED(2)")
            .attr("class", "axisTick")
            .on('mouseover', avgAgainstAttemptsTip.show)
            .on('mouseout', avgAgainstAttemptsTip.hide);

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
        .data(data.against.goals);

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
    var forText = svg.selectAll("g.forTeamGoal text")
      .data(forGoals)
      .text(function(d) {
          return d.stats.for.goals
      })

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
    var againstText = svg.selectAll("g.againstTeamGoal text")
      .data(againstGoals)
      .text(function(d) {
          return d.stats.against.goals
      })

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
            return y(d.type) + y.bandwidth() - 3;
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
            return y(d.type) + y.bandwidth() - 3;
        })
        .attr("x", function(d) {
          if (d.for) {
            return graphWidth / 4;}
          else{
            return graphWidth - (graphWidth / 4);}})
        .text(function(d) {
              return (d.ratio*100).toFixed(2)+ "% (" + d.total + ")";
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
            return (d.ratio*100).toFixed(2)+ "% (" + d.total + ")";
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
        return time / 60
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

function getData(){
return {
    "_id": "201528a", 
    "against": {
        "attempts": [
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "DAN HAMHUIS", 
                    "number": "2", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 1, 
                        "goals": 0, 
                        "shots": 1
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 1, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0, 
                        "shots": 0.0
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 44, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "DANIEL SEDIN", 
                    "number": "22", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 2, 
                        "goals": 0, 
                        "shots": 2
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 1, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "ratio": {
                        "attempts": 0.3333333333333333, 
                        "goals": 0, 
                        "shots": 0.0
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 70, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "RADIM VRBATA", 
                    "number": "17", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 3, 
                        "goals": 0, 
                        "shots": 3
                    }, 
                    "dif": {
                        "attempts": -2, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 1, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "ratio": {
                        "attempts": 0.25, 
                        "goals": 0, 
                        "shots": 0.0
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 76, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "LUCA SBISA", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 4, 
                        "goals": 0, 
                        "shots": 3
                    }, 
                    "dif": {
                        "attempts": -3, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 1, 
                        "goals": 0, 
                        "shots": 0
                    }, 
                    "ratio": {
                        "attempts": 0.2, 
                        "goals": 0, 
                        "shots": 0.0
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 84, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "JARED MCCANN", 
                    "number": "91", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 5, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": -3, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 2, 
                        "goals": 0, 
                        "shots": 1
                    }, 
                    "ratio": {
                        "attempts": 0.2857142857142857, 
                        "goals": 0, 
                        "shots": 0.2
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 155, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "HENRIK SEDIN", 
                    "number": "33", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 6, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": 3, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 9, 
                        "goals": 1, 
                        "shots": 6
                    }, 
                    "ratio": {
                        "attempts": 0.6, 
                        "goals": 1.0, 
                        "shots": 0.6
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 342, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "CHRISTOPHER TANEV", 
                    "number": "8", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 7, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 9, 
                        "goals": 1, 
                        "shots": 6
                    }, 
                    "ratio": {
                        "attempts": 0.5625, 
                        "goals": 1.0, 
                        "shots": 0.6
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 353, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "DAN HAMHUIS", 
                    "number": "2", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 8, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 9, 
                        "goals": 1, 
                        "shots": 6
                    }, 
                    "ratio": {
                        "attempts": 0.5294117647058824, 
                        "goals": 1.0, 
                        "shots": 0.6
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 358, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "ADAM CRACKNELL", 
                    "number": "24", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 9, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 10, 
                        "goals": 1, 
                        "shots": 7
                    }, 
                    "ratio": {
                        "attempts": 0.5263157894736842, 
                        "goals": 1.0, 
                        "shots": 0.5833333333333334
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 421, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "RADIM VRBATA", 
                    "number": "17", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 10, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 10, 
                        "goals": 1, 
                        "shots": 7
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 1.0, 
                        "shots": 0.5833333333333334
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 430, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "DANIEL SEDIN", 
                    "number": "22", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 11, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 12, 
                        "goals": 1, 
                        "shots": 9
                    }, 
                    "ratio": {
                        "attempts": 0.5217391304347826, 
                        "goals": 1.0, 
                        "shots": 0.6
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 637, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "YANNICK WEBER", 
                    "number": "6", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 12, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 12, 
                        "goals": 1, 
                        "shots": 9
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 1.0, 
                        "shots": 0.6
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 671, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "MATT BARTKOWSKI", 
                    "number": "44", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 13, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 12, 
                        "goals": 1, 
                        "shots": 9
                    }, 
                    "ratio": {
                        "attempts": 0.48, 
                        "goals": 1.0, 
                        "shots": 0.6
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 675, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "ALEXANDRE BURROWS", 
                    "number": "14", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 14, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 14, 
                        "goals": 1, 
                        "shots": 11
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 1.0, 
                        "shots": 0.6470588235294118
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 756, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "JANNIK HANSEN", 
                    "number": "36", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 15, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 14, 
                        "goals": 1, 
                        "shots": 11
                    }, 
                    "ratio": {
                        "attempts": 0.4827586206896552, 
                        "goals": 1.0, 
                        "shots": 0.6470588235294118
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 788, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "MATT BARTKOWSKI", 
                    "number": "44", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 16, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 16, 
                        "goals": 1, 
                        "shots": 11
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 1.0, 
                        "shots": 0.6470588235294118
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 919, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BEN HUTTON", 
                    "number": "27", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 17, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "dif": {
                        "attempts": 3, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 20, 
                        "goals": 1, 
                        "shots": 12
                    }, 
                    "ratio": {
                        "attempts": 0.5405405405405406, 
                        "goals": 1.0, 
                        "shots": 0.631578947368421
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 982, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "RADIM VRBATA", 
                    "number": "17", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 18, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 20, 
                        "goals": 1, 
                        "shots": 12
                    }, 
                    "ratio": {
                        "attempts": 0.5263157894736842, 
                        "goals": 1.0, 
                        "shots": 0.631578947368421
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1026, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "MATT BARTKOWSKI", 
                    "number": "44", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 19, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 20, 
                        "goals": 1, 
                        "shots": 12
                    }, 
                    "ratio": {
                        "attempts": 0.5128205128205128, 
                        "goals": 1.0, 
                        "shots": 0.631578947368421
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1033, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "ADAM CRACKNELL", 
                    "number": "24", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 20, 
                        "goals": 0, 
                        "shots": 8
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 22, 
                        "goals": 1, 
                        "shots": 14
                    }, 
                    "ratio": {
                        "attempts": 0.5238095238095238, 
                        "goals": 1.0, 
                        "shots": 0.6363636363636364
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1087, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BRANDON SUTTER", 
                    "number": "21", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 21, 
                        "goals": 0, 
                        "shots": 9
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 23, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "ratio": {
                        "attempts": 0.5227272727272727, 
                        "goals": 1.0, 
                        "shots": 0.625
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1179, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "SVEN BAERTSCHI", 
                    "number": "47", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 22, 
                        "goals": 0, 
                        "shots": 9
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 23, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "ratio": {
                        "attempts": 0.5111111111111111, 
                        "goals": 1.0, 
                        "shots": 0.625
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1221, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "RADIM VRBATA", 
                    "number": "17", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 23, 
                        "goals": 0, 
                        "shots": 10
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 23, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 1.0, 
                        "shots": 0.6
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1242, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "DANIEL SEDIN", 
                    "number": "22", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 24, 
                        "goals": 0, 
                        "shots": 10
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 23, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "ratio": {
                        "attempts": 0.48936170212765956, 
                        "goals": 1.0, 
                        "shots": 0.6
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1264, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "DANIEL SEDIN", 
                    "number": "22", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 25, 
                        "goals": 0, 
                        "shots": 11
                    }, 
                    "dif": {
                        "attempts": -2, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 23, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "ratio": {
                        "attempts": 0.4791666666666667, 
                        "goals": 1.0, 
                        "shots": 0.5769230769230769
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1296, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BO HORVAT", 
                    "number": "53", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 26, 
                        "goals": 0, 
                        "shots": 12
                    }, 
                    "dif": {
                        "attempts": -3, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 23, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "ratio": {
                        "attempts": 0.46938775510204084, 
                        "goals": 1.0, 
                        "shots": 0.5555555555555556
                    }
                }, 
                "strength": "PP", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1320, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BO HORVAT", 
                    "number": "53", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 27, 
                        "goals": 1, 
                        "shots": 13
                    }, 
                    "dif": {
                        "attempts": -4, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 23, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "ratio": {
                        "attempts": 0.46, 
                        "goals": 0.5, 
                        "shots": 0.5357142857142857
                    }
                }, 
                "strength": "PP", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1323, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "DEREK DORSETT", 
                    "number": "15", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 13
                    }, 
                    "dif": {
                        "attempts": -5, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 23, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "ratio": {
                        "attempts": 0.45098039215686275, 
                        "goals": 0.5, 
                        "shots": 0.5357142857142857
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1360, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "RADIM VRBATA", 
                    "number": "17", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 29, 
                        "goals": 1, 
                        "shots": 14
                    }, 
                    "dif": {
                        "attempts": -3, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 26, 
                        "goals": 1, 
                        "shots": 16
                    }, 
                    "ratio": {
                        "attempts": 0.4727272727272727, 
                        "goals": 0.5, 
                        "shots": 0.5333333333333333
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1518, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "RADIM VRBATA", 
                    "number": "17", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 30, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "dif": {
                        "attempts": -4, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 26, 
                        "goals": 1, 
                        "shots": 16
                    }, 
                    "ratio": {
                        "attempts": 0.4642857142857143, 
                        "goals": 0.5, 
                        "shots": 0.5161290322580645
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1563, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "JARED MCCANN", 
                    "number": "91", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 31, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 31, 
                        "goals": 1, 
                        "shots": 19
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.5, 
                        "shots": 0.5588235294117647
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1658, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "DEREK DORSETT", 
                    "number": "15", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 32, 
                        "goals": 1, 
                        "shots": 16
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 34, 
                        "goals": 1, 
                        "shots": 20
                    }, 
                    "ratio": {
                        "attempts": 0.5151515151515151, 
                        "goals": 0.5, 
                        "shots": 0.5555555555555556
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1745, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "HENRIK SEDIN", 
                    "number": "33", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 33, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 34, 
                        "goals": 1, 
                        "shots": 20
                    }, 
                    "ratio": {
                        "attempts": 0.5074626865671642, 
                        "goals": 0.5, 
                        "shots": 0.5405405405405406
                    }
                }, 
                "strength": "PP", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1776, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "RADIM VRBATA", 
                    "number": "17", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 34, 
                        "goals": 1, 
                        "shots": 18
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 34, 
                        "goals": 1, 
                        "shots": 20
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.5, 
                        "shots": 0.5263157894736842
                    }
                }, 
                "strength": "PP", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1809, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BO HORVAT", 
                    "number": "53", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 35, 
                        "goals": 1, 
                        "shots": 19
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 35, 
                        "goals": 1, 
                        "shots": 20
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.5, 
                        "shots": 0.5128205128205128
                    }
                }, 
                "strength": "PP", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1856, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "JARED MCCANN", 
                    "number": "91", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 36, 
                        "goals": 2, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 35, 
                        "goals": 1, 
                        "shots": 20
                    }, 
                    "ratio": {
                        "attempts": 0.49295774647887325, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1893, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "RADIM VRBATA", 
                    "number": "17", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 37, 
                        "goals": 2, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 37, 
                        "goals": 1, 
                        "shots": 21
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5121951219512195
                    }
                }, 
                "strength": "SH", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 2099, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BEN HUTTON", 
                    "number": "27", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 38, 
                        "goals": 2, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 38, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5238095238095238
                    }
                }, 
                "strength": "SH", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 2179, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "ALEXANDRE BURROWS", 
                    "number": "14", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 39, 
                        "goals": 2, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 9, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 48, 
                        "goals": 1, 
                        "shots": 27
                    }, 
                    "ratio": {
                        "attempts": 0.5517241379310345, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.574468085106383
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 2658, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "DAN HAMHUIS", 
                    "number": "2", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 40, 
                        "goals": 2, 
                        "shots": 21
                    }, 
                    "dif": {
                        "attempts": 8, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 48, 
                        "goals": 1, 
                        "shots": 27
                    }, 
                    "ratio": {
                        "attempts": 0.5454545454545454, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5625
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 2660, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "ADAM CRACKNELL", 
                    "number": "24", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 41, 
                        "goals": 2, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": 7, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 48, 
                        "goals": 1, 
                        "shots": 27
                    }, 
                    "ratio": {
                        "attempts": 0.5393258426966292, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5510204081632653
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 2667, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "YANNICK WEBER", 
                    "number": "6", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 42, 
                        "goals": 2, 
                        "shots": 23
                    }, 
                    "dif": {
                        "attempts": 17, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 59, 
                        "goals": 2, 
                        "shots": 33
                    }, 
                    "ratio": {
                        "attempts": 0.5841584158415841, 
                        "goals": 0.5, 
                        "shots": 0.5892857142857143
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 3046, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "ALEXANDRE BURROWS", 
                    "number": "14", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 43, 
                        "goals": 2, 
                        "shots": 24
                    }, 
                    "dif": {
                        "attempts": 18, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 61, 
                        "goals": 2, 
                        "shots": 35
                    }, 
                    "ratio": {
                        "attempts": 0.5865384615384616, 
                        "goals": 0.5, 
                        "shots": 0.5932203389830508
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 3232, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BRANDON SUTTER", 
                    "number": "21", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 44, 
                        "goals": 2, 
                        "shots": 25
                    }, 
                    "dif": {
                        "attempts": 17, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 61, 
                        "goals": 2, 
                        "shots": 35
                    }, 
                    "ratio": {
                        "attempts": 0.580952380952381, 
                        "goals": 0.5, 
                        "shots": 0.5833333333333334
                    }
                }, 
                "strength": "PP", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 3268, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "DANIEL SEDIN", 
                    "number": "22", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 45, 
                        "goals": 2, 
                        "shots": 26
                    }, 
                    "dif": {
                        "attempts": 20, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 65, 
                        "goals": 2, 
                        "shots": 37
                    }, 
                    "ratio": {
                        "attempts": 0.5909090909090909, 
                        "goals": 0.5, 
                        "shots": 0.5873015873015873
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 3514, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "CHRISTOPHER TANEV", 
                    "number": "8", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 46, 
                        "goals": 2, 
                        "shots": 26
                    }, 
                    "dif": {
                        "attempts": 19, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 65, 
                        "goals": 2, 
                        "shots": 37
                    }, 
                    "ratio": {
                        "attempts": 0.5855855855855856, 
                        "goals": 0.5, 
                        "shots": 0.5873015873015873
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 3520, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "JANNIK HANSEN", 
                    "number": "36", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 47, 
                        "goals": 2, 
                        "shots": 27
                    }, 
                    "dif": {
                        "attempts": 18, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 65, 
                        "goals": 2, 
                        "shots": 37
                    }, 
                    "ratio": {
                        "attempts": 0.5803571428571429, 
                        "goals": 0.5, 
                        "shots": 0.578125
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 3533, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "LUCA SBISA", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 48, 
                        "goals": 2, 
                        "shots": 28
                    }, 
                    "dif": {
                        "attempts": 17, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 65, 
                        "goals": 2, 
                        "shots": 37
                    }, 
                    "ratio": {
                        "attempts": 0.5752212389380531, 
                        "goals": 0.5, 
                        "shots": 0.5692307692307692
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 3597, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "DANIEL SEDIN", 
                    "number": "22", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 49, 
                        "goals": 2, 
                        "shots": 28
                    }, 
                    "dif": {
                        "attempts": 16, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 65, 
                        "goals": 2, 
                        "shots": 37
                    }, 
                    "ratio": {
                        "attempts": 0.5701754385964912, 
                        "goals": 0.5, 
                        "shots": 0.5692307692307692
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 3615, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "DANIEL SEDIN", 
                    "number": "22", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 50, 
                        "goals": 2, 
                        "shots": 29
                    }, 
                    "dif": {
                        "attempts": 15, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 65, 
                        "goals": 2, 
                        "shots": 37
                    }, 
                    "ratio": {
                        "attempts": 0.5652173913043478, 
                        "goals": 0.5, 
                        "shots": 0.5606060606060606
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 3645, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BEN HUTTON", 
                    "number": "27", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 51, 
                        "goals": 2, 
                        "shots": 29
                    }, 
                    "dif": {
                        "attempts": 14, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 65, 
                        "goals": 2, 
                        "shots": 37
                    }, 
                    "ratio": {
                        "attempts": 0.5603448275862069, 
                        "goals": 0.5, 
                        "shots": 0.5606060606060606
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 3692, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BEN HUTTON", 
                    "number": "27", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 52, 
                        "goals": 2, 
                        "shots": 30
                    }, 
                    "dif": {
                        "attempts": 13, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 65, 
                        "goals": 2, 
                        "shots": 37
                    }, 
                    "ratio": {
                        "attempts": 0.5555555555555556, 
                        "goals": 0.5, 
                        "shots": 0.5522388059701493
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 3697, 
                "type": "shot"
            }
        ], 
        "goals": [
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "BO HORVAT", 
                    "number": "53", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 27, 
                        "goals": 1
                    }, 
                    "dif": {
                        "attempts": -4, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 23, 
                        "goals": 1
                    }, 
                    "ratio": {
                        "attempts": 0.46
                    }
                }, 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1323, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "CGY"
                }, 
                "shooter": {
                    "name": "JARED MCCANN", 
                    "number": "91", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 36, 
                        "goals": 2
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 35, 
                        "goals": 1
                    }, 
                    "ratio": {
                        "attempts": 0.49295774647887325
                    }
                }, 
                "team": {
                    "abv": "VAN"
                }, 
                "time": 1893, 
                "type": "goal"
            }
        ], 
        "stats": {
            "goals": {
                "1": 0, 
                "2": 2, 
                "3": 0, 
                "4": 0, 
                "5": 0, 
                "reg": 2, 
                "total": 2
            }
        }, 
        "team": {
            "abv": "VAN"
        }
    }, 
    "date": "2015-10-10", 
    "for": {
        "attempts": [
            {
                "against": {
                    "abv": "VAN"
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
                "time": 16, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "DERYK ENGELLAND", 
                    "number": "29", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 4, 
                        "goals": 0, 
                        "shots": 3
                    }, 
                    "dif": {
                        "attempts": -2, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 2, 
                        "goals": 0, 
                        "shots": 1
                    }, 
                    "ratio": {
                        "attempts": 0.3333333333333333, 
                        "goals": 0, 
                        "shots": 0.25
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 130, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "MIKAEL BACKLUND", 
                    "number": "11", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 5, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": -2, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 3, 
                        "goals": 0, 
                        "shots": 2
                    }, 
                    "ratio": {
                        "attempts": 0.375, 
                        "goals": 0, 
                        "shots": 0.3333333333333333
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 179, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "MARK GIORDANO", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 5, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 4, 
                        "goals": 0, 
                        "shots": 2
                    }, 
                    "ratio": {
                        "attempts": 0.4444444444444444, 
                        "goals": 0, 
                        "shots": 0.3333333333333333
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 184, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "SEAN MONAHAN", 
                    "number": "23", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 5, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 5, 
                        "goals": 0, 
                        "shots": 2
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0, 
                        "shots": 0.3333333333333333
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 229, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "SEAN MONAHAN", 
                    "number": "23", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 5, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 6, 
                        "goals": 0, 
                        "shots": 3
                    }, 
                    "ratio": {
                        "attempts": 0.5454545454545454, 
                        "goals": 0, 
                        "shots": 0.42857142857142855
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 245, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "MICHAEL FROLIK", 
                    "number": "67", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 5, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 7, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "ratio": {
                        "attempts": 0.5833333333333334, 
                        "goals": 0, 
                        "shots": 0.5
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 251, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "MASON RAYMOND", 
                    "number": "21", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 5, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": 3, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 8, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "ratio": {
                        "attempts": 0.6153846153846154, 
                        "goals": 0, 
                        "shots": 0.5555555555555556
                    }
                }, 
                "strength": "PP", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 277, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "DOUGIE HAMILTON", 
                    "number": "27", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 5, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": 4, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 9, 
                        "goals": 1, 
                        "shots": 6
                    }, 
                    "ratio": {
                        "attempts": 0.6428571428571429, 
                        "goals": 1.0, 
                        "shots": 0.6
                    }
                }, 
                "strength": "PP", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 300, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "BRANDON BOLLIG", 
                    "number": "52", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 8, 
                        "goals": 0, 
                        "shots": 4
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 10, 
                        "goals": 1, 
                        "shots": 7
                    }, 
                    "ratio": {
                        "attempts": 0.5555555555555556, 
                        "goals": 1.0, 
                        "shots": 0.6363636363636364
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 387, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "MASON RAYMOND", 
                    "number": "21", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 10, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 11, 
                        "goals": 1, 
                        "shots": 8
                    }, 
                    "ratio": {
                        "attempts": 0.5238095238095238, 
                        "goals": 1.0, 
                        "shots": 0.6153846153846154
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 495, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "MARK GIORDANO", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 10, 
                        "goals": 0, 
                        "shots": 5
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 12, 
                        "goals": 1, 
                        "shots": 9
                    }, 
                    "ratio": {
                        "attempts": 0.5454545454545454, 
                        "goals": 1.0, 
                        "shots": 0.6428571428571429
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 622, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "MASON RAYMOND", 
                    "number": "21", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 13, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 13, 
                        "goals": 1, 
                        "shots": 10
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 1.0, 
                        "shots": 0.625
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 684, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "SAM BENNETT", 
                    "number": "93", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 13, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 14, 
                        "goals": 1, 
                        "shots": 11
                    }, 
                    "ratio": {
                        "attempts": 0.5185185185185185, 
                        "goals": 1.0, 
                        "shots": 0.6470588235294118
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 733, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "MARK GIORDANO", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 15, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 15, 
                        "goals": 1, 
                        "shots": 11
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 1.0, 
                        "shots": 0.6470588235294118
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 835, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "JIRI HUDLER", 
                    "number": "24", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 15, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 16, 
                        "goals": 1, 
                        "shots": 11
                    }, 
                    "ratio": {
                        "attempts": 0.5161290322580645, 
                        "goals": 1.0, 
                        "shots": 0.6470588235294118
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 842, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "MICHAEL FROLIK", 
                    "number": "67", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 16, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 17, 
                        "goals": 1, 
                        "shots": 11
                    }, 
                    "ratio": {
                        "attempts": 0.5151515151515151, 
                        "goals": 1.0, 
                        "shots": 0.6470588235294118
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 943, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "SAM BENNETT", 
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
                        "attempts": 2, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 18, 
                        "goals": 1, 
                        "shots": 11
                    }, 
                    "ratio": {
                        "attempts": 0.5294117647058824, 
                        "goals": 1.0, 
                        "shots": 0.6470588235294118
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 950, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "DERYK ENGELLAND", 
                    "number": "29", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 16, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "dif": {
                        "attempts": 3, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 19, 
                        "goals": 1, 
                        "shots": 11
                    }, 
                    "ratio": {
                        "attempts": 0.5428571428571428, 
                        "goals": 1.0, 
                        "shots": 0.6470588235294118
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 951, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "MASON RAYMOND", 
                    "number": "21", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 16, 
                        "goals": 0, 
                        "shots": 6
                    }, 
                    "dif": {
                        "attempts": 4, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 20, 
                        "goals": 1, 
                        "shots": 12
                    }, 
                    "ratio": {
                        "attempts": 0.5555555555555556, 
                        "goals": 1.0, 
                        "shots": 0.6666666666666666
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 952, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "MICHAEL FROLIK", 
                    "number": "67", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 19, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 21, 
                        "goals": 1, 
                        "shots": 13
                    }, 
                    "ratio": {
                        "attempts": 0.525, 
                        "goals": 1.0, 
                        "shots": 0.65
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1070, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "DERYK ENGELLAND", 
                    "number": "29", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 19, 
                        "goals": 0, 
                        "shots": 7
                    }, 
                    "dif": {
                        "attempts": 3, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 22, 
                        "goals": 1, 
                        "shots": 14
                    }, 
                    "ratio": {
                        "attempts": 0.5365853658536586, 
                        "goals": 1.0, 
                        "shots": 0.6666666666666666
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1077, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "JOHNNY GAUDREAU", 
                    "number": "13", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 20, 
                        "goals": 0, 
                        "shots": 8
                    }, 
                    "dif": {
                        "attempts": 3, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 23, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "ratio": {
                        "attempts": 0.5348837209302325, 
                        "goals": 1.0, 
                        "shots": 0.6521739130434783
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1131, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "SAM BENNETT", 
                    "number": "93", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 13
                    }, 
                    "dif": {
                        "attempts": -4, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 24, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "ratio": {
                        "attempts": 0.46153846153846156, 
                        "goals": 0.5, 
                        "shots": 0.5357142857142857
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1369, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "DOUGIE HAMILTON", 
                    "number": "27", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 13
                    }, 
                    "dif": {
                        "attempts": -3, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 25, 
                        "goals": 1, 
                        "shots": 16
                    }, 
                    "ratio": {
                        "attempts": 0.4716981132075472, 
                        "goals": 0.5, 
                        "shots": 0.5517241379310345
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1415, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "BRETT KULAK", 
                    "number": "61", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 13
                    }, 
                    "dif": {
                        "attempts": -2, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 26, 
                        "goals": 1, 
                        "shots": 16
                    }, 
                    "ratio": {
                        "attempts": 0.48148148148148145, 
                        "goals": 0.5, 
                        "shots": 0.5517241379310345
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1418, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "MASON RAYMOND", 
                    "number": "21", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 30, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "dif": {
                        "attempts": -3, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 27, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "ratio": {
                        "attempts": 0.47368421052631576, 
                        "goals": 0.5, 
                        "shots": 0.53125
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1599, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "DERYK ENGELLAND", 
                    "number": "29", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 30, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "dif": {
                        "attempts": -2, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 28, 
                        "goals": 1, 
                        "shots": 17
                    }, 
                    "ratio": {
                        "attempts": 0.4827586206896552, 
                        "goals": 0.5, 
                        "shots": 0.53125
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1611, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "JIRI HUDLER", 
                    "number": "24", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 30, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "dif": {
                        "attempts": -1, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 29, 
                        "goals": 1, 
                        "shots": 18
                    }, 
                    "ratio": {
                        "attempts": 0.4915254237288136, 
                        "goals": 0.5, 
                        "shots": 0.5454545454545454
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1618, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "DENNIS WIDEMAN", 
                    "number": "6", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 30, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 31, 
                        "goals": 1, 
                        "shots": 19
                    }, 
                    "ratio": {
                        "attempts": 0.5081967213114754, 
                        "goals": 0.5, 
                        "shots": 0.5588235294117647
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1625, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "JOHNNY GAUDREAU", 
                    "number": "13", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 30, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 31, 
                        "goals": 1, 
                        "shots": 19
                    }, 
                    "ratio": {
                        "attempts": 0.5081967213114754, 
                        "goals": 0.5, 
                        "shots": 0.5588235294117647
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1625, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "MARK GIORDANO", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 31, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 32, 
                        "goals": 1, 
                        "shots": 20
                    }, 
                    "ratio": {
                        "attempts": 0.5079365079365079, 
                        "goals": 0.5, 
                        "shots": 0.5714285714285714
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1705, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "DENNIS WIDEMAN", 
                    "number": "6", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 31, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 33, 
                        "goals": 1, 
                        "shots": 20
                    }, 
                    "ratio": {
                        "attempts": 0.515625, 
                        "goals": 0.5, 
                        "shots": 0.5714285714285714
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1715, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "SAM BENNETT", 
                    "number": "93", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 31, 
                        "goals": 1, 
                        "shots": 15
                    }, 
                    "dif": {
                        "attempts": 3, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 34, 
                        "goals": 1, 
                        "shots": 20
                    }, 
                    "ratio": {
                        "attempts": 0.5230769230769231, 
                        "goals": 0.5, 
                        "shots": 0.5714285714285714
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1725, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "MATT STAJAN", 
                    "number": "18", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 34, 
                        "goals": 1, 
                        "shots": 18
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 35, 
                        "goals": 1, 
                        "shots": 20
                    }, 
                    "ratio": {
                        "attempts": 0.5072463768115942, 
                        "goals": 0.5, 
                        "shots": 0.5263157894736842
                    }
                }, 
                "strength": "PP", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1822, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "BRETT KULAK", 
                    "number": "61", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 36, 
                        "goals": 2, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 0, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 36, 
                        "goals": 1, 
                        "shots": 20
                    }, 
                    "ratio": {
                        "attempts": 0.5, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 1918, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "DAVID JONES", 
                    "number": "19", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 36, 
                        "goals": 2, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 37, 
                        "goals": 1, 
                        "shots": 21
                    }, 
                    "ratio": {
                        "attempts": 0.5068493150684932, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5121951219512195
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2021, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "MICHAEL FROLIK", 
                    "number": "67", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 37, 
                        "goals": 2, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 38, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "ratio": {
                        "attempts": 0.5066666666666667, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5238095238095238
                    }
                }, 
                "strength": "SH", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2116, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "MARK GIORDANO", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 38, 
                        "goals": 2, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 1, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 39, 
                        "goals": 1, 
                        "shots": 22
                    }, 
                    "ratio": {
                        "attempts": 0.5064935064935064, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5238095238095238
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2241, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "DENNIS WIDEMAN", 
                    "number": "6", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 38, 
                        "goals": 2, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 2, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 40, 
                        "goals": 1, 
                        "shots": 23
                    }, 
                    "ratio": {
                        "attempts": 0.5128205128205128, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5348837209302325
                    }
                }, 
                "strength": "PP", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2300, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "JOHNNY GAUDREAU", 
                    "number": "13", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 38, 
                        "goals": 2, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 3, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 41, 
                        "goals": 1, 
                        "shots": 23
                    }, 
                    "ratio": {
                        "attempts": 0.5189873417721519, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5348837209302325
                    }
                }, 
                "strength": "SH", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2314, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "DENNIS WIDEMAN", 
                    "number": "6", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 38, 
                        "goals": 2, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 4, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 42, 
                        "goals": 1, 
                        "shots": 23
                    }, 
                    "ratio": {
                        "attempts": 0.525, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5348837209302325
                    }
                }, 
                "strength": "SH", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2324, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "JIRI HUDLER", 
                    "number": "24", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 38, 
                        "goals": 2, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 5, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 43, 
                        "goals": 1, 
                        "shots": 24
                    }, 
                    "ratio": {
                        "attempts": 0.5308641975308642, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5454545454545454
                    }
                }, 
                "strength": "PP", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2343, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "MICHEAL FERLAND", 
                    "number": "79", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 38, 
                        "goals": 2, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 6, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 44, 
                        "goals": 1, 
                        "shots": 25
                    }, 
                    "ratio": {
                        "attempts": 0.5365853658536586, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5555555555555556
                    }
                }, 
                "strength": "PP", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2344, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "MARK GIORDANO", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 38, 
                        "goals": 2, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 7, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 45, 
                        "goals": 1, 
                        "shots": 25
                    }, 
                    "ratio": {
                        "attempts": 0.5421686746987951, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5555555555555556
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2396, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "MICHAEL FROLIK", 
                    "number": "67", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 38, 
                        "goals": 2, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 8, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 46, 
                        "goals": 1, 
                        "shots": 26
                    }, 
                    "ratio": {
                        "attempts": 0.5476190476190477, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5652173913043478
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2445, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "DAVID JONES", 
                    "number": "19", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 38, 
                        "goals": 2, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 9, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 47, 
                        "goals": 1, 
                        "shots": 27
                    }, 
                    "ratio": {
                        "attempts": 0.5529411764705883, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.574468085106383
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2501, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "DENNIS WIDEMAN", 
                    "number": "6", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 38, 
                        "goals": 2, 
                        "shots": 20
                    }, 
                    "dif": {
                        "attempts": 10, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 48, 
                        "goals": 1, 
                        "shots": 27
                    }, 
                    "ratio": {
                        "attempts": 0.5581395348837209, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.574468085106383
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2649, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "DERYK ENGELLAND", 
                    "number": "29", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 41, 
                        "goals": 2, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": 8, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 49, 
                        "goals": 1, 
                        "shots": 27
                    }, 
                    "ratio": {
                        "attempts": 0.5444444444444444, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5510204081632653
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2682, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "DERYK ENGELLAND", 
                    "number": "29", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 41, 
                        "goals": 2, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": 9, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 50, 
                        "goals": 1, 
                        "shots": 28
                    }, 
                    "ratio": {
                        "attempts": 0.5494505494505495, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.56
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2688, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "LANCE BOUMA", 
                    "number": "17", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 41, 
                        "goals": 2, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": 10, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 51, 
                        "goals": 1, 
                        "shots": 28
                    }, 
                    "ratio": {
                        "attempts": 0.5543478260869565, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.56
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2696, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "MARK GIORDANO", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 41, 
                        "goals": 2, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": 11, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 52, 
                        "goals": 1, 
                        "shots": 29
                    }, 
                    "ratio": {
                        "attempts": 0.5591397849462365, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5686274509803921
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2730, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "JIRI HUDLER", 
                    "number": "24", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 41, 
                        "goals": 2, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": 12, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 53, 
                        "goals": 1, 
                        "shots": 30
                    }, 
                    "ratio": {
                        "attempts": 0.5638297872340425, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5769230769230769
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2754, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "DENNIS WIDEMAN", 
                    "number": "6", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 41, 
                        "goals": 2, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": 13, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 54, 
                        "goals": 1, 
                        "shots": 31
                    }, 
                    "ratio": {
                        "attempts": 0.5684210526315789, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5849056603773585
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2757, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "DENNIS WIDEMAN", 
                    "number": "6", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 41, 
                        "goals": 2, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": 14, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 55, 
                        "goals": 1, 
                        "shots": 32
                    }, 
                    "ratio": {
                        "attempts": 0.5729166666666666, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5925925925925926
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2767, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "BRETT KULAK", 
                    "number": "61", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 41, 
                        "goals": 2, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": 15, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 56, 
                        "goals": 1, 
                        "shots": 32
                    }, 
                    "ratio": {
                        "attempts": 0.5773195876288659, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5925925925925926
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2816, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "MARK GIORDANO", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 41, 
                        "goals": 2, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": 16, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 57, 
                        "goals": 1, 
                        "shots": 32
                    }, 
                    "ratio": {
                        "attempts": 0.5816326530612245, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5925925925925926
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2879, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "cap": "c", 
                    "name": "MARK GIORDANO", 
                    "number": "5", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 41, 
                        "goals": 2, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": 17, 
                        "goals": -1
                    }, 
                    "for": {
                        "attempts": 58, 
                        "goals": 1, 
                        "shots": 32
                    }, 
                    "ratio": {
                        "attempts": 0.5858585858585859, 
                        "goals": 0.3333333333333333, 
                        "shots": 0.5925925925925926
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2884, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "SEAN MONAHAN", 
                    "number": "23", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 41, 
                        "goals": 2, 
                        "shots": 22
                    }, 
                    "dif": {
                        "attempts": 18, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 59, 
                        "goals": 2, 
                        "shots": 33
                    }, 
                    "ratio": {
                        "attempts": 0.59, 
                        "goals": 0.5, 
                        "shots": 0.6
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2929, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "DENNIS WIDEMAN", 
                    "number": "6", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 42, 
                        "goals": 2, 
                        "shots": 23
                    }, 
                    "dif": {
                        "attempts": 18, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 60, 
                        "goals": 2, 
                        "shots": 34
                    }, 
                    "ratio": {
                        "attempts": 0.5882352941176471, 
                        "goals": 0.5, 
                        "shots": 0.5964912280701754
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 3191, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "BRETT KULAK", 
                    "number": "61", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 42, 
                        "goals": 2, 
                        "shots": 23
                    }, 
                    "dif": {
                        "attempts": 19, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 61, 
                        "goals": 2, 
                        "shots": 35
                    }, 
                    "ratio": {
                        "attempts": 0.5922330097087378, 
                        "goals": 0.5, 
                        "shots": 0.603448275862069
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 3225, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "MASON RAYMOND", 
                    "number": "21", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 44, 
                        "goals": 2, 
                        "shots": 25
                    }, 
                    "dif": {
                        "attempts": 18, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 62, 
                        "goals": 2, 
                        "shots": 35
                    }, 
                    "ratio": {
                        "attempts": 0.5849056603773585, 
                        "goals": 0.5, 
                        "shots": 0.5833333333333334
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 3375, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "JIRI HUDLER", 
                    "number": "24", 
                    "pos": "R"
                }, 
                "stats": {
                    "against": {
                        "attempts": 44, 
                        "goals": 2, 
                        "shots": 25
                    }, 
                    "dif": {
                        "attempts": 19, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 63, 
                        "goals": 2, 
                        "shots": 35
                    }, 
                    "ratio": {
                        "attempts": 0.5887850467289719, 
                        "goals": 0.5, 
                        "shots": 0.5833333333333334
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 3468, 
                "type": "miss"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "SEAN MONAHAN", 
                    "number": "23", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 44, 
                        "goals": 2, 
                        "shots": 25
                    }, 
                    "dif": {
                        "attempts": 20, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 64, 
                        "goals": 2, 
                        "shots": 36
                    }, 
                    "ratio": {
                        "attempts": 0.5925925925925926, 
                        "goals": 0.5, 
                        "shots": 0.5901639344262295
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 3472, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "JOHNNY GAUDREAU", 
                    "number": "13", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 44, 
                        "goals": 2, 
                        "shots": 25
                    }, 
                    "dif": {
                        "attempts": 21, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 65, 
                        "goals": 2, 
                        "shots": 37
                    }, 
                    "ratio": {
                        "attempts": 0.5963302752293578, 
                        "goals": 0.5, 
                        "shots": 0.5967741935483871
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 3505, 
                "type": "shot"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "cap": "A", 
                    "name": "KRIS RUSSELL", 
                    "number": "4", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 52, 
                        "goals": 2, 
                        "shots": 30
                    }, 
                    "dif": {
                        "attempts": 14, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 66, 
                        "goals": 2, 
                        "shots": 37
                    }, 
                    "ratio": {
                        "attempts": 0.559322033898305, 
                        "goals": 0.5, 
                        "shots": 0.5522388059701493
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 3747, 
                "type": "block"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "JOHNNY GAUDREAU", 
                    "number": "13", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 52, 
                        "goals": 2, 
                        "shots": 30
                    }, 
                    "dif": {
                        "attempts": 15, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 67, 
                        "goals": 3, 
                        "shots": 38
                    }, 
                    "ratio": {
                        "attempts": 0.5630252100840336, 
                        "goals": 0.6, 
                        "shots": 0.5588235294117647
                    }
                }, 
                "strength": "EV", 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 3783, 
                "type": "goal"
            }
        ], 
        "goals": [
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "DOUGIE HAMILTON", 
                    "number": "27", 
                    "pos": "D"
                }, 
                "stats": {
                    "against": {
                        "attempts": 5, 
                        "goals": 0
                    }, 
                    "dif": {
                        "attempts": 4, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 9, 
                        "goals": 1
                    }, 
                    "ratio": {
                        "attempts": 0.6428571428571429
                    }
                }, 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 300, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "SEAN MONAHAN", 
                    "number": "23", 
                    "pos": "C"
                }, 
                "stats": {
                    "against": {
                        "attempts": 41, 
                        "goals": 2
                    }, 
                    "dif": {
                        "attempts": 18, 
                        "goals": 0
                    }, 
                    "for": {
                        "attempts": 59, 
                        "goals": 2
                    }, 
                    "ratio": {
                        "attempts": 0.59
                    }
                }, 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 2929, 
                "type": "goal"
            }, 
            {
                "against": {
                    "abv": "VAN"
                }, 
                "shooter": {
                    "name": "JOHNNY GAUDREAU", 
                    "number": "13", 
                    "pos": "L"
                }, 
                "stats": {
                    "against": {
                        "attempts": 52, 
                        "goals": 2
                    }, 
                    "dif": {
                        "attempts": 15, 
                        "goals": 1
                    }, 
                    "for": {
                        "attempts": 67, 
                        "goals": 3
                    }, 
                    "ratio": {
                        "attempts": 0.5630252100840336
                    }
                }, 
                "team": {
                    "abv": "CGY"
                }, 
                "time": 3783, 
                "type": "goal"
            }
        ], 
        "number": 2, 
        "stats": {
            "goals": {
                "1": 1, 
                "2": 0, 
                "3": 1, 
                "4": 1, 
                "5": 0, 
                "reg": 2, 
                "total": 3
            }
        }, 
        "team": {
            "abv": "CGY", 
            "name": "CALGARY FLAMES"
        }
    }, 
    "home": 0, 
    "ratio": {
        "goals": {
            "1": 1, 
            "2": 0, 
            "3": 1, 
            "4": 1, 
            "5": 0, 
            "reg": 0, 
            "total": 0
        }
    }, 
    "results": {
        "gameLength": 3900, 
        "type": "OT", 
        "win": 1
    }, 
    "season": 2015
};
}
