import { AudioResource, SongColType } from "../../../types/audioResources";
import "./TitleBar.css";

export default function TitleBar(props: {
    activeAudioResource: AudioResource
}) {
    return(
        <h1>
            {
                props.activeAudioResource.type === SongColType.Library
                 ? "Your Library"
                 : (
                    props.activeAudioResource.type + ": " + props.activeAudioResource.name
                )
            }
        </h1>
    )
}