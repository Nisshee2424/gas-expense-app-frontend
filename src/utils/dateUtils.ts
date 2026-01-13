/**
 * 日付オブジェクトを受け取り、対応する曜日の1文字表示を返す
 * @param date 日付オブジェクト
 * @returns '日' | '月' | '火' | '水' | '木' | '金' | '土'
 */
export const getDayLabel = (date: Date): string => {
	const days = ['日', '月', '火', '水', '木', '金', '土'];
	return days[date.getDay()];
};
