/*
 * script.js - 前端逻辑文件
 * 所有后端文本处理逻辑已迁移至此
 *
 * 核心修复点：
 * 1. 修复致命语法错误，解决"所有按钮无法点击"的问题。
 * 2. 彻底解决一级/二级/两级序号功能中，首行以冒号结尾的“标题行”不加序号并保留冒号的问题。
 * 3. 彻底解决所有带序号功能中，输入文本原有序号未被移除导致双重序号的问题。
 * 4. 再次全面加强所有功能中的空格清理，涵盖所有已知Unicode空白字符。
 * 5. 再次优化文本分段功能，确保一行内多序号分段的正确性，并保留原有序号。
 * 6. **重要：将关键字弹框提示功能改为Bootstrap模态对话框，并移至“复制”按钮点击时触发。**
 * 7. **调整智能处理功能逻辑，区分有无序号的处理方式，并新增英文标点转中文标点。**
 * 8. 扩展识别八种旧序号格式，确保正确移除，特别是“1．”中的全角点。
 * 9. 修正“加换行符”功能，使其只添加<br>标签，不处理序号。
 * 10. 恢复并调试“转换成功”、“复制成功”等Toast提示，并调整其显示位置和文本。
 * 11. **新增：年份（20XX年/年度）不再被误识别为序号，而是保留并正常添加新序号。**
 * 12. **移除“文本分段”功能。**
 */

document.addEventListener('DOMContentLoaded', function() {
    // 初始化第一个Tab为激活状态
    var firstTabEl = document.querySelector('#v-pills-tab button:first-child')
    var firstTab = new bootstrap.Tab(firstTabEl)
    firstTab.show()

    // 加载快捷复制文本
    renderQuickCopyArea(PRESET_QUICK_COPY_TEXTS);

    // 初始化PlaceholderText
    document.querySelectorAll('.placeholder-text').forEach(textarea => {
        const placeholder = textarea.getAttribute('placeholder');
        if (!textarea.value.trim()) {
            textarea.value = placeholder;
            textarea.classList.add('placeholder-active');
        }
        textarea.addEventListener('focus', () => {
            if (textarea.classList.contains('placeholder-active')) {
                textarea.value = '';
                textarea.classList.remove('placeholder-active');
            }
        });
        textarea.addEventListener('blur', () => {
            if (!textarea.value.trim()) {
                textarea.value = placeholder;
                textarea.classList.add('placeholder-active');
            }
        });
    });
});

// 显示 Toast 通知 (用于一般性短暂提示)
function showNotification(message) {
    console.log("尝试显示 Toast 通知:", message); // Debug: 确认函数被调用
    const toastLiveExample = document.getElementById('liveToast');
    if (!toastLiveExample) {
        console.error("错误：未找到 Toast 元素！请检查 index.html 中是否存在 id为 'liveToast' 的元素。"); // Debug: 元素是否找到
        return;
    }
    const toastMessageElement = document.getElementById('toast-message');
    if (!toastMessageElement) {
        console.error("错误：未找到 Toast 消息元素！请检查 index.html 中是否存在 id为 'toast-message' 的元素。"); // Debug: 消息元素是否找到
        return;
    }
    toastMessageElement.textContent = message;
    
    // 确保每次都创建一个新的 Toast 实例，并显示
    const toast = new bootstrap.Toast(toastLiveExample, {
        delay: 3000 // 延迟3秒自动隐藏
    });
    // 重置 Toast 状态，确保每次都能弹出
    toastLiveExample.classList.remove('hide', 'showing', 'show'); // 移除旧状态
    toastLiveExample.classList.add('fade'); // 添加淡入效果
    toast.show();
    console.log("Toast 已尝试显示。"); // Debug: 确认 show() 被调用
}

// 显示关键字提示模态对话框 (用于重要提示，需用户手动关闭)
function showKeywordAlertModal(message) {
    console.log("尝试显示关键字模态对话框。"); // Debug: 确认函数被调用
    const modalBody = document.getElementById('keywordAlertModalBody');
    if (modalBody) {
        modalBody.innerHTML = message; // 使用 innerHTML 允许消息中包含 HTML（如 <br>）
    } else {
        console.error("错误：未找到关键字模态对话框的 body 元素！请检查 index.html 中是否存在 id为 'keywordAlertModalBody' 的元素。");
        return;
    }
    const keywordAlertModal = new bootstrap.Modal(document.getElementById('keywordAlertModal'));
    keywordAlertModal.show();
    console.log("关键字模态对话框已尝试显示。"); // Debug: 确认 show() 被调用
}


