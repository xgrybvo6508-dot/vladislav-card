import "./ui/tokens.css";
import "./ui/styles.css";
import { mountApp } from "./ui/app";

const root = document.querySelector<HTMLElement>("#app");

if (root === null) {
  throw new Error("App root was not found.");
}

mountApp(root, window.localStorage);
