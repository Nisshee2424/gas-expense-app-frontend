import axios from 'axios';

// 環境変数からAPIのURLを取得
const API_URL = import.meta.env.VITE_GAS_API_URL || '';
// APIキー（必要であれば）
const API_KEY = import.meta.env.VITE_API_KEY || '';

if (!API_URL) {
	console.warn('VITE_API_URL is not defined in .env');
}

// Axiosインスタンスの作成
const apiClient = axios.create({
	baseURL: API_URL,
	headers: {
		'Content-Type': 'text/plain;charset=utf-8', // GASは特殊で、JSONを送る場合もtext/plainとして送らないとCORSエラーになることがある
	},
});

// リクエストインターセプター（トークン付与など）
apiClient.interceptors.request.use((config) => {
	// methodをPOSTに固定（GASの制約）
	// ヘッダーでのAPI Key送信はCORS Preflightを誘発するため廃止し、Bodyに含める運用とする
	return config;
});

// レスポンスインターセプター（エラーハンドリング）
apiClient.interceptors.response.use(
	(response) => {
		// GASは常に200を返し、JSON内にstatus: 'error' を含む場合がある
		if (response.data && response.data.status === 'error') {
			return Promise.reject(new Error(response.data.message || 'API Error'));
		}
		return response;
	},
	(error) => {
		return Promise.reject(error);
	}
);

/**
 * 汎用リクエスト関数
 * GASは doPost しか受け付けないため、全て POST で送信する
 */
export const sendRequest = async (method: 'GET' | 'CREATE' | 'UPDATE' | 'DELETE', resource: string, payload: any = {}, token: string = '') => {
	// トークンが渡されなかった場合、localStorageから取得
	const authToken = token || localStorage.getItem('auth_token') || '';

	const body = {
		method,
		endpoint: resource, // GAS側は 'endpoint' プロパティを見ている (index.ts参照)
		payload,
		idToken: authToken,
		apiKey: API_KEY // BodyにAPI Keyを含める
	};

	// GASのWebアプリURLに対してPOST
	const response = await apiClient.post('', body);
	return response.data.data;
};

// API Wrapper Functions

export const getItems = async () => {
	return sendRequest('GET', 'items');
}

export const getRecentTransactions = async () => {
	return sendRequest('GET', 'transactions/recent');
}

export const getMonthlyTransactions = async (year: number, month: number) => {
	return sendRequest('GET', 'transactions/monthly', { year, month });
}

export const getAnnualSummary = async (year: number) => {
	return sendRequest('GET', 'transactions/annual', { year });
}

export const getBudgets = async (year: number) => {
	return sendRequest('GET', 'budgets', { year });
}

export const saveBudget = async (year: number, itemId: number, amount: number) => {
	return sendRequest('CREATE', 'budgets', { year, item_id: itemId, amount });
}

export const createTransaction = async (payload: any) => {
	return sendRequest('CREATE', 'transactions', payload);
}

export const updateTransaction = async (id: number, payload: any) => {
	return sendRequest('UPDATE', 'transactions', { id, ...payload });
}

export const deleteTransaction = async (id: number) => {
	return sendRequest('DELETE', 'transactions', { id });
}

export default apiClient;
