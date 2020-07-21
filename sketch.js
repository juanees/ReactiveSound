var mic;
var fft;

var micLevel;
var spectrum;
var waveform;

var showing = true;
var waitress;
var currtime;
var prevMicLevel = -100;
var cnv;



var particles = new Array(1024);


function setup() {
  cnv = createCanvas(windowWidth, windowHeight);
  background(0);
  mic = new p5.AudioIn()
  mic.start();
  fft = new p5.FFT();
  fft.setInput(mic);

  waitress = millis() + 10000;
  frameRate(30);
  // instantiate the particles.
  for (var i = 0; i < particles.length; i++) {
    var x = map(i, 0, 1024, 0, width * 2);
    var y = random(0, height);
    var position = createVector(x, y);
    particles[i] = new Particle(position);
  }

  //var color = randomColor()
}

function draw() {
  updateVariables(); //Update all the necessary vars 

  background(0);
  //background(color)
  reactiveMouth();
  reactiveDot();
  reactiveArcs();
  ampPaint();

  WaveformPaint();

  SpectrumPaint();
  RainPaint();
  hideMouse(); 

}

function RainPaint() {
  // update and draw all [binCount] particles!
  // Each particle gets a level that corresponds to
  // the level at one bin of the FFT spectrum. 
  // This level is like amplitude, often called "energy."
  // It will be a number between 0-255.
  for (var i = 0; i < spectrum.length; i++) {
    var thisLevel = map(spectrum[i], 0, 255, 0, 1);

    // update values based on amplitude at this part of the frequency spectrum
    particles[i].update(thisLevel);

    // draw the particle
    particles[i].draw();

    // update x position (in case we change the bin count while live coding)
    particles[i].position.x = map(i, 0, spectrum.length, 0, width * 2);
  }
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

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(0);
}

// ===============
// Particle class
// ===============

var Particle = function (position) {
  this.position = position;
  this.scale = random(0, 1);
  this.speed = createVector(0, random(0, 10));
  this.color = [random(0, 255), random(0, 255), random(0, 255)];
}

var theyExpand = 1;

// use FFT bin level to change speed and diameter
Particle.prototype.update = function (someLevel) {
  this.position.y += this.speed.y / (someLevel * 2);
  if (this.position.y > height) {
    this.position.y = 0;
  }
  this.diameter = map(someLevel, 0, 1, 0, 100) * this.scale * theyExpand;

}

Particle.prototype.draw = function () {
  fill(this.color);
  ellipse(
    this.position.x, this.position.y,
    this.diameter, this.diameter
  );
}