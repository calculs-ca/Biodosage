import React, { useEffect, useReducer, useRef, useState } from "react"
import * as d3 from "d3"
import { createLabDeskReducer} from "./labDeskReducer.jsx"
import { SelectPipette } from "./SelectPipette.jsx"
import { createDrawFuncs } from "./d3Updater.js"
import { niveaux } from "./niveaux.js"
import { toolFuncs } from "./toolFuncs.js"
import _ from 'lodash'

//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
//import {faRotateRight} from '@fortawesome/free-solid-svg-icons'

//import ft_all from "@fortawesome/fontawesome-free/js/all"

import {Recommencer} from "./icons.jsx"


const TEST_TOGGLE = false

const drawFuncs = createDrawFuncs()
const labDeskReducer = createLabDeskReducer(drawFuncs)


const safeParseInt = textInt => {
    try {
        const n = parseInt(textInt)
        return  isNaN(n) ? 0 : n
    }
    catch (Error) {
        return 0
    }
}

const safeParsePositiveInt = textInt => {

    if (textInt === "") {
        return null
    }

    const n = safeParseInt(textInt)

    if(n >= 0) {
        return n
    }
    return 0
}

const safeParseFloat = textFloat => {
    try {
        const n = parseFloat(textFloat)
        return isNaN(n) ? 0 : n
    }
    catch (Error) {
        return 0
    }
}

const safeParsePositiveFloat = textFloat => {

    if (textFloat === "") {
        return null
    }

    const n = safeParseFloat(textFloat)

    if (n >= 0) {
        return n
    }
    return 0
}

const varDisplay = (val, unit) =>
    <b style={{ marginLeft: 4, marginRight: 4 }}>{val} {unit}</b>


const formatFloat2 = d3.format("0.2f")


const ReponseDisplay = ({state}) =>
    <pre style={{paddingTop:0, paddingBottom: 0, marginTop: -20}}>
        {`Réponses: ${JSON.stringify(state.niveauArgs.reponse)}    Progrès: ${JSON.stringify(state.progressTracker)}`}
    </pre>


const EnteteNiveau = ({ titre, listObjectifs, children, onRecommencer}) =>
    <div>
        <h4>{titre}</h4>

        <div>
            <span style={{ marginBottom: 0 }}>À la fin de ce niveau, vous serez en mesure de</span>
            <ul style={{ marginTop: 4 }}>
                {listObjectifs.map((o, idx) =>
                    <li key={`idx-${idx}`}>{o}</li>
                )}
            </ul>
        </div>
        <div className="is-size-5" style={{marginTop:6}}>
            {children}
        </div>
    </div>


const Niveau1 = ({ state, onRecommencer}) => {

    const { volADN, volEau } = state.niveauArgs

    return <EnteteNiveau
        onRecommencer={onRecommencer}
        titre="Niveau 1: Utiliser la micropipette"
        listObjectifs={[
            "Choisir la micropipette appropriée pour prélever un volume donné",
            "Ajuster adéquatement la micropipette pour prélever le volume désiré"
        ]}
    >
        Voici votre environnement de travail. À partir du matériel mis à votre disposition, vous devez prélever {varDisplay(volADN, "μl")}
        de la solution d’ADN et {varDisplay(volEau, "μl")} d’eau et les déposer dans un microtube.

        <br/>
        Cliquez sur les actions indiquées par des points bleus et glisser/déposer la micropipette pour effectuer les manipulations. Le volume des micropipettes peut être modifié en cliquant sur les flèches de part et d'autre de la micropipette.
    </EnteteNiveau>
}


const Niveau2 = ({ state, onRecommencer }) => {

    const {
        dilutionNumerateur,
        dilutionDenominateur,
        volumeFinalDilution
    } = state.niveauArgs

    return <EnteteNiveau
            titre="Niveau 2: Effectuer une dilution"
            onRecommencer={onRecommencer}
            listObjectifs={[
                "Calculer les volumes de solution mère et de solvant à prélever pour effectuer une dilution",
                "Préparer adéquatement une dilution."
            ]}
        >
            Voici votre environnement de travail. À partir du matériel mis à votre disposition, vous devez effectuer une dilution {dilutionNumerateur} / {dilutionDenominateur} de la solution d’ADN dans l'eau.
        Préparer {volumeFinalDilution} μl de la solution dans le microtube.
        </EnteteNiveau>

}

