// Check prerequisites
if (_ == undefined){throw new Error("Psychex requires lodash to be loaded.")}
if (p5 == undefined){throw new Error("Psychex requires p5.js to be loaded.")}

// -- REQUIRED PARAMS -- DO NOT EDIT --
p5.disableFriendlyErrors = true;
var clickables = [];
var canvas;
var roundData;
var isFullScreen = false;
var begin;
var blockLoop = false;
var psychex = {};

psychex.aesthetics = {
    show : () => {
        console.log(`Aesthetics are set for:`);
        Object.keys(psychex.aesthetics).filter(i => !["show", "_edit", "_show"].includes(i)).forEach(i => {
            console.log(`- ${i}`)}
        );
        console.log(`For more details, run psychex.aesthetics.[element].show(), replacing [element] with the primitive type (eg. pText)`)
    },
    pText : {
        textColor: 'black',
        textSize: 20,
        textStyle: "NORMAL",
        strokeWeight: 0.5,
        fontFamily: "sans-serif",
        textAlign: "CENTER",
        angleMode: "DEGREES",
        positionMode: "PERCENTAGE",
        stroke: "black",
        edit : (aes) => {psychex.aesthetics._edit(aes, "pText")},
        show: () => {psychex.aesthetics._show("pText")},
    },
    pRectangle : {
        backgroundColor: 'white',
        borderColor: 'black',
        borderWidth: 2,
        rectMode: "CENTER",
        positionMode: "PERCENTAGE",
        stroke: "black",
        strokeWeight: 1,
        edit : (aes) => {psychex.aesthetics._edit(aes, "pRectangle")},
        show: () => {psychex.aesthetics._show("pRectangle")},
    },
    pCircle: {
        backgroundColor: 'white',
        borderColor: 'black',
        borderWidth: 2,
        angleMode: "DEGREES",
        positionMode: "PERCENTAGE",
        stroke: "black",
        strokeWeight: 1,
        edit : (aes) => {psychex.aesthetics._edit(aes, "pCircle")},
        show: () => {psychex.aesthetics._show("pCircle")},
    },
    pTriangle: {
        backgroundColor: 'white',
        borderColor: 'black',
        borderWidth: 2,
        positionMode: "PERCENTAGE",
        stroke: "black",
        strokeWeight: 1,
        edit : (aes) => {psychex.aesthetics._edit(aes, "pTriangle")},
        show: () => {psychex.aesthetics._show("pTriangle")},
    },
    pImage: {
        imageMode: "CENTER",
        angleMode: "DEGREES",
        positionMode: "PERCENTAGE",
        stroke: "black",
        tint: [255, 255],
        edit : (aes) => {psychex.aesthetics._edit(aes, "pImage")},
        show: () => {psychex.aesthetics._show("pImage")},
    },
    pLine: {
        positionMode: "PERCENTAGE",
        stroke: "black",
        strokeWeight: 1,

    },
    _edit : (aes, obj) => {
        if (typeof(aes) != "object"){throw new Error(`To edit the global psychex.aesthetics, enter an object mapping property to value, e.g.: {backgroundColor: 'blue'}`)}
        // Sanitise inputs, especially re: textStyle and the p5 constants
        Object.keys(aes).forEach(a => {
            // Check if the values of the aesthetics provided match those available in aesthetics.pText, discluding the edit and show funcs
            if (Object.keys(psychex.aesthetics[obj]).filter(i => !i.includes(["edit", "show"]))){
                try {
                    // Update the value
                    psychex.aesthetics[obj][a] = aes[a];
                } catch (error) {
                    console.log(`Provided param ${a} not a default property of ${obj}. To edit this, add it to the object kwargs, or add it manually.`)
                }
            }
        })
    },
    _show: (obj) => {
        console.log(`-- ${obj} default aesthetics --`)
        Object.keys(psychex.aesthetics[obj]).filter(i => !i.includes(["edit", "show"])).forEach(aes => {
            console.log(`- ${aes} : ${psychex.aesthetics[obj][aes]}`)
        })
    }
}

// Keypress events module that stores callbacks for different click events and allows you to register new ones and update existing ones
psychex.keyPressEvents = {
    events: [],
    register: (k, callback) => {
        // Check if an event is written to this key already
        let existingEvents = psychex.keyPressEvents.events.filter(i => (i.k == k));
        if (existingEvents.length == 0){
            // Write new event
            psychex.keyPressEvents.events.push({k: k, callback: callback});
        } else {
            existingEvents[0].callback = callback;
        }
    },
    clear: () => {psychex.keyPressEvents.events = []},
}

// TODO: Currently we need to manually attach a click event listener to the window - this should be done automatically by Psychex surely?

function pClickListener(e) {
    // TODO circle click listener
    // Check what global positioning system is being used
    const convertTo = (params.positionMode == "PERCENTAGE" ? "PIXELS" : "IGNORE");
    // If positionMode == "PERCENTAGE", we want to convert mouse click coords from pixels (the default) to percentage
    // If positionMode == "PIXELS", we want it to stay as pixels, so we can use the "IGNORE" setting in _convertCoordinates to do nothing essentially
    const C = Primitive._convertCoordinates(createVector(mouseX, mouseY), convertTo);
    clickables.forEach(obj => {
        if (obj.type == "pImage"){
            if (obj.constants.imageMode == "CENTER") {
                // -- Image / Center -- //
                if (_.inRange(C.x, (obj.pos.x-obj.dims.x/2), (obj.pos.x+obj.dims.x/2))){
                    if (_.inRange(C.y, (obj.pos.y-obj.dims.y/2), (obj.pos.y+obj.dims.y/2))){
                        obj.onClick(obj);
                    }
                }
            } else if (obj.constants.imageMode == "CORNER"){
                // -- Image / Corner -- //
                if (_.inRange(C.x, obj.pos.x, obj.pos.x+obj.dims.x)){
                    if (_.inRange(C.y, obj.pos.y, obj.pos.y+obj.dims.y)){
                        obj.onClick(obj);
                    }
                }
            }
        } else if (obj.type == "pRectangle" || obj.type == "pButton") { 
            if (obj.constants.rectMode == "CENTER" || obj.constants.rectMode == "center"){
                // -- Rect / Center -- //
                if (_.inRange(C.x, obj.pos.x-obj.dims.x/2, obj.pos.x+obj.dims.x/2)){
                    if (_.inRange(C.y, obj.pos.y-obj.dims.y/2, obj.pos.y+obj.dims.y/2)){
                        obj.onClick(obj);
                    }
                }
            } else if (obj.constants.rectMode == "CORNER" || obj.constants.rectMode == "corner") {
                // -- Rect / Corner -- //
                if (_.inRange(C.x, obj.pos.x, obj.pos.x+obj.dims.x)){
                    if (_.inRange(C.y, obj.pos.y, obj.pos.y+obj.dims.y)){
                        obj.onClick(obj);
                    }
                }
            } 
        } else if (obj.type == "pCircle") { 
            let CPix = obj.constants.positionMode == "PERCENTAGE" ? Primitive.toPixels(C) : C; 
            let posPix = obj.constants.positionMode == "PERCENTAGE" ? Primitive.toPixels(obj.pos) : obj.pos; 
            let radiusPix = (obj.constants.positionMode == "PERCENTAGE" ? obj.radius*(innerWidth/100) : obj.radius)

            const isInCircle = (x, y, cx, cy, r) => {
                let dx = x - cx;
                let dy = y - cy;
                return dx*dx + dy*dy <= r*r
            }

            let inCircle = isInCircle(posPix.x, posPix.y, CPix.x, CPix.y, radiusPix)
            if (inCircle){
                obj.onClick(obj)
            }
        } else if (obj.type == "pTriangle"){
            // Find the lowest and highest x values
            // This could be implemented by taking click position and finding the closest triangle point, then
            // checking if angle between point and click is outside of the angle between the point and the other 2 points
            // but the amount of computation to do here might be really heavy, so needs testing
            throw new Error("FYI, triangle clicking isn't currently supported.")
        
        } else if (obj.type = "pText") {
            // Width uses p5.textWidth(), height taken from textSize (which is height of text in pixels by definition)
            let CPix = obj.constants.positionMode == "PERCENTAGE" ? Primitive.toPixels(C) : C;
            let posPix = obj.constants.positionMode == "PERCENTAGE" ? Primitive.toPixels(obj.pos) : obj.pos; 
            if (_.inRange(CPix.x, posPix.x-textWidth(obj.text)/2, posPix.x+textWidth(obj.text/2))){
                let fsize;
                try {
                    // Try and read textSize from aesthetics list
                    fsize = content.clicks.txt.aesthetics.filter(i => i._func.name == "textSize")[0]._val;
                } catch (error) {
                    // If not found use a default val of 30
                    fsize = 30;
                }
                if (_.inRange(CPix.y, posPix.y-fsize/2, posPix.y+fsize/2)){
                    obj.onClick(obj);
                }
            }

        
        } else {
            if (_.inRange(C.x, obj.pos.x*0.9, obj.pos.x*1.1)){
                if (_.inRange(C.y, obj.pos.y*0.9, obj.pos.y*1.1)){
                    console.log("other")
                    obj.onClick(obj);
                }
            }
        }
    })
}

function pKeyboardInput(){
    // Add rules for a keyboard input
}

function keyPressed(e){
    // p5.js keyPressed function
    // Iterate over contents of psychex.keyPressEvents and see if one matches the key pressed
    // Run callback if registered
    psychex.keyPressEvents.events.filter(i => (i.k == key)).forEach(i => {i.callback(e)});
}

