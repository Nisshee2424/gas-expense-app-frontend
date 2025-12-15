// Transaction Data
export interface Transaction {
	id: number;
	user_id: number;
	year: number;
	month: number;
	day: number | string; // empty string for fixed cost
	item_id: number;
	amount: number;
	note?: string;
	is_income?: number;
	created_at?: string;
	updated_at?: string;
	// Joinされたデータ用（フロントエンドでの処理などで付与）
	item_name?: string;
	category_name?: string;
}

// Master Data
export interface Item {
	id: number;
	name: string;
	category_id: number;
}

export interface Category {
	id: number;
	name: string;
}

// Budget Data
export interface Budget {
	id: number;
	user_id: number;
	year: number;
	item_id: number;
	amount: number;
}

// Annual Summary Data
export interface AnnualSummaryItem {
	item_id: number;
	item_name: string;
	category_id: number;
	current_amount: number;
	prev_amount: number;
	budget: number;
}
