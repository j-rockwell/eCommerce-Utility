import printer from 'printer';

require('dotenv').config();

// Gets default machine
const printerName = process.env.PRINTER_NAME ?? "";

/**
 * Print the available job options
 *
 * As of writing this OSX only supports CANCEL
 */
export function getAvailableOptions(): void {
  const options: string[] = printer.getSupportedJobCommands();
  console.log(`Available job commands: ${options}`);
}

/**
 * Processes and sends a print job to the defined printer with the provided file path
 * @param filename File path
 */
export function sendToPrinter(filename: string): void {
  const machine = printer.getPrinter(printerName);
  
  printer.printFile({
    filename,
    printer: machine.name,
    success: (jobID) => {
      console.log(`Processing print job #${jobID}`);
    },
    error: (err) => {
      console.error(err);
    },
  });
}
