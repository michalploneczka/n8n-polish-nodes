# n8n-nodes-linkercloud

[![npm](https://img.shields.io/npm/v/n8n-nodes-linkercloud)](https://www.npmjs.com/package/n8n-nodes-linkercloud)

n8n community node for **[Linker Cloud](https://linkercloud.com)** -- a Polish WMS/OMS fulfillment platform. Manage orders, products, stock, shipments, inbound orders, and returns directly from your n8n workflows.

## Operations

| Resource       | Operation              | Description                                      |
| -------------- | ---------------------- | ------------------------------------------------ |
| Order          | List                   | Get a list of orders with filters and pagination  |
| Order          | Get                    | Get an order by ID                                |
| Order          | Create                 | Create a new order with items                     |
| Order          | Update                 | Update an existing order                          |
| Order          | Cancel                 | Cancel an order                                   |
| Order          | Get Transitions        | Get allowed state transitions for an order        |
| Order          | Apply Transition       | Apply a state transition to an order              |
| Order          | Update Tracking Number | Set tracking number for an order                  |
| Order          | Update Payment Status  | Update payment status for an order                |
| Product        | List                   | Get a list of products                            |
| Product        | Create                 | Create a new product with defaults                |
| Product        | Update                 | Update an existing product                        |
| Stock          | List                   | Get current stock levels                          |
| Stock          | Update                 | Batch update stock by SKU and quantity             |
| Shipment       | Create                 | Create a shipment with packages                   |
| Shipment       | Create by Order Number | Create packages for an existing order             |
| Shipment       | Get Label              | Download shipping label (PDF or PNG)              |
| Shipment       | Get Status             | Get delivery status for an order                  |
| Shipment       | Cancel                 | Cancel selected packages via PATCH                |
| Inbound Order  | List                   | Get a list of inbound (supplier) orders           |
| Inbound Order  | Get                    | Get an inbound order by ID                        |
| Inbound Order  | Create                 | Create an inbound order with supplier data        |
| Inbound Order  | Update                 | Update an inbound order                           |
| Inbound Order  | Confirm                | Confirm inbound order receipt                     |
| Order Return   | List                   | Get a list of order returns                       |
| Order Return   | Get                    | Get an order return by ID                         |
| Order Return   | Create                 | Create an order return                            |
| Order Return   | Accept                 | Accept an order return                            |

## Credentials

This node uses an **API Key** with a **Domain** for authentication.

1. Get your API key from your Linker Cloud operator or customer service
2. In n8n, create new **Linker Cloud API** credentials
3. Enter your **Domain** (e.g., `your-company.linker.shop` or `api-demo.linker.shop` for testing)
4. Enter your **API Key**

## Installation

### Community Nodes (recommended)

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install a community node**
3. Enter `n8n-nodes-linkercloud` and click **Install**

### Manual installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-linkercloud
```

Restart n8n after installation.

## Notes

- All dates use format `YYYY-MM-DD HH:mm:ss`
- Order items require `serial_numbers`, `custom_properties`, `source_data`, `batch_numbers` arrays (pass empty `[]` if not used)
- Product creation requires 9 boolean flags (default to `false`) and 4 array fields (default to `[]`)
- Stock update is a batch operation accepting multiple SKU+quantity pairs
- Label download returns binary data (PDF or PNG)
- Cancel uses PATCH on deliveries endpoint with package IDs to cancel

## Resources

- [Linker Cloud Platform](https://linkercloud.com)
- [GitHub Repository](https://github.com/michalploneczka/n8n-polish-nodes)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](../../LICENSE)

## Author

[Michal Ploneczka](https://codersgroup.pl) (mp@codersgroup.pl)
