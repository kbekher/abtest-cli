const figlet = require("figlet");
const chalk = require("chalk");

// FONTS figlet
//   "Swamp Land",
//   "Varsity",
//   "Soft",
//   "Small Slant",
//   "Train",

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

      console.log(chalk.magenta(data));
    }
  );
}

module.exports = { createMessage };
