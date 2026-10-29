import React, { useState } from "react"


const IMAGE_PIPETTE_WIDTH = 70


export const SelectPipette = ({ onSelectPipette, ul }) => {

    const selectedPipetteIsP = v => ul === v

    return <div>
        <div>De quelle micropipette avez-vous besoin ? </div>
        <div className="control">
            <label className="radio">
                <input type="radio" name="P20" value={20} onChange={() => { }}
                    checked={selectedPipetteIsP(20)}
                    onClick={() =>onSelectPipette(20)}
                />
                <img src={"img/P20_piston.png"} alt={"P20"} width={IMAGE_PIPETTE_WIDTH} height={IMAGE_PIPETTE_WIDTH} />

            </label>

            <label className="radio">
                <input type="radio" name="P200" value={200} onChange={() => { }}
                    checked={selectedPipetteIsP(200)}
                    onClick={() =>onSelectPipette(200)}
                />
                <img src={"img/P200_piston.png"} alt={"P200"} width={IMAGE_PIPETTE_WIDTH} height={IMAGE_PIPETTE_WIDTH} />
            </label>
            <label className="radio">
                <input type="radio" name="P1000" value={1000} onChange={() => { }}
                    checked={selectedPipetteIsP(1000)}
                    onClick={() => onSelectPipette(1000)}
                />
                <img src={"img/P1000_piston.png"} alt={"P1000"} width={IMAGE_PIPETTE_WIDTH} height={IMAGE_PIPETTE_WIDTH} />
            </label>
        </div>
    </div>
}
