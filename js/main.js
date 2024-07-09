// -- PARAMS --
var assets = {"imgs" : {icons: {}}, "fonts" : {}}
var params = {verbose: false, positionMode: "PERCENTAGE", textAlign: "CENTER", imageMode: "CENTER", rectMode: "CENTER"};
// ------------
var content = {};
var myGame;
var sizing = {};

function handleClick(e){ 
    pClickListener(e) 
}

function preload(){

    // NB: If using jatos, double check your URLs

    assets.imgs.arrow = loadImage("static/imgs/arrow.png");
    assets.imgs.char = loadImage("static/imgs/character.png");

    // Load room imgs
    _.range(1, 13).forEach(n => {
        assets.imgs.icons[`room_${n}`] = loadImage(`static/imgs/icons/room${n}.png`);
    })

}

function setup(){
    var canvas = createCanvas(350, windowHeight);
    // canvas.offsetLeft = 250
    pixelDensity(1);
    frameRate(60)
    canvas.parent("gameCanvas")
    document.addEventListener("click", (e) => {handleClick(e)});
    myGame = new MyGame();

    if (window.innerWidth <= 500){
        console.log("mobile")
        sizing.headingSize = 22;
        sizing.ts = 16;
        sizing.imgScale = 0.3;
        sizing.circleScale = 0.75;
    } else {
        console.log("desktop")
        sizing.headingSize = 26;
        sizing.ts = 18;
        sizing.imgScale = 0.3;
        sizing.circleScale = 0.2;
    }

    content.prog = new ProgressIndicator(0, 0);
    content.graph = new Graph();

    content.pb = new ProgressBar(75, 50);

    myGame.newRound();
}

function draw(){
    clear();
    // background('grey')
    // content.prog.draw();
    content.graph.draw();
    pText.draw_(`Round ${myGame.roundIndex+1}/${myGame.curriculum.length}`, 30, 4.5, {textSize: sizing.headingSize});
    // pText.draw_(`Phase ${myGame.roundType == "training" ? 1 : (myGame.roundType == "test" ? 2 : 3)}/3`, 50, 8);
    content.pb.draw();
}

// --- Custom --- //


class MyGame extends Game{
    constructor(){
        super();

        // training depends on curriculum type used and is 2 repeats either concept-wise or strategy-wise
        // this.curriculumType = Utils.getJatosParams(["CT"]).CT || Utils.getUrlParams().CT || undefined;
        if (this.curriculumType == undefined){
            console.log(`Unable to find curriculum type. Using concept as default`)
            this.curriculumType = "strategy"
        }

        this.curr = {
            training: [],
            test: _.range(0, 8).map(m => ([4, 4])),
            transfer: _.range(0, 8).map(m => [4, 4])
        }

        _.range(1, 5).forEach(i => {
            _.range(1, 5).forEach(j => {
                this.curr.training.push(this.curriculumType == "concept" ? [j, i] : [i, j])
            }) 
        })
        this.curr.training = _.flatten(
            this.curr.training.map(i => ([i, i]))
        );

        this.curriculum = [...this.curr.training, ...this.curr.test, ...this.curr.transfer];
        this.roundType = "training";

        // this.curriculum = [
        //     // [1, 1], [1, 1], [1, 1], [1, 1],
        //     [2, 2]
        //     // [3, 3], [3, 3], [3, 3], [3, 3],
        //     // [4, 4], [4, 4], [4, 4], [4, 4],
        // ]

        // this.curriculum = [
        //     [4, 4], [4, 4], [4, 4], [4, 4], [4, 4], [4, 4]
        // ]

        this.curriculum = [[3, 3], [3, 3], [3, 3], [3, 3]]

        this.roundIndex = -1;
    }

    newRound(){
        // Increase round index
        this.roundIndex += 1;

        if (this.roundIndex != 0){
            // myGame.saveDataToJatos(content.graph.config);
        }
        if (this.roundIndex == this.curriculum.length){
            // end game
            this.endGame();
            return;
        }

        if (this.roundIndex > this.curr.test.length + this.curr.training.length - 1){
            this.roundType = "transfer";
        } else if (this.roundIndex > this.curr.training.length - 1){
            this.roundType = "test";
        } else {
            this.roundType = "training";
        }

        // Create new round config
        content.graph.setConfig(
            content.graph.roundCreation(
                this.curriculum[this.roundIndex][0], 
                this.curriculum[this.roundIndex][1]
            )
        )
        // Pass config to progress bar
        content.prog.setConfig(content.graph.config)
        // Build graph
        content.graph.buildGraph(this.roundType == "transfer");
        // Reset char
        content.pb.set(content.graph.config.start, content.graph.config.target);
        // Log start time
        content.graph.config.startTime = Date.now();
    }

    adaptScreen(){
        // Check screen dims and adapt text size and image scaling
        if (window.innerWidth <= 500){
            this.headingSize = 28;
            this.ts = 22;
        } else {
            this.headingSize = 28;
            this.ts = 22;
        }
    }

    endGame(){
        console.log("Call end game scenario");
        // Game.goToJatosComponent(undefined, {}, {mapping: content.graph.imgs});
    }
}
