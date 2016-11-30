
// The Markov Generator
  // First argument is N-gram length, second argument is max length of generated text
  //generator = new RiMarkov(3, true, false);
  //generator.loadFrom('scripts/data/tweets.txt');
  var cy;
  generateTree();
//-------------------------------------------------------------------------------------------------
function generateTree() {

    var baseCorpus = ["scripts/data/tweets.txt"];
    var additiveCorpora = [
    "scripts/data/precariat.txt"
    ];
    var texts = "";
    var randomIndex = Math.floor(Math.random() * (additiveCorpora.length - 0) + 0);

    $.get(baseCorpus, function(response) {
        texts += response;
        $.get(additiveCorpora[randomIndex], function(response2) {
            texts += response2;
            generator = createMarkovGenerator(texts);        //create Markov thing from corpus data
            var sentenceData = generateGraphData(generator);                   //generate node / edge graph from data
            var graphData = formatMarkovData(sentenceData.cytoGraphData);
            initCyto(graphData);        //pass data to initCyto()
            $("#sentence").html("<p>" + sentenceData.sentence + "</p>");
            growTree();   
             //TODO: animate the tree / sentence
                //on callback when finished, wait some period of time
                //create oldTree div / destroy oldest oldTree div if performance bad
                //copy HTML to oldTree div (in same position as currentTree div, then animate it moving away?)
                    //callback for moving away, call generateTree with new corpus
        });
    });

}
//-------------------------------------------------------------------------------------------------
function createMarkovGenerator(texts) {
    var generator = new RiMarkov(3);            //create Markov generator
    generator.loadText(texts);
    return generator;
}
//-------------------------------------------------------------------------------------------------
function generateGraphData(generator) {
    var graphData = generator.generateSentencesWithCyto(1);
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
                   // edgeLabel = graphData.nodes[x].data.text;
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
  cy.trigger('tap');
}
//-------------------------------------------------------------------------------------------------
function initCyto(graphData) {

  //  graphData = {nodes: [{data: {id: "test1"}},{data: {id: "test2"}}], edges: [{data: {source: "test1", target: "test2"}}]}
    cy = cytoscape({
          container: document.getElementById('tree'),
          
          boxSelectionEnabled: false,
          autounselectify: true,
          
          style: cytoscape.stylesheet()
            .selector('node')
              .css({
                'height': 40,
                'width': 40,
                'background-fit': 'cover',
                'background-color': '#4b3203',
               // 'border-color': '#614103',
               // 'border-width': 3,
                'shape': 'roundrectangle',
                //'border-opacity': 0.5,
                'label': 'data(text)',
                //'text-rotation': '180deg',
                //'text-margin-y': '-20px'
              })
            .selector('.eating')
              .css({
                'border-color': 'red'
              })
            .selector('.eater')
              .css({
                'border-width': 9
              })
            .selector('edge')
              .css({
                'width': 15,
                //'target-arrow-shape': 'square',
                'line-color': '#614103',
                //'target-arrow-color': '#614103',
                'curve-style': 'bezier',
                'label': 'data(text)',
                'text-rotation' : 'autorotate'
              })
            .selector('node.root')
                .css({
                    'label': 'data(text)',
                    'text-rotation': '180deg',
                    'text-margin-y': '-20px'
                }),

          
          elements: graphData,
          
          layout: {
            name: 'breadthfirst',
            directed: true,
            padding: 10
          }
        }); // cy init

        cy.ready(function(){

            var nodes = cy.nodes(".root");
            var tapped = nodes;
            var food = [];
            
            nodes.addClass('eater');
            
            for(;;){
              var connectedEdges = nodes.connectedEdges(function(){
                return !this.target().anySame( nodes );
              });
              
              var connectedNodes = connectedEdges.targets();
              
              Array.prototype.push.apply( food, connectedNodes );
              
              nodes = connectedNodes;
              
              if( nodes.empty() ){ break; }
            }
                  
            var delay = 0;
            var duration = 100;
            for( var i = food.length - 1; i >= 0; i-- ){ (function(){
              var thisFood = food[i];
              var eater = thisFood.connectedEdges(function(){
                return this.target().same(thisFood);
              }).source();
                      
              if (typeof thisFood.moveHistory == "undefined") { thisFood.moveHistory = []; }
              thisFood.moveHistory.push(thisFood.position());
              thisFood.delay( delay, function(){
                eater.addClass('eating');
              } ).animate({
                position: eater.position(),
                css: {
                  'width': 1,
                  'height': 1,
                  'border-width': 0,
                  'opacity': 0
                }
              }, {
                duration: duration,
                complete: function(){
                  thisFood.remove();
                }
              });
              
              delay += duration;
            })(); } // for
            
            for( var i = food.length - 1; i >= 0; i-- ){ (function(){
              var thisFood = food[i];
              thisFood.restore();
              var vomiter = thisFood.connectedEdges(function(){
                return this.target().same(thisFood);
              }).target();
                      
              thisFood.delay( delay, function(){
                vomiter.addClass('eating');
              } ).animate({
                position: vomiter.moveHistory[0],
                css: {
                  'width': 40,
                  'height': 40,
                  'border-width': 0,
                  'opacity': 1
                }
              }, {
                duration: duration,
                complete: function(){
                  //thisFood.remove();
                }
              });
              
              delay += duration;
            })(); } // for





/*
            var rootId = cy.nodes()[0].id();
            var moveList = cy.nodes().filter(function(n) {
              return n !== 0 && cy.nodes()[n].moveHistory.length == 1;
            });
            */
            console.log("ay!");
              //now recursively animate
          }); // on tap
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