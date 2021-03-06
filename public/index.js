var heatmapActivated = false;
var maxLength = 50;
var ushexData;
var districtData = {};
var minCandidateConfiguration = 0;
var states = ["AL","AK","AS","AZ","AR","CA","CO","CT","DE","DC","FM","FL","GA","GU","HI","ID","IL","IN","IA","KS","KY","LA","ME","MH","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","MP","OH","OK","OR","PW","PA","PR","RI","SC","SD","TN","TX","UT","VT","VI","VA","WA","WV","WI","WY"];
var colors = ["#0a72ff", "#1eff06", "#ff1902", "#2dfefe", "#827c01", "#fe07a6", "#a8879f", "#fcff04", "#c602fe", "#16be61", "#ff9569", "#05b3ff", "#ecffa7", "#3f8670", "#e992ff", "#ffb209", "#e72955", "#83bf02", "#bba67b", "#fe7eb1", "#7570c1", "#85bfd1", "#f97505", "#9f52e9", "#8ffec2", "#dad045", "#b85f60", "#fe4df2", "#75ff6c", "#78a55a", "#ae6a02", "#bebeff", "#ffb3b3", "#a4fe04", "#ffc876", "#c548a7", "#d6492b", "#547da7", "#358b06", "#95caa9", "#07b990", "#feb6e9", "#c9ff76", "#02b708", "#7b7a6e", "#1090fb", "#a46d41", "#09ffa9", "#bb76b7", "#06b5b6", "#df307c", "#9b83fd", "#ff757c", "#0cd9fd", "#bdba61", "#c89d26", "#91df7e", "#108c49", "#7b7d40", "#fdd801", "#048699", "#fc9d40", "#ff0f3b", "#87a72c", "#a25cc2", "#b95a82", "#bb8a80", "#cce733", "#f7b58d", "#adaaab", "#c141c8", "#08fbd8", "#ff6de4", "#c26040", "#bb9bf6", "#b08f44", "#6d96de", "#8dcaff", "#5be51c", "#68c948", "#ff5fb8", "#7f9872", "#9aa5ca", "#bad292", "#c32fe4", "#fc92df", "#e08eaa", "#fd0afd", "#2daad4", "#d96d2a", "#69e0c9", "#ce4b69", "#79ca8d", "#6e8e9a", "#ffec83", "#de0fb5", "#8471a2", "#bbd766", "#e94805", "#06ff54", "#9cf046", "#6a63ff", "#05e774", "#e38c7b", "#f6ff75", "#3cda96", "#d68e4b", "#d774fe", "#feca4c", "#80ff95", "#5571e1", "#6da9a1", "#a5a20d", "#d5484a", "#688326", "#e7d08f", "#4e8653", "#5cad4c", "#c19bcf", "#ff0e76", "#d3ff0b", "#a66877", "#6ddde3", "#a544fe", "#c2fdb5", "#8f7955", "#fd735b", "#8497fd", "#fd919d", "#fdf346", "#fe5581", "#fd4e50", "#0ca82e", "#d4a8b2", "#d14e91", "#0d9069", "#0c8bca", "#fd9403", "#d5b401", "#adc32e", "#efacfe", "#9da668", "#57b093", "#787791", "#ff6f39", "#9e790a", "#d18903", "#abb49a", "#a06790", "#cf70cb", "#c8fe96", "#488834", "#dcbf55", "#e82f23", "#9a90d5", "#9cd54d", "#c7936c", "#05dc4a", "#98f372", "#907275", "#167dcf", "#db2b9f", "#16b16e", "#49a802", "#66cd1d", "#905fdc", "#cecd02", "#a376ca", "#939540", "#a7e103", "#d9ac6e", "#099334", "#db7701", "#3facbd", "#a0cb76", "#6aa3d5", "#dcaf98", "#b6692e", "#a76a59", "#04908e", "#d771ab", "#a69683", "#8268d0", "#72ab79", "#f70c8b", "#ebaa4c", "#9ce7b8", "#5f837a", "#df708c", "#ad9c32", "#39ffc2", "#d28388", "#79d5f9", "#e35eff", "#ffaf72", "#55e0b3", "#e8c0fe", "#6a69ed", "#fe07d3", "#0c86af"];
var stateToColor = _.zipObject(states, colors);

var setupSliders = function() {
  document.getElementById('minCandidate').max = maxLength;
};

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
    var districtName = normalizeDistrict(t);
    value = '<h3>' + districtName + ': ' + districtData[districtName] + '</h3>';
  }

  document.getElementById('infobox').innerHTML = value;
}

