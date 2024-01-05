import React, { isValidElement } from "react"
import _ from 'lodash'
import * as d3 from "d3"
import { niveaux } from "./niveaux.js"
import { toolFuncs } from "./toolFuncs.js"

const f2 = d3.format("0.2f")

const DEBUG = false

const A_GT_3 = 3

export const standardCurveData = [
    [0.02, 0.114],
    [0.04, 0.241],
    [0.06, 0.349],
    [0.08, 0.439],
    [0.1, 0.551]
].map(([x, y]) => ({ x, y }))


export const leastSquares = (xSeries, ySeries) => {

    const reduceSumFunc = (prev, cur) => prev + cur

    const xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length
    const yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length
    const ssXX = xSeries.map(d => Math.pow(d - xBar, 2)).reduce(reduceSumFunc)
    const ssYY = ySeries.map(d => Math.pow(d - yBar, 2)).reduce(reduceSumFunc)
    const ssXY = xSeries.map((d, i) => (d - xBar) * (ySeries[i] - yBar)).reduce(reduceSumFunc)
    const slope = ssXY / ssXX
    const intercept = yBar - (xBar * slope)
    const rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY)

    return {slope, intercept, rSquare}
}




export const createLabDeskReducer = ({ drawTools, moveWheel, updateView, shakeFunc, changerEmbout }) => (state, action) => {

    const trackProgressAndUpdateView = state => ({
        ...updateView(state),
        progressTracker: toolFuncs(state).progressTracker(action)
    })

    const dialog = (state, extraClasses, content) => ({
        ...state,
        dialog: { content, extraClasses }
    })

    const returnErrorDialog = (state, text) =>
        dialog({ ...state, hasError: true}, "is-danger", text)


    const returnSuccessDialog = (state, text) =>
        dialog({ ...state, hasError: false }, "is-success", text)


    const returnErrorListInDialog = (state, errorList) =>  ({
        ...state,
        dialog: {
            htmlContent: () => <>
                <h4>Erreurs</h4>
                <ul>
                    {errorList.map(e => <li key={e}>{e}</li>)}
                </ul>
            </>,
            extraClasses: "is-danger"
        }
    })

    if(toolFuncs(state).niveau2Freeze()) {
        if (["mouseOverTool", "mouseout", "start", "drag", "end", "roll", "shake"].indexOf(action.type) !== -1) {
            return state
        }
    }


    const validerLongueurDonde = state => {

        const tf = toolFuncs(state)

        if (state.validerProtocolManip) {

            const spectro = tf.getSpectrometer()

            if (tf.isNiveau(3) && spectro.args.nm !== 260) {
                if (!spectro.args.longueurDondeOkPourToujours) {
                    return returnErrorDialog(state, `la longueur d'onde du spectrophotomètre doit être réglée à 260.`)
                }
            }

            if (tf.isNiveau(4) && spectro.args.nm !== 595) {
                return returnErrorDialog(state, `la longueur d'onde du spectrophotomètre doit être réglée à 595.`)
            }
        }

        return null
    }


    const mainFunc = (state, action) => {

        switch (action.type) {

            case "reset":
            case "init": {

                const { svgScreen, dispatch, niveauId } = action

                if (!niveauId) {
                    throw Error("niveauId must be defined")
                }

                const tf = toolFuncs({ niveauId })

                const niveau = tf.getNiveau()

                const [width, height] = niveau.screenDimension

                const toolAreaHeight = height

                const toolsModels = [
                    {   id: 'dna-tube',
                        args: {
                            width: 50, height: 120, toolAreaHeight,
                            label: tf.isNiveau(4) ? "Solution protéique" : "ADN Purifié",
                            labelOffset: -11,
                            actions: [
                                { name: 'agiter', type: 'shake', toolId: 'dna-tube', isVisible: true }
                            ],
                            fillLevel: 70,
                            fillHeight: 120,
                            content: []
                        },
                        drawOrder: 5
                    },
                    {
                        id: 'water-tube',
                        args: {
                            width: 50, height: 250, toolAreaHeight,
                            labelOffset: 22,
                            label: tf.isNiveau(4) ? "Tris": "Eau",
                            actions: [{ name: 'agiter', type: 'shake', toolId: 'water-tube', isVisible: true }],
                            fillLevel: 70,
                            fillHeight: 130 ,
                            content: []
                        },
                        drawOrder: 4

                    },
                    {
                        id: 'micro-pipette',
                        args: {
                            width: 50, height: 550 * 0.6,
                            wheelValues: [0, 0, 0],
                            wheelRanges: [2, 9, 9],
                            wheelCoeficients: [100, 10, 1],
                            ul: -1,
                            fillLevel: 0,
                            fillHeight: 190,
                            toolAreaHeight,
                            label: "Micropipette",
                            labelOffset: -52,
                            actions: [
                                { name: "choisir la micropipette", type: "choisirPipette", toolId: 'micro-pipette', isVisible: true },
                                { name: "changer d'embout", type: "changerEmbout", toolId: 'micro-pipette', isVisible: true },
                                { name: "aspirer", type: "aspirer", toolId: 'micro-pipette', isVisible: false},
                                { name: "éjecter", type: "éjecter", toolId: 'micro-pipette', isVisible: false}
                            ],
                            content: null
                        },
                        drawOrder: 3,
                        collisionRect: { width: 110, height: 760 * 0.6}
                    },
                    {
                        id: 'work-tube',
                        args: {
                            width: 50, height: 120, toolAreaHeight, label: "Microtube",
                            actions: [
                                { name: 'agiter', type: 'shake', toolId: 'work-tube', isVisible: true },
                                { name: 'changer', name2: "de tube", type: 'vider', toolId: 'work-tube', isVisible: true }
                            ],
                            fillLevel: 0,
                            fillHeight: 120,
                            content: []
                        },
                        drawOrder: 2
                    },
                    {
                        id: 'cuvette',
                        args: {
                            width: 50, height: 120, toolAreaHeight, label: "Cuvette",
                            actions: [
                                { name: 'agiter', type: 'shake', toolId: 'cuvette', isVisible: true },
                                { name: 'changer', name2: "de cuvette", type: 'vider', toolId: 'cuvette', isVisible: true }
                            ],
                            fillLevel: tf.isNiveau(4) ? 20 : 0,
                            fillHeight: 100,
                            content:
                                []
                                //tf.isNiveau(4) ? [{ contentSourceId: "solution-protéique", volume: 1000}] : []
                        },
                        drawOrder: 2
                    },
                    {
                        id: 'cuvette2',
                        args: {
                            width: 50, height: 120, toolAreaHeight, label: "Cuvette",
                            actions: [
                                { name: 'agiter', type: 'shake', toolId: 'cuvette2', isVisible: true },
                                { name: 'changer', name2: "de cuvette", type: 'vider', toolId: 'cuvette2', isVisible: true }
                            ],
                            fillLevel: 0,
                            fillHeight: 100,
                            content: []
                        },
                        drawOrder: 2
                    },
                    {
                        id: 'spectrometer',
                        args: {
                            width: 187,
                            height: 160, toolAreaHeight, label: "Spectrophotomètre",
                            nm: 0,
                            lecture: 0,
                            hasLecture: false,
                            wasBlanked: false,
                            actions: [
                                { name: `longueur d'onde`, type: 'réglerLongueurDOnde', toolId: 'spectrometer', isVisible: true },
                                {
                                    name: 'référence',
                                  type: 'blanc', toolId: 'spectrometer', isVisible: true
                                },
                                { name: 'lecture', type: 'lecture', toolId: 'spectrometer', isVisible: true }
                            ]
                        },
                        yOffset: -100,
                        drawOrder: 1
                    }
                ]
                .map(tool => ({
                    ...tool,
                    yOffset: tool.yOffset || 0,
                    args: {
                        ...tool.args,
                        labelOffset: tool.args.labelOffset || 0
                    },
                    collisionRect: tool.collisionRect ? tool.collisionRect : { width: tool.args.width, height: tool.args.height }
                }))
                .filter(
                    tool => _.find(niveau.toolIdsForLevel, id => id === tool.id)
                )

                drawTools({ toolsModels, width, toolAreaHeight, svgScreen, dispatch})

                trackProgressAndUpdateView({ toolsModels, screenDimension: niveau.screenDimension})

                return {
                    screenDimension: niveau.screenDimension,
                    testMode: false,
                    progressTracker: {},
                    niveauNum: niveau.niveauNum,
                    validerProtocolManip: true,
                    displayable: true,
                    aficherReponses: true,
                    toolsModels: toolsModels,
                    selectedToolId: null,
                    niveauId: state.niveauId || niveauId,
                    dispatch,
                    niveauArgs: niveau.randomArgsGen(),
                    isCourbeStandardVisible: false,
                    initArgs: {
                        width, height, svgScreen, niveauId
                    }
                }
            }

            case "startNiveau": {

                const niv = _.find(niveaux, n => n.id === action.niveauId)

                const nextState = mainFunc(state, { type: "init", ...state.initArgs, svgScreen: action.svgScreen, dispatch: action.dispatch, niveauId: action.niveauId})

                return {
                    ...nextState,
                    levelCompleted: null,
                    niveauId: action.niveauId,
                    niveauArgs: niv.randomArgsGen()
                }
            }

            case "mouseOverTool": {

                action.element.selectAll(".tool-contour").attr("stroke-width", 1.5)
                return {
                    ...state,
                    mouseOverTool: toolFuncs(state).toolById(action.toolId),
                }
            }

            case "mouseOutTool": {

                action.element.selectAll(".tool-contour").attr("stroke-width", 0.5)
                return {
                    ...state,
                    mouseOverTool: null
                }
            }

            case "dragStart": {

                return {
                    ...state,
                    draggingToolId: action.toolId
                }
            }

            case "drag": {


                const state1 = {
                    ...state,
                    toolsModels: state.toolsModels.map(tool => {

                        const newX = tool.x + action.event.dx
                        const newY = tool.y + action.event.dy
        
                        if(newX < 20 || newX > 1100) {
                            return tool
                        }

                        if(newY < -50 || newY > 400) {
                            return tool
                        }                        
        

                        if (state.draggingToolId !== tool.id) {
                            return tool
                        }

                        return {
                            ...tool,
                            x: newX,
                            y: newY
                        }

                    })
                }

                const draggedTool = toolFuncs(state1).toolById(state1.draggingToolId)

                action.element
                    .attr("transform", `translate(${draggedTool.x},${draggedTool.y}) ${action.toolId === "micro-pipette" ? "scale(0.6)" : ""} `)

                const otherCollidingTool = toolFuncs(state1).toolCollidesWith(draggedTool)

                const state2 = {
                    ...state1,
                    toolsModels: state1.toolsModels.map(tool => {

                        if (! _.isUndefined(otherCollidingTool)) {

                            if (tool.id === otherCollidingTool.id) {
                                if (draggedTool.id === 'cuvette' || draggedTool.id === 'cuvette2' || draggedTool.id === 'micro-pipette') {
                                    return {
                                        ...tool,
                                        isCollidingWith: draggedTool.id
                                    }
                                }
                            }
                        }

                        return {
                            ...tool,
                            isCollidingWith: null
                        }
                    })
                }

                const actionIsVisible = (tool, action) => {

                    if (action.type === "choisirPipette") {
                        return true
                    }
                    else if (draggedTool.id === 'micro-pipette' && tool.id === 'micro-pipette') {

                        if (action.type === "aspirer" || action.type === "éjecter") {
                            return !!otherCollidingTool
                        }
                    }

                    return action.isVisible

                }

                return trackProgressAndUpdateView({
                    ...state2,
                    dialog: null,
                    toolsModels: state2.toolsModels.map(tool => ({
                        ...tool,
                        args: {
                            ...tool.args,
                            actions: tool.args.actions.map(action => ({
                                ...action,
                                isVisible: actionIsVisible(tool, action)
                            }))
                        }
                    }))
                })
            }

            case "dumpTool": {

                console.log(toolFuncs(state).toolById(action.toolId))

                return state
            }

            case "dragEnd": {

                const tf = toolFuncs(state)

                const toolDragging = tf.toolById(state.draggingToolId)

                const otherCollidingTool = _.find(state.toolsModels, tool => tool.isCollidingWith)

                if (toolDragging.id === "micro-pipette") {

                    if (otherCollidingTool && otherCollidingTool.id === "dna-tube" && otherCollidingTool.args.isShaken) {

                        return {
                            ...state,
                            draggingToolId: null
                        }
                    }
                }

                if (toolDragging.id === "cuvette" || toolDragging.id === "cuvette2") {

                    const cuvetteOnSpectro = tf.getCuvetteOnSpectro()
                    if(cuvetteOnSpectro === null) {

                        const spectrometer = tf.getSpectrometer()

                        if (spectrometer.args.hasLecture) {
                            return {
                                ...state,
                                dialog: null,
                                draggingToolId: null,
                                toolsModels: modTool(state.toolsModels, spectrometer.id, {
                                    args: {
                                        ...spectrometer.args,
                                        lectureIsStale: true,
                                        nm: action.nm
                                    }
                                })
                            }
                        }
                    }
                }

                return {
                    ...state,
                    draggingToolId: null
                }
            }

            case "réglerLongueurDOnde": {

                return {
                    ...state,
                    reglerLongeurDondeDialog: true
                }
            }

            case "setLongueurDOnde": {

                const spectrometer = toolFuncs(state).getSpectrometer()

                return trackProgressAndUpdateView({
                    ...state,
                    dialog: null,
                    toolsModels: modTool(state.toolsModels, spectrometer.id, {
                        args: {
                            ...spectrometer.args,
                            nm: action.nm
                        }
                    })
                })
            }

            case "réglerLongueurDOndeClose": {

                const tf = toolFuncs(state)

                const spectrometer = toolFuncs(state).getSpectrometer()

                if (tf.isInNiveau([3, 4]) && spectrometer.args.nm !== 260) {
                    return returnErrorDialog(state, `L'absorbance maximale des acides nucléiques dans l'UV est à 260 nm`)
                }

                return trackProgressAndUpdateView({
                    ...state,
                    dialog: null,
                    reglerLongeurDondeDialog: false,
                    toolsModels: modTool(state.toolsModels, spectrometer.id, {
                        args: {
                            ...spectrometer.args,
                            longueurDondeOkPourToujours: true
                        }
                    })
                })
            }

            case "blanc": {

                const tf = toolFuncs(state)

                const spectrometer = tf.getSpectrometer()

                const cuvette = tf.getCuvetteOnSpectro()

                if (!cuvette) {
                    return returnErrorDialog(state, `La cuvette doit être déposée sur le Spectromètre avant d'activer la fonction blanc.`)
                }

                if (cuvette.args.content.length > 1) {
                    return returnErrorDialog(state, `La référence (aussi nommée blanc) est utilisée pour faire le zéro de l'appareil. Elle doit contenir tout ce que l’échantillon contient, sauf la substance à mesurer. Dans ce cas-ci, elle doit donc contenir de l’eau.`)
                }

                if (cuvette.args.content.length === 0 || !_.find(cuvette.args.content, c => c.contentSourceId === 'water-tube')) {
                    return returnErrorDialog(state, `La cuvette doit contenir de l'eau pour d'activer la fonction "blanc".`)
                }

                const cuvetteOrWorkTubeContent = tf.cuvetteContent(cuvette)

                if (cuvetteOrWorkTubeContent.water.volume < 700) {
                    return returnErrorDialog(state,`Le volume minimal dans la cuvette pour une lecture fiable est de 700 ul.`)
                }

                if (state.validerProtocolManip) {

                    const spectro = tf.getSpectrometer()

                    if (! spectro.args.nm) {
                        return returnErrorDialog(state, `Il faut choisir la longueur d'onde de mesure avant d'ajuster le 0 de l'appareil avec la référence.`)
                    }
                }


                const lo = validerLongueurDonde(state)

                if (lo !== null) {
                    return lo
                }

                return trackProgressAndUpdateView({
                    ...state,
                    toolsModels: modTool(state.toolsModels, spectrometer.id, {
                        args: {
                            ...spectrometer.args,
                            wasBlanked: true
                        }
                    })
                })
            }

            case "setTestInputFieldValue": {
                return {
                    ...state,
                    testInputFieldValue: action.value
                }
            }

            case "toggleTestMode": {


                const testMode = !state.testMode

                const tf = toolFuncs(state)

                if(tf.isInNiveau([1,2])) {
                    return {
                        ...state,
                        testMode
                    }
                }

                const spectrometer = tf.getSpectrometer()

                return {
                    ...state,
                    testMode,
                    toolsModels: modTool(state.toolsModels, spectrometer.id, {
                        args: {
                            ...spectrometer.args,
                            nm: tf.isNiveau(3) ? 260: 595
                        }
                    })
                }
            }

            case "toggleBypassProtocol": {
                return {
                    ...state,
                    validerProtocolManip: !state.validerProtocolManip
                }
            }

            case "fillCuvetteTest": {

                const tf = toolFuncs(state)

                const [dnaVol, waterVol] =
                    action.fill ?
                        action.fill :
                        state.testInputFieldValue.split(",").map(s => parseInt(s.trim()))

                const cuvetteOrWorkTube = tf.getCuvetteOrWorkTube()

                const tableauDilutionOk = state.niveauArgs.tableauDilutionOk

                const nextState = mainFunc(
                    mainFunc(
                        state,
                        { type: "volAdnUpdated", value: dnaVol }
                    ),
                    { type: "volEauUpdated", value: waterVol}
                )

                return trackProgressAndUpdateView({
                    ...nextState,
                    niveauArgs: {
                        ...state.niveauArgs,
                        tableauDilutionOk,
                    },
                    toolsModels: modTool(nextState.toolsModels, cuvetteOrWorkTube.id, {
                        args: {
                            ...cuvetteOrWorkTube.args,
                            fillLevel: 50,
                            content: [
                                { contentSourceId: 'dna-tube', volume: dnaVol },
                                { contentSourceId: 'water-tube', volume: waterVol }
                            ]
                        }
                    })
                })
            }

            case "lecture": {

                const tf = toolFuncs(state)

                const cuvette = tf.getCuvetteOnSpectro()

                if ((cuvette === null) || (! cuvette && state.validerProtocolManip)) {
                    return returnErrorDialog(state, `La cuvette doit être déposée sur le Spectromètre pour faire la lecture.`)
                }

                if (!cuvette.args.isShaken && state.validerProtocolManip) {
                    return returnErrorDialog(state, `Le contenu de la cuvette doit être agitée avant de faire la lecture.`)
                }

                const spectro = tf.getSpectrometer()

                if (state.validerProtocolManip && ! spectro.args.wasBlanked) {
                    return returnErrorDialog(state, `Il faut faire le BLANC avant de faire la lecture.`)
                }

                const lo = validerLongueurDonde(state)

                if (lo !== null) {
                    return lo
                }

                const cuvetteOrWorkTubeContent = tf.cuvetteContent(cuvette)

                if (state.validerProtocolManip || true) {

                    const errorListForContentNiveau3 = cuvetteOrWorkTubeContent => {

                        const res = []

                        if(cuvetteOrWorkTubeContent.isEmpty) {
                            return [`On ne peut faire de lecture avec une cuvette vide !`]
                        }

                        if(! cuvetteOrWorkTubeContent.dna) {
                            return [`La cuvette ne contient que de l'eau !`]
                        }

                        if (!cuvetteOrWorkTubeContent.water) {
                            return [] //[`La cuvette ne contient que de l'ADN !`]
                        }

                        if (cuvetteOrWorkTubeContent.dna.volume < 10) {
                            res.push(`Prélever un volume d'ADN d'au moins 10 μl pour s'assurer de minimiser les erreurs de pipetage.`)
                        }

                        if (cuvetteOrWorkTubeContent.dna.volume > 990) {
                            res.push(`Le volume d'ADN ne peut pas être supérieur à 990 μl (car le volume final doit être de 1 ml).`)
                        }

                        if (cuvetteOrWorkTubeContent.water.volume < 10) {
                            res.push(`Prélever un volume d'eau d'au moins 10 μl pour s'assurer de minimiser les erreurs de pipetage.`)
                        }

                        if (cuvetteOrWorkTubeContent.water.volume > 990) {
                            res.push(`Le volume d'eau ne peut pas être supérieur à 990 μl (car le volume final doit être de 1 ml).`)
                        }

                        const volTotal = Math.round(cuvetteOrWorkTubeContent.water.volume + cuvetteOrWorkTubeContent.dna.volume)

                        if (volTotal < 700) {
                            res.push(`Le volume minimal dans la cuvette pour une lecture fiable est de 700 ul.`)
                        }

                        if (volTotal != 1000) {
                            res.push(`Le volume combiné d'eau et d'ADN doit être de 1000 ul`)
                        }

                        return res
                    }

                    const errorList = errorListForContentNiveau3(cuvetteOrWorkTubeContent)

                    if(errorList.length > 0) {
                        return returnErrorListInDialog(state, errorList)
                    }
                }

                const [lecture, noWater] = tf.getNiveau().spectroLecture(state)

                let promptDeductionConcentration = null

                if(tf.isInNiveau([3, 4])) {

                    const lectureDisplay = d3.format("0.3f")(lecture)

                    const nextState = () => ({
                        ...state,
                        toolsModels: modTool(state.toolsModels, spectro.id, {
                            args: {
                                ...spectro.args,
                                lecture,
                                hasLecture: true,
                                lectureIsStale: false
                            }
                        })
                    })

                    const noWaterFunc = () =>
                        trackProgressAndUpdateView(
                            returnErrorDialog(nextState(),
                            `L'absorbance de ${lectureDisplay} est trop élevée, et doit être inférieure à 2. Il faut diluer davantage l'échantillon d'ADN`
                            ))

                    //if (noWater) {
                    //    return noWaterFunc()
                    //}

                    if (lecture < 0.05) {
                        return trackProgressAndUpdateView(returnErrorDialog(
                            nextState(),
                            `L'absorbance de ${lectureDisplay} est trop faible, et doit être supérieure à 0.050. Il faut donc moins diluer l'échantillon d'ADN.`
                        ))
                    }
                    else if (lecture === 3) {
                        //...
                    }
                    else if (lecture >= 2) {
                        return noWaterFunc()
                    }

                    promptDeductionConcentration = true
                }

                return trackProgressAndUpdateView({
                    ...state,
                    toolsModels: modTool(state.toolsModels, spectro.id, {
                        args: {
                            ...spectro.args,
                            lecture,
                            hasLecture: true,
                            lectureIsStale: false
                        }
                    }),
                    niveauArgs: {
                        ...state.niveauArgs,
                        promptDeductionConcentration
                    }
                })
            }

            case "choisirPipette": {

                return {
                    ...state,
                    pipetteChoiceInProgress: true
                }
            }

            case "choisirPipetteClose": {

                return {

                    ...state,
                    pipetteChoiceInProgress: false
                }
            }

            //case "réglerLongueurDOnde": {return {...state}}

            case "setReponseConcentration": {
                return {
                    ...state,
                    niveauArgs: {
                        ...state.niveauArgs,
                        reponseConcentration: action.value,
                        reponseConcentrationStringEntered: action.stringEntered
                    },
                    progressTracker: toolFuncs(state).clearProgressTrackerErrors()
                }
            }


            case "setReponseConcentrationDepart": {
                return {
                    ...state,
                    niveauArgs: {
                        ...state.niveauArgs,
                        reponseConcentrationDepart: action.value,
                        reponseConcentrationDepartStringEntered: action.stringEntered
                    },
                    progressTracker: toolFuncs(state).clearProgressTrackerErrors()
                }
            }

            case "selectPipette": {


                const ul = action.ul
                const tf = toolFuncs(state)

                const [wheelRanges, wheelCoeficients, wheelDeltas] = tf.pipetteProperties(ul)

                const pipette = tf.getPipette()

                const nextState = {
                    ...state,
                    pipetteChoiceInProgress: false,
                    dialog: null,
                    toolsModels: modTool(state.toolsModels, pipette.id, {
                        args: {
                            ...pipette.args,
                            wheelRanges,
                            wheelCoeficients,
                            wheelValues: [0, 0, 0],
                            wheelDeltas,
                            ul,
                            content: [],
                            fillLevel: 0,
                            fillHeight: 190,
                            isDirty: null
                        }
                    })
                }

                moveWheel(0, 0, 0)
                moveWheel(1, 0, 0)
                moveWheel(2, 0, 0)

                return trackProgressAndUpdateView(nextState)
            }

            case "roll": {


                const pipette = toolFuncs(state).getPipette()

                if (pipette.args.ul === -1) {
                    return mainFunc(state, { type: "choisirPipette"})
                }

                const { wheelIdx, isForward, isSpeedButton } = action

                const delta = pipette.args.wheelDeltas[wheelIdx] * (isForward ? 1 : -1) * (isSpeedButton ? 5 : 1)

                const currentValueOfWheelIdx = pipette.args.wheelValues[wheelIdx]

                if (currentValueOfWheelIdx === 0 && delta < 0) {
                    return state
                }

                const wheelRangeMax = pipette.args.wheelRanges[wheelIdx]


                const updateWheelValue = (wIdx, v) => ({
                    ...state,
                    toolsModels: modTool(state.toolsModels, pipette.id, {
                        args: {
                            ...pipette.args,
                            wheelValues: pipette.args.wheelValues.map((value, idx) =>
                                idx === wIdx ? v : value
                            )
                        }
                    }),
                    selectedToolId: pipette.id
                })


                if (currentValueOfWheelIdx === wheelRangeMax && delta > 0) {

                    if (delta >= 1) {
                        return state
                    }
                }

                if(wheelIdx === 2) {
                    if (delta === 0.2 && currentValueOfWheelIdx >= 9.7) {
                        return state
                    }
                    if (delta === 1 && currentValueOfWheelIdx >= 9) {
                        return state
                    }
                }

                let newValue = currentValueOfWheelIdx + delta % pipette.args.wheelRanges[wheelIdx]

                if (newValue < 0) {
                    return state
                }

                if (wheelIdx === 0 && pipette.args.ul === 1000) {
                    if (currentValueOfWheelIdx === 0) {
                        newValue = 1
                    }
                    else if(currentValueOfWheelIdx === 1 && (!isForward)) {
                        newValue = 0
                    }
                }

                if (newValue >= (wheelRangeMax + 1)) {

                    let nextState = null

                    if (wheelIdx === 1) {
                        nextState = mainFunc(updateWheelValue(1, 0), { type: "roll", wheelIdx: 0, delta: 1 })
                    }

                    if (wheelIdx === 2) {
                        nextState = mainFunc(updateWheelValue(2, 0), { type: "roll", wheelIdx: 1, delta: 1 })
                    }

                    if (nextState && ! toolFuncs(nextState).isPipetteMoreThanFull()) {
                        //console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!")
                        //moveWheel(wheelIdx, 0, 0, true)
                        return state
                    }
                    else {
                        return state
                    }
                }

                let nextState = updateWheelValue(wheelIdx, newValue)

                if (!toolFuncs(nextState).isPipetteMoreThanFull()) {
                    moveWheel(wheelIdx, newValue, 1000)

                    return trackProgressAndUpdateView(nextState)
                }

                return state
            }

            case "shake": {

                const tool = toolFuncs(state).toolById(action.toolId)

                shakeFunc(tool)

                if (["dna-tube", "cuvette", "cuvette2", "work-tube", "water-tube"].indexOf(action.toolId) !== -1) {
                    return trackProgressAndUpdateView({
                        ...state,
                        dialog: null,
                        toolsModels: modTool(state.toolsModels, action.toolId, {
                            ...tool,
                            args: {
                                ...tool.args,
                                isShaken: true
                            }
                        })
                    })
                }
                else {
                    return {
                        ...state,
                        dialog: null
                    }
                }
            }

            case "aspirer": {

                const tf = toolFuncs(state)
                const pipette = tf.getPipette()

                const tube = _.find(state.toolsModels, tool => tool.isCollidingWith)

                if (! tube) {
                    return state
                }

                if (tube.id === "work-tube" || tube.id === "cuvette" || tube.id === "cuvette2") {
                    return state
                }

                if (pipette.args.isDirty && tube.id !== pipette.args.isDirty) {
                    return returnErrorDialog(state, "Il faut changer l'embout lorsqu'on pipette un autre liquide.")
                }

                const volumeConfig = tf.volumeSelonAjustementArrondi()

                const mauvaisChoixDePipette = vol => {

                    const choixCorrect = () => {

                        if (vol <= 20) {

                            return 20
                        }
                        else if (vol <= 200) {
                            return 200
                        }

                        return 1000
                    }

                    return choixCorrect() !== pipette.args.ul
                }

                const displayBadPipetteMsg = () => {

                    //FIX: Vérifiez le volume à prélever pour cette solution

                    if (pipette.args.ul === 20) {
                        return `
                            La micropipette choisie peut prélever entre 2 et 20 μl.
                            Choisis une autre micropipette.`
                    }
                    if (pipette.args.ul === 200) {
                        return `
                            La micropipette choisie peut prélever entre 20 et 200 μl.
                            Choisis une autre micropipette.`
                    }
                    if (pipette.args.ul === 1000) {
                        return `
                            La micropipette choisie peut prélever entre 200 et 1000 μl.
                            Choisis une autre micropipette.`
                    }
                    if (pipette.args.ul === -1) {
                        return `Vous devez choisir le type de micropipette`
                    }
                    throw Error(`invalid value ${pipette.args.ul}`)
                }


                const mustShake = () =>
                    returnErrorDialog(state, "Vous devez toujours agiter une solution avant d'en prélever un certain volume afin de vous assurer qu'elle est homogène.")


                const cuvetteOrWorkTubeContent = tf.cuvetteOrWorkTubeContent()

                if (tube.id === "dna-tube") {

                    if (state.validerProtocolManip && cuvetteOrWorkTubeContent.dna) {
                        return returnErrorDialog(
                            state,
                            `Vous ne pouvez pipetter deux fois la même solution`
                        )
                    }

                    if (!tube.args.isShaken && state.validerProtocolManip) {
                        return mustShake()
                    }

                    if (tf.isInNiveau([1, 2]) && state.validerProtocolManip && mauvaisChoixDePipette(state.niveauArgs.volADN)) {
                        return returnErrorDialog(state, displayBadPipetteMsg())
                    }

                    // volume OK, mauvais liquide
                    if (tf.isInNiveau([1, 2]) && state.validerProtocolManip && state.niveauArgs.volEau === volumeConfig) {
                        return returnErrorDialog(
                            state,
                            `Revérifiez le volume et le type de solution que vous prélevez`
                        )
                    }

                    if (tf.isInNiveau([1,2]) && state.validerProtocolManip && state.niveauArgs.volADN !== volumeConfig) {
                        return returnErrorDialog(
                            state,
                            `Le volume indiqué par la micropipette est ${volumeConfig} ul. Ajustez correctement l'indicateur numérique pour prélever ${state.niveauArgs.volADN} μl.`
                        )
                    }
                }

                if (tube.id === "water-tube") {

                    if (state.validerProtocolManip && cuvetteOrWorkTubeContent.water) {
                        return returnErrorDialog(
                            state,
                            `Vous ne pouvez pipetter deux fois la même solution`
                        )
                    }

                    if (!tube.args.isShaken && state.validerProtocolManip) {
                        return mustShake()
                    }

                    if (tf.isInNiveau([1, 2]) && state.validerProtocolManip && mauvaisChoixDePipette(state.niveauArgs.volEau)) {
                        return returnErrorDialog(state, displayBadPipetteMsg())
                    }

                    // volume OK, mauvais liquide
                    if (tf.isInNiveau([1, 2]) && state.validerProtocolManip && state.niveauArgs.volADN === volumeConfig) {
                        return returnErrorDialog(
                            state,
                            `Revérifiez le volume et le type de solution que vous prélevez`
                        )
                    }

                    if (tf.isInNiveau([1, 2]) && state.validerProtocolManip && state.niveauArgs.volEau !== tf.volumeSelonAjustement()) {
                        return returnErrorDialog(
                            state,
                            `Le volume indiqué par la micropipette est ${volumeConfig} ul. Ajustez correctement l'indicateur numérique pour prélever ${state.niveauArgs.volADN} μl.`
                        )
                    }
                }

                const volume = tf.volumeSelonAjustement()

                if(volume === 0) {
                    return state
                }

                switch (pipette.args.ul) {
                    case 1000:
                        if (volume < 200)
                            return returnErrorDialog(
                                state,
                                `Le volume minimal que vous pouvez pipeter avec une P1000 est de 200 ul.`
                            )
                    case 200:
                        if (volume < 20)
                            return returnErrorDialog(
                                state,
                                `'Le volume minimal que vous pouvez pipeter avec une P200 est de 20 ul`
                            )
                    case 20:
                        if (volume < 2)
                            return returnErrorDialog(
                                state,
                                `'Le volume minimal que vous pouvez pipeter avec une P20 est de 2 ul`
                            )
                }

                const fillLevel = 70

                const nextState = {
                    ...state,
                    dialog: null,
                    toolsModels: modTool(state.toolsModels, pipette.id, {
                        args: {
                            ...pipette.args,
                            fillLevel,
                            content: {
                                contentSourceId: tube.id,
                                volume: volume
                            },
                            isDirty: tube.id
                        }
                    })
                }

                trackProgressAndUpdateView(nextState)

                return nextState
            }

            case "éjecter": {


                let workTubeOrCuvette = _.find(state.toolsModels, tool => tool.isCollidingWith)


                if (!workTubeOrCuvette) {
                    return state
                }

                if ((workTubeOrCuvette.id !== 'work-tube' && workTubeOrCuvette.id !== 'cuvette' && workTubeOrCuvette.id !== 'cuvette2')) {
                    return returnErrorDialog(
                        state,
                        `Éjection dans le mauvais tube !`
                    )
                }

                const pipette = toolFuncs(state).getPipette()

                if (pipette.args.content === null) {
                    return state
                }

                const state1 = {
                    ...state,
                    toolsModels: modTool(state.toolsModels, pipette.id, {
                        args: {
                            ...pipette.args,
                            fillLevel: 0,
                            content: null
                        }
                    })
                }

                const state2 = {
                    ...state1,
                    toolsModels: modTool(state1.toolsModels, workTubeOrCuvette.id, {
                        args: {
                            ...workTubeOrCuvette.args,
                            isShaken: false,
                            fillLevel: 40,
                            content: toolFuncs(state1).blend(workTubeOrCuvette, pipette)
                        }
                    })
                }

                const tf = toolFuncs(state2)

                workTubeOrCuvette = _.find(state2.toolsModels, tool => tool.isCollidingWith)

                const volTot = _.sumBy(workTubeOrCuvette.args.content, c => c.volume)

                if (volTot > 1000) {
                    return returnErrorDialog(
                        state,
                        `Attention, vous n'avez pas prélevé les bons volumes !`
                    )
                }


                if (tf.isNiveau(3)) {
                    const spectrometer = tf.getSpectrometer()

                    const state3 = {
                        ...state2,
                        toolsModels: modTool(state2.toolsModels, spectrometer.id, {
                            args: {
                                ...spectrometer.args,
                                lectureIsStale: true
                            }
                        })
                    }

                    return trackProgressAndUpdateView(state3)
                }

                return trackProgressAndUpdateView(state2)
            }


            case "checkSuccesNiveau": {
                return trackProgressAndUpdateView({
                    ...state,
                    progressTracker: toolFuncs(state).clearProgressTrackerErrors()
                })
            }


            case "resetDialog": {
                return trackProgressAndUpdateView({
                    ...state,
                    dialog: null,
                    progressTracker: toolFuncs(state).clearProgressTrackerErrors()
                })
            }

            case "toggleCourbeStandardVisible": {
                return {
                    ...state,
                    isCourbeStandardVisible: ! state.isCourbeStandardVisible
                }
            }

            case "changerEmbout": {

                changerEmbout()

                const tf = toolFuncs(state)

                const pipette = tf.getPipette()

                return trackProgressAndUpdateView({
                    ...state,
                    toolsModels: modTool(state.toolsModels, pipette.id, {
                        args: {
                            ...pipette.args,
                            isDirty: null,
                            fillLevel: 0,
                            content: null
                        }
                    })
                })
            }

            case "volAdnUpdated": {

                return {
                    ...state,
                    hasError: false,
                    dialog: null,
                    niveauArgs: {
                        ...state.niveauArgs,
                        volADN: action.value,
                        tableauDilutionOk: false
                    }
                }
            }

            case "volEauUpdated": {
                return {
                    ...state,
                    hasError: false,
                    dialog: null,
                    niveauArgs: {
                        ...state.niveauArgs,
                        volEau: action.value,
                        tableauDilutionOk: false
                    }
                }
            }

            case "confirmTableauDilution": {

                if ((state.niveauArgs.volEau + state.niveauArgs.volADN) !== state.niveauArgs.volumeFinalDilution) {
                    return returnErrorDialog(state, `Les volumes finaux sont incorrects.`)
                }

                if (!(state.niveauArgs.reponse.volEau === state.niveauArgs.volEau &&
                    state.niveauArgs.reponse.volADN === state.niveauArgs.volADN)) {
                    return returnErrorDialog(state,
                        `Le volume final est correct, mais la dilution est incorrecte. Ce n'est pas une dilution ${state.niveauArgs.dilutionNumerateur}/${state.niveauArgs.dilutionDenominateur}.`
                    )
                }

                return trackProgressAndUpdateView({
                    ...state,
                    niveauArgs: {
                        ...state.niveauArgs,
                        tableauDilutionOk: true
                    }
                })
            }

            case "vider": {

                const tf = toolFuncs(state)
                const cuvetteOrWorkTube = tf.toolById(action.toolId)

                return trackProgressAndUpdateView({
                    ...state,
                    toolsModels: modTool(state.toolsModels, cuvetteOrWorkTube.id, {
                        args: {
                            ...cuvetteOrWorkTube.args,
                            content: tf.isNiveau(4) ? [{ contentSourceId: "solution-protéique", volume: 100 }] : [],
                            fillLevel: tf.isNiveau(4) ? 20 : 0
                        }
                    })
                })
            }

            default: throw `invalid action type ${action.type}`
        }
    }

    return mainFunc(state, action)
}


const modTool = (toolsModels, toolId, toolUpdates) => {

    return toolsModels.map(tool => {
        if (tool.id !== toolId) {
            return tool
        }

        return {
            ...tool,
            ...toolUpdates
        }
    })
}

