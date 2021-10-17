import axios from 'axios';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { createOrder } from '../sendle/sendle';
import { sendToPrinter } from '../../printer/PrintManager';

require('dotenv').config();

const token: string | undefined = process.env.LIGHTSPEED_TOKEN;

/**
 * Callback mapping for Lightspeed Products
 */
interface Product {
  // eslint-disable-next-line no-unused-vars
  (product: any): void;
}

/**
 * Callback mapping for Lightspeed Customers
 */
interface Customer {
  // eslint-disable-next-line no-unused-vars
  (customer: any): void;
}

/**
 * Encodes Lightspeed API Credentials to Base64
 * @returns {string | null} Base64 Encoded Lightspeed API Credentials
 */
function toBase64(): string | null {
  if (token === undefined || token === null) {
    console.error('Lightspeed API token was undefined');
    return null;
  }

  return Buffer.from(token).toString('base64');
}

/**
 * Retrieves orders matching the provided IDs and creates jobs for them
 * @param id Collection of Order IDs
 */
export function getOrder(id: string) {
  console.log(`Obtaining order information for ${id}`);
  const ids = id.split(',');

  axios({
    method: 'GET',
    url: 'https://api.shoplightspeed.com/us/orders.json?limit=300',
    headers: {
      Authorization: `Basic ${toBase64()}`,
      Accept: 'application/json',
    },
  })
    .then((res) => {
      if (res.status === 200) {
        res.data.orders.map((order: any) => {
          const orderId: string = order.number;

          for (let i = 0; i < ids.length; i += 1) {
            const processedId = ids[i];

            if (processedId === orderId) {
              // Yeah I know, I know... it's terrible... But I'm just not gonna do that.
              // eslint-disable-next-line no-use-before-define
              processOrder(order);
            }
          }
        });
      }
    })
    .catch((err) => {
      console.error(
        `${'Encountered an error while attempting to'
            + 'obtain order inforamtion from Lightspeed for '}${id}`,
      );
      console.error(err);
    })
    .then(() => {
      console.log(`Completed order information lookup for ${id}`);
    });
}

/**
 * Retrieves product information from Lightspeed
 * @param product Product lookup link provided by the Lightspeed Order lookup
 * @param callback Product Callback
 */
export function getProduct(product: string, callback: Product) {
  console.log(`Obtaining product information for ${product.link}`);

  axios({
    method: 'GET',
    url: `${product.link}`,
    headers: {
      Authorization: `Basic ${toBase64()}`,
      Accept: 'application/json',
    },
  })
    .then((res) => {
      if (res.status === 200) {
        callback(res.data.orderProducts);
      }
    })
    .catch((error) => {
      console.log(error);
    })
    .then(() => {
      console.log(`Completed product information lookup for ${product.link}`);
    });
}

/**
 * Retrieves customer information from Lightspeed
 * @param customer Customer lookup link provided by the Lightspeed Order lookup
 * @param callback Customer Callback
 */
export function getCustomer(customer: string, callback: Customer) {
  console.log(`Obtaining customer information for ${customer.link}`);

  axios({
    method: 'GET',
    url: `${customer.link}`,
    headers: {
      Authorization: `Basic ${toBase64()}`,
      Accept: 'application/json',
    },
  }).then((res) => {
    if (res.status === 200) {
      callback(res.data.customer);
    }
  }).catch((error) => {
    console.error(`Encountered an error while trying to obtain customer information for ${customer.link}`);
    console.log(error);
  }).then(() => {
    console.log(
      `Completed customer information lookup for ${customer.link}`,
    );
  });
}

/**
 * Generate an order receipt .pdf file and send it to the printer
 * @param order Lightspeed Order Instance
 */
function processOrder(order: any) {
  const doc = new PDFDocument({ size: 'A4' });
  const date = new Date(order.createdAt);

  if (!fs.existsSync('./output')) {
    fs.mkdirSync('./output', { recursive: true });
    console.log('Generating an output folder...');
  }

  getCustomer(order.customer.resource, (customer) => {
    getProduct(order.products.resource, (products) => {
      doc.pipe(fs.createWriteStream(`./output/${order.number}.pdf`));

      // Header
      // Logo
      doc.image('./assets/AV-Luxury-Group-Red.png', 205, 0, { width: 200 });

      // Title
      doc.text('Online Order Report', 64, 190);

      // Date
      doc.text(date.toLocaleDateString('en-US'));
      doc.text(' ');
      doc.text('Customer:');

      // Customer
      if (customer.companyName !== '') {
        doc.text(customer.companyName);
      }

      doc.text(`${customer.firstname} ${customer.lastname}`);
      doc.text(customer.phone ? customer.phone : customer.mobile);
      doc.text(customer.email);

      // Product Header
      doc.text('Item', 64, 350);
      doc.text('#', 450, 350);
      doc.text('Price', 0, 350, { align: 'right' });

      doc.moveTo(64, 365).lineTo(525, 365).stroke();

      // We store this value to know how far down
      // the page we render Totals, Taxes, etc
      let footerStart = 0;

      // Product List
      for (let i = 0; i < products.length; i += 1) {
        const product = products[i];
        const padding = i === 0 ? 385 : 385 + (i + 1) * 20;

        footerStart = padding;

        doc.text(`${product.brandTitle} ${product.productTitle} ${product.variantTitle}`, 64, padding, { width: 300 });
        doc.text(product.quantityOrdered, 450, padding);
        doc.text(`$${product.priceIncl}`, 0, padding, { align: 'right' });

        if (i === products.length - 1) {
          doc
            .moveTo(64, padding + 40)
            .lineTo(525, padding + 40)
            .stroke();
        }
      }

      // Footer / Totals
      doc.text(`Subtotal    $${order.priceIncl}`, 0, footerStart + 60, { align: 'right' });
      doc.text(`Discounts    $${order.discountAmount}`, { align: 'right' });

      // Build file
      doc.end();

      // Print
      sendToPrinter(`./output/${order.number}.pdf`);

      // Creates Sendle Label Order
      createOrder(order);
    });
  });
}
