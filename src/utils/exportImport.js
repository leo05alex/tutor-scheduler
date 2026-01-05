import db from '../db/database';

/**
 * Экспорт всех данных в JSON файл
 */
export async function exportData() {
    try {
        const students = await db.students.toArray();
        const lessons = await db.lessons.toArray();
        const settings = await db.settings.get(1);

        const exportData = {
            version: 1,
            exportedAt: new Date().toISOString(),
            data: {
                students,
                lessons,
                settings
            }
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `tutor-scheduler-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return { success: true, message: 'Данные успешно экспортированы' };
    } catch (error) {
        console.error('Export error:', error);
        return { success: false, message: 'Ошибка экспорта: ' + error.message };
    }
}

/**
 * Импорт данных из JSON файла
 */
export async function importData(file) {
    try {
        const text = await file.text();
        const importedData = JSON.parse(text);

        // Проверка структуры
        if (!importedData.data || !importedData.version) {
            throw new Error('Неверный формат файла резервной копии');
        }

        const { students, lessons, settings } = importedData.data;

        // Очистка существующих данных
        await db.students.clear();
        await db.lessons.clear();
        await db.settings.clear();

        // Импорт данных
        if (students && students.length > 0) {
            await db.students.bulkAdd(students);
        }

        if (lessons && lessons.length > 0) {
            await db.lessons.bulkAdd(lessons);
        }

        if (settings) {
            await db.settings.add(settings);
        }

        return {
            success: true,
            message: `Импортировано: ${students?.length || 0} учеников, ${lessons?.length || 0} занятий`
        };
    } catch (error) {
        console.error('Import error:', error);
        return { success: false, message: 'Ошибка импорта: ' + error.message };
    }
}

/**
 * Очистка всех данных
 */
export async function clearAllData() {
    try {
        await db.students.clear();
        await db.lessons.clear();
        await db.settings.clear();

        return { success: true, message: 'Все данные удалены' };
    } catch (error) {
        console.error('Clear error:', error);
        return { success: false, message: 'Ошибка очистки: ' + error.message };
    }
}
