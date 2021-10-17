# Order Processing Utility

### What's this?
This tool was developed to automate the ordering and printing of shipping labels through [Sendle](https://www.sendle.com/en-us) for new orders placed on the eCommerce platform, [Lightspeed](https://www.lightspeedhq.com/).

When running this tool, you can input Lightspeed Order ID's (ORDXXXX, by default) and the tool will automatically order and process a label with Sendle. It will then take that label and print a label and a tracking page for your own records.

### Installation
**Requirements:**

- Node.js
- Git
- NPM
- TypeScript

Clone this repo with `git clone https://github.com/j-rockwell/eCommerce-Utility/`

Enter the project directory, using `cd eCommerce-Utility`

Install dependencies using `npm install`

Compile TypeScript project files using `npx tsc`

Run the program using `node app`
