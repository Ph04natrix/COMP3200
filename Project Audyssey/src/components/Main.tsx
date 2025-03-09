import { useState } from "react";
import BottomBar from "./BottomBar";

/* //todo
Can use source which is just one audio collection
Or can use multiple sources of track

*/
type SongCollection = {
    type: SongCollectionType,
    name: string
}

type SongCollectionType
 = "Library"
 | "Album" | "Compilation" | "Single"
 | "Playlist"
;

export default function Main() {
    const [currSongCollection, setCurrSongCollection] = useState<SongCollection>({
        type: "Library",
        name: ""
    });
       
    return(<>
    <div className="TopSection">
        <div className="title">
            <h1>
                {currSongCollection.type === "Library" ? "Your Library" : (currSongCollection.type + ": " + currSongCollection.name)}
            </h1>
        </div>
    </div>
    <div className="flex-row">
        <div className="LeftColumn"></div>
        <div className="CenterColumn">
            <p>This is where the main page of the application will be.</p>
        </div>
        <div className="RightColumn"></div>
    </div>
    <BottomBar />
    </>);
}