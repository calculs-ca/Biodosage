
import { createLabDeskReducer } from "./labDeskReducer.jsx"

import {toolFuncs} from "./toolFuncs.js"


const identity = i=>i

const labDeskReducer = createLabDeskReducer({ drawTools: identity, moveWheel: identity, updateView: identity, shakeFunc: identity})

const niveau1State = () => labDeskReducer({niveauId: "niveau1"}, {type: "init"})

test("test niveau1 sanity", () => {

    expect(niveau1State().niveauId).toEqual("niveau1")
})


// niveau 1

test("test basic manips", () => {

    const s0 = niveau1State()

    expect(s0.niveauId).toEqual("niveau1")

    expect(toolFuncs(s0).getDNATube().args.isShaken).toBeFalsy()

    const s1 = labDeskReducer(s0, { type: "shake", toolId: "dna-tube"})

    expect(toolFuncs(s1).getDNATube().args.isShaken).toBeTruthy()

})


const mockToolCollide = (state, collidingToolId) => ({
    ...state,
    toolsModels: state.toolsModels.map(tool => {

        if (tool.id === collidingToolId) {
            return {
                ...tool,
                isCollidingWith: 'micro-pipette'
            }
        }

        return {
            ...tool,
            isCollidingWith: null
        }
    })
})



test("test error dialogs niveau1", () => {

    const s0 = niveau1State()

    const s1 = labDeskReducer(s0, { type: "aspirer", toolId: "micro-pipette" })

    expect(toolFuncs(s1).getDNATube().args.isShaken).toBeFalsy()

    expect(s1.dialogFunc).not.toBeNull()

})

// niveau 4

const niveau4State = () => labDeskReducer({ niveauId: "niveau4" }, { type: "init" })





const prepareCuvette = state => {

    let s = state

    s = labDeskReducer(s, { type: "shake", toolId: "dna-tube" })

    s = labDeskReducer(s, { type: "selectPipette", ul: 20 })

    s = mockToolCollide(s, 'dna-tube')

    expect(
        toolFuncs(s).getDNATube().isCollidingWith
    ).toEqual("micro-pipette")


    s = labDeskReducer(s, { type: "roll", delta: 3, wheelIdx: 1 })

    s = labDeskReducer(s, { type: "aspirer" })

    expect(toolFuncs(s).cuvetteOrWorkTubeContent().isEmpty).toBe(true)

    s = mockToolCollide(s, 'cuvette')

    s = labDeskReducer(s, { type: "éjecter" })

    expect(toolFuncs(s).cuvetteOrWorkTubeContent().isEmpty).toBeFalsy()


    expect(toolFuncs(s).cuvetteOrWorkTubeContent()).toEqual({
        dna: {
            volume: 3,
            contentSourceId: "dna-tube"
        },
        isEmpty: false
    })

    s = labDeskReducer(s, { type: "selectPipette", ul: 200 })

    s = labDeskReducer(s, { type: "roll", delta: 1, wheelIdx: 0 })

    s = mockToolCollide(s, 'water-tube')

    s = labDeskReducer(s, { type: "aspirer" })

    expect(s.dialogFunc).toBeFalsy()

    s = mockToolCollide(s, 'cuvette')

    expect(toolFuncs(s).getCuvette().isCollidingWith).toBe("micro-pipette")

    //console.log("z1", toolFuncs(s).getPipette().args.content)


    s = labDeskReducer(s, { type: "éjecter" })


    console.log("z2", toolFuncs(s).getCuvette().args.content)

    //console.log(toolFuncs(s).cuvetteOrWorkTubeContent())


    expect(toolFuncs(s).cuvetteOrWorkTubeContent()).toEqual({
        water: {
            volume: 200,
            contentSourceId: 'water-tube'
        },
        dna: {
            volume: 3,
            contentSourceId: "dna-tube"
        },
        isEmpty: false
    })


}


test("test cuvette ready", () => {

    prepareCuvette(niveau4State())

})
