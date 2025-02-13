import { invoke } from "@tauri-apps/api/core";
import { useRef } from "react";

import CircleNumber from "../components/CircleNumber";

/* // todo
This function is multi-purpose based on the state of the user
- not logged in -> redirect to spotify to get an authorization code
- granted access but needs to update library -> get the access token from spotify using the authorization code in the URL
    - show a progress bar to indicate that the songs are being downloaded
*/

export default function Login() {
    type SetupState =
        | { status: "unauthorised" }
        | { status: "authorised", access_token: string};

    const loginState = useRef<SetupState>({status: "unauthorised"});
    
    // if we are unauthorised then we need to become authorised
    if (loginState.current.status === "unauthorised") {
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
            // We don't have a code or error
            // check if we have an access token
            console.log("No code or error found in url");
            
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
                invoke<number>("get_users_saved_tracks").then((total) => console.log(total));
            })
            .catch((err) => console.error(err));
    }

    return(
        <>
        <h1>Welcome to Project Audyssey</h1>
            <p>
                To use this application, we require access to your Spotify Library.
                This access can be granted by pressing the below button:               
            </p>
            <button type="button" onClick={handleClick}>
                Enter the Audyssey
            </button>
            <p>{loginState.current.toString()}</p>
            <div>
                <div>
                    <h3>Gaining access to your library</h3>
                    <ul>
                        <li>Requesting User Authorization</li>
                        <li>Requesting User-Specific Access Token to Spotify API</li>
                    </ul>
                </div>
            </div>
        </>
    )
}