// import 'whatwg-fetch';
//SongVis v0.1 Copyright 2019 Hugo Lima
/* This is the code for SongVis, a tool to visualize the semantics of music using D3.js and Essentia. */

// Colors by © 2019 Observable, Inc.
var RedYlBlu = ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4", "#313695"];
var RedYlGn = ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837"];
var Spectral = ["#9e0142", "#d53e4f", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#e6f598", "#abdda4", "#66c2a5", "#3288bd", "#5e4fa2"];

// styles
var styles = {
    "controls" : {
      "drawBlocks" : "none", // none, mood
      "drawWaveform" : true, // false, true
      "drawPattern" : false, // false, true
      "renderMusicPlayer" : false,
      "toolTip" : true
    },
    "layout" : {
        "border": "solid 1px #000"
    },
    "glyphs" : {
        "fill" : "yellow"
    },
    "blocks" : {
        "colors" : RedYlBlu,
        "strokecolor" : "black",
        "opacity" : 1,
        "strokewidth" : 0.5
    },
    "pattern" : {
        "enable" : "true",
        "seed" : 0.5,
        "strokecolor" : "black",
        "strokewidth" : 1,
        "strokeopacity" : 1
    },
    "waveform": {
        "scale": 2,
        "scalebias": 4,
        "color": "black",
        "opacity_disabled": 0,
        "opacity_enabled": 1,
        "strokecolor": "white",
        "strokewidth": 0.5,
        "strokeopacity": 0.5
    }
};

// Scale of colors
var cScale = d3.scaleQuantile().domain([0, 0.5,1]).range(styles.blocks.colors);

// Glyphs bank
var glyphs = {
        "genre": {
            "classical" : "img/classical.svg",
            "dance" : "img/dance.svg",
            "hiphop": "img/hiphop.svg",
            "jazz" : "img/jazz.svg",
            "pop" : "img/pop.svg",
            "rb" : "img/rb.svg",
            "rock" : "img/rock.svg"
        },
        "instrument": {
            "voice": "img/vocal.svg",
            "guitar": "img/guitar.svg",
            "piano": "img/piano.svg",
            "violin": "img/violin.svg",
            "drums": "img/drum.svg",
            "saxophone": "img/sax.svg"
        },
        "bpm": {
            "slow": "img/slow.svg",
            "fast": "img/fast.svg"
        },
        "danceability": {
            "danceable": "img/danceable.svg",
            "notdanceable": "img/notdanceable.svg"
        },
        "mood": {
            1 : 'img/mood/1f600.svg',
            0.989 : 'img/mood/1f603.svg',
            0.911 : 'img/mood/1f60c.svg',
            0.877 : 'img/mood/1f601.svg',
            0.848 : 'img/mood/1f604.svg',
            0.835 : 'img/mood/1f606.svg',
            0.612 : 'img/mood/1f62c.svg',
            0.539 : 'img/mood/1f62f.svg',
            0.346 : 'img/mood/1f627.svg',
            0.328 : 'img/mood/1f62a.svg',
            0.289 : 'img/mood/1f61e.svg',
            0.260 : 'img/mood/1f614.svg',
            0.192 : 'img/mood/1f623.svg',
            0.03 : 'img/mood/1f629.svg',
            0.009 : 'img/mood/1f610.svg',
            0 : 'img/mood/1f615.svg'
        }
    };

// Energy bands
var band = {
        0 : "high",
        1 : "middle_high",
        2 : "middle_low",
        3 : "low"
    };

var mood_array = [
        0, 0.009, 0.03, 0.192, 0.260, 0.289, 0.328, 0.346, 0.539, 0.612, 0.835, 0.848, 0.877, 0.911, 0.989, 1.000
    ];

Math.sign = function(d){
  if (d<0){
    return -1;
  } if (d===0){
    return 0;
  } if (d>0){
    return 1;
  }
}

Math.log1p = Math.log1p || function(x) {
  return Math.log(1 + x);
};

function SongVis(id, height, datafile, musicfile, stylefile) {
  if (musicfile !== undefined){
    var req = new XMLHttpRequest();
    songData = {};
    req.overrideMimeType("application/json");
    req.open('GET', datafile, true);
    req.onload  = function() {
       var jsonResponse = JSON.parse(req.responseText);

       // Read datafile
       var req = new XMLHttpRequest();
       songData = {};
       req.overrideMimeType("application/json");
       req.open('GET', datafile, true);
       req.onload  = function() {
         var jsonResponse = JSON.parse(req.responseText);
         songData = jsonResponse;
         // do something with jsonResponse
         // Calculate Dimensions
         var dimensions = calculateDimensions(height);

         // Create layout
         var songvisLayout = createLayout(id, dimensions);

         // Render Glyphs
         var glyphSection = renderGlyphsSection(songvisLayout, dimensions, songData);

         // Render Wave
         renderWaveSection(songvisLayout, dimensions, songData);

         // Render Player
         renderMusicPlayer(styles.controls.toolTip, dimensions, songvisLayout, musicfile, songData);

         // Tooltip
         toolTip(styles.controls.toolTip, dimensions, songvisLayout, songData);

       };
       req.send(null);
     }; req.send(null);
  } else {
    var req = new XMLHttpRequest();
    songData = {};
    req.overrideMimeType("application/json");
    req.open('GET', datafile, true);
    req.onload  = function() {
      var jsonResponse = JSON.parse(req.responseText);
      songData = jsonResponse;
      // do something with jsonResponse
      // Calculate Dimensions
      var dimensions = calculateDimensions(height);

      // Create layout
      var songvisLayout = createLayout(id, dimensions);

      // Render Glyph's Section
      var glyphSection = renderGlyphsSection(songvisLayout, dimensions, songData);

      // Render Wave Section
      renderWaveSection(songvisLayout, dimensions, songData);

      // Render Player
      renderMusicPlayer(styles.controls.toolTip, dimensions, songvisLayout, musicfile, songData);

      // Tooltip
      // toolTip(styles.controls.toolTip, dimensions, songvisLayout, songData);
    }; req.send(null);
  }
}

// Calculate the width, given a desired height
function calculateDimensions(height) {
    var PHI = (1 + Math.sqrt(5))/2;
    var width = Math.floor(height * PHI);
    var glyphHeight = (Math.floor(height * PHI))/5;
    var waveHeight = height - (Math.floor(height * PHI))/5;
    var dimensions = {
        height: +height,
        width: +width,
        glyphSection: {
            height: +glyphHeight
        },
        waveSection: {
            height: +waveHeight
        },
    };
    return dimensions;
}

// Calculate the position of the blocks
function calculateBlockPositions (dimensions) {
  n_of_blocks_x = 20;
  n_of_blocks_y = 4;
  var block_width = dimensions.width/n_of_blocks_x;
  var block_height = dimensions.waveSection.height/n_of_blocks_y;

  var blocks_positions = [];
  var x, y;

  for(var i = 0; i<n_of_blocks_y; i++){
    for(var j = 0; j<n_of_blocks_x; j++){
      x = j*block_width;
      y = i*block_height;
      var tmp = {"x" : x, "y" : y, "i": i, "j" : j};
      blocks_positions.push(tmp);
    }
  }
  return blocks_positions;
}

// Create the layout of SongVis
function createLayout(id, dimensions){
  // Create layout
  var songvisLayout = d3.selectAll("#" + id)
                        .append("g")
                        .append("svg")
                        .attr("name", "SongVis")
                        .attr("height", dimensions.height)
                        .attr("width", dimensions.width)
                        .style("border", styles.layout.border);
  return songvisLayout;
}

// Render glyphs
function renderGlyphsSection(songvisLayout, dimensions, songData){
  var blocks_positions = calculateBlockPositions(dimensions);
  // Create Glyphs section
  var glyphSection = songvisLayout.append("g")
                                    .attr("name", "glyphs");

  // Glyph 1:  Genre
  glyphSection.append("svg")
                .attr("height", dimensions.glyphSection.height)
                .attr("width", dimensions.glyphSection.height)
                .attr("transform", "translate(0,0)")
                .append("image")
                .attr("xlink:href", glyphs.genre[songData.glyphs.genre.value])
                .attr("height", "100%")
                .attr("width", "100%");

  // Glyph 2: Instrument
  var glyph2 = glyphSection.append("svg")
                            .attr("height", dimensions.glyphSection.height)
                            .attr("width", dimensions.glyphSection.height)
                            .attr("x", dimensions.glyphSection.height*1)
                            .attr("y", 0);

  glyph2.append("svg:image")
          .attr("xlink:href", glyphs.instrument[songData.glyphs.instrument.value])
          .attr("height", dimensions.glyphSection.height)
          .attr("width", dimensions.glyphSection.height);

  // Glyph 3: BPM
  if (styles.controls.drawPattern === true){
    var isBpmSelected = true;
  } else {
    isBpmSelected = false;
  }
  // var isBpmSelected = false;
  var glyph3 = glyphSection.append("svg")
                          .attr("height", dimensions.glyphSection.height)
                          .attr("width", dimensions.glyphSection.height)
                          .attr("x", dimensions.glyphSection.height*2)
                          .attr("y", 0);

      glyph3.append("svg:image")
            .attr("xlink:href", glyphs.bpm[songData.glyphs.bpm.value])
            .attr("height", dimensions.glyphSection.height)
            .attr("width", dimensions.glyphSection.height)

  var bar3 = glyph3.append("rect")
                    .attr("height", "7%")
                    .attr("width", dimensions.glyphSection.height)
                    .attr("x",0)
                    .attr("y",0)

      if(isBpmSelected === true){
        bar3.attr("fill", RedYlBlu[1]);
      } else { bar3.attr("fill", "none");}

      glyph3.on("mouseover", function() {
        waveSection = songvisLayout.select("g:nth-child(2)");
        waveSection.selectAll("g").remove();
        waveSection.selectAll("svg").remove();
              glyph3.append("rect")
                    .attr("height", "7%")
                    .attr("width", dimensions.glyphSection.height)
                    .attr("x",0)
                    .attr("y",0)
                    .attr("fill", RedYlBlu[1])

              //pattern
              if (isMoodSelected === true){
                drawBlocks("mood", dimensions, waveSection, blocks_positions, songData);
                drawPattern(true, dimensions, waveSection, blocks_positions, songData);
              } else {
                drawPattern(true, dimensions, waveSection, blocks_positions, songData);
              }
          })
            .on("mouseout", function() {
                if (isBpmSelected === false){
                  waveSection.selectAll("g").remove();
                  waveSection.selectAll("svg").remove();
                  glyph3.selectAll("rect").remove();
                  if (isMoodSelected === true){
                    drawBlocks("mood", dimensions, waveSection, blocks_positions, songData);
                  } else {
                    drawBlocks("none", dimensions, waveSection, blocks_positions, songData);
                    drawWaveform(true, dimensions, waveSection, songData);
                  }
                }
              })
            .on("click", function() {
              var bar3 = glyph3.append("rect")
                                .attr("height", "7%")
                                .attr("width", dimensions.glyphSection.height)
                                .attr("x",0)
                                .attr("y",0)
                                .attr("fill", RedYlBlu[1])

              if (isBpmSelected === false){
                waveSection.selectAll("g").remove();
                waveSection.selectAll("svg").remove();
                if (isMoodSelected === true){
                  isBpmSelected = true;
                  drawBlocks("mood", dimensions, waveSection, blocks_positions, songData);
                  drawPattern(true, dimensions, waveSection, blocks_positions, songData);
                } else{
                  isBpmSelected = true;
                  drawPattern(true, dimensions, waveSection, blocks_positions, songData);
                }
              } else if (isMoodSelected === false){
                glyph3.selectAll("rect").remove();
                isBpmSelected = false;
              } else {
                glyph3.selectAll("rect").remove();
                drawBlocks("mood", dimensions, waveSection, blocks_positions, songData);
                isBpmSelected = false;
              }
            });

  // Glyph 4: Mood
  if (styles.controls.drawBlocks === "mood"){
    var isMoodSelected = true;
  } else {
    isMoodSelected = false;
  }

  // var isMoodSelected = false;
  var glyph4 = glyphSection.append("svg")
                          .attr("height", dimensions.glyphSection.height)
                          .attr("width", dimensions.glyphSection.height)
                          .attr("x", dimensions.glyphSection.height*3)
                          .attr("y", 0);

      glyph4.append("svg:image")
              .attr("xlink:href", glyphs.mood[getClosestValue(mood_array,songData.glyphs.mood.value)])
              .attr("height", dimensions.glyphSection.height)
              .attr("width", dimensions.glyphSection.height);

  var bar4 = glyph4.append("rect")
                    .attr("height", "7%")
                    .attr("width", dimensions.glyphSection.height)
                    .attr("x",0)
                    .attr("y",0)

      if(isMoodSelected === true){
        bar4.attr("fill", RedYlBlu[1]);
      } else { bar4.attr("fill", "none");}

      glyph4.on("mouseover", function() {
              var bar4 = glyph4.append("rect")
                                .attr("height", "7%")
                                .attr("width", dimensions.glyphSection.height)
                                .attr("x",0)
                                .attr("y",0)
                                .attr("fill", RedYlBlu[1])

              waveSection = songvisLayout.select("g:nth-child(2)");
              waveSection.selectAll("g").remove();
              waveSection.selectAll("svg").remove();
              if (isBpmSelected === true){
                bar4.attr("fill", RedYlBlu[1]);
                drawBlocks("mood", dimensions, waveSection, blocks_positions, songData);
                drawPattern(true, dimensions, waveSection, blocks_positions, songData);
              } else {
                bar4.attr("fill", RedYlBlu[1]);
                drawBlocks("mood", dimensions, waveSection, blocks_positions, songData);
              }
          })
        .on("mouseout", function() {
            if (isMoodSelected === false){
              waveSection.selectAll("g").remove();
              waveSection.selectAll("svg").remove();
              glyph4.selectAll("rect").remove();
              if (isBpmSelected === true){
                drawPattern(true, dimensions, waveSection, blocks_positions, songData);
              } else {
                drawBlocks("none", dimensions, waveSection, blocks_positions, songData);
                drawWaveform(true, dimensions, waveSection, songData);
              }
            }
          })
        .on("click", function() {
          var bar4 = glyph4.append("rect")
                          .attr("height", "7%")
                          .attr("width", dimensions.glyphSection.height)
                          .attr("x",0)
                          .attr("y",0)
                          .attr("fill", RedYlBlu[1])

          if (isMoodSelected === false){
            waveSection.selectAll("g").remove();
            waveSection.selectAll("svg").remove();
            if (isBpmSelected === true){
              drawBlocks("mood", dimensions, waveSection, blocks_positions, songData);
              drawPattern(true, dimensions, waveSection, blocks_positions, songData);
            } else {
              drawBlocks("mood", dimensions, waveSection, blocks_positions, songData);
            }
          isMoodSelected = true;
          } else {
            glyph4.selectAll("rect").remove();
            isMoodSelected = false;
          }
        });

  // Glyph 5: Danceability
  glyphSection.append("svg:image")
              .attr("xlink:href", glyphs.danceability[songData.glyphs.danceability.value])
              .attr("height", dimensions.glyphSection.height)
              .attr("width", dimensions.glyphSection.height)
              .attr("transform", "translate("+ dimensions.glyphSection.height*4 + ",0)");

  return glyphSection;
}

// Render the wave section
function renderWaveSection(songvisLayout, dimensions, songData) {
  // Create Wave section
  var waveSection = songvisLayout.append("g")
                                  .attr("name", "wave")
                                  .attr("width", dimensions.width)
                                  .attr("height", dimensions.waveSection.height)
                                  .attr("transform", "translate(0," + dimensions.glyphSection.height + ")");

  // Draw blocks
  var blocks_positions = calculateBlockPositions(dimensions);
  drawBlocks(styles.controls.drawBlocks, dimensions, waveSection, blocks_positions, songData);

  // Draw waveform
  drawWaveform(styles.controls.drawWaveform, dimensions, waveSection, songData);

  // Draw pattern
  drawPattern(styles.controls.drawPattern, dimensions, waveSection, blocks_positions, songData);
}

// Draw blocks for the wave section
function drawBlocks(feature, dimensions, waveSection, blocks_positions, songData) {
  n_of_blocks_x = 20;
  n_of_blocks_y = 4;
  var block_width = dimensions.width/n_of_blocks_x;
  var block_height = dimensions.waveSection.height/n_of_blocks_y;

  var blocks = waveSection.append("g")
                          .attr("name", "blocks")
                          .append("svg")
                          .attr("width", "100%")
                          .attr("height", "100%");

  var block = blocks.selectAll(".rect")
                    .data(blocks_positions)
                    .enter()
                    .append("rect")
                    .attr("width", block_width)
                    .attr("height", block_height)
                    .attr("transform", function(d){ return "translate("+ d.x +"," + d.y + ")"})
                    .attr("stroke", styles.blocks.strokecolor)
                    .attr("stroke-width", styles.blocks.strokewidth * block_height/100)
                    .attr("opacity", styles.blocks.opacity)
                    .attr("fill", function(d){
                      if (feature !== "none"){
                        return cScale(1-pickColor(feature, d.i, d.j, songData));
                        // return cScale(0);
                      } else {
                        return "none";
                      }
                    });
}

// Draw the waveform in the wave section
function drawWaveform(selected, dimensions, waveSection, songData){
  if (selected === true){
    var opacity = styles.waveform.opacity_enabled;
  } else {
    var opacity = styles.waveform.opacity_disabled;
  }
  var height = dimensions.waveSection.height;
  var width = dimensions.width;

  var waveform = waveSection.append("svg")
                              .attr("width", "100%")
                              .attr("height", "100%");
  // Object to array
  var samples = Object.keys(songData.samples)
                      .map(function(x) { return songData.samples[x]; });

  // Number of samples
  var samples_length = samples.length;

  // Scale for time
  var xScale = d3.scaleLinear()
                  .domain([0,samples_length])
                  .range([1,width]);

  // Scale for samples
  var yScale = d3.scaleSymlog()
                  .domain([-1,0,1])
                  .range([0,height/+styles.waveform.scale]);

  var bias = height/+styles.waveform.scalebias;
  var area = d3.area()
                .x(function(d, i){return xScale(i);})
                .y0(function(d){return yScale(d)-bias; })
                .y1(function(d){return height-yScale(d)+bias; });

  waveform.append("path")
            .attr("d", area(samples))
            .attr("fill", styles.waveform.color)
            .attr("opacity", opacity)
            .attr("stroke", styles.waveform.strokecolor)
            .attr("stroke-width", styles.waveform.strokewidth * dimensions.waveSection.height/100)
            .attr("stroke-opacity", styles.waveform.strokeopacity);
}

// Draw bpm patterns in the wave section
function drawPattern(selected, dimensions, waveSection, blocks_positions, songData){
  if (selected === true){
    var n_of_blocks_x = 20;
    var n_of_blocks_y = 5;
    var block_width = dimensions.width/n_of_blocks_x;
    var block_height = dimensions.waveSection.height/n_of_blocks_y;
    var hop_size = 0;
    // reduce number of data points if the size is too small
    if (dimensions.height <= 100){
      n_of_blocks_x = 10;
      n_of_blocks_y = 4;
      block_width = dimensions.width/n_of_blocks_x;
      block_height = dimensions.waveSection.height/n_of_blocks_y;
      hop_size = 1;
    }

    var wave = [{x : 0, y : 0},
                {x : 1, y : -2},
                {x : 2, y : 0},
                {x : 3, y : 2},
                {x : 4, y : 0},
                {x : 5, y : -2},
                {x : 6, y : 0},
                {x : 7, y : 2},
                {x : 8, y : 0}];

    var xScale = d3.scaleLinear()
                    .domain([0,8])
                    .range([1,block_width-1]);

    var yScale = d3.scaleLinear()
                    .domain([-2,0,2])
                    .range([0,block_height/4]);

    var block = waveSection.append("svg");
    var space_between = dimensions.waveSection.height/10;

    var i = 0, j, curve;
    while (i < n_of_blocks_x){

      // Check avg bpm to find best curve value
      var tmp = songData.wave[i+hop_size].avg_bpm;
      if (tmp < 80){
        curve = 0.1;
      } else if (tmp >= 80 && tmp < 120) {
        curve = 0.5;
      } else if (tmp >= 120) {
        curve = 1;
      }
      // curve = 0.1

      var valueline = d3.line()
                        .x(function(d) { return xScale(d.x); })
                        .y(function(d) { return yScale(d.y); })
                        .curve(d3.curveBundle.beta(curve));

      for (j = 0 ; j < 10; j++){
        block.append("path")
        .datum(wave)
        .attr("d", valueline)
        .attr("transform", "translate("+i*block_width+","+ j*space_between + ")");
      }
      i++;
    }

    block.selectAll("path")
        .attr("fill", "none")
        .attr("stroke", styles.pattern.strokecolor)
        .attr("stroke-width", styles.pattern.strokewidth)
        .attr("stroke-opacity", styles.pattern.strokeopacity);
  }
}

// Get closest value (feature) given an array of values
function getClosestValue(array,value){
    var i = 0;
    while (value > array[i]){
        i++;
    }
    if (Math.abs(array[i-1] - value) <= Math.abs(array[i] - value)){
        return array[i-1];
    }
    else {
        return array[i];
    }
}

// Pick color [0,...,1]
function pickColor(feature, line, column, songData){
  var features = {
    "bpm" : {
      "g" : "bpm",
      "avg" : "avg_bpm"
    },
    "mood" : {
      "g" : "mood",
      "avg" : "avg_mood"
    }
  };

  var sp = songData.wave[column].strong_peak; // strong peak
  var en = songData.wave[column].energy_band[band[line]]; // energy of the band
  var f_value = songData.wave[column][features[feature].avg];

  var gf_value = songData.glyphs[features[feature].g].value;
  var value, b3;

  if (feature === "bpm"){
    f_value = f_value/200;
    gf_value = gf_value/200;
  }

  // Logistic equation
  var b0 = 0.2; // General bias
  var b1 = 12; // Energy bias
  var b2 = 0.02;  // Strong peak bias

  if(gf_value<=0.5){
    b3 = 0.2; // bias
    value = b0 + b1*en + b2*sp + b3*f_value;
  } else {
    b3 = 0.4; // bias
    value = b0 + b1*en + b2*sp + b3*f_value;
  }
  return value;
}

function renderInteraction(){

}

// Render the player and implement the controls
function renderMusicPlayer(selected, dimensions, songvisLayout, musicfile, songData){
  // Create the player ONLY if there is a music file.
  // if (musicfile !== undefined && selected === true){
  if (selected === true){
    var height = dimensions.height/5;
    var width = dimensions.width;

    var musicPlayer = songvisLayout.append("g")
                                  .attr("name", "music")
                                  .attr("width", width)
                                  .attr("height", height)
                                  .attr("transform", "translate(0,"+ dimensions.height/1.2 +")");
    // create play button
    musicPlayer.append("rect");
    // create pause button
    // create stop button

    // create bar time

    // change the emoji

  }

}

function toolTip(selected, dimensions, songvisLayout, songData){
  if (selected === true){
    var tips = {
      "name" : songData.metadata.filename,
      "bpm" : songData.glyphs.bpm.bpm,
      "mood" : songData.glyphs.mood.value,
      "genre" : songData.glyphs.genre.value,
      "instrument" : songData.glyphs.instrument.value,
      "danceability" : songData.glyphs.danceability.value
    };

    var waveArea = songvisLayout.append("g")
                                .attr("width", dimensions.width)
                                .attr("height", dimensions.waveSection.height)
                                .attr("x", 0)
                                .attr("y", 0)
                                // .attr("transform", "translate(0,"+dimensions.glyphSection.height+")")
                                .append("svg")
                                .attr("width", "100%")
                                .attr("height", "100%")
                                .attr("name", "toolTipArea");

    var tooltip = d3.select(".songvis")
                  	.append("div")
                    .append("rect")
                    .attr("width", 50)
                    .attr("height", 50)
                    .attr("fill", "white")
                  	.style("position", "absolute")
                  	.style("z-index", "10")
                  	.style("visibility", "hidden")
                    .text(tips.name)
                  	// .text("BPM: "+parseInt(tips.bpm))
    // console.log(songvisLayout)
    // console.log(songvisLayout.select("g:nth-child(2)"))
// .selectAll("g:nth-child(2)")
    // songvisLayout.select("g:nth-child(4)")


    // waveArea.append("div")
      .on("mouseover", function(){
        return tooltip.style("visibility", "visible");
      })
      .on("mousemove", function(){
        return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
      })
      .on("mouseout", function(){
        return tooltip.style("visibility", "hidden");
      });
  }
}
