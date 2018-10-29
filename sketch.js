var mic;
var fft;

var micLevel;
var spectrum;
var waveform;

var showing = true;
var waitress;
var currtime;
var prevMicLevel = -100;
var divisions = 5;
var cnv;
var speed = 1;
var cnv;

function setup() {
  cnv = createCanvas(windowWidth, windowHeight);
  background(0);
  mic = new p5.AudioIn()
  mic.start();
  fft = new p5.FFT();
  fft.setInput(mic);

  waitress = millis() + 10000;

}

function draw() {
  updateVariables(); //Update all the necessary vars in a single function

  if (prevMicLevel < micLevel) {
    background(randomColor())
    prevMicLevel = micLevel;
  }


  reactiveMouth();
  reactiveDot();
  reactiveArcs();
  ampPaint();

  WaveformPaint();

  SpectrumPaint();
  //OctavePaint();
  hideMouse(); //FUNCION PARA ESCONDER EL MOUSE
}

function OctavePaint() {
  var h = height / divisions;
  var spectrum = fft.analyze();
  var newBuffer = [];

  var scaledSpectrum = splitOctaves(spectrum, 12);
  var len = scaledSpectrum.length;

  background(200, 200, 200, 1);
  // copy before clearing the background
  copy(cnv, 0, 0, width, height, 0, speed, width, height);

  // draw shape
  beginShape();

  // one at the far corner
  curveVertex(0, h);

  for (var i = 0; i < len; i++) {
    var point = smoothPoint(scaledSpectrum, i, 2);
    var x = map(i, 0, len - 1, 0, width);
    var y = map(point, 0, 255, h, 0);
    curveVertex(x, y);
  }

  // one last point at the end
  curveVertex(width, h);

  endShape();
}

function updateVariables() {
  micLevel = mic.getLevel() * 5;
  spectrum = fft.analyze();
  waveform = fft.waveform();
  var predefinedFeq = ["bass", "lowMid", "mid", "highMid", "treble"];
  energies = predefinedFeq.map((freq) => {
    return {
      name: freq,
      energy: fft.getEnergy(freq)
    };
  })
}

function SpectrumPaint() {
  noStroke();
  fill(randomColor())
  for (var i = 0; i < spectrum.length; i++) {
    var x = map(i, 0, spectrum.length, 0, width);
    var h = -height + map(spectrum[i], 0, 255, height, 0);
    rect(x, height, width / spectrum.length, h)
  }
}

function WaveformPaint() {
  fill(randomColor());
  beginShape();
  fill(0)
  strokeWeight(1);
  for (var i = 0; i < waveform.length; i++) {
    var x = map(i, 0, waveform.length, 0, width + 10);
    var y = map(waveform[i], -1, 1, 0, height + 10);
    vertex(x, y);
  }
  endShape();
}

function reactiveArcs() {
  //background(0);
  fill(randomColor())
  stroke(1);
  // ellipse(random(width), random(height), height, micLevel * 8000);
  arc(random(width), random(height), random(micLevel * 8000), random(micLevel * 8000), random(TWO_PI), random(TWO_PI), PIE);
}

function reactiveMouth() {

  //background(0);
  fill(randomColor())
  noStroke();
  ellipse(width / 2, height / 2, height, energies[0].energy * 5);
}

function reactiveDot() {
  fill(randomColor())
  noStroke();
  ellipse(width / 2, height / 2, energies[2].energy * 5, energies[2].energy * 5);
}

function ampPaint() {
  fill(color(random(255), random(255), random(255), random(255)))
  noStroke();
  ellipse(width / 2, constrain(height - micLevel * height * 5, 0, height), micLevel * 800, micLevel * 800);
}


function hideMouse() {
  currtime = millis();
  if ((mouseX != pmouseX) || (mouseY != pmouseY)) { // if mouse moved,
    if (!showing) { // and if it's hidden,
      cursor(); // show pointer
      showing = true;
    }
    if (waitress < currtime + 1000) {
      waitress = currtime + 2000; // hide mouse 2 seconds from now
    }
  } else { // mouse has not moved
    if (showing) {
      if (currtime > waitress) { // they've been visible long enough,
        noCursor();
        showing = false; // so hide pointer
      }
    }
  }
}
/**
 *  Divides an fft array into octaves with each
 *  divided by three, or by a specified "slicesPerOctave".
 *  
 *  There are 10 octaves in the range 20 - 20,000 Hz,
 *  so this will result in 10 * slicesPerOctave + 1
 *
 *  @method splitOctaves
 *  @param {Array} spectrum Array of fft.analyze() values
 *  @param {Number} [slicesPerOctave] defaults to thirds
 *  @return {Array} scaledSpectrum array of the spectrum reorganized by division
 *                                 of octaves
 */
function splitOctaves(spectrum, slicesPerOctave) {
  var scaledSpectrum = [];
  var len = spectrum.length;

  // default to thirds
  var n = slicesPerOctave || 3;
  var nthRootOfTwo = Math.pow(2, 1 / n);

  // the last N bins get their own 
  var lowestBin = slicesPerOctave;

  var binIndex = len - 1;
  var i = binIndex;


  while (i > lowestBin) {
    var nextBinIndex = round(binIndex / nthRootOfTwo);

    if (nextBinIndex === 1) return;

    var total = 0;
    var numBins = 0;

    // add up all of the values for the frequencies
    for (i = binIndex; i > nextBinIndex; i--) {
      total += spectrum[i];
      numBins++;
    }

    // divide total sum by number of bins
    var energy = total / numBins;
    scaledSpectrum.push(energy);

    // keep the loop going
    binIndex = nextBinIndex;
  }

  // add the lowest bins at the end
  for (var j = i; j > 0; j--) {
    scaledSpectrum.push(spectrum[j]);
  }

  // reverse so that array has same order as original array (low to high frequencies)
  scaledSpectrum.reverse();

  return scaledSpectrum;
}


// average a point in an array with its neighbors
function smoothPoint(spectrum, index, numberOfNeighbors) {

  // default to 2 neighbors on either side
  var neighbors = numberOfNeighbors || 2;
  var len = spectrum.length;

  var val = 0;

  // start below the index
  var indexMinusNeighbors = index - neighbors;
  var smoothedPoints = 0;

  for (var i = indexMinusNeighbors; i < (index + neighbors) && i < len; i++) {
    // if there is a point at spectrum[i], tally it
    if (typeof (spectrum[i]) !== 'undefined') {
      val += spectrum[i];
      smoothedPoints++;
    }
  }

  val = val / smoothedPoints;

  return val;
}
//from https://github.com/therewasaguy/p5-music-viz/blob/gh-pages/demos/05_fft_scaleOneThirdOctave_UnknownPleasures/sketch.js