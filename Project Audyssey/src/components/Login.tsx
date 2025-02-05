import { invoke } from "@tauri-apps/api/core";

function Login() {
    function handleClick() {
        console.log("Grant access to the Audyssey button clicked");
        invoke<string>("start_login")
            .then((url) => window.location.replace(url))
            .catch((err) => console.error(err));
    }

    return(
        <>
            <p>
                To use this application, we require access to your Spotify Library.
                This access can be granted by pressing the below button:               
            </p>
            <button type="button" onClick={handleClick}>
                Grant access to your library
            </button>
        </>
    )
}

export default Login;