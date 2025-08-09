// features/delete.js - 删除序号功能

// 删除序号：移除所有序号和行首空格，并确保每段之间空一行
// 这个函数依赖于 utils.js 中的辅助函数
function delete_numbers(text) {
    // 允许空行的功能，但每行的内容仍需彻底紧凑
    let lines = text.split('\n');
    const processed_lines = [];
    for (let line of lines) {
        // 对当前行进行彻底的空白移除
        let stripped_line = remove_all_internal_whitespace(line);
        if (stripped_line) { // 只处理非空行
            // 移除序号和行首空格，并确保内容完全紧凑
            let cleaned_line_content = remove_leading_patterns_and_compact_content(stripped_line);

            // 先将英文标点转换为中文标点，避免英文句号被误移除或不一致
            cleaned_line_content = replaceEnglishPunctuationToChinese(cleaned_line_content);

            // 保证句末为中文句号（若为冒号则保留冒号）
            cleaned_line_content = standardize_end_punctuation_for_numbered_items(cleaned_line_content);

            processed_lines.push(cleaned_line_content); // 已经是紧凑的，无需再trim
        }
    }
    // 使用双换行符连接，以在每段之间创建空行 (此功能唯一允许空行的)
    return processed_lines.join('\n\n');
}