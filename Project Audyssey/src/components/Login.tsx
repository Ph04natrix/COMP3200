import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import ProgressBar from "./ProgressBar";
import { SetupState } from "./App";

/* // todo
This function is multi-purpose based on the state of the user
- not logged in -> redirect to spotify to get an authorization code
- granted access but needs to update library -> get the access token from spotify using the authorization code in the URL
    - show a progress bar to indicate that the songs are being downloaded
*/

export default function Login({
    setupDone, setSetupDone, loginState
}: {
    setupDone: boolean, setSetupDone: any, loginState: React.MutableRefObject<SetupState>
}) {
    const [libraryCount, setLibraryCount] = useState<number>(0);
    const [currLibraryCount, setCurrLibraryCount] = useState<number>(0);

    if (!setupDone) {
        console.log(loginState);
        switch (loginState.current.status) {
            case "unauthorised":
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
                loginState.current = {status: "authorised", access_token: token};

                requestLibraryCount();
            })
            .catch((err) => console.error(err));
    }

    function requestLibraryCount() {
        invoke<number>("get_user_library_count")
            .then((total) => {
                console.log(total);
                setLibraryCount(total);
                setCurrLibraryCount(total - 1000);
                loadUsersSavedTracks(total);
            })
            .catch((err) => console.error(err));
    }

    // Kicks off the process to start requesting spotify API to get all the saved tracks
    function loadUsersSavedTracks(total: number) {
        invoke<string>("get_user_full_library", {total: total})
    }

    // Setup has finished, move to the main page
    function enterMainPage() {
        setSetupDone();
    }

    return(
        <div className="center">
            <h1>Welcome to Project Audyssey</h1>
            <p>
                To use this application, we require access to your Spotify Library.
                This access can be granted by pressing the below button:               
            </p>
            <div>
                <div>
                    <h3>1. Authorising User</h3>
                    <p>
                        For the Audyssey to access your Spotify Library, you will need to login into Spotify and grant access:
                    </p>
                    <button type="button" onClick={handleClick}>Login to Spotify</button>
                    <ul>
                        <li>Requesting User Authorization</li>
                        <li>Requesting User-Specific Access Token to Spotify API</li>
                    </ul>
                </div>
                <hr />
                <div>
                    <h3>2. Requesting Spotify API Access Code</h3>
                </div>
                <hr />
                <div>
                    <h3>Updating the Audyssey</h3>
                    <p>Any of your saved tracks that are not already in the Audyssey will be fetched from Spotify.</p>
                    <br />
                    <p>{libraryCount} songs found in your library, {} of which need to be downloaded</p>
                    <ProgressBar curr={currLibraryCount} max={libraryCount} description="songs fetched from Spotify Library"/>
                </div>
            </div>
            <button type="button" onClick={enterMainPage}>Enter the Audyssey</button>
        </div>
    )
}