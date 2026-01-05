/**
 * Утилита для правильного склонения русских слов
 * 
 * @param {number} n - число
 * @param {string[]} forms - формы слова [один, два-четыре, много]
 * @returns {string} - правильная форма слова
 * 
 * Примеры:
 * pluralize(1, ['занятие', 'занятия', 'занятий']) => 'занятие'
 * pluralize(2, ['занятие', 'занятия', 'занятий']) => 'занятия'
 * pluralize(5, ['занятие', 'занятия', 'занятий']) => 'занятий'
 */
export function pluralize(n, forms) {
    const n10 = Math.abs(n) % 10;
    const n100 = Math.abs(n) % 100;

    if (n100 > 10 && n100 < 20) return forms[2];
    if (n10 === 1) return forms[0];
    if (n10 >= 2 && n10 <= 4) return forms[1];
    return forms[2];
}

// Готовые наборы форм для частых случаев
export const LESSON_FORMS = ['занятие', 'занятия', 'занятий'];
export const HOUR_FORMS = ['час', 'часа', 'часов'];
export const STUDENT_FORMS = ['ученик', 'ученика', 'учеников'];
export const TIME_FORMS = ['раз', 'раза', 'раз'];

/**
 * Получить строку с числом и правильным склонением
 * @example pluralizeWithNumber(5, LESSON_FORMS) => '5 занятий'
 */
export function pluralizeWithNumber(n, forms) {
    return `${n} ${pluralize(n, forms)}`;
}
