
// NOTE: Referenced https://www.d3-graph-gallery.com/graph/bubble_template.html

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
    value: row => row.renovated,
    scale: d3.scaleOrdinal(d3.schemeCategory10)
} 

const row = d => {
    return {
        year: d['Year'],
        state: d['State'],
        renovated: parseInt(d['Renovated Colonies']),
        added: parseInt(d['Added Colonies']),
        starting: parseInt(d['Starting Colonies']),
        maximum: parseInt(d['Maximum Colonies']),
        lost: parseInt(d['Lost Colonies'])
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
    .text("US Bee Population Trends in 2020-Q2 by State");


const excludedStates = ['United States', 'California', 'Texas'];
const filterData = d => d.filter(x => (x.renovated &&
                                        x.lost &&
                                        x.starting && 
                                        x.maximum));


//Read the data
d3.csv("data/NASS_Bee-Colony_2015-2021.csv", row, data => {

    var cleanData = filterData(data);
    
    yParams.scale
        .domain([d3.min(cleanData, yParams.value), d3.max(cleanData, yParams.value)])
        .range([SCREEN_DIMENSIONS.innerHeight, 0]);
    
    xParams.scale
        .domain([0, d3.max(cleanData, xParams.value)])
        .range([0, SCREEN_DIMENSIONS.innerWidth])

    

    

    
    xAxisGroup.call(xParams.axis);
    yAxisGroup.call(yParams.axis);
})