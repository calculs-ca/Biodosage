import * as d3 from "d3"
import _ from 'lodash'
import { standardCurveData, leastSquares } from "./labDeskReducer.jsx"
import { toolFuncs } from "./toolFuncs.js"
import { spectroLecture } from "./niveaux.js"

const f2 = d3.format("0.2f")


export const drawSvgLabDesk = (width, height) => {

    d3.select('#topSvg').html("")

    const svgScreen = d3.select('#topSvg')
        .append('svg')
        .attr('id', 'rootSvg')
        .attr('z-index', 0)
        .attr("class", "screen")
        .attr('width', width)
        .attr('height', height)


    const arrowColor = "#ffeb3b"

    svgScreen.append("defs")
        .append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 0 12 12")
        .attr("refX", 6)
        .attr("refY", 6)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .attr("fill", arrowColor)
        .append("path")
        .attr("d", "M2,2 L10,6 L2,10 L6,6 L2,2");

    svgScreen.append("line")
        .attr("id", "flecheDroite")
        .attr("x1", 600)
        .attr("y1", 100)
        .attr("x2", 800)
        .attr("y2", 100)
        .attr("stroke", arrowColor)
        .attr("stroke-width", 20)
        .attr("marker-end", "url(#arrow)")

    return svgScreen
}

const wheel = ({svgScreen, wheelsWindow, wheelIdx, wheelRanges, ul, pipetteId, wheelValues, dispatch}) => {


    const rulerFontSize = "1.8em"

    const [rulerFontWidth, rulerFontHeight] = (() => {
        const d = svgScreen.append("text")
            .text("dummy")
            .attr("font-size", rulerFontSize)
        const res = d.node().getBBox()
        d.remove()
        return [
            res.width,
            res.height
        ]
    })()

    // ,
    const wheelRangeMax = wheelRanges[wheelIdx] + 1

    const [wheelsWindowX, wheelsWindowY] = [0, -25]
    const translateWheelView = e =>
        e.attr("transform", `translate(${0},50)`)


    const wheelRectangle = wheelsWindow.append("g")
        .attr("id", pipetteId)
        .attr("transform", `translate(0,${wheelIdx * 52})`)


    const ticks = [..._.range(wheelRangeMax), 0]


    const grad = d3.scaleLinear()
        .domain([0, 6])
        .range([0, 300])

    const ruler = wheelRectangle.append("g")
        .attr("class", "wheel-ruler")
        .call(translateWheelView)
        .attr("clip-path", "url(#cp)")


    const value = wheelValues[wheelIdx]

    const wheelPos = grad(1) - grad(value)

    const slider = ruler.append("g")
        .attr("class", `wheel-${wheelIdx}`)
        .attr("transform", `translate(${wheelPos}, 0)`)

    const tickStartOffset = -12

    ticks.forEach((tick, idx) => {

        const tickX = grad(idx) + 8 + tickStartOffset

        slider.append("line")
            .attr("x1", tickX)
            .attr("y1", 3)
            .attr("x2", tickX)
            .attr("y2", 8)
            .attr("stroke-width", 2)
            .attr("stroke", "black")

        if(wheelIdx === 2) {
            for(let i = 1; i <= 5; i++) {
                const tick_i = grad(idx + i / 5.0) + 8 + tickStartOffset
                slider.append("line")
                    .attr("x1", tick_i)
                    .attr("y1", 3)
                    .attr("x2", tick_i)
                    .attr("y2", 8)
                    .attr("stroke-width", 1)
                    .attr("stroke", "blue")
            }
        }

        slider.append("text")
            .text("" + tick)
            //.attr("fill", "currentColor")
            .attr("font-weight", "bold")
            .attr("class", `pipette-wheel-digit-${wheelIdx}`)
            .attr("x", grad(idx) + tickStartOffset)
            .attr("y", 0)
            .attr("font-size", rulerFontSize)

    })



    const wheelWindowProps = enlargeDelta => e => {
        const width = 90
        e.attr("width", width + enlargeDelta)
            .attr("x", wheelsWindowX - enlargeDelta)
            .attr("y", wheelsWindowY - enlargeDelta)

    }


    wheelWindowProps(0)(
        wheelRectangle.append("clipPath")
            .attr("id", "cp")
            .append("rect")
            .attr("height", 40)
    )


    wheelWindowProps(3)(
        wheelRectangle.append("rect")
            .call(translateWheelView)
            .attr("fill", "none")
            .attr("rx", "2")
            .attr("stroke-width", 0.5)
            .attr("stroke", "black")
            .attr("height", 40)
    )

    // add wheel cursor
    wheelRectangle
        .append("g")
        .attr("transform", `translate(${46}, 68)`)
        .append("path")
        .attr("stroke", "black")
        .attr("d", d3.symbol().type(d3.symbolTriangle).size(20))
    //.attr("transform", `rotate(${isRight ? 90 : -90})`)


    const triangle = d3.symbol()
        .type(d3.symbolTriangle)
        .size(200)

    const arrow = (x, y, { isRight }) =>
        wheelRectangle
            .append("g")
            .attr("transform", `translate(${x},${y})`)
            .append("path")
            .attr("opacity", 0.5)
            .attr("stroke", "black")
            .attr("d", triangle)
            .attr("transform", `rotate(${isRight ? 90 : -90})`)
            .on("mouseover", function () {
                d3.select(this)
                .attr("opacity", 1)
                .attr("stroke-width", 3)
            })
            .on("mouseout", function () {
                d3.select(this)
                .attr("opacity", 0.5)
                .attr("stroke-width", 1)
            })

    const roll = (wheelIdx, isForward, isSpeedButton=false) =>
        dispatch({ type: "roll", wheelIdx, isForward, isSpeedButton })

    // minor adjust
    arrow(120, 40, { isRight: true })
        .on("click", function (ev) {
            roll(wheelIdx, true)
            ev.stopPropagation()
        })

    arrow(-30, 40, { isRight: false })
        .on("click", function (ev) {
            roll(wheelIdx, false)
            ev.stopPropagation()
        })

    if (wheelIdx === 2) {

        arrow(160, 40, { isRight: true })
            .on("click", function (ev) {
                roll(wheelIdx, true, true)
                ev.stopPropagation()
            })

        arrow(-60, 40, { isRight: false })
            .on("click", function (ev) {
                roll(wheelIdx, false, true)
                ev.stopPropagation()
            })
    }
}

