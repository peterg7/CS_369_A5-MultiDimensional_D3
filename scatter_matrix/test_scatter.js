

const columns = [
    "Starting Colonies",
    "Maximum Colonies",
    "Renovated Colonies",
    "Lost Colonies"
  ]
// function ScatterplotMatrix(data, {
//     columns = data.columns, // array of column names, or accessor functions
//     x = columns, // array of x-accessors
//     y = columns, // array of y-accessors
//     z = () => 1, // given d in data, returns the (categorical) z-value
//     padding = 20, // separation between adjacent cells, in pixels
//     marginTop = 10, // top margin, in pixels
//     marginRight = 20, // right margin, in pixels
//     marginBottom = 30, // bottom margin, in pixels
//     marginLeft = 40, // left margin, in pixels
//     width = 928, // outer width, in pixels
//     height = width, // outer height, in pixels
//     xType = d3.scaleLinear, // the x-scale type
//     yType = d3.scaleLinear, // the y-scale type
//     zDomain, // array of z-values
//     fillOpacity = 0.7, // opacity of the dots
//     colors = d3.schemeCategory10, // array of colors for z
//   } = {}) {
const INVALID_MARKERS = ['(X)', '(NA)', '(Z)']
const isInvalid = obj => Object.values(obj).some(a => INVALID_MARKERS.includes(a));

const row = (d, i) => {
    return isInvalid(d) ? null : {
        // year: d['Year'],
        state: d['State'],
        renovated: parseInt(d['Renovated Colonies']),
        starting: parseInt(d['Starting Colonies']),
        maximum: parseInt(d['Maximum Colonies']),
        lost: parseInt(d['Lost Colonies'])
    }
}

d3.csv('data/NASS_Bee-Colony_2015-2021.csv', row)
    .then(data => {

        const x = columns;
        const y = columns;
        const z = d => d.state;

        const padding = 20; // separation between adjacent cells, in pixels
        const marginTop = 10; // top margin, in pixels
        const marginRight = 20; // right margin, in pixels
        const marginBottom = 30; // bottom margin, in pixels
        const marginLeft = 40; // left margin, in pixels
        const width = 928; // outer width, in pixels
        const height = width; // outer height, in pixels
        const xType = d3.scaleLinear; // the x-scale type
        const yType = d3.scaleLinear; // the y-scale type
        let zDomain; // array of z-values
        const fillOpacity = 0.7; // opacity of the dots
        const colors = d3.schemeCategory10; // array of colors for z
        

        console.log(data[0])

        // Compute values (and promote column names to accessors).
        const X = d3.map(x, x => d3.map(data, typeof x === "function" ? x : d => d[x]));
        const Y = d3.map(y, y => d3.map(data, typeof y === "function" ? y : d => d[y]));
        const Z = d3.map(data, z);
    
        // Compute default z-domain, and unique the z-domain.
        if (zDomain === undefined) zDomain = Z;
        zDomain = new d3.InternSet(zDomain);
    
        // Omit any data not present in the z-domain.
        const I = d3.range(Z.length).filter(i => zDomain.has(Z[i]));
    
        // Compute the inner dimensions of the cells.
        const cellWidth = (width - marginLeft - marginRight - (X.length - 1) * padding) / X.length;
        const cellHeight = (height - marginTop - marginBottom - (Y.length - 1) * padding) / Y.length;
    
        // Construct scales and axes.
        const xScales = X.map(X => xType(d3.extent(X), [0, cellWidth]));
        const yScales = Y.map(Y => yType(d3.extent(Y), [cellHeight, 0]));
        const zScale = d3.scaleOrdinal(zDomain, colors);
        const xAxis = d3.axisBottom().ticks(cellWidth / 50);
        const yAxis = d3.axisLeft().ticks(cellHeight / 35);
    
        const svg = d3.select('body').append('svg')
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-marginLeft, -marginTop, width, height])
            .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
    
        svg.append("g")
        .selectAll("g")
        .data(yScales)
        .join("g")
            .attr("transform", (d, i) => `translate(0,${i * (cellHeight + padding)})`)
            .each(function(yScale) { return d3.select(this).call(yAxis.scale(yScale)); })
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick line").clone()
                .attr("x2", width - marginLeft - marginRight)
                .attr("stroke-opacity", 0.1));
    
        svg.append("g")
        .selectAll("g")
        .data(xScales)
        .join("g")
            .attr("transform", (d, i) => `translate(${i * (cellWidth + padding)},${height - marginBottom - marginTop})`)
            .each(function(xScale) { return d3.select(this).call(xAxis.scale(xScale)); })
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick line").clone()
                .attr("y2", -height + marginTop + marginBottom)
                .attr("stroke-opacity", 0.1))
    
        const cell = svg.append("g")
        .selectAll("g")
        .data(d3.cross(d3.range(X.length), d3.range(Y.length)))
        .join("g")
            .attr("fill-opacity", fillOpacity)
            .attr("transform", ([i, j]) => `translate(${i * (cellWidth + padding)},${j * (cellHeight + padding)})`);
    
        cell.append("rect")
            .attr("fill", "none")
            .attr("stroke", "currentColor")
            .attr("width", cellWidth)
            .attr("height", cellHeight);
    
        cell.each(function([x, y]) {
        d3.select(this).selectAll("circle")
            .data(I.filter(i => !isNaN(X[x][i]) && !isNaN(Y[y][i])))
            .join("circle")
            .attr("r", 3.5)
            .attr("cx", i => xScales[x](X[x][i]))
            .attr("cy", i => yScales[y](Y[y][i]))
            .attr("fill", i => zScale(Z[i]));
        });
    
        // TODO Support labeling for asymmetric sploms?
        if (x === y) svg.append("g")
            .attr("font-size", 10)
            .attr("font-family", "sans-serif")
            .attr("font-weight", "bold")
        .selectAll("text")
        .data(x)
        .join("text")
            .attr("transform", (d, i) => `translate(${i * (cellWidth + padding)},${i * (cellHeight + padding)})`)
            .attr("x", padding / 2)
            .attr("y", padding / 2)
            .attr("dy", ".71em")
            .text(d => d);
  
  });