const Niveau3 = ({ state, onRecommencer }) => {

    const {
        concentrationInconnueUgMl
    } = state.niveauArgs

    return <EnteteNiveau
        titre="Niveau 3: Quantifier de l'ADN par spectrophotométrie"
        onRecommencer={onRecommencer}
        listObjectifs={[
            "Ajuster la quantité d'ADN dans la cuvette pour obtenir un intervalle d'absorbance adéquat pour la mesure",
            "Calculer la concentration d'une solution d'ADN à partir de l'absorbance mesurée"
        ]}>
        Voici votre environnement de travail. À partir du matériel mis à votre disposition, vous devez déterminer la concentration de la solution d'ADN par spectrophotométrie.
        Le volume total dans la cuvette doit être de 1 ml. Vous devez effectuer une dilution de l’ADN purifié avant de mesurer l’absorbance de l’échantillon.
        Pour prendre la mesure de l'absorbance, faites glisser et déposer la cuvette sur le spectrophotomètre.
    </EnteteNiveau>
}

const Niveau4 = ({ state, onRecommencer }) => {

    const {
        concentrationInconnueUgMl
    } = state.niveauArgs

    return <EnteteNiveau
        onRecommencer={onRecommencer}
        titre="Niveau 4: Utiliser une courbe standard pour la quantification des protéines"
        listObjectifs={[
            "Déterminer si l'absorbance de l'échantillon tombe dans l'intervalle de la courbe standard",
            "D'évaluer la concentration de l'échantillon dilué à partir d'une courbe standard",
            "D'évaluer la concentration de l'échantillon initial."
        ]}

    >
        Voici ton environnement de travail.
        À partir du matériel mis à ta disposition, tu dois déterminer la concentration de la solution protéique par la méthode de Bradford. Les cuvettes contiennent déjà 1 ml de réactif de Bradford. Ajouter 100 ul
    </EnteteNiveau>
}



const niveauxHeaders = {
    "niveau1": (state, onRecommencer) => <Niveau1 state={state} onRecommencer={onRecommencer}/>,
    "niveau2": (state, onRecommencer) => <Niveau2 state={state} onRecommencer={onRecommencer}/>,
    "niveau3": (state, onRecommencer) => <Niveau3 state={state} onRecommencer={onRecommencer}/>,
    "niveau4": (state, onRecommencer) => <Niveau4 state={state} onRecommencer={onRecommencer}/>
}