const toolMouseHandler = (element, toolId, dispatch) => {

    element.on("click", () => dispatch({ type: "dumpTool", toolId}))

    element.on("mouseover", () => dispatch({ type: "mouseOverTool", toolId, element }))

    element.on("mouseout", () => dispatch({ type: "mouseOutTool", toolId, element }))

    element.call(
        d3.drag()
        .on("start", event => {
            dispatch({ type: 'dragStart', toolId, element, event })
        })
        .on("drag", event => {
            dispatch({ type: 'drag', toolId, element, event })
        })
        .on("end", event => {
            dispatch({ type: 'dragEnd', toolId, element, event })
        })
    )
}

const activeBlue = "#2196f3cf"

const drawActions = ({ actions, group, xActionCursorStart, yActionCursorStart, fontSize, radius = 5, dispatch, yIncrement=25}) => {

    let yActionCursor = yActionCursorStart

    actions.forEach(action => {

        let xActionCursor = xActionCursorStart

        group.append("circle")
            .attr("class", `action-${action.type}`)
            .attr("cy", yActionCursor - 5)
            .attr("cx", xActionCursor)
            .attr("r", radius)
            .attr("fill", activeBlue)
            .attr("opacity", action.isVisible)
            .on("click", () => dispatch(action))

        xActionCursor += 10

        group.append("text")
            .attr("class", `action-${action.type}`)
            .text(action.name)
            .attr("y", yActionCursor)
            .attr("x", xActionCursor)
            .attr("font-size", fontSize)
            .attr("cursor", "default")
            .attr("opacity", action.isVisible)
            .on("click", () => dispatch(action))

        if (action.name2) {
            group.append("text")
                .attr("class", `action-${action.type}`)
                .text(action.name2)
                .attr("y", yActionCursor+15)
                .attr("x", xActionCursor)
                .attr("font-size", fontSize)
                .attr("cursor", "default")
                .attr("opacity", action.isVisible)
                .on("click", () => dispatch(action))
        }

        yActionCursor += yIncrement
    })
}

