import { ChangeEventHandler, useEffect, useState } from "react"
import "../RightColumn/RangeSlider.css";
import { ContinuousMetric } from "../../../types/audioResources";

type RangeSliderProps = {
    min: number,
    max: number,
    range: {
        currMin: number,
        currMax: number
    }
    attr: ContinuousMetric,
    updateRange: any
}

export default function RangeSlider(
    {min, max, range, attr, updateRange}: RangeSliderProps
) {
    const [minValue, setMinValue] = useState<number>(range ? range.currMin : min);
    const [maxValue, setMaxValue] = useState<number>(range ? range.currMax : max);
    const step = 0.01;
    
    useEffect(() => {
        if (range) {
            setMinValue(range.currMin);
            setMaxValue(range.currMax);
        }
    }, [range]);

    const handleMinChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        event.preventDefault();
        const value = parseFloat(event.target.value);

        const newMinVal = Math.min(value, maxValue - step);
        if (!range) setMinValue(newMinVal);
        updateRange(newMinVal, maxValue, attr); // prop which changes the state of the value which is all the way at the parent
    }

    const handleMaxChange = (event: any) => {
        event.preventDefault();
        const value = parseFloat(event.target.value);
        
        const newMaxVal = Math.max(value, minValue + step);
        if (!range) setMaxValue(newMaxVal);
        updateRange(minValue, newMaxVal, attr);
    }

    // overlaying the sliders over each other
    const minPos = ((minValue - min) / (max - min)) * 100;
    const maxPos = ((maxValue - min) / (max - min)) * 100;

    return(
        <div className="range-slider">
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