export const MainScreen = () => {

    const svgParent = useRef()

    const [labDesk, dispatch] = useReducer(
        labDeskReducer, { niveauId: 'niveau1', displayable: false, screenDimension: [1200,500]}
    )

    const [svgScreen, setSvgScreen] = useState(null)

    const drawScreen = () => {

        const s = drawFuncs.drawSvgLabDesk(...labDesk.screenDimension)
        setSvgScreen(s)
        return s
    }

    useEffect(() => {

        if (svgParent) {
            const svgScreen = drawScreen()

            dispatch({ type: "init", svgScreen, dispatch, niveauId: labDesk.niveauId})
        }
    }, [])

    useEffect(() => {

        if (labDesk.displayable) {
            drawFuncs.updateView(labDesk)
        }
    }, [labDesk.isCourbeStandardVisible, labDesk.niveauId])


    const labDeskFuncs = toolFuncs(labDesk)


    const notifError = msg =>
        <div className={`notification is-danger`}>{msg} {okDialogButton()}</div>

    const reset = () => {
        const svgScreen = drawScreen()
        dispatch({ type: "reset", svgScreen, dispatch})
    }

    const recommencerNiveau = niveauId => {
        const svgScreen = drawScreen()
        dispatch({ type: "startNiveau", niveauId, svgScreen, dispatch })
    }

    const tabsNivaux = () =>
        <div className="tabs is-toggle">
            <ul>
                {
                    niveaux.map(niv =>
                        <li className={`${labDesk.niveauId === niv.id ? "is-active": ""}`} key={niv.id}>
                            <a onClick={() =>  recommencerNiveau(niv.id)}>
                                <span>{niv.label}</span>
                            </a>
                        </li>
                    )
                }
            </ul>
        </div>


    const resetDialogFunc = () => dispatch({ type: "resetDialog"})

    const okDialogButton = () =>
        <div><button className="button is-small is-right" onClick={resetDialogFunc}>Ok</button></div>


    const dialog = () => {

        if (!labDesk.displayable) {
            return null
        }

        const nextNiveau = () => labDesk.niveauNum + 1

        if (labDesk.progressTracker.isTermine) {

            return <div className={`notification is-success`}>
                Niveau {labDesk.progressTracker.niveauNum} terminé !
                {
                labDesk.niveauNum < 3 && <button
                    className="button is-small"
                    onClick={
                        () =>
                            dispatch({ type: "startNiveau", niveauId: `niveau${nextNiveau()}`, dispatch, svgScreen: drawScreen() })
                    }
                >
                    Allez au niveau {nextNiveau()}
                </button>
                
                }
                {
                    labDesk.niveauNum == 3 && <div>Bravo, vous avez terminé avec succès les exercices.</div>
                }
            </div>
        }

        if (! labDesk.dialog) {
            return null
        }

        return <div className={`notification ${labDesk.dialog.extraClasses}`}>
            {
                labDesk.dialog.htmlContent ?
                    <div className="content">
                        {labDesk.dialog.htmlContent()}
                    </div>
                    :
                    labDesk.dialog.content
            }
            {okDialogButton()}
        </div>
    }


    const topRightPanelNiveau4 = () => {

        if (!labDeskFuncs.isNiveau(4)) {
            return null
        }

        return <div>
            <label className="checkbox">
                <input type="checkbox"
                    style={{ marginRight: 10 }}
                    checked={labDesk.isCourbeStandardVisible ? "checked" : ""}
                    onClick={() => dispatch({ type: "toggleCourbeStandardVisible"})}
                    onChange={() =>{}}
                />
                Afficher courbe standard de BSA
            </label>
        </div>
    }

    const rightPanel = () => {


        if (!labDesk.displayable) {
            return null
        }

        const tf = toolFuncs(labDesk)

        if (labDesk.pipetteChoiceInProgress) {

            return <SelectPipette
                ul={tf.getPipette().args.ul}
                    onSelectPipette={ul => dispatch({ type: "selectPipette", ul })}
                />

        }

        if (labDesk.reglerLongeurDondeDialog) {
            return <div className="box">
                <span>Configurer la longueur d'onde</span>
                <div className="field has-addons">
                    <p className="control">
                        <input
                            className="input" type="number"
                            value={tf.getSpectrometer().args.nm || ""}
                            onChange={ev => dispatch({ type: "setLongueurDOnde", nm: safeParsePositiveInt(ev.target.value)})}
                        />
                    </p>
                    <p className="control">
                        <a className="button is-static">nm</a>
                    </p>
                </div>
                <button
                    className="button is-small"
                    onClick={() => dispatch({ type: "réglerLongueurDOndeClose" })}
                >ok</button>
            </div>
        }
    }

    const questionListStyle = {"listStyle": "disc"}

    const promptDeductionConcentration = () =>
        labDesk.displayable && labDesk.niveauArgs.promptDeductionConcentration ?
        <ul>

            <li style={questionListStyle}>
                    <h4>1- Quelle est la concentration en {labDeskFuncs.isNiveau(3) ? "μg/ml" : "mg/ml"} de la solution dans la cuvette ?</h4>

            {
                    (!labDesk.progressTracker.q1Succes) && <>
                            <i>(arrondir la réponse à 3 chiffres significatifs, utiliser un point au lieu d’une virgule pour les décimales)</i>

                        {
                                labDeskFuncs.isNiveau(3) && <p>Cette réponse s'obtient en faisant une règle de trois avec l'info qu'une absorbance de 1 = 50 μg/ml.</p>
                        }


                        <div className="field has-addons">
                            <p className="control">
                                <input
                                    className="input" type="number"
                                    value={labDesk.niveauArgs.reponseConcentration}
                                        onChange={ev => dispatch({ type: "setReponseConcentration", value: safeParsePositiveFloat(ev.target.value), stringEntered: ev.target.value})}
                                />
                            </p>
                            <p className="control">
                                    <a className="button is-static">μg/ml</a>
                            </p>
                        </div>

                        {
                                (labDesk.progressTracker.e1 && notifError(labDesk.progressTracker.e1)) ||
                                <button
                                    className="button is-small"
                                    onClick={() => dispatch({ type: "checkSuccesNiveau", checkVal1: true })}
                                >ok</button>
                        }
                    </>
            }
            {labDesk.progressTracker.q1Succes && <div>
                    {labDesk.niveauArgs.reponseConcentration}
                    <span className="icon-text has-text-success"><span className="icon"><i className="fas fa-check-square"></i></span></span>
            </div>
            }

            </li>

            {labDesk.progressTracker.q1Succes && <li style={questionListStyle}>
                {
                        labDeskFuncs.isNiveau(3) && <h4>2- Quelle est la concentration en μg/ml de la solution d'ADN purifié (tube de départ)?</h4>
                }

                    <i>(arrondir la réponse à 3 chiffres significatifs, utiliser un point au lieu d’une virgule pour les décimales)</i>

                    <div className="field has-addons">
                        <p className="control">
                            <input
                                className="input" type="number"
                                value={labDesk.niveauArgs.reponseConcentrationDepart}
                                onChange={ev => dispatch({ type: "setReponseConcentrationDepart", value: parseFloat(ev.target.value), stringEntered: ev.target.value })}
                            />
                        </p>
                        <p className="control">
                            <a className="button is-static">μg/ml</a>
                        </p>
                    </div>

                    {
                        (labDesk.progressTracker.e2 && notifError(labDesk.progressTracker.e2)) || <button
                            className="button is-small"
                            onClick={() => dispatch({ type: "checkSuccesNiveau", checkVal2: true })}
                        >ok</button>
                    }
            </li>
            }


        </ul>
        :
        null

    const testFillArgs = { type: "fillCuvetteTest", fill: [30, 970] }

    const testPanel = () => labDeskFuncs.isTestMode() &&
        <div>
            <input
                className="input"
                placeholder='format: "ADN,Eau"'
                type="text" value={labDesk.testInputFieldValue || ""}
                onChange={ev => dispatch({ type: "setTestInputFieldValue", value: ev.target.value })}
            />
            <a onClick={() => dispatch({ type:"fillCuvetteTest"})}>TEST remplir cuvette</a>
            <a onClick={() => dispatch(testFillArgs)}>TEST remplir cuvette {testFillArgs.fill.join(",")}</a>
        </div>

    const topPanel = () => {

        if (! labDesk.displayable) {
            return <div></div>
        }

        return niveauxHeaders[labDesk.niveauId](labDesk, () => recommencerNiveau(labDesk.niveauId))
    }

    const restart = () =>
        <button className="button is-default" onClick={reset}>Recommencer</button>


    const onRecommencer = () => recommencerNiveau(labDesk.niveauId)
    return <>
        <div className="container">
            <NavBar state={labDesk} onToggleTestMode={() => dispatch({ type: "toggleTestMode" })} onToggleValiderProttofol={() => dispatch({ type: "toggleBypassProtocol" })}/>
            {tabsNivaux()}
            <div className="columns">
                <div className="column">
                    <div className="content">
                        {topPanel()}
                    </div>
                </div>
            </div>
            {
                labDeskFuncs.isTestMode() && <ReponseDisplay state={labDesk} />
            }
            <div className="columns">
                <div className="column">
                    <a onClick={onRecommencer}>
                    <Recommencer/>
                        Recommencer
                    </a>
                    <p>Si vous ne voyez pas l'ensemble de la page, vous pouvez cliquer sur "Ctrl" et "-" (signe moins) pour diminuer la taille de l'affichage</p>
                    <div id="topSvg" ref={svgParent}></div>
                </div>
                <div className={`column is-one-${labDeskFuncs.isNiveau(2) ? "fourth" : "fifth"}`}>
                    <div className="columns">
                        <div className="column">

                            <MessageBox
                                condition={(labDeskFuncs.isNiveau(2) && labDeskFuncs.niveau2Freeze())}
                                extraClasses=""
                            >
                                Remplir le tableau de dilution
                            </MessageBox>

                            {
                                labDeskFuncs.isNiveau(2) &&
                                <TableDilution
                                    labDesk={labDesk}
                                    volAdnUpdated={ev => dispatch({ type: "volAdnUpdated", value: safeParsePositiveFloat(ev.target.value) })}
                                    volEauUpdated={ev => dispatch({ type: "volEauUpdated", value: safeParsePositiveFloat(ev.target.value) })}
                                    onConfirm={() => dispatch({ type: "confirmTableauDilution" })}
                                />
                            }

                                <MessageBox
                                    condition={(labDeskFuncs.isNiveau(2) && (!labDeskFuncs.niveau2Freeze()))}
                                    extraClasses="is-successZ"
                                >
                                    Les valeurs du tableau sont correctes, vous pouvez procéder aux manipulations
                                    <CheckBoxIcon/>

                                </MessageBox>

                            { testPanel() }
                            { promptDeductionConcentration() }
                            { topRightPanelNiveau4() }
                            { rightPanel() }
                            { dialog() }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
}

