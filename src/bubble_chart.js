/*
/ Based on this tutorial by Jim Vallandingham http://vallandingham.me/bubble_charts_with_d3v4.html
/ Special thanks to Julia Wolfe and Kristi Walker for fielding my questions during this project.
 */

function bubbleChart() {
  // Constants for sizing
  var width = 940;
  var height = 800;

  // tooltip for mouseover functionality
  var tooltip = floatingTooltip('tooltip', 240);

  // Locations to move bubbles towards, depending
  // on which view mode is selected.
  var center = { x: width / 2, y: height / 2 };


var muniCenters = {
  // row 1
  Alpharetta: { x: 160, y: 180 },
  Atlanta: { x: 305, y: 220 },
  Brookhaven: { x: 440, y: 180 },
  'Unincorporated Cobb': { x: 640, y: 140 },
  // row 2
  'East Point': { x: 160, y: 370 },
  'Johns Creek': { x: 305, y: 350 },
  'Sandy Springs': { x: 470, y: 410 },
  Stonecrest: { x: 635, y: 420 },
  // row 3
  Tucker: { x: 160, y: 510 },
  'DeKalb County': { x: 305, y: 510 },
  'Union City': { x: 490, y: 510 },
  Other: { x: 645, y: 550 }

};

// X locations of the municipality titles.
var munisTitleX = {
  // row 1
  Alpharetta: 100,
  Atlanta: 305,
  Brookhaven: 490,
  'Unincorporated Cobb': 685,
  // row 2
  'East Point':  100,
  'Johns Creek': 305,
  'Sandy Springs':  490,
  Stonecrest: 685,
  // row 3
  Tucker: 100,
  'DeKalb County': 305,
  'Union City': 490,
  Other: 685


  };

// Y locations of the municipality titles.
var munisTitleY = {
  // row 1
  Alpharetta: 50,
  Atlanta: 50,
  Brookhaven: 50,
  'Unincorporated Cobb': 50,
  // row 2
  'East Point': 380,
  'Johns Creek': 380,
  'Sandy Springs': 380,
  Stonecrest: 380,
  // row 3
  Tucker: 530,
  'DeKalb County': 530,
  'Union City': 530,
  Other: 530

};

  // @v4 strength to apply to the position forces
  var forceStrength = 0.04;

  // These will be set in create_nodes and create_vis
  var svg = null;
  var bubbles = null;
  var nodes = [];

  // Charge function that is called for each node.
  // As part of the ManyBody force.
  // This is what creates the repulsion between nodes.
  //
  // Charge is proportional to the diameter of the
  // circle (which is stored in the radius attribute
  // of the circle's associated data.
  //
  // This is done to allow for accurate collision
  // detection with nodes of different sizes.
  //
  // Charge is negative because we want nodes to repel.
  // @v4 Before the charge was a stand-alone attribute
  //  of the force layout. Now we can use it as a separate force!
  function charge(d) {
    return -Math.pow(d.radius, 2.0) * forceStrength;
  }

  // Here we create a force layout and
  // @v4 We create a force simulation now and
  //  add forces to it.
  var simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .force('x', d3.forceX().strength(forceStrength).x(center.x))
    .force('y', d3.forceY().strength(forceStrength).y(center.y))
    .force('charge', d3.forceManyBody().strength(charge))
    .on('tick', ticked);

  // @v4 Force starts up automatically,
  //  which we don't want as there aren't any nodes yet.
  simulation.stop();

  // set the colors. I chose to put percentages into 3 buckets.
  var fillColor = d3.scaleOrdinal()
    .domain(['low', 'medium', 'high'])
    .range(['#ED8451', '#CC3301', '#7A1E00']);


  /*
   * This data manipulation function takes the raw data from
   * the CSV file and converts it into an array of node objects.
   * Each node will store data and visualization values to visualize
   * a bubble.
   *
   * rawData is expected to be an array of data objects, read in from
   * one of d3's loading functions like d3.csv.
   *
   * This function returns the new node array, with a node in that
   * array for each element in the rawData input.
   */
  function createNodes(rawData) {
    // Use the max taxes_abated in the data as the max in the scale's domain
    // note we have to ensure the taxes_abated is a number.
    var maxAmount = d3.max(rawData, function (d) { return +d.taxes_abated; });

    // Sizes bubbles based on area.
    // @v4: new flattened scale names.
    var radiusScale = d3.scalePow()
      .exponent(0.8)
      .range([8, 55])
      .domain([0, maxAmount]);

    // Use map() to convert raw data into node data.
    // Checkout http://learnjsdata.com/ for more on
    // working with data.
    var myNodes = rawData.map(function (d) {
      return {
        id: d.id,
        radius: radiusScale(+d.taxes_abated),
        property: d.property,
        jurisdiction: d.jurisdiction,
        assessed_value: +d.assessed_value,
        taxes_owed: +d.taxes_owed,
        taxes_abated: +d.taxes_abated,
        percent_abated: +d.percent_abated,
        group: d.group,
        muni: d.jur_buckets,
        x: Math.random() * 900,
        y: Math.random() * 800
      };
    });

    // sort them to prevent occlusion of smaller nodes.
    myNodes.sort(function (a, b) { return b.value - a.value; });

    return myNodes;
  }

  /*
   * Main entry point to the bubble chart. This function is returned
   * by the parent closure. It prepares the rawData for visualization
   * and adds an svg element to the provided selector and starts the
   * visualization creation process.
   *
   * selector is expected to be a DOM element or CSS selector that
   * points to the parent element of the bubble chart. Inside this
   * element, the code will add the SVG continer for the visualization.
   *
   * rawData is expected to be an array of data objects as provided by
   * a d3 loading function like d3.csv.
   */
  var chart = function chart(selector, rawData) {
    // convert raw data into nodes data
    nodes = createNodes(rawData);

    // Create a SVG element inside the provided selector
    // with desired size.
    svg = d3.select(selector)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Bind nodes data to what will become DOM elements to represent them.
    bubbles = svg.selectAll('.bubble')
      .data(nodes, function (d) { return d.id; });

    // Create new circle elements each with class `bubble`.
    // There will be one circle.bubble for each object in the nodes array.
    // Initially, their radius (r attribute) will be 0.
    // @v4 Selections are immutable, so lets capture the
    //  enter selection to apply our transtition to below.
    var bubblesE = bubbles.enter().append('circle')
      .classed('bubble', true)
      .attr('r', 0)
      .attr('fill', function (d) { return fillColor(d.group); })
      .attr('stroke', function (d) { return d3.rgb(fillColor(d.group)).darker(); })
      .attr('stroke-width', 1)
      .on('mouseover', showDetail)
      .on('mouseout', hideDetail);

    // @v4 Merge the original empty selection and the enter selection
    bubbles = bubbles.merge(bubblesE);

    // Fancy transition to make bubbles appear, ending with the
    // correct radius
    bubbles.transition()
      .duration(1000)
      .attr('r', function (d) { return d.radius; });

    // Set the simulation's nodes to our newly created nodes array.
    // @v4 Once we set the nodes, the simulation will start running automatically!
    simulation.nodes(nodes);

    // Set initial layout to single group.
    groupBubbles();
  };

  /*
   * Callback function that is called after every tick of the
   * force simulation.
   * Here we do the acutal repositioning of the SVG circles
   * based on the current x and y values of their bound node data.
   * These x and y values are modified by the force simulation.
   */
  function ticked() {

    bubbles
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; });
  }

  /*
   * Provides a x value for each node to be used with the split by municipality
   * x force.
   */
   function nodeMuniPosX(d) {
      return muniCenters[d.muni].x;
    }

    function nodeMuniPosY(d) {
       return muniCenters[d.muni].y;
     }


  /*
   * Sets visualization in "single group mode".
   * The municipality labels are hidden and the force layout
   * tick function is set to move all nodes to the
   * center of the visualization.
   */
   function groupBubbles() {
     hideMuniTitles();

    // @v4 Reset the 'x' force to draw the bubbles to the center.
    simulation.force('x', d3.forceX().strength(forceStrength).x(center.x));
    simulation.force('y', d3.forceY().strength(forceStrength).y(center.y));


    // @v4 We can reset the alpha value and restart the simulation
    simulation.alpha(1).restart();
  }


  /*
   * Sets visualization in "split by municipality mode".
   * The municipality labels are shown and the force layout
   * tick function is set to move nodes to the
   * MuniCenter of their data's municipality.
   */
   function splitBubbles() {
     showMuniTitles();

     // @v4 Reset the 'x' and 'y' forces to draw the bubbles to their muni centers
     simulation.force('x', d3.forceX().strength(forceStrength).x(nodeMuniPosX));

     simulation.force('y', d3.forceY().strength(forceStrength).y(nodeMuniPosY));

     // @v4 We can reset the alpha value and restart the simulation
     simulation.alpha(1).restart();
   }

   /*
    * Hides municipality title displays.
    */
   function hideMuniTitles() {
     svg.selectAll('.muni').remove();
   }

   /*
    * Shows municipality title displays.
    */
   function showMuniTitles() {
     // Another way to do this would be to create
     // the muni texts once and then just hide them.
     var munisData = d3.keys(munisTitleX);
     var munis = svg.selectAll('.muni')
       .data(munisData);

     munis.enter().append('text')
       .attr('class', 'muni')
       .attr('x', function (d) { return munisTitleX[d]; })
       .attr('y', function (d) { return munisTitleY[d]; })
       .attr('text-anchor', 'middle')
       .text(function (d) { return d; });
   }


  /*
   * Function called on mouseover to display the
   * details of a bubble in the tooltip.
   */
  function showDetail(d) {
    // change outline to indicate hover state.
    d3.select(this).attr('stroke', 'black');

    var content = '<span class="name">Property: </span><span class="value">' +
                  d.property +
                  '</span><br/>' +
                  '<span class="name">Assessed Value: </span><span class="value">$' +
                  addCommas(d.assessed_value) +
                  '</span><br/>' +
                  '<span class="name">Taxes Owed: </span><span class="value">$' +
                  addCommas(d.taxes_owed) +
                  '</span><br/>' +
                  '<span class="name">Taxes Abated: </span><span class="value">$' +
                  addCommas(d.taxes_abated) +
                  '</span><br/>' +
                  '<span class="name">Percent Abated: </span><span class="value">' +
                  d.percent_abated + '%' +
                  '</span><br/>' +
                  '<span class="name">Municipality: </span><span class="value">' +
                  d.jurisdiction +
                  '</span>';

    tooltip.showTooltip(content, d3.event);
  }

  /*
   * Hides tooltip
   */
  function hideDetail(d) {
    // reset outline
    d3.select(this)
      .attr('stroke', d3.rgb(fillColor(d.group)).darker());

    tooltip.hideTooltip();
  }

  /*
   * Externally accessible function (this is attached to the
   * returned chart function). Allows the visualization to toggle
   * between "single group" and "split by municipality" modes.
   *
   * displayName is expected to be a string and either 'municipality' or 'all'.
   */
   chart.toggleDisplay = function (displayName) {
     if (displayName === 'muni') {
       splitBubbles();
     } else {
       groupBubbles();
     }
   };


  // return the chart function from closure.
  return chart;
}

/*
 * Below is the initialization code as well as some helper functions
 * to create a new bubble chart instance, load the data, and display it.
 */

var myBubbleChart = bubbleChart();

/*
 * Function called once data is loaded from CSV.
 * Calls bubble chart function to display inside #vis div.
 */
function display(error, data) {
  if (error) {
    console.log(error);
  }

  myBubbleChart('#vis', data);
}

/*
 * Sets up the layout buttons to allow for toggling between view modes.
 */
function setupButtons() {
  d3.select('#toolbar')
    .selectAll('.button')
    .on('click', function () {
      // Remove active class from all buttons
      d3.selectAll('.button').classed('active', false);
      // Find the button just clicked
      var button = d3.select(this);

      // Set it as the active button
      button.classed('active', true);

      // Get the id of the button
      var buttonId = button.attr('id');

      // Toggle the bubble chart based on
      // the currently clicked button.
      myBubbleChart.toggleDisplay(buttonId);
    });
}

/*
 * Helper function to convert a number into a string
 * and add commas to it to improve presentation.
 */
function addCommas(nStr) {
  nStr += '';
  var x = nStr.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }

  return x1 + x2;
}

// Load the data.
d3.csv('data/taxes.csv', display);

// setup the buttons.
setupButtons();
