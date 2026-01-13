import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';

import { createTransaction, deleteTransaction, getRecentTransactions, updateTransaction } from '../api/client';
import type { Item, Transaction } from '../types';
import { items } from '../constants/items';
import { showSimpleNotification, showLoadingNotification } from '../utils/notifications';
import { getDayLabel } from '../utils/dateUtils';
import { addLocale, locale } from 'primereact/api';

// PrimeReact の日本語ロケール設定
addLocale('ja', {
	firstDayOfWeek: 0,
	dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
	dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
	dayNamesMin: ['日', '月', '火', '水', '木', '金', '土'],
	monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
	monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
	today: '今日',
	clear: 'クリア'
});
locale('ja');

interface HomePageProps {
	items: Item[];
	token: string;
}

export const HomePage: React.FC<HomePageProps> = ({ token }) => {
	// 新規登録用
	const [date, setDate] = useState<Date>(new Date());
	const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
	const [note, setNote] = useState<string>(''); // 品目
	const [amounts, setAmounts] = useState<number[]>([0]);
	const [loading, setLoading] = useState(false);

	// 一覧と編集モーダル用
	const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
	const [editDialogVisible, setEditDialogVisible] = useState(false);
	const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
	const [editDate, setEditDate] = useState<Date>(new Date());
	const [editItemId, setEditItemId] = useState<number | null>(null);
	const [editNote, setEditNote] = useState<string>('');
	const [editAmount, setEditAmount] = useState<number>(0);


	// 中央通知用
	const toast = useRef<Toast>(null);
	const hasFetched = useRef(false);

	useEffect(() => {
		if (token && !hasFetched.current) {
			hasFetched.current = true;
			fetchRecent();
		}
	}, [token]);

	const fetchRecent = async () => {
		try {
			setLoading(true);
			const data = await getRecentTransactions();
			setRecentTransactions(data);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	// 通知を表示
	const showNotification = (message: string, type?: 'success' | 'error' | 'info' | 'warn') => {
		showSimpleNotification({ message, type });
	};

	// 新規登録の入力が完了しているか
	const isFormValid = selectedItemId !== null && amounts.reduce((s, a) => s + (a || 0), 0) > 0 && note.trim() !== '';

	const handleAddAmount = () => {
		setAmounts([...amounts, 0]);
	};

	const handleDateShortcut = (diff: number) => {
		const d = new Date();
		d.setDate(d.getDate() - diff);
		setDate(d);
	};

	const handleSubmit = async () => {
		if (!isFormValid) return;

		// 先に入力をクリア（即座に次の入力ができるように）
		const submitData = {
			year: date.getFullYear(),
			month: date.getMonth() + 1,
			day: date.getDate(),
			item_id: selectedItemId,
			amount: amounts.reduce((sum, a) => sum + (a || 0), 0),
			note: note,
			is_income: 0
		};
		setSelectedItemId(null);
		setNote('');
		setAmounts([0]);

		const loadingNotification = showLoadingNotification('登録中...');
		setLoading(true);
		try {
			await createTransaction(submitData);
			showNotification('登録しました！', 'success');
			loadingNotification.close();
			await fetchRecent();
		} catch (e: any) {
			loadingNotification.close();
			showNotification(`エラー: ${e.message}`, 'error');
		} finally {
			setLoading(false);
		}
	};

	// 編集モーダルを開く
	const openEditDialog = (tx: Transaction) => {
		setEditingTransaction(tx);
		setEditDate(new Date(tx.year, tx.month - 1, Number(tx.day)));
		setEditItemId(tx.item_id);
		setEditNote(tx.note || '');
		setEditAmount(Number(tx.amount));
		setEditDialogVisible(true);
	};

	// 編集モーダルの更新処理
	const handleUpdate = async () => {
		if (!editingTransaction || !editItemId || !editAmount) return;

		// 先にモーダルを閉じる
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
			await fetchRecent();
		} catch (e: any) {
			loadingNotification.close();
			showNotification(`エラー: ${e.message}`, 'error');
		} finally {
			setLoading(false);
		}
	};

	// 編集モーダルの削除処理
	const handleDeleteFromModal = () => {
		if (!editingTransaction) return;
		// 先にモーダルを閉じる
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
					await fetchRecent();
				} catch (e: any) {
					loadingNotification.close();
					showNotification(`エラー: ${e.message}`, 'error');
				} finally {
					setLoading(false);
				}
			}
		});
	};

	const getItemName = (id: number) => items.find(i => i.id === id)?.name || id;

	return (
		<div className="grid">
			<Toast ref={toast} />
			<ConfirmDialog />


			{/* 新規登録フォーム */}
			<div className="col-12 md:col-6">
				<Card title="新規登録">
					<div className="field">
						<label className="block mb-2 font-bold">1. 日付</label>
						<div className="flex flex-wrap gap-2 mb-2">
							<Button label="今日" size="small" outlined onClick={() => handleDateShortcut(0)} className="flex-shrink-0" />
							<Button label="昨日" size="small" outlined onClick={() => handleDateShortcut(1)} className="flex-shrink-0" />
							<Button label="一昨日" size="small" outlined onClick={() => handleDateShortcut(2)} className="flex-shrink-0" />
							<Button label="3日前" size="small" outlined onClick={() => handleDateShortcut(3)} className="flex-shrink-0" />
						</div>
						<Calendar
							value={date}
							onChange={(e) => setDate(e.value as Date)}
							showIcon
							dateFormat="yy/mm/dd (D)"
							className="w-full"
							locale="ja"
						/>
					</div>

					<div className="field">
						<label>2. 金額</label>
						{amounts.map((amt, index) => (
							<div key={index} className="flex gap-2 mb-2 align-items-center">
								<InputText
									value={amt ? amt.toString() : ''}
									onChange={(e) => {
										const value = e.target.value;
										// 数字のみ許可（空文字列は許可）
										if (value === '' || /^[0-9]+$/.test(value)) {
											const newAmounts = [...amounts];
											newAmounts[index] = value === '' ? 0 : parseInt(value, 10);
											setAmounts(newAmounts);
										}
									}}
									placeholder="金額"
									className="w-full"
									type="text"
									inputMode="numeric"
									pattern="[0-9]*"
								/>
							</div>
						))}
						<Button icon="pi pi-plus" label="金額追加" className="p-button-text p-button-sm" onClick={handleAddAmount} />
						<div className="mt-2 text-right font-bold">
							合計: {amounts.reduce((s, a) => s + (a || 0), 0).toLocaleString()}円
						</div>
					</div>

					<div className="field">
						<label className="block mb-2 font-bold">3. 費目を選択</label>
						<div className="flex flex-wrap gap-2">
							{items.length === 0 ? (
								<p className="text-muted">読み込み中...</p>
							) : (
								items.map((item) => (
									<Button
										key={item.id}
										label={item.name}
										type="button"
										onClick={() => setSelectedItemId(item.id)}
										className={selectedItemId === item.id ? 'category-btn-selected' : 'category-btn-normal'}
										style={{
											flex: '1 1 calc(33.33% - 0.5rem)',
											minWidth: '80px',
											padding: '0.5rem',
											fontSize: '0.9rem'
										}}
									/>
								))
							)}
						</div>
					</div>

					<div className="field">
						<label>4. 品目</label>
						<InputText
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder="例) ミスド"
							className="w-full"
						/>
					</div>

					{/* 登録ボタン: 入力完了時のみ有効で橙色 */}
					<Button
						label="登録"
						icon="pi pi-check"
						onClick={handleSubmit}
						disabled={!isFormValid}
						severity={isFormValid ? "warning" : undefined}
						className={isFormValid ? "" : "p-button-secondary"}
					/>
				</Card>
			</div>

			{/* 直近の明細 */}
			<div className="col-12 md:col-6">
				<Card title="直近の明細">
					<DataTable
						value={recentTransactions}
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
						<Column
							field="date"
							header="日付"
							body={(rowData) => {
								const d = new Date(rowData.year, rowData.month - 1, rowData.day);
								return `${rowData.month}/${rowData.day} (${getDayLabel(d)})`;
							}}
						/>
						<Column
							field="item_id"
							header="費目"
							body={(rowData) => {
								const name = String(getItemName(rowData.item_id));
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
				header="明細を編集"
				visible={editDialogVisible}
				onHide={() => setEditDialogVisible(false)}
				style={{ width: '90vw', maxWidth: '500px' }}
				dismissableMask={true}
				modal
				draggable={false}
			>
				<div className="field mt-3">
					<label className="block mb-2">日付</label>
					<Calendar value={editDate} onChange={(e) => setEditDate(e.value as Date)} showIcon dateFormat="yy/mm/dd" className="w-full" />
				</div>

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
					/>
				</div>

				<div className="field">
					<label>品目</label>
					<InputText
						value={editNote}
						onChange={(e) => setEditNote(e.target.value)}
						placeholder="品目を入力（任意）"
						className="w-full"
					/>
				</div>

				<div className="flex justify-content-between mt-4">
					<Button
						label="削除"
						icon="pi pi-trash"
						severity="danger"
						onClick={handleDeleteFromModal}
						className="p-button-danger"
					/>
					<Button
						label="更新"
						icon="pi pi-check"
						onClick={handleUpdate}
						disabled={!editItemId || editAmount <= 0}
						severity={!editItemId || editAmount <= 0 ? 'secondary' : 'warning'}
						loading={loading}
					/>
				</div>
			</Dialog>
		</div>
	);
};
