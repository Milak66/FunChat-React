import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./components/app/app";
import store from "./components/store/store";
import { Provider } from "react-redux";

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <App />
  </Provider>
);
