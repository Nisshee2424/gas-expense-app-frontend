import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';

import { getMonthlyTransactions, updateTransaction, deleteTransaction } from '../api/client';
import type { Transaction } from '../types';
import { items } from '../constants/items';
import { showSimpleNotification, showLoadingNotification } from '../utils/notifications';
import { getDayLabel } from '../utils/dateUtils';


interface MonthlyPageProps {
	token: string;
}

interface CategorySummary {
	item_id: number;
	item_name: string;
	amount: number;
}

export const MonthlyPage: React.FC<MonthlyPageProps> = ({ token }) => {
	const [date] = useState<Date>(new Date());
	const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(false);

	// 編集モーダル用
	const [editDialogVisible, setEditDialogVisible] = useState(false);
	const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
	const [editDate, setEditDate] = useState<Date>(new Date());
	const [editItemId, setEditItemId] = useState<number | null>(null);
	const [editNote, setEditNote] = useState<string>('');
	const [editAmount, setEditAmount] = useState<number>(0);
	const [isFixedCost, setIsFixedCost] = useState(false);

	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
	const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

	const toast = useRef<Toast>(null);
	const hasFetched = useRef(false);

	useEffect(() => {
		if (token && date && !hasFetched.current) {
			hasFetched.current = true;
			fetchMonthly();
		}
	}, [token, date]);

	useEffect(() => {
		setSelectedYear(selectedDate.getFullYear());
		setSelectedMonth(selectedDate.getMonth() + 1);
		fetchMonthly(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
	}, [selectedDate]);

	const fetchMonthly = async (year?: number, month?: number) => {
		setLoading(true);
		try {
			const targetYear = year || selectedYear;
			const targetMonth = month || selectedMonth;
			const data = await getMonthlyTransactions(targetYear, targetMonth);
			setAllTransactions(data || []);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const getItemName = (id: number) => items.find((item) => item.id === id)?.name || `ID:${id}`;

	// データを分類
	const fixedCosts = allTransactions.filter(t => !t.day);
	const variableCosts = allTransactions.filter(t => t.day);

	// 費目別集計
	const categorySummary: CategorySummary[] = [];
	const categoryMap = new Map<number, number>();
	allTransactions.forEach(t => {
		const current = categoryMap.get(t.item_id) || 0;
		categoryMap.set(t.item_id, current + Number(t.amount));
	});
	categoryMap.forEach((amount, item_id) => {
		categorySummary.push({
			item_id,
			item_name: getItemName(item_id),
			amount
		});
	});
	categorySummary.sort((a, b) => b.amount - a.amount);

	// 合計計算
	const totalAll = allTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
	const totalFixed = fixedCosts.reduce((sum, t) => sum + Number(t.amount), 0);

	// 固定費の金額をクリックしたときのハンドラー
	const handleFixedCostClick = (tx: Transaction) => {
		setEditingTransaction(tx);
		setEditDate(new Date(tx.year, tx.month - 1, 1)); // 固定費は1日をデフォルトに
		setEditItemId(tx.item_id);
		setEditNote(tx.note || '');
		setEditAmount(Number(tx.amount));
		setIsFixedCost(true);
		setEditDialogVisible(true);
	};

	// 編集モーダルを開く
	const openEditDialog = (tx: Transaction) => {
		setEditingTransaction(tx);
		setEditDate(new Date(tx.year, tx.month - 1, Number(tx.day) || 1));
		setEditItemId(tx.item_id);
		setEditNote(tx.note || '');
		setEditAmount(Number(tx.amount));
		setIsFixedCost(false);
		setEditDialogVisible(true);
	};

	// 通知を表示
	const showNotification = (message: string, type?: 'success' | 'error' | 'info' | 'warn') => {
		showSimpleNotification({ message, type });
	};

	// 更新処理
	const handleUpdate = async () => {
		if (!editingTransaction || !editItemId) return;
		setEditDialogVisible(false);
		setLoading(true);
		const loadingNotification = showLoadingNotification('更新中...');
		try {
			await updateTransaction(editingTransaction.id, {
				year: editDate.getFullYear(),
				month: editDate.getMonth() + 1,
				day: editDate.getDate(),
				item_id: editItemId,
				note: editNote,
				amount: editAmount
			});
			loadingNotification.close();
			showNotification('更新しました！', 'success');
			await fetchMonthly();
		} catch (e: any) {
			loadingNotification.close();
			showNotification(e.message, 'error');
		} finally {
			setLoading(false);
		}
	};

	// 削除処理
	const handleDelete = () => {
		if (!editingTransaction) return;
		// 削除前にモーダルを閉じる
		setEditDialogVisible(false);
		confirmDialog({
			message: '本当に削除しますか？',
			header: '削除確認',
			icon: 'pi pi-exclamation-triangle',
			acceptClassName: 'p-button-danger',
			accept: async () => {
				setLoading(true);
				const loadingNotification = showLoadingNotification('削除中...');
				try {
					await deleteTransaction(editingTransaction.id);
					loadingNotification.close();
					showNotification('削除しました！', 'success');
					await fetchMonthly();
				} catch (e: any) {
					loadingNotification.close();
					showNotification(`エラー: ${e.message}`, 'error');
				} finally {
					setLoading(false);
				}
			}
		});
	};

	// フッター
	const categoryFooter = (
		<ColumnGroup>
			<Row>
				<Column footer="合計" footerStyle={{ textAlign: 'left' }} />
				<Column footer={`¥${totalAll.toLocaleString()}`} />
			</Row>
		</ColumnGroup>
	);

	const fixedFooter = (
		<ColumnGroup>
			<Row>
				<Column footer="小計" colSpan={2} footerStyle={{ textAlign: 'left' }} />
				<Column footer={`¥${totalFixed.toLocaleString()}`} />
			</Row>
		</ColumnGroup>
	);


	return (
		<div className="grid">
			<Toast ref={toast} />
			<ConfirmDialog />

			{/* 月選択 */}
			<div className="col-12">
				<div className="flex align-items-center gap-3 mb-4">
					<label>対象月:</label>
					<Calendar
						value={selectedDate}
						onChange={(e) => setSelectedDate(e.value as Date)}
						view="month"
						dateFormat="yy/mm"
						showIcon
						yearNavigator
						yearRange="2020:2030"
						monthNavigator
						showButtonBar
						className="mr-2"
						style={{ width: '9em' }}
					/>
					<Button
						icon="pi pi-refresh"
						rounded
						text
						onClick={() => fetchMonthly(selectedDate.getFullYear(), selectedDate.getMonth() + 1)}
						tooltip="再読み込み"
						disabled={loading}
					/>
				</div>
			</div>

			{/* 費目別集計 */}
			<div className="col-12 md:col-6">
				<Card title="費目別集計">
					<DataTable value={categorySummary} loading={loading} footerColumnGroup={categoryFooter} size="small" stripedRows>
						<Column
							field="item_name"
							header="費目"
							body={(row) => row.item_name}
						/>
						<Column field="amount" header="金額" body={(row) => `¥${row.amount.toLocaleString()}`} />
					</DataTable>
				</Card>
			</div>

			{/* 固定費 */}
			<div className="col-12 md:col-6">
				<Card title="固定費">
					<DataTable
						value={fixedCosts}
						loading={loading}
						footerColumnGroup={fixedFooter}
						size="small"
						stripedRows
						emptyMessage="固定費データがありません"
						selectionMode="single"
						onRowClick={(e) => {
							const transaction = e.data as Transaction;
							if (transaction) {
								handleFixedCostClick(transaction);
							}
						}}
						rowClassName={() => "cursor-pointer hover:surface-100"}
					>
						<Column
							field="item_id"
							header="費目"
							body={(row) => {
								const name = getItemName(row.item_id);
								return (
									<>
										<span className="desktop-only">{name}</span>
										<span className="mobile-only">{name.substring(0, 2)}</span>
									</>
								);
							}}
						/>
						<Column
							field="note"
							header="品目"
							body={(row) => {
								const n = row.note || '-';
								return (
									<>
										<span className="desktop-only">{n}</span>
										<span className="mobile-only">{n.length > 4 ? n.substring(0, 4) + '...' : n}</span>
									</>
								);
							}}
						/>
						<Column
							field="amount"
							header="金額"
							body={(row) => `¥${Number(row.amount).toLocaleString()}`}
						/>
					</DataTable>
				</Card>
			</div>

			{/* 明細一覧 */}
			<div className="col-12">
				<Card title="明細一覧">
					<DataTable
						value={variableCosts}
						loading={loading}
						size="small"
						stripedRows
						emptyMessage="明細データがありません"
						selectionMode="single"
						onRowClick={(e) => {
							const transaction = e.data as Transaction;
							if (transaction) {
								openEditDialog(transaction);
							}
						}}
						rowClassName={() => "cursor-pointer hover:surface-100"}
					>
						<Column field="date" header="日付" body={(rowData) =>
							`${rowData.month}/${rowData.day} (${getDayLabel(new Date(Number(rowData.year), Number(rowData.month) - 1, Number(rowData.day)))})`
						} />
						<Column
							field="item_id"
							header="費目"
							body={(rowData) => {
								const name = getItemName(rowData.item_id);
								return (
									<>
										<span className="desktop-only">{name}</span>
										<span className="mobile-only">{name.substring(0, 2)}</span>
									</>
								);
							}}
						/>
						<Column
							field="note"
							header="品目"
							body={(rowData) => {
								const n = rowData.note || '-';
								return (
									<>
										<span className="desktop-only">{n}</span>
										<span className="mobile-only">{n.length > 4 ? n.substring(0, 4) + '...' : n}</span>
									</>
								);
							}}
						/>
						<Column field="amount" header="金額" body={(rowData) => `¥${Number(rowData.amount).toLocaleString()}`} />
					</DataTable>
				</Card>
			</div>

			{/* 編集モーダル */}
			<Dialog
				header={isFixedCost ? "固定費を編集" : "明細を編集"}
				visible={editDialogVisible}
				onHide={() => setEditDialogVisible(false)}
				style={{ width: '90vw', maxWidth: '500px' }}
				dismissableMask={true}
				modal
				draggable={false}
			>
				{/* /調整 */}
				<div style={{ paddingTop: '1rem' }}></div>

				{!isFixedCost && (
					<div className="field">
						<label>日付</label>
						<Calendar
							value={editDate}
							onChange={(e) => setEditDate(e.value as Date)}
							dateFormat="yy/mm/dd"
							showIcon
							className="w-full"
						/>
					</div>
				)}

				<div className="field">
					<label>金額</label>
					<InputText
						value={editAmount ? editAmount.toString() : ''}
						onChange={(e) => {
							const value = e.target.value;
							// 数字のみ許可（空文字列は許可）
							if (value === '' || /^[0-9]+$/.test(value)) {
								setEditAmount(value === '' ? 0 : parseInt(value, 10));
							}
						}}
						placeholder="金額"
						className="w-full"
						type="text"
						inputMode="numeric"
						pattern="[0-9]*"
					/>
				</div>

				<div className="field">
					<label>費目</label>
					<Dropdown
						value={editItemId}
						options={items}
						optionLabel="name"
						optionValue="id"
						onChange={(e) => setEditItemId(e.value)}
						placeholder="費目を選択"
						className="w-full"
					// disabled={isFixedCost}
					/>
				</div>

				<div className="field">
					<label>品目</label>
					<InputText
						value={editNote}
						onChange={(e) => setEditNote(e.target.value)}
						placeholder="品目を入力（任意）"
						className="w-full"
					// disabled={isFixedCost}
					/>
				</div>

				<div className="flex justify-content-between mt-4">
					{editingTransaction && (
						<Button
							label="削除"
							icon="pi pi-trash"
							severity="danger"
							onClick={handleDelete}
							className="p-button-danger"
							style={{ width: 'unset' }}
						/>
					)}
					<Button
						label="更新"
						icon="pi pi-check"
						onClick={handleUpdate}
						disabled={!editItemId || editAmount <= 0}
						severity={!editItemId || editAmount <= 0 ? 'secondary' : 'warning'}
						style={{ width: 'unset' }}
					/>
				</div>
			</Dialog>
		</div>
	);
};
