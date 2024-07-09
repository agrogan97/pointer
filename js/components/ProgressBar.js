class ProgressIndicator extends Primitive{
    /*
        In this version we forego the progress bar and just use numbers to indicate score and target.

        We denote current score and target score, and denote how each click transitions to an intermediary state
    */
    constructor(x, y, kwargs={}){
        super(x, y, kwargs);

        // Language setting
        this.lang = "en"

        this.startScore = 0;
        this.targetScore = 5;
        this.score = this.startScore;

        this.startLabel = new pText(this.lang == "en" ? "start" : "placar", 40, 5, {textSize: 42})
        this.scoreText = new pText(this.score, 40, 12.5, {textSize: 64})
        this.arrow = new pImage(40, 20, assets.imgs.arrow).setScale(0.2);
        this.newScoreText = new pText("", 40, 27.5, {textSize: 64})

        this.targetLabel = new pText(this.lang == "en" ? "goal" : "objetivo", 60, 5, {textSize: 42})
        this.targetText = new pText(this.targetScore, 60, 13, {textSize: 64})

        // Display settings
        this.showArrow = false;
    }

    setConfig(config){
        this.config = config;
        this.startScore = config.start;
        this.targetScore = config.target;
        this.score = this.startScore;
    }

    /**
     * Updates the stored score value and displays the new score arrow, then replaces the displayed score with the new score after
     * a given amount of time.
     * @param {number} newScore The new score value, typically constrained between -10 and 10 inclusive.
     * @param {number} animationLength The length of time to show the arrow before it disappears and updates score, in seconds.
     * @returns {undefined}
     */
    updateScore(newScore, animationLength=2){
        if (newScore == undefined){throw new Error(`No score was provided - did you provide an input for newScore?`)}
        // Add a new score marker under current score, with an arrow pointing to it
        // Wait a couple of seconds, then replace score text with the new score, and hide the changed score and the arrow
        this.showArrow = true;
        this.newScoreText.text = newScore;
        setTimeout(() => {
            this.showArrow = false;
            this.score = newScore;
            
            this.newScoreText.text = "";
        }, animationLength*1000)
    }

    reset(){
        this.score = this.startScore;
    }

    draw(){
        this.scoreText.text = this.score;
        this.targetText.text = this.targetScore;

        this.scoreText.draw();
        this.targetText.draw();
        this.startLabel.draw();
        this.targetLabel.draw();
        if (this.showArrow){this.arrow.draw()};
        this.newScoreText.draw();
    }
}

class ProgressBar extends Primitive {
    constructor(x, y, kwargs={}) {
        super(x, y, kwargs);

        this.bounds = [-10, 10];
        this.blockOffset = 90/(_.range(this.bounds[0], this.bounds[1]+1).length);

        // Build the bar out

        this.blocks = [];
        _.range(this.bounds[0], this.bounds[1]+1).forEach(i => {
            this.blocks.push(
                new Block(this.pos.x, this.pos.y + this.blockOffset*i, 15, this.blockOffset, i)
            );
        })

        // Transition arrow params
        this.showTransition = true;
        this.transitionArrow = {
            A : undefined,
            B : undefined
        }
        this.transitionArrowOpacity = 1;
        this.colour = "rgba(253, 165, 15, 1)";
        // this.strokeColour = "rgba(0, 0, 0, 1)";
        this.gameState = [0, 0];
        let circleWidth = this.blocks[0].dims.y*sizing.circleScale;

        // this.charImg = new pImage(this.pos.x, this.pos.y, assets.imgs.char).setScale(0.15);
        this.charImg = new pCircle(this.pos.x, this.pos.y, circleWidth, {backgroundColor: "orange"});
        this.showImg = false;
    }

    set(start, target){
        this.blocks.forEach(block => {block.update({backgroundColor: "white"})})
        // Set the start and target blocks on the grid
        let startBlock = this.blocks.filter(b => (b.id == start))[0];
        let targetBlock = this.blocks.filter(b => (b.id == target))[0];
        targetBlock.update({backgroundColor: 'orange'});
        // startBlock.label.update({textColor: "white"});
        this.charImg.pos.y = startBlock.pos.y;
    }

