
// NOTE: Referenced https://www.d3-graph-gallery.com/graph/bubble_template.html

const REMOVE_OUTLIERS = false;

// set the dimensions and margins of the graph
const SCREEN_DIMENSIONS = { 
    width: 960,
    height: 500,
    leftMargin: 100,
    rightMargin: 150,
    topMargin: 50,
    bottomMargin: 100
}
SCREEN_DIMENSIONS.innerWidth = SCREEN_DIMENSIONS.width - SCREEN_DIMENSIONS.leftMargin - SCREEN_DIMENSIONS.rightMargin;
SCREEN_DIMENSIONS.innerHeight = SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.topMargin - SCREEN_DIMENSIONS.bottomMargin;

const columnTranslations = new Map([
    ['Year', 'date'], // parse to date object
    ['State', 'state'], // parse as string
    ["Starting Colonies", "starting"], // parse as int
    ["Maximum Colonies", "maximum"], // parse as int
    ["Renovated Colonies", "renovated"], // parse as int
    ["Added Colonies", "added"], // parse as int
    ["Lost Colonies", "lost"] // parse as int
]);

// append the svg object to the body of the page
var svg = d3.select('body').append('svg')
    .attr('width', SCREEN_DIMENSIONS.width)
    .attr('height', SCREEN_DIMENSIONS.height);

const xParams = {
    value: row => row.starting,
    label: 'Starting # of Colonies',
    scale: d3.scaleLinear(),
    tickPadding: 5
};
xParams.axis = d3.axisBottom()
    .scale(xParams.scale)
    .tickPadding(xParams.tickPadding)
    .tickFormat(d3.format('.2s'))
    .tickSize(-SCREEN_DIMENSIONS.innerHeight);

const yParams = {
    value: row => row.maximum,
    label: 'Maximum # of Colonies',
    scale: d3.scaleLinear(),
    tickPadding: 5
};
yParams.axis = d3.axisLeft()
    .scale(yParams.scale)
    .tickPadding(yParams.tickPadding)
    .tickFormat(d3.format('.2s'))
    .tickSize(-SCREEN_DIMENSIONS.innerWidth)

const sizeParams = {
    value: row => row.added,
    scale: d3.scaleLinear()
} 

const colorParams = {
    value: row => row.renovated
} 

const canvas = svg.append('g')
    .attr('transform', `translate(${SCREEN_DIMENSIONS.leftMargin},${SCREEN_DIMENSIONS.topMargin})`);


const xAxisGroup = canvas.append('g')
    .attr('transform', `translate(0, ${SCREEN_DIMENSIONS.innerHeight})`);

const yAxisGroup = canvas.append('g');

xAxisGroup.append('text')
    .attr('class', 'x-axis-label')
    .attr('x', SCREEN_DIMENSIONS.innerWidth / 2)
    .attr('y', 75)
    .text(xParams.label);

yAxisGroup.append('text')
    .attr('class', 'y-axis-label')
    .attr('x', -SCREEN_DIMENSIONS.leftMargin * .5)
    .attr('y', -SCREEN_DIMENSIONS.topMargin * 1.5)
    .text(yParams.label);


const titleGroup = canvas.append("text")
    .attr("x", (SCREEN_DIMENSIONS.innerWidth / 2))             
    .attr("y", 0 - (SCREEN_DIMENSIONS.topMargin / 2))
    .attr("text-anchor", "middle")  
    .style("font-size", "24px") 
    .style("text-decoration", "underline")  
    .text("US Bee Population Trends in 2020-Q2 by State");



// Mimics Python's numpy function to create an array of `n` equally spaced values
// within a range
function linspace(startValue, stopValue, cardinality, round=true) {
    var arr = [];
    var step = (stopValue - startValue) / (cardinality - 1);
    for (var i = 0; i < cardinality; i++) {
        arr.push(round ? Math.round(startValue + (step * i)) : startValue + (step * i));
    }
    return arr;
}


const QUARTERS_MAP = { 'Q1': 1, 'Q2': 4, 'Q3': 7, 'Q4': 10 }
const INVALID_MARKERS = ['(X)', '(NA)', '(Z)'];

