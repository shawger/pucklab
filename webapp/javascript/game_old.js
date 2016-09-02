//Load Data
function loadData(){
  return JSON.parse($('#data').html());
}

// EVENT HANDLES
//#####################################################################

$( "#1-period" ).click(function() {
  var pageData = loadData();
  setTime(data,0,1200)
});

$( "#2-period" ).click(function() {
  var pageData = loadData();
  setTime(data,1200,2400)
});

$( "#3-period" ).click(function() {
  var pageData = loadData();
  setTime(data,2400,3600)
});

$( "#all-period" ).click(function() {
  var pageData = loadData();
  setTime(data,0,3600)
});

function majorAxis(start,end){

  var axis = [];

  for(i = start; i <= end; i++){

    if(i%1200 == 0){
      axis = axis.concat(i);
    }
    
  }

  return axis;
}

function majorAxisLabels(time,gameLength){

  if(time == 0){
    return "START";
  }
  else if (time == gameLength){
    return "END";
  }
  else if (time%1200 == 0){
    return time/1200 + " INT"
  }
}


//filter graphs from a start time to an end time
function setTime(data,start,end){

  //Get the new data
  var events = combineEvents(data,'attempts',start,end);

  var forGoals = filterEvents(data.for.goals,start,end);

  var againstGoals = filterEvents(data.against.goals,start,end);

  //Set the range of the data again
  //make it so the graph goes equally in the positive and negative directions
  var maxPosX = Math.abs(d3.max(events, function(d) { return d.dif; }));
  var maxNegX = Math.abs(d3.min(events, function(d) { return d.dif; }));

  var posX = 0;
  var negX = 0;

  if(maxPosX>maxNegX){
    posX = maxPosX;
    negX = -1 * maxPosX;
  }
  else{
    posX = maxNegX;
    negX = -1 * maxNegX;
  }


  y.domain([start,end]);
  x.domain([negX-3, posX+3]);

  // Select the section we want to apply our changes to
  var svg = d3.select("#game-graph");



  var yAxisLeft = svg.transition().select(".y-axis-left")
                 .duration(750)
                 .call(d3.axisLeft(y)
                  .tickValues(majorAxis(start,end)) 
                  .tickFormat(function(d, i){return majorAxisLabels(d,3600)})
                  .tickSize(width/2 - 30)
                );

  var yAxisRight = svg.transition().select(".y-axis-right")
                 .duration(750)
                 .call(d3.axisRight(y)
                  .tickValues(majorAxis(start,end)) 
                  .tickFormat(function(d, i){return majorAxisLabels(d,3600)})
                  .tickSize(width/2 - 30)
                );


  var yAxisRightSub = svg.transition().select(".y-axis-sub-right")
                          .duration(750)
                          .call(d3.axisRight(y)
                          .tickValues(subMinorAxis(0,3600)) 
                          .tickFormat(function(d, i){
                                                    "";})
                          )

  var yAxisLeftSub = svg.transition().select(".y-axis-sub-left")
                          .duration(750)
                          .call(d3.axisLeft(y)
                          .tickValues(subMinorAxis(0,3600)) 
                          .tickFormat(function(d, i){
                                                    "";})
                          )

  //Move the line
  var line = svg.transition().select(".line")
                 .attr("d", valueline(events))
                 .duration(750);

  //Move the points
  var points = svg.selectAll(".point").data(events)

  points.transition()
         .attr("transform", function(d) { 
                  return "translate(" + x(d.dif) + "," + y(d.time) + ")"; })
         .style("visibility","visible")
         .duration(750)

  points.exit().transition().style("visibility","hidden");


  //Move the goal circles
  //For
  var forCircles = svg.selectAll("circle.forTeam")
                        .data(forGoals)

  forCircles.enter()
            .append('circle')
            .attr("r", 10)
            .attr("class", "forTeam");

  forCircles.transition()
              .attr("cy", function(d) { return y(d.time); })
              .attr("cx", function(d) { return x(d.stats.dif.attempts) - 50; })
              .style("visibility","visible")
              .duration(750);

  forCircles.exit().transition()
      .style("visibility","hidden");

  //Against
  var againstCircles = svg.selectAll("circle.againstTeam").data(againstGoals);

  againstCircles.transition()
              .attr("cy", function(d) { return y(d.time); })
              .attr("cx", function(d) { return x(d.stats.dif.attempts) + 50; })
              .style("visibility","visible")
              .duration(750);

  againstCircles.exit().transition().style("visibility","hidden");

  //Move the goal text
  //For
  var forScore = svg.selectAll("text.forTeamText").data(forGoals);

  forScore.transition()
          .attr("y", function(d) { return y(d.time)+6; })
          .attr("x", function(d) { return x(d.stats.dif.attempts) - 55; })
          .text(function(d) { return d.stats.for.goals; })
          .style("visibility","visible")
          .duration(750);

  forScore.exit().transition().style("visibility","hidden");

  //Against
  var againstScore = svg.selectAll("text.againstTeamText").data(againstGoals);

  againstScore.transition()
          .attr("y", function(d) { return y(d.time)+6; })
          .attr("x", function(d) { return x(d.stats.dif.attempts) + 45; })
          .text(function(d) { return d.stats.against.goals; })
          .style("visibility","visible")
          .duration(750);

  againstScore.exit().transition().style("visibility","hidden");

  //Move the goal lines
  //For
  var forGoalLines = svg.selectAll("line.forTeam").data(forGoals);

  forGoalLines.transition()
              .attr("x1", function(d) { return x(d.stats.dif.attempts); })
              .attr("x2", function(d) { return x(d.stats.dif.attempts) - 50; })
              .attr("y1", function(d) { return y(d.time); })
              .attr("y2", function(d) { return y(d.time); })
              .style("visibility","visible")
              .duration(750);

  forGoalLines.exit().transition().style("visibility","hidden");

  //Against
  var againstGoalLines = svg.selectAll("line.againstTeam").data(againstGoals);

  againstGoalLines.transition()
              .attr("x1", function(d) { return x(d.stats.dif.attempts); })
              .attr("x2", function(d) { return x(d.stats.dif.attempts) + 50; })
              .attr("y1", function(d) { return y(d.time); })
              .attr("y2", function(d) { return y(d.time); })
              .style("visibility","visible")
              .duration(750);

  againstGoalLines.exit().transition().style("visibility","hidden");

}


