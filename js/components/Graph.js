class Graph extends Primitive {
    constructor(x, y, kwargs={}){
        super(x, y, kwargs);

        this.lang = "en";

        this.langMapping = {
            "en" : {
                goalText: "Goal",
                nextRoundText: "Click for next round",
                correctText: "Correct!",
                incorrectText: "Not quite right..."
            },
            "pt" : {
                goalText: "Objetivo",
                nextRoundText: "Clique para a\npróxima rodada",
                correctText: "Correto!",
                incorrectText: "Não muito certo..."
            }
        }

        // Set starting point image
        this.startImgPos = createVector(30, 25);
        this.startImg = new pImage(this.startImgPos.x, this.startImgPos.y, assets.imgs.char).setScale(sizing.imgScale);
        // Set end point image
        let endBtnDims = createVector(50, 7.5);
        this.endBtn = new pButton(
            30, 12.5,
            // % sizing here will depend on browser vs. mobile, so we'll anchor it relative to image size
            endBtnDims.x, endBtnDims.y,
            {backgroundColor: 'orange'}
        ).addText(this.langMapping[this.lang].goalText, {textSize: sizing.ts});

        this.mapping = {
            A : (s) => {return s},
            B : (s) => {return s + 1},
            C : (s) => {return s * 2},
            D : (s) => {return s * -1},
            E : (start) => {return 0}
        }

        // this.imgs = _.sampleSize(assets.imgs.icons, 5);
        this.imgs = _.sampleSize(Object.keys(assets.imgs.icons), 5)
        this.imgMapping = {
            A : assets.imgs.icons[this.imgs[0]],
            B : assets.imgs.icons[this.imgs[1]],
            C : assets.imgs.icons[this.imgs[2]],
            D : assets.imgs.icons[this.imgs[3]],
            E : assets.imgs.icons[this.imgs[4]]
        }

        this.transferImgs = _.sampleSize(Object.keys(assets.imgs.icons).filter(i => (!this.imgs.includes(i))), 5)
        this.transferImgMapping = {
            A : assets.imgs.icons[this.transferImgs[0]],
            B : assets.imgs.icons[this.transferImgs[1]],
            C : assets.imgs.icons[this.transferImgs[2]],
            D : assets.imgs.icons[this.transferImgs[3]],
            E : assets.imgs.icons[this.transferImgs[4]]
        }

        this.nodes = [];

        // Track current position
        this.player = {};

        // Aesthetics params
        this.reducedAlpha = 0.2;
        this.animationDelay = 2.5;
    }

    generateRound(conceptLevel, strategyLevel){
        // Generate a round procedurally
        // Given the current startegy and concept levels, create a graph
        // Concept level dictates how many concepts can be in the sample set
        // Strategy level dictates the depth of the tree

        // Create set of concepts to sample from per concept level
        const conceptSet = Object.keys(this.mapping).slice(0, conceptLevel+1);
        // Create 2 paths, where each is a sequence of concepts
        let pathA = _.range(0, strategyLevel).map(n => (_.sample(conceptSet)));
        let pathB = _.range(0, strategyLevel).map(n => (_.sample(conceptSet)));

        const computePathScore = (start, path) => {
            let startScore = start;
            let score = start;

            path.forEach(c => {
                if (c == "E"){
                    score = this.mapping[c](startScore)
                } else {
                    score = this.mapping[c](score)
                }
            })

            return score;
        }

        let config = {
            start: _.sample(_.range(-10, 11)),
            conceptLevel: conceptLevel,
            strategyLevel: strategyLevel,
            pathA : {
                sequence: _.range(0, strategyLevel).map(n => (_.sample(conceptSet))),
                end: undefined
            },
            pathB : {
                sequence: _.range(0, strategyLevel).map(n => (_.sample(conceptSet))),
                end: undefined
            }
        }

        // Compute ends
        config.pathA.end = computePathScore(config.start, config.pathA.sequence);
        config.pathB.end = computePathScore(config.start, config.pathB.sequence);

        // Pick one of the paths to be the target path
        let targetPath = _.sample(["pathA", "pathB"])
        let otherPath = (targetPath == "pathA" ? "pathB" : "pathA");
        config.target = (config[targetPath].end == config.start ? config[otherPath].end : config[targetPath].end);
        config.targetPath = targetPath;
        // Add space for current score
        config.score = config.start;

        return config
    }

    testRound(config){
        // Check the contents of a round config to see if it's an allowed setup
        if (_.isEqual(config.pathA.sequence, config.pathB.sequence)){
            return false;
        }
        
        if (config.pathA.end < -10 || config.pathA.end > 10){
            return false;
        }

        if (config.pathB.end < -10 || config.pathB.end > 10){
            return false;
        }

        if (config.pathA.end == config.pathB.end){
            return false;
        }

        // Enforce the constraint that the conceptLevel-th concept must appear somewhere in the path
        if (this.mode == "test" || this.mode == "transfer"){
            if (![...config.pathA.sequence, ...config.pathB.sequence].includes(Object.keys(this.mapping)[config.conceptLevel]) ||
                ![...config.pathA.sequence, ...config.pathB.sequence].includes(Object.keys(this.mapping)[config.conceptLevel-1]) ||
                ![...config.pathA.sequence, ...config.pathB.sequence].includes(Object.keys(this.mapping)[config.conceptLevel-2])
            ){
                return false
            }
        } else {
            if (![...config.pathA.sequence, ...config.pathB.sequence].includes(Object.keys(this.mapping)[config.conceptLevel])){
                return false
            }
        }

        

        return true;
    }

    roundCreation(conceptLevel, strategyLevel, mode="training"){
        // Loop through generateRound and testRound until we get an allowed round config

        let conf;
        let res = false;
        let counter = 0;

        while (!res){
            conf = this.generateRound(conceptLevel, strategyLevel);
            res = this.testRound(conf, mode)
            if (counter > 25){
                break
            }
            counter += 1;
        }

        if (counter > 25){
            throw new Error(`Error generating a round - concept level: ${conceptLevel} strategy level: ${strategyLevel}`);
        } else {
            return conf
        }
    }

    setConfig(config){
        this.config = config;
    }

    buildGraph(transfer=false){
        this.reset();
        this.nodes = [];
        this.linesA = [];
        this.linesB = [];
        
        // Work out how much vertical screen space we have available
        // let freeSpace = (this.endBtn.pos.y - this.endBtn.dims.y/2) - (this.startImg.pos.y + this.startImg.pos.y);
        let freeSpace = 60
        // The number of available divisions depends on the strategy level
        // let spacePerDivison = freeSpace / this.config.strategyLevel;
        let spacePerDivison = 15;
        this.nodes = [];
        
        _.range(0, this.config.strategyLevel).forEach(i => {
            let y = (this.startImg.pos.y + this.startImg.dims.y*1.5) + (spacePerDivison*1.1 * i);
            let tmpA = undefined;
            let tmpB = undefined;
            if (transfer){
                tmpA = new pImage(15, y, this.transferImgMapping[this.config.pathA.sequence[i]]).setScale(sizing.imgScale);
                tmpB = new pImage(45, y, this.transferImgMapping[this.config.pathB.sequence[i]]).setScale(sizing.imgScale);
            } else {
                tmpA = new pImage(15, y, this.imgMapping[this.config.pathA.sequence[i]]).setScale(sizing.imgScale);
                tmpB = new pImage(45, y, this.imgMapping[this.config.pathB.sequence[i]]).setScale(sizing.imgScale);
            }
            // Log which depth level these are on, so we can make the successive depths clickable dynamically and not all at once
            tmpA.depth = i; // this is the depth in the tree
            tmpA.path = "A"; // this is which path it's on
            tmpB.depth = i;
            tmpB.path = "B";
            this.nodes.push(tmpA);
            this.nodes.push(tmpB)
        })

        // Draw lines between the paths
        this.linesA.push(
            new pLine(this.startImgPos.x, this.startImgPos.y, this.nodes[0].pos.x, this.nodes[0].pos.y, {strokeWeight: 5}),
            new pLine(this.nodes[0].pos.x, this.nodes[0].pos.y, this.nodes[this.nodes.length-2].pos.x, this.nodes[this.nodes.length-2].pos.y, {strokeWeight: 5}),
        )

        this.linesB.push(
            new pLine(this.startImgPos.x, this.startImgPos.y, this.nodes[1].pos.x, this.nodes[1].pos.y, {strokeWeight: 5}),
            new pLine(this.nodes[1].pos.x, this.nodes[1].pos.y, this.nodes[this.nodes.length-1].pos.x, this.nodes[this.nodes.length-1].pos.y, {strokeWeight: 5}),
        )

        // Change end button text
        
        // Register nodes as clickables and assign click functions
        let b0 = this.nodes.filter(node => (node.depth == 0));
        b0.forEach(node => {
            node.toggleClickable();
            node.onClick = () => {
                // Compute new score
                let concept = this.config[`path${node.path}`].sequence[node.depth];
                let score = this.computeScore(concept)
                // console.log(`Concept: ${concept} -- Score: ${content.prog.score} -> ${score}`)
                // content.prog.updateScore(score, this.animationDelay);
                console.log(this.config.score, score, concept)
                content.pb.beginTransition(this.config.score, score);
                // Update the score
                this.config.score = score;
                // Get the path that wasn't clicked on
                let otherPath = (node.path == "A" ? "B" : "A");
                // Make the other unclickable
                this.nodes.filter(n => (n.path == otherPath && n.depth == 0))[0].toggleClickable();
                // And reduce to 50% transparency
                this.nodes.filter(n => (n.path == otherPath)).forEach(n => {n.update({tint: [255, 255*this.reducedAlpha]})})
                this.player.depth = 0;
                // Make the current node unclickable
                node.toggleClickable();
                // and lower its alpha
                node.update({tint: [255, 128]})
                this.player.onPath = node.path;
                // Decrease alpha on other path
                this.player.onPath == "A" ? this.linesB.forEach(l => {l.update({stroke:`rgba(0, 0, 0, ${this.reducedAlpha})`})}) : this.linesA.forEach(l => {l.update({stroke:`rgba(0, 0, 0, ${this.reducedAlpha})`})});
                // Store the path chosen and a reference to the nodes
                this.player.pathRef = this.nodes.filter(n => (n.path == node.path));
                // Make the proceeding nodes on the path clickable, unless this is level 1
                if (this.config.strategyLevel == 1){
                    setTimeout(() => {
                        this.onRoundEnd(score);
                    }, 1000)
                    
                } else {
                    setTimeout(() => {
                        this.triggerClickable(this.player.depth + 1);
                    }, this.animationDelay*1000)
                }
            }
        })
    }

    triggerClickable(index) {
        // For the node at the provided index
        let node = this.player.pathRef[index];
        // content.pb.showTransition = false;
        // content.pb.trans
        node.toggleClickable();
        node.onClick = () => {
            // Compute new score
            let concept = this.config[`path${this.player.onPath}`].sequence[index];
            let score = this.computeScore(concept);
            console.log(this.config.score, score, concept)
            content.pb.beginTransition(this.config.score, score);
            this.config.score = score;
            // Update the player depth
            this.player.depth = index;
            // Make this node unclickable
            node.toggleClickable();
            // Make transparent
            node.update({tint: [255, 128]});
            // Make line transparent

            if (this.player.depth + 1 == this.config.strategyLevel){
                setTimeout(() => {
                    this.onRoundEnd(score);
                }, 1000)
                
            } else {
                // Make the next icon clickable
                setTimeout(() => {
                    try {
                        this.triggerClickable(this.player.depth + 1);
                    } catch (error) {
                        console.log("End of chain");
                    }
                }, this.animationDelay*1.25*1000)
            }
        }
    }

    onRoundEnd(score){
        // handle logic for the end of the round
        this.hideBtn = false;

        // If they chose the right path, show the 'correct image', then after 1.5 seconds, let them click to go to the next round
        if (score == this.config.target){
            this.endBtn.text.text = this.langMapping[this.lang].correctText;
            this.endBtn.rect.update({backgroundColor: "green"});
        } else {
            // Otherwise, show incorrect
            this.endBtn.text.text = this.langMapping[this.lang].incorrectText;
            this.endBtn.rect.update({backgroundColor: "red"});
        }
        // Log final score, result, and endtime
        this.config.finalScore = score;
        this.config.isCorrect = (this.config.finalScore == this.config.target)
        this.config.endTime = Date.now();
        setTimeout(() => { 
            // This timeout makes the end of round button clickable 
            this.endBtn.text.update({textSize: sizing.ts})
            this.endBtn.text.text = this.langMapping[this.lang].nextRoundText;
            this.endBtn.rect.update({backgroundColor: "orange"})
            this.endBtn.onClick = () => {myGame.newRound()}
        }, 2000)
    }

    computeScore(concept) {
        // Separate function to contain the logic for updating while factoring in the start score stuff
        if (concept == "E"){
            return 0
        } else {
            return this.mapping[concept](this.config.score);
        }
    }

    reset(){
        this.endBtn.onClick = () => {};
        this.endBtn.text.text = this.langMapping[this.lang].goalText;
        // Reset char position
        this.startImg.pos = this.startImgPos;
        this.hideBtn = false;
    }

    draw(){
        this.linesA.forEach(l => {l.draw()});
        this.linesB.forEach(l => {l.draw()});
        this.startImg.draw();
        if (!this.hideBtn){this.endBtn.draw();}
        this.nodes.forEach(node => {node.draw()});
        
    }
}