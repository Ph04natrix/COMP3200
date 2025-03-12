import { useState } from "react";

import "./App.css";
import Login from "./components/Setup/Login";
import Main from "./components/Home/Home";

export type SetupState
 = { status: "unauthorised" }
 | { status: "authorised", access_token: string, libState: LibraryState };

export type LibraryStatus
 = "unknown"
 | "count_known"
 | "fetched_spotify"
 | "sc_count_known"
 | "fetched_attributes"
export type LibraryState = { status: LibraryStatus, total: number, no_attributes: number, waiting: boolean };

export default function App() {

  const [setupState, setSetupState] = useState<SetupState>({status: "unauthorised"});
  const [setupDone, setSetupDone] = useState<boolean>(false);

  return (setupDone && setupState.status === "authorised") ? (
    <Main />
  ) : (
    <Login
      setupDone={setupDone} setSetupDone={setSetupDone}
      setupState={setupState} setSetupState={setSetupState}
    />
  )
};