const drawPipette = (svgScreen, dispatch, toolId, { wheelRanges, wheelValues, id: pipetteId, height: toolHeight, ul, label, labelOffset, actions }) => {

    const pipetteGroup = svgScreen.append("g")

    pipetteGroup.attr("id", toolId)

    pipetteGroup.append("text")
        .text(label)
        .attr("y", -8)
        .attr("x", labelOffset)
        .attr("font-size", "2.4em")
        .attr("cursor", "default")

    pipetteGroup.append("text")
        .text("[0 μl]")
        .attr("class", "pipette-config")
        .attr("font-size", "2em")
        .attr("cursor", "default")
        .attr("y", -8)
        .attr("x", 250 + labelOffset)

    drawActions({
        actions,
        toolId,
        group: pipetteGroup,
        xActionCursorStart: 200,
        yActionCursorStart: 142,
        fontSize: "1.6em",
        radius: 10,
        dispatch,
        yIncrement: 50
    })

    toolMouseHandler(pipetteGroup, toolId, dispatch)

    const pipetteStartX = 40
    const pipetteStartY = 70

    //piston head

    pipetteGroup.append("rect")
        .attr("fill", "grey")
        .attr("rx", "2")
        .attr("id", `tool-${toolId}`)
        .attr("class", "tool-contour")
        .attr("stroke-width", 0.5)
        .attr("stroke", "black")
        .attr("width", 110)
        .attr("height", 20)
        .attr("transform", `translate(${pipetteStartX - 10}, ${pipetteStartY-70})`)

    //piston shaft
    pipetteGroup.append("rect")
        .attr("fill", "grey")
        .attr("rx", "2")
        .attr("class", "tool-contour")
        .attr("stroke-width", 0.5)
        .attr("stroke", "black")
        .attr("width", 12)
        .attr("height", 50)
        .attr("transform", `translate(${pipetteStartX + 40}, ${pipetteStartY-50})`)

    // body / main cylinder
    pipetteGroup.append("rect")
        .attr("fill", "white")
        .attr("rx", "2")
        .attr("stroke-width", 0.5)
        .attr("class", "tool-contour")
        .attr("stroke", "black")
        .attr("width", 110)
        .attr("height", 250)
        .attr("transform", `translate(${pipetteStartX - 10}, ${pipetteStartY})`)

    const wheelsWindow =
        pipetteGroup.append("g")
            .attr("transform", `translate(${pipetteStartX}, ${pipetteStartY})`)


    wheelValues.forEach( (value, idx) => {
        //wheel(wheelsWindow, idx, 0, idx * 52)
        wheel({ svgScreen, wheelsWindow, wheelIdx: idx, x: 0, y: idx * 52, ul, wheelRanges, pipetteId, wheelValues, dispatch})
    })


    pipetteGroup.append("text")
        //.attr("opacity", "0")
        .text("P?")
        .attr("class", "pipette-label")
        .attr("font-size", "2em")
        .attr("cursor", "default")
        .attr("transform", `translate(${pipetteStartX + 8}, ${pipetteStartY + 230})`)

    const rectFunc = (topWidth, lowerWidth, height) => {

        const lowerMargin = (topWidth - lowerWidth) / 2

        const p = d3.path()
        p.moveTo(0, 0)
        p.lineTo(topWidth, 0)
        p.lineTo(lowerMargin + lowerWidth, height)
        p.lineTo(lowerMargin, height)
        p.closePath()

        return [pipetteGroup
            .append("path")
            .attr("d", p), p]
    }


    rectFunc(110, 80, 100)[0]
        //.attr("transform", `translate(-10, 310)`)
        .attr("transform", `translate(${pipetteStartX - 10}, ${pipetteStartY + 250})`)
        .attr("stroke-width", 0.5)
        .attr("class", "tool-contour")
        .attr("stroke", "black")
        .attr("fill", "grey")


    // embout :
    pipetteGroup.append("rect")
        .attr("transform", `translate(${pipetteStartX + 30}, ${pipetteStartY + 250 + 100})`)
        .attr("width", 30)
        .attr("height", 10)
        .attr("class", "tool-contour embout embout-all")
        .attr("stroke-width", 0.5)
        .attr("fill", "none")
        .attr("stroke", "black")


    const [tipPath, tipPathDatum] = rectFunc(20, 10, 120)

    tipPath
        .attr("transform", `translate(${pipetteStartX + 35}, ${pipetteStartY + 360})`)
        .attr("stroke-width", 0.5)
        .attr("class", "tool-contour embout embout-all")
        .attr("stroke", "black")
        .attr("fill-opacity", "0.5")
        .attr("fill", "none")


    const tipPathId = `tip-path-${toolId}`

    pipetteGroup.append("clipPath")
        .attr("id", tipPathId)
        .append("path")
        .attr("d", tipPathDatum)
        .attr("x", 70)
        .attr("y", 570)

    pipetteGroup.append("rect")
        .attr("class", "liquid")
        .attr("transform", `translate(${pipetteStartX + 35}, ${pipetteStartY + 360})`)
        .attr("height", 110)
        .attr("width", 30)
        .attr("fill", "#03a9f4")
        .attr("clip-path", `url(#${tipPathId})`)

    pipetteGroup.attr("transform", "scale(0.5)")

    return pipetteGroup
}


