(function() {
var width = 900,
  height = 900;

var svg = d3.select("#chart")
  .append("svg")
  .attr("height", height)
  .attr("width", width)
  .append("g")
  .attr("transform", "translate(0,0)")

var radiusScale = d3.scaleSqrt().domain([900, 3000000]).range([10,50])

var forceXSeparate = d3.forceX(function(d){
  if(d.jurisdiction === 'Atlanta') {
    return 250
  } else {
    return 700
  }
}).strength(0.05)

var forceXCombine = d3.forceX(width / 2).strength(0.05)

var forceCollide = d3.forceCollide(function(d) {
  return radiusScale(d.abated) + 5;
})

var simulation = d3.forceSimulation()
  .force("x", forceXCombine)
  .force("y", d3.forceY(height /2).strength(0.05))
  .force("collide", forceCollide)

d3.queue()
  .defer(d3.csv, "taxes.csv")
  .await(ready)

function ready (error, datapoints) {

  var circles = svg.selectAll(".company")
    .data(datapoints)
    .enter().append("circle")
    .attr("class", "company")
    .attr("r", function(d){
      return radiusScale(d.abated);
    })
    .attr("fill", "lightblue")

  d3.select("#jurisdiction").on('click', function(){
    simulation
    .force("x", forceXSeparate)
    .alphaTarget(0.29)
    .restart()
  })

  d3.select("#combine").on('click', function(){
    simulation
    .force("x", forceXCombine)
    .alphaTarget(0.2)
    .restart()
  })

  simulation.nodes(datapoints)
    .on('tick', ticked)

  function ticked() {
    circles
      .attr("cx", function(d) {
        return d.x
      })
      .attr("cy", function(d) {
        return d.y
      })
  }
}
})();
