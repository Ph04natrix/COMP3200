import React from "react";
import ReactDOM from "react-dom/client";

import App from "./components/App";
import Login from "./components/Login";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Login />
  </React.StrictMode>,
);