const changerEmbout = (state) => {

    d3.selectAll(".embout")
        .transition().duration(500)
        .style("opacity", 0)
        .transition().duration(2000)
        .style("opacity", 1)
}


const drawTube = (svgScreen, dispatch, toolId, { width, height, label, labelOffset, actions}) => {


    const tapperStartY = Math.round(height * 0.4)


    const p = d3.path()
    p.moveTo(0, 0)

    const cpx1 = 0
    const cpy1 = Math.round(height * 0.5)

    const cpx2 = Math.round(width * 0.1)
    const cpy2 = Math.round(height * 0.9)


    const p3 = [width - cpx2 - cpx2, cpy2]

    const controlPoints = [

        [cpx1, cpy1],
        [cpx2, cpy2],

        p3,
        [width, cpy1]
    ]


    p.bezierCurveTo(
        controlPoints[0][0], controlPoints[0][1],
        controlPoints[1][0], controlPoints[1][1],
        width/2, height
    )

    p.bezierCurveTo(
        controlPoints[2][0], controlPoints[2][1],
        controlPoints[3][0], controlPoints[3][1],
        width, 0
    )

    p.closePath()

    const tubeGroup = svgScreen.append("g")
        .attr("id", toolId)
        .attr('pointer-events', 'all')

    tubeGroup.append("text")
        .text(label)
        .attr("class", "tube-label")
        .attr("y", -24)
        .attr("x", -16 + labelOffset)
        .attr("font-size", "1.3em")
        .attr("cursor", "default")

    tubeGroup.append("text")
        .text("")
        .attr("class", "tube-content-label")
        .attr("y", -7)
        .attr("x", -16)
        .attr("font-size", "0.9em")
        .attr("cursor", "default")

    drawActions({
        actions,
        group: tubeGroup,
        yActionCursorStart: 40,
        xActionCursorStart: 70,
        fontSize: "1em",
        dispatch
    })

    const tubePathId = `tube-path-${toolId}`

    const cp = tubeGroup.append("clipPath")
        .attr("id", tubePathId)
        .append("path")
        .attr("d", p)

    tubeGroup.append("path")
        .attr("d", p)
        .attr("fill", "none")
        .attr("stroke-width", 0.5)
        .attr("stroke", "black")
        .attr("class", "tool-contour")

    tubeGroup.append("rect")
        .attr("class", "liquid")
        .attr("height", height)
        .attr("width", width)
        .attr("y", 50)
        .attr("fill", "#03a9f4")
        .attr("clip-path", `url(#${tubePathId})`)

    toolMouseHandler(tubeGroup, toolId, dispatch)

    return tubeGroup
}



const drawCuvette = (svgScreen, dispatch, toolId, { width, height, label, actions }) => {

    const cuvetteGroup = svgScreen.append("g")
        .attr("id", `${toolId}`)
        .attr('pointer-events', 'all')

    drawActions({
        actions,
        group: cuvetteGroup,
        yActionCursorStart: 40,
        xActionCursorStart: 60,
        fontSize: "1em",
        dispatch
    })

    cuvetteGroup.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "white")
        .attr("stroke-width", 0.5)
        .attr("stroke", "black")
        .attr("class", "tool-contour")

    cuvetteGroup.append("text")
        .text(label)
        .attr("class", "tube-label")
        .attr("y", -24)
        .attr("x", -16)
        .attr("font-size", "1.3em")
        .attr("cursor", "default")

    cuvetteGroup.append("text")
        .text("")
        .attr("class", "tube-content-label")
        .attr("y", -7)
        .attr("x", -36)
        .attr("font-size", "0.6em")
        .attr("cursor", "default")

    const tubePathId = `tube-path-${toolId}`

    const cp = cuvetteGroup.append("clipPath")
        .attr("id", tubePathId)
        .append("rect")
        .attr("width", width)
        .attr("height", height)


    cuvetteGroup.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "white")
        .attr("stroke-width", 0.5)
        .attr("stroke", "black")
        .attr("class", "tool-contour")
        .attr("class", "liquid")
        .attr("y", height)
        .attr("fill", "#03a9f4")
        .attr("clip-path", `url(#${tubePathId})`)


    toolMouseHandler(cuvetteGroup, toolId, dispatch)

    return cuvetteGroup
}