function filterEvents(data,start,end){

  var newData = [];
  
  for(i = 0; i < data.length; i++){

    if(data[i].time >= start && data[i].time <= end){
      newData = newData.concat(data[i]);
    }
  }

  return newData;
}

//combineEvents combines for and against events of a certian kind
function combineEvents(data,stat,start,end){

  var events = []

  
  //For stats
  for(i = 0; i < data.for[stat].length; i++){

    var event = {};

    var time = data.for[stat][i]['time'];
    
    //If the time is in the given range, include it in the data
    if(time >= start && time <= end ){
      event['time'] = data.for[stat][i]['time'];
      event['dif'] = data.for[stat][i]['stats']['dif'][stat];
      event['for'] = 1;
      event['type'] = data.for[stat][i]['type'];

      events = events.concat(event);
    }
  }

  //Against stats
  for(i = 0; i < data.against[stat].length; i++){

    var event = {};

    var time = data.against[stat][i]['time'];
    
    //If the time is in the given range, include it in the data
    if(time >= start && time <= end ){

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


var data = loadData();

var events = combineEvents(data,'attempts',0,data.results.gameLength);

//#####################################################################


var graphWidth = $( "#game-graph" ).width();
var graphheight = $( "#game-graph" ).height();

// Set the dimensions of the canvas / graph
var margin = {top: 30, right: 20, bottom: 30, left: 20},
    width = graphWidth - margin.left - margin.right,
    height = graphheight - margin.top - margin.bottom;

// Set the ranges
var x = d3.scaleLinear().range([width, 0]);
var y = d3.scaleLinear().range([0, height]);

// Define the statline
var valueline = d3.line()
    .y(function(d) { return y(d.time); })
    .x(function(d) { return x(d.dif); });

    
// Adds the svg canvas
var svg = d3.select("#game-graph")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", 
              "translate(" + margin.left + "," + margin.top + ")");

// Scale the range of the data
// Y should be the same magnitude in both the positive and negative
// directions

var maxPosX = Math.abs(d3.max(events, function(d) { return d.dif; }));
var maxNegX = Math.abs(d3.min(events, function(d) { return d.dif; }));

var posX = 0;
var negX = 0;

if(maxPosX>maxNegX){
  posX = maxPosX;
  negX = -1 * maxPosX;
}
else{
  posX = maxNegX;
  negX = -1 * maxNegX;
}

y.domain([0,data.results.gameLength]);
x.domain([negX-3, posX+3]);

//Axis

svg.append("g")
    .attr("class", "y-axis y-axis-left")
    .attr("transform", "translate(" + width/2 + ",0)")
    .call(d3.axisLeft(y)
      .tickValues(majorAxis(0,3600)) 
      .tickFormat(function(d, i){return majorAxisLabels(d,3600)})
      .tickSize(width/2 -30)
      )

svg.append("g")
    .attr("class", "y-axis y-axis-right")
    .attr("transform", "translate(" + width/2 + ",0)")
    .call(d3.axisRight(y)
      .tickValues(majorAxis(0,3600)) 
      .tickFormat(function(d, i){return majorAxisLabels(d,3600)})
      .tickSize(width/2 - 30)
      )

svg.append("g")
    .attr("class", "y-axis-sub y-axis-sub-right")
    .attr("transform", "translate(" + width/2 + ",0)")
    .call(d3.axisRight(y)
      .tickValues(subMinorAxis(0,3600)) 
      .tickFormat(function(d, i){
                          "";})
      )

svg.append("g")
    .attr("class", "y-axis-sub y-axis-sub-left")
    .attr("transform", "translate(" + width/2 + ",0)")
    .call(d3.axisLeft(y)
      .tickValues(subMinorAxis(0,3600)) 
      .tickFormat(function(d, i){
                          "";})
      )

// Add the valueline path.
var statLine = svg.append("path")
                    .attr("class", "line")
                    .attr("d", valueline(events))


//Graph the points
var point = svg.selectAll("point")
                .data(events)
                .enter()
                .append("path")
                .attr("class", "point")
                .attr("d", d3.symbol()
                  .type(function(d) {
                    if(d.type == "goal"){
                      return d3.symbolDiamond; 
                    }
                    else if(d.type == "shot"){
                      return d3.symbolCircle;
                    }
                    else{
                      return d3.symbolCross;
                    }})
                .size(10))
                .attr("transform", function(d) { 
                  return "translate(" + x(d.dif) + "," + y(d.time) + ")"; });

//Graph the goal dots and line
//For Goals
var forGoalLines = svg.selectAll("line.forGoals")
                      .data(data.for.goals)
                      .enter()
                      .append('line')
                      .attr("x1", function(d) { return x(d.stats.dif.attempts); })
                      //.attr("x2", x(posX))
                      .attr("x2", function(d) { return x(d.stats.dif.attempts) - 50; })
                      .attr("y1", function(d) { return y(d.time); })
                      .attr("y2", function(d) { return y(d.time); })
                      .attr( "stroke-width", "1" )
                      .attr( "stroke", "grey")
                      .attr("class", "forTeam");

var forCircles = svg.selectAll("circle.for")
                .data(data.for.goals)
                .enter()
                .append('circle')

var forCircleAttributes = forCircles               
                .attr("cy", function(d) { return y(d.time); })
                .attr("cx", function(d) { return x(d.stats.dif.attempts) - 50; })
                .attr("r", 15)
                .attr("class", "forTeam")

var forText = svg.selectAll("text.for")
                        .data(data.for.goals)
                        .enter()
                        .append("text");

var forTextLabels = forText
                 .attr("y", function(d) { return y(d.time)+6; })
                 .attr("x", function(d) { return x(d.stats.dif.attempts) - 55; })
                 .text(function(d) { return d.stats.for.goals; })
                 .attr("font-size", "16px")
                 .attr("fill", "black")
                 .attr("class", "forTeamText");

//Against Goals
var againstGoalLines = svg.selectAll("line.againstGoals")
                      .data(data.against.goals)
                      .enter()
                      .append('line')
                      .attr("x1", function(d) { return x(d.stats.dif.attempts); })
                      .attr("x2", function(d) { return x(d.stats.dif.attempts) + 50; })
                      .attr("y1", function(d) { return y(d.time); })
                      .attr("y2", function(d) { return y(d.time); })
                      .attr("stroke-width", "1" )
                      .attr("stroke", "black")
                      .attr("class", "againstTeam");

var againstCircles = svg.selectAll("circle.against")
                .data(data.against.goals)
                .enter()
                .append('circle')

var againstCircleAttributes = againstCircles               
                .attr("cy", function(d) { return y(d.time); })
                .attr("cx", function(d) { return x(d.stats.dif.attempts) + 50; })
                .attr("r", 15)
                .attr("class", "againstTeam")

var againstText = svg.selectAll("text.against")
                        .data(data.against.goals)
                        .enter()
                        .append("text");

var againstTextLabels = againstText
                 .attr("y", function(d) { return y(d.time)+6; })
                 .attr("x", function(d) { return x(d.stats.dif.attempts) + 45; })
                 .text(function(d) { return d.stats.against.goals; })
                 .attr("font-size", "16px")
                 .attr("fill", "black")
                 .attr("class", "againstTeamText");


// Add the Y Axis

function subMinorAxis(start,end){

  var axis = [];

  for(i = start; i <= end; i++){

    if(i%60 == 0){
      axis = axis.concat(i);
    }
    
  }

  return axis;
}




//Add for goals
svg.selectAll(".point")
      .data(events)
    .enter().append("path")
      .attr("class", "point")
