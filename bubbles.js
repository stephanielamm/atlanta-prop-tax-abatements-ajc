(function() {
var width = 500,
  height = 500;

var svg = d3.select("#chart")
  .append("svg")
  .attr("height", height)
  .attr("width", width)
  .append("g")
  .attr("transform", "translate(0,0)")

var radiusScale = d3.scaleSqrt().domain([1, 40000]).range([10,80])

var simulation = d3.forceSimulation()
  .force("x", d3.forceX(width / 2).strength(0.05))
  .force("y", d3.forceY(height /2).strength(0.05))
  .force("collide", d3.forceCollide(function(d) {
    return radiusScale(d.abated) + 3;
  }))

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