class Psychex{
    // Check for local parameter `params`
    // if no local version check for global variable `params`
    constructor(params){
        // Set defaults and override with params
        this.constants = {
            positionMode : "PERCENTAGE", // PIXELS or PERCENTAGE
            imageMode: CENTER,
            rectMode: CENTER,
            textAlign: CENTER,
            angleMode: DEGREES,
            verbose: false
        }
        // Define the allowed kwargs we expect to receive
        this.allowedKwargs = ["positionMode", "imageMode", "rectMode", "textAlign", "angleMode", "verbose"];
        // When an object is instantiated, we will pass in the default from psychex.aesthetics, plus any additionals from the constructor
        // If a specific kwarg is provided, it will overwrite the default due to the nature of the spread operator
        // Eg. {...{name: 'alex', age: 27}, ...{name: 'gregor', age: 30} } = {name: 'gregor', age: 30}
        // The filtering of this will happen in this._handleKwargs, except positionMode, which we'll set now

        // Local copy of either class or global parameters
        let paramsLocalInst = {};
        // Check if passed params object to instantiation
        if (params != undefined){
            paramsLocalInst = params;
        // If not, check for global params
        } else if (window.params != undefined){
            paramsLocalInst = window.params;
        }
        // Set position mode now
        if (Object.keys(paramsLocalInst).includes("positionMode")){
            this.setPositionMode(paramsLocalInst.positionMode);
        }
    }

    updateConstants(){
        Object.keys(this.constants).forEach(k => {
            if (k == "positionMode") {this.setPositionMode(this.constants[k])}
            else if (k == "imageMode") {this.setImageMode(this.constants[k])}
            else if (k == "rectMode") {this.setRectMode(this.constants[k])}
            else if (k == "angleMode") {this.setAngleMode(this.constants[k])}
            else if (k == "textAlign") {this.setTextAlign(this.constants[k])}
        })
    }

    applyKwargs(type, val){
        // type is the name of the kwarg, eg. imageMode etc.
        // val is the actual value to set it to, eg. CENTER etc.
        if (type == "positionMode") {this.setPositionMode(val)}
        else if (type == "imageMode") {this.setImageMode(val)}
        else if (type == "rectMode") {this.setRectMode(val)}
        else if (type == "angleMode") {this.setAngleMode(val)}
        else if (type == "textAlign") {this.setTextAlign(val)}
    }

    getConstants(){
        return this.constants;
    }

    getPositionMode() {
        return getConstants().positionMode;
    }

    setPositionMode(newPositionMode){
        if (!["PIXELS", "PERCENTAGE"].includes(newPositionMode)){throw new Error(`Position mode value: ${newPositionMode} not recognised. Must be one of PIXELS or PERCENTAGE.`)}
        else {this.constants.positionMode = newPositionMode}
        if (this.constants.verbose) console.log("positionMode:", this.constants.positionMode)
    }

    setImageMode(newImageMode){
        if (![CENTER, CORNER, CORNERS, "CENTER", "CORNER", "CORNERS"].includes(newImageMode)){throw new Error(`Image mode value: ${newImageMode} not recognised. Must be one of CENTER, CORNER, or CORNERS.`)};
        this.constants.imageMode = newImageMode;
        if (this.constants.imageMode == CENTER || this.constants.imageMode == "CENTER"){imageMode(CENTER); this.constants.imageMode = "CENTER";}
        else if (this.constants.imageMode == CORNER || this.constants.imageMode == "CORNER"){imageMode(CORNER); this.constants.imageMode = "CORNER";}
        else if (this.constants.imageMode == CORNERS || this.constants.imageMode == "CORNERS"){imageMode(CORNERS); this.constants.imageMode = "CORNERS";}

        if (this.constants.verbose) console.log("imageMode:", this.constants.imageMode)
    }

    setRectMode(newRectMode){
        if (![CENTER, CORNER, CORNERS, RADIUS, "CENTER", "CORNER", "CORNERS", "RADIUS"].includes(newRectMode)){throw new Error(`Rect mode value: ${newRectMode} not recognised. Must be one of CENTER, CORNER, CORNERS, or RADIUS.`)};
        this.constants.rectMode = newRectMode;
        if (this.constants.rectMode == CENTER || this.constants.rectMode == "CENTER"){rectMode(CENTER); this.constants.rectMode = "CENTER";}
        else if (this.constants.rectMode == CORNER || this.constants.rectMode == "CORNER"){rectMode(CORNER); this.constants.rectMode = "CORNER";}
        else if (this.constants.rectMode == CORNERS || this.constants.rectMode == "CORNERS"){rectMode(CORNERS); this.constants.rectMode = "CORNERS";}
        else if (this.constants.rectMode == RADIUS || this.constants.rectMode == "RADIUS"){rectMode(RADIUS); this.constants.rectMode = "RADIUS";}

        if (this.constants.verbose) console.log("rectMode:", this.constants.rectMode)
    }
    
    setTextAlign(newHorizAlign){
        // Check inputs on vertical text alignment
        if (![LEFT, CENTER, RIGHT, "LEFT", "CENTER", "RIGHT"].includes(newHorizAlign)){throw new Error(`Vertical text align: ${newHorizAlign} not recognised. Must be one of LEFT, CENTER, RIGHT.`)};
        this.constants.textAlign = newHorizAlign;
        if (this.constants.textAlign == LEFT || this.constants.textAlign == "LEFT"){textAlign(LEFT, CENTER)}
        else if (this.constants.textAlign == CENTER || this.constants.textAlign == "CENTER"){textAlign(CENTER, CENTER)}
        else if (this.constants.textAlign == RIGHT || this.constants.textAlign == "RIGHT"){textAlign(RIGHT, CENTER)}

        if (this.constants.verbose) console.log("textAlign:", this.constants.textAlign)
    }

    setAngleMode(newAngleMode){
        if (![DEGREES, RADIANS, "DEGREES", "RADIANS"].includes(newAngleMode)){throw new Error(`Angle mode: ${newAngleMode} not recognised. Must be one of DEGREES or RADIANS.`)};
        this.constants.angleMode = newAngleMode;
        if (this.constants.angleMode == DEGREES || this.constants.angleMode == "DEGREES"){angleMode(DEGREES)}
        else if (this.constants.angleMode == RADIANS || this.constants.angleMode == "RADIANS"){angleMode(RADIANS)}
    
        if (this.constants.verbose) console.log("angleMode:", this.constants.angleMode)
    }

    getImageMode(){
        return this.getConstants().imageMode;
    }

    getRectMode(){
        return this.getConstants().rectMode;
    }

    getTextAlign(){
        return this.getConstants().textAlign;
    }

    getAngleMode(){
        return this.getConstants().angleMode;
    }
}

class Primitive extends Psychex{
    // Primitive class with common methods. 
    // Can be extended by more complex and specific geometry and renderable classes: text, images, etc.
    // Handles:
    //      - % vs pixel-based positioning
    //      - Make rendered item clickable
    constructor(x, y, kwargs={}){
        // Call super class constructor to give access to shared constants
        super();
        // Handle kwarg overwrites
        this.kwargs = kwargs;
        this.aesthetics = [];
        this._handleKwargs()
        // Store initial raw position from user as p5 vector
        // Accessible by this.initPos.x, this.initPos.y for x and y respectively
        if (x == undefined || y == undefined) {
            if (this.constants.positionMode == "PERCENTAGE") {
                x = 50;
                y = 50;
            } else {
                x = canvas.width/2;
                y = canvas.height/2;
            }
        }
        this.pos = createVector(x, y);

        this.isClickable = false;
        this.scaleBy = 1;
        this.rotateBy = 0;

        // Control settings
        // fill, stroke, linewidth
    }

    static toPixels(pos){
        // Check if vector or array - either allowed, but convert to vector internally
        pos = (pos.isPInst? pos : createVector(pos[0], pos[1]));
        return createVector(
            pos.x*(canvas.width/100),
            pos.y*(canvas.height/100)
        )
    }

    static toPercentage(pos){
        // Check if vector or array - either allowed, but convert to vector internally
        pos = (pos.isPInst? pos : createVector(pos[0], pos[1]));
        return createVector(
            100*pos.x/canvas.width,
            100*pos.y/canvas.height,
        )
    }

    _handleKwargs(kwargs){
        // TODO: Would likely benefit from some input sanitisation
        // Handle kwarg inputs and feed them into the relevant methods
        // If an obj is provided then use those inputs - otherwise use this.kwargs
        if (kwargs == undefined){return}
        else if (kwargs.length == 0){return};

        this.kwargs = [];

        this.aestheticsMapping = {
            // pText
            textColor: (c) => {fill(c)},
            textSize: (c) => {textSize(c)},
            textStyle: (c) => {textStyle(c)},
            strokeWeight: (c) => {strokeWeight(c)},
            fontFamily: (c) => {textFont(c)},
            lineSpacing: (c) => {this.lineSpacing = c}, // NB: line spacing is change in font size, not %

            // shared
            backgroundColor: (c) => {fill(c)},
            borderColor: (c) => {stroke(c)},
            color: (c) => {stroke(c); fill(c)},
            borderWidth: (c) => {strokeWeight(c)},
            scale : (c) => {scale(c)},

            // image
            tint: (c) => {tint(c)},

            // Lines and geometry
            stroke: (c) => {stroke(c)},
        }

        // _kwargs contains both aesthetics and kwargs
        Object.keys(kwargs).forEach(kwarg => {
            // Write a kwarg (e.g. rectMode)
            if (this.allowedKwargs.includes(kwarg)){
                this.kwargs.push({
                    type: kwarg,
                    val: kwargs[kwarg],
                })
                // Also store a copy in this dict
                this.constants[kwarg] = kwargs[kwarg];
            // Check if kwargs contains a value from this.aestheticsMapping
            } else if (Object.keys(this.aestheticsMapping).includes(kwarg)){
                // Store the function and the supplied values, so they're not rendered prematurely
                // If existing, overwrite
                if (this.aesthetics.map(i => i._func.name).includes(kwarg)){
                    // existing instance of this aesthetic in this.aesthetics -> remove it
                    this.aesthetics = this.aesthetics.filter(i => i._func.name != kwarg)
                }
                // write aesthetic to list
                this.aesthetics.push(
                    {
                        _func: this.aestheticsMapping[kwarg],
                        _val: kwargs[kwarg]
                    }
                )
            }
        })
    }

