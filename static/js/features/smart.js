// features/smart.js - 智能处理功能

// 智能处理：根据文本特征自动清理和格式化
// 这个函数依赖于 utils.js 中的辅助函数和 constants.js 中的正则表达式
function smart_process_text(text) {
    // 智能处理规则：
    // 0. 删除 <br> 标签。
    // 1. 当用户输入时间格式时，如果那个时间的冒号还有时间横杠号是中文格式的，要把它转换成英文格式的时间冒号和横杠号。
    // 2. 将所有英文标点符号转换为中文标点符号（URL和时间中的除外）。
    // 3. 根据是否含有可识别的序号或年份前缀，执行不同逻辑：
    //    a) 含有序号或年份前缀：对全文进行彻底去空格和换行，并根据原有序号（或年份）和句末标点进行分段，保留原有序号/年份，每段独立一行。
    //    b) 不含序号或年份前缀：对全文进行彻底去空格和换行，将所有内容合并为一行。
    // 4. 无论哪种情况，程序都不会自动添加任何标点符号（例如句号）。

    // 0. 删除 <br> 标签
    text = text.replace(/<br\s*\/?>/gi, '');

    // 1. NEW: 将中文时间冒号和连字符转换为英文
    text = convertChineseTimePunctuationToEnglish(text);

    // 2. 将英文标点符号转换为中文标点符号 (URL和时间除外)
    text = replaceEnglishPunctuationToChinese(text);

    const original_lines = text.split('\n');
    // 检查处理后的文本中是否包含任何识别的序号或年份前缀
    const has_prefixes = original_lines.some(line => line.trim() && (LEADING_NUMBER_PATTERN_WITH_ANCHOR_REGEX.test(line) || LEADING_YEAR_PATTERN_REGEX.test(line)));

    if (has_prefixes) {
        // 场景 A: 输入文本含有序号或年份前缀
        // 目标：对全文进行彻底去空格和换行，并根据原有序号（或年份）和句末标点进行分段，保留原有序号/年份，每段独立一行。
        
        // 将所有非空行合并成一个字符串，并彻底去除所有空白（包括单词间的）
        // 此处依然使用 remove_all_internal_whitespace，因为此场景是“彻底去空格”后重新分段
        let flattened_text_all_whitespace_removed = remove_all_internal_whitespace(
            original_lines.filter(line => line.trim()).map(line => line.trim()).join('')
        );

        // 定义分段的正则表达式。
        // 分段点：在句号、问号、叹号、分号或冒号之后，如果紧跟着可选空白和一个序号模式（包括年份模式），则在此处分段。
        const smart_segment_split_regex = new RegExp(
            `(?<=[。？！；：])${OPTIONAL_WHITESPACE_STR}(?=${LEADING_NUMBER_PATTERN_BASE}|20\\d{2}[年年度])`, 'g'
        );

        let segments = flattened_text_all_whitespace_removed.split(smart_segment_split_regex);
        
        const result_segments = [];
        for (let segment of segments) {
            segment = segment.trim();
            if (segment) {
                // NEW: 不再自动添加句号，只保留已有的标点符号
                result_segments.push(segment);
            }
        }
        return result_segments.join('\n'); // 最终用换行符连接，使每个分段独立成行
    } else {
        // 场景 B: 输入文本不含序号或年份前缀
        // 目标：对全文进行彻底去空格和换行，将所有内容合并为一行。
        
        // 将所有非空行合并成一个字符串，并彻底去除所有空白（包括单词间的）
        let full_text_single_line = remove_all_internal_whitespace(original_lines.filter(line => line.trim()).map(line => line.trim()).join(''));
        
        // 再次确保彻底移除所有剩余的空白
        let final_text = remove_all_internal_whitespace(full_text_single_line);
        
        return final_text; // 输出为一行
    }
}