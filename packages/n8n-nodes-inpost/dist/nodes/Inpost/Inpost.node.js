"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Inpost = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const GenericFunctions_1 = require("./GenericFunctions");
const points_1 = require("./resources/points");
const shipments_1 = require("./resources/shipments");
const tracking_1 = require("./resources/tracking");
class Inpost {
    constructor() {
        this.description = {
            displayName: 'InPost ShipX',
            name: 'inpost',
            icon: 'file:../../icons/inpost.svg',
            group: ['output'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Manage shipments, track packages, and find Paczkomaty via InPost ShipX API',
            defaults: {
                name: 'InPost ShipX',
            },
            usableAsTool: true,
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            credentials: [
                {
                    name: 'inpostApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Point',
                            value: 'point',
                            description: 'Paczkomaty parcel locker points',
                        },
                        {
                            name: 'Shipment',
                            value: 'shipment',
                        },
                        {
                            name: 'Tracking',
                            value: 'tracking',
                        },
                    ],
                    default: 'shipment',
                },
                shipments_1.shipmentOperations,
                ...shipments_1.shipmentFields,
                points_1.pointOperations,
                ...points_1.pointFields,
                tracking_1.trackingOperations,
                ...tracking_1.trackingFields,
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const resource = this.getNodeParameter('resource', i);
                const operation = this.getNodeParameter('operation', i);
                if (resource === 'shipment') {
                    if (operation === 'create') {
                        const credentials = await this.getCredentials('inpostApi');
                        const orgId = credentials.organizationId;
                        const service = this.getNodeParameter('service', i);
                        const receiverData = this.getNodeParameter('receiver', i);
                        const receiver = (receiverData.receiverDetails ||
                            {});
                        const isLockerService = service === 'inpost_locker_standard' ||
                            service === 'inpost_locker_express';
                        if (!isLockerService) {
                            const addressData = this.getNodeParameter('receiverAddress', i, {});
                            if (addressData.addressDetails) {
                                receiver.address = addressData.addressDetails;
                            }
                        }
                        const parcelsData = this.getNodeParameter('parcels', i);
                        const parcelValues = parcelsData.parcelValues || [];
                        const parcels = parcelValues.map((parcel) => {
                            const result = {};
                            if (isLockerService && parcel.template && parcel.template !== 'custom') {
                                result.template = parcel.template;
                            }
                            else {
                                result.dimensions = {
                                    length: parcel.length,
                                    width: parcel.width,
                                    height: parcel.height,
                                    unit: 'mm',
                                };
                            }
                            result.weight = {
                                amount: parcel.weight,
                                unit: 'kg',
                            };
                            result.is_non_standard = parcel.isNonStandard || false;
                            return result;
                        });
                        const body = {
                            service,
                            receiver,
                            parcels,
                        };
                        if (isLockerService) {
                            const targetPoint = this.getNodeParameter('targetPoint', i);
                            const additionalFields = this.getNodeParameter('additionalFields', i, {});
                            body.custom_attributes = {
                                target_point: targetPoint,
                                sending_method: additionalFields.sendingMethod || 'dispatch_order',
                            };
                        }
                        const additionalFields = this.getNodeParameter('additionalFields', i, {});
                        if (additionalFields.codAmount) {
                            body.cod = {
                                amount: additionalFields.codAmount,
                                currency: 'PLN',
                            };
                        }
                        if (additionalFields.insuranceAmount) {
                            body.insurance = {
                                amount: additionalFields.insuranceAmount,
                                currency: 'PLN',
                            };
                        }
                        if (additionalFields.reference) {
                            body.reference = additionalFields.reference;
                        }
                        if (additionalFields.senderDetails) {
                            const senderData = additionalFields.senderDetails;
                            if (senderData.senderValues) {
                                body.sender = senderData.senderValues;
                            }
                        }
                        const response = await GenericFunctions_1.inpostApiRequest.call(this, 'POST', `/v1/organizations/${orgId}/shipments`, body);
                        returnData.push({ json: response });
                    }
                    else if (operation === 'get') {
                        const shipmentId = this.getNodeParameter('shipmentId', i);
                        const response = await GenericFunctions_1.inpostApiRequest.call(this, 'GET', `/v1/shipments/${shipmentId}`);
                        returnData.push({ json: response });
                    }
                    else if (operation === 'getAll') {
                        const credentials = await this.getCredentials('inpostApi');
                        const orgId = credentials.organizationId;
                        const shipments = await GenericFunctions_1.inpostApiRequestAllItems.call(this, 'GET', `/v1/organizations/${orgId}/shipments`);
                        for (const shipment of shipments) {
                            returnData.push({ json: shipment });
                        }
                    }
                    else if (operation === 'cancel') {
                        const credentials = await this.getCredentials('inpostApi');
                        const orgId = credentials.organizationId;
                        const shipmentId = this.getNodeParameter('shipmentId', i);
                        await GenericFunctions_1.inpostApiRequest.call(this, 'DELETE', `/v1/organizations/${orgId}/shipments/${shipmentId}`);
                        returnData.push({ json: { success: true, shipmentId } });
                    }
                    else if (operation === 'getLabel') {
                        const credentials = await this.getCredentials('inpostApi');
                        const orgId = credentials.organizationId;
                        const shipmentId = this.getNodeParameter('shipmentId', i);
                        const labelFormat = this.getNodeParameter('labelFormat', i);
                        const response = await GenericFunctions_1.inpostApiRequest.call(this, 'GET', `/v1/organizations/${orgId}/shipments/${shipmentId}/label`, {}, { format: 'pdf', type: labelFormat }, { encoding: 'arraybuffer', json: false });
                        const binaryData = await this.helpers.prepareBinaryData(Buffer.from(response), `label-${shipmentId}.pdf`, 'application/pdf');
                        returnData.push({
                            json: { shipmentId },
                            binary: { data: binaryData },
                        });
                    }
                }
                else if (resource === 'point') {
                    if (operation === 'get') {
                        const pointName = this.getNodeParameter('pointName', i);
                        const response = await GenericFunctions_1.inpostApiRequest.call(this, 'GET', `/v1/points/${pointName}`);
                        returnData.push({ json: response });
                    }
                    else if (operation === 'getAll') {
                        const filters = this.getNodeParameter('filters', i, {});
                        const qs = {};
                        if (filters.name) {
                            qs.name = filters.name;
                        }
                        if (filters.city) {
                            qs.city = filters.city;
                        }
                        if (filters.type) {
                            qs.type = filters.type;
                        }
                        if (filters.functions) {
                            qs.functions = filters.functions;
                        }
                        const points = await GenericFunctions_1.inpostApiRequestAllItems.call(this, 'GET', '/v1/points', {}, qs);
                        for (const point of points) {
                            returnData.push({ json: point });
                        }
                    }
                }
                else if (resource === 'tracking') {
                    if (operation === 'get') {
                        const trackingNumber = this.getNodeParameter('trackingNumber', i);
                        const response = await GenericFunctions_1.inpostApiRequest.call(this, 'GET', `/v1/tracking/${trackingNumber}`);
                        returnData.push({ json: response });
                    }
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: error.message } });
                    continue;
                }
                throw error;
            }
        }
        return [returnData];
    }
}
exports.Inpost = Inpost;
Inpost.inpostApiRequest = GenericFunctions_1.inpostApiRequest;
Inpost.inpostApiRequestAllItems = GenericFunctions_1.inpostApiRequestAllItems;
Inpost.pointOperations = points_1.pointOperations;
Inpost.trackingOperations = tracking_1.trackingOperations;
//# sourceMappingURL=Inpost.node.js.map