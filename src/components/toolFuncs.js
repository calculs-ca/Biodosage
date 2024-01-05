import * as d3 from "d3"
import { niveaux } from "./niveaux.js"
import _ from 'lodash'


export const toolFuncs = (state, failSafe = false) => {

    const toolById = toolId => {
        const tool = _.find(state.toolsModels, t => t.id === toolId)

        if (!tool && !failSafe) {
            throw `invalid tool: ${toolId}`
        }

        return tool
    }

    const toolCollidesWithList = theTool => {

        const toolBounds = tool => ({
            left: tool.x,
            right: tool.x + tool.collisionRect.width,
            top: tool.y,
            bottom: tool.y + tool.collisionRect.height
        })

        const rectsCollide = (boundsA, boundsB) =>
            Math.max(boundsA.left, boundsB.left) < Math.min(boundsA.right, boundsB.right) &&
            Math.max(boundsA.top, boundsB.top) < Math.min(boundsA.bottom, boundsB.bottom)

        return _.filter(
            state.toolsModels,
            otherTool =>
                otherTool.id !== theTool.id &&
                rectsCollide(toolBounds(theTool), toolBounds(otherTool))
        )
    }

    const getWorkTube = () => toolById('work-tube')

    const getCuvette = () => toolById('cuvette')

    const getCuvette2 = () => toolById('cuvette2')

    const getCuvetteOrWorkTube = () => {
        const safeTF = toolFuncs(state, true)
        return safeTF.getCuvette() || safeTF.getWorkTube()
    }

    const cuvetteOrWorkTubeContent = (cuvette) => {

        const workTubeOrCuvette = cuvette || getCuvetteOrWorkTube()

        if (workTubeOrCuvette.args.content.length === 0) {

            return {
                isEmpty: true
            }
        }

        const dna = _.find(workTubeOrCuvette.args.content, c => c.contentSourceId === 'dna-tube')
        const water = _.find(workTubeOrCuvette.args.content, c => c.contentSourceId === 'water-tube')

        return {
            dna, water, isEmpty: false
        }
    }

    const cuvetteContent = cuvette =>
        cuvetteOrWorkTubeContent(cuvette)

    const toolCollidesWithOther = (tool1, tool2) => _.find(toolCollidesWithList(tool1), t => t.id === tool2.id)

    const getPipette = () => toolById('micro-pipette')

    const getSpectrometer = () => toolById('spectrometer')

    const getCuvetteOnSpectro = () => {


        const check = cuvette => {
            const spectrometer = getSpectrometer()

            const otherCollidingTool = toolCollidesWithOther(cuvette, spectrometer)


            return (otherCollidingTool && otherCollidingTool.id === spectrometer.id) ||
                (spectrometer.isCollidingWith) && spectrometer.isCollidingWith === cuvette.id
        }

        const c1 = getCuvette()

        if (check(c1)) {
            return c1
        }

        const c2 = getCuvette2()

        if (check(c2)) {
            return c2
        }

        return null
    }

    const blend = (workTubeOrCuvette, pipette) => {

        if (pipette.args.content === null || pipette.args.content.length === 0) {
            return workTubeOrCuvette.args.content
        }

        const content = [...workTubeOrCuvette.args.content, { ...pipette.args.content }]        

        const res = _.chain(content)
            .groupBy(c => c.contentSourceId)
            .values()
            .map(c => {
                const [c1, c2] = c
                if(!c2) {
                    return c1
                }
                return {
                    contentSourceId: c1.contentSourceId,
                    volume: c1.volume + c2.volume
                }
            }).value()

        return res
    }



    const volumeSelonAjustement = () => {

        const pipette = getPipette()

        const wheelValues = pipette.args.wheelValues
        const wheelCoeficients = pipette.args.wheelCoeficients

        return _.sum(
            _.zip(wheelValues, wheelCoeficients)
                .map(([value, coeficient]) => value * coeficient)
        )
    }

    const formattedPipetteVol = () => {
        const vol = volumeSelonAjustement()

        const pipette = getPipette()

        switch (pipette.args.ul) {
            case -1:
                return "0"
            case 20:
                return d3.format("0.2f")(vol)
            case 200:
                return d3.format("0.1f")(vol)
            case 1000:
                return `${Math.round(vol)}`
            default:
                throw Error(`unknown pipette type ${pipette.args.ul}`)
        }
    }

    const volumeSelonAjustementArrondi = () =>
        Math.round(volumeSelonAjustement())


    const getNiveau = () => _.find(niveaux, n => n.id === state.niveauId)


    const isPipetteMoreThanFull = () => {
        const pipette = getPipette()
        const vol = volumeSelonAjustement()
        return vol > pipette.args.ul
    }

    const isNiveau = n => `niveau${n}` === state.niveauId

    const pipetteProperties = ul => {
        switch (ul) {
            case 20:
                return [
                    [2, 9, 9],
                    [10, 1, 0.1],
                    [1, 1, 0.2]
                ]
            case 200:
                return [
                    [2, 9, 9],
                    [100, 10, 1],
                    [1, 1, 0.2]
                ]
            case 1000:
                return [
                    [1, 9, 9],
                    [1000, 100, 10],
                    [1, 1, 0.2]
                ]
            default: throw `invalid pipette ul ${ul}`
        }
    }


    const progressTracker = action => {

        if(!state.niveauId) {
            return {}
        }

        const cuvetteOrWorkTubeContentO = cuvetteOrWorkTubeContent()

        const workTubeOrCuvette = toolFuncs(state).getCuvetteOrWorkTube()

        const has2Ingredients = workTubeOrCuvette.args.content.length >= 2

        const eq = (v1, v2) => Math.round(v1) == Math.round(v2)

        if (isNiveau(1)) {

            const dillutionsOk =
                has2Ingredients &&
                eq(cuvetteOrWorkTubeContentO.dna.volume, state.niveauArgs.reponse.volADN) &&
                eq(cuvetteOrWorkTubeContentO.water.volume, state.niveauArgs.reponse.volEau)

            const dillutionAjitee = workTubeOrCuvette.args.isShaken

            return {
                dillutionsOk,
                isTermine: dillutionsOk && dillutionAjitee
            }
        }
        else if (isNiveau(2)) {

            const dillutionsOk =
                has2Ingredients &&
                eq(cuvetteOrWorkTubeContentO.dna.volume, state.niveauArgs.reponse.volADN) &&
                eq(cuvetteOrWorkTubeContentO.water.volume, state.niveauArgs.reponse.volEau)

            const tableauDilutionOk = state.niveauArgs.tableauDilutionOk

            const dillutionAjitee = workTubeOrCuvette.args.isShaken

            return {
                dillutionsOk,
                tableauDilutionOk,
                dillutionAjitee,
                isTermine: dillutionsOk && tableauDilutionOk && dillutionAjitee
            }
        }
        else if (isNiveau(3)) {

            const cos = getCuvetteOnSpectro()

            const notComplete = () => ({
                reponseConcentrationOk: false,
                isTermine: false
            })

            if (!cos) {
                return notComplete()
            }

            const cosc = cuvetteContent(cos)


            const b_concentrationInconnue = state.niveauArgs.reponse.concentrationInconnueUgMl
            const e_vol_adn =
                ((!workTubeOrCuvette) || cosc.isEmpty || (!cosc.dna)) ? 0 : 1.0 * cosc.dna.volume

            const f_vol_adn_ml = e_vol_adn / 1000

            const g_concentration_apres_dilution_ug_ml = Math.round(10 * (b_concentrationInconnue * f_vol_adn_ml) / 1) / 10

            const i_do = g_concentration_apres_dilution_ug_ml / 50

            const reponseConcentrationOk = state.niveauArgs.reponseConcentration === g_concentration_apres_dilution_ug_ml

            const concentrationDepart = b_concentrationInconnue

            const pre = g_concentration_apres_dilution_ug_ml * (1000 / e_vol_adn)


            const calc_b_concentrationInconnue_arrondi = () => {

                if (pre >= 100)
                     return Math.round(pre)
                if(pre >= 10)
                    return Math.round(10 * pre) / 10

                return Math.round(100 * pre) / 100
            }

            const b_concentrationInconnue_arrondi = calc_b_concentrationInconnue_arrondi()

            const reponseConcentrationDepartOk = state.niveauArgs.reponseConcentrationDepart === b_concentrationInconnue_arrondi

            const erreurChiffresSignificatifs = (sInt, i) => {

                const sep = ()=> {
                    if(sInt.indexOf(".") != -1)
                        return "."
                    if (sInt.indexOf(",") != -1)
                        return ","
                    return null
                }

                const s = sep()
                if(s === null) {
                    //un nombre entier (sans virgule ou point) est toujours arrondi correctement
                    return false
                }

                if(i >= 100) {
                    // la seule présence d'une virgule lorsque >= 100 est une erreur, il faut arrondir après la virgule
                    return true
                }

                // lorsque 0.xyz, on veut 3 chiffres après la virgule, donc 5
                if(i < 1) {
                    return sInt.length != 5
                }


                return sInt.length != 4
            }

            const e1 = (() => {

                if (action.type === "resetDialog") {
                    return null
                }

                if (!action.checkVal1) {
                    return null
                }

                if (action.checkVal1 && (!reponseConcentrationOk)) {
                    return "mauvaise réponse !"
                }

                if (action.checkVal1 && erreurChiffresSignificatifs(state.niveauArgs.reponseConcentrationStringEntered, state.niveauArgs.reponseConcentration)) {
                    return "Votre réponse n'est pas arrondie à 3 chiffres significatifs"
                }

                return null
            })()

            const e2 = (() => {

                if (action.type === "resetDialog") {
                    return null
                }

                if (!action.checkVal2) {
                    return null
                }

                if(action.checkVal2 && (!reponseConcentrationDepartOk)) {
                    return "mauvaise réponse !"
                }

                if (action.checkVal2 && erreurChiffresSignificatifs(state.niveauArgs.reponseConcentrationDepartStringEntered, state.niveauArgs.reponseConcentrationDepart)) {
                    return "Votre réponse n'est pas arrondie à 3 chiffres significatifs"
                }

                return null
            })()


            const res = {
                q1Succes: state.progressTracker.q1Succes || action.checkVal1 && reponseConcentrationOk && e1 === null,
                reponseConcentrationOk,
                reponseConcentrationDepartOk,
                concentrationDepart,
                b_concentrationInconnue_arrondi,
                g_concentration_apres_dilution_ug_ml,
                i_do,
                isTermine: state.progressTracker.q1Succes && action.checkVal2 && reponseConcentrationDepartOk && e2 === null,
                e1,
                e2
            }

            return res
        }
        else if (isNiveau(4)) {

            const reponseConcentrationOk = state.niveauArgs.reponseConcentration === state.niveauArgs.reponse.concentrationInconnueMgMl

            const cos = getCuvetteOnSpectro()

            const notComplete = () => ({
                reponseConcentrationOk,
                isTermine: false
            })

            if (!cos) {
                return notComplete()
            }

            const cosc = cuvetteContent(cos)

            const fractionDilution =
                ((!workTubeOrCuvette) || cosc.isEmpty || (!cosc.dna) || (!cosc.water)) ? 0 :
                    (1.0 * cosc.dna.volume) / (1.0 * cosc.water.volume)

            const concentrationDepart = Math.round(1000 * fractionDilution * state.niveauArgs.reponse.concentrationInconnueMgMl) / 1000.0

            const reponseConcentrationDepartOk = state.niveauArgs.reponseConcentrationDepart === concentrationDepart

            const e1 = action.checkVal1 && (!reponseConcentrationOk)

            const e2 = action.checkVal2 && (!reponseConcentrationDepartOk)

            return {
                reponseConcentrationOk,
                reponseConcentrationDepartOk,
                concentrationDepart,
                isTermine: reponseConcentrationOk && reponseConcentrationDepartOk,
                e1: e1 && action.type !== "resetDialog",
                e2: e2 && action.type !== "resetDialog"
            }
        }

        throw Error(`bad niveauId ${state.niveauId}`)
    }

    return {
        toolById,
        getPipette,
        getSpectrometer,
        getWorkTube,
        getDNATube: () => toolById('dna-tube'),
        getCuvette,
        getCuvette2,
        cuvetteContent,
        cuvetteOrWorkTubeContent,
        toolCollidesWith: tool => _.first(toolCollidesWithList(tool)),
        getCuvetteOnSpectro,
        volumeSelonAjustement,
        volumeSelonAjustementArrondi,
        formattedPipetteVol,
        isPipetteMoreThanFull,
        getNiveau,
        isNiveau,
        isInNiveau: listN => !!_.find(listN, isNiveau),
        niveau2Freeze: () =>
            isNiveau(2) && !state.niveauArgs.tableauDilutionOk,
        getCuvetteOrWorkTube,
        isTestMode: () =>
            state.displayable && state.testMode,
        pipetteProperties,
        progressTracker,
        clearProgressTrackerErrors: () => ({ ...state.progressTracker, e1: null, e2: null }),
        blend
    }
}