    updateAesthetics(aes){
        // input aes is a dict of aesthetics instruction
        if (typeof(aes) != "object"){throw new Error(`aesthetics must be an object, not: ${typeof(aes)}.`)}
        // Update the values stored in this.aesthetics upon user request
        Object.keys(aes).forEach(kwarg => {
            // Check if the names aesthetic is in the accepted list
            if (!Object.keys(this.aestheticsMapping).includes(kwarg)){return}
            // Define new aesthetics object
            let newAesObj = {
                _func: this.aestheticsMapping[kwarg],
                _val: aes[kwarg]
            }
            // Check if updating or creating new value to prevent duplicates
            if (this.aesthetics.map(i => i._func.name).includes(kwarg)){
                // If we already have an aesthetic of this type, remove the previous
                this.aesthetics = this.aesthetics.filter(i => i._func.name != kwarg) 
            } 
            // And add the new aesthetic to the list    
            this.aesthetics.push(newAesObj);
            
        })
    }

    setScale(s){
        this.scaleBy = s;
        return this;
    }

    setRotate(r){
        this.rotateBy = r;
        return this;
    }

    toggleClickable(){
        // Adds/removes if this object is in the list of clickables to check on global click
        // Store in global reference to all renderables
        if (clickables != undefined){
            if (clickables.includes(this)){
                clickables = clickables.filter(c => c != this);
                this.isClickable = false;
            } else {
                clickables.push(this)
                this.isClickable = true;
            }
        } else {
            throw new Error("Could not find instantiation of global 'clickables'. This must exist to store references to screen objects.")
        }

        return this;
    }

    getCenter(){
        // return the center of the primitive - basically only useful if set to CORNER mode
        if (this.type == "pImage" || this.type == "pRectangle"){
            // They're both 4 sided shapes, so same method either way
            if (this.constants.rectMode == "CORNER" || this.constants.imageMode == "CORNER"){
                this.centerPoint = createVector(this.pos.x + this.dims.x/4, this.pos.y + this.dims.y/4)
            } else {
                this.centerPoint = this.pos;
            }
        } 
        return this.centerPoint;
    }

    updatePosition(x, y){
        if (this.constants.positionMode == "PERCENTAGE"){
            // If percentage provided, convert to pixels to use under the hood
            this.pos = Primitive.toPixels(createVector(x, y))
        } else {
            this.pos = createVector(x, y);
        }  
    }

    update(update={}){
        /*
            This is literally just a wrapper around updateAesthetics() to make calling it shorter and more logical for the developer
        */
        if (update == {} || update == undefined){return}
        // A wrapper that processes kwargs and updates position and/or image
        if (typeof(update) != "object"){throw new Error(`Expected param 'update' to be an object. Instead got: ${typeof(update)}.`)}
        this.updateAesthetics(update)
    }

    convertCoordinates(coords=undefined){
        // Check the positionMode setting and return either coordinates as pixels or percentage
        // Creates this._pos, which stores the pixel value of the position, while pos keeps the user inputted version
        // if inPlace is set then this doesn't set this._pos, and just returns the vector - useful for setting dims
        if (coords == undefined){
            if (this.constants.positionMode == "PERCENTAGE"){
                // If percentage provided, convert to pixels to use under the hood
                this._pos = Primitive.toPixels(createVector(this.pos.x, this.pos.y));
            } else {
                this._pos = createVector(this.x, this.y);
            }
        } else {
            if (this.constants.positionMode == "PERCENTAGE"){
                // If percentage provided, convert to pixels to use under the hood
                return Primitive.toPixels(createVector(coords.x, coords.y));
            } else {
                return createVector(coords.x, coords.y);
            }
        }
    }
    
    static _convertCoordinates(coords, positionMode=undefined){
        // The point of this method is to wrap all the sanitisation into one call to clean up code elsewhere, 
        // it essentially just converts between coordinate systems through a static call, for use by click listeners eg.
        let pm;
        if (params == undefined && positionMode == undefined){
            throw new Error(`Could not find object 'params' - this needs to be set so Psychex knows what positionMode to use.`)
        } else if (params.positionMode == undefined && positionMode == undefined){
            throw new Error(`Could not find 'params.positionMode' - this needs to be set so Psychex knows what positionMode to use.`)
        } else if (positionMode != undefined){
            pm = positionMode;
        } else {
            pm = params.positionMode;
        }

        if (pm == "PERCENTAGE"){
            // If percentage provided, convert to pixels to use under the hood
            return Primitive.toPixels(createVector(coords.x, coords.y));
        } else if (pm == "PIXELS") {
            return Primitive.toPercentage(createVector(coords.x, coords.y))
        } else if (pm == "IGNORE") {
            return createVector(coords.x, coords.y)
        }
    }

    onClick(e){}

    draw(){
        // Run each of the aesthetic functions stored in this.aesthetics
        Object.keys(this.aesthetics).forEach(aes => {
            this.aesthetics[aes]._func(this.aesthetics[aes]._val);
        })
        // And run each of the kwargs
        if (Object.keys(this.kwargs).length != 0){
            try {
                this.kwargs.forEach(kwarg => {
                    this.applyKwargs(kwarg.type, kwarg.val)
                })
            } catch (error) {
                console.log(this)
                throw new Error(`Likely calling super.draw() unnecessarily - you can ignore this error, or remove the super.draw() call if not adding a custom primitive.`)
            }

            
        }
        
        // this._pos = this.pos;
        this.convertCoordinates();
        return this._pos;
    }
}

/**
 * Psychex text class.
 * @param {String} text Text string to be rendered. Accepts newlines if passed in by "\n".
 * @param {number} x Horizontal coordinate of text, using anchor point based on *positionMode*
 * @param {number} y Vertical coordinate of text, using anchor point based on *positionMode*
 * @param {Object} kwargs={} dict of optional aesthetics and kwargs
 * @returns {Object} pText object
 */
class pText extends Primitive {
    constructor(text, x, y, kwargs={}){
        // -- Set default aesthetics -- //
        super(x, y, kwargs);
        this.type="pText";
        this.text = text.toString();
        this.scaleBy = 1;
        this.lineSpacing = 0;
        // add default aesthetics to the pText object
        this.defaultAesthetics = psychex.aesthetics.pText;
        this._handleKwargs({...this.defaultAesthetics, ...this.kwargs})
        
    }

    setTextSize(newSize){
        /*
        // Old version before aesthetics were introduced - needs updating to new pattern
        
        Takes sizing as either a font (eg. 32, 36, 42, etc.) or a screen size (sm, md, lg, xl, 2xl, 3xl, 4xl) and will offer scaling based on that 

        // TODO: An optional feature would be to look in this.constants for a screen size setting and use that as default, then make scaling relative.
        */

        let textSizeType = undefined;
        typeof(newSize) == "string" ? textSizeType = "screenType" : textSizeType = "fontSize"
        if (textSizeType == "fontSize"){
            this.textSize = Math.floor(newSize) // Ensure only integer font types are used
        } else if (textSizeType == "screenType"){
            this.screenSize = newSize;
            switch (newSize) {
                case "sm":
                    // Small font
                    this.textSize = 16;
                    break;
                case "md":
                    // Medium font
                    this.textSize = 22;
                    break;
                case "lg":
                    // Large font
                    this.textSize = 28;
                    break;
                case "xl":
                    // XL font
                    this.textSize = 32;
                    break;
                case "2xl":
                    // 2XL font
                    this.textSize = 36;
                    break;
                case "3xl":
                    // 3XL font
                    this.textSize = 42;
                    break;
                case "4xl":
                    // 4XL font
                    this.textSize = 54;
                    break;
                default:
                    print(`Fontsize ${newSize} not recognised. Setting to default size 16. Please specify an integer font size or use one of the following sizes: sm, md, lg, xl, 2xl, 3xl, 4xl.`)
                    this.textSize = 16;
                    this.screenSize = "default";
            }
        }
        // this.textSize = newSize;
        return this;
    }

    setScale(s){
        this.scaleBy = s;
        return this;
    }

    update(update={}){
        super.update(update);
        Object.keys(update).forEach(arg => {
            if (arg == "text"){
                this.text = update[arg];
            }
        })
    }

    handleNewLine(t){
        t = t.toString()
        try{
            if (!t.includes("\n")){return [t]}
        } catch {
            console.log(t)
        }
        try{
            return t.split("\n")
        } catch {
            console.log(t)
        }
    }

    static draw_(textContent, x, y, kwargs={}){
        // Static draw method
        textContent = textContent.toString();
        if (typeof(kwargs) != "object"){throw new Error(`Expected kwargs to be type object, instead got ${type(kwargs)}.`)}
        // Create new local primitive object to call aesthetic functions and handle coords
        push();
        const primitiveObject = new Primitive(x, y);
        primitiveObject._handleKwargs({...psychex.aesthetics.pText, ...kwargs})
        let p = primitiveObject.draw()
        translate(p.x, p.y);
        text(textContent, 0, 0);
        pop();
    }

