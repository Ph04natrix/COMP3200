import { useState } from "react"


export default function RangeSlider(
    {min, max}: {min : number, max: number}
) {
    const [minValue, setMinValue] = useState<number>(min);
    const [maxValue, setMaxValue] = useState<number>(max);
    const step = 0;
    
    const handleMinChange = (event: any) => {
        event.preventDefault();
        const value = parseFloat(event.target.value);
        
        // 0 should be changed with the step prop
        const newMinVal = Math.min(value, maxValue - step);
        setMinValue(newMinVal);
    }

    const handleMaxChange = (event: any) => {
        event.preventDefault();
        const value = parseFloat(event.target.value);
        
        // 0 should be changed with the step prop
        const newMaxVal = Math.max(value, minValue + step);
        setMaxValue(newMaxVal);
    }

    // overlaying the sliders over each other
    const minPos = ((minValue - min) / (max - min)) * 100;
    const maxPos = ((maxValue - min) / (max - min)) * 100;

    return(
        <div className="wrapper">
            <div className="input-wrapper">
                <input
                    type="range"
                    value={minValue}
                    min={min}
                    max={max}
                    step={step}
                    onChange={handleMinChange}
                />
                <input
                    type="range"
                    value={maxValue}
                    min={min}
                    max={max}
                    step={step}
                    onChange={handleMaxChange}
                />
            </div>

            <div className="control-wrapper">
              <div className="control" style={{ left: `${minPos}%` }} />
              <div className="rail">
                <div
                  className="inner-rail"
                  style={{ left: `${minPos}%`, right: `${100 - maxPos}%` }}
                />
              </div>
              <div className="control" style={{ left: `${maxPos}%` }} />
            </div>
        </div>
    )
}