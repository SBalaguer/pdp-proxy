import inquirer from "inquirer";
import buildApi from "./utils/buils-api.js";
import doRegister from "./src/register.js";
import coretimeActions from "./src/buy-core-pdp.js";

async function main() {
  // Step 1: Select chain
  const { chain } = await inquirer.prompt([
    {
      type: "list",
      name: "chain",
      message: "Select a chain:",
      choices: ["Polkadot", "Kusama", "Westend", "Paseo"],
    },
  ]);

  // Step 2: Select action based on chain
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: `What action would you like to perform on ${chain}?`,
      choices: ["Manage Coretime", "Perform Registration"],
    },
  ]);

  // Step 3: Select function based on action
  let functionChoices = [];
  if (action === "Manage Coretime") {
    functionChoices = [
      "Buy Core",
      "Interlace Core",
      "Transfer Core",
      "Transfer Multiple Cores",
      "Query Cores",
    ];
  } else if (action === "Perform Registration") {
    //already perform registration here.
    //we will not ask for wasm and head, as this is rather for testing
    const api = buildApi(chain, "relay");
    try {
      await doRegister(api);
    } catch (error) {
      console.error("An error occurred:", error);
    } finally {
      () => process.exit;
    }
  }

  const { func } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "func",
      message: `Select a function for ${action}:`,
      choices: functionChoices,
    },
  ]);
  console.log(`You selected function: ${func}`);

  let interlaceDetails = null;

  if (func[0] === "Interlace Core") {
    interlaceDetails = await inquirer.prompt([
      {
        type: "input",
        name: "coreNumber",
        message: "Enter the core number:",
        validate: (input) => (input.trim() ? true : "Core number is required."),
      },
      {
        type: "input",
        name: "coreMask",
        message: "Enter the core mask:",
        validate: (input) => (input.trim() ? true : "Core mask is required."),
      },
      {
        type: "input",
        name: "coreBegin",
        message: "Enter the core begin (Timeslice):",
        validate: (input) =>
          input.trim() ? true : "Invalid Timeslice. Timeslice.",
      },
      {
        type: "input",
        name: "parts",
        message: "Enter the number of parts. Suggested is 8:",
        validate: (input) =>
          input.trim() ? true : "Please provide a valid number greater than 0.",
      },
    ]);
  }

  const core = {
    begin: Number(interlaceDetails.coreBegin),
    core: Number(interlaceDetails.coreNumber),
    mask: interlaceDetails.coreMask,
  };

  if (func[0] === "Interlace Core" && interlaceDetails) {
    const api = buildApi(chain, "coretime");
    try {
      await coretimeActions(
        api,
        false,
        true,
        core,
        Number(interlaceDetails.parts)
      );
    } catch (error) {
      console.error("An error occurred:", error);
    } finally {
      () => process.exit;
    }
  } else if (func[0] === "Buy Core") {
    const api = buildApi(chain, "coretime");
    try {
      await coretimeActions(api, true, false, null, null);
    } catch (error) {
      console.error("An error occurred:", error);
    } finally {
      () => process.exit;
    }
  } else if (
    func.includes("Buy Core") &&
    func.includes("Interlace Core") &&
    interlaceDetails
  ) {
    const api = buildApi(chain, "coretime");
    try {
      await coretimeActions(api, true, true, null, interlaceDetails.parts);
    } catch (error) {
      console.error("An error occurred:", error);
    } finally {
      () => process.exit;
    }
  }
}

main().catch((error) => console.error(error));
