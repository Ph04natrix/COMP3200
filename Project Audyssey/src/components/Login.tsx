import { invoke } from "@tauri-apps/api/core";

function Login() {

    return(
        <div className="container">
            <button type="button" onClick={() => invoke("start_login()")}>
                Grant access to your library
            </button>
        </div>
    )
}

export default Login;