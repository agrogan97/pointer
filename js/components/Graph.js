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
        this.startImgPos = createVector(50, 20);
        this.startImg = new pImage(50, 20, assets.imgs.char).setScale(0.5);
        // Set end point image
        this.endImg = new pImage(50, 90, this.lang == "en" ? assets.imgs.goal_en : assets.imgs.goal_pt).setScale(0.2);
        let endBtnDims = Primitive.toPercentage(createVector(assets.imgs.char.width, assets.imgs.char.height));
        this.endBtn = new pButton(
            50, 90,
            // % sizing here will depend on browser vs. mobile, so we'll anchor it relative to image size
            endBtnDims.x, endBtnDims.y*0.5,
            {backgroundColor: 'orange'}
        ).addText(this.langMapping[this.lang].goalText, {textSize: 32});

        this.mapping = {
            A : (s) => {return s},
            B : (s) => {return s + 1},
            C : (s) => {return s * 2},
            D : (s) => {return s * -1},
            E : (start) => {return start}
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
        this.hideBtn = true;
        this.animationDelay = 2;
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
        let freeSpace = (this.endImg.pos.y - this.endImg.dims.y/2) - (this.startImg.pos.y + this.startImg.pos.y);
        // The number of available divisions depends on the strategy level
        let spacePerDivison = freeSpace / this.config.strategyLevel;
        this.nodes = [];
        
        _.range(0, this.config.strategyLevel).forEach(i => {
            let y = (this.startImg.pos.y + this.startImg.dims.y*1.5) + (spacePerDivison*1.1 * i);
            let tmpA = undefined;
            let tmpB = undefined;
            if (transfer){
                tmpA = new pImage(40, y, this.transferImgMapping[this.config.pathA.sequence[i]]).setScale(0.5);
                tmpB = new pImage(60, y, this.transferImgMapping[this.config.pathB.sequence[i]]).setScale(0.5);
            } else {
                tmpA = new pImage(40, y, this.imgMapping[this.config.pathA.sequence[i]]).setScale(0.5);
                tmpB = new pImage(60, y, this.imgMapping[this.config.pathB.sequence[i]]).setScale(0.5);
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
                console.log(`Concept: ${concept} -- Score: ${content.prog.score} -> ${score}`)
                content.prog.updateScore(score, this.animationDelay);
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
                // Move character img
                this.startImg.pos = createVector(node.pos.x+5, node.pos.y)
                this.startImg.setScale(0.25);
                // Lower alpha on lines
                // Make the next nodes in the path clickable
                this.player.onPath = node.path;
                // Decrease alpha on other path
                this.player.onPath == "A" ? this.linesB.forEach(l => {l.update({stroke:`rgba(0, 0, 0, ${this.reducedAlpha})`})}) : this.linesA.forEach(l => {l.update({stroke:`rgba(0, 0, 0, ${this.reducedAlpha})`})});
                // Decrease transparency of used path
                // this.player.onPath == "A" ? this.linesA[0].update({stroke: `rgba(0, 0, 0, ${this.reducedAlpha})`}) : this.linesB[0].update({stroke: `rgba(0, 0, 0, ${this.reducedAlpha})`});
                // Store the path chosen and a reference to the nodes
                this.player.pathRef = this.nodes.filter(n => (n.path == node.path));
                // Make the proceeding nodes on the path clickable, unless this is level 1
                if (this.config.strategyLevel == 1){
                    this.onRoundEnd(score)
                } else {
                    setTimeout(() => {
                        this.triggerClickable(this.player.depth + 1);
                    }, 3000)
                }
            }
        })
    }

    triggerClickable(index) {
        // For the node at the provided index
        let node = this.player.pathRef[index];
        node.toggleClickable();
        node.onClick = () => {
            // Compute new score
            let concept = this.config[`path${this.player.onPath}`].sequence[index];
            let score = this.computeScore(concept);
            console.log(`Concept: ${concept} -- Score: ${content.prog.score} -> ${score}`)
            content.prog.updateScore(score, this.animationDelay);
            // Update the player depth
            this.player.depth = index;
            // Make this node unclickable
            node.toggleClickable();
            // Move the character
            this.startImg.pos = createVector(node.pos.x+5, node.pos.y);
            // Make transparent
            node.update({tint: [255, 128]});
            // Make line transparent
            console.log(index)
            // this.player.onPath == "A" ? this.linesA[index-1].update({stroke: `rgba(0, 0, 0, ${this.reducedAlpha})`}) : this.linesB[index-1].update({stroke: `rgba(0, 0, 0, ${this.reducedAlpha})`});

            if (this.player.depth + 1 == this.config.strategyLevel){
                this.onRoundEnd(score);
            } else {
                // Make the next clickable 1.5s after being clicked
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
        console.log(score, this.config.target)
        this.hideBtn = false;

        // If they chose the right path, show the 'correct image', then after 1.5 seconds, let them click to go to the next round
        if (score == this.config.target){
            this.endBtn.text.text = this.langMapping[this.lang].correctText;
        } else {
            // Otherwise, show incorrect
            this.endBtn.text.text = this.langMapping[this.lang].incorrectText;
        }
        // Log final score, result, and endtime
        this.config.finalScore = score;
        this.config.isCorrect = (this.config.finalScore == this.config.target)
        this.config.endTime = Date.now();
        console.log(`-- Round End --`)
        console.log(this.config)
        // after 1.5 seconds let them click to go to the next round
        setTimeout(() => {
            this.endBtn.text.update({textSize: 24})
            this.endBtn.text.text = this.langMapping[this.lang].nextRoundText;
            this.endBtn.onClick = () => {myGame.newRound()}
        }, 2500)
    }

    computeScore(concept) {
        // Separate function to contain the logic for updating while factoring in the start score stuff
        if (concept == "E"){
            return this.config.start
        } else {
            return this.mapping[concept](content.prog.score);
        }
    }

    reset(){
        this.endBtn.onClick = () => {};
        this.endBtn.text.text = this.langMapping[this.lang].goalText;
        // Reset char position
        this.startImg.pos = this.startImgPos;
        this.startImg.setScale(0.5);
        this.hideBtn = true;
    }

    draw(){
        this.linesA.forEach(l => {l.draw()});
        this.linesB.forEach(l => {l.draw()});
        this.startImg.draw();
        if (!this.hideBtn){this.endBtn.draw();}
        this.nodes.forEach(node => {node.draw()});
        
    }
}