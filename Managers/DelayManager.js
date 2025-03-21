/*
DelayManager.js
Version: 1.0.0
Description: A utility script for managing delayed function execution with support for time-based and frame-based delays, looping, tagging, and purging.
Author: Bennyp3333 [https://benjamin-p.dev]

 ==== Usage ====

Add this script to the Scene and access it with:

global.Delay
global.DelayManager

Or import it as a module with:

const DelayManager = require("./DelayManager");

 ==== Examples ====

 - Creating a new Delay

    - Basic Example:

    var myDelay = new global.Delay();
    myDelay.setFunc(function(){
        print("Delayed function executed!");
    });
    myDelay.setTime(3);
    myDelay.start();

    or

    var myDelay = new global.Delay({
        func: function(){
            print("Delayed function executed!");
        },
        time: 3
    });


    - Intermediate Example:

    var localDelayManager = new global.DelayManager(script);
    var myDelay = localDelayManager.Delay({
        func: function(arg1, arg2){
            print("Delayed function executed!");
            print("Arguments: " + arg1 + ", " + arg2);
        },
        args: ["Hello", 123],
        time: 2,            // Delay of 2 seconds
        loops: 3,           // Execute the function 3 times
        tags: ["myTag", "important"],   // Assign tags for later management
        bindToDelay: true,  // Bind 'this' context to the ManagedDelay instance
        persistent: true,  // Delay will be purged after completion
        startOnCreate: false,// Starts the delay immediately upon creation
        frames: 60,         // alternative to time, will delay 60 frames.
        onComplete: function(){
            print("delay complete");
        }
    });

 ==== API ====

 - ManagedDelay

    - Delay Control Methods

        myDelay.start()     // Starts the delay.
        myDelay.pause()     // Pauses the delay.
        myDelay.resume()    // Resumes the paused delay.
        myDelay.stop()      // Stops the delay and purges it.
        myDelay.triggerNow()    // Executes the function immediately and purges the delay.

    - Configuration Methods

        myDelay.setFunc(func)       // Sets the function to call.
        myDelay.setArgs(args)       // Sets the arguments to pass to the function.
        myDelay.setFrames(framesCount)  // Sets the delay to use frames instead of time.
        myDelay.setTime(time)       // Sets the delay to use time instead of frames.
        myDelay.setLoops(count)     // Sets the number of loops.
        myDelay.onComplete(callback)// Sets the onComplete callback.
        myDelay.addTag(tag)         // Adds a tag to the delay.
        myDelay.clearTags()         // Removes all tags from the delay.
        myDelay.setPersistent(persistent)   // Sets the delay to persistent.
        myDelay.bindToSelf(bool)    // Sets the context of the function to the delay object.

    - Accessing Delay Information

        myDelay.getTime()       // Returns the delay time (in seconds) or null if frames are used.
        myDelay.getTimeLeft()   // Returns the time left (in seconds) or null if frames are used.
        myDelay.getFrames()     // Returns the delay frame count or null if time is used.
        myDelay.getFramesLeft() // Returns the frame count left or null if time is used.
        myDelay.isWaiting()     // Returns true if the delay is waiting for time/frames.
        myDelay.isRunning()     // Returns true if the delay is running.
        myDelay.isPaused()      // Returns true if the delay is paused.
        myDelay.getLoopsLeft()  // Returns the number of loops remaining.

 - DelayManager

    - Controlling Delays by Tag

        global.stopDelays();        // Stops all delays for global DelayManager.
        localDelayManager.stopDelays(); // Stops all delays for local DelayManager.
        global.stopDelays("myTag");     // Stops all delays with the "myTag" tag (optional).
        global.pauseDelays("myTag");    // Pauses all delays with the "myTag" tag (optional).
        global.resumeDelays("myTag");   // Resumes all delays with the "myTag" tag (optional).

    - Other

        localDelayManager.delays    // Array of managed delays.
        DelayManager.globalInstance // Global instance of the DelayManager.


 ==== Notes ====

 - Use either tags or create a local DelayManager to stop specific groups of delays
 - Delays are automatically purged when completed (unless persistent is set to true).
 - Delays that have been purged cannot be started again. 
 - If you intend on using a delay more than once, set persistent to true
 - Tags allow for grouped management of delays.
 - Frame-based delays offer more precise timing than time-based delays.
 - If both frames and time are set, frames take priority.

*/

//@input bool debugLogs = false

var debug = script ? script.debugLogs : false;
var delayIdCounter = 100;

function Delay(options){
    return DelayManager.globalInstance.Delay(options);
}

function stopDelays(tag){
    DelayManager.globalInstance.stopDelays(tag);
}

var DelayManager = function(ownerScript){
    this.ownerScript = ownerScript;
    this.delays = [];
}