const drawSpectrometer = (svgScreen, dispatch, toolId, { width, height, label, actions }) => {

    const spectroGroup = svgScreen.append("g")
        .attr("id", toolId)
        .attr('pointer-events', 'all')

    toolMouseHandler(spectroGroup, toolId, dispatch)

    spectroGroup.append("text")
        .text(label)
        .attr("class", "tube-label")
        .attr("y", -24)
        .attr("x", -16)
        .attr("font-size", "1.3em")
        .attr("cursor", "default")

    spectroGroup.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "none")
        .attr("rx", 12)
        .attr("ry", 12)
        .attr("stroke-width", 0.5)
        .attr("stroke", "black")
        .attr("class", "tool-contour")



    const lcdDisplay = (x, y, unit, textClass) => {
        spectroGroup.append("rect")
            .attr("width", 73)
            .attr("height", 28)
            .attr("x", x)
            .attr("y", y)
            .attr("fill", "#555575")
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("stroke-width", 1)
            .attr("stroke", "black")

        spectroGroup.append("text")
            .text("0")
            .attr("class", textClass)
            .attr("width", 79)
            .attr("height", 28)
            .attr("x", x + 3)
            .attr("y", y + 24)
            .attr("font-size", "1.4em")
            .attr("fill", "yellow")

        spectroGroup.append("text")
            .text(unit)
            .attr("width", 10)
            .attr("x", x + 82)
            .attr("y", y+ 26)
            .attr("font-size", "1em")

    }

    lcdDisplay(20, 82, "nm", "spectro-adjust")

    lcdDisplay(20, 122, "absorbance", "spectro-lecture")

    /*
    spectroGroup.append("rect")
        .attr("width", 59)
        .attr("height", 28)
        .attr("x", 20)
        .attr("y", 22)
        .attr("fill", "black")
        .attr("stroke-width", 1)
        .attr("stroke", "black")
        .attr("class", "tool-contour")
        */

    drawActions({
        actions,
        group: spectroGroup,
        yActionCursorStart: 180,
        xActionCursorStart: 34,
        fontSize: "1em",
        dispatch
    })


    drawBSAPlot({svgScreen, x: 550, y: 0})


    return spectroGroup

}


const drawFunc = toolId => {
    switch(toolId) {
        case "water-tube":
        case "dna-tube":
        case "work-tube":
            return drawTube
        case "spectrometer":
            return drawSpectrometer
        case "micro-pipette":
            return drawPipette
        case "cuvette":
            return drawCuvette
        case "cuvette2":
            return drawCuvette
        default:
            throw Error(`unknonw tool: ${toolId}`)
    }
}

const drawTools = ({ svgScreen, toolsModels, width, toolAreaHeight, DEBUG, dispatch }) => {

    const toolVerticalSpace = Math.round(width / (toolsModels.length + 1))

    const deskLeftMargin = 40

    const xCursor = (() => {
        let counter = 0
        return () => {
            return toolVerticalSpace * (counter++) + deskLeftMargin
        }
    })()

    const toDraw = []

    toolsModels.forEach(tool => {

        tool.x = xCursor()
        tool.y = toolAreaHeight - tool.args.height + tool.yOffset
        tool.svgScreen = svgScreen


        toDraw.push([
            tool.drawOrder,
            () => drawFunc(tool.id)(svgScreen, dispatch, tool.id, tool.args)
                .attr("transform", `translate(${tool.x}, ${tool.y}) ${tool.id === "micro-pipette" ? "scale(0.6)" : ""}`)
        ])

        if (DEBUG) {
            svgScreen.append("rect")
                .attr("id", `${tool.id}-collisionRect`)
                .attr("x", tool.x)
                .attr("y", tool.y)
                .attr("width", tool.collisionRect.width)
                .attr("height", tool.collisionRect.height)
                .attr("fill", "none")
                .attr("opacity", 0.5)
                .attr("stroke", "black")
                .attr("stroke-width", 1)
        }
    })

    _.sortBy(toDraw, ([idx, o]) => idx).forEach(([idx, drawFunc]) => drawFunc())

    toolsModels.forEach(adjustLiquidLevel(0))
}

const adjustLiquidLevel = (transitionDuration, state) => tool => {

    if (_.isUndefined(tool.args.fillLevel)) {
        return
    }

    if (tool.id === 'micro-pipette' && tool.args.fillLevel === 0) {

        d3.select(`#${tool.id}`)
            .select(".liquid")
            .transition().duration(transitionDuration)
            .attr("y", 800)
        return
    }

    let levelY = tool.args.fillHeight * ((100 - tool.args.fillLevel) / 100)


    if (state) {

        if (tool.id === 'cuvette' || tool.id === 'cuvette2' || tool.id === 'work-tube') {

            const calcLevelY = d3.scaleLinear()
                .domain([0, 1000])
                .range([tool.args.height, 20])

            const tf = toolFuncs(state)

            const c = tf.cuvetteOrWorkTubeContent(tool)

            let v = 0

            if (c.water) {
                v += c.water.volume
            }
            if (c.dna) {
                v += c.dna.volume
            }

            levelY = calcLevelY(v)

            if (v > 0 && v < 100) {
                levelY -= 10
            }
        }
    }

    d3.select(`#${tool.id}`)
        .select(".liquid")
        .transition().duration(transitionDuration)
        .attr("y", levelY)
}



