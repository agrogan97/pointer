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