DelayManager.prototype.Delay = function(options){
    var manager = this;
    var delay = new ManagedDelay(manager, options);
    manager.delays.push(delay);
    if(debug){ print("[DelayManager] Created delay " + delay.id); }
    return delay;
};

DelayManager.prototype.stopDelays = function(tag){
    if(debug){
        if(tag){
            print("[DelayManager] Stopping delay with tag: " + tag);
        }else{
            print("[DelayManager] Stopping all delays.");
        }
    }
    for(var i = this.delays.length - 1; i >= 0; i--){
        if(!tag || this.delays[i].tags.includes(tag)){
            this.delays[i].stop();
        }
    }
    this.purge();
    return this.delays;
};

DelayManager.prototype.pauseDelays = function(tag) {
    if (debug) {
        if (tag) {
            print("[DelayManager] Pausing delays with tag: " + tag);
        } else {
            print("[DelayManager] Pausing all delays.");
        }
    }
    for (var i = this.delays.length - 1; i >= 0; i--) {
        if (!tag || this.delays[i].tags.includes(tag)) {
            this.delays[i].pause();
        }
    }
    return this.delays;
};

DelayManager.prototype.resumeDelays = function(tag) {
    if (debug) {
        if (tag) {
            print("[DelayManager] Resuming delays with tag: " + tag);
        } else {
            print("[DelayManager] Resuming all delays.");
        }
    }
    for (var i = this.delays.length - 1; i >= 0; i--) {
        if (!tag || this.delays[i].tags.includes(tag)) {
            this.delays[i].resume();
        }
    }
    return this.delays;
};

DelayManager.prototype.purge = function(){
    for(var i = this.delays.length - 1; i >= 0; i--){
        var delay = this.delays[i];
        if(delay.completed && !delay.persistent){
            this.delays.splice(i, 1);
            delay.purged = true;
            if(debug){ print("[DelayManager] Purged delay " + delay.id); }
        }
    }
};