const moveWheel = (wheelIdx, value, transitionTime = 1000, rewindFirst=false) => {

    const grad = d3.scaleLinear()
        .domain([0, 6])
        .range([0, 300])


    if(rewindFirst) {
        //debugger
        d3.select(`.wheel-${wheelIdx}`)
            .transition()
            .attr("transform", `translate(${grad(1) - grad(0)},0)`)
    }

    const wheelPos = grad(1) - grad(value)

    if(isNaN(wheelPos)) {
        debugger
    }

    if (rewindFirst) {
        //debugger
    }
    d3.select(`.wheel-${wheelIdx}`)
        .transition().duration(transitionTime)
        .attr("transform", `translate(${wheelPos},0)`)

    //console.log(value, wheelPos)
}


const toggleActionVisibility = state => {

    state.toolsModels.forEach(tool => {
        tool.args.actions.forEach(action => {
            d3.select(`#${tool.id}`).selectAll(`.action-${action.type}`).attr("opacity", action.isVisible ? 1 : 0)
        })
    })

}


const toggleContourForSelection = tool => {

    const t = d3.select(`#${tool.id}`).selectAll(".tool-contour")

    if (tool.isCollidingWith) {
        t.attr("stroke-width", 2.5)
            .attr("stroke", "red")
    }
    else {
        t.attr("stroke-width", 0.5)
            .attr("stroke", "black")
    }
}


const updateView = state => {

    d3.select('#topSvg > svg')
        .attr('width', state.screenDimension[0])
        .attr('height', state.screenDimension[1])

    const tf = toolFuncs(state, true)

    if(tf.niveau2Freeze()) {
        d3.select('#rootSvg').attr("opacity", 0.5)
        d3.select('#flecheDroite').attr("opacity", 1)
    }
    else {
        d3.select('#rootSvg').attr("opacity", 1)
        d3.select('#flecheDroite').attr("opacity", 0)
    }

    setStandardCurveVisible(state)

    state.toolsModels.forEach(adjustLiquidLevel(1000, state))

    toggleActionVisibility(state)

    state.toolsModels.forEach(toggleContourForSelection)

    const pipette = tf.getPipette()


    if (pipette) {
        const vol = tf.volumeSelonAjustement()

        d3.select(".pipette-config")
            .attr("opacity", 1)
            .transition()
            .duration(1500)
            .text(`[${tf.formattedPipetteVol()} μl]`)

        d3.select(".pipette-label")
            .attr("opacity", 1)
            .text(`P${pipette.args.ul === -1 ? "?" : pipette.args.ul}`)

        d3.selectAll(".pipette-wheel-digit-0").attr("fill", pipette.args.ul === 1000 ? "red": "black")
        d3.selectAll(".pipette-wheel-digit-1").attr("fill", "black")
        d3.selectAll(".pipette-wheel-digit-2").attr("fill", pipette.args.ul === 20 ? "red" : "black")


        const colorEmbout = () => {
            switch (pipette.args.ul) {
                case 1000: return "#91c2ff"
                case 20:
                case 200: return "yellow"
                default: "white"
            }
        }

        d3.select(".embout-all").style("fill", colorEmbout())

    }

    const updateVolumeLabel = workTubeOrCuvette => {

        if (!workTubeOrCuvette) {
            return
        }

        const contentText = workTubeOrCuvette.args.content.map(tubeContent => {

            const srcTube = tf.toolById(tubeContent.contentSourceId)

            let label = tubeContent.contentSourceId === "solution-protéique" ? "Réactif de Bradford" : srcTube.args.label

            return `${label}: ${Math.round(tubeContent.volume)} μl`

        }).join(" + ")

        d3.select(`#${workTubeOrCuvette.id}`)
            .select(".tube-content-label")
            .text(contentText)
    }

    updateVolumeLabel(tf.getWorkTube())
    updateVolumeLabel(tf.getCuvette())
    updateVolumeLabel(tf.getCuvette2())


    const spectro = tf.getSpectrometer()

    if (spectro) {
        if(! spectro.args.longueurDondeOkPourToujours) {
            d3.select(".spectro-adjust").text(`${spectro.args.nm || ""}`)
        }

        d3.select("text.action-blanc").text(`référence ${spectro.args.wasBlanked ? "(ok)" : ""}`)
    }

    if (spectro && spectro.args.hasLecture) {


        if (! spectro.args.lectureIsStale) {

            const [lecture, noWater] = spectroLecture(state)

            const f4 = d3.format("0.3f")


            const l =
                spectro.args.lecture >= 3
                            ? "A > 3"
                            : f4(lecture)

            d3.select(".spectro-lecture").text(`${l}`)
        }
    }
    else {
        const wasBlanked = spectro && spectro.args.wasBlanked
        d3.select(".spectro-lecture").text(wasBlanked ? "0.000": "")
    }

    return state
}