    draw(update={}){
        let p = super.draw()
        this.update(update)
        push();
        translate(p.x, p.y);
        // textSize(this.textSize)
        scale(this.scaleBy);
        // Check if text contains a newline, and handle that
        let nls = this.handleNewLine(this.text);
        nls.forEach((ln, ix) => {
            text(ln, 0, (ix*(textSize() + this.lineSpacing)));
        })
        // text(this.text, 0, 0);
        pop();
    }
}

/**
 * Psychex rectangle class.
 * @param {number} x: Horizontal position of anchor point
 * @param {number} y: Vertical position of anchor point
 * @param {number} w: Width of the rectangle
 * @param {number} h: Height of the rectangle
 * @param {any} kwargs={}: Additional positional and aesthetic arguments
 * @returns {Object} pRectangle
 */
class pRectangle extends Primitive{
    constructor(x, y, w, h, kwargs={}){
        super(x, y, kwargs);
        this.type="pRectangle";
        this.dims = createVector(w, h);
        // Add default aesthetics
        this.defaultAesthetics = psychex.aesthetics.pRectangle;
        this._handleKwargs({...this.defaultAesthetics, ...this.kwargs})
    }

    withImage(imgObj, kwargs){
        // Overlay an image on the rectangle - common in gridworlds, etc.
        // TODO add with image option too
        this.img = new pImage(this.pos.x, this.pos.y, imgObj, kwargs);
    }

    static draw_(x, y, w, h, kwargs){
        // Static draw method for rect
        if (typeof(kwargs) != "object"){throw new Error(`Expected kwargs to be type object, instead got ${type(kwargs)}.`)}
        push();
        const primitiveObject = new Primitive(x, y, kwargs);
        primitiveObject._handleKwargs({...psychex.aesthetics.pRectangle, ...kwargs})
        let dims = primitiveObject.convertCoordinates(createVector(w, h))
        let p = primitiveObject.draw();
        translate(p.x, p.y);
        rect(0, 0, dims.x, dims.y)
        pop();
    }

    onClick(){}

    draw(){
        let p = super.draw();
        let dims = super.convertCoordinates(this.dims);
        push();
        translate(p.x, p.y)
        rect(0, 0, dims.x, dims.y);
        if (this.img != undefined){this.img.draw()};
        pop();
    }
}

/**
 * Psychex line class. Draws a linear line connecting the points specified by the params.
 * @param {number} x1: x-coordinate of line start
 * @param {number} y1: y-coordinate of line start
 * @param {number} x2: x-coordinate of line end
 * @param {number} y2: y-coordinate of line end
 * @param {Object} kwargs={}: additional positional and aesthetic arguments
 * @returns {Object} pLine
 */
class pLine extends Primitive {
    constructor(x1, y1, x2, y2, kwargs={}){
        super(x1, y1, kwargs);
        this.endPos = createVector(x2, y2);
        this.type = "pLine";
        this._handleKwargs({...psychex.aesthetics.pLine, ...this.kwargs});
    }

    draw(){
        let p = super.draw();
        let p2 = Primitive.toPixels(this.endPos);
        push();
        translate(0, 0);
        line(p.x, p.y, p2.x, p2.y);
        pop();
    }
}

class pCircle extends Primitive{
    // pCircle % radius scaling is based on width
    constructor(x, y, r, kwargs={}){
        super(x, y, kwargs);
        this.type="pCircle";
        this.radius = r;
        // Add default aesthetics
        this.defaultAesthetics = psychex.aesthetics.pCircle;
        this._handleKwargs({...this.defaultAesthetics, ...this.kwargs})
    }

    handleRadius(){
        // Convert radius to appropriate positionMode val
        if (this.constants.positionMode == "PERCENTAGE"){return this.radius*(innerWidth/100)}
        else {return this.radius}
    }

    draw(){
        let p = super.draw()
        let r = this.handleRadius();
        push();
        translate(p.x, p.y);
        circle(0, 0, r*2);
        pop();
    }
}

class pTriangle extends Primitive{
    constructor(x1, y1, x2, y2, x3, y3, kwargs={}){
        super(x1, y1, kwargs);
        this.type="pTriangle";

        if (this.constants.positionMode == "PERCENTAGE"){
            this.pos1 = Primitive.toPixels(createVector(x1, y1));
            this.pos2 = Primitive.toPixels(createVector(x2, y2));
            this.pos3 = Primitive.toPixels(createVector(x3, y3));
        } else {
            this.pos1 = createVector(x1, y1);
            this.pos2 = createVector(x2, y2);
            this.pos3 = createVector(x3, y3);
        }

        this.x2Diff = createVector(this.pos2.x - this.pos1.x, this.pos2.y - this.pos1.y)
        this.x3Diff = createVector(this.pos1.x - this.pos3.x, this.pos1.y - this.pos3.y)

        // Add default aesthetics
        this.defaultAesthetics = psychex.aesthetics.Triangle;
        this._handleKwargs({...this.defaultAesthetics, ...this.kwargs})
    }

    static draw_(x1, y1, x2, y2, x3, y3, kwargs={}){
        if (typeof(kwargs) != "object"){throw new Error(`Expected kwargs to be type object, instead got ${type(kwargs)}.`)}
        push();
        const primitiveObject = new Primitive(x1, y1, kwargs);
        let pm;
        if (Object.keys(kwargs).includes("positionMode")){
            pm = kwargs["positionMode"];
        } else {
            pm = (primitiveObject.constants.positionMode == "PERCENTAGE" ? "PERCENTAGE" : "PIXELS")
        }
        let pos1, pos2, pos3;
        if (pm == "PERCENTAGE"){
            pos1 = Primitive.toPixels(createVector(x1, y1));
            pos2 = Primitive.toPixels(createVector(x2, y2));
            pos3 = Primitive.toPixels(createVector(x3, y3));
        } else {
            pos1 = createVector(x1, y1);
            pos2 = createVector(x2, y2);
            pos3 = createVector(x3, y3);
        }

        push();
        translate(0, 0);
        // TODO finish
        triangle(this.pos1.x, this.pos1.y, this.pos2.x, this.pos2.y, this.pos3.x, this.pos3.y);
        pop();
    }

    draw(){
        let p = super.draw();
        push();
        translate(p.x, p.y);
        triangle(0, 0, this.x2Diff.x, this.x2Diff.y, -this.x3Diff.x, this.x3Diff.y);
        pop();
    }
}

/**
 * Psychex image class
 * @param {number} x Horizontal coordinate of image, using anchor point based on *positionMode*
 * @param {number} y Vertical coordinate of image, using anchor point based on *positionMode*
 * @param {any} img p5 image object, loaded in using `loadImage()`
 * @param {any} kwargs={} optional aesthetics and kwargs
 * @returns {Object} pImage
 */
class pImage extends Primitive{
    /*
        Expects a p5 image object reference, from assets.imgs as input
    */
    constructor(x, y, img, kwargs={}){
        super(x, y, kwargs);
        this.type="pImage";
        // add default aesthetics to the pText object
        this.defaultAesthetics = psychex.aesthetics.pImage;
        this._handleKwargs({...this.defaultAesthetics, ...this.kwargs})
        this.img = img;
        this.width = this.img.width;
        this.height = this.img.height;
        this.scaleBy = 1;
        this.scaleDimensions();
        // this.dims = Primitive._convertCoordinates(createVector(this.img.width, this.img.height), "PIXELS");
        // compute and store the centre point for later use if needed
    }

    setScale(s){
        this.scaleBy = s;
        this.scaleDimensions()
        return this;
    }

    scaleDimensions(){
        // Keep a copy of the scaled image dimensions
        // When we load an image in we get its raw width and height, however when we scale it, these values are scaled too, but not updated in the p5 image object
        if (this.constants.positionMode == "PERCENTAGE"){
            this.dims = Primitive.toPercentage(createVector(this.img.width*this.scaleBy, this.img.height*this.scaleBy));
        } else if (this.constants.positionMode == "PIXELS"){
            this.dims = createVector(this.img.width*this.scaleBy, this.img.height*this.scaleBy);
        }
        
    }
    
    onClick(){
        // this.setScale(this.scaleBy+0.1);
    }

    update(update={}){
        super.update(update);
        Object.keys(update).forEach(arg => {
            if (arg == "image" || arg == "img"){
                this.img = arg;
            }
        })
    }

    static draw_(x, y, img, kwargs){
        // Static draw method for rect
        if (typeof(kwargs) != "object"){throw new Error(`Expected kwargs to be type object, instead got ${type(kwargs)}.`)}
        push();
        const primitiveObject = new Primitive(x, y, kwargs);
        primitiveObject._handleKwargs({...psychex.aesthetics.pImage, ...kwargs})
        primitiveObject.draw();
        translate(primitiveObject.pos.x, primitiveObject.pos.y);
        image(img, 0, 0);
        pop();
    }

    draw() {
        let p = super.draw();
        push();
        translate(p.x, p.y)
        scale(this.scaleBy);
        rotate(this.rotateBy);
        image(this.img, 0, 0)
        pop();
    }
}

/**
 * Psychex button class that wraps a rect, makes it clickable by default, and allows you to add an overlayed primitive.
 * @param {number} x: Horizontal coordinate of image, using anchor point based on *positionMode*
 * @param {number} y: Vertical coordinate of image, using anchor point based on *positionMode*
 * @param {number} w: Width of the button rect
 * @param {number} h: height of the button rect
 * @param {Object} kwargs={} optional aesthetics and kwargs
 * @returns {Object} pButton
 */
class pButton extends Primitive {
    // A button is a pRectangle object with the option to add text or an image to the centre and is automatically clickable
    constructor(x, y, w, h, kwargs={}){
        super(x, y);
        this.type = "pButton"
        this.initDims = createVector(w, h);
        console.log(kwargs)
        this.rect = new pRectangle(x, y, w, h, kwargs);
        this.dims = this.rect.dims;
        this.text = undefined;
        this.img = undefined;
        this.toggleClickable();
    }