const preprocess = (row, i) => {

    let isValid = d => {
        return !Object.values(d).some(a => INVALID_MARKERS.includes(a));
    }
    let parseDate = d => d3.timeParse('%Y %m')(d.replace(/-(\w+)/, (match,key) => ' ' + QUARTERS_MAP[key] || match));
    
    return (isValid(row)) ? Object.fromEntries(
        Array.from(columnTranslations.entries())
            .map(([key, val]) => {
                if (key == 'State') { return [val, row[key]]; }
                else if (key == 'Year') { return [val, parseDate(row[key])]; }
                else { return [val, parseInt(row[key])]; }
            })
    ) : null;
};

const trimOutliers = (data, col) => {
    let sorted, q1, q3, iqr, maxValue, minValue;

    sorted = data.sort((a, b) => d3.ascending(a[col], b[col]));
    if((sorted.length / 4) % 1 == 0) { 
        q1 = 1/2 * (sorted[(sorted.length / 4)][col] + sorted[(sorted.length / 4) + 1][col]);
        q3 = 1/2 * (sorted[(sorted.length * (3 / 4))][col] + sorted[(sorted.length * (3 / 4)) + 1][col]);
    } else {
        q1 = sorted[Math.floor(sorted.length / 4 + 1)][col];
        q3 = sorted[Math.ceil(sorted.length * (3 / 4) + 1)][col];
    }
    iqr = q3 - q1;
    maxValue = q3 + iqr * 1.5;
    minValue = q1 - iqr * 1.5;

    return sorted.filter((x) => (x[col] >= minValue) && (x[col] <= maxValue));
}


