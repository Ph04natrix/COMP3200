import { AudioResource, SongColType } from "../../../types/audioResources";
import "./TitleBar.css";

export default function TitleBar(
    {activeAudioResource}: {activeAudioResource: AudioResource}
) {
    return(
        <h1>
            {
                activeAudioResource.type === SongColType.Library
                 ? "Your Library"
                 : (
                    activeAudioResource.type + ": " + activeAudioResource.name
                )
            }
        </h1>
    )
}