    addImage(){

    }

    addText(text, kwargs={}){
        // Place at x, y with option to override
        this.text = new pText(text, this.pos.x, this.pos.y, {...kwargs});
        return this;
    } 

    clickAnimation(){
        // A default click animation that can be overridden
    }

    onClick(){
    }

    draw(){
        let p = super.draw();
        this.rect.draw();
        if (this.text != undefined){
            this.text.draw();
        }
        if (this.img != undefined){
            this.img.draw();
        }
    }
}

class Countdown extends Primitive {
    // TODO needs polishing, refinement, testing etc.
    // eg. func for setting separate params per foreground and background rects in progress bar
    // also we have a pause method but no play method
    constructor(x, y, endtime, kwargs={}){
        super(x, y, kwargs);
        this.endtime = endtime;
        this.initTime = Date.now();
        this.stop = true;
        this.prop = 0;
        this.graphic = undefined;
    }

    setGraphic(graphic, params={}){
        /*
            Set the graphic to be either a circular arc that varies between full 360 deg and 0 deg, or a progress bar.
        */

        if (graphic == "arc"){
            if (params.w == undefined || params.h == undefined){throw new Error("When setting an arc, please provide a width and height via the params. For example: setGraphic('arc', {w: 1, h: 1})")}
            this.graphic = new Primitive(this.x, this.y);
            this.graphic._handleKwargs({...psychex.aesthetics.pCircle, ...params})
            this.graphic.draw = () => {
                push();
                this.graphic.pos.x = this.pos.x;
                this.graphic.pos.y = this.pos.y;
                let pos = createVector(this.pos.x, this.pos.y);
                let dims = createVector(params.w, params.h);
                if (this.constants.positionMode == "PERCENTAGE"){
                    pos = Primitive.toPixels(createVector(this.pos.x, this.pos.y));
                    dims = Primitive.toPixels(createVector(params.w, params.h));
                } else {
                    pos = createVector(this.pos.x, this.pos.y);
                }
                translate(pos.x, pos.y);
                // Run aesthetics
                Object.keys(this.graphic.aesthetics).forEach(aes => {
                    this.graphic.aesthetics[aes]._func(this.graphic.aesthetics[aes]._val);
                })
                angleMode(DEGREES);
                arc(0, 0, dims.x, dims.y, 0, (1-this.prop)*360);
                pop();
            }
            return this;
        } else if (graphic == "bar"){
            if (params.w == undefined || params.h == undefined){throw new Error("When setting an arc, please provide a width and height via the params. For example: setGraphic('arc', {w: 1, h: 1})")}
            this.graphic = new Primitive(this.x, this.y, this.kwargs);
            this.graphic.draw = () => {
                pRectangle.draw_(this.pos.x, this.pos.y, params.w, params.h, {...psychex.aesthetics.pCircle, ...params}) // Background bar, unchanging
                pRectangle.draw_(this.pos.x-params.w/2, this.pos.y-params.h/2, (1-this.prop)*params.w, params.h, {rectMode: "CORNER", ...{...psychex.aesthetics.pCircle, ...params}}) // inner bar
            }
            return this;
        } else if (graphic == "custom"){
            this.graphic = new Primitive(this.x, this.y, this.kwargs);
            // The user can manually overwrite the draw method if they want, either using Psychex primitives or p5.js geometries
            this.graphic.draw = () => {}
        } else {
            throw new Error(`Graphic type ${graphic} not recognised.`)
        }
    }

    reset(){
        this.initTime = Date.now();
        this.stop = false;
    }

    onTimeUp(){
        // Callback for when timer elapses
    }

    pause(){
        this.stop = true;
    }

    draw(){
        if (!this.stop){
            let timeDiff = (Date.now() - this.initTime)/1000; // Difference between start and now in seconds
            this.prop = timeDiff / this.endtime;
            if (this.prop >= 1){
                this.onTimeUp();
                this.prop = 0;
            }
        }
        if (this.graphic == undefined){
            return
        } else {
            super.draw();
            this.graphic.draw();
        }
        // draw obj

    }
}

class NArmBandit extends Primitive{
    constructor(x, y, nArms=2, probabilities="random"){
        super();
        this.nArms = nArms;
        // Sanitise probability input
        if (this._checkProbabilities(probabilities)) {this.probabilities = probabilities};
        this.convertKeyToProbabilities();
    }

    _checkProbabilities(p){
        if (typeof(p) == "string"){
            if (!["random"].includes(p)){
                throw new Error(`Probability type ${p} not recognised: must be one of: random`)
            } else {
                return true
            }
        } else if (typeof(p) == "object"){
            if (p.length != this.nArms){
                throw new Error(`Warning: Provided ${p.length} probabilities for ${this.nArms} arms. Make sure the number of probabilities provided matches the number of arms.`);
            } else {
                return true
            }
        } else {
            throw new Error(`Must provide either a probability type (eg. 'random') or an array of values matching the number of arms (eg. if nArms=2, [0.5, 0.5])`);
        }
    }

    convertKeyToProbabilities(){
        // If user provides this.probabilities as a string code - eg. "random", convert to a list of probabilities
        if (typeof(this.probabilities) == "string"){
            this.probabilities = _.range(0, this.nArms).map(i => _.random(0, 1, true));
            if (this.constants.verbose){console.log(`Bandit arm values set to: ${this.probabilities}`)}
        }
    }

    setNArms(n){
        this.nArms = n;
        return this;
    }

    getNArms(n){
        return this.nArms;
    }

    setProbabilities(p){
        if (this._checkProbabilities(p)) {this.probabilities = p};
        return this;
    }

    getProbabilities(){
        return this.probabilities;
    }

    pullArm(index){
        /*
            Pull the arm related to the given index in this.probabilities.
            NB: These are ordered in the order provided by the user in this.probabilities - and may differ from the order rendered in if this.shuffle is set.
            Returns true if reward is issued, false if not.
        */

        // Generate a random number
        const drawnVal = _.random(0, 1, true);
        return (drawnVal <= this.probabilities[index]) ? true : false;
    }

    update(probabilities, nArms){
        /*
            Update the number of arms or probabilities used manually by providing new values for both quantities respectively.
        */
        this.nArms = nArms;
        if (this._checkProbabilities(probabilities)) {this.probabilities = probabilities};
        this.convertKeyToProbabilities();
    }

    draw(){

    }
}

class Game {
    constructor(){
        this.data = [];
        // Add dedicated screens that can be rendered as needed - e.g. fullscreen warnings, intersitials, etc.
        this.screens = {};

        // If 'playerId' in URL params, set this.playerId - otherwise generate a string
        let params = Utils.getUrlParams();
        Object.keys(params).includes("playerId") ? (this.playerId = params["playerId"]) : this.registerUUID();
    }

    /**
     * Asynchronous function that saves data to a *HTTP* server via *POST* and returns a Promise.
     * 
     * @param {Object} data: The data object to be saved to the server. This data will be prepared for sending within this function call using ``JSON.stringify``.
     * @param {string} url=`api/save/`: The endpoint URL that the data will be saved to, such as the address on an external server.
     * @returns {Promise} The promise of a response from the target endpoint.
     */
    async saveDataToServer(data, url=`api/save/`){
        const URL = url;
        const response = await fetch(URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(data)
        })

