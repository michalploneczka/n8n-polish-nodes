# n8n-nodes-ceidg

[![npm](https://img.shields.io/npm/v/n8n-nodes-ceidg)](https://www.npmjs.com/package/n8n-nodes-ceidg)

n8n community node for looking up Polish companies in **CEIDG** (Centralna Ewidencja i Informacja o Dzialalnosci Gospodarczej) -- the Polish government business registry at [dane.biznes.gov.pl](https://dane.biznes.gov.pl).

This node lets you search for sole proprietorships registered in Poland by NIP (tax ID) or company name, and retrieve full details of any CEIDG entry.

## Operations

| Resource | Operation      | Description                             |
| -------- | -------------- | --------------------------------------- |
| Company  | Search by NIP  | Look up a company by NIP (tax ID)       |
| Company  | Search by Name | Search for companies by name            |
| Company  | Get            | Get full details of a CEIDG entry by ID |

## Credentials

This node uses an **API Key** for authentication.

1. Register for a free API key at [dane.biznes.gov.pl](https://dane.biznes.gov.pl)
2. In n8n, create a new **CEIDG API** credential
3. Paste your API key into the **API Token** field

## Installation

### Community Nodes (recommended)

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install a community node**
3. Enter `n8n-nodes-ceidg` and click **Install**

### Manual installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-ceidg
```

Restart n8n after installation.

## Usage

1. Add the **CEIDG** node to your workflow
2. Select a credential with your API key
3. Choose an operation:
   - **Search by NIP** -- enter a 10-digit NIP number (e.g. `1234567890`) to find the matching company
   - **Search by Name** -- enter a full or partial company name to search
   - **Get** -- enter a CEIDG entry ID to retrieve full company details

The node returns JSON data including company name, address, registration dates, PKD codes, and current status.

## Example Workflow

Below is a minimal workflow that looks up a company by NIP:

```json
{
  "nodes": [
    {
      "parameters": {
        "resource": "company",
        "operation": "searchByNip",
        "nip": "1234567890"
      },
      "name": "CEIDG Lookup",
      "type": "n8n-nodes-ceidg.ceidg",
      "typeVersion": 1,
      "position": [450, 300]
    }
  ]
}
```

## API Documentation

Full API reference: [https://dane.biznes.gov.pl/api](https://dane.biznes.gov.pl/api)

## License

[MIT](https://opensource.org/licenses/MIT)

## Author

[Michal Ploneczka](https://codersgroup.pl) (michal.ploneczka@gmai.com)
