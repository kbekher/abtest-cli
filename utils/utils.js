const figlet = require("figlet");
const chalk = require("chalk");

const COLORS = [
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "blackBright",
  "greenBright",
  "yellowBright",
  "blueBright",
  "magentaBright",
  "cyanBright",
];

// Generate a random font/color
function getRandom() {
  const randomIndex = Math.floor(Math.random() * COLORS.length);
  return COLORS[randomIndex];
}

// Function to create a nice message
function createMessage(message) {
  figlet.text(
    message,
    {
      font: "Small Slant",
      horizontalLayout: "default",
      verticalLayout: "default",
      width: 150,
      height: "fitted",
    },
    function (err, data) {
      if (err) {
        console.log("Something went wrong...");
        console.dir(err);
        return;
      }

      console.log(
        data
          .split(" ")
          .map((word) => chalk[getRandom("color")](word))
          .join(" ")
      );
    }
  );
}

const getFormattedDate = () => `${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`;

module.exports = { createMessage, getFormattedDate };
