'use strict'

export { start, pause, stopAndClearCanvas};
import * as rand from './rand';
import * as utils from './utils';
import * as main from './main';
import * as fractalDim from './fractalDim';
import {Point} from './commonClasses';

const seedSize = 2;
const insertMargin = 10;
const aggregatedCountPerFrame = 50;
const domainMargin = 12;


let aggregatedCount = 0;
let currentMaxRadius = 0;
let isStop = false;

let cdt;


function start() {
    utils.logger('Run now: start');
    cdt = main.context.getImageData(0, 0, main.canvasWidth, main.canvasHeight);
    isStop = false;
    draw();

}

function stopAndClearCanvas() {
    utils.logger('Run now: clearCanvas');
    isStop = true;

    main.context.clearRect(0, 0, main.canvas.width, main.canvas.height);
    main.context.fillStyle = 'rgba(255, 0, 0, 255)';
    main.context.arc(main.seedX, main.seedY, seedSize, 0, 2 * Math.PI);
    main.context.fill()
    aggregatedCount = 0;
    currentMaxRadius = 0;
    document.getElementById("pts").innerHTML = aggregatedCount;
    document.getElementById("size").innerHTML = currentMaxRadius;
    document.getElementById("fdim").innerHTML = "-";
    cdt = main.context.getImageData(0, 0, main.canvasWidth, main.canvasHeight);
}

function pause() {
    utils.logger('Run now: pause');
    isStop = true;
}

function draw() {
    utils.logger('Run now: draw');

  
    for (let i = 0; i < aggregatedCountPerFrame; i++) {

        let newPostition = new Point(0,0);
        let randCircularPosition = rand.getRandUniformCircularPosition(currentMaxRadius + insertMargin, main.seedX, main.seedY);
        let xStart = randCircularPosition.x;
        let yStart = randCircularPosition.y; 
        let isNotAggregated = true;

        while (isNotAggregated) { //dopoki nie zagreguje

            if (currentMaxRadius > main.maxAggregateRadius)
                return;
            let jumps = rand.getRandJump(main.horizontalDrift, main.verticalDrift);


            newPostition.x = xStart + jumps.xJump;
            newPostition.y = yStart + jumps.yJump;

            //utils.logger('from draw:' + newX, newY, maxRadius + domainMargin, isValid(newX, newY, maxRadius + domainMargin));
            if (!isJumpWithinDomain(newPostition, currentMaxRadius + domainMargin)) { //jezeli chce wyskoczyć poza obszar to stoj w miejscu
                newPostition.x = xStart;
                newPostition.y = yStart;
            }
            else {

                if (isAggregate(newPostition, cdt)) { //jeżęli chce wskoczyć tam gdzie juz jest czastka
                    if (isGetAggregated()) { //jezeli ma sie przykleic
                        drawPixel(xStart, yStart, 255, 0, 0, 255, cdt);
                        let currentAggregatedRadius = coordinatedToRadius(xStart - main.seedX, yStart - main.seedY);
                        //let tempmax = Math.floor(Math.sqrt((xStart - main.seedX) * (xStart - main.seedX) + (yStart - main.seedY) * (yStart - main.seedY)));
                        //utils.logger(newX, newY, maxRadius);
                        if (currentAggregatedRadius > currentMaxRadius) {
                            currentMaxRadius = currentAggregatedRadius;
                            //utils.logger(newX, newY, maxRadius);
                        }
                        aggregatedCount++;
                        // if (counter === 500)
                        //     diagnostic(cdt);
                        isNotAggregated = false;
                    }
                    else  //chce skoczyc na agregat ale nei chce sie przykleic to stoj w miejscu
                    {
                        newPostition.x = xStart;
                        newPostition.y = yStart;
                    }
                }

                else { //nie ma agrgatu i nie chce wyskoczyć poza obszar
                    xStart = newPostition.x;
                    yStart = newPostition.y;
                }
            }
        }
    }
    if (!isStop) {
        //utils.logger('Updatig canvas!')

        updateCanvas(main.context, cdt);
        fractalDim.fractalDim(main.seedX, main.seedY, currentMaxRadius, cdt, isAggregate);
        document.getElementById("pts").innerHTML = aggregatedCount;
        document.getElementById("size").innerHTML = currentMaxRadius;
        window.requestAnimationFrame(draw);
    }
}
function isJumpWithinDomain(newPostion, maxR) {
    //utils.logger('Run now: isvalid');
    let relativeX = newPostion.x - main.seedX;
    let relativeY = newPostion.y - main.seedY;
    //utils.logger('fromisvalid' +'x:' + xx + ' y:' + yy + ' maxR:' + maxR + ' isValid:'+  isValidd);
    return (coordinatedToRadius(relativeX ,relativeY) <=  maxR);
}

function isAggregate(position, canvasData) {
    //utils.logger('Run now: isAggregate');
    let index = (position.x + position.y * main.canvasWidth) * 4;
    return canvasData.data[index] === 255;
}

function isGetAggregated() {
    //utils.logger('Run now: shouldStick');

    return (rand.getRandUniformBool() < main.stickProbability);
}

function drawPixel(x, y, r, g, b, a, canvasData) {
    //utils.logger('Run now: drawPixel');

    let index = (x + y * main.canvasWidth) * 4;
    canvasData.data[index + 0] = r;
    canvasData.data[index + 1] = g;
    canvasData.data[index + 2] = b;
    canvasData.data[index + 3] = a;
}

function updateCanvas(ctx, canvasData) {
    //utils.logger('Run now: updateCanvas');
    ctx.putImageData(canvasData, 0, 0);
}

function maxInscribedCircleRadius(x,y){
    let minDim = Math.min(x,y);
    return (coordinatedToRadius(minDim));
}

function coordinatedToRadius(x, y){
    return  Math.floor(Math.sqrt(x*x + y*y));
  
}

