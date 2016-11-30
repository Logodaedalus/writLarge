
// The Markov Generator
  // First argument is N-gram length, second argument is max length of generated text
  //generator = new RiMarkov(3, true, false);
  //generator.loadFrom('scripts/data/tweets.txt');
  var cy;
  $("#outro").fadeOut("slow", function() {
    generate();
    window.setTimeout(outro, 45000);
  });
  
//-------------------------------------------------------------------------------------------------
function outro() {
  $("#outro").fadeIn("slow", function() {
    location.reload();
  });
}
//-------------------------------------------------------------------------------------------------
function generate() {

    var generateUnderground = true;

    var baseCorpus = ["scripts/data/tweets.txt"];
    var additiveCorpora = [
    {file: "scripts/data/precariat.txt", andList: ["and a dream"], orList: ["precariat", "labour", "income", "class"]},
    {file: "scripts/data/dream.txt", andList: ["and a dream"], orList: []},
    {file: "scripts/data/objects.txt", andList: ["and a dream"], orList: []}
    ];
    var texts = "";
    var randomIndex = Math.floor(Math.random() * (additiveCorpora.length - 0) + 0);
    console.log("FILE: ",additiveCorpora[randomIndex].file);
    $.get(baseCorpus, function(response) {
        texts += response;
        $.get(additiveCorpora[randomIndex].file, function(response2) {
            texts += response2;
            generator = createMarkovGenerator(texts);        //create Markov thing from corpus data
            var sentenceCorrect = false;
            var sentenceData;
            while(!sentenceCorrect) { 
              sentenceData = generateGraphData(generator);                   //generate node / edge graph from data
              //sentenceCorrect = checkSentence(sentenceData.sentence[0], additiveCorpora[randomIndex].andList, additiveCorpora[randomIndex].orList);
              sentenceCorrect = true;
            }
            var graphData = formatMarkovData(sentenceData.cytoGraphData);
            initCyto(graphData);        //pass data to initCyto()
            displaySentence(sentenceData.sentence[0]);
            if (generateUnderground) {
              displayUnderground(generator, additiveCorpora[randomIndex].andList, additiveCorpora[randomIndex].orList);
            }
            growTree();   

            
        });
    });

}
//-------------------------------------------------------------------------------------------------
function checkSentence(sentenceData, andList, orList) {
    var correct = true;
    var sentence = sentenceData.toLowerCase();
    for (var x=0; x < andList.length; x++) {
      if (sentence.indexOf(andList[x]) == -1) { return false; }
    }
    for (var x=0; x < orList.length; x++) {
      if (sentence.indexOf(orList[x]) > -1) {
        return true;
      }
    }
    if (orList.length == 0) { return true;}
    return false;
}
//-------------------------------------------------------------------------------------------------
function createMarkovGenerator(texts) {
    var generator = new RiMarkov(3);            //create Markov generator
    generator.loadText(texts);
    return generator;
}
//-------------------------------------------------------------------------------------------------
function displaySentence(sentence) {
  var senArray = sentence.split(" ");
  var interval = Math.floor(senArray.length / 3);
  var part1 = "<p id='p1'>" + senArray.slice(0,interval-1).join(" ") + "</p>";
  var part2 = "<p id='p2'>" + senArray.slice(interval-1, interval*2-1).join(" ") + "</p>";
  var part3 = "<p id='p3'>" + senArray.slice(interval*2-1, senArray.length).join(" ") + "</p>";
  $("#sentence").html(part1+part2+part3);
  $("#p1").contents().stretch({max: 150});
  $("#p2").contents().stretch({max: 150});
  $("#p3").contents().stretch({max: 150});
}
//-------------------------------------------------------------------------------------------------
function displayUnderground(generator, andList, orList) {
  var numSentences = 33;
  var sentences = [];
  while(sentences.length < numSentences) {
    var newSentences = generator.generateSentences(400);
    newSentences = newSentences.filter(function(sentence) {
      return checkSentence(sentence, andList, orList);
    });
    sentences = sentences.concat(newSentences);
  }

  for (var x = 0; x < sentences.length; x++) {
    sentences[x] += " " + generator.generateSentences(1);
  }

  sentences.forEach(function(sentence) {
    sentence = sentence.replace(/../g, ". ");
    sentence = sentence.replace(/.\,/g, ". ");
    sentence = sentence.replace(/\,./g, ", ");
  })

  for (var x=0; x < sentences.length; x++) {
      var directions = ['moveLeft', 'moveLeft'];
      var fontSize = Math.floor(Math.random()*(60 - 30) + 30);
      var fontColor = Math.floor(Math.random()*(100 - 0) + 0);
      fontSize = 20;
      var topOffset = 20*x;
      var theHtml = "<p class='marquee "+ directions[Math.round(Math.random())] +"' style='font-size:"+fontSize +"px; top:"+ topOffset +"px; color: hsl(0,0%,"+ fontColor +"%)'><span>" + sentences[x] + " " + sentences[x] + " " + sentences[x] + "<span></p>";
      $("#underground").append(theHtml);
  }
  console.log('yeah');
}
//-------------------------------------------------------------------------------------------------
function generateGraphData(generator) {
   // var graphData = [];
    //for (var x=0; x < 200; x++) {
    //  graphData.push(generator.generateSentencesWithCyto(1));
    //}
    graphData = generator.generateSentencesWithCyto(1);
    console.log(graphData.sentence);
    console.log(graphData.cytoGraphData);
    return graphData;
}
//-------------------------------------------------------------------------------------------------
function formatMarkovData(markovData) {

  var idStepper = 0;


    var addNode = function(id, text, nodeClass) {
        graphData.nodes.push({
            group: "nodes",
            classes: nodeClass,
            data: {
                "id" : id,
                "text" : text,
            }
        });
    };

    var addEdge = function(source, target, text) {

        var edgeObj = {
            group: "edges",
            data: {
                source: source,
                target: target,
                text: text
            }
        };
        graphData.edges.push(edgeObj);
    };
/*
NEW STUFF
    var genId = function(theNode) {
      //idStepper++;
      var theIds = "_";
      for (var aChild in theNode.children) {
        theIds += aChild.replace(/([^a-z0-9]+)/gi, '-');    //get rid of illegal characters
      }
      return theNode.token + theIds;
    };

    var recurse = function(theParent){
        
        for (var theChild in theParent.children) {
            var childIds = "";
            var id = genId(theParent.children[theChild]);
            addNode(id, theChild);            //add node to graph
            addEdge(genId(theParent), id);
            for (var recurseChild in theParent.children[theChild].children) {
              recurse(theParent.children[theChild].children[recurseChild]);
            }
        }
    }

    var graphData = {nodes: [], edges: [] };
    addNode(genId(markovData), markovData.token);       //add root note
    recurse(markovData);          //recurse and add all children
    console.log(markovData);
*/


    var stack = [], node, ii;
    stack.push(markovData);
    var graphData = {nodes: [], edges: [] };

    while (stack.length > 0) {
        node = stack.pop();
        var id = idStepper + "_" + node.token;
        var nodeClass = "";
        if (node.parent.token == "ROOT") { nodeClass = "root"; }
        addNode(id, node.token, nodeClass);            //add node to graph
        idStepper++;
        if (node.parent.token !== "ROOT") {
            var parentId;
            var edgeLabel = "";
            for (var x=graphData.nodes.length-1; x >= 0; x--) {            //search graphData nodes backwards
                var temp = graphData.nodes[x].data.id.split("_");
                if (temp[1] == node.parent.token) {
                    parentId = graphData.nodes[x].data.id;
                    edgeLabel = graphData.nodes[x].data.text;
                    break;
                }
            }
            addEdge(parentId, id, edgeLabel)
        }
        if (node.children && Object.keys(node.children).length) {
            for (var theChild in node.children) {
                stack.push(node.children[theChild]);
            }
        }
    }
    
    return graphData;
}
//-------------------------------------------------------------------------------------------------
function growTree() {
  cy.fit();
  var bfs = cy.elements().bfs('.root', function(){}, true);

  var i = 0;
  var highlightNextEle = function(){
    if( i < bfs.path.length ){
      bfs.path[i].addClass('highlighted');
    
      i++;
      setTimeout(highlightNextEle, 250);
    }
  };

  // kick off first highlight
  highlightNextEle();
}
//-------------------------------------------------------------------------------------------------
function initCyto(graphData) {

/*
  graphData.edges = graphData.edges.filter(function(item) {
      return typeof item.data.source !== "undefined" && typeof item.data.target !== "undefined";
  });
*/
    cy = cytoscape({
          container: document.getElementById('tree'),
          
          boxSelectionEnabled: false,
          autounselectify: true,
          
          style: cytoscape.stylesheet()
            .selector('node')
              .css({
                'height': 20,
                'width': 20,
                'background-fit': 'cover',
                'background-color': 'hsl(117, 86%, 31%)',
               // 'border-color': '#614103',
               // 'border-width': 3,
                'shape': 'roundrectangle',
                //'border-opacity': 0.5,
                //'label': 'data(text)',
                'text-rotation': '180deg',
                'text-margin-y': '-20px',
                'opacity': 0
              })
            .selector('edge')
              .css({
                'width': 15,
                //'target-arrow-shape': 'square',
                'line-color': 'hsl(117, 86%, 61%)',
                //'target-arrow-color': '#614103',
                'curve-style': 'bezier',
                'label': 'data(text)',
                'font-size': 35,
                'text-rotation' : 'autorotate',
                'opacity': 0
              })
            .selector('node.root')
                .css({
                   // 'label': 'data(text)',
                    'text-rotation': '180deg',
                    'text-margin-y': '-20px'
                })
            .selector('.highlighted')
              .css({
                /*
                'background-color': '#61bffc',
                'line-color': '#61bffc',
                'target-arrow-color': '#61bffc',
                */
                'opacity': 1,
                'transition-property': 'opacity',
                //'transition-property': 'background-color, line-color, target-arrow-color',
                'transition-duration': '0.5s'
              }),

          
          elements: graphData,
          
          layout: {
            name: 'breadthfirst',
            directed: true,
            padding: 10,
            roots: '.root'
          }
        }); // cy init

        
}
//-------------------------------------------------------------------------------------------------

