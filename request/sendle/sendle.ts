import {SendleClient} from 'sendle-node';
import {sendToPrinter} from '../../printer/PrintManager';
import fs from 'fs';

/**
 * Build a new Sendle Client
 */
const client = new SendleClient({
  sendleId: 'SANDBOX_john_avluxurygroup_c',
  apiKey: 'sandbox_YCzTQMDJTghVhw4q9hBJ64f5',
  sandbox: true,
  gotOptions: {},
});

/**
 * Test method for obtaining Order Labels with an existing order id
 * @param id Sendle Order ID
 * @return PDF File for the provided Sendle Order ID
 */
export async function getOrderLabel(id: string) {
  const label = await client.labels
      .get({
        orderId: id,
        size: 'a4',
      })
      .then((pdf) => {
        fs.writeFile('./output/test.pdf', pdf, 'binary', () => {
          console.log('Finished downloading PDF from Sendle Request');
          sendToPrinter('./output/test.pdf');
        });
      });

  return label;
}

/**
 * Create a new label order with Sendle
 * @param lightspeedOrder Lightspeed Order Instance
 */
export async function createOrder(lightspeedOrder: any) {
  console.log('Ordering a new label from Sendle...');

  // Order a new label from Sendle
  const order: any = await client.orders.create({
    first_mile_option: 'drop off',
    description: lightspeedOrder.number,
    weight: {
      value: '0.5', // TODO: Make this utilize order.weight
      units: 'lb',
    },
    customer_reference: lightspeedOrder.number,
    sender: {
      contact: {
        name: 'AV Luxury Group',
      },
      address: {
        address_line1: '2130 Park Centre Drive',
        address_line2: 'Suite 140',
        suburb: 'Las Vegas',
        state_name: 'Nevada',
        postcode: '89135',
        country: 'United States',
      },
    },
    receiver: {
      instructions: '',
      contact: {
        name: lightspeedOrder.addressShippingName,
        email: lightspeedOrder.email,
      },
      address: {
        address_line1: lightspeedOrder.addressShippingStreet,
        suburb: lightspeedOrder.addressShippingCity,
        state_name: lightspeedOrder.addressShippingRegion,
        postcode: lightspeedOrder.addressShippingZipcode,
        country: lightspeedOrder.addressShippingCountry.title,
      },
    },
  });

  // Get the PDF data from Sendle
  const pdf = await client.labels.get({
    orderId: order.order_id,
    size: 'cropped',
  });

  // Convert PDF Binary to file and save
  fs.writeFile(`./output/${order.order_id}.pdf`, pdf, 'binary', () => {
    console.log('Finished downloading label from Sendle');
    sendToPrinter(`./output/${order.order_id}.pdf`);
  });
}