const MessageBox = ({ condition, text, children, extraClasses}) =>
    condition ?
    <div className={`notification ${extraClasses}`}>
        {children}
    </div>
    : null


const CheckBoxIcon = () =>
    <div className="icon-text">
        <span className="icon has-text-success">
            <i className="fas fa-check-square"></i>
        </span>
    </div>

const NavBar = ({ state, onToggleTestMode, onToggleValiderProttofol}) =>
    <nav className="navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
            <a className="navbar-item" href="/"></a>

                <a role="button" className="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                </a>
        </div>
        <div className="navbar-menu">
            <div className="navbar-start">
                <a className="navbar-item">
                    Bio Dosage
                </a>

                {
                    TEST_TOGGLE && <a className="navbar-item" onClick={onToggleTestMode}>Mode Test: {state.testMode ? "ACTIF" : "INACTIF"} (cliquer pour activer/désactiver))</a>
                }

                {
                    TEST_TOGGLE && <a className="navbar-item" onClick={onToggleValiderProttofol}>Validation Protocol: {state.validerProtocolManip ? "ACTIF" : "INACTIF"} (cliquer pour activer/désactiver))</a>
                }


                <div className="navbar-item has-dropdown is-hoverable">
                    <div className="navbar-dropdown">
                        <a className="navbar-item">à propos</a>
                    </div>
                </div>
            </div>

            <div className="navbar-end">
                <div className="navbar-item">
                    <div className="buttons"></div>
                </div>
            </div>
        </div>
    </nav>


