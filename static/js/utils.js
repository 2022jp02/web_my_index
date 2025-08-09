// utils.js - 存放通用辅助函数

// 辅助函数：标准化文本中的所有空白字符为单个空格，并移除首尾空格
// 此函数保留，用于需要将连续空白压缩为单个空格的场景 (如快捷复制的文本)。
function standardize_internal_whitespace_to_single(text) {
    if (!text) return '';
    return text.replace(WHITESPACE_TO_SINGLE_SPACE_REGEX, ' ').trim();
}

// 辅助函数：移除所有空白字符（包括各种Unicode空白和单词间的空格），使其紧密排列
// 这是实现“不允许存在空格”的关键，输出完全紧凑的文本。
function remove_all_internal_whitespace(text) {
    if (!text) return '';
    return text.replace(WHITESPACE_TO_REMOVE_REGEX_ALL, '').trim();
}

// 辅助函数：移除行开头可能存在的旧序号和多余空格，并确保内容完全紧凑（无空格）。
// 特殊处理年份，不移除年份。
function remove_leading_patterns_and_compact_content(line) {
    // 首先对传入的行进行彻底的内部空格移除和首尾去空
    let currentCompactedLine = remove_all_internal_whitespace(line); 
    if (!currentCompactedLine) return '';

    // 尝试匹配行首的年份模式
    const year_match = currentCompactedLine.match(LEADING_YEAR_PATTERN_REGEX); 
    if (year_match) {
        // 如果是年份行，保留年份部分，并处理年份后面的内容
        // year_match[1] 是捕获的年份字符串本身 (如 "2025年")
        // year_match[0].length 是匹配到的完整前缀长度，包括前导和尾随空白
        let content_after_year = remove_all_internal_whitespace(currentCompactedLine.substring(year_match[0].length));
        return `${year_match[1]}` + (content_after_year ? `${content_after_year}` : ''); // 年份和内容之间不留空格
    }

    // 如果不是年份行，则尝试移除其他类型的行首序号
    let cleaned_line = currentCompactedLine.replace(LEADING_NUMBER_PATTERN_WITH_ANCHOR_REGEX, '');
    // 对剩余部分进行内部空格移除和两端去空白
    return remove_all_internal_whitespace(cleaned_line); // 最终彻底紧凑
}

// 辅助函数：确保字符串以中文句号“。”结尾，并移除已存在的常见句末标点（包括分号）。
// 但如果原始文本以冒号“：”结尾，则保留冒号，不加句号。
// 此函数用于对“被赋予新序号”的行进行句末标准化。
function standardize_end_punctuation_for_numbered_items(text) {
    text = text.trim(); // 确保首尾无空白
    if (!text) return '';
    // 检查原始文本是否以中文冒号结尾，如果是，则保留冒号
    if (text.endsWith('：')) {
        return text;
    }
    // 移除已存在的常见句末标点（不包括冒号）
    text = text.replace(/[.,;!?。？！；]$/, ''); 
    // 添加中文句号
    return text + '。';
}


// 检查文本中是否含有特定关键字并弹框提示
function checkAndAlertKeywords(text) {
    const keywords = ["我省", "我市", "我区", "我局", "我县", "本指南", "本通知", "本指引"];
    // 匹配 "附件" 后跟数字或中文数字的模式，如 "附件一", "附件2"
    const attachmentPattern = /附件[一二三四五六七八九十\d]+/g; 
    const lines = text.split('\n');
    let foundMessages = [];

    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        let lineContent = line; // 检查原始行内容

        // 检查关键字
        keywords.forEach(keyword => {
            if (lineContent.includes(keyword)) {
                foundMessages.push(`第${lineNumber}行含有“${keyword}”`);
            }
        });

        // 检查附件模式
        let match;
        // 重置正则表达式的lastIndex，以确保每次对新行执行时都能从头开始匹配
        attachmentPattern.lastIndex = 0; 
        while ((match = attachmentPattern.exec(lineContent)) !== null) {
            foundMessages.push(`第${lineNumber}行含有“${match[0]}”`);
        }
    });

    if (foundMessages.length > 0) {
        // 去重并格式化提示信息
        const uniqueMessages = [...new Set(foundMessages)];
        // 这里只是为了演示，showKeywordAlertModal函数本身将由main.js提供，
        // 但为了让这个函数能独立存在，我们假设 showKeywordAlertModal 是全局可用的
        // 或者在main.js中传入。此处暂时不修改其调用方式。
        if (typeof showKeywordAlertModal !== 'undefined') {
            showKeywordAlertModal("您提供的文本中<br>" + uniqueMessages.join("<br>") + "<br>，请留意做项目时是否需要修改。");
        } else {
            console.warn("Function showKeywordAlertModal is not defined. Keyword alert will not be shown.");
        }
        return true; // 表示有关键字被发现
    }
    return false; // 没有关键字被发现
}

