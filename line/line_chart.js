
// NOTE: Referenced https://www.d3-graph-gallery.com/graph/line_basic.html

const REMOVE_OUTLIERS = false;
const NUM_STATES = 3; // top x largest number of starting colonies

// set the dimensions and margins of the graph
const SCREEN_DIMENSIONS = { 
    width: 960,
    height: 500,
    leftMargin: 100,
    rightMargin: 100,
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

const QuarterMap = { 'Q1': 1, 'Q2': 4, 'Q3': 7, 'Q4': 10 }
var parseDate = d => d3.timeParse('%Y %m')(d.replace(/-(\w+)/, (match,key) => ' ' + QUARTERS_MAP[key] || match));

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
    .attr('y', SCREEN_DIMENSIONS.bottomMargin / 2)
    .text(xParams.label);

yAxisGroup.append('text')
    .attr('class', 'y-axis-label')
    .attr('x', -SCREEN_DIMENSIONS.leftMargin * .75)
    .attr('y', -SCREEN_DIMENSIONS.topMargin * 1.5)
    .text(yParams.label);


const titleGroup = canvas.append("text")
    .attr("x", (SCREEN_DIMENSIONS.innerWidth / 2))             
    .attr("y", 0 - (SCREEN_DIMENSIONS.topMargin / 2))
    .attr("class", "title")
    .text(`US Bee Population Trends in Top ${NUM_STATES} States with Most Initial Colonies (2015-2022)`);


const QUARTERS_MAP = { 'Q1': 1, 'Q2': 4, 'Q3': 7, 'Q4': 10 }
const INVALID_MARKERS = ['(X)', '(NA)', '(Z)'];

const preprocess = (row, i) => {

    let isValid = d => {
        return !Object.values(d).some(a => INVALID_MARKERS.includes(a));
    }

    let isFiltered = d => {
        return !d.Year.includes('Q3')
    }

    let parseDate = d => d3.timeParse('%Y %m')(d.replace(/-(\w+)/, (match,key) => ' ' + QUARTERS_MAP[key] || match));
    
    return (isValid(row) && !isFiltered(row)) ? Object.fromEntries(
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

    var stateGroups = d3.group(cleanData, d => d.state);
    var avgStartingCols = [];
    
    stateGroups.forEach((val, key) => {
        avgStartingCols.push([key, d3.mean(val, d => d.starting)])
    })
    
    var targetStates = avgStartingCols.sort((a, b) => d3.descending(a[1], b[1])).slice(0, NUM_STATES).map(a => a[0]);

    var filteredData = data.filter(d => targetStates.includes(d.state));

    let dateRange = d3.extent(filteredData, xParams.value)
    
    xParams.scale
        .domain(dateRange)
        .range([0, SCREEN_DIMENSIONS.innerWidth])
    
    let maxInitPop = d3.max(filteredData, yParams.value)
    let minInitPop = d3.min(filteredData, yParams.value)
    let buffer = 0.2 * ((maxInitPop - minInitPop) / 2)
    yParams.scale
        .domain([minInitPop - buffer, maxInitPop + buffer])
        .range([SCREEN_DIMENSIONS.innerHeight, 0]);


    var colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain([0, NUM_STATES])


    // Add the Legend
    canvas.append("rect")
        .attr("class", "legend-box")
        .attr("x", SCREEN_DIMENSIONS.innerWidth + (SCREEN_DIMENSIONS.rightMargin * 0.18))
        .attr("y", SCREEN_DIMENSIONS.topMargin + (15 / NUM_STATES))
        .attr("width", 75)
        .attr("height", (20 * (NUM_STATES + 1)))
        .attr("rx", 10)
    

    targetStates.forEach((state, idx) => {
        let d = stateGroups.get(state);

        canvas.append('path')
                .datum(d)
                .attr('stroke', colorScale(idx))
                .attr('stroke-width', 1.5)
                .style("fill",'none')
                .attr('d', d3.line()
                                .x(d => xParams.scale(xParams.value(d)))
                                .y(d => yParams.scale(yParams.value(d))))

        
        canvas.append("text")
            .attr("x", SCREEN_DIMENSIONS.innerWidth + (SCREEN_DIMENSIONS.rightMargin * 0.25))
            .attr("y", SCREEN_DIMENSIONS.topMargin + (20 * idx) + 25)
            .attr("class", "legend")
            .style("fill", colorScale(idx))
            .text(state);
    })

    xAxisGroup.call(xParams.axis);
    yAxisGroup.call(yParams.axis);    
})