// 清空输入和输出框
function clearInput(tabId) {
    const inputTextarea = document.getElementById(`input_text_${tabId}`);
    const outputTextarea = document.getElementById(`output_text_${tabId}`);

    inputTextarea.value = '';
    outputTextarea.value = '';

    // 重新设置 placeholder 样式
    const placeholder = inputTextarea.getAttribute('placeholder');
    inputTextarea.value = placeholder;
    inputTextarea.classList.add('placeholder-active');

    showNotification('已清空');
}

// 复制输出结果 - **关键字检查逻辑已移至此处**
function copyOutput(tabId) {
    const inputTextarea = document.getElementById(`input_text_${tabId}`); // 获取输入框
    const outputTextarea = document.getElementById(`output_text_${tabId}`); // 获取输出框
    let inputText = inputTextarea.value;

    // 如果输入框当前显示的是 placeholder 文本，则不进行关键字检查
    if (inputTextarea.classList.contains('placeholder-active')) {
        inputText = ''; 
    }

    // 在复制前检查原始输入文本是否含有关键字并给出提示
    if (inputText.trim() !== '') { // 只有当输入文本非空时才检查
        checkAndAlertKeywords(inputText);
    }
    
    // 执行复制操作
    if (outputTextarea.value.trim() === '') {
        showNotification('输出内容为空，无法复制。');
        return;
    }
    outputTextarea.select();
    outputTextarea.setSelectionRange(0, 99999); // For mobile devices

    try {
        document.execCommand('copy');
        showNotification('已复制到剪贴板！');
    } catch (err) {
        console.error('复制失败:', err);
        showNotification('复制失败，请手动复制。');
    } finally {
        // 取消选区，避免复制后文本仍高亮
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        } else if (document.selection) {
            document.selection.empty();
        }
    }
}

// 快捷复制相关功能
const PRESET_QUICK_COPY_TEXTS = [
    "符合条件的申报主体认定为XXX。",
    "符合条件的专家纳入专家库。",
    "按有关规定给予补助。",
    "申报主体应为",
    "申报主体需符合以下条件：",
    "申报主体需符合以下条件之一：",
    "详见相关文件《》。",
    "按要求提供。",
    "加盖公章。",
    "具体包含以下材料：",
    "（2025中央）",
    "（2025市级）",
    "（2025省级丨第X批）",
    "（2025市级丨第X批）",
    "〔〕"
];

function renderQuickCopyArea(texts) {
    const quickCopyArea = document.getElementById('quick_copy_area');
    quickCopyArea.innerHTML = ''; // 清空现有内容

    if (texts && texts.length > 0) {
        texts.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'd-flex justify-content-between align-items-center py-2';
            if (index < texts.length - 1) {
                div.style.borderBottom = '1px dashed #e9ecef';
            }

            const p = document.createElement('p');
            p.className = 'flex-grow-1 mb-0 text-break';
            p.textContent = item;
            p.style.whiteSpace = 'pre-wrap'; // 保持换行符

            const button = document.createElement('button');
            button.className = 'btn btn-outline-secondary btn-sm ms-3';
            button.textContent = '复制';
            button.onclick = () => {
                copyToClipboard(item);
            };

            div.appendChild(p);
            div.appendChild(button);
            quickCopyArea.appendChild(div);
        });
    } else {
        quickCopyArea.innerHTML = '<p class="text-muted text-center py-4">暂无快捷复制内容。</p>';
    }
}

function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showNotification('文本已复制！');
}

// ---- 文本处理辅助函数和常量 ----

// 全局定义更全面的空白字符集（用于字符类）
// 包含 \s (标准空白), 零宽度字符, 不间断空格, Ogham Space Mark, 各种em/thin空格, 数学空格等
const ALL_WHITESPACE_CHARS_SET = '\\s\\u200B\\u200C\\u200D\\uFEFF\\u00A0\\u1680\\u2000-\\u200A\\u202F\\u205F\\u3000'; 