function ManagedDelay(manager, options){
    var self = this;
    options = options || {};

    this.id = ++delayIdCounter;
    this.createTime = getTime();
    this.startTime = null;
    
    this.func = options.func || function(){};
    
    if(options.args !== undefined){
        if(Array.isArray(options.args)){
            this.args = options.args;
        }else{
            this.args = [options.args];
        }
    }else{
        this.args = [];
    }
    
    this.manager = manager;
    
    if(options.tags !== undefined){
        if(Array.isArray(options.tags)){
            this.tags = options.tags;
        }else{
            this.tags = [options.tags];
        }
    }else if(options.tag !== undefined){
        this.tags = [options.tag];
    }else{
        this.tags = [];
    }
    
    this.persistent = options.persistent || false;
    this.completed = false;
    this.purged = false;

    var useFrames = options.frames != null;
    var timeWait = Math.max(0, options.time || 0);
    var timeLeft = null;
    var frameWait = Math.round(options.frames || 1);
    var framesLeft = null;
    var loopCount = Math.max(1, Math.round(options.loops || 1));
    
    var onCompleteCallback = options.onComplete || null;
    var bindContextToDelay = options.bindToDelay || false;
    var startOnCreate = options.startOnCreate !== false &&
        (options.func !== undefined) &&
        (options.time !== undefined || options.frames !== undefined);

    var isPaused = false;
    var isRunning = false;
    var waitEvent = null;

    // --- CONFIGURATION ---
    
    this.setFunc = function(func){
        this.func = func;
        return this;
    };
    
    this.setArgs = function(args) {
        if (Array.isArray(args)) {
            this.args = args;
        } else {
            this.args = [args];
        }
        return this;
    };

    this.setFrames = function(framesCount){
        useFrames = true;
        frameWait = Math.round(framesCount || 1);
        return this;
    };

    this.setTime = function(time){
        useFrames = false;
        timeWait = Math.max(0, time || 0);
        return this;
    };

    this.setLoops = function(count){
        loopCount = count;
        return this;
    };

    this.onComplete = function(callback){
        onCompleteCallback = callback;
        return this;
    };

    this.addTag = function(tag){
        this.tags.push(tag);
        return this;
    };

    this.clearTags = function(){
        this.tags = [];
        return this;
    };
    
    this.setPersistent = function(persistent){
        this.persistent = persistent;
        return this;
    };
    
    this.bindToSelf = function(bool){
        bindContextToDelay = (bool == null) ? true : !!bool;
        return this;
    };

    // --- CONTROL METHODS ---

    this.start = function(loopTimes){
        if(this.purged){
            if(debug){ print("[ManagedDelay] Cannot start purged delay " + this.id); }
            return this;
        }
        stopWaitEvent();
        isPaused = false;
        isRunning = true;
        self.startTime = getTime();
        loopCount = (loopTimes != null) ? Math.max(1, Math.round(loopTimes)) : loopCount;

        if(debug){
            startMessage = "[ManagedDelay] Started delay " + this.id;
            if(useFrames){
                startMessage += " with frames: " + frameWait;
            }else{
                startMessage += " with time: " + timeWait;
            }
            
            if(loopCount > 1){
                startMessage += ", loops: " + loopCount;
            }
            
            print(startMessage);
        }

        if(useFrames){
            if(frameWait === 0){
                self.triggerNow();
            }else{
                framesLeft = frameWait;
                waitEvent = self.manager.ownerScript.createEvent("UpdateEvent");
                waitEvent.bind(onFrameUpdate);
            }
        }else{
            if(timeWait === 0){
                self.triggerNow();
            }else{
                timeLeft = timeWait;
                waitEvent = self.manager.ownerScript.createEvent("DelayedCallbackEvent");
                waitEvent.bind(onTimeComplete);
                waitEvent.reset(timeLeft);
            }
        }
        return this;
    };

    this.pause = function(){
        if(!isRunning || isPaused) return this;
        isPaused = true;

        if(!useFrames && waitEvent && waitEvent.getTimeLeft){
            timeLeft = waitEvent.getTimeLeft();
        }
        stopWaitEvent();
        if(debug){ print("[ManagedDelay] Paused delay " + this.id); }
        return this;
    };

    this.resume = function(){
        if(!isPaused) return this;
        isPaused = false;
        isRunning = true;
        

        if(useFrames){
            waitEvent = self.manager.ownerScript.createEvent("UpdateEvent");
            waitEvent.bind(onFrameUpdate);
        }else{
            waitEvent = self.manager.ownerScript.createEvent("DelayedCallbackEvent");
            waitEvent.bind(onTimeComplete);
            waitEvent.reset(timeLeft);
        }
        if(debug){ print("[ManagedDelay] Resumed delay " + this.id); }
        return this;
    };

    this.stop = function(){
        if(!isRunning) return this;
        stopWaitEvent();
        isRunning = false;
        isPaused = false;
        self.completed = true;
        if(debug){ print("[ManagedDelay] Stopped delay " + this.id); }
        this.manager.purge();
        return this;
    };

    this.triggerNow = function(overrideArgs){
        stopWaitEvent();
        var callArgs = overrideArgs || self.args;
        execute(callArgs);
        isRunning = false;
        isPaused = false;
        self.completed = true;
        if(debug){ print("[ManagedDelay] Triggered delay " + this.id + " immediately."); }
        self.manager.purge();
        return this;
    };

    // --- GETTERS ---

    this.getTime = function(){ return useFrames ? null : timeWait; };
    this.getTimeLeft = function(){
        if(useFrames) return null;
        if(isPaused) return timeLeft;
        if(waitEvent && waitEvent.getTypeName() == "DelayedCallbackEvent"){
            return waitEvent.getTimeLeft();
        }
        return null;
    };
    this.getFrames = function(){ return useFrames ? frameWait : null; };
    this.getFramesLeft = function(){ return useFrames ? framesLeft : null; };
    this.isWaiting = function(){ return !!waitEvent; };
    this.isRunning = function(){ return isRunning; };
    this.isPaused = function(){ return isPaused; };
    this.getLoopsLeft = function(){ return loopCount; };

    // --- PRIVATE HELPERS ---

    function onFrameUpdate(){
        if(framesLeft <= 0){
            execute(self.args);
            if(loopCount < 0){
                framesLeft = frameWait;
            }else if(loopCount > 1){
                loopCount--;
                framesLeft = frameWait;
            }else{
                stopWaitEvent();
                triggerOnComplete();
            }
        }else{
            framesLeft--;
        }
    }

    function onTimeComplete(){
        execute(self.args);
        if(loopCount < 0){
            waitEvent.reset(timeWait);
        }else if(loopCount > 1){
            loopCount--;
            waitEvent.reset(timeWait);
        }else{
            stopWaitEvent();
            triggerOnComplete();
        }
    }

    function stopWaitEvent(){
        if(waitEvent){
            self.manager.ownerScript.removeEvent(waitEvent);
            waitEvent = null;
        }
    }

    function triggerOnComplete(){
        isRunning = false;
        isPaused = false;
        self.completed = true;
        if(debug){ print("[ManagedDelay] Completed delay " + self.id); }
        self.manager.purge();
        if(onCompleteCallback){
            onCompleteCallback();
        }
    }
    
    function execute(args){
        if(bindContextToDelay){
            self.func.apply(self, args);
        }else{
            self.func.apply(null, args);
        }
    }
    
    if(debug){ print("[ManagedDelay] Initialized delay " + this.id); }
    
    if(startOnCreate){
        this.start();
    }

    return this;
};

if(script){
    DelayManager.globalInstance = new DelayManager(script);
    global.DelayManager = DelayManager;
    global.Delay = Delay;
    global.stopDelays = stopDelays;
}else{
    module.exports = DelayManager;
}