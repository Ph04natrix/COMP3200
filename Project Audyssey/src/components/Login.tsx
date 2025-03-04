import { invoke } from "@tauri-apps/api/core";
import { listen, once } from "@tauri-apps/api/event";

import { useState } from "react";

import ProgressBar from "./ProgressBar";
import { SetupState } from "./App";

type SpotifyLibraryDownloadProgress = {
    downloaded: number,
    remaining: number,
}

export default function Login({
    setupDone, setSetupDone,
    setupState, setSetupState,
}: {
    setupDone: boolean, setSetupDone: any,
    setupState: SetupState, setSetupState: any
}) {
    const [currLibraryCount, setCurrLibraryCount] = useState<number>(0);

    if (!setupDone) {
        switch (setupState.status) {
            case "unauthorised":
                console.log(setupState);    
                const url = window.location.search;
                console.log("The current url parameter(s) are: ", {url});

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
                switch (setupState.libState.status) {
                    case "unknown":
                        console.log(setupState);
                        requestLibraryCount();
                        break;
                    case "known":
                        console.log(setupState);
                        loadUsersSavedTracks(setupState.libState.total);
                        break;
                    case "fetched":
                        console.log(setupState);
                        break
                    case "fetching": // Switch fallthrough here, so that fetching 'defaults' in a break
                    default: break;
                }
                break;
            default: break;
        }
    }

    function handleClick() {
        console.log("Grant access to the Audyssey button clicked");
        
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
                        status: "known",
                        total: total
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
                status: "fetching",
                total: total
            }
        });
        invoke<string>("get_user_full_library", {total: total})
            .then((dir) => {
                console.log("Directory that parsed songs live in is: ", dir);
                // todo store this directory as a ref so that it can easily be passed around
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
                    status: "fetched",
                    total: total
                }
            });
        });
    }

    async function getSongsWithoutAttributes() {
        
        
    }

    // Setup has finished, move to the main page
    function enterMainPage() {
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
                    {/* <p>Fetching your saved tracks using the access token.</p>*/}
                    {// Only show this when we have reached the correct state
                        (
                            setupState.status === "authorised" && setupState.libState.status !== "unknown"
                        ) && <ProgressBar
                            curr={currLibraryCount}
                            max={setupState.libState.total}
                            description="songs fetched from Spotify Library"
                        />
                    }
                </div>
                <hr />
                <div>
                    <h3>4. Updating the Audyssey </h3>
                    <p>For each song fetched from your library, attributes will be fetched from SoundCharts.</p>
                    {
                        (setupState.status === "authorised") && <ProgressBar
                            curr={0}
                            max={setupState.libState.total} // songs without attributes
                            description="songs updated with SoundCharts attributes"
                        />
                    }
                </div>
            </div>
            {
                (
                    setupState.status === "authorised" && setupState.libState.status === "fetched"
                ) && <>
                <br />
                    <button type="button" onClick={enterMainPage}>
                        Enter the Audyssey
                    </button>
                </>
            }
        </div>
    )
}