const shakeFunc = tool => {
    let shakeTimes = 2

    const shakePathRadius = 25
    const shakePath = d3.path()
    shakePath.moveTo(tool.x, tool.y)
    shakePath.arc(tool.x + shakePathRadius, tool.y + shakePathRadius, shakePathRadius, 0, 2 * shakePathRadius * Math.PI)
    shakePath.lineTo(tool.x, tool.y)


    const svgScreen = tool.svgScreen
    const shakePathEl = svgScreen.append("path")
        .attr("d", shakePath)
        .attr("fill", "none")
        .attr("opacity", "0")

    const toolEl = d3.select(`#${tool.id}`)

    function translateAlong(path) {
        const l = path.getTotalLength()
        return (d, i, a) => {
            return t => {
                const p = path.getPointAtLength(l - (t * l))
                return `translate(${p.x}, ${p.y})`
            }
        }
    }

    const shakeTransition = () => {
        toolEl.transition()
            .duration(500)
            .ease(d3.easeLinear)
            .attrTween("transform", translateAlong(shakePathEl.node()))
            .on("end", () => {
                shakeTimes--
                if (shakeTimes > 0) {
                    shakeTransition()
                }
                shakePathEl.remove()
            })
    }

    shakeTransition()
}


const setStandardCurveVisible = (state) => {

    d3.selectAll(".BSAPlot").attr("visibility", toolFuncs(state).isNiveau(4) && state.isCourbeStandardVisible  ? "visible" : "hidden")
}


export const createDrawFuncs = (isMockup=false) =>
    isMockup ? ({
            drawTools: i=>i,
            moveWheel: i => i,
            updateView: i => i,
            shakeFunc: i => i,
            setStandardCurveVisible: i => i,
            drawSvgLabDesk: i => i,
            changerEmbout: i => i
    }) :
    ({
            drawTools, moveWheel, updateView, shakeFunc, setStandardCurveVisible, drawSvgLabDesk, changerEmbout
    })


const getTransformation = transform => {
    // Create a dummy g for calculation purposes only. This will never
    // be appended to the DOM and will be discarded once this function
    // returns.
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Set the transform attribute to the provided string value.
    g.setAttributeNS(null, "transform", transform);

    // consolidate the SVGTransformList containing all transformations
    // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
    // its SVGMatrix.
    var matrix = g.transform.baseVal.consolidate().matrix;

    // Below calculations are taken and adapted from the private function
    // transform/decompose.js of D3's module d3-interpolate.
    var { a, b, c, d, e, f } = matrix;   // ES6, if this doesn't work, use below assignment
    // var a=matrix.a, b=matrix.b, c=matrix.c, d=matrix.d, e=matrix.e, f=matrix.f; // ES5
    var scaleX, scaleY, skewX;
    if (scaleX = Math.sqrt(a * a + b * b)) {
        a /= scaleX
        b /= scaleX
    }

    if (skewX = a * c + b * d) {
        c -= a * skewX
        d -= b * skewX
    }
    if (scaleY = Math.sqrt(c * c + d * d)) {
        c /= scaleY
        d /= scaleY
        skewX /= scaleY
    }
    if (a * d < b * c) {
        a = -a
        b = -b
        skewX = -skewX
        scaleX = -scaleX
    }
    return {
        translateX: e,
        translateY: f,
        rotate: Math.atan2(b, a) * 180 / Math.PI,
        skewX: Math.atan(skewX) * 180 / Math.PI,
        scaleX: scaleX,
        scaleY: scaleY
    }
}




