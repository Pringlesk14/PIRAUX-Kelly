import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/900.css";
import { continueRender, delayRender } from "remotion";

const handle = delayRender("Chargement des polices");
Promise.all([
  document.fonts.load("900 80px Montserrat"),
  document.fonts.load("700 80px Montserrat"),
])
  .then(() => continueRender(handle))
  .catch((err) => {
    console.error(err);
    continueRender(handle);
  });
