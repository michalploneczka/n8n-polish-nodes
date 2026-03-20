import type {
	IDataObject,
	IExecuteFunctions,
	IGetNodeParameterOptions,
	INode,
} from 'n8n-workflow';

/**
 * Resolve a dot-separated path on an object.
 * e.g. getByPath({ a: { b: 1 } }, 'a.b') => 1
 */
function getByPath(
	obj: Record<string, unknown>,
	path: string,
	fallback?: unknown,
): unknown {
	const keys = path.split('.');
	let current: unknown = obj;
	for (const key of keys) {
		if (current === null || current === undefined || typeof current !== 'object') {
			return fallback;
		}
		current = (current as Record<string, unknown>)[key];
	}
	return current === undefined ? fallback : current;
}

export function createMockExecuteFunctions(
	nodeParameters: Record<string, unknown>,
	nodeMock?: Partial<INode>,
	continueBool = false,
): IExecuteFunctions {
	const defaultNode: INode = {
		id: 'test-node-id',
		name: 'TestNode',
		type: 'test',
		typeVersion: 1,
		position: [0, 0],
		parameters: {},
		...(nodeMock ?? {}),
	};

	return {
		getNodeParameter(
			parameterName: string,
			_itemIndex: number,
			fallbackValue?: IDataObject,
			options?: IGetNodeParameterOptions,
		) {
			const parameter = options?.extractValue
				? `${parameterName}.value`
				: parameterName;
			return getByPath(nodeParameters, parameter, fallbackValue);
		},
		getNode() {
			return defaultNode;
		},
		getWorkflow() {
			return { id: 'test-workflow-id', name: 'Test Workflow', active: false };
		},
		continueOnFail() {
			return continueBool;
		},
		getInputData() {
			return [{ json: {} }];
		},
		helpers: {
			httpRequestWithAuthentication: jest.fn(),
			requestWithAuthentication: jest.fn(),
		},
	} as unknown as IExecuteFunctions;
}