function generateFromInput() {
    var theText = new RiString($("#txtInput").val());
    var posArray = RiTa.getPosTags(theText._text, true);
    var words = theText.words();
    var genTextArray = [theText.words()[0]];
    var blacklist = [];
    var maxRollbacks = 1000;

    for (var x=1; x < posArray.length; x++) {   
        var completions = generator.getProbabilities([genTextArray[x-1]]);      //get a list of possible completions, with probabilities
        var keys = [];
        for(var key in completions) {
            var tempArray = genTextArray.concat(key);           //make a temp array to get keys (so we have full context hopefully?)
            var posTag = RiTa.getPosTags(tempArray)[tempArray.length-1];
            keys.push( {
                word: key, 
                prob: completions[key], 
                pos: posTag
            });
        }

        var sortedKeys = keys.sort(function(a,b){ return a.prob - b.prob; });        //convert to array and sort high-to-low by probabilities
        var filteredKeys = sortedKeys.filter(function(key) { 
            return key.pos == posArray[x] && $.inArray(key.word, blacklist) == -1 
        });
        if (filteredKeys.length > 0) {
            blacklist = [];
            var randIndex = Math.floor(Math.random()*(filteredKeys.length-1+1)+0);
            genTextArray.push(filteredKeys[randIndex].word);
        }
        else {
            if (maxRollbacks == 0) {
                genTextArray.push(words[x]);
            }
            else {
                blacklist.push(genTextArray.pop());
                x=x-2;
                maxRollbacks--;
            }
            
            
        }
    }

    var genText = genTextArray.join(' ');
    genText = genText.replace(" .", ".");
    genText = genText.replace(" ,", ",");

    $('#generated').html(genText);
}

