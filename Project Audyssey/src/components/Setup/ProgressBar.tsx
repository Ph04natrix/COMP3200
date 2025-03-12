import "./ProgressBar.css";

export default function ProgressBar({curr, max, description}: {curr: number, max: number, description: string}) {

    function getPercentage(now: number, min: number, max: number) {
        const percentage = (now - min) / (max - min) * 100;
        return Math.round(percentage * 1000) / 1000
    }

    return(
        <div id="container">
            <p>{curr}/{max} {description}</p>
            <div className="meter">
                <span
                    style={{ width: `${getPercentage(curr, 0, max)}%`}}
                ></span>
            </div>
        </div>
    )
}