        return response;
    }

    /**
     * Asynchronous function that loads data from a *HTTP* server via a *GET* and returns the data within a Promise
     * @param {any} url=`api/load/` The HTTP endpoint that serves the data
     * @param {any} data: Additional parameters to pass to the endpoint
     * @returns {Promise}
     */
    async loadDataFromServer(url=`api/load/`, data={}){
        const URL = url;
        const response = await fetch(URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(data)
        })
    }

    /**
     * Store data to the participant's browser using the `localStorage` API
     * @param {any} data Data to be saved to the browser
     * @param {string} key="data" identification key that can be used to retrieve the data. Must be unique. Data can be retrieved with the Psychex method `Game.loadFromLocalStorage`.
     * @returns {undefined}
     */
    saveToLocalStorage(data, key="data"){
        // Save data to the player's browser
        let ID = key;
        localStorage.setItem(ID, data);
    }

    /**
     * Load previously stored data from the participant's browser using the `localStorage` API
     * @param {any} key="data" The unique identification key for the stored data
     * @returns {any} The previously stored data
     */
    loadFromLocalStorage(key="data"){
        let ID = key;
        return localStorage.getItem(ID);
    }

    /**
     * Wraps the JATOS storage methods, allowing you to save data asynchronously by either appending it to a file, or overwriting.
     * Ref: https://www.jatos.org/jatos.js-Reference.html#result-data-and-result-uploaddownload-files
     * 
     * @param {any} data The data to be saved
     * @param {boolean} overwrite=false whether or not to overwrite existing stored data or append it to new data. Default appends to existing data.
     * @returns {Promise}
     */
    saveDataToJatos(data, overwrite=false){
        try {
            let isLoaded = (jatos != undefined);
        } catch (error) {
            throw new Error(`Attempting to use JATOS functions but no JATOS lib file found. Make sure it's installed and imported into your index.html.`)
        }
        if (overwrite){
            return jatos.submitResultData(data)
        } else {
            return jatos.appendResultData(data)
        }
    }

    /**
     * Static method that moves to the specified JATOS component. Wraps the JATOS methods `startComponent`, `startComponentByPos`, and `startNextComponent` automatically depending on whether a numerical input id, or an id string is provided.
     * Optionally allows data to be saved on component change. Returns a Promise.
     * Ref: https://www.jatos.org/jatos.js-Reference.html#functions-to-control-study-flow
     * @param {any} id: The ID of the component, accepting either a string, number, or undefined. Using `undefined` will move to the next component.
     * @param {any} save={}: Optional data to be saved on component change.
     * @param {any} params={}: Optional data to be passed to the next component's URL and accessed there. If a string is passed, will be converted to an object as {params: params} and Stringified. If an Object is passed, will also be Stringified. To access data later, use `JSON.parse()`. on the param `message`.
     * @returns {Promise}
     */
    static goToJatosComponent(id, save={}, params={}){
        // Wrapper for the jatos.startComponent and jatos.startComponentByPos functions
        try {
            let isLoaded = (jatos != undefined);
        } catch (error) {
            throw new Error(`Attempting to use JATOS functions but no JATOS lib file found. Make sure it's installed and imported into your index.html.`)
        }
        // Depending on input type, find the relevant Jatos method to move to the next component
        let callback = () => {};
        if (id == undefined){
            callback = jatos.startNextComponent;
            if (_.isEmpty(save)){
                if (_.isEmpty(params)){
                    return callback();
                } else {
                    return callback({}, typeof(params) == "string" ? JSON.stringify({params : params}) : JSON.stringify(params));
                }
            } else {
                if (_.isEmpty(params)){
                    return callback(save);
                } else {
                    return callback(save, typeof(params) == "string" ? JSON.stringify({params : params}) : JSON.stringify(params));
                }
            }
        } else if (typeof(id) == "number"){
            callback = jatos.startComponentByPos;
        } else {
            callback = jatos.startComponent
        }

        // Run the appropriate callback with the right combination of inputs
        if (_.isEmpty(save)){
            // If no save data, check if passing params
            if (_.isEmpty(params)){
                return callback(id);
            } else {
                // If params are passed, check if a string and pass, else stringify it
                // When this is recovered, if stringified will need to run JSON.parse later
                return callback(id, {}, typeof(params) == "string" ? JSON.stringify({params : params}) : JSON.stringify(params));
            }
        } else {
            // Save params passed
            if (_.isEmpty(params)){
                return callback(id, save)
            } else {
                return callback(id, save, typeof(params) == "string" ? JSON.stringify({params : params}) : JSON.stringify(params));
            }
        }
    }

    registerUUID(){
        /*
            TODO

            Either read a UUID from the URL, or create one and register it in this.data
            Alternatively create a metadata object that tracks user id, time loaded, etc.
        */

        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        this.playerId =  _.range(1, 16).map(i => _.sample(characters)).join('');
        
    }

    addScreen(name, callback){
        /*
        // Adds a screen that can be rendered when needed
        // Expects a name and a callback, which will be a function with draw instructions
        // Eg.

            const intersitial = () => {
                // Using primitive static methods rather than creating variables, since we don't need them to be dynamic
                pImage.draw_(`Intersitial screen with user instructions`, 50, 50, {...kwargs})
            }

            var game = new Game();
            game.addScreen("myIntersitial", intersitial);

            // Inside global draw method
            draw() {
                clear();
                // ... //
                if (game.data.roundIndex = 10){
                    game.displayScreen("myIntersitial", {...kwargs})
                }

            }
        */
    }

    displayScreen(name, kwargs={}){
        return this.screens[name](kwargs)
    }

    start(){

    }

    nextRound(){

    }

    end(){

    }

    restart(){

    }

    skip(){

    }

    addHud(kwargs={}){
        // Add a hud (heads up display) to the screen
        // Offers raw functionality to include round counter, title, score, skip, restart, etc. elements, and can be extended to include custom components
    }
}

class Fullscreen{
    /* Fullscreen requires a few key components:
        - A clickable element to trigger fullscreen (typically document, or the canvas, but can be attached to canvas and then narrowed down to an onClick)
        - A pre-click screen to tell the user to click and launch fullscreen
        - A listener that takes a callback to run when fullscreen is breached, and stops other functions from running
        - The method that actually requests fullscreen from the browser
    */
    constructor(){
        this.isPreFullScreen = true;
        this.isFullScreen = false;
        this.settings = {
            initialOffsetTime: 1000,
        }
        this.preClickCallback;

    }

    beforeFullscreen(callback = () => {return undefined}){
        // Do some behind-the-scenes handling, and then call the user callback which might define some text or an image to show the user
        this.draw = callback;
        // Create the event listener after a certain amount of time
        // This stops the user from accidentally launching the game immediately without seeing the text if they click too soon, double click on the previous screen, etc.
        // this initial offset can be changed with this.settings.initialOffsetTime
        if (this.fsClickListener != undefined){return}
        setTimeout(() => {
            this.fsClickListener = document.addEventListener("click", () => {
                if (this.isPreFullScreen){
                    Fullscreen.requestFullScreen(document.documentElement);
                    this.isFullScreen = true;
                    // empty draw so nothing happens during the gap
                    // this.draw = undefined
                    setTimeout(() => {
                        // Hold the detection for 0.1 second to avoid race condition
                        this.isPreFullScreen = false;
                        this.draw = this.detect
                    }, 250); // this needs to be at least 250
                    
                    // this.draw = this.detect;
                    
                }
            })
        }, this.settings.initialOffsetTime)
    }

    detect(){
        // console.log("detecting...")
        this.isFullScreen = Fullscreen.detectFullscreen();
        // The pre-fullscreen checks might seem over-zealous, but it mitigates against any race conditions that can lead to immediate exit of the game
        if (!this.isPreFullScreen){
            // console.log(this.isFullScreen)
            if (this.isFullScreen == false){
                console.log("call")
                this.draw = this.onFullscreenExit;
            }
        }
        
    }

    onFullscreenExit(){}

    draw(){
    }

    static detectFullscreen(){
        return (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement) != undefined;
    }
    
    static requestFullScreen(element) {
        // Supports most browsers and their versions.
        var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;
    
        if (requestMethod) { // Native full screen.
            requestMethod.call(element);
        } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
            var wscript = new ActiveXObject("WScript.Shell");
            if (wscript !== null) {
                wscript.SendKeys("{F11}");
            }
        }
    }
}

class Utils{

    /**
     * Static method that reads the contents of a URL and return any parameters included in the string. If no URl is provided to the 
        input parameter *url*, the URL of the current window will be used. This can also be used to search for specific 
        params by including them in the array *searchParams*.
     *
     * @param {Array[string]} searchParams=[]: An array of parameters to search for. Including this will return only the specified parameters.
     * @param {string} url=window.location: The URL to use for the search. If one isn't provided, the current window URL is used.
     * @returns {Object} A dict-object mapping URL-Param key to value
     */
    static getUrlParams(searchParams=[], url=undefined){
        /*
            Search the URL for params
            If a list of params provided use those, if not return a searchable object
            Can be searched with obj.get(param)
        */
        // If a url is provided use that, if not use the current window url
        let myUrl = (url == undefined ? window.location : url);
        let urlObj = new URL(myUrl).searchParams;
        if (searchParams.length == 0){
            return _.cloneDeep(Object.fromEntries(urlObj))
        } else {
            let vals = {}
            searchParams.forEach(p => {
                vals[p] = urlObj.get(p);
            })
            return vals
        }
    }

    /**
     * Static method that can be used to read Jatos URL params. Jatos takes URL parameters initially appended to the experiment link and stores them as a variable called `jatos.urlQueryParams`. 
     * It removes them from the browser-URL, but makes them accessible within each component through this object. This method is a wrapper for the Jatos method.
     * @param {Array} searchParams=[] An array of parameters to search for. Including this will return only the specified parameters.
     * @returns {Object} A dict-object mapping URL-Param key to value
     */
    static getJatosParams(searchParams=[]){
        try {
            let isLoaded = (jatos != undefined);
        } catch (error) {
            throw new Error(`Attempting to use JATOS functions but no JATOS lib file found. Make sure it's installed and imported into your index.html.`)
        }
        let urlObj = jatos.urlQueryParameters
        if (searchParams.length == 0){
            return urlObj;
        } else {
            let vals = {}
            searchParams.forEach(p => {
                vals[p] = urlObj[p];
            })
            return vals
        }
    }
}

/**
 * The gridworld class offers a collection of utilities for creating a 2-dimensional grid that can be 
 * populated by images, shapes, text, or any other Psychex object. It contains methods for accessing individual 
 * cells by index or coords, and allows the experimenter to easily build in user-control by keyboard or mouse-click. 
 * @returns {any}
 */
class GridWorld extends Primitive {
    /**
     * Constructor
     * 
     * @param {number} x: The x-coordinate of the anchor point, specified by the value of *align*
     * @param {number} y: The y-coordinate of the anchor point, specified by the value of *align*
     * @param {number} w: The width of the grid
     * @param {number} h: The height of the grid
     * @param {number} nRows: The number of rows in the grid as an integer
     * @param {number} nCols: The number of columns of the grid as an integer
     * @param {string} align="CORNER": Specifies where the anchor point of the grid is. If "CORNER", the *(x, y)* specified will be in the top-left corner of the grid. If "CENTER", the *(x, y)* will be the center. Default is "CORNER".
     * @param {object} kwargs={}: A dict-object containing additional keyword args
     * @returns {any}
     */
    constructor(x, y, w, h, nRows, nCols, align="CORNER", kwargs={}){
        super(x, y, kwargs);
        this.initDims = createVector(w, h);
        this.dims = createVector(w, h)

        if (!["CORNER", "CENTER"].includes(align)){
            throw new Error(`alignment ${align} not recognised. Must be one of: CORNER, CENTER`)
        } else {
            this.align = align;
        }
        this.nRows = nRows;
        this.nCols = nCols;
        this.kwargs = kwargs;
        // Overlays are primitives placed on top of named cells
        this.overlays = [];

        this.drawOutline();
    }