//Read the data
d3.csv("../data/NASS_Bee-Colony_2015-2021.csv", preprocess).then((data, i) => {

    var cleanData = REMOVE_OUTLIERS ? trimOutliers(data, 'starting') : data; 
    
    yParams.scale
        .domain([d3.min(cleanData, yParams.value), d3.max(cleanData, yParams.value)])
        .range([SCREEN_DIMENSIONS.innerHeight, 0]);
    
    xParams.scale
        .domain([0, d3.max(cleanData, xParams.value)])
        .range([0, SCREEN_DIMENSIONS.innerWidth])


    let minSizeVal = d3.min(cleanData, sizeParams.value)
    let maxSizeVal = d3.max(cleanData, sizeParams.value)
    sizeParams.scale
        .domain([minSizeVal, maxSizeVal])
        .range([2, 15])
    
    
    let minColorVal = d3.min(cleanData, colorParams.value)
    let maxColorVal = d3.max(cleanData, colorParams.value)
    var colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
        .domain([minColorVal, maxColorVal])

    
    
    let tooltip = d3.select("body")
                        .append("div")
                        .attr("class", "tooltip")
                        .style("opacity", 0)
                        

    let showTooltip = function(event, d) {
        tooltip.transition()
                .duration(200)
                .style("opacity", .9);
        
        tooltip
            .html(`State: ${d.state}<br>
                    Date: ${d.date.toLocaleDateString("en-US")}<br>
                    Added Cols: ${d3.format(".2s")(d.added)}<br>
                    Renovated Cols: ${d3.format(".2s")(d.renovated)}`)
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px")
    }

    let hideTooltip = d => {
        tooltip.transition()
                .duration(500)
                .style("opacity", 0)
    }
    
    // Add dots
    canvas.append('g')
        .selectAll("dot")
        .data(cleanData)
        .enter()
        .append("circle")
        .attr("cx", d => xParams.scale(xParams.value(d)))
        .attr("cy", d => yParams.scale(yParams.value(d)))
        .attr("r", d => sizeParams.scale(sizeParams.value(d)))
        .style("fill", d => colorScale(colorParams.value(d)))
            .on("mouseover", showTooltip )
            .on("mouseleave", hideTooltip )

    // Draw axis
    xAxisGroup.call(xParams.axis);
    yAxisGroup.call(yParams.axis);

    
    // Prep legend definitions
    let legendSizes = linspace(minSizeVal, maxSizeVal, 3);
    let centerX = SCREEN_DIMENSIONS.innerWidth + (SCREEN_DIMENSIONS.rightMargin / 2);
    let yPos = idx => SCREEN_DIMENSIONS.topMargin - 50 + (175 / ((legendSizes.length - idx) + 1));
    let gradientWidth = 100;
    let gradientHeight = 20;
    let gradientX = centerX - (gradientWidth / 2)
    let gradientY = yPos(legendSizes.length)


    // Add size legend
    canvas.append("rect")
        .attr("class", "legend-box")
        .attr("x", gradientX - 12)
        .attr("y", yPos(0) - 30)
        .attr("width", gradientWidth * 1.3)
        .attr("height", gradientHeight * 5)
        .attr("rx", 10)
        .attr('opacity', 0.7)
        .attr('fill', 'slategray')
    
    
    legendSizes.forEach((size, idx) => {
        // bubbles
        canvas.append("circle")
                .attr("class", "legend-size-bubble")
                .attr("cx", centerX - 10)
                .attr("cy", yPos(idx))
                .attr("r", sizeParams.scale(size))
                .style("fill", "white")
                .attr("stroke", "black")

        // indicator lines
        canvas.append("line")
                .attr('x1',centerX + sizeParams.scale(size) - 10)
                .attr('x2', centerX + 15)
                .attr('y1', yPos(idx))
                .attr('y2', yPos(idx))
                .attr('stroke', 'black')
                .style('stroke-dasharray', ('2,2'))

        // size labels
        canvas.append("text")
                .attr('x', centerX + 15)
                .attr('y', yPos(idx))
                .text(d3.format(".2s")(size))
                .style("font-size", 10)
                .attr('alignment-baseline', 'middle')
    })


    // Legend title
    canvas.append("text")
        .attr("class", "legend-bubbles-title")
        .attr('x', centerX)
        .attr("y", yPos(0) - 15)
        .text("Added Colonies")
        .style("font-size", 13)
        .attr("text-anchor", "middle")


    // Setup color legend
    canvas.append("rect")
        .attr("class", "legend-box")
        .attr("x", gradientX - 12)
        .attr("y", gradientY - (gradientWidth * 0.35))
        .attr("width", gradientWidth * 1.3)
        .attr("height", gradientHeight * 4)
        .attr("rx", 10)
        .attr('opacity', 0.7)
        .attr('fill', 'slategray')

    //Append a defs (for definition) element to your SVG
    var defs = svg.append("defs");

    //Append a linearGradient element to the defs and give it a unique id
    var linearGradient = defs.append("linearGradient")
                            .attr("id", "linear-gradient");

    //Horizontal gradient
    linearGradient.attr("x1", "0%")
                    .attr("y1", "0%")
                    .attr("x2", "100%")
                    .attr("y2", "0%");


    //Set the color for the start (0%)
    linearGradient.append("stop")
                    .attr("offset", "0%")
                    .attr("stop-color", colorScale(minColorVal));

    console.log(colorScale(minColorVal), typeof colorScale(minColorVal))

    //Set the color for the end (100%)
    linearGradient.append("stop")
                    .attr("offset", "100%")
                    .attr("stop-color", colorScale(maxColorVal));


    //Draw the rectangle and fill with gradient
    canvas.append("rect")
        .attr('x', gradientX)
        .attr("y", gradientY)
        .attr("width", gradientWidth)
        .attr("height", gradientHeight)
        .style("fill", "url(#linear-gradient)");


    let colorLegendVals = linspace(minColorVal, maxColorVal, 4);
    let colorLegendScale = d3.scaleLinear(colorLegendVals)
                                .domain([colorLegendVals[0], colorLegendVals[colorLegendVals.length - 1]])
                                .range([0, gradientWidth]);
                                
    

    colorLegendVals.forEach((val, idx) => {
        
        canvas.append("line")
                .attr('x1', gradientX + colorLegendScale(val))
                .attr('x2', gradientX + colorLegendScale(val))
                .attr('y1', yPos(legendSizes.length) + gradientHeight)
                .attr('y2', yPos(legendSizes.length) + gradientHeight + 5)
                .attr('stroke', 'slategray')
                .attr('stroke-width', 1)
                .attr('opacity', 0.7)

        canvas.append("text")
                .attr('x', gradientX + colorLegendScale(val) - 5)
                .attr('y', yPos(legendSizes.length) + gradientHeight + 10)
                .text(d3.format(".2s")(val))
                .style("font-size", 8)
                .attr('alignment-baseline', 'middle')
    })



    // Legend title
    canvas.append("text")
        .attr("class", "legend-colors-title")
        .attr('x', centerX)
        .attr("y", yPos(legendSizes.length) - 15)
        .text("Renovated Colonies")
        .style("font-size", 12)
        .attr("text-anchor", "middle")
});