// 定义匹配零个或多个这类空白字符的字符串（用于构建正则表达式）
const OPTIONAL_WHITESPACE_STR = `[${ALL_WHITESPACE_CHARS_SET}]*`;
// 定义匹配一个或多个这类空白字符的字符串（用于构建正则表达式）
const MANDATORY_WHITESPACE_STR = `[${ALL_WHITESPACE_CHARS_SET}]+`;

// 全局正则表达式：用于替换一个或多个空白字符为单个空格 (或在某些情况下彻底移除)
const WHITESPACE_TO_SINGLE_SPACE_REGEX = new RegExp(MANDATORY_WHITESPACE_STR, 'g');
const WHITESPACE_TO_REMOVE_REGEX_ALL = new RegExp(MANDATORY_WHITESPACE_STR, 'g'); // 别名，用于彻底移除所有空格


// 全局定义用于识别行首序号的基础正则表达式（无锚点，方便在Lookahead中使用）
// 匹配您提供的八种格式，以及其他常见序号
// 注意：此正则不再匹配明确的年份格式，年份由 LEADING_YEAR_PATTERN_REGEX 独立处理
const LEADING_NUMBER_PATTERN_BASE = '(?:' +
    '(?<!20\\d{2})\\d+[.\\uFF0E)）、]?|' + // 1. (半角或全角点) or 1) or 1、 or 1 (数字后跟点、括号或顿号，或仅数字), 排除20XX开头
    '[(\uFF08][\\d一二三四五六七八九十]{1,2}[)\uFF09]、?|' + // (1)、（1）、(一)、（一） and their versions with trailing 、
    '[\\u2460-\\u2473\\u24EB-\\u24F4]|' + // circled numbers ①②③
    '[a-zA-Z]\\.?|' + // a. or a
    '第\\s*\\d+\\s*条?' + // 第1条
')';
// 全局定义用于匹配行首序号的完整正则表达式（带行首锚点和可选空白），用于删除或判断
const LEADING_NUMBER_PATTERN_WITH_ANCHOR_REGEX = new RegExp(`^${OPTIONAL_WHITESPACE_STR}(${LEADING_NUMBER_PATTERN_BASE})${OPTIONAL_WHITESPACE_STR}`);

// 全局定义用于识别行首年份的正则表达式 (20XX年/年度)
const LEADING_YEAR_PATTERN_REGEX = new RegExp(`^${OPTIONAL_WHITESPACE_STR}(20\\d{2}[年年度])${OPTIONAL_WHITESPACE_STR}`);


// 辅助函数：标准化文本中的所有空白字符为单个空格，并移除首尾空格
function standardize_internal_whitespace_to_single(text) {
    if (!text) return '';
    return text.replace(WHITESPACE_TO_SINGLE_SPACE_REGEX, ' ').trim();
}

// 辅助函数：移除所有空白字符（包括各种Unicode空白和单词间的空格），使其紧密排列
function remove_all_internal_whitespace(text) {
    if (!text) return '';
    return text.replace(WHITESPACE_TO_REMOVE_REGEX_ALL, '').trim();
}

// 辅助函数：移除行开头可能存在的旧序号和多余空格，并标准化剩余内容中的空格为单个空格。
// 特殊处理年份，不移除年份。
function remove_leading_patterns_and_standardize_spaces_smart(line) {
    // 首先对整行进行初步的内部空格标准化和首尾去空
    let standardized_line = standardize_internal_whitespace_to_single(line);
    if (!standardized_line) return ''; // 如果是空行，直接返回空

    // 尝试匹配行首的年份模式
    const year_match = standardized_line.match(LEADING_YEAR_PATTERN_REGEX);
    if (year_match) {
        // 如果是年份行，保留年份部分，并处理年份后面的内容
        // year_match[1] 是捕获的年份字符串本身 (如 "2025年")
        // standardized_line.substring(year_match[0].length) 是年份及后面空白之后的所有内容
        let content_after_year = standardized_line.substring(year_match[0].length);
        // 对年份后面的内容进行内部空格标准化并去首尾空
        let processed_content_after_year = standardize_internal_whitespace_to_single(content_after_year);
        
        // 返回年份 + 单个空格 + 处理后的内容。如果处理后的内容为空，只返回年份。
        return `${year_match[1]}` + (processed_content_after_year ? ` ${processed_content_after_year}` : '');
    }

    // 如果不是年份行，则尝试移除其他类型的行首序号
    let cleaned_line = standardized_line.replace(LEADING_NUMBER_PATTERN_WITH_ANCHOR_REGEX, '');
    // 对剩余部分进行内部空格标准化和两端去空白
    return standardize_internal_whitespace_to_single(cleaned_line);
}