    /**
     * Returns the width value originally supplied to the constructor.
     * 
     * @returns {number} Original width value
     */
    getWidth(){
        return this.dims.x;
    }

    /**
     * Returns the height value originally supplied to the constructor.
     * 
     * @returns {number} Original height value
     */
    getHeight(){
        return this.dims.y;
    }

    /**
     * Update the width of the grid. If called, must be followed by calling *drawOutline* to update.
     * 
     * @param {number} w: The new width of the grid
     * @returns {any}
     */
    setWidth(w){
        this.dims.x = w;
    }

    /**
     * Update the height of the grid. If called, must be followed by calling *drawOutline* to update.
     * 
     * @param {number} h: The new height of the grid
     * @returns {any}
     */
    setHeight(h){
        this.dims.y = h;
    }

    /**
     * Takes the provided x, y, w, h, nRows, nCols, and constructs a grid of pRectangle objects. Each of these objects is stored in 
     * an array called ``cells``. Each *cell* is an object containing an index, *ix*, the coords *coords*, and a reference to the pRectangle object, *obj*. 
     * The array can be indexed directly, or a reference directly to the pRectangle can be obtained from *getCell*. 
     * Each of these can be acted upon like normal pRectangles, and methods such as *update* or *onClick* can be applied.
     * 
     * @returns {this}
     */
    drawOutline(){
        this.cells = [];
        const xOffset = this.dims.x/this.nCols;
        const yOffset = this.dims.y/this.nRows;

        _.range(this.nRows).forEach((row, r_ix) => {
            _.range(this.nCols).forEach((col, c_ix) => {
                let newCell = {ix: c_ix + (this.nCols*r_ix), coords: [r_ix, c_ix]};
                let anchor;
                if (this.align == "CORNER"){
                    // Align from top-left corner
                    anchor = this.pos;
                } else if (this.align == "CENTER"){
                    // Create anchor point at top LHS corner and draw from there
                    anchor = createVector(this.pos.x - (this.dims.x/2), this.pos.y - (this.dims.y/2));
                }
                
                newCell.obj = new pRectangle(anchor.x + (c_ix*xOffset), anchor.y + (r_ix*yOffset), xOffset, yOffset, {rectMode: "CORNER"});
                // Copy the coords and ix to the object itself - allows for more options with filtering and helps with click listeners
                newCell.obj.ix = newCell.ix;
                newCell.obj.coords = newCell.coords;
                this.cells.push(newCell);
            })
        })

        return this;
    }

    setSchema(schema){
        // TODO [optional]: add an object that defines a play schema, overlaying images and click rules at certain indices/coords
    }

    /**
     * Returns a reference to a cell's pRectangle object. This object contains all normal pRectangle attributes, as well as copies of 
     * the *ix* and *coords* gridworld properties. The cell can be referenced by either grid index (*ix*) (*0 -> (nRows*nCols - 1)*), or by 
     * coords (*[0, 0] -> [nRows-1, nCols-1]*). Indexing **always** begins at 0.
     * 
     * @param {number/Array} id: A unique identifier for the cell, either the grid index, or grid coords. Indexing begins at 0.
     * @returns {Object} Cell reference
     */
    getCell(id){
        // Return a reference to a cell by a variable input that takes either ID (0 -> nRows*nCols-1) or coords ([0, 0] etc.)
        let ix;

        if (typeof(id) == "number"){
            if (id >= this.nRows*this.nCols){throw new Error(`Index ${id} out of bounds. Max index is ${this.nRows*this.nCols - 1}. Indexing starts at 0 inclusive.`)}
            ix = id;
        } else if (id.isPInst){
            // Convert vector to index
            ix = this.coordsToIndex([id.x, id.y]);
        } else if (typeof(id) == "object"){
            // Convert array to index
            ix = this.coordsToIndex([id[0], id[1]]);
        }

        // Get cell ref
        let cell = this.cells.filter(cell => cell.ix == ix)[0].obj;

        return cell;
    }

    /**
     * Update the aesthetic properties of a cell (eg. backgroundColor, borderWidth, etc.)
     * 
     * @param {number/Array} id: A unique identifier for the cell, either the grid index or grid coords. Indexing begins at 0.
     * @param {any} props={}: A dict-object containing the usual allowed aesthetics properties for a *pRectangle*
     * @returns {Object} Ref to the edited cell
     */
    setCellProps(id, props={}){
        // Set the properties on a single cell
        // The input, id, can either be the index or coords, and the method will adapt

        let cell = this.getCell(id);
        cell.update(props);
        return cell;
    }

    /**
     * Convert grid index to the equivalent coordinates using the values of *nRows* and *nCols* provided to the constructor.
     * 
     * @param {any} ix: A grid index (*0 -> (nRows*nCols -1)*) to be converted to coords.
     * @returns {Array} The equivalent coordinates
     */
    indexToCoords(ix){
        return [(ix % this.nRows), Math.floor(ix/this.nRows)]
    }

    /**
     * Convert grid coordinates to the equivalent grid index using the values of *nRows* and *nCols* provoded to the constructor
     * 
     * @param {Array/p5.Vector} coords: An array of coordinates (*[0, 0] -> [nRows-1, nCols-1]*) to be converted to the equivalent index.
     * @returns {number} The equivalent grid cell index
     */
    coordsToIndex(coords){
        // Convert coords to grid index
        if (coords.isPInst){
            coords = [coords.x, coords.y]
        } else if (typeof(coords) != "object"){
            throw new Error(`Got input type ${coords}, expected either a p5.Vector or an array of coords (eg. [1, 2])`)
        }

        return ((coords[0])*this.nRows + coords[1]);
    }

    /**
     * NB: Not directly equivalent to calling ``toggleClickable()`` on a primitive - this runs ``toggleClickable()`` on every cell 
     * in the grid iteratively, adding them all to *clickables*. Useful as a precursor for applying a single *onClick* to every cell.
     * 
     * @returns {any}
     */
    toggleClickable(){
        // Extend parent class to make each composite item clickable
        this.cells.forEach(cell => {
            // Make primitive clickable
            cell.obj.toggleClickable();
            // Set primitive onClick
            cell.obj.onClick = (cell) => {this.onClick(cell)}
        })
    }

    /**
     * Wrapper for attaching a click listener to a single cell by providing its grid index or grid coords.
     * 
     * Note: this method runs toggleClickable() automatically, so you don't need to run it beforehand! If you do, the two calls will cancel eachother out.
     * 
     * @param {Array/number} id: A unique identifier for the cell, either the grid index or grid coords.
     * @param {function} callback: A callback that will run when the particular cell is clicked.
     * @returns {Object} A reference to the clicked-on cell.
     */
    onCellClick(id, callback){
        // Set a click listener for a specific cell by index or coords
        let cell = this.getCell(id);
        cell.toggleClickable();
        cell.onClick = (e) => { 
            callback(e)
        };
        return cell;
    }

    /**
     * There are 2 layers in the gridworld visuals: the base *pRectangle* layer, and the *overlay* layer. 
     * Overlays are objects placed on top of the base grid, and are typically the stimuli presented to the participant. 
     * These can be any kind of psychex object - or, a custom object created from scratch if you wish to create a new object using *p5.js* draw calls.
     * 
     * @param {string} name: A unique name for the overlay. This can be useful for referencing it later, for instance if using an image that represents a player token, and naming it "player".
     * @param {Array/number} cellId: The id of the cell onto which the object is overlaid. Objects are placed within cells so that they're automatically aligned.
     * @param {Object} overlayObj: A reference to the object being overlayed. This can be a pre-defined object, or a new object can be created in the function call. This would typically be another psychex object, such as *pImage* or *pCircle* for example.
     * @returns {any}
     */
    addOverlay(name, cellId, overlayObj){
        // Add an overlay to the overlay storage, accessible via this.overlays
        // this.overlays is an array of object mappings, with keys: name, pos, obj
        
        // Get a ref to the target holding cell
        let holdingCell = this.getCell(cellId);
        // The pos applied to obj is the offset
        let offset = overlayObj.pos;
        // Store a copy of the offset for updating position later
        overlayObj.overlayOffset = offset;
        // Update to be the position of the holding cell, with the offset applied
        overlayObj.pos = createVector(
            offset.x + holdingCell.pos.x+holdingCell.dims.x/2, 
            offset.y + holdingCell.pos.y+holdingCell.dims.y/2
        );

        let cellIx, cellCoords;

        // Store both the index and the coords
        if (typeof(cellId) == "number"){
            cellIx = cellId;
            cellCoords = this.indexToCoords(cellId)
        } else {
            cellCoords = cellId;
            cellIx = this.coordsToIndex(cellId);
        }

        let newOverlay = {
            name: name, 
            ix: cellIx,
            coords: cellCoords,
            cell: holdingCell, // reference to the holding cell
            obj: overlayObj
        }

        // Add to overlays
        this.overlays.push(newOverlay);
    }

