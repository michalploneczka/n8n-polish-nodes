# n8n-nodes-gus-regon

[![npm](https://img.shields.io/npm/v/n8n-nodes-gus-regon)](https://www.npmjs.com/package/n8n-nodes-gus-regon)

n8n community node for searching the **Polish government business registry** (GUS REGON/BIR) by NIP, REGON, or KRS number.

This node communicates with the official GUS BIR API (SOAP/XML) and returns structured company data including full reports and PKD activity codes.

## Operations

| Resource | Operation      | Description                                   |
| -------- | -------------- | --------------------------------------------- |
| Company  | Search by NIP  | Search by tax identification number (NIP)     |
| Company  | Search by REGON| Search by REGON statistical number            |
| Company  | Search by KRS  | Search by National Court Register number (KRS)|
| Company  | Get Full Data  | Get full company report with optional PKD codes|

## Credentials

This node requires an **API Key** from GUS.

1. Register (free) at [dane.biznes.gov.pl](https://dane.biznes.gov.pl) to get your API key
2. In n8n, create new **GUS REGON API** credentials
3. Enter your **API Key**
4. Select **Environment**: Test or Production

**Test API key** (for sandbox): `abcde12345abcde12345`

The test environment is at `wyszukiwarkaregontest.stat.gov.pl` and the production environment at `wyszukiwarkaregon.stat.gov.pl`.

## Installation

### Community Nodes (recommended)

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install a community node**
3. Enter `n8n-nodes-gus-regon` and click **Install**

### Manual installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-gus-regon
```

Restart n8n after installation.

## Compatibility

Tested with n8n 1.x.

## Resources

- [GUS REGON API documentation](https://api.stat.gov.pl/Home/RegonApi)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## Notes

- The GUS BIR API uses SOAP/XML. This node handles all XML encoding/decoding internally and returns clean JSON output.
- Each API call opens a session (login), executes the operation, and closes the session (logout). This is transparent to the user.
- The **Get Full Data** operation makes multiple API calls: search + full report + optionally PKD codes.
- Polish characters in company names (e.g., special letters) are decoded correctly.

## Example Workflow

Below is a minimal workflow that searches for a company by NIP:

```json
{
  "nodes": [
    {
      "parameters": {
        "resource": "company",
        "operation": "searchByNip",
        "nip": "5261040828"
      },
      "name": "GUS REGON Lookup",
      "type": "n8n-nodes-gus-regon.gusRegon",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {},
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    }
  ],
  "connections": {
    "Manual Trigger": {
      "main": [
        [
          {
            "node": "GUS REGON Lookup",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## License

MIT