    setTransitionArrow(opacity){
        // show a transition arrow between blocks A and B
        // A and B below are references to the block objects
        let A = this.transitionArrow.A; // Start
        let B = this.transitionArrow.B; // Target
        const baseY = this.pos.y + A.dims.y/4;
        const triangleStartX = (B.pos.x - A.pos.x);
        const wo = A.dims.x;
        // const wo = 0;
        // this.colour = "orange"

        if (A.id > B.id){
            // Start is graphically *below* the target, so arrow points up
            pRectangle.draw_(A.pos.x + wo, _.mean([B.pos.y, A.pos.y]) + A.dims.y/3.6, this.blockOffset*0.5, (B.pos.y - A.pos.y) + A.dims.y/2, {stroke: this.colour, backgroundColor: this.colour});
            pTriangle.draw_(B.pos.x - B.dims.x/3 + wo, B.pos.y + B.dims.y/2, B.pos.x + B.dims.x/3 + wo, B.pos.y + B.dims.y/2, B.pos.x + wo, B.pos.y + B.dims.y, {backgroundColor: this.colour, stroke: this.colour});
        } else {
            // Arrow points down
            pRectangle.draw_(A.pos.x + wo, _.mean([B.pos.y, A.pos.y])-A.dims.y/3.6, this.blockOffset*0.5, (B.pos.y - A.pos.y) - A.dims.y/2, {stroke: this.colour, backgroundColor: this.colour});
            pTriangle.draw_(B.pos.x - B.dims.x/3 + wo, B.pos.y-B.dims.y/2, B.pos.x + B.dims.x/3 + wo, B.pos.y-B.dims.y/2, B.pos.x + wo, B.pos.y - B.dims.y, {backgroundColor: this.colour, stroke: this.colour});
        }
    }

    showTransitionArrow(start, target){
        if (start == target){return}
        this.colour = `rgba(253, 165, 15, ${this.transitionArrowOpacity})`;
        this.strokeColour = `rgba(0, 0, 0, ${this.transitionArrowOpacity})`;
        let startBlock = this.blocks.filter(pb => (pb.id == start))[0];
        let targetBlock = this.blocks.filter(pb => (pb.id == target))[0];
        this.transitionArrow = {A: startBlock, B: targetBlock};
        // console.log(this.transitionArrow)
        this.setTransitionArrow();
        this.showTransition = true;
        this.transitionArrowOpacity -= 0.005;
        if (this.transitionArrowOpacity <= 0){
            this.showTransition = false;
            this.transitionArrowOpacity = 1;
        }   
    }

    beginTransition(start, target){
        // NB: this isn't necessarily the correct target, but the score obtained by the user
        this.showTransition = false;
        this.transitionArrowOpacity = 1;
        this.gameState = [start, target];
        this.showTransition = true;
        // Move character to new block
        this.charImg.pos.y = this.blocks.filter(b => (b.id == target))[0].pos.y;
        this.showImg = true;
    }

    draw() {
        this.blocks.forEach(block => {block.draw()});
        this.charImg.draw();

        if (this.showTransition) {this.showTransitionArrow(this.gameState[0], this.gameState[1])};
        // this.setTransitionArrow()
    }
}

class Block extends pRectangle {

    /*
        This just extends the pRectangle base class so we can add some properties and extra methods easily if we need
    */

    constructor(x, y, w, h, id, kwargs={}){
        super(x, y, w, h, kwargs);
        this.id = id;
        this.dims = createVector(w, h);
        this.centre = createVector()

        this.label = new pText(id, this.pos.x - w*0.8, this.pos.y, {textSize: sizing.ts, stroke: 'black', strokeWeight: 0.25});
    }

    draw(){
        super.draw();
        this.label.draw();

        // pRectangle.draw_(this.pos.x, 10, this.blockOffset, 50);
    }
}