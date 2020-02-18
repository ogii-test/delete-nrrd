/* eslint-disable no-tabs */
/* eslint-disable no-unused-vars */
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import utils from '../../../js/utils'
import { ConsoleView } from 'react-device-detect'

export default class d3Map {
  constructor (
    node,
    us,
    mapFeatures,
    data,
    colorScheme,
    onClick,
    minColor,
    maxColor,
    mapZ,
    mapX,
    mapY
  ) {
    this.node = node
    this.us = us
    this.mapFeatures = mapFeatures
    this.data = data
    this.colorScheme = colorScheme
    this.onClick = onClick
    this.minColor = minColor
    this.maxColor = maxColor
    this.mapZ = mapZ
    this.mapX = mapX
    this.mapY = mapY
    this.labels = true
    this.chart()
    this.legend()
  }

  /**
   *  The function that does the building of the svg with d3
   *
   *  @param {*}  node - the node we are going to build the svg in
   *  @param {*} us - the topojson json object to be used
   *  @param {string} [mapFeatures=counties] mapFeatures - A switch to view county data or state data
   *  @param {string[][]} data - a two dimenstional arrray of fips and data, maybe county or state fips
   *  @param {string} [colorScheme=green] colorScheme current lets you modify color from red to blue green or gray ;
   *  @param {*} onClick function that determines what to do if area is clicked
   *
 */

  onZoom (event) {
    // console.debug('transform onZoom', event.transform)
  }

  onZoomEnd (event) {
    // console.debug('transform onZoomEnd', event.transform)
  }

  zoom (transform) {
    try {
      if (transform) {
        const _zoom = transform
        this._chart
          .selectAll('path').attr('transform', 'translate(' + [_zoom.x, _zoom.y] + ')' + ' scale(' + _zoom.k + ')')
        this._zoom = _zoom
        return this._zoom
      }
      else {
        return this._zoom
      }
    }
    catch (err) {
      console.warn('Error in zoom: ', err)
    }
  }

  chart () {
    let _chart
    const self = this
    const node = this.node
    const us = this.us
    const mapFeatures = this.mapFeatures
    const data = this.data
    const colorScheme = this.colorScheme
    const onClick = this.onClick
    const minColor = this.minColor
    const maxColor = this.maxColor
    const width = this.node.children[1].scrollWidth
    const height = this.node.children[1].scrollHeight
    const mapZ = this.mapZ
    const mapX = this.mapX
    const mapY = this.mapY
    const vwidth = width //* 1.5
    const vheight = height //* 1.5
    const _zoom = this._zoom

    if (node.children[1].children[0]) {
      this._chart = d3.select(node.children[1].children[0])
      this._chart.selectAll('path').remove()
      _chart = this._chart
    }

    else {
      _chart = d3
        .select(node.children[1])
        .append('svg')
        .style('width', width)
        .style('height', height)
        .attr('height', '100%')
        .attr('fill', '#E0E2E3')
        .attr('class', 'map')
        .attr('viewBox', '0 0 ' + vwidth + ' ' + vheight)
    }
    // const margin = { top: 0, bottom: 0, right: 0, left: 0};

    const projection = d3.geoAlbersUsa()
      .translate([width / 2, height / 2]) // translate to center of screen
      .scale([height*1.5]) // scale things down so see entire US

    const path = d3.geoPath(projection)

    let color = () => {}

    // switch quick and dirty to let users change color beter to use d3.interpolateRGB??
    switch (colorScheme) {
    case 'blue':
      color = d3.scaleSequentialQuantile(
        data.values, t =>
          d3.interpolateBlues(t)
      )
      break
    case 'green':
      color = d3.scaleSequentialQuantile(
        data.values, t =>
          d3.interpolateGreens(t)
      )
      break
    case 'red':
      color = d3.scaleSequentialQuantile(
        data.values, t =>
          d3.interpolateReds(t)
      )
      break
    case 'grey':
      color = d3.scaleSequentialQuantile(
        data.values, t =>
          d3.interpolateGreys(t)
      )
      break
    default:
      color = d3.scaleSequentialQuantile(
        data.values, t =>
          d3.interpolateGreens(t)
      )
    }

    if (minColor && maxColor) {
      color = d3
        .scaleSequentialQuantile()
        .interpolator(d3.interpolateRgb(minColor, maxColor))
        .domain(data.values.sort())
    }

    this.color = color
    const format = d => {
      if (isNaN(d)) {
        return ''
      }
      else {
        return '$' + d3.format(',.0f')(d)
      }
    }

    const zoom = d3
      .zoom()
      .scaleExtent([-32, 32])
      .on('zoom', zoomed)
      .on('end', ended)

    const g = _chart.append('g')
    _chart.call(zoom)
    g.selectAll('path')
      .data(topojson.feature(us, us.objects[mapFeatures]).features)
      .join('path')
      .attr('fill', d => color(data.get(d.id)))
      .attr('fill-opacity', 0.9)
      .attr('d', path)
      .attr('stroke', '#CACBCC')
      .attr('vector-effect', 'non-scaling-stroke')
      .on('click', (d, i) => {
        onClick(d, i)
      })
      .on('mouseover', function (d, i) {
        d3.select(this)
          .style('fill-opacity', 0.7)
	  .style('cursor', 'pointer')
      })
      .on('mouseout', (d, i) => {
        d3.selectAll('path')
          .style('fill-opacity', 0.9)
      })
      .append('title')
      .text(d => `${ d.properties.name }  ${ format(data.get(d.id)) }`).transition().duration(3000)

    _chart.append('path')
      .datum(topojson.mesh(us, us.objects[mapFeatures], (a, b) => a !== b))
      .attr('fill', 'none')
      .attr('d', path)

    _chart.transition().duration(3000)

    function zoomed () {
      g.selectAll('path')
        .attr('transform', d3.event.transform)

      self.onZoom(d3.event)
    }
    function ended () {
      //      console.debug('end')
      self.onZoomEnd(d3.event)
    }

    this._chart = _chart
    return _chart
  }

  legend () {
    const title = this.data.title
    const data = this.data
    const color = this.color
    let legend
    if (this.node.children[0].children[0]) {
      this._legend = d3.select(this.node.children[0].children[0])
      this._legend.selectAll('g').remove()
      legend = this._legend
    }
    else {
      legend = d3.select(this.node.children[0]).append('svg')
        .attr('class', 'legend')
    }

    const g = legend
      .append('g')
      .attr('transform', 'translate(30,0)')
    const width = 200
    const height = 20
    const sorted = data.values.sort((a, b) => a - b)
    const lowest = utils.formatToSigFig_Dollar(Math.floor(sorted[0]), 3)
    const median = utils.formatToSigFig_Dollar(
      Math.floor(sorted[Math.floor(sorted.length / 2)]),
      3
    )
    const highest = utils.formatToSigFig_Dollar(
      Math.floor(sorted[sorted.length - 1]),
      3
    )
    for (let ii = 0; ii < sorted.length; ii++) {
      g.append('rect')
        .attr('x', (ii * width) / sorted.length)
        .attr('width', width / sorted.length + 1)
        .attr('height', height)
        .attr('fill-opacity', 0.9)
        .style('fill', color(sorted[ii]))
    }
    g.append('text')
      .attr('class', 'caption')
      .attr('y', -6)
      .attr('fill', '#000')
      .attr('text-anchor', 'start')
      .attr('font-weight', 'bold')
      .text(title)

    if (this.labels) {
      g.call(
        d3
          .axisBottom(d3.scalePoint([lowest, median, highest], [0, width]))
          .tickSize(20)
      )
        .select('.domain')
        .remove()
    }
  }
}