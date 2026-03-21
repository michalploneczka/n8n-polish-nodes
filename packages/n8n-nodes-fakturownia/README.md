# n8n-nodes-fakturownia

[![npm](https://img.shields.io/npm/v/n8n-nodes-fakturownia)](https://www.npmjs.com/package/n8n-nodes-fakturownia)

n8n community node for **[Fakturownia.pl](https://fakturownia.pl)** (InvoiceOcean) -- a Polish invoicing and accounting platform used by over 100,000 businesses. Manage invoices, clients, and products directly from your n8n workflows.

## Operations

| Resource | Operation    | Description                              |
| -------- | ------------ | ---------------------------------------- |
| Invoice  | List         | Get a list of invoices with filters      |
| Invoice  | Get          | Get an invoice by ID                     |
| Invoice  | Create       | Create a new invoice                     |
| Invoice  | Update       | Update an existing invoice               |
| Invoice  | Delete       | Delete an invoice                        |
| Invoice  | Send by Email| Send an invoice by email to the buyer    |
| Invoice  | Download PDF | Download an invoice as a PDF file        |
| Client   | List         | Get a list of clients                    |
| Client   | Get          | Get a client by ID                       |
| Client   | Create       | Create a new client                      |
| Product  | List         | Get a list of products                   |
| Product  | Create       | Create a new product                     |

## Credentials

This node uses an **API Token** with a **Subdomain** for authentication.

1. Log in to your [Fakturownia.pl](https://app.fakturownia.pl) account
2. Navigate to **Settings > Account Settings > Integration > API Authorization Code**
3. Copy your API token
4. In n8n, create a new **Fakturownia API** credential
5. Paste the token into the **API Token** field
6. Enter your **Subdomain** (e.g., `mycompany` from `mycompany.fakturownia.pl`)

## Installation

### Community Nodes (recommended)

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install a community node**
3. Enter `n8n-nodes-fakturownia` and click **Install**

### Manual installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-fakturownia
```

Restart n8n after installation.

## Usage

1. Add the **Fakturownia** node to your workflow
2. Select a credential with your API token and subdomain
3. Choose a resource (Invoice, Client, or Product) and an operation
4. Fill in the required fields

### Invoice Create Fields

| Field           | Required | Description                                                |
| --------------- | -------- | ---------------------------------------------------------- |
| Kind            | Yes      | Invoice type: VAT, Proforma, Receipt, Estimate, etc.       |
| Buyer Name      | Yes      | Full name of the buyer                                     |
| Buyer Tax No    | Yes      | Tax identification number (NIP) of the buyer               |
| Positions       | Yes      | JSON array of line items (name, quantity, price, tax)       |
| Sell Date       | No       | Date of sale (YYYY-MM-DD)                                  |
| Issue Date      | No       | Issue date of the invoice                                  |
| Payment Due     | No       | Payment due date                                           |
| Payment Type    | No       | Payment method: Transfer, Cash, Card, etc.                 |
| Currency        | No       | Currency code (default: PLN)                               |

### PDF Download

The **Download PDF** operation returns the invoice as binary data. You can connect it to a **Write Binary File** node or send it as an email attachment.

## Example Workflow

Below is a minimal workflow that creates a VAT invoice:

```json
{
  "nodes": [
    {
      "parameters": {
        "resource": "invoice",
        "operation": "create",
        "kind": "vat",
        "buyerName": "Acme Sp. z o.o.",
        "buyerTaxNo": "1234567890",
        "positions": "[{\"name\":\"Consulting services\",\"quantity\":10,\"total_price_gross\":1230.00,\"tax\":23}]",
        "additionalFields": {
          "sell_date": "2026-03-21",
          "issue_date": "2026-03-21",
          "payment_to": "2026-04-04",
          "payment_type": "transfer"
        }
      },
      "name": "Create Invoice",
      "type": "n8n-nodes-fakturownia.fakturownia",
      "typeVersion": 1,
      "position": [450, 300]
    }
  ]
}
```

## Resources

- [Fakturownia API Documentation](https://app.fakturownia.pl/api)
- [GitHub Repository](https://github.com/michalploneczka/n8n-polish-nodes)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](../../LICENSE)

## Author

[Michal Ploneczka](https://codersgroup.pl) (mp@codersgroup.pl)
