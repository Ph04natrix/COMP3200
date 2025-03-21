import { invoke } from "@tauri-apps/api/core";
import { listen, once } from "@tauri-apps/api/event";

import { useRef, useState } from "react";

import { SetupState } from "../../App";
import ProgressBar from "./ProgressBar";
import { SpotifyLibraryDownloadProgress, SoundChartsUpdateProgress } from "../../types/tauriEvent";

export default function Login({
    setupDone, setSetupDone,
    setupState, setSetupState,
}: {
    setupDone: boolean, setSetupDone: any,
    setupState: SetupState, setSetupState: any
}) {
    const [currLibraryCount, setCurrLibraryCount] = useState<number>(0);
    const [attrSongCount, setAttrSongCount] = useState<number>(0);
    const songStorePath = useRef<string>("");

    if (!setupDone) {
        switch (setupState.status) {
            case "unauthorised":
                console.log(setupState);    
                const url = window.location.search;
                console.log("The current url is: ", {url});

                const urlParams = new URLSearchParams(url);
                let code = urlParams.get("code");
                let error = urlParams.get("error"); // reason why request for authorization failed

                if (code != null) {
                    console.log("Requesting access token with code: ", {code});
                    requestAccessToken(code);
                } else if (error != null) {
                    console.log("ERROR: user authorisation failed: ", {error})
                } else {
                    console.log("No code or error found in url");
                }
                break;
            case "authorised":// * Skip straight to getting the library count
                if (!setupState.libState.waiting) {
                    console.log(setupState);
                    switch (setupState.libState.status) {
                    case "unknown": 
                        requestLibraryCount();
                        break;
                    case "count_known":
                        loadUsersSavedTracks(setupState.libState.total);
                        break;
                    case "fetched_spotify":
                        getNoAttributeCount(setupState.libState.total);
                        break
                    case "sc_count_known":
                        fillSongAttributes();
                        break;
                    case "fetched_attributes":
                        break;
                    }
                }
                break;
        }
    }

    function handleClick() {
        invoke<string>("request_auth_code")
            .then((url) => window.location.replace(url))
            .catch((err) => console.error(err));
    }

    function requestAccessToken(code: string) {
        invoke<string>("request_access_token", { auth_code: code })
            .then((token) => {
                console.log("Access token received: ", {token});
                setSetupState({status: "authorised", access_token: token, libState: {status: "unknown", total: null}});
            })
            .catch((err) => console.error(err));
    }

    function requestLibraryCount() {
        invoke<number>("get_user_library_count")
            .then((total) => {
                console.log("Library total: ", total);
                setSetupState({
                    ...setupState,
                    libState: {
                        status: "count_known",
                        total: total,
                        no_attributes: 0,
                        waiting: false
                    }
                });
            })
            .catch((err) => console.error(err));
    }

    // Kicks off the process to start requesting spotify API to get all the saved tracks
    async function loadUsersSavedTracks(total: number) {
        setSetupState({
            ...setupState,
            libState: {
                status: "known",
                total: total,
                no_attributes: 0,
                waiting: true
            }
        });
        invoke<string>("get_user_full_library", {total: total})
            .then((path) => {
                console.log("Path to parsed songs = ", path);
                songStorePath.current = path;
            });

        const unlisten = await listen<SpotifyLibraryDownloadProgress>('spotify-library-download-progress', (event) => {
            console.log("Downloaded ", event.payload.downloaded, " songs, ", event.payload.remaining, "left to download.");
            setCurrLibraryCount(n => n + event.payload.downloaded);
            console.log("currLibraryCount =", currLibraryCount);
        });

        once("spotify-library-download-finished", (_event) => {
            console.log("Finished fetching spotify songs");
            unlisten();
            setSetupState({
                ...setupState,
                libState: {
                    status: "fetched_spotify",
                    total: total,
                    no_attributes: 0,
                    waiting: false
                }
            });
        });
    }

    async function getNoAttributeCount(total: number) {
        invoke<string>("file_to_ecs_cmd").then(msg => {
            console.log(msg);
            invoke<number>("song_without_attributes_count")
                .then((no_attr_count) => {// Then query for songs without attributes, this function also s
                    setSetupState({
                        ...setupState,
                        libState: {
                            status: "sc_count_known",
                            total: total,
                            no_attributes: no_attr_count,
                            waiting: false,
                        }
                    });
                });
        });
    }

    async function fillSongAttributes() {
        if (setupState.status === "authorised") {
            setSetupState({
                ...setupState,
                libState: {
                    ...setupState.libState,
                    waiting: true
                }
            })
        }
        invoke<string>("fill_song_attributes").then((msg) => console.log(msg));

        const unlisten = await listen<SoundChartsUpdateProgress>("soundcharts-update-progress", (e) => {
            console.log(e.payload.updated_song, " successfully updated with SoundCharts attributes");
            setAttrSongCount(n => n + 1);
        });

        once("soundcharts-update-finished", (_e) => {
            console.log("Finished updating songs with attributes");
            unlisten();
            if (setupState.status === "authorised") {
                setSetupState({
                    ...setupState,
                    libState: {
                        ...setupState.libState,
                        status: "fetched_attributes",
                        waiting: false
                    }
                });
            }
        });
    }

    function finishSetup() {
        console.log("Setup is completed");
        setSetupDone(true);
    }

    return(
        <div className="center">
            <h1>Welcome to Project Audyssey</h1>
            <div>
                <div>
                    <h3>1. Authorising User</h3>
                    <p>
                        For the Audyssey to access your Spotify Library, you will need to login into Spotify and grant access:
                    </p>
                    <button type="button" onClick={handleClick}>Login to Spotify</button>
                </div>
                <hr />
                <div>
                    <h3>2. Requesting Spotify API Access Code</h3>
                    <p>Now that you have granted access to your account, an access token will be fetched that is specific to your account.</p>
                    <p>This code will be destroyed after the app is closed. If this token expires, you may be asked to re-authenticate yourself.</p>
                </div>
                <hr />
                <div>
                    <h3>3. Fetching Your Library</h3>
                    {(
                        setupState.status === "authorised" && setupState.libState.status !== "unknown"
                    ) && <ProgressBar
                        curr={currLibraryCount}
                        max={setupState.libState.total}
                        description="songs fetched from Spotify Library"
                    />}
                </div>
                <hr />
                <div>
                    <h3>4. Updating the Audyssey </h3>
                    <p>For each song fetched from your library, attributes will be fetched from SoundCharts.</p>
                    {(
                        setupState.status === "authorised" && setupState.libState.no_attributes > 0
                    ) && <ProgressBar
                        curr={attrSongCount}
                        max={setupState.libState.no_attributes} // songs without attributes
                        description="songs updated with SoundCharts attributes"
                    />}
                </div>
            </div>
            {(
                setupState.status === "authorised" && setupState.libState.status === "fetched_attributes"
            ) && <button type="button" onClick={finishSetup}>
                Enter the Audyssey
            </button>}
        </div>
    )
}