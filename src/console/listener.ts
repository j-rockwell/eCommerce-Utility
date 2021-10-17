import readline from 'readline';
import { getOrder } from '../request/lightspeed/lightspeed';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Takes over console to create a recursive listener for order IDs
 */
export default function listen() {
  rl.question('\nEnter order ID: ', (answer) => {
    if (answer === 'exit' || answer === 'quit' || answer === 'stop') {
      console.log('Shutting down...');
      return rl.close();
    }

    getOrder(answer);
    return listen(); // Recursive call to keep the program running
  });
}
