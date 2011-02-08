var lrAdObject;
var lrAdPlaying = false;
var lrAdDone = false;
var lrPrerollDone = false;
var lrVideoContainerName = "video";
var lrVideoSrc = "";
var lrVideoCurrentTime = 0;
var lrVideoControls = null;

var lrOnAdStart = null;
var lrOnAdEnd = null;
var lrOnInit = null;

var lrVideoContainer;
var lrDebugContainer;

var lrAdQ1 = false;
var lrAdQ2 = false;
var lrAdQ3 = false;

function lrOnContentUpdate(e)
{
    if(lrAdPlaying)
    {
        if(lrAdDone) { lrAdPlaying = false; return; }
        if(lrVideoContainer.currentTime >= lrVideoContainer.duration/4.0 && lrVideoContainer.currentTime < lrVideoContainer.duration/2.0 && !lrAdQ1)
        {
            lrAdQ1 = true;
            if(lrAdObject.trackingevents.firstQuartile) for(i in lrAdObject.trackingevents.firstQuartile) lrTracker(lrAdObject.trackingevents.firstQuartile[i]);
        }
        if(lrVideoContainer.currentTime >= lrVideoContainer.duration/2.0 && lrVideoContainer.currentTime < 3.0*lrVideoContainer.duration/4.0 && !lrAdQ2)
        {
            lrAdQ2 = true;
            if(lrAdObject.trackingevents.midpoint) for(i in lrAdObject.trackingevents.midpoint) lrTracker(lrAdObject.trackingevents.midpoint[i]);
        }
        if(lrVideoContainer.currentTime >= 3.0*lrVideoContainer.duration/4.0 && lrVideoContainer.currentTime < lrVideoContainer.duration && !lrAdQ3)
        {
            lrAdQ3 = true;
            if(lrAdObject.trackingevents.thirdQuartile) for(i in lrAdObject.trackingevents.thirdQuartile) lrTracker(lrAdObject.trackingevents.thirdQuartile[i]);
        }
    }
/*
    else if(!lrVideoContainer.paused)
    {
        roundedTime = Math.round(lrVideoContainer.currentTime*10)/10;
        if(roundedTime<0.5 && !lrPrerollDone)
        {
            lrDisplayAd(0);
            lrPrerollDone = true;
        }
    }
*/
}

function lrOnContentEnd(e)
{
    if(lrAdPlaying)
    {
        if(lrAdObject.trackingevents.complete) for(i in lrAdObject.trackingevents.complete) lrTracker(lrAdObject.trackingevents.complete[i]);
        lrVideoContainer.onclick = function() { return true; };
        for(var c in lrAdObject.companionads) { lrClearCompanion(lrAdObject.companionads[c].width+"x"+lrAdObject.companionads[c].height); }
/*      lrVideoContainer.src = lrVideoSrc; */
        lrVideoContainer.controls = lrVideoControls;
        lrAdDone = true;
/*
        lrVideoContainer.load();
        lrVideoContainer.play();
*/
        
        if(typeof(lrOnAdEnd)=="function") lrOnAdEnd();
    }
}

function lrDisplayAd(t)
{
    if(lrAdPlaying) return;
    
    try 
    {
        if(lrAdObject.linear.mediafiles[0].url=="") return;
    }
    catch(e)
    {
        return;
    }
    
    lrAdPlaying = true;
    lrAdQ1 = false;
    lrAdQ2 = false;
    lrAdQ3 = false;
    
    if(typeof(lrOnAdStart)=="function") lrOnAdStart();
    console.log('prepause');
    lrVideoContainer.pause();
    lrVideoContainer.src = lrAdObject.linear.mediafiles[0].url;
    lrVideoContainer.controls = false;
    lrVideoContainer.onclick = function() { window.open(lrAdObject.linear.clickthrough); for(i in lrAdObject.linear.clicktracking) lrTracker(lrAdObject.linear.clicktracking[i]); };
    console.log(lrVideoContainer);
    lrVideoContainer.load();
    lrVideoContainer.play();
    for(var c in lrAdObject.companionads) { lrDisplayCompanion(lrAdObject.companionads[c].width+"x"+lrAdObject.companionads[c].height, lrAdObject.companionads[c].resourceType=="static" ? "image" : "iframe", lrAdObject.companionads[c].url, lrAdObject.companionads[c].clickthrough, new Array()); }
    
    if(lrDebugContainer) lrDebugContainer.innerHTML += "Playing video ad: "+lrAdObject.linear.mediafiles[0].url+"<br />";

    for(i in lrAdObject.impression) lrTracker(lrAdObject.impression[i]);
}

function lrJSONHandle(obj, videoContainer)
{
    console.log(obj);
    lrAdObject = obj;
    
    lrVideoContainer = document.getElementById(videoContainer=="" ? lrVideoContainerName : videoContainer);
    if(!lrVideoContainer) return;
    
    lrVideoSrc = lrVideoContainer.currentSrc;
    lrVideoControls = lrVideoContainer.controls;
    
    lrVideoContainer.addEventListener("timeupdate", lrOnContentUpdate, true);
    lrVideoContainer.addEventListener("ended", lrOnContentEnd, true);
    
    if(typeof(lrOnInit)=="function") lrOnInit();
    
    lrDebugContainer = document.getElementById("lrDebug");
}

function lrTracker(url)
{
    var pixel = document.createElement('img');
    pixel.style.display = "none";
    pixel.width = 1;
    pixel.height = 1;
    pixel.src = url;
    lrVideoContainer.parentNode.insertBefore(pixel, lrVideoContainer);
    
    if(lrDebugContainer) lrDebugContainer.innerHTML += "Firing beacon: "+url+"<br />";
}

var headID = document.getElementsByTagName("head")[0];
var newScript = document.createElement('script');
newScript.type = 'text/javascript';
newScript.src = 'http://cdn-static.liverail.com/js/companions.js';
headID.appendChild(newScript);