function generateWithMustHaves() {
    var numSentences = 20;
    var genText = [];
    var cleanedText = [];
    var formattedText = "";
    var mustHaves = ["and a dream"];
    var mustHaveOneOf = ["precariat", "labour", "income"];

    do {
        var newGenText = generator.generateSentences(20);
        genText = genText.concat(newGenText.filter(function(sentence) {
            var mustHave = false;
            var mustHaveOneOf = false;
        //return sentence.indexOf("dream") > -1
            return sentence.indexOf("and a dream") > -1 && (sentence.indexOf("precariat") > -1 || sentence.indexOf("labour") > -1 || sentence.indexOf("income") > -1 || sentence.indexOf("class") > -1)
        }));
    } while (genText.length < numSentences)

    for (var x=0; x < genText.length; x++) {
        formattedText += genText[x] + "<br>";
    }

    $('#generated').html(formattedText);
}

function cleanText(genText) {
    

return cleanedText;
}

function formatText(dirtyText) {
    
}

$('#generate').on('click', function () {
    generateFromInput();
});
$('#generateFromCorpus').on('click', function () {
    generateWithMustHaves();
});




//word aligner

/*
  var over, data, kwic, input;

  word = "dream"

function preload() {

  data = loadStrings('scripts/data.txt');
}

function setup() {

  createCanvas(800, 500);
  textFont('Times');
  textSize(18);
  fill(0);

  updateKWIC();
}

function updateKWIC() {

  kwic = RiTa.kwic(data.join('\n'), word, {
    ignorePunctuation: true,
    ignoreStopWords: true,
    wordCount: 10
  });

  background(250);

 // drawButtons();

  if (kwic.length == 0) {

    textAlign(CENTER);
    text("Word not found", width / 2, height / 2);

  } else {

    var tw = textWidth(word) / 2;

    for (var i = 0; i < kwic.length; i++) {

      //console.log(display[i]);
      var parts = kwic[i].split(word);
      var x = width / 2,
        y = i * 20 + 75;

      if (y > height - 20) return;

      fill(0);
      textAlign(RIGHT);
      text(parts[0], x - tw, y);

      fill(200, 0, 0);
      textAlign(CENTER);
      text(word, x, y);

      fill(0);
      textAlign(LEFT);
      text(parts[1], x + tw, y);
    }
  }
}

function drawButtons() {

  var posX = buttonX, posY = 40;

  for (var i = 0; i < buttons.length; i++) {

    stroke(200);
    var on = word == (buttons[i]) ? true : false;
    var tw = textWidth(buttons[i]);
    fill(!on && buttons[i] == over ? 235 : 255);
    rect(posX - 5, 24, tw + 10, 20, 7);
    fill((on ? 255 : 0), 0, 0);
    text(buttons[i], posX, 40);
    posX += tw + 20;
  }
}

function inside(mx, my, posX, tw) {

  return (mx >= posX - 5 && mx <= posX + tw + 5 && my >= 25 && my <= 44);
}

function mouseMoved() {

  over = null;
  var posX = buttonX, tw;

  for (var i = 0; i < buttons.length; i++) {

    tw = textWidth(buttons[i]);

    if (inside(mouseX, mouseY, posX, tw)) {

      over = buttons[i];
      break;
    }
    posX += tw + 20;
  }
}

function mouseClicked() {

  var posX = buttonX, tw;

  for (var i = 0; i < buttons.length; i++) {

    tw = textWidth(buttons[i]);

    if (inside(mouseX, mouseY, posX, tw)) {

      word = buttons[i];
      kwic = null;
      updateKWIC();
      break;
    }
    posX += tw + 20;
  }
}*/