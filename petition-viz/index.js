var d3 = require('d3')
var topojson = require('topojson')
var ushexData = require('./updated-raw')

var target = 5000

var presentCandidate = function(candidate) {
  return '<p>' + candidate['Name'] + '</p>';
};

var showDistrict = function(t) {
  if (!t || t.properties.districtID < 0) {
    return;
  }

  d3.selectAll('path')
    .filter(function(r, i) { return r && t.properties.districtID == r.properties.districtID; })
    .style({ fill: 'white', opacity: 1, stroke: colorDistrict });
};

var displayInfoForDistrict = function(t) {
  var value = '';

  if (t.properties.state != 'Ocean') {
    if (t.properties.supporting) {
      value = t.properties.count + ' thank ' + t.properties.rep + ' for co-sponsoring Medicare for All'
    } else {
      value = t.properties.count + ' in ' + t.properties.key + ' want ' +
              t.properties.rep + ' to co-sponsor Medicare for All' + '<br/><br/>' +
              'He hasn\'t yet - share <a target="_blank" href="http://go.justicedemocrats.com/page/s/take-a-stand">the petition</a> with your friends in '
              + t.properties.key + ' to increase the pressure'
    }
  }

  infobox.html(value)
}

var hexProjection = function(radius) {
  var dx = radius * 2 * Math.sin(Math.PI / 3),
  dy = radius * 1.5;
  return {
    stream: function(stream) {
      return {
        point: function(x, y) { stream.point(x * dx / 2, (y - (2 - (y & 1)) / 3) * dy / 2); },
        lineStart: function() { stream.lineStart(); },
        lineEnd: function() { stream.lineEnd(); },
        polygonStart: function() { stream.polygonStart(); },
        polygonEnd: function() { stream.polygonEnd(); }
      };
    }
  };
}

var colorDistrict = function(t) {
  if (t.properties.color) {
    return t.properties.color
  } else {
    return 'white'
  }
}

var heatmapDistrictOpacity = function(t) {
  var count = t.properties.count;
  if (!count) count = 0

  return  count / target
}

var recolor
var svg
var infobox
var width = 1000
var height = 650
var radius = 6.5

function go () {
  d3.select('#map').style('border', '2px solid grey').style('border-radius', '5px')
    .style('padding', '10px')

  svg = d3.select('#map').append('svg').attr('width', width).attr('height', height)
  infobox = d3.select('#map').append('div').style('padding-top', '10px')
              .style('border-top', '2px solid grey').style('text-align', 'center')
              .html('Click on a district above to see more')

  var projection = hexProjection(radius);
  var path = d3.geoPath().projection(projection)
  var hexFeatures = topojson.feature(ushexData, ushexData.objects.states).features;

  var hexagons = svg.append('g').attr('class', 'hexagon').selectAll('hexagon')
    .data(hexFeatures)
    .enter()
    .append('path')
    .attr('d', path)
    .style('fill', colorDistrict)
    .style('opacity', heatmapDistrictOpacity)
    .style('stroke', colorDistrict)
    .style('cursor', d => d.state != 'Ocean' ? 'pointer' : '')
    .on('click', displayInfoForDistrict)

  var checkBorderByState = function(hex1, hex2) {
    return hex1.properties.state != hex2.properties.state;
  }

  var drawStateBorder = function(border) {
    border.attr('d', path(topojson.mesh(ushexData, ushexData.objects.states, checkBorderByState)));
  }

  var stateBorder = svg.append('path')
    .style('fill', 'none')
    .style('stroke', '#000')
    .style('stroke-width', '2px')
    .style('pointer-events', 'none')
    .call(drawStateBorder);

  var checkBorderByDistrict = function(hex1, hex2) {
    if (hex1.properties.state == hex2.properties.state)
      return hex1.properties.district != hex2.properties.district;
    else
      return true;
  }

  var drawDistrictBorder = function(border) {
    border.attr('d', path(topojson.mesh(ushexData, ushexData.objects.states, checkBorderByDistrict)));
  }

  var districtBorder = svg.append('path')
    .style('fill', 'none')
    .style('stroke', '#000')
    .style('stroke-width', '1px')
    .style('stroke-opacity', '.2')
    .style('pointer-events', 'none')
    .call(drawDistrictBorder)

  recolor = function() {
    d3.selectAll('path')
      .data(hexFeatures)
      .style({ fill: colorDistrict, opacity: heatmapDistrictOpacity, stroke: colorDistrict });
  }
}

document.addEventListener('DOMContentLoaded', go)