export const drawBSAPlot = ({ svgScreen, width = 400, height = 250, x, y, margin = { top: 20, right: 20, bottom: 40, left: 40 }}) => {


    width += - margin.left - margin.right,
    height += - margin.top - margin.bottom;

    const xMax = 0.12
    const yMax = 0.6

    // X scale
    const xScale = d3.scaleLinear()
        .domain([0, xMax])
        .range([0, width]);

    // Y scale
    const yScale = d3.scaleLinear()
        .domain([0, yMax])
        .range([height, 0]);

    const plotGroup = svgScreen.append("g")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("class", "BSAPlot")
        .attr("x", x)
        .attr("y", y)
        .attr("transform", "translate(" + x + "," + y + ")")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    const mouseG = plotGroup.append("g")
        .attr("class", "mouse-over-effects");

    mouseG.append("path")
        .attr("class", "mouse-line-v mouse-line")
        .style("stroke", "black")
        .style("stroke-width", "1px")
        .style("opacity", "0")
        .style("stroke", "red")

    mouseG.append("path")
        .attr("class", "mouse-line-h mouse-line")
        .style("stroke", "black")
        .style("stroke-width", "1px")
        .style("opacity", "1")
        .style("stroke", "red")

    mouseG.append("text")
        .attr("class", "mouse-text-x mouse-line")
        .style("stroke-width", "0.5px")
        .style("font-size", "0.9em")

    mouseG.append("text")
        .attr("class", "mouse-text-y mouse-line")
        .style("stroke-width", "0.5px")
        .style("font-size", "0.9em")

    const mousePerLine = mouseG.selectAll('.mouse-per-line')
        .append("g")
        .attr("class", "mouse-per-line")

    mousePerLine.append("circle")
        .attr("r", 7)
        .style("stroke", function (d) {
            return color(d.name);
        })
        .style("fill", "none")
        .style("stroke-width", "1px")
        .style("opacity", "0");

    mousePerLine.append("text")
        .attr("transform", "translate(10,3)");

    /*
    mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
        .attr('width', width) // can't catch mouse events on a g element
        .attr('height', height)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseout', function () {
            d3.selectAll(".mouse-line")
                .style("opacity", "0")
        })
        .on('mouseover', function () {
            d3.selectAll(".mouse-line")
                .style("opacity", "1")
        })
        .on('mousemove', function (ev) {

            const [mouseX, mouseY] = d3.pointer(ev)

            d3.select(".mouse-line-v")
                .attr("d", `M${mouseX},${height} ${mouseX},0`)

            d3.select(".mouse-line-h")
                .attr("d", `M0,${mouseY} ${width},${mouseY}`)


            d3.select(".mouse-text-x")
                .attr("x", mouseX)
                .attr("y", height)
                .text(f2(xScale.invert(mouseX)))

            d3.select(".mouse-text-y")
                .attr("y", mouseY)
                .text(f2(yScale.invert(mouseY)))
        })
    */

    const xAxis = d3.axisBottom()
        .scale(xScale)
        .ticks(5)


    plotGroup.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)

    plotGroup.append("text")
        .attr("y", height + 40)
        .attr("x", 76)
        .text("Concentration mg/ml")


    plotGroup.append("text")
        .attr("y", -40)
        .attr("x", -120)
        .text("Densité Optique")
        .attr("transform", "rotate(-90)")

    const yAxis = d3.axisLeft()
        .scale(yScale)
        .ticks(3)

    plotGroup.append("g")
        .attr("class", "y axis")
        .call(yAxis);


    // equ text in top left
    const eqText = plotGroup.append("text")
        .attr("id", "eq-text")
        .style("text-anchor", "start")
        .attr("x", 14)
        .attr("y", -4);

    standardCurveData.forEach(d => {
        plotGroup.append("circle")
        .attr("r", 3)
        .attr("cx", xScale(d.x))
        .attr("cy", yScale(d.y))
    })

    const lsq = leastSquares(
        standardCurveData.map(p => p.x),
        standardCurveData.map(p => p.y)
    )

    const regressionFunc = x => x*lsq.slope + lsq.intercept

    const firstPoint = standardCurveData[0]
    const lastPoint = standardCurveData[standardCurveData.length -1]

    plotGroup.append("line")
        .attr("stroke", "grey")
        .attr("x1", xScale(firstPoint.x))
        .attr("y1", yScale(regressionFunc(firstPoint.x)))
        .attr("x2", xScale(lastPoint.x))
        .attr("y2", yScale(regressionFunc(lastPoint.x)))

    const f6 = d3.format("0.6f")

    d3.select('#eq-text').text(`y = ${f6(lsq.slope)} x + ${f6(lsq.intercept)} R^2 = ${f6(lsq.rSquare)}`)

}

