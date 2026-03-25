# n8n-nodes-krs

[![npm](https://img.shields.io/npm/v/n8n-nodes-krs)](https://www.npmjs.com/package/n8n-nodes-krs)

n8n community node for looking up companies in the **KRS** (Krajowy Rejestr Sadowy / Polish National Court Register) via the public government API at [api-krs.ms.gov.pl](https://api-krs.ms.gov.pl/).

This node lets you retrieve current or full historical company data extracts from the official KRS registry -- no registration or API key required.

## Operations

| Resource | Operation           | Description                                                  |
| -------- | ------------------- | ------------------------------------------------------------ |
| Company  | Get Current Extract | Get the current company data extract (basic info, officers)  |
| Company  | Get Full Extract    | Get the full historical extract (all sections, all changes)  |

## Credentials

No credentials required. The KRS API is free and public -- no registration or API key needed.

## Installation

### Community Nodes (recommended)

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install a community node**
3. Enter `n8n-nodes-krs` and click **Install**

### Manual installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-krs
```

Restart n8n after installation.

## Usage

1. Add the **KRS** node to your workflow
2. Select the **Company** resource
3. Choose an **Operation**: Get Current Extract or Get Full Extract
4. Enter a **KRS Number** (10 digits, zero-padded, e.g., `0000019193`)
5. Optionally select a **Register Type** (auto-detect works in most cases):
   - **Entrepreneurs (P)** -- business entities
   - **Associations (S)** -- NGOs, foundations, associations

## Notes

- **KRS Number format**: Always 10 digits, zero-padded (e.g., `0000019193` for PKN Orlen).
- **JSON responses**: The API returns structured JSON with company data organized in sections (dzial1-dzial6).
- **Personal data**: The API anonymizes personal data (e.g., board members' PESEL numbers are masked).
- **Response structure**: Data is nested under `odpis.dane.dzial1` through `dzial6`, covering company identity, management, capital, financials, and more.
- **Rate limits**: The API is public but may enforce rate limits during high traffic. Use reasonable request intervals.

## Example Workflow

Below is a minimal workflow that retrieves the current KRS extract for PKN Orlen:

```json
{
  "nodes": [
    {
      "parameters": {
        "resource": "company",
        "operation": "getCurrentExtract",
        "krsNumber": "0000019193"
      },
      "name": "KRS Lookup",
      "type": "n8n-nodes-krs.krs",
      "typeVersion": 1,
      "position": [450, 300]
    }
  ]
}
```

## API Documentation

Full API reference: [https://api-krs.ms.gov.pl/](https://api-krs.ms.gov.pl/)

## License

[MIT](https://opensource.org/licenses/MIT)

## Author

[Michal Ploneczka](https://codersgroup.pl) (michal.ploneczka@gmail.com)
