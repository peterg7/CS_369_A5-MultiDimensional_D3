
// NOTE: Referenced https://www.d3-graph-gallery.com/graph/line_basic.html

// set the dimensions and margins of the graph
const SCREEN_DIMENSIONS = { 
    width: 960,
    height: 500,
    leftMargin: 250,
    rightMargin: 50,
    topMargin: 50,
    bottomMargin: 100
}
SCREEN_DIMENSIONS.innerWidth = SCREEN_DIMENSIONS.width - SCREEN_DIMENSIONS.leftMargin - SCREEN_DIMENSIONS.rightMargin;
SCREEN_DIMENSIONS.innerHeight = SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.topMargin - SCREEN_DIMENSIONS.bottomMargin;


// append the svg object to the body of the page
var svg = d3.select('body').append('svg')
    .attr('width', SCREEN_DIMENSIONS.width)
    .attr('height', SCREEN_DIMENSIONS.height);

const xParams = {
    value: row => row.date,
    label: 'Date',
    scale: d3.scaleTime(),
    tickPadding: 5
};
xParams.axis = d3.axisBottom()
    .scale(xParams.scale)
    .tickPadding(xParams.tickPadding)
    .tickSize(-SCREEN_DIMENSIONS.innerHeight);

const yParams = {
    value: row => row.starting,
    label: 'Starting # of Colonies',
    scale: d3.scaleLinear(),
    tickPadding: 5
};
yParams.axis = d3.axisLeft()
    .scale(yParams.scale)
    .tickPadding(yParams.tickPadding)
    .tickFormat(d3.format('.2s'))
    .tickSize(-SCREEN_DIMENSIONS.innerWidth)

var parseDate = d3.timeParse("%Y-Q%q");

const QuarterMap = { 'Q1': 1, 'Q2': 4, 'Q3': 7, 'Q4': 10 }
var parseDate = d => {
    let split = d.split('-');
    return d3.timeParse('%Y %m')(split[0] + ' ' + QuarterMap[split[1]])
};

const row = d => {
    return {
        date: parseDate(d['Year']),
        state: d['State'],
        starting: parseInt(d['Starting Colonies'])
    }
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
    .attr('x', -SCREEN_DIMENSIONS.leftMargin * .25)
    .attr('y', -SCREEN_DIMENSIONS.topMargin * 2)
    .text(yParams.label);


const titleGroup = canvas.append("text")
    .attr("x", (SCREEN_DIMENSIONS.innerWidth / 2))             
    .attr("y", 0 - (SCREEN_DIMENSIONS.topMargin / 2))
    .attr("text-anchor", "middle")  
    .style("font-size", "24px") 
    .style("text-decoration", "underline")  
    .text("California Bee Populations in Spring (2015-2021)");


const filterData = d => d.filter(x => (x.state == 'California' &&
                                        x.date.getMonth() == (QuarterMap.Q3 - 1) && 
                                        x.starting));


//Read the data
d3.csv("data/NASS_Bee-Colony_2015-2021.csv", row, data => {

    var cleanData = filterData(data);

    let dateRange = d3.extent(cleanData, xParams.value)
    dateRange[0].setFullYear( dateRange[0].getFullYear() - 1 );
    dateRange[1].setFullYear( dateRange[1].getFullYear() + 1 );
    console.log(dateRange);
    xParams.scale
        .domain(dateRange)
        .range([0, SCREEN_DIMENSIONS.innerWidth])
    
    let maxInitPop = d3.max(cleanData, yParams.value)
    let minInitPop = d3.min(cleanData, yParams.value)
    let buffer = 0.2 * ((maxInitPop - minInitPop) / 2)
    yParams.scale
        .domain([minInitPop - buffer, maxInitPop + buffer])
        .range([SCREEN_DIMENSIONS.innerHeight, 0]);
    
    

    
    // Add dots
    canvas.append('path')
        .datum(cleanData)
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1.5)
        .style("fill",'none')
        .attr('d', d3.line()
                        .x(d => xParams.scale(xParams.value(d)))
                        .y(d => yParams.scale(yParams.value(d))))

    
    xAxisGroup.call(xParams.axis);
    yAxisGroup.call(yParams.axis);
})