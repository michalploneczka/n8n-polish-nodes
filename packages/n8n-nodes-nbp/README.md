# n8n-nodes-nbp

[![npm](https://img.shields.io/npm/v/n8n-nodes-nbp)](https://www.npmjs.com/package/n8n-nodes-nbp)

n8n community node for getting official exchange rates and gold prices from **NBP** (Narodowy Bank Polski / National Bank of Poland) via the public API at [api.nbp.pl](https://api.nbp.pl/).

This node lets you retrieve current and historical exchange rates for any currency, full exchange rate tables, and gold prices -- all from the official source used by Polish businesses and institutions.

## Operations

| Resource      | Operation            | Description                                              |
| ------------- | -------------------- | -------------------------------------------------------- |
| Exchange Rate | Get Current Rate     | Get the latest exchange rate for a currency               |
| Exchange Rate | Get Rate by Date     | Get the exchange rate on a specific date                  |
| Exchange Rate | Get Rate Date Range  | Get exchange rates for a date range (max 93 days)         |
| Exchange Rate | Get Last N Rates     | Get the last N published rates for a currency             |
| Exchange Rate | Get Current Table    | Get the latest full exchange rate table                   |
| Exchange Rate | Get Table by Date    | Get the full exchange rate table for a date               |
| Gold Price    | Get Current Price    | Get the latest gold price (PLN per gram)                  |
| Gold Price    | Get Price by Date    | Get the gold price on a specific date                     |
| Gold Price    | Get Price Date Range | Get gold prices for a date range (max 93 days)            |
| Gold Price    | Get Last N Prices    | Get the last N published gold prices                      |

## Credentials

No credentials required. The NBP API is free and public -- no registration or API key needed.

## Installation

### Community Nodes (recommended)

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install a community node**
3. Enter `n8n-nodes-nbp` and click **Install**

### Manual installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-nbp
```

Restart n8n after installation.

## Usage

1. Add the **NBP Exchange Rates** node to your workflow
2. Select a **Resource**: Exchange Rate or Gold Price
3. Choose an **Operation** (e.g., Get Current Rate)
4. For Exchange Rate operations:
   - Select a **Table** type: A (common currencies, average rates), B (all currencies), or C (buy/sell rates)
   - Enter a **Currency Code** (ISO 4217, e.g., EUR, USD, GBP, CHF)
   - For date-based operations, enter dates in YYYY-MM-DD format
5. For Gold Price operations:
   - For date-based operations, enter dates in YYYY-MM-DD format

## Notes

- Exchange rates are published on business days only. Querying a weekend or holiday date returns a 404 error -- use "Get Current Rate/Table" to always get the latest available data.
- **Table A**: ~33 common currencies with average (mid) rates
- **Table B**: ~90+ currencies with average (mid) rates
- **Table C**: ~8 major currencies with buy (bid) and sell (ask) rates
- Maximum 93-day range for date range queries.
- Gold prices use Polish field names in the API response: `data` = date, `cena` = price in PLN per gram.

## Example Workflow

Below is a minimal workflow that retrieves the current EUR exchange rate:

```json
{
  "nodes": [
    {
      "parameters": {
        "resource": "exchangeRate",
        "operation": "getCurrentRate",
        "table": "A",
        "currencyCode": "EUR"
      },
      "name": "NBP EUR Rate",
      "type": "n8n-nodes-nbp.nbp",
      "typeVersion": 1,
      "position": [450, 300]
    }
  ]
}
```

## API Documentation

Full API reference: [https://api.nbp.pl/](https://api.nbp.pl/)

## License

[MIT](https://opensource.org/licenses/MIT)

## Author

[Michal Ploneczka](https://codersgroup.pl) (mp@codersgroup.pl)
