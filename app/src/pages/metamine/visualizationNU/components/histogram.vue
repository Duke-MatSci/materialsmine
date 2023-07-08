<template>
    <div ref="histogramPlot"></div>
</template>

<script>
import * as d3 from 'd3';
import { processData } from '../utils/processData';
import { mapState } from 'vuex';

const padding = 10; // separation between adjacent cells, in pixels
const marginTop = 0; // top margin, in pixels
const marginRight = 0; // right margin, in pixels
const marginBottom = 0; // bottom margin, in pixels
const marginLeft = 0; // left margin, in pixels
const width = 968; // outer width, in pixels
const columns = ['C11', 'C12', 'C22', 'C16', 'C26', 'C66'];

function expo(x, f) {
    if (x < 1000 && x > -1000) return x;
    return Number(x).toExponential(f);
}

export default {
    name: 'histogram-plot',
    mounted: async function () {
        this.$store.dispatch('metamineNU/setPage', 'hist', { root: true });
        const bucketName = 'ideal-dataset-1';
        const fetchedNamesResponse = await fetch(`/api/aws/${bucketName}`).then(
            (response) => {
                return response.json();
            }
        );
        this.$store.dispatch(
            'metamineNU/setFetchedNames',
            fetchedNamesResponse.fetchedNames,
            { root: true }
        );

        this.fetchedNames.map(async (info, index) => {
            const fetchedData = await fetch(
                `/api/aws/${bucketName}/${info.name}`
            )
                .then((response) => {
                    return response.json();
                })
                .then((data) => {
                    return data.fetchedData;
                });
            const processedData = fetchedData.map((dataset, index) => {
                return processData(dataset, index);
            });
            processedData.map((p) => (p.name = info.name));
            processedData.map((p) => (p.color = info.color));
            this.csvData.push(...processedData);
            this.activeData.push(...processedData);

            this.$store.dispatch('metamineNU/setDatasets', this.csvData, {
                root: true
            });
            this.$store.dispatch('metamineNU/setActiveData', this.activeData, {
                root: true
            });
            this.$store.dispatch('metamineNU/setDataPoint', processedData[0], {
                root: true
            });
        });
        this.container = this.$refs.histogramPlot;
        this.createSvg({
            container: this.container
        });
    },
    computed: {
        ...mapState('metamineNU', {
            csvData: (state) => state.datasets,
            activeData: (state) => state.activeData,
            dataPoint: (state) => state.dataPoint,
            fetchedNames: (state) => state.fetchedNames,
            query1: (state) => state.query1
        })
    },
    data() {
        return {
            chart: false
        };
    },
    watch: {
        csvData: {
            deep: true,
            handler(newVal, oldVal) {
                this.update({
                    container: this.container,
                    maxNumDatasets: this.fetchedNames.length
                });
            }
        },
        activeData: {
            deep: true,
            handler(newVal, oldVal) {
                this.update({
                    container: this.container,
                    maxNumDatasets: this.fetchedNames.length
                });
            }
        },
        fetchedNames: {
            handler(newVal, oldVal) {
                this.update({
                    container: this.container,
                    maxNumDatasets: newVal.length
                });
            }
        },
        dataPoint: {
            handler(newVal, oldVal) {
                this.$store.dispatch('metamineNU/setDataPoint', newVal, {
                    root: true
                });
            }
        },
        query1: {
            handler(newVal, oldVal) {
                if (this.svg) {
                    this.update({
                        container: this.container,
                        maxNumDatasets: this.fetchedNames.length
                    });
                }
            }
        }
    },
    methods: {
        createSvg({ container }) {
            const data = this.activeData;
            var x = columns;
            var y = columns;
            var z = () => 1;
            var zDomain;
            const fillOpacity = 0.7;
            const height = width;

            // Compute values (and promote column names to accessors).
            const X = d3.map(x, (x) =>
                d3.map(data, typeof x === 'function' ? x : (d) => +d[x])
            );
            const Y = d3.map(y, (y) =>
                d3.map(data, typeof y === 'function' ? y : (d) => +d[y])
            );
            const Z = d3.map(data, z);

            // Compute default z-domain, and unique the z-domain.
            if (zDomain === undefined) zDomain = Z;
            zDomain = new d3.InternSet(zDomain);

            // Compute the inner dimensions of the cells.
            const cellWidth =
                (width - marginLeft - marginRight - (X.length - 1) * padding) /
                X.length;
            const cellHeight =
                (height - marginTop - marginBottom - (Y.length - 1) * padding) /
                Y.length;

            const svg = d3
                .select(container)
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .attr('viewBox', [
                    padding * 2,
                    padding * 5,
                    width,
                    height + padding * 13
                ])
                .attr(
                    'style',
                    'max-width: 100%; height: auto; height: intrinsic;'
                );

            const cell = svg
                .append('g')
                .selectAll('g')
                .data(d3.cross(d3.range(X.length), d3.range(Y.length)))
                .join('g')
                .attr('fill-opacity', fillOpacity)
                .attr(
                    'transform',
                    `translate(${cellWidth + padding},${
                        cellHeight - 2 * marginBottom
                    })`
                );

            this.chart = true;
            this.svg = svg;
            this.cell = cell;
            this.cellWidth = cellWidth;
            this.cellHeight = cellHeight;
            this.X = X;
            this.Y = Y;
            this.Z = Z;
            this.zDomain = zDomain;
        },

        update({
            x = columns, // array of x-accessors
            y = columns, // array of y-accessors
            z = () => 1, // given d in data, returns the (categorical) z-value
            height = width, // outer height, in pixels
            xType = d3.scaleLinear, // the x-scale type
            yType = d3.scaleLinear, // the y-scale type
            zDomain, // array of z-values
            fillOpacity = 0.7, // opacity of the dots
            colors = {}, // array of colors for z
            maxNumDatasets
        }) {
            const query1 = this.query1;

            const index = columns.indexOf(query1);
            const datasets = [];
            const datasetDic = {};
            const tooltip = [];
            for (let i = 0; i < maxNumDatasets; i++) {
                datasets.push([]);
            }
            const data = this.activeData;
            const organizedData = this.organizeByName(data);
            organizedData.map((d, i) => {
                colors[d.name] = d.color;
                datasets[i] = d.data ? d.data : [];
                datasetDic[i] = d.name;
            });

            const finalData = [].concat(...datasets);

            // clean up before updating visuals
            d3.selectAll('.xAxisGroup').remove();
            d3.selectAll('.yAxisGroup').remove();
            d3.selectAll('.legend').remove();
            d3.selectAll(".tooltip_hist").remove();


            for (let i = 0; i < maxNumDatasets; i++) {
                d3.selectAll('.group' + i).remove();
                d3.selectAll('.mean-line' + i).remove();
            }

            const mouseleaveRec = function (e, d) {
                // tooltip_hist.style("visibility", "hidden").transition().duration(200);
                d3.select(this)
                    .style('stroke', 'grey')
                    .style('stroke-width', 0)
                    .style('fill-opacity', 0.8);
            };

            const mouseoverHist = function (e, d) {
                d3.select(this)
                    .raise()
                    .style('stroke', 'black')
                    .style('stroke-width', 5)
                    .style('fill-opacity', 1);
            };

            // Compute values (and promote column names to accessors).
            const X = d3.map(x, (x) =>
                d3.map(finalData, typeof x === 'function' ? x : (d) => +d[x])
            );
            const Y = d3.map(y, (y) =>
                d3.map(finalData, typeof y === 'function' ? y : (d) => +d[y])
            );
            const Z = d3.map(finalData, z);

            // Compute default z-domain, and unique the z-domain.
            if (zDomain === undefined) zDomain = Z;
            zDomain = new d3.InternSet(zDomain);

            // Compute the inner dimensions of the cells.
            const cellWidth = width - marginRight - (X.length - 1) * padding;
            const cellHeight =
                height - marginTop - marginBottom - (Y.length - 1) * padding;

            // Construct scales and axes.
            const xScales = X.map((X) => xType(d3.extent(X), [0, cellWidth]));

            const allBins = [];
            this.cell.each(function ([x, y]) {
                if (x === index && y === index) {
                    d3.select(this)
                        .append('g')
                        .attr('class', 'x-label')
                        .attr('font-size', 20)
                        .attr('font-family', 'sans-serif')
                        .attr('font-weight', 'bold')
                        .selectAll('text')
                        .data([columns[index]])
                        .join('text')
                        .attr(
                            'transform',
                            (d, i) =>
                                `translate(${width / 3},${width + padding * 2})`
                        )
                        .attr('x', padding / 2)
                        .attr('y', padding / 2)
                        .text((d) => d);

                    d3.select(this)
                        .append('g')
                        .attr('class', 'y-label')
                        .attr('font-size', 20)
                        .attr('font-family', 'sans-serif')
                        .attr('font-weight', 'bold')
                        .selectAll('text')
                        .data(['Frequency'])
                        .join('text')
                        .attr(
                            'transform',
                            `translate(${-width / 10 - padding * 6},${
                                cellHeight / 2 + padding
                            }) rotate(270)`
                        )
                        .attr('x', padding / 2)
                        .attr('y', padding / 2)
                        .text((d) => d);

                    for (let i = 0; i < maxNumDatasets; i++) {
                        const a = columns;
                        const b = columns;
                        const X0 = d3.map(a, (a) =>
                            d3.map(
                                datasets[i],
                                typeof a === 'function' ? a : (d) => +d[a]
                            )
                        );
                        let Y0 = d3.map(b, (b) =>
                            d3.map(
                                datasets[i],
                                typeof b === 'function' ? b : (d) => +d[b]
                            )
                        );
                        const Z = d3.map(datasets[i], z);

                        // Omit any data not present in the z-domain.
                        const I0 = d3
                            .range(Z.length)
                            .filter((i) => zDomain.has(Z[i]));
                        const thresholds = 40;
                        Y0 = d3.map(Y0[index], () => 1);
                        const bins = d3
                            .bin()
                            .thresholds(thresholds)
                            .value((i) => X0[index][i])(I0);
                        allBins.push(...bins);
                        const tempTooltip = {};
                        if (organizedData[i]) {
                            const tempArr = organizedData[i].data.map((d, i) => d[query1]);
                            tempTooltip.name = organizedData[i].name;
                            tempTooltip.color = organizedData[i].color;
                            tempTooltip.min = d3.min(tempArr);
                            tempTooltip.max = d3.max(tempArr);
                            tempTooltip.mean = d3.mean(tempArr);
                            tempTooltip.median = d3.median(tempArr);
                            tooltip.push(tempTooltip);
                        }

                        const Y1 = Array.from(bins, (I0) =>
                            d3.sum(I0, (i) => Y0[i])
                        );

                        // Compute default domains.
                        const xDomain = [bins[0].x0, bins[bins.length - 1].x1];
                        const yDomain = [0, d3.max(Y1)];

                        // Construct scales and axes.
                        const xRange = [0, cellWidth];
                        const yRange = [cellHeight, 0];
                        const xScale = xType(xDomain, xRange);
                        const yScale = yType(yDomain, yRange);

                        const insetLeft = 0.5;
                        const insetRight = 0.5;

                        // when two dataset are selected, shows one color, but shows none when 1 or none are selected

                        if (datasets[i].length === 0) {
                            d3.selectAll('.group' + i).remove();
                        } else {
                            const histogram = d3
                                .select(this)
                                .append('g')
                                .attr('class', 'group' + i);
                            histogram
                                .selectAll('rect')
                                .data(bins)
                                .join('rect')
                                .attr('fill', colors[datasetDic[i]])
                                .attr('x', (d) => xScale(d.x0) + insetLeft)
                                .attr('width', (d) =>
                                    bins.length === 1
                                        ? 5
                                        : Math.max(
                                              0,
                                              xScale(d.x1) -
                                                  xScale(d.x0) -
                                                  insetLeft -
                                                  insetRight
                                          )
                                )
                                .attr('y', (d, i) => yScale(Y1[i]))
                                .attr(
                                    'height',
                                    (d, i) => yScale(0) - yScale(Y1[i])
                                )
                                // .on("mouseleave", mouseleave_rec)
                                // .on("mousemove", mousemove_hist)
                                .attr(
                                    'transform',
                                    `translate(${-width / 10}, ${0})`
                                );

                            d3.selectAll('.group' + i)
                                .on('mouseover', mouseoverHist)
                                .on('mouseleave', mouseleaveRec);
                            histogram.exit().remove();
                        }
                    }
                }
            });
            // draw axis
            const maxBinLen = d3.max(allBins, (b) => {
                return b.length;
            });
            const histYScales = d3
                .scaleLinear()
                .domain([0, maxBinLen])
                .range([cellHeight, 0]);
            const xAxis = d3
                .axisBottom()
                .tickFormat((x) => `${expo(x, 0)}`)
                .ticks(3);
            const yAxis = d3.axisLeft().ticks(3);

            const yAxisLine = this.svg
                .append('g')
                .selectAll('g')
                .data([histYScales])
                .join('g')
                .attr(
                    'transform',
                    `translate(${padding * 6 + 5},${padding * 16 - 5})`
                )
                .attr('class', 'yAxisGroup')
                .call(yAxis.scale(histYScales));

            yAxisLine
                .selectAll('text')
                .attr('font-size', 20)
                .attr('font-family', 'sans-serif');

            const xAxisLine = this.svg
                .append('g')
                .selectAll('.xAxisGroup')
                .data(xScales)
                .join('g')
                .attr(
                    'transform',
                    `translate(${width / 15}, ${width + padding * 10 + 5})`
                )
                .attr('class', 'xAxisGroup')
                .call(xAxis.scale(xScales[index]));

            xAxisLine
                .selectAll('text')
                .attr('font-size', 18)
                .attr('font-family', 'sans-serif')
                .attr('text-anchor', 'middle');

            const transitionDuration = 200;

            const exitTransition = d3.transition().duration(transitionDuration);
            const updateTransition = exitTransition
                .transition()
                .duration(transitionDuration);

            tooltip.map((d, i) => {
                let mean = tooltip[i].mean;
                this.svg
                    .append('g')
                    .append('line')
                    .attr('class', 'mean-line' + i)
                    .raise()
                    .transition(updateTransition)
                    .attr('x1', xScales[index](mean) + width / 15)
                    .attr('y1', width + padding * 10 + 5)
                    .attr('x2', xScales[index](mean) + width / 15)
                    .attr('y2', padding * 16 - 5)
                    .attr('stroke', colors[datasetDic[i]])
                    .attr('stroke-width', 6)
                    .attr('fill', 'None')
                    .style('stroke-dasharray', '5, 5');
            });


            let tooltipContent = tooltip.map(
                (d, i) =>
                    '<b>Dataset: </b>' +
                    d.name +
                    '<br>' +
                    '<b>Range: </b>' +
                    expo(d.min, 0) +
                    ' to ' +
                    expo(d.max, 0) +
                    '<br>' +
                    '<b>Mean: </b>' +
                    expo(d.mean.toPrecision(4)) +
                    '<br>' +
                    '<b>Median: </b>' +
                    expo(d.median, 0) +
                    '<br>'
            );

            d3.select(this.$refs.histogramPlot)
                .append('div')
                .style('overflow-y', 'auto')
                .style('width', '280px')
                .style('height', '200px')
                .attr('class', 'tooltip_hist')
                .style('position', 'fixed')
                .style('background-color', 'white')
                .style('border', 'solid')
                .style('stroke', 'white')
                .style('box-shadow', '5px 5px 5px 0px rgba(0,0,0,0.3)')
                .style('border-width', '2px')
                .style('border-radius', '5px')
                .style('padding', '10px')
                .style('visibility', 'visible')
                .html(tooltipContent.join('<br>'))
                .style('top', 100 + 'px')
                .style('left', 25 + 'vw');
        },
        organizeByName: (data) => {
            const datasetNames = [...new Set(data.map((d) => d.name))];

            const datasets = [];

            datasetNames.map((name, i) => {
                datasets.push({
                    name: name,
                    color: data.filter((d) => d.name === name)[0].color,
                    data: data.filter((d) => d.name === name)
                });
            });

            return datasets;
        }
    }
};
</script>
