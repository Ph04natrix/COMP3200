import React from "react";
import ReactDOM from "react-dom/client";

import App from "./components/App";

// Add React.StrictMode to render twice to check for development only bugs.

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
