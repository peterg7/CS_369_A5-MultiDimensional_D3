
// NOTE: Referenced https://www.d3-graph-gallery.com/graph/bubble_template.html
//                  https://observablehq.com/@d3/splom


// set the dimensions and margins of the graph
const SCREEN_DIMENSIONS = { 
    width: 800,
    height: 800,
    leftMargin: 40,
    rightMargin: 20,
    topMargin: 30,
    bottomMargin: 30,
    cellPadding: 20
}
SCREEN_DIMENSIONS.innerWidth = SCREEN_DIMENSIONS.width - SCREEN_DIMENSIONS.leftMargin - SCREEN_DIMENSIONS.rightMargin;
SCREEN_DIMENSIONS.innerHeight = SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.topMargin - SCREEN_DIMENSIONS.bottomMargin;



// append the svg object to the body of the page
var svg = d3.select('body').append('svg')
    .attr('width', SCREEN_DIMENSIONS.width)
    .attr('height', SCREEN_DIMENSIONS.height)
    .attr("viewBox", [-SCREEN_DIMENSIONS.leftMargin, -SCREEN_DIMENSIONS.topMargin, 
                        SCREEN_DIMENSIONS.width, SCREEN_DIMENSIONS.height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

const columnTranslations = new Map([
    ['State', 'state'],
    ["Starting Colonies", "starting"],
    ["Maximum Colonies", "maximum"],
    ["Renovated Colonies", "renovated"],
    ["Lost Colonies", "lost"]
]);

const DATA_DIMENSIONS = ['starting', 'maximum', 'lost', 'renovated'];
const colorValue = d => d.state;
const NUM_STATES = 5; // top x largest number of starting colonies

// set the spacing and position values of the graph
const GRAPH_SPACING = {
    cellWidth: (SCREEN_DIMENSIONS.innerWidth - (DATA_DIMENSIONS.length - 1) * SCREEN_DIMENSIONS.cellPadding) / DATA_DIMENSIONS.length,
    cellHeight: (SCREEN_DIMENSIONS.innerHeight - (DATA_DIMENSIONS.length - 1) * SCREEN_DIMENSIONS.cellPadding) / DATA_DIMENSIONS.length
}
GRAPH_SPACING.yTransform = (d, i) => `translate(0,${i * (GRAPH_SPACING.cellHeight + SCREEN_DIMENSIONS.cellPadding)})`;
GRAPH_SPACING.xTransform = (d, i) => `translate(${i * (GRAPH_SPACING.cellWidth + SCREEN_DIMENSIONS.cellPadding)},${SCREEN_DIMENSIONS.innerHeight})`
GRAPH_SPACING.cellTransform = ([i, j]) => `translate(${i * (GRAPH_SPACING.cellWidth + SCREEN_DIMENSIONS.cellPadding)},${j * (GRAPH_SPACING.cellHeight + SCREEN_DIMENSIONS.cellPadding)})`
GRAPH_SPACING.dimLabelsTransform = (d, i) => `translate(${i * (GRAPH_SPACING.cellWidth + SCREEN_DIMENSIONS.cellPadding)},${i * (GRAPH_SPACING.cellHeight + SCREEN_DIMENSIONS.cellPadding)})`


var xAxis = d3.axisBottom()
                .tickPadding(4)
                .tickFormat(d3.format('.2s'))
                .ticks(GRAPH_SPACING.cellWidth / 50);

var yAxis = d3.axisLeft()
                .tickPadding(4)
                .tickFormat(d3.format('.2s'))
                .ticks(GRAPH_SPACING.cellHeight / 40);

const titleGroup = svg.append("text")
                            .attr("class", 'title')
                            .attr("x", (SCREEN_DIMENSIONS.innerWidth / 2))
                            .attr("y", - (SCREEN_DIMENSIONS.topMargin / 2) - 5)
                            .text(`US Bee Population in Top ${NUM_STATES} States with Most Initial Colonies (2015-2022)`);


const INVALID_MARKERS = ['(X)', '(NA)', '(Z)'];
const isInvalid = obj => Object.values(obj).some(a => INVALID_MARKERS.includes(a));

//Read the data
d3.csv("../data/NASS_Bee-Colony_2015-2021.csv", (row, i) => {
        return isInvalid(row) ? null : Object.fromEntries(
            Array.from(columnTranslations.entries())
                .map(([key, val]) => [val, (key == 'State') ? row[key] : parseInt(row[key])])
        );
    }).then((data, i) => {

    
    var stateGroups = d3.group(data, d => d.state);
    var avgStartingCols = [];
    
    stateGroups.forEach((val, key) => {
        avgStartingCols.push([key, d3.mean(val, d => d.starting)])
    })
    
    var targetStates = avgStartingCols.sort((a, b) => d3.descending(a[1], b[1])).slice(0, NUM_STATES).map(a => a[0]);

    var filteredData = data.filter(d => targetStates.includes(d.state));
    
    const plotDataMap = d3.map(DATA_DIMENSIONS, dim => d3.map(filteredData, typeof dim === "function" ? dim : d => d[dim]));
    const xScales = plotDataMap.map(d => d3.scaleLinear(d3.extent(d), [0, GRAPH_SPACING.cellWidth]));
    const yScales = plotDataMap.map(d => d3.scaleLinear(d3.extent(d), [GRAPH_SPACING.cellHeight, 0]));

    const colorMap = d3.map(filteredData, colorValue);
    const colorDomain = new d3.InternSet(colorMap);
    const colorScale = d3.scaleOrdinal(colorDomain, d3.schemeCategory10);
    const colorFilter = d3.range(colorMap.length).filter(i => colorDomain.has(colorMap[i]));

    // build y-axis
    svg.append("g")
        .selectAll("g")
        .data(yScales)
            .join("g")
            .attr("transform", GRAPH_SPACING.yTransform)
            .each(function(ys) { return d3.select(this).call(yAxis.scale(ys)); })
                .call(g => g.select(".domain").remove())
                .call(g => g.selectAll(".tick line").clone()
                    .attr("x2", SCREEN_DIMENSIONS.innerWidth)
                    .attr("stroke-opacity", 0.1));

    // build x-axis
    svg.append("g")
        .selectAll("g")
        .data(xScales)
            .join("g")
            .attr("transform", GRAPH_SPACING.xTransform)
            .each(function(xs) { return d3.select(this).call(xAxis.scale(xs)); })
                .call(g => g.select(".domain").remove())
                .call(g => g.selectAll(".tick line").clone()
                    .attr("y2", -SCREEN_DIMENSIONS.innerHeight)
                    .attr("stroke-opacity", 0.1))

    // build cell template
    const cell = svg.append("g")
                    .selectAll("g")
                    .data(d3.cross(d3.range(plotDataMap.length), d3.range(plotDataMap.length)))
                        .join("g")
                        .attr("fill-opacity", 0.8)
                        .attr("transform", GRAPH_SPACING.cellTransform)
    cell.append("rect")
            .attr("fill", "none")
            .attr("stroke", "currentColor")
            .attr("width", GRAPH_SPACING.cellWidth)
            .attr("height", GRAPH_SPACING.cellHeight);

    // build each cell (plot)
    cell.each(function([x, y]) {
        d3.select(this).selectAll("circle")
            .data(colorFilter.filter(i => !isNaN(plotDataMap[x][i]) && !isNaN(plotDataMap[y][i])))
                .join("circle")
                .attr("r", 3.5)
                .attr("cx", i => xScales[x](plotDataMap[x][i]))
                .attr("cy", i => yScales[y](plotDataMap[y][i]))
                .attr("fill", i => colorScale(colorMap[i]));
    });

    // place dimension labels along diagonal
    svg.append("g")
        .attr("class", "dim-labels")
        .selectAll("text")
        .data(DATA_DIMENSIONS)
            .join("text")
            .attr("transform", GRAPH_SPACING.dimLabelsTransform)
            .attr("x", SCREEN_DIMENSIONS.cellPadding / 2)
            .attr("y", SCREEN_DIMENSIONS.cellPadding / 2)
            .attr("dy", ".71em")
            .text(d => Array.from(columnTranslations.keys()).find(key => columnTranslations.get(key) === d));

});