// 辅助函数：确保字符串以中文句号“。”结尾，并移除已存在的常见句末标点（包括冒号、分号）
function ensure_chinese_period(text) {
    text = text.trim();
    if (!text) return '';

    // 移除字符串末尾可能存在的任何英文或中文句末标点符号，包括冒号和分号
    // 匹配的标点符号：. , ; ! ? 。 ？ ！ ； ：
    text = text.replace(/[.,;!?。？！；：]$/, '');
    // 添加中文句号
    text += '。';
    return text;
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
        const alertMessage = "您提供的文本中<br>" + uniqueMessages.join("<br>") + "<br>，请留意做项目时是否需要修改。";
        showKeywordAlertModal(alertMessage); // 调用模态框显示
        return true; // 表示有关键字被发现
    }
    return false; // 没有关键字被发现
}

// ---- 英文标点符号转换为中文标点符号函数 ----
function replaceEnglishPunctuationToChinese(text) {
    // 1. 存储 URLs 和 Times，并用占位符替换
    const placeholders = {};
    let placeholderId = 0;

    // Pattern to match URLs and Times (e.g., 23:00, 10:30:45)
    // URLs: https?://\S+ | www\.\S+ | \b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[^\s]*)?\b (more general for www.example.com without http)
    // Times: \b\d{1,2}:\d{2}(?::\d{2})?\b (handles HH:MM or HH:MM:SS)
    const exempt_pattern = /(https?:\/\/[^\s]+|ftp:\/\/[^\s]+|www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?|\b\d{1,2}:\d{2}(?::\d{2})?\b)/gi; // Added ftp, made case-insensitive for URLs

    let text_with_placeholders = text.replace(exempt_pattern, (match) => {
        const id = `__EXEMPT_${placeholderId++}__`;
        placeholders[id] = match;
        return id;
    });

    // 2. 执行标点符号转换
    let converted_text = text_with_placeholders;

    // 直接替换的单字符标点
    converted_text = converted_text
        .replace(/\./g, '。') // Period
        .replace(/,/g, '，') // Comma
        .replace(/:/g, '：') // Colon
        .replace(/;/g, '；') // Semicolon
        .replace(/\?/g, '？') // Question mark
        .replace(/!/g, '！') // Exclamation mark
        .replace(/%/g, '％') // Percent
        .replace(/~/g, '～') // Tilde
        .replace(/\$/g, '＄') // Dollar
        .replace(/#/g, '＃') // Hash
        .replace(/@/g, '＠') // At
        .replace(/_/g, '＿') // Underscore
        .replace(/\^/g, '＾'); // Caret

    // 替换括号，使用用户示例的 〔〕
    converted_text = converted_text
        .replace(/\(/g, '（')
        .replace(/\)/g, '）')
        .replace(/\[/g, '〔')
        .replace(/\]/g, '〕')
        .replace(/\{/g, '｛')
        .replace(/\}/g, '｝');

    // 替换连字符和破折号
    converted_text = converted_text.replace(/---/g, '——'); // Triple hyphen to double em dash
    converted_text = converted_text.replace(/--/g, '——'); // Double hyphen to em dash
    converted_text = converted_text.replace(/-/g, '－'); // Single hyphen to full-width hyphen (if not part of a double hyphen)

    // 替换省略号
    converted_text = converted_text.replace(/\.{3,}/g, '…'); // Three or more dots to ellipsis

    // 替换引号 (交替匹配，适用于简单场景)
    // 注意：这种交替替换对于复杂嵌套引号或未闭合引号可能不完美
    let inDoubleQuote = false;
    converted_text = converted_text.replace(/"/g, () => {
        inDoubleQuote = !inDoubleQuote;
        return inDoubleQuote ? '“' : '”';
    });
    let inSingleQuote = false;
    converted_text = converted_text.replace(/'/g, () => {
        inSingleQuote = !inSingleQuote;
        return inSingleQuote ? '‘' : '’';
    });
    
    // 替换斜杠 (谨慎，因为URL中也有)
    // 确保URL中的 / 不被替换，但由于占位符机制，这里应该安全
    converted_text = converted_text.replace(/\//g, '／');

    // 3. 恢复占位符
    for (const id in placeholders) {
        converted_text = converted_text.replace(new RegExp(id, 'g'), placeholders[id]);
    }

    return converted_text;
}


// ---- 文本处理功能函数 ----

// 统一处理带序号列表的辅助函数
function process_numbered_list(text, number_format_type, is_two_level = false) {
    const lines = text.split('\n');
    const result_lines = [];
    let current_num_level1 = 1;
    let current_num_level2 = 1;
    let is_first_actual_content_line_processed = false; // 标记是否已经处理过第一个非空行 (无论是不是标题行)

    for (let line of lines) {
        let original_line_for_indent = line; // 保留原始行用于计算缩进
        // 对当前行进行初步的空格标准化
        let processed_line_content_standardized = standardize_internal_whitespace_to_single(line);

        if (!processed_line_content_standardized) {
            continue; // 跳过空行（标准化后仍为空的行）
        }

        // --- 首行特殊处理逻辑 (仅在第一次遇到非空行时执行) ---
        if (!is_first_actual_content_line_processed) {
            // 尝试移除该行可能带有的序号，得到一个“更纯净”的内容来判断是否为标题行
            // 这里使用 remove_leading_patterns_and_standardize_spaces_smart 来处理，它会保留年份
            let content_without_leading_num_for_check = remove_leading_patterns_and_standardize_spaces_smart(processed_line_content_standardized);
            
            // 判断原始行是否以可识别的序号开头 (不包括年份开头)
            let starts_with_recognizable_number_excluding_year = LEADING_NUMBER_PATTERN_WITH_ANCHOR_REGEX.test(processed_line_content_standardized) && !LEADING_YEAR_PATTERN_REGEX.test(processed_line_content_standardized);

            // 如果该行不以可识别的序号开头 (包括年份也不算)，并且其内容（去除潜在序号后）以中文冒号‘：’结尾且非空
            if (!starts_with_recognizable_number_excluding_year && !LEADING_YEAR_PATTERN_REGEX.test(processed_line_content_standardized) && content_without_leading_num_for_check.endsWith('：') && content_without_leading_num_for_check.length > 1) {
                // 这是一个符合条件的“标题行”：直接添加其标准化后的内容，保留冒号，不加新序号
                result_lines.push(processed_line_content_standardized);
                is_first_actual_content_line_processed = true; // 标记已处理第一个有内容的行
                continue; // 跳过此行的序号添加逻辑
            }
            is_first_actual_content_line_processed = true; // 如果不是标题行，也标记已检查，后续正常编号
        }

        // --- 正常编号逻辑 (适用于非标题行) ---
        // 使用新的智能函数来移除行开头可能存在的旧序号（但保留年份），并标准化内部空格
        let cleaned_content_for_numbering = remove_leading_patterns_and_standardize_spaces_smart(processed_line_content_standardized);
        // 确保行末有句号 (这里会处理掉冒号，因为这不是标题行)
        cleaned_content_for_numbering = ensure_chinese_period(cleaned_content_for_numbering);

        if (is_two_level) {
            const current_indent_match = original_line_for_indent.match(/^\s*/); // 使用原始行计算缩进
            const current_indent = current_indent_match ? current_indent_match[0].length : 0;

            if (current_indent === 0) { // 一级标题 (无缩进)
                result_lines.push(`（${current_num_level1}）${cleaned_content_for_numbering}`);
                current_num_level1 += 1;
                current_num_level2 = 1; // 重置二级序号
            } else { // 二级标题 (有缩进)
                const circled_num = current_num_level2 <= 20 ? String.fromCharCode(0x2460 + current_num_level2 - 1) : `[${current_num_level2}]`;
                result_lines.push(`${' '.repeat(current_indent)}${circled_num}${cleaned_content_for_numbering}`);
                current_num_level2 += 1;
            }
        } else { // 单级序号 (一级或二级)
            if (number_format_type === 'level1') {
                result_lines.push(`（${current_num_level1}）${cleaned_content_for_numbering}`);
                current_num_level1 += 1;
            } else if (number_format_type === 'level2') {
                const circled_num = current_num_level1 <= 20 ? String.fromCharCode(0x2460 + current_num_level1 - 1) : `[${current_num_level1}]`;
                result_lines.push(`${circled_num}${cleaned_content_for_numbering}`);
                current_num_level1 += 1;
            }
        }
    }
    return result_lines.join('\n');
}

// 一级序号转换：转换为（1）（2）…格式
function convert_level1_numbers(text) {
    return process_numbered_list(text, 'level1');
}

// 二级序号转换：转换为①②③…格式
function convert_level2_numbers(text) {
    return process_numbered_list(text, 'level2');
}

// 两级序号转换：一级（1）（2）...，二级①②...
function convert_two_level_numbers(text) {
    return process_numbered_list(text, 'twolevel', true);
}


// 删除序号：移除所有序号和行首空格，并确保每段之间空一行
function delete_numbers(text) {
    let lines = text.split('\n');
    const processed_lines = [];
    for (let line of lines) {
        // 对当前行进行初步的空格标准化
        let stripped_line = standardize_internal_whitespace_to_single(line);
        if (stripped_line) { // 只处理非空行
            // 移除序号和行首空格，并标准化内部空格 (使用智能移除函数，它会保留年份但仍移除其他序号)
            let cleaned_line = remove_leading_patterns_and_standardize_spaces_smart(stripped_line);
            processed_lines.push(cleaned_line);
        }
    }
    // 使用双换行符连接，以在每段之间创建空行
    return processed_lines.join('\n\n');
}

// 加换行符：在每句话末尾添加<br>标签，并保持原有行结构，不处理序号
function add_br_tags(text) {
    const lines = text.split('\n'); // 按照原始换行符分割
    const result_lines = [];
    for (let line of lines) {
        // 对当前行进行初步的空格标准化
        let stripped_line = standardize_internal_whitespace_to_single(line);
        if (stripped_line) { // 只处理非空行
            // 此功能不移除行首的序号或前缀，只确保句末有中文句号，然后追加 <br>
            // 注意：这里不能调用 remove_leading_patterns_and_standardize_spaces_smart，因为此功能不应移除序号或年份
            const processed_sentence = ensure_chinese_period(stripped_line); // 确保句末有句号
            result_lines.push(processed_sentence + '<br>');
        }
    }
    // 使用原始换行符连接结果，以保持每行之间的换行
    return result_lines.join('\n');
}


