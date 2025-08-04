import "dotenv/config";

console.log(
  "Starting sequential execution of all bundler API endpoints...\n"
);

// Simple endpoints
const simpleEndpoints = [
  { name: "Chain ID Check", file: "./check-bundler-chainid.ts" },
  {
    name: "Supported Entry Points",
    file: "./check-supported-entrypoints.ts",
  },
  {
    name: "Get User Operation By Hash",
    file: "./check-userop-status.ts",
  },
  {
    name: "Get User Operation Receipt",
    file: "./check-userop-receipt.ts",
  },
  {
    name: "Max Priority Fee Per Gas",
    file: "./check-priority-fee.ts",
  },
  {
    name: "Get User Operation Gas Price",
    file: "./check-gas-price.ts",
  },
];

// Send user operation endpoints
const sendUserOperationEndpoints = [
  {
    name: "Safe4337Pack Sponsored UserOperation",
    file: "./safe4337-sponsored.ts",
  },
  {
    name: "Safe4337Pack Native UserOperation",
    file: "./safe4337-native.ts",
  },
];

// Status check
const statusEndpoints = [
  {
    name: "Final Status Check",
    file: "./final-status-complete.ts",
  },
];

async function runEndpoint(name: string, file: string) {
  console.log(`\nRunning: ${name}`);
  console.log(`File: ${file}`);
  console.log("-".repeat(50));

  try {
    // Import and execute the module
    await import(file);
    console.log(`SUCCESS: ${name} completed successfully`);
  } catch (error) {
    console.error(`ERROR: ${name} failed:`, error);
  }

  console.log("-".repeat(50));
}

async function runAllEndpoints() {
  console.log("STEP 1: Running Simple Endpoints");
  console.log("=".repeat(60));

  for (const endpoint of simpleEndpoints) {
    await runEndpoint(endpoint.name, endpoint.file);
    // Add a small delay between executions
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\nSTEP 2: Running Send User Operation Endpoints");
  console.log("=".repeat(60));

  for (const endpoint of sendUserOperationEndpoints) {
    await runEndpoint(endpoint.name, endpoint.file);
    // Add a small delay between executions
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\nSTEP 3: Running Status Check");
  console.log("=".repeat(60));

  for (const endpoint of statusEndpoints) {
    await runEndpoint(endpoint.name, endpoint.file);
    // Add a small delay between executions
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\nAll endpoints have been executed sequentially!");
}

// Run the script
runAllEndpoints().catch((error) => {
  console.error("Script execution failed:", error);
  process.exit(1);
}); 