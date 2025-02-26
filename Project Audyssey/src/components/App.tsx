import { useState,useRef } from "react";

import "../styles/App.css";
import Login from "./Login";
import Main from "./Main";

export type SetupState = { status: "unauthorised" }
| { status: "authorised", access_token: string};

export default function App() {

  const loginState = useRef<SetupState>({status: "unauthorised"});
  const [setupDone, setSetupDone] = useState<boolean>(false);

  if (!setupDone) {
    return (
      <Login
        setupDone={setupDone}
        setSetupDone={setSetupDone}
        loginState={loginState}
      />
    );
  } else {
    return (<Main />);
  }
  
  /*return (
    <main className="container">
      <h1>Welcome to Project Audyssey</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>
      <BottomBar />
    </main>
  );*/
}