// 智能处理：根据文本特征自动清理和格式化 (已大幅修改)
function smart_process_text(text) {
    // 智能处理规则：
    // 1. 删除 <br> 标签。
    // 2. 将所有英文标点符号转换为中文标点符号（URL和时间中的除外）。
    // 3. 根据是否含有可识别的序号或年份前缀，执行不同逻辑：
    //    a) 含有序号或年份前缀：对全文进行彻底去空格和换行，并根据原有序号（或年份）和句末标点进行分段，保留原有序号/年份，每段独立一行，并确保句末有句号。
    //    b) 不含序号或年份前缀：对全文进行彻底去空格和换行，将所有内容合并为一行，不修改标点。

    // 0. 删除 <br> 标签
    text = text.replace(/<br\s*\/?>/gi, '');

    // 1. 将英文标点符号转换为中文标点符号 (URL和时间除外)
    text = replaceEnglishPunctuationToChinese(text);

    const original_lines = text.split('\n');
    // 检查原始文本中是否包含任何识别的序号或年份前缀
    const has_prefixes = original_lines.some(line => line.trim() && (LEADING_NUMBER_PATTERN_WITH_ANCHOR_REGEX.test(line) || LEADING_YEAR_PATTERN_REGEX.test(line)));

    if (has_prefixes) {
        // 场景 A: 输入文本含有序号或年份前缀
        // 目标：对全文进行彻底去空格和换行，并根据原有序号（或年份）进行分段，保留原有序号/年份，每段独立一行，确保句末有句号。
        
        // 1. 将所有非空行合并成一个字符串，并彻底去除所有空白（包括单词间的）
        let flattened_text_all_whitespace_removed = remove_all_internal_whitespace(
            original_lines.filter(line => line.trim()).map(line => line.trim()).join('')
        );

        // 2. 定义分段的正则表达式。
        // 分段点：在句号、问号、叹号、分号或冒号之后，如果紧跟着可选空白和一个序号模式（包括年份模式），则在此处分段。
        // 使用Lookbehind (?<=[。？！；：]) 确保标点留在前一个句子中。
        // 使用Lookahead (?=${OPTIONAL_WHITESPACE_STR}(?:${LEADING_NUMBER_PATTERN_BASE_NO_EXCLUSION}|20\\d{2}[年年度])) 确保序号/年份是分段的依据，但序号/年份本身不被分割掉。
        // 由于 LEADING_NUMBER_PATTERN_BASE_NO_EXCLUSION 包含了所有数字，所以简化一下
        const smart_segment_split_regex = new RegExp(
            `(?<=[。？！；：])${OPTIONAL_WHITESPACE_STR}(?=(?:\\d+[.\\uFF0E)）、]?|[(\uFF08][\\d一二三四五六七八九十]{1,2}[)\uFF09]、?|[\\u2460-\\u2473\\u24EB-\\u24F4]|[a-zA-Z]\\.?|第\\s*\\d+\\s*条?|20\\d{2}[年年度]))`, 'g'
        );
        let segments = flattened_text_all_whitespace_removed.split(smart_segment_split_regex);
        
        const result_segments = [];
        for (let segment of segments) {
            segment = segment.trim();
            if (segment) {
                // 确保每个分段以中文句号结尾
                result_segments.push(ensure_chinese_period(segment));
            }
        }
        return result_segments.join('\n'); // 最终用换行符连接，使每个分段独立成行
    } else {
        // 场景 B: 输入文本不含序号或年份前缀
        // 目标：对全文进行彻底去空格和换行，将所有内容合并为一行，不修改标点（因为标点转换已在上一步完成）。
        
        // 1. 将所有非空行合并成一个字符串，并彻底去除所有空白（包括单词间的）
        let full_text_single_line = original_lines.filter(line => line.trim()).map(line => line.trim()).join('');
        
        // 2. 再次确保彻底移除所有剩余的空白
        let final_text = remove_all_internal_whitespace(full_text_single_line);
        
        return final_text; // 输出为一行
    }
}


// 处理文本转换的通用函数 - **关键字检查逻辑已从此处移除，移至copyOutput**
function processText(tabId) {
    const inputTextarea = document.getElementById(`input_text_${tabId}`);
    const outputTextarea = document.getElementById(`output_text_${tabId}`);
    let inputText = inputTextarea.value;

    // 如果当前显示的是 placeholder 文本，则不提交
    if (inputTextarea.classList.contains('placeholder-active')) {
        inputText = ''; // 清空placeholder内容，避免处理
    }

    let result = '';
    try {
        switch (tabId) {
            case 'level1':
                result = convert_level1_numbers(inputText);
                break;
            case 'level2':
                result = convert_level2_numbers(inputText);
                break;
            case 'twolevel':
                result = convert_two_level_numbers(inputText);
                break;
            case 'delete':
                result = delete_numbers(inputText);
                break;
            case 'addbr':
                result = add_br_tags(inputText);
                break;
            // case 'segment': // "文本分段"功能已移除
            //     result = segment_text(inputText);
            //     break;
            case 'smart':
                result = smart_process_text(inputText);
                break;
            default:
                result = '未知功能。';
                showNotification(result);
                return;
        }
        outputTextarea.value = result;
        showNotification('转换成功！'); // 这里会显示转换成功的 Toast
    } catch (error) {
        console.error('处理失败:', error); // 打印详细错误信息到控制台
        showNotification('处理失败，请检查输入格式或联系开发者。');
    }
}
