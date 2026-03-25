# n8n-nodes-inpost

[![npm](https://img.shields.io/npm/v/n8n-nodes-inpost)](https://www.npmjs.com/package/n8n-nodes-inpost)

n8n community node for **[InPost ShipX](https://inpost.pl)** -- Poland's leading parcel delivery service with Paczkomaty parcel lockers. Manage shipments, download labels, track packages, and find parcel locker points directly from your n8n workflows.

## Operations

| Resource  | Operation | Description                                       |
| --------- | --------- | ------------------------------------------------- |
| Shipment  | Create    | Create a new shipment (locker or courier)         |
| Shipment  | Get       | Get shipment details by ID                        |
| Shipment  | Get Many  | List shipments with pagination                    |
| Shipment  | Cancel    | Cancel a shipment                                 |
| Shipment  | Get Label | Download shipping label as PDF (A4/A6)            |
| Point     | Get       | Get parcel locker point details                   |
| Point     | Get Many  | List and filter Paczkomaty points                 |
| Tracking  | Get       | Track shipment by tracking number                 |

## Credentials

This node requires three credential fields:

- **API Token**: Bearer token from InPost Manager Panel
- **Organization ID**: Numeric organization ID from InPost Manager Panel
- **Environment**: Sandbox or Production toggle

### Setup

1. Log in to [InPost Manager Panel](https://manager.paczkomaty.pl)
2. Navigate to **API** section to obtain your API token
3. Note your **Organization ID** from the account settings
4. In n8n, create a new **InPost ShipX API** credential
5. Paste the token, enter the Organization ID, and select the environment

**Note:** Sandbox uses `sandbox-api-shipx-pl.easypack24.net`, Production uses `api-shipx-pl.easypack24.net`.

## Installation

### Community Nodes (recommended)

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install a community node**
3. Enter `n8n-nodes-inpost` and click **Install**

### Manual installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-inpost
```

Restart n8n after installation.

## Compatibility

- Tested with n8n 1.x
- Requires `n8n-workflow` peer dependency

## Rate Limits

InPost ShipX API allows **100 requests per minute**.

This node does not implement automatic retry. If you hit rate limits, add a **Wait** node between operations or reduce batch sizes in your workflow.

## Usage

### Create a Shipment

1. Select **Shipment** resource and **Create** operation
2. Choose the service type (Locker Standard, Courier Standard, etc.)
3. For locker services, enter the **Target Point** code (e.g., `KRA010`)
4. Fill in receiver details (name, phone, email)
5. Add parcel details (template size or custom dimensions, weight)
6. Optionally add COD amount, insurance, or reference

### Get Label

The **Get Label** operation returns the shipping label as binary PDF data. You can connect it to a **Write Binary File** node or send it as an email attachment. Choose between A4 (normal) and A6 label formats.

## Example Workflow

Below is a minimal workflow that creates a locker shipment:

```json
{
  "nodes": [
    {
      "parameters": {
        "resource": "shipment",
        "operation": "create",
        "service": "inpost_locker_standard",
        "targetPoint": "KRA010",
        "receiver": {
          "receiverDetails": {
            "name": "Jan Kowalski",
            "email": "jan@example.com",
            "phone": "500600700"
          }
        },
        "parcels": {
          "parcelValues": [
            {
              "template": "small",
              "weight": 2
            }
          ]
        },
        "additionalFields": {}
      },
      "name": "Create InPost Shipment",
      "type": "n8n-nodes-inpost.inpost",
      "typeVersion": 1,
      "position": [450, 300]
    }
  ]
}
```

## Resources

- [InPost ShipX API Documentation](https://dokumentacja-inpost.atlassian.net/wiki/spaces/PL)
- [GitHub Repository](https://github.com/michalploneczka/n8n-polish-nodes)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](../../LICENSE)

## Author

[Michal Ploneczka](https://codersgroup.pl) (michal.ploneczka@gmail.com)