// 辅助函数：将中文时间冒号和连字符转换为英文
function convertChineseTimePunctuationToEnglish(text) {
    if (!text) return '';

    // 转换中文全角冒号（：）为英文冒号（:），确保前后都是数字
    text = text.replace(/(\d+)[：](\d+)/g, '$1:$2');

    // 转换中文破折号（—）或全角连字符（－）为英文连字符（-），确保前后都是数字
    // 考虑到时间范围的常见用法，例如 '12:00—14:30' 或 '2024年4月1日—2024年4月30日'
    // 这里的正则表达式捕获数字后跟着中文破折号或全角连字符，再跟着数字的情况。
    // 这有助于避免误转换汉字“一”。
    text = text.replace(/(\d+)([—－])(\d+)/g, '$1-$3');

    return text;
}


// 英文标点符号转换为中文标点符号函数 (已优化，防止URL/时间被破坏)
function replaceEnglishPunctuationToChinese(text) {
    // Expanded Pattern to match URLs and Times (exempt from conversion)
    // - https?://[^\s]+ : HTTP/HTTPS URLs
    // - ftp://[^\s]+ : FTP URLs
    // - \b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}(?:\/[^\s]*)?(?:[?#][^\s]*)?\b : More general domain names (e.g., rsj.hefei.gov.cn, example.com/path)
    // - \b\d{1,2}:\d{2}(?::\d{2})?\b : Times (e.g., 12:00, 14:30:00)
    const exempt_pattern = /(https?:\/\/[^\s]+|ftp:\/\/[^\s]+|\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}(?:\/[^\s]*)?(?:[?#][^\s]*)?\b|\b\d{1,2}:\d{2}(?::\d{2})?\b)/gi;

    let result_parts = [];
    let lastIndex = 0;
    let match;

    // Use `exec` in a loop to get all matches and their indices
    while ((match = exempt_pattern.exec(text)) !== null) {
        // Process the non-exempt part before the current match
        if (match.index > lastIndex) {
            let non_exempt_text = text.substring(lastIndex, match.index);
            // Convert punctuation in non-exempt text
            let converted_segment = non_exempt_text;

            // Order matters for multi-character replacements (longest first)
            converted_segment = converted_segment.replace(/---/g, '——'); // Triple hyphen to double em dash
            converted_segment = converted_segment.replace(/--/g, '——'); // Double hyphen to em dash
            converted_segment = converted_segment.replace(/\.{3,}/g, '…'); // Three or more dots to ellipsis

            // Replace single quotes and double quotes (stateful replacement for proper open/close)
            let tempInDoubleQuote = false; // Reset for each segment
            converted_segment = converted_segment.replace(/"/g, () => {
                tempInDoubleQuote = !tempInDoubleQuote; // Simple toggle
                return tempInDoubleQuote ? '“' : '”';
            });
            let tempInSingleQuote = false; // Reset for each segment
            converted_segment = converted_segment.replace(/'/g, () => {
                tempInSingleQuote = !tempInSingleQuote; // Simple toggle
                return tempInSingleQuote ? '‘' : '’';
            });


            // Replace other single character punctuation
            converted_segment = converted_segment
                .replace(/\./g, '。') // Period
                .replace(/,/g, '，') // Comma
                .replace(/:/g, '：') // Colon
                .replace(/;/g, '；') // Semicolon
                .replace(/\?/g, '？') // Question mark
                .replace(/!/g, '！') // Exclamation mark
                .replace(/\(/g, '（') // Left parenthesis
                .replace(/\)/g, '）') // Right parenthesis
                .replace(/\[/g, '〔') // Left bracket
                .replace(/\]/g, '〕') // Right bracket
                .replace(/\{/g, '｛') // Left brace
                .replace(/\}/g, '｝') // Right brace
                .replace(/%/g, '％') // Percent
                .replace(/~/g, '～') // Tilde
                .replace(/\$/g, '＄') // Dollar
                .replace(/#/g, '＃') // Hash
                .replace(/@/g, '＠') // At
                .replace(/\//g, '／') // Slash
                .replace(/\\/g, '＼') // Backslash
                .replace(/\^/g, '＾') // Caret
                .replace(/_/g, '＿') // Underscore
                .replace(/-/g, '－'); // Single hyphen (after longer hyphens handled)

            result_parts.push(converted_segment);
        }
        // Add the exempt part (unmodified)
        result_parts.push(match[0]);
        lastIndex = exempt_pattern.lastIndex;
    }
    // Add any remaining non-exempt part after the last match
    if (lastIndex < text.length) {
        let non_exempt_text = text.substring(lastIndex);
        let converted_segment = non_exempt_text;
        
        // Similar punctuation conversion for the remainder
        converted_segment = converted_segment.replace(/---/g, '——');
        converted_segment = converted_segment.replace(/--/g, '——');
        converted_segment = converted_segment.replace(/\.{3,}/g, '…');
        let tempInDoubleQuote = false;
        converted_segment = converted_segment.replace(/"/g, () => { tempInDoubleQuote = !tempInDoubleQuote; return tempInDoubleQuote ? '“' : '”'; });
        let tempInSingleQuote = false;
        converted_segment = converted_segment.replace(/'/g, () => { tempInSingleQuote = !tempInSingleQuote; return tempInSingleQuote ? '‘' : '’'; });
        converted_segment = converted_segment
            .replace(/\./g, '。').replace(/,/g, '，').replace(/:/g, '：').replace(/;/g, '；')
            .replace(/\?/g, '？').replace(/!/g, '！').replace(/[\(（]/g, '（').replace(/[\)）]/g, '）') // 匹配英文和中文括号
            .replace(/\[/g, '〔').replace(/\]/g, '〕').replace(/\{/g, '｛').replace(/\}/g, '｝')
            .replace(/%/g, '％').replace(/~/g, '～').replace(/\$/g, '＄').replace(/#/g, '＃')
            .replace(/@/g, '＠').replace(/\//g, '／').replace(/\\/g, '＼')
            .replace(/\^/g, '＾').replace(/\_/g, '＿').replace(/-/g, '－'); 
        
        result_parts.push(converted_segment);
    }

    return result_parts.join('');
}

// 统一处理带序号列表的辅助函数 (被多个功能模块调用)
function process_numbered_list(text, number_format_type, is_two_level_requested = false) {
    // **核心修复：首先按原始换行符分割文本。**
    const lines = text.split('\n');
    
    const result_lines = [];
    let current_num_level1 = 1;
    let current_num_level2 = 1;

    // This flag is ONLY for single-level tabs (level1, level2) to handle the special first title line.
    // It's checked *per function call*.
    let single_level_first_line_title_exception_applied_for_this_call = false; 

    for (let i = 0; i < lines.length; i++) {
        const original_line = lines[i];

        // 对当前行进行彻底的空白移除和首尾去空，得到紧凑的行内容。
        let processed_line_content_compacted = remove_all_internal_whitespace(original_line);

        // 如果处理后为空（即原行是空行或仅包含空白字符），则直接跳过，不添加到结果中。
        if (!processed_line_content_compacted) {
            console.log(`Line ${i+1}: Empty or all whitespace, skipping.`); // Debug
            continue; 
        }

        console.groupCollapsed(`--- Processing Line ${i+1} ---`); // Group console logs
        console.log(`Original: "${original_line}"`);
        console.log(`Compacted (initial cleanup): "${processed_line_content_compacted}"`);
        console.log(`is_two_level_requested: ${is_two_level_requested}`);
        console.log(`current_num_level1 (before): ${current_num_level1}`);
        console.log(`current_num_level2 (before): ${current_num_level2}`);

        // 获取去除序号且完全紧凑的纯文本内容。
        // `remove_leading_patterns_and_compact_content` 会对传入的行再次进行彻底紧凑。
        let content_after_leading_pattern_removal = remove_leading_patterns_and_compact_content(original_line);
        
        // 确保句末标点标准化，这适用于所有最终会被编号的行，或需要标准化的行。
        // 它会根据内容是否以冒号结尾来决定加句号还是保留冒号。
        const final_content_with_punctuation = standardize_end_punctuation_for_numbered_items(content_after_leading_pattern_removal);
        
        // 检查原始行的紧凑版是否以中文冒号结尾，用于标题判断。
        const ends_with_colon = processed_line_content_compacted.endsWith('：');


        if (is_two_level_requested) { 
            // --- 针对“两级序号”功能的逻辑 (重新修订和修复) ---
            // 检查原始行是否符合指定的一级或二级序号模式
            const is_explicit_l1_input = TWO_LEVEL_SPECIFIC_L1_INPUT_PATTERN.test(original_line); 
            const is_explicit_l2_input = TWO_LEVEL_SPECIFIC_L2_INPUT_PATTERN.test(original_line); 

            // 判断是否应该作为一级序号处理 (包括显式L1、冒号结尾的未编号行、以及其他未编号行)
            const should_be_l1 = is_explicit_l1_input || 
                                 (ends_with_colon && !is_explicit_l2_input) || 
                                 (!is_explicit_l1_input && !is_explicit_l2_input && !ends_with_colon);

            if (should_be_l1) {
                // 如果是新的一级序号段落 (包括标题和普通段落)
                let content_to_use = remove_leading_patterns_and_compact_content(original_line);
                
                result_lines.push(`（${current_num_level1}）${standardize_end_punctuation_for_numbered_items(content_to_use)}`);
                current_num_level1++;
                current_num_level2 = 1; // 遇到一级序号，二级序号重置
                console.log(`Output as NEW L1. Next L1: ${current_num_level1}, Next L2: ${current_num_level2}.`);

            } else if (is_explicit_l2_input) {
                // 如果是明确的二级序号模式
                let content_to_use = remove_leading_patterns_and_compact_content(original_line);
                const circled_num = current_num_level2 <= 20 ? String.fromCharCode(0x2460 + current_num_level2 - 1) : `[${current_num_level2}]`;
                result_lines.push(`${circled_num}${standardize_end_punctuation_for_numbered_items(content_to_use)}`); 
                current_num_level2++;
                // L1 计数器不在此处改变
                console.log(`Output as NEW L2. Next L1: ${current_num_level1}, Next L2: ${current_num_level2}.`);
            }
            // 理论上所有非空行都应被上述条件之一捕获，不会有 'else' 块
        } else { // 单级序号模式 (level1, level2) 的逻辑
            
            // 特殊处理单级模式下首行是标题的情况
            const is_current_line_numbered_any_format = LEADING_NUMBER_PATTERN_WITH_ANCHOR_REGEX.test(original_line) || LEADING_YEAR_PATTERN_REGEX.test(original_line); 
            
            const is_this_line_a_single_level_title_exception = ends_with_colon && !is_current_line_numbered_any_format;
            if (!single_level_first_line_title_exception_applied_for_this_call && is_this_line_a_single_level_title_exception) {
                result_lines.push(processed_line_content_compacted); // 标题行保持原样（已完全紧凑）
                single_level_first_line_title_exception_applied_for_this_call = true;
                console.log(`Output as Single-Level Title Exception: "${processed_line_content_compacted}"`);
            } else {
                // 如果不是特殊标题，则正常进行编号和处理
                if (number_format_type === 'level1') {
                    result_lines.push(`（${current_num_level1}）${final_content_with_punctuation}`);
                    current_num_level1 += 1;
                    console.log(`Output as single L1: (${current_num_level1-1}).`);
                } else if (number_format_type === 'level2') {
                    const circled_num = current_num_level1 <= 20 ? String.fromCharCode(0x2460 + current_num_level1 - 1) : `[${current_num_level1}]`;
                    result_lines.push(`${circled_num}${final_content_with_punctuation}`);
                    current_num_level1 += 1;
                    console.log(`Output as single L2: ${circled_num}.`);
                } else { 
                    console.warn(`Unexpected number_format_type or unhandled path in single-level mode: ${number_format_type}. Line ${i+1} added as plain: ${original_line}`);
                    result_lines.push(processed_line_content_compacted);
                }
            }
            // 确保在处理完第一个非空行后设置此标志，无论它是否是特殊标题。
            if (!single_level_first_line_title_exception_applied_for_this_call) {
                single_level_first_line_title_exception_applied_for_this_call = true;
            }
        }
        console.log(`current_num_level1 (after): ${current_num_level1}`);
        console.log(`current_num_level2 (after): ${current_num_level2}`);
        console.groupEnd();
    }
    return result_lines.join('\n');
}