var hideDistrict = function(t) {
  d3.selectAll('path')
    .filter(function(r, i) { return r && t.properties.districtID == r.properties.districtID; })
    .style({ fill: colorDistrict, opacity: heatmapDistrictOpacity, stroke: colorDistrict });
};

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

var normalizeDistrict = function (t) {
  var state = t.properties.state;
  var district = t.properties.district;

  if (district.length == 1)
    district = '0' + district;

  return state + '-' + district
}

var colorDistrict = function(t) {
  if(stateToColor[t.properties.state]) {
    return stateToColor[t.properties.state];
  } else {
    return 'white';
  }
};

var heatmapDistrictOpacity = function(t) {
  var count = districtData[normalizeDistrict(t)];
  if (!count) count = 0

  return count >= minCandidateConfiguration
    ? count / maxLength
    : 0
};

var addCandidateData = function(data, candidateData) {
  districtData = candidateData
  maxLength = Math.max.apply(null, Object.keys(candidateData).map(k => candidateData[k]))
  toggleLoading()
  setupSliders()
  if (recolor) recolor()
};

var toggleLoading = function () {
  if (document.querySelector('#filled-in').innerHTML == '') {
    document.querySelector('#filled-in').innerHTML = Object.keys(districtData).length
    document.querySelector('#total').innerHTML = 435
  } else {
    document.querySelector('#filled-in').innerHTML = ''
    document.querySelector('#total').innerHTML = ''
  }
}

var recolor;

var changeRound = function (val) {
  toggleLoading()

  fetch(val == 'All'
    ? '/api/candidates'
    : '/api/candidates?round=' + val
  ).then(function(response) {
    response.json().then(function (candidateData) {
      addCandidateData(null, candidateData)
      if (recolor) recolor()
    });
  });
}

fetch('https://raw.githubusercontent.com/hammerdr/congressionaldistricts/master/data/ushex.json').then(function(response) {
  response.json().then(function(data) {
    ushexData = data;

    fetch('/api/candidates').then(function(response) {
      response.json().then(function(candidateData) {
        addCandidateData(data, candidateData);
      });
    });

    var width = 1000;
    var height = 650;
    var radius = 6.5;

    var svg = d3.select("#map").append("svg").attr("width", width).attr("height", height);

    var projection = hexProjection(radius);
    var path = d3.geo.path().projection(projection)
    var hexFeatures = topojson.feature(data, data.objects.states).features;

    console.log(hexFeatures)

    var hexagons = svg.append("g").attr("class", "hexagon").selectAll("hexagon")
      .data(hexFeatures)
      .enter()
      .append("path")
      .attr("d", path)
      .style({ fill: colorDistrict, opacity: heatmapDistrictOpacity, stroke: colorDistrict })
      .on('click', displayInfoForDistrict);

    var checkBorderByState = function(hex1, hex2) {
      return hex1.properties.state != hex2.properties.state;
    }

    var drawStateBorder = function(border) {
      border.attr("d", path(topojson.mesh(data, data.objects.states, checkBorderByState)));
    }

    var stateBorder = svg.append("path")
      .attr("class", "stateBorder")
      .call(drawStateBorder);

    var checkBorderByDistrict = function(hex1, hex2) {
      if (hex1.properties.state == hex2.properties.state)
        return hex1.properties.district != hex2.properties.district;
      else
        return true;
    }

    var drawDistrictBorder = function(border) {
      border.attr("d", path(topojson.mesh(data, data.objects.states, checkBorderByDistrict)));
    }

    var districtBorder = svg.append("path")
      .attr("class", "districtBorder")
      .call(drawDistrictBorder);

    recolor = function() {
      d3
        .selectAll('path')
        .data(hexFeatures)
        .style({ fill: colorDistrict, opacity: heatmapDistrictOpacity, stroke: colorDistrict });
    }
  });
});


document.addEventListener( "DOMContentLoaded", function(){
  setupSliders()

  document.getElementById('minCandidate').addEventListener('change', function() {
    var value = document.getElementById('minCandidate').value;
    document.getElementById('minCandidateValue').innerText = value;
    minCandidateConfiguration = value;
    recolor();
  });

  document.getElementById('round').addEventListener('change', function() {
    var value = document.getElementById('round').value;
    changeRound(value);
  });
}, false);