const TableDilution = ({labDesk, volAdnUpdated, volEauUpdated, onConfirm}) => {

    if (!labDesk || !labDesk.niveauArgs) {
        return null
    }

    const editableCellStyle = { paddingLeft: 1, paddingRight: 1}

    const readonlyCellStyle = { paddingTop: 14, paddingLeft: 14}

    const {
        dilutionNumerateur,
        dilutionDenominateur,
        dilutionUnit,
        volumeFinalDilution
    } = labDesk.niveauArgs

    return <div>
        <table className="table is-bordered is-striped">
            <thead>
                <tr>
                    <th>Dilution</th>
                    <th>Volume final de la dilution (μl)</th>
                    <th>Volume d'ADN purifié  (μl)</th>
                    <th>Volume d'eau (μl)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style={readonlyCellStyle}>
                        {dilutionNumerateur} / {dilutionDenominateur}
                    </td>
                    <td style={readonlyCellStyle}>{volumeFinalDilution}</td>
                    <td style={editableCellStyle}>
                        <div className="field">
                            <p className="control">
                                <input
                                    className="input" type="number"
                                    value={labDesk.niveauArgs.volADN || ""}
                                    onChange={volAdnUpdated}
                                    disabled={labDesk.niveauArgs.tableauDilutionOk}
                                    onKeyPress={(e) => {
                                        if (e.key === "e" || e.key === "-") {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </p>
                        </div>
                    </td>
                    <td style={editableCellStyle}>
                        <div className="field">
                            <p className="control">
                                <input
                                    className="input" type="number"
                                    value={labDesk.niveauArgs.volEau || ""}
                                    onChange={volEauUpdated}
                                    disabled={labDesk.niveauArgs.tableauDilutionOk}
                                    onKeyPress={(e) => {
                                        if (e.key === "e" || e.key === "-") {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </p>
                        </div>

                    </td>
                </tr>
            </tbody>
        </table>
        {
            (! labDesk.niveauArgs.tableauDilutionOk) && <button className="button is-default" onClick={onConfirm}>Ok</button>
        }
    </div>
}