import { toolFuncs } from "./toolFuncs.js"
import { standardCurveData, leastSquares } from "./labDeskReducer.jsx"

const randomIntFromInterval = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)

const isOdd = n => n % 2 !== 0


export const spectroLecture = state => {

    const tf = toolFuncs(state)

    const cuvette = tf.getCuvetteOnSpectro()

    const cuvetteContent = tf.cuvetteContent(cuvette)

    const noWater = !cuvetteContent.water

    const b_concentrationInconnue = state.niveauArgs.reponse.concentrationInconnueUgMl
    const e_vol_adn =
        cuvetteContent.dna ?
            cuvetteContent.dna.volume :
            0

    const f_vol_adn_ml = e_vol_adn / 1000

    const g_concentration_apres_dilution_ug_ml = Math.round(10 * (b_concentrationInconnue * f_vol_adn_ml) / 1) / 10

    const i_do = g_concentration_apres_dilution_ug_ml / 50

    return [i_do, noWater]
}



export const niveaux = [
    {
        id: "niveau1", label: "Niveau 1 (Sc. 1)", toolIdsForLevel: ['dna-tube', 'micro-pipette', 'water-tube', 'work-tube'], niveauNum: 1,
        screenDimension: [1200, 500],
        randomArgsGen:
            () => {

                let volADN = null
                let volEau = null

                do {
                    volADN = randomIntFromInterval(10, 500)
                    volEau = randomIntFromInterval(10, 500)
                }
                while (volADN === volEau || isOdd(volADN) || isOdd(volEau))

                return {
                    volADN,
                    volEau,
                    reponse: { volADN, volEau }
                }
            }
    },
    {
        id: "niveau2", label: "Niveau 2 (Sc. 1)", toolIdsForLevel: ['dna-tube', 'micro-pipette', 'water-tube', 'work-tube'], niveauNum: 2,
        screenDimension: [900, 500],

        randomArgsGen: () => {

            do {

                const choixAleatoires = [
                    [50, [2, 5, 10, 20, 25]],
                    [100, [2, 5, 10, 20, 25, 50]],
                    [200, [2, 5, 10, 20, 25, 50, 100]],
                    [500, [2, 5, 10, 20, 25, 50, 100, 200]],
                    [600, [2, 5, 10, 20, 25, 50, 100, 200]],
                    [1000, [2, 5, 10, 20, 25, 50, 100, 200]],
                ]

                let r1 = randomIntFromInterval(0, choixAleatoires.length - 1)
                //r1 = 4

                const [volumeFinalDilution, dilutionDenominateurPossibles] = choixAleatoires[r1]

                let r2 = randomIntFromInterval(0, dilutionDenominateurPossibles.length - 1)
                //r2 = 5



                const dilutionDenominateur = dilutionDenominateurPossibles[r2]

                const volADN = Math.round(volumeFinalDilution / dilutionDenominateur)

                const reponse = {
                    volADN,
                    volEau: volumeFinalDilution - volADN
                }

                if (reponse.volADN === reponse.volEau) {
                    continue
                }

                if (!(isOdd(volADN) || isOdd(reponse.volEau))) {
                    return ({
                        dilutionNumerateur: 1,
                        dilutionDenominateur,
                        volumeFinalDilution,
                        volADN: 0,
                        volEau: 0,
                        reponse
                    })
                }
            }
            while (true)
        }
    },
    {
        id: "niveau3", label: "Niveau 3 (Sc. 4)", toolIdsForLevel: ['dna-tube', 'micro-pipette', 'water-tube', 'cuvette', 'cuvette2', 'spectrometer'], niveauNum: 3,
        screenDimension: [990, 500],

        randomArgsGen: () => {

            const concentrationInconnueUgMl = randomIntFromInterval(10, 999)

            return {
                reponse: {
                    concentrationInconnueUgMl
                }
            }
        },

        spectroLecture
    }
]

const n4 = [
    {
        id: "niveau4", label: "Niveau 4 (Sc. 5)", toolIdsForLevel: ['dna-tube', 'micro-pipette', 'water-tube', 'cuvette', 'cuvette2', 'spectrometer'], niveauNum: 4,
        screenDimension: [1200, 500],

        randomArgsGen: () => {

            const concentrationInconnueMgMl = randomIntFromInterval(1, 120) / 1000

            return {
                reponse: { concentrationInconnueMgMl }
            }
        },
        spectroLecture: state => {

            const tf = toolFuncs(state)

            const cuvette = tf.getCuvetteOnSpectro()

            const cuvetteContent = tf.cuvetteContent(cuvette)


            if (!cuvetteContent.water) {
                return 0
            }

            const lsq = leastSquares(
                standardCurveData.map(p => p.x),
                standardCurveData.map(p => p.y)
            )

            const volFinalML = 1.0

            const volAdnMl =
                cuvetteContent.dna ?
                    cuvetteContent.dna.volume  :
                    0

            const concentrationApresDilution = state.niveauArgs.reponse.concentrationInconnueMgMl * volAdnMl / (volFinalML * 1000)

            console.log([volAdnMl, concentrationApresDilution])

            const lecture = lsq.slope * concentrationApresDilution + lsq.intercept

            return Math.round(1000 * lecture) / 1000
        }
    }
]