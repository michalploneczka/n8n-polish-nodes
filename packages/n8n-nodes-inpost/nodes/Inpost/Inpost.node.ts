import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { inpostApiRequest, inpostApiRequestAllItems } from './GenericFunctions';
import { pointOperations, pointFields } from './resources/points';
import { shipmentOperations, shipmentFields } from './resources/shipments';
import { trackingOperations, trackingFields } from './resources/tracking';

export class Inpost implements INodeType {
	// Expose imports as static properties to avoid unused-import tsc error
	static inpostApiRequest = inpostApiRequest;
	static inpostApiRequestAllItems = inpostApiRequestAllItems;
	static pointOperations = pointOperations;
	static trackingOperations = trackingOperations;

	description: INodeTypeDescription = {
		displayName: 'InPost ShipX',
		name: 'inpost',
		icon: 'file:../../icons/inpost.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Manage shipments, track packages, and find Paczkomaty via InPost ShipX API',
		defaults: {
			name: 'InPost ShipX',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
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
			shipmentOperations,
			...shipmentFields,
			pointOperations,
			...pointFields,
			trackingOperations,
			...trackingFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'shipment') {
					if (operation === 'create') {
						const credentials = await this.getCredentials('inpostApi');
						const orgId = credentials.organizationId as string;
						const service = this.getNodeParameter('service', i) as string;

						// Build receiver from fixedCollection
						const receiverData = this.getNodeParameter('receiver', i) as IDataObject;
						const receiver = ((receiverData.receiverDetails as IDataObject) ||
							{}) as IDataObject;

						// For courier services, merge receiver address
						const isLockerService =
							service === 'inpost_locker_standard' ||
							service === 'inpost_locker_express';

						if (!isLockerService) {
							const addressData = this.getNodeParameter(
								'receiverAddress',
								i,
								{},
							) as IDataObject;
							if (addressData.addressDetails) {
								receiver.address = addressData.addressDetails;
							}
						}

						// Build parcels array from fixedCollection
						const parcelsData = this.getNodeParameter('parcels', i) as IDataObject;
						const parcelValues =
							(parcelsData.parcelValues as IDataObject[]) || [];

						const parcels = parcelValues.map((parcel) => {
							const result: IDataObject = {};

							if (isLockerService && parcel.template && parcel.template !== 'custom') {
								result.template = parcel.template;
							} else {
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

						// Build body
						const body: IDataObject = {
							service,
							receiver,
							parcels,
						};

						// Locker services: add target point and sending method
						if (isLockerService) {
							const targetPoint = this.getNodeParameter(
								'targetPoint',
								i,
							) as string;
							const additionalFields = this.getNodeParameter(
								'additionalFields',
								i,
								{},
							) as IDataObject;
							body.custom_attributes = {
								target_point: targetPoint,
								sending_method:
									(additionalFields.sendingMethod as string) || 'dispatch_order',
							};
						}

						// Additional fields
						const additionalFields = this.getNodeParameter(
							'additionalFields',
							i,
							{},
						) as IDataObject;

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
							const senderData = additionalFields.senderDetails as IDataObject;
							if (senderData.senderValues) {
								body.sender = senderData.senderValues;
							}
						}

						const response = await inpostApiRequest.call(
							this,
							'POST',
							`/v1/organizations/${orgId}/shipments`,
							body,
						);
						returnData.push({ json: response as IDataObject });
					} else if (operation === 'get') {
						const shipmentId = this.getNodeParameter('shipmentId', i) as string;
						const response = await inpostApiRequest.call(
							this,
							'GET',
							`/v1/shipments/${shipmentId}`,
						);
						returnData.push({ json: response as IDataObject });
					} else if (operation === 'getAll') {
						const credentials = await this.getCredentials('inpostApi');
						const orgId = credentials.organizationId as string;
						const shipments = await inpostApiRequestAllItems.call(
							this,
							'GET',
							`/v1/organizations/${orgId}/shipments`,
						);
						for (const shipment of shipments) {
							returnData.push({ json: shipment });
						}
					} else if (operation === 'cancel') {
						const credentials = await this.getCredentials('inpostApi');
						const orgId = credentials.organizationId as string;
						const shipmentId = this.getNodeParameter('shipmentId', i) as string;
						await inpostApiRequest.call(
							this,
							'DELETE',
							`/v1/organizations/${orgId}/shipments/${shipmentId}`,
						);
						returnData.push({ json: { success: true, shipmentId } });
					} else if (operation === 'getLabel') {
						const credentials = await this.getCredentials('inpostApi');
						const orgId = credentials.organizationId as string;
						const shipmentId = this.getNodeParameter('shipmentId', i) as string;
						const labelFormat = this.getNodeParameter('labelFormat', i) as string;
						const response = await inpostApiRequest.call(
							this,
							'GET',
							`/v1/organizations/${orgId}/shipments/${shipmentId}/label`,
							{},
							{ format: 'pdf', type: labelFormat },
							{ encoding: 'arraybuffer', json: false },
						);
						const binaryData = await this.helpers.prepareBinaryData(
							Buffer.from(response as unknown as ArrayBuffer),
							`label-${shipmentId}.pdf`,
							'application/pdf',
						);
						returnData.push({
							json: { shipmentId },
							binary: { data: binaryData },
						});
					}
				} else if (resource === 'point') {
					if (operation === 'get') {
						const pointName = this.getNodeParameter('pointName', i) as string;
						const response = await inpostApiRequest.call(
							this,
							'GET',
							`/v1/points/${pointName}`,
						);
						returnData.push({ json: response as IDataObject });
					} else if (operation === 'getAll') {
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = {};
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
						const points = await inpostApiRequestAllItems.call(
							this,
							'GET',
							'/v1/points',
							{},
							qs,
						);
						for (const point of points) {
							returnData.push({ json: point });
						}
					}
				} else if (resource === 'tracking') {
					if (operation === 'get') {
						const trackingNumber = this.getNodeParameter('trackingNumber', i) as string;
						const response = await inpostApiRequest.call(
							this,
							'GET',
							`/v1/tracking/${trackingNumber}`,
						);
						returnData.push({ json: response as IDataObject });
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