    /**
     * Update the aesthetics for the specified overlay. Similar to calling ``update`` on the object, but offers a wrapper that handles index/coords as input.
     * 
     * @param {Array/number/string} id: A unique identifier for the overlay, either the name provided on instantiation, or grid index or grid coords of the cell containing the overlay.
     * @param {Object} updateParams={}: A dict-object of aesthetics to apply to the overlay. Must map the typical values for that object type.
     * @returns {Object} A reference to the edited overlay
     */
    updateOverlay(id, updateParams={}){
        // get the specific overlay based on input id
        let overlay = this.getOverlay(id);
        if (overlay == undefined){
            throw new Error(`Attempting to update overlay, but could not find one with id: ${id}`)
        } else if (overlay.length > 1){
            throw new Error(`Found multiple overlays with the provided id (${id}). Either update these separately, or pass in a unique name identifier to update the target.`)
        }
        
        // If they pass in new positional information, we need to update ix, coords, and a cell ref, and then update obj.pos
        /*
            The following section does the following:

                - Checks if an index ("ix") or cell coords ("coords") have been passed in
                - If they have, checks if they've provided both
                    - If they've provided both, checks they match, and if they don't, throws an error
                - If we have at least an ix or coords, it gets a reference to the cell that matches the new id
                - Then it updates the position based on the original offset

                - If a cell ref is provided, we save that new cell as overlay.cell, and then update ix and coords to match

                - Or, if a name is provided, update the name

                - All of these can be done in tandem through updateParams

        */
        if (Object.keys(updateParams).includes("ix") || Object.keys(updateParams).includes("coords")){
            // Update both of these values
            if (Object.keys(updateParams).includes("ix") && Object.keys(updateParams).includes("coords")){
                if (updateParams.ix != this.coordsToIndex(updateParams.coords)){
                    throw new Error(`You've passed in both coordinates and an index, but they don't match the same cell. Please correct this or just pass in one of either index or coords, and the other will be updated automatically.`)
                }
            }

            if (Object.keys(updateParams).includes("ix")){
                // if an index was passed in
                // Update overlay
                overlay.ix = updateParams.ix;
                // Update coords as well
                overlay.coords = this.indexToCoords(overlay.ix);
            } else if (Object.keys(updateParams).includes("coords")){
                // if coords were passed id
                // Update coords
                overlay.coords = updateParams.coords;
                // And index
                overlay.ix = this.coordsToIndex(overlay.coords);
            }

            // Update the cell ref
            overlay.cell = this.getCell(overlay.ix);
            // Update the object position
            let objOffset = overlay.obj.overlayOffset;
            overlay.obj.pos = createVector(
                objOffset.x + overlay.cell.pos.x+overlay.cell.dims.x/2, 
                objOffset.y + overlay.cell.pos.y+overlay.cell.dims.y/2
            );

        return overlay;

        }

        if (Object.keys(updateParams).includes("cell")){
            // They passed in a cell reference, so just apply that directly, but first store the offset
            let objOffset = overlay.overlayOffset;
            // Update cell ref
            overlay.cell = updateParams.cell;
            overlay.ix = updateParams.cell.ix;
            overlay.coords = updateParams.cell.coords;
            overlay.obj.pos = createVector(
                objOffset.x + overlay.cell.pos.x+overlay.cell.dims.x/2, 
                objOffset.y + overlay.cell.pos.y+overlay.cell.dims.y/2
            );
        }

        if (Object.keys(updateParams).includes("name")){
            // And if a name is passed in, just update that directly
            overlay.name = updateParams.name;
        }
        
    }

    /**
     * Get a reference to a specific overlay from its id, either the name provided on instantiation, or the index/coords of the cell containing the overlay.
     * 
     * @param {|| array || number || string} id: A unique identifier for the overlay, either the name provided on instantiation, or grid index or grid coords of the cell containing the overlay.
     * @returns {Object} A reference to the edited overlay
     */
    getOverlay(id){
        if (typeof(id) == "string"){
            // filter by name
            let overlay = this.overlays.filter(ov => (ov.name == id));
            if (overlay.length == 0){return undefined}
            else {return overlay[0]};
        } else if (typeof(id) == "object"){
            // filter by coords
            let overlay = this.overlays.filter(ov => (_.isEqual(ov.coords, id)));
            if (overlay.length == 0){return undefined}
            else if (overlay.length > 1){return overlay}
            else {return overlay[0]};
        } else if (typeof(id) == "number"){
            // filter by index
            let overlay = this.overlays.filter(ov => (ov.ix == id));
            if (overlay.length == 0){return undefined}
            else if (overlay.length > 1){return overlay}
            else {return overlay[0]};
        } else {
            throw new Error(`Could not recognise index type of input. Received ${id}. id must be a grid index, grid coords, or a name.`)
        }
    }

    /**
     * Remove all existing overlays from the grid, and delete all references to them.
     * 
     * @returns {any}
     */
    clearAllOverlays(){
        this.overlays = [];
    }

    /**
     * Remove a single overlay, or all overlays from a single cell, depending on input provided.
     * @param {Array/number/string} id: A unique identifier for the overlay, either the name provided on instantiation, or grid index or grid coords of the cell containing the overlay.
     * @returns {any}
     */
    removeOverlay(id){
        // Remove overlays by cell index, coords, or name
        if (typeof(id) == "number"){
            this.overlays = this.overlays.filter(ov => (ov.ix != id))
        } else if (typeof(id) == "object") {
            this.overlays = this.overlays.filter(ov => (!_.isEqual(id, ov.coords)))
        } else if (typeof(id) == "string"){
            this.overlays = this.overlays.filter(ov => (ov.name != id));
        }
    }

    // ---------------------- //

    /**
     * Handle user-interactions with the gridworld. Wraps functionality for player movement with keyboard arrow-keys, or with the 'w-a-s-d' keys. Also includes options for mouse-click
        interactions. This method takes in 2 callbacks: the first may be applied *pre-movement*, such as for handling logic as to whether or not this movement is allowed (e.g. if building a maze,
        there may be obstacles/wall boundaries to consider, etc.). The second is a *postMovement* callback, applied if and only if the *preMovementCallback* runs successfully and returns *true*.
        This might handle logic for after the player has moved, or after any other user interaction. Both callbacks contain default empty functions, meaning if a pre-movement function isn't needed, 
        the user may simply pass a single callback in which will be used upon specification.

     * @param {string} mode: The interaction-mode to be applied. One of either "arrows" (for arrow-keys), "wasd" (for w-a-s-d keys), or "click" (for mouse-clicks.)
     * @param {function} preMovementCallback: The first callback run on player interaction. Must return *true* for the second callback to proceed. Default ``() => {}``.
     * @returns {any}
     */
    handleMovement(mode, preMovementCallback = () => {}, postMovementCallback = () => {}){
        // Be either keyboard or click-controllable
        // Offer callbacks for what happens before movement, and what happens after movement
        // mode is either 'arrows', 'wasd', 'click'
        if (!["arrows", "wasd", "click"].includes(mode)){throw new Error(`Mode type ${mode} not recognised. Must be one of: arrows, wasd, click.`)};

        // Define a function that calls the first preMovement callback, and if that returns true, call the post movement callback
        // For example, the preMovementcallback might contain rules about wall placements, etc.
        // and the post movement might update some value on a successful move
        const callback = (e) => {
            let c1 = preMovementCallback(e);
            if (c1 == true){postMovementCallback()}
        }

        if (mode == "arrows"){
            // Register keypress listeners for the arrow keys
            const keys = ["ArrowLeft", "ArrowUp", "ArrowDown", "ArrowRight"];
            // Register the event listeners
            keys.forEach(k => {psychex.keyPressEvents.register(k, callback)})
        } else if (mode == "wasd"){
            // Register keypress listeners for w, a, s, and d
            const keys = ["w", "a", "s", "d"];
            // Register the event listeners
            keys.forEach(k => {psychex.keyPressEvents.register(k, callback)})
        } else if (mode == "click"){
            // define onclick rule and then run this.toggleClickable()
            // NB: I haven't tested this yet
            this.cells.forEach(cell => {
                cell.obj.toggleClickable();
                cell.obj.onClick = callback;
            })
        }
    }

    /**
     * Utility for automatically checking gridworld outer boundaries when building a world that the player moves through. Contains key-mappings of the arrow and w-a-s-d keys
        and returns a boolean for if the proposed movement is within or out of bounds.
     * @param {Array} pos: The current position (eg. at time *t*), to be compared with the proposed new position, after movement (eg. at time *t+1*). Must be grid coords - indices can be converted using ``indexToCoords()``.
     * @param {string} k: The key-code of the pressed key. Accepts "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "a", "s", "d". Each of these is mapped to the vector-equivalent of the movement.
     * @returns {Object} A dict containing 2 values: *allowed* a boolean for an allowed movement (true) or not, and *pos* the coordinates of the new position after the movement, regardless of it allowed or not.
     */
    checkBounds(pos, k){
        // Utility function to check if a proposed movement would be within bounds
        let keyMapping = {
            'ArrowLeft' : [0, -1],
            'ArrowRight' : [0, 1],
            'ArrowUp' : [-1, 0],
            'ArrowDown' : [1, 0],
            'a' : [0, -1],
            'd' : [0, 1],
            'w' : [-1, 0],
            's' : [1, 0]
        }
        
        let newPos = [pos[0] + keyMapping[k][0], pos[1] + keyMapping[k][1]];
        if (newPos[0] < 0 || newPos[0] > this.nCols-1 || newPos[1] < 0 || newPos[1] > this.nRows-1){
            return {allowed: false, pos: pos};
        } else {
            return {allowed: true, pos: newPos}
        };
    }

    /**
     * On-click callback for the grid as a whole. See *onCellClick* for individual cell click listeners.
     * @param {Object} e: Clicked object reference
     * @returns {any}
     */
    onClick(e){}

    /**
     * The draw call that renders all the *pRectangles* in the grid and all overlays.
     * 
     * @returns {any}
     */
    draw(){
        // Draw each of the cells
        this.cells.forEach(cell => {
            cell.obj.draw()
        })

        // Draw each of the overlays
        this.overlays.forEach(overlay => {
            overlay.obj.draw();
        })

    }
}

/*
Classes to add:
    - Slideshow
    - Stages (integrated within game class now) 
    - UI/HUD

Extra thoughts:
    - Better to build with npm and then use webpack - since it depends on lodash and p5.js
    - An animations class would be great - but not hugely useful within the lab
    - Functionality for multiplayer modes would be super, using socket.js or something, but again we need a lab use case first
*/