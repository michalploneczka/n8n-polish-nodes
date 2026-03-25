# n8n-nodes-ceneo

[![npm](https://img.shields.io/npm/v/n8n-nodes-ceneo)](https://www.npmjs.com/package/n8n-nodes-ceneo)

n8n community node for **[Ceneo](https://ceneo.pl)** -- Poland's largest price comparison platform. Monitor market prices and verify competitive pricing for your products.

## Installation

### Community Nodes (recommended)

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install a community node**
3. Enter `n8n-nodes-ceneo` and click **Install**

### Manual installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-ceneo
```

Restart n8n after installation.

## Credentials

You need a Ceneo Developer API key. Get one from the [Ceneo Partner Panel](https://developers.ceneo.pl).

1. In n8n, create new **Ceneo API** credentials
2. Enter your **API Key** (used for both v2 and v3 endpoints)

The node handles authentication automatically -- v3 endpoints acquire a Bearer token from the AuthorizationService, while v2 endpoints pass the API key as a query parameter.

## Operations

| Resource | Operation                  | Description                                              |
| -------- | -------------------------- | -------------------------------------------------------- |
| Product  | Get Top Category Products  | Get top products in a Ceneo category                     |
| Product  | Get All Offers             | Get all offers for product IDs (max 300)                 |
| Product  | Get Top 10 Cheapest Offers | Get cheapest offers for product IDs (max 300)            |
| Category | List                       | Get all Ceneo categories                                 |
| Account  | Get Limits                 | Get API usage limits and remaining quota                 |

## Example Workflow

This workflow checks top laptop prices on Ceneo every hour and filters products under a price threshold.

```json
{
  "meta": {
    "instanceId": "ceneo-price-monitor-example"
  },
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [{ "field": "hours", "hoursInterval": 1 }]
        }
      },
      "name": "Every Hour",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "resource": "product",
        "operation": "getTopCategoryProducts",
        "categoryName": "Laptopy",
        "top": 20
      },
      "name": "Get Laptop Prices",
      "type": "n8n-nodes-ceneo.ceneo",
      "typeVersion": 1,
      "position": [460, 300],
      "credentials": {
        "ceneoApi": {
          "id": "1",
          "name": "Ceneo API"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{ $json.price }}",
              "operation": "smallerEqual",
              "value2": 3000
            }
          ]
        }
      },
      "name": "Price Under 3000 PLN",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [680, 300]
    }
  ],
  "connections": {
    "Every Hour": {
      "main": [[{ "node": "Get Laptop Prices", "type": "main", "index": 0 }]]
    },
    "Get Laptop Prices": {
      "main": [[{ "node": "Price Under 3000 PLN", "type": "main", "index": 0 }]]
    }
  }
}
```

## API Documentation

- [Ceneo Developer Portal](https://developers.ceneo.pl)

## License

[MIT](../../LICENSE)

## Author

[Michal Ploneczka](https://codersgroup.pl) (michal.ploneczka@gmail.com)
