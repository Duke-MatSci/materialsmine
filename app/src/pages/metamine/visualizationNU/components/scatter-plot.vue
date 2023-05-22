<template>
    <div ref="scatterPlot"></div>
</template>

<script>
import * as d3 from 'd3';
import { processData } from '@/pages/metamine/visualizationNU/processData';
import { mapState, mapMutations } from 'vuex';

const circleOriginalSize = 5;
const circleFocusSize = 8;

const MARGIN = {
    TOP: 0,
    RIGHT: 50,
    BOTTOM: 20,
    LEFT: 50
};

const SIDE_BAR_SIZE = 100;

const WIDTH = 800 - MARGIN.LEFT - MARGIN.RIGHT - SIDE_BAR_SIZE;
const HEIGHT = 700 - MARGIN.TOP - MARGIN.BOTTOM - SIDE_BAR_SIZE;

function expo(x, f) {
    if (x < 1000 && x > -1000) return x;
    return Number(x).toExponential(f);
}

function isBrushed(brush_coords, cx, cy) {
    var x0 = brush_coords[0][0],
        x1 = brush_coords[1][0],
        y0 = brush_coords[0][1],
        y1 = brush_coords[1][1];
    return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1; // This return TRUE or FALSE depending on if the points is in the selected area
}

export default {
    name: 'scatter-plot',
    mounted: async function () {
        this.$store.dispatch('metamineNU/setPage', 'scatter', { root: true })
        // fetch data from AWS
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
            // Process data
            processedData.map((p) => (p.name = info.name));
            processedData.map((p) => (p.color = info.color));
            this.csvData.push(...processedData);
            this.activeData.push(...processedData);

            // Set data to store
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
        this.container = this.$refs.scatterPlot;

        // Create svg
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
            selectedData: (state) => state.selectedData,
            query1: (state) => state.query1,
            query2: (state) => state.query2
        }),
        ...mapMutations('metamineNU', {
            setSelectedData: 'setSelectedData'
        })
    },
    data() {
        return {
            chart: false,
            reset: false
        };
    },
    watch: {
        csvData: {
            deep: true,
            handler(newVal, oldVal) {
                this.update({
                    container: this.container,
                });
            }
        },
        activeData: {
            deep: true,
            handler(newVal, oldVal) {
                this.update({
                    container: this.container,
                });
            }
        },
        fetchedNames: {
            handler(newVal, oldVal) {
                this.update({
                    container: this.container,
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
                this.update({
                    container: this.container,
                });
            }
        },
        query2: {
            handler(newVal, oldVal) {
                this.update({
                    container: this.container,
                });
            }
        },
    },
    methods: {
        createSvg({ container }) {
            this.svg = d3
                .select(container)
                .append('svg')
                .attr('width', WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
                .attr('height', HEIGHT + MARGIN.TOP + MARGIN.BOTTOM)
                .attr('viewBox', [
                    -MARGIN.LEFT,
                    -MARGIN.TOP,
                    WIDTH + MARGIN.LEFT + MARGIN.RIGHT,
                    HEIGHT + MARGIN.TOP + MARGIN.BOTTOM
                ])
                .attr('style', 'max-width: 100%')
                .append('g')
                .attr('class', 'scatter-plot-plot')
                .attr('transform', `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`);

            // Labels
            this.xLabel = this.svg
                .append('text')
                .attr('x', WIDTH / 2)
                .attr('y', HEIGHT + 50)
                .attr('text-anchor', 'middle')
                .style('fill', 'black');

            this.yLabel = this.svg
                .append('text')
                .attr('x', -HEIGHT / 2)
                .attr('y', -80)
                .attr('text-anchor', 'middle')
                .attr('transform', 'rotate(-90)')
                .style('fill', 'black');
            // Append group el to display both axes
            this.xAxisGroup = this.svg
                .append('g')
                .attr('transform', `translate(0, ${HEIGHT})`);

            // Append group el to display both axes
            this.yAxisGroup = this.svg.append('g');

            this.chart = true;
        },

        update({ container, view = 'brush-on', reset = false }) {
            const data = this.activeData;
            const self = this;
            let datasets = data;
            let finalData = [].concat(...datasets);
            const query1 = this.query1;
            const query2 = this.query2;
            //remove elements to avoid repeated append
            d3.selectAll('.legend').remove();
            d3.select('.tooltip').remove();
            d3.selectAll('.dataCircle').remove();
            d3.selectAll('defs').remove();
            d3.selectAll('.rectZoom').remove();
            d3.selectAll('.clipPath').remove();

            let yScale = d3
                .scaleLinear()
                .domain([
                    d3.min(finalData, (d) => d[query2]),
                    d3.max(finalData, (d) => d[query2])
                ])
                .range([HEIGHT, 0]);

            let xScale = d3
                .scaleLinear()
                .domain([
                    d3.min(finalData, (d) => d[query1]),
                    d3.max(finalData, (d) => d[query1])
                ])
                .range([0, WIDTH]);

            if (reset || this.zoomedXScale === undefined) {
                this.xScale = xScale;
            } else {
                this.xScale = this.zoomedXScale;
            }
            if (reset || this.zoomedYScale === undefined) {
                this.yScale = yScale;
            } else {
                this.yScale = this.zoomedYScale;
            }

            // Add a clipPath: everything out of this area won't be drawn.
            this.svg
                .append('defs')
                .append('SVG:clipPath')
                .attr('id', 'clip')
                .append('SVG:rect')
                .attr('width', WIDTH)
                .attr('height', HEIGHT)
                .attr('x', 0)
                .attr('y', 0);

            let xAxisCall = d3
                .axisBottom(this.xScale)
                .tickFormat((x) => `${expo(x, 2)}`);
            this.xAxisGroup.transition().duration(500).call(xAxisCall);

            let yAxisCall = d3
                .axisLeft(this.yScale)
                .tickFormat((y) => `${expo(y, 2)}`);
            this.yAxisGroup.transition().duration(500).call(yAxisCall);
            this.xLabel.text(this.query1);
            this.yLabel.text(this.query2);

            let tooltip = d3
                .select(container.current)
                .append('div')
                .attr('class', 'tooltip')
                .style('background-color', 'white')
                .style('border', 'solid')
                .style('border-width', '1px')
                .style('border-radius', '5px')
                .style('padding', '10px')
                .style('visibility', 'hidden');

            let mouseover = function (e, d) {
                d3.select(this)
                    .attr('r', circleFocusSize)
                    .style('stroke', 'black')
                    .style('stroke-width', 2)
                    .style('fill-opacity', 1);
                setDataPoint(d);
                tooltip
                    .style('visibility', 'visible')
                    .transition()
                    .duration(200);
            };

            let mousemove = function (e, d) {
                tooltip
                    .html(
                        'Dataset: ' +
                            d['name'] +
                            '<br>symmetry: ' +
                            d['symmetry'] +
                            '<br>Material_0: ' +
                            d.CM0 +
                            '<br>Material_1: ' +
                            d.CM1 +
                            `<br>${query1}: ` +
                            d[query1] +
                            `<br>${query2}: ` +
                            d[query2]
                    )
                    .style('top', e.pageY + 10 + 'px')
                    .style('left', e.pageX + 10 + 'px');
            };

            let mouseleave = function (e, d) {
                tooltip
                    .style('visibility', 'hidden')
                    .transition()
                    .duration(200);
                const circle = d3.select(this);
                d3.select(this)
                    .attr(
                        'r',
                        circle.classed('highlighted')
                            ? circleFocusSize
                            : circleOriginalSize
                    )
                    .style('stroke', 'none')
                    .style('stroke-width', 2)
                    .style('fill-opacity', 0.8);
            };

            let mousedown = function (e, d) {
                let columns = ['C11', 'C12', 'C22', 'C16', 'C26', 'C66'];
                let inputData = columns.map((c) => d[c]);
                let target = d3.select(this);
                if (view == 'brush-on') {
                    target.classed('selected', true);
                } else if (view == 'brush-off') {
                    target.classed('selected', false);
                }

                let selected = [];
                d3.selectAll('.selected').each((d, i) => selected.push(d));
                self.$store.dispatch('metamineNU/setSelectedData', selected, {
                    root: true
                });

                if (view == 'neighbor') {
                    target.classed('selected', true);
                    // getKnnData(inputData).then((data) => {
                    //     let indices = data.indices;
                    //     let distances = data.distances;
                    //     d3.selectAll('.dataCircle')
                    //         .data(finalData)
                    //         .classed('highlighted', function (datum) {
                    //             return indices.includes(datum.index);
                    //         })
                    //         .classed('masked', function (datum) {
                    //             return !indices.includes(datum.index);
                    //         });

                    //     let neighborElements = d3.selectAll('.highlighted');
                    //     let masked = d3.selectAll('.masked');
                    //     masked
                    //         .attr('fill', (d) => d.color)
                    //         .attr('r', circleOriginalSize)
                    //         .classed('selected', false);

                    //     let neighbors = [];
                    //     neighborElements.each((d, i) => {
                    //         d['outline_color'] = nnColorAssignment[i];
                    //         console.log(d, indices.indexOf(d.index), d.index);
                    //         d['distance'] = distances[indices.indexOf(d.index)];
                    //         return neighbors.push(d);
                    //     });
                    //     neighbors.sort((a, b) => a.distance - b.distance);
                    //     neighborElements
                    //         .attr('fill', (d) => d.outline_color)
                    //         .attr('r', circleFocusSize);
                    //     setNeighbors(neighbors);
                    // });
                }
            };

            let zoomedXScale = this.xScale;
            let zoomedYScale = this.yScale;

            // Set the zoom and Pan features: how much you can zoom, on which part, and what to do when there is a zoom
            let zoom = d3
                .zoom()
                .scaleExtent([0.1, 20]) // This control how much you can unzoom (x1) and zoom (x20)
                .extent([
                    [0, 0],
                    [WIDTH, HEIGHT]
                ])
                .on(
                    'zoom',
                    function (event) {
                        // recover the new scale
                        let newXScale = event.transform.rescaleX(this.xScale);
                        let newYScale = event.transform.rescaleY(this.yScale);

                        // update axes with these new boundaries
                        let xAxisCall = d3
                            .axisBottom(newXScale)
                            .tickFormat((x) => `${expo(x, 2)}`);
                        let yAxisCall = d3
                            .axisLeft(newYScale)
                            .tickFormat((y) => `${expo(y, 2)}`);
                        this.xAxisGroup
                            .transition()
                            .duration(500)
                            .call(xAxisCall);
                        this.yAxisGroup
                            .transition()
                            .duration(500)
                            .call(yAxisCall);

                        d3.selectAll('.dataCircle')
                            .data(finalData)
                            .attr('cy', (d) => newYScale(d[query2]))
                            .attr('cx', (d) => newXScale(d[query1]));

                        zoomedXScale = newXScale;
                        zoomedYScale = newYScale;
                        this.zoomedXScale = newXScale;
                        this.zoomedYScale = newYScale;
                    }.bind(this)
                );

            this.xScale = zoomedXScale;
            this.yScale = zoomedYScale;

            let brush = d3
                .brush()
                .extent([
                    [0, 0],
                    [WIDTH, HEIGHT]
                ])
                .on(
                    'start brush end',
                    function brushed(event) {
                        let xScale = this.xScale;
                        let yScale = this.yScale;
                        if (event.selection) {
                            if (view == 'brush-on') {
                                d3.selectAll('.dataCircle')
                                    .data(finalData)
                                    .classed('selected', function (d) {
                                        return (
                                            d3
                                                .select(this)
                                                .classed('selected') ||
                                            isBrushed(
                                                event.selection,
                                                xScale(d[query1]),
                                                yScale(d[query2])
                                            )
                                        );
                                    });
                            } else if (view == 'brush-off') {
                                d3.selectAll('.selected').classed(
                                    'selected',
                                    function (d) {
                                        return isBrushed(
                                            event.selection,
                                            xScale(d[query1]),
                                            yScale(d[query2])
                                        )
                                            ? false
                                            : true;
                                    }
                                );
                            }
                            let selected = [];
                            d3.selectAll('.selected').each((d, i) =>
                                selected.push(d)
                            );
                            self.setSelectedData(selected);
                        }
                    }.bind(this)
                );

            let circles = this.svg
                .append('g')
                .attr('clip-path', 'url(#clip)')
                .attr('class', 'clipPath')
                .selectAll('.dataCircle')
                .data(finalData);

            circles.exit().transition().attr('r', 0).remove();
            circles
                .enter()
                .append('circle')
                .join(circles)
                .attr('r', circleOriginalSize)
                .attr('class', 'dataCircle')
                .attr('fill', (d) => d.color)
                // .classed('selected', function (d) {
                //     return self.selectedData.includes(d);
                // })
                .style('stroke', 'none')
                .style('stroke-width', 2)
                .style('fill-opacity', 0.8)
                .on('mousedown', mousedown)
                .on('mouseover', mouseover)
                .on('mousemove', mousemove)
                .on('mouseleave', mouseleave)
                .attr('cx', (d) => this.xScale(d[query1]))
                .attr('cy', (d) => this.yScale(d[query2]));

            circles.exit().transition().attr('r', 0).remove();
            if (reset) {
                this.svg.call(zoom.transform, d3.zoomIdentity);
                d3.selectAll('.selected').classed('selected', false);
                this.$store.dispatch('metamineNU/setSelectedData', [], {
                    root: true
                });
                // setReset(false);
            }
        }
    }
};
</script>
