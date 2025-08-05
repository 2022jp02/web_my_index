*script.js - 前端逻辑文件


console.log('Script file loading...'); // Debug: Script file is being parsed

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded event fired. Script execution started.'); // Debug: DOM ready

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
    console.log('Initial setup complete. Buttons should be clickable now.'); // Debug: Initial setup done
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
    console.log("关键字模态对话框已尝试显示。"); // Debug:确认 show() 被调用
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

// **NEW:** 粘贴文本到输入框
async function pasteInput(tabId) {
    const inputTextarea = document.getElementById(`input_text_${tabId}`);
    try {
        // 使用 navigator.clipboard.readText() 需要用户授予权限或在安全上下文 (https) 中运行
        const text = await navigator.clipboard.readText();
        inputTextarea.value = text;
        inputTextarea.classList.remove('placeholder-active'); // 移除placeholder样式
        showNotification('粘贴成功！');
    } catch (err) {
        console.error('粘贴失败:', err);
        // 如果是DOMException: NotAllowedError (用户未授权剪贴板读取)，或浏览器安全限制
        if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
             showNotification('粘贴失败：浏览器安全设置阻止了自动粘贴。请手动 Ctrl+V / Cmd+V 粘贴。');
        } else {
            showNotification('粘贴失败，请手动粘贴。');
        }
    }
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
const ALL_WHITESPACE_CHARS_SET = '\\s\\u200B\\u200C\\u200D\\uFEFF\\u00A0\\u1680\\u2000-\\u200A\\u202F\\u205F\\u3000'; 

// 定义匹配零个或多个这类空白字符的字符串（用于构建正则表达式）
const OPTIONAL_WHITESPACE_STR = `[${ALL_WHITESPACE_CHARS_SET}]*`;
// 定义匹配一个或多个这类空白字符的字符串（用于构建正则表达式）
const MANDATORY_WHITESPACE_STR = `[${ALL_WHITESPACE_CHARS_SET}]+`;

// 全局正则表达式：用于替换一个或多个空白字符为单个空格 (或在某些情况下彻底移除)
const WHITESPACE_TO_SINGLE_SPACE_REGEX = new RegExp(MANDATORY_WHITESPACE_STR, 'g');
const WHITESPACE_TO_REMOVE_REGEX_ALL = new RegExp(MANDATORY_WHITESPACE_STR, 'g');


// 全局定义用于识别行首序号的基础正则表达式（无锚点，方便在Lookahead中使用）
// 匹配您提供的八种格式，以及其他常见序号
// 注意：此正则不再匹配明确的年份格式，年份由 LEADING_YEAR_PATTERN_REGEX 独立处理
const LEADING_NUMBER_PATTERN_BASE = '(?:' +
    // (?!20\\d{2}[年年度]) 负向先行断言确保不是20XX年/年度开头的数字
    // \\d+[.\\uFF0E)））、]? 匹配数字后跟点、全角点、右括号、全角右括号、顿号
    '(?!20\\d{2}[年年度])\\d+[.\\uFF0E)））、]?|' + 
    '[一二三四五六七八九十]+、|' + // 识别“一、二、”这种中文数字带顿号的序号
    '[(\uFF08][\\d一二三四五六七八九十]{1,2}[)\uFF09]、?|' + // (1)、（1）、(一)、（一） and their versions with trailing 、
    '[\\u2460-\\u2473\\u24EB-\\u24F4]|' + // circled numbers ①②③
    '[a-zA-Z][.\\uFF0E)）]?|' + // a., A), (a) (simplified to match single letter with optional punctuation)
    '第\\s*\\d+\\s*条?' + // 第1条
')';
// 全局定义用于匹配行首序号的完整正则表达式（带行首锚点和可选空白），用于删除或判断
const LEADING_NUMBER_PATTERN_WITH_ANCHOR_REGEX = new RegExp(`^${OPTIONAL_WHITESPACE_STR}(${LEADING_NUMBER_PATTERN_BASE})${OPTIONAL_WHITESPACE_STR}`);

// 全局定义用于识别行首年份的正则表达式 (20XX年/年度)
const LEADING_YEAR_PATTERN_REGEX = new RegExp(`^${OPTIONAL_WHITESPACE_STR}(20\\d{2}[年年度])${OPTIONAL_WHITESPACE_STR}`);

// 定义用于两级序号智能识别的模式分类（用于判断当前行属于哪种"输入"模式）
// 这些模式用于帮助判断一行是否是“明确的一级”或“明确的二级”
const LEVEL1_CANDIDATE_PATTERNS = [
    /^\s*\d+[.\uFF0E]/, // 1. , 1．
    /^\s*[一二三四五六七八九十]+、/, // “一、二、”作为明确的一级序号候选
    /^\s*[(\uFF08][\d一二三四五六七八九十]{1,2}[)\uFF09]/, // (1), （1）, (一), （一）
    /^\s*[a-zA-Z][.\uFF0E]/, // A. , a.
    /^\s*第\s*\d+\s*条/ // 第1条
];

const LEVEL2_CANDIDATE_PATTERNS = [
    /^\s*\d+[)）]/, // 1) , 1）
    /^\s*[\u2460-\u2473\\u24EB-\\u24F4]/, // ①
    /^\s*[a-zA-Z][)）]/ // a) , a）
];


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
        // year_match[0].length 是匹配到的完整前缀长度，包括前导和尾随空白
        let content_after_year = standardize_internal_whitespace_to_single(standardized_line.substring(year_match[0].length));
        return `${year_match[1]}` + (content_after_year ? ` ${content_after_year}` : '');
    }

    // 如果不是年份行，则尝试移除其他类型的行首序号
    let cleaned_line = standardized_line.replace(LEADING_NUMBER_PATTERN_WITH_ANCHOR_REGEX, '');
    // 对剩余部分进行内部空格标准化和两端去空白
    return standardize_internal_whitespace_to_single(cleaned_line);
}

// 辅助函数：确保字符串以中文句号“。”结尾，并移除已存在的常见句末标点（包括分号）。
// 但如果原始文本以冒号“：”结尾，则保留冒号，不加句号。
// 此函数用于对“被赋予新序号”的行进行句末标准化。
function standardize_end_punctuation_for_numbered_items(text) {
    text = text.trim();
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
        const alertMessage = "您提供的文本中<br>" + uniqueMessages.join("<br>") + "<br>，请留意做项目时是否需要修改。";
        showKeywordAlertModal(alertMessage); // 调用模态框显示
        return true; // 表示有关键字被发现
    }
    return false; // 没有关键字被发现
}

// ---- 英文标点符号转换为中文标点符号函数 (已优化，防止URL/时间被破坏) ----
function replaceEnglishPunctuationToChinese(text) {
    // Pattern to match URLs and Times (exempt from conversion)
    const exempt_pattern = /(https?:\/\/[^\s]+|ftp:\/\/[^\s]+|www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?(?:[?#][^\s]*)?|\b\d{1,2}:\d{2}(?::\d{2})?\b)/gi;

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
            .replace(/\?/g, '？').replace(/!/g, '！').replace(/\(/g, '（').replace(/\)/g, '）')
            .replace(/\[/g, '〔').replace(/\]/g, '〕').replace(/\{/g, '｛').replace(/\}/g, '｝')
            .replace(/%/g, '％').replace(/~/g, '～').replace(/\$/g, '＄').replace(/#/g, '＃')
            .replace(/@/g, '＠').replace(/\//g, '／').replace(/\\/g, '＼')
            .replace(/\^/g, '＾').replace(/_/g, '＿').replace(/-/g, '－');
        
        result_parts.push(converted_segment);
    }

    return result_parts.join('');
}


// ---- 文本处理功能函数 ----

// 统一处理带序号列表的辅助函数
function process_numbered_list(text, number_format_type, is_two_level_requested = false) {
    const lines = text.split('\n');
    const result_lines = [];
    let current_num_level1 = 1;
    let current_num_level2 = 1;

    let current_processing_state = 'MAIN_LEVEL'; // 'MAIN_LEVEL' or 'SUB_LEVEL_MODE'

    // This flag is ONLY for single-level tabs (level1, level2) to handle the special first title line.
    // It's checked *per function call*.
    let single_level_first_line_title_exception_applied_for_this_call = false; 

    // --- Pre-scan for Two-Level determination (only if is_two_level_requested is true) ---
    // This part runs once at the beginning of the function call for two-level mode.
    let actual_two_level_conversion_needed = false; // Default to false, will be true only if two distinct types are found
    if (is_two_level_requested) {
        let found_l1_pattern_in_scan = false;
        let found_l2_pattern_in_scan = false;
        
        // Scan first 50 lines or all lines if fewer
        const scan_limit = Math.min(lines.length, 50); 
        for (let i = 0; i < scan_limit; i++) {
            const line_to_scan = lines[i];
            if (!line_to_scan.trim()) continue; 

            // Check for Level 1 candidate patterns
            if (LEVEL1_CANDIDATE_PATTERNS.some(p => p.test(line_to_scan))) {
                found_l1_pattern_in_scan = true;
            }
            // Check for Level 2 candidate patterns
            if (LEVEL2_CANDIDATE_PATTERNS.some(p => p.test(line_to_scan))) {
                found_l2_pattern_in_scan = true;
            }
            // If both types are found early, no need to scan further
            if (found_l1_pattern_in_scan && found_l2_pattern_in_scan) {
                actual_two_level_conversion_needed = true; // Both types found, proceed with two-level
                break;
            }
        }

        // Fallback logic for two-level requested mode:
        // If at the end of scan, we don't have both L1 and L2 pattern types, force single-level L1 format.
        if (!actual_two_level_conversion_needed) { // If two distinct types were NOT found
            number_format_type = 'level1'; // Force output to level 1 format for all lines
            console.log("Two-level requested, but two distinct L1/L2 patterns NOT found. Falling back to single-level (L1 format) for all lines."); // Debug
        }
        // If actual_two_level_conversion_needed remains true, it means both L1 and L2 patterns were detected, so proceed with complex two-level logic.
    }


    for (let i = 0; i < lines.length; i++) {
        const original_line = lines[i];
        let processed_line_content_standardized = standardize_internal_whitespace_to_single(original_line);

        if (!processed_line_content_standardized) {
            console.log(`Line ${i+1}: Empty or all whitespace, skipping.`); // Debug
            continue; 
        }

        const current_indent = original_line.match(/^\s*/)[0].length;
        const is_current_line_numbered_any_format = LEADING_NUMBER_PATTERN_WITH_ANCHOR_REGEX.test(original_line) || LEADING_YEAR_PATTERN_REGEX.test(original_line); 
        const ends_with_colon = processed_line_content_standardized.endsWith('：');
        
        console.groupCollapsed(`--- Processing Line ${i+1} ---`); // Group console logs
        console.log(`Original: "${original_line}"`);
        console.log(`Standardized: "${processed_line_content_standardized}"`);
        console.log(`Current Indent: ${current_indent}`);
        console.log(`Is numbered (any format, original line): ${is_current_line_numbered_any_format}`);
        console.log(`Ends with colon (standardized line): ${ends_with_colon}`);
        console.log(`single_level_first_line_title_exception_applied_for_this_call (before this line's processing): ${single_level_first_line_title_exception_applied_for_this_call}`);
        console.log(`current_processing_state (before): ${current_processing_state}`);
        console.log(`is_two_level_requested: ${is_two_level_requested}`);
        console.log(`actual_two_level_conversion_needed: ${actual_two_level_conversion_needed}`);
        console.log(`number_format_type for this call: ${number_format_type}`);

        let should_output_as_level1 = false;
        let should_output_as_level2 = false;
        let should_output_as_plain_text = false; // Flag for lines that should not be numbered (e.g., specific titles in single-level mode)

        // Content after removing old numbers/years. This is done early because we need it for title detection and for numbering.
        let cleaned_content_for_numbering = remove_leading_patterns_and_standardize_spaces_smart(processed_line_content_standardized);

        // --- Special "first line is title" check for SINGLE-LEVEL modes ONLY ---
        // This applies if it's the very first non-empty line of the *input* for single-level tabs (level1, level2).
        const is_this_line_a_single_level_title_exception = ends_with_colon && !is_current_line_numbered_any_format;
        if (!is_two_level_requested && !single_level_first_line_title_exception_applied_for_this_call && is_this_line_a_single_level_title_exception) {
            // This is a pure title line for single-level modes. Add it as is, preserve its colon, do NOT number it.
            result_lines.push(processed_line_content_standardized); 
            single_level_first_line_title_exception_applied_for_this_call = true; // Apply exception for this specific function call
            console.log(`Output as Single-Level Title Exception: "${processed_line_content_standardized}"`);
            console.groupEnd(); // End group for this line
            continue; // Skip all further processing for this special title line.
        }
        // Mark that the first line has now been processed (even if it wasn't a special title)
        // This ensures the exception check only happens once per function call.
        if (!single_level_first_line_title_exception_applied_for_this_call) {
            // This condition ensures that if it was not caught by the `is_this_line_a_single_level_title_exception`
            // then it means it's a regular first line for the single-level flow, which will be numbered below.
            single_level_first_line_title_exception_applied_for_this_call = true;
        }


        if (is_two_level_requested && actual_two_level_conversion_needed) { 
            // --- Complex Two-Level Logic (if two-level conversion is actually needed based on pre-scan) ---
            // Rule A: A numbered line ending with a colon is an L1 header, activates SUB_LEVEL_MODE
            if (is_current_line_numbered_any_format && ends_with_colon) { 
                should_output_as_level1 = true;
                current_processing_state = 'SUB_LEVEL_MODE'; 
            } 
            // Rule B: If in SUB_LEVEL_MODE and current line is numbered, it's an L2 item, UNLESS it's a clear new L1.
            else if (current_processing_state === 'SUB_LEVEL_MODE' && is_current_line_numbered_any_format) {
                // A clear new L1 is a LEVEL1_CANDIDATE_PATTERN at indent 0 (like '三、' or '(3)').
                const is_clear_new_L1_pattern = LEVEL1_CANDIDATE_PATTERNS.some(p => p.test(original_line)) && current_indent === 0;
                
                if (is_clear_new_L1_pattern) { 
                    should_output_as_level1 = true;
                    current_processing_state = 'MAIN_LEVEL'; // Exit sub-level mode
                } else {
                    should_output_as_level2 = true;
                }
            }
            // Rule C: If current line has a clear L1 pattern at indent 0 (not a colon-ending header).
            else if (LEVEL1_CANDIDATE_PATTERNS.some(p => p.test(original_line)) && current_indent === 0) {
                should_output_as_level1 = true;
                current_processing_state = 'MAIN_LEVEL'; 
            }
            // Rule D: If current line has a clear L2 pattern OR has significant indent (>0).
            else if (LEVEL2_CANDIDATE_PATTERNS.some(p => p.test(original_line)) || current_indent > 0) {
                should_output_as_level2 = true;
                current_processing_state = 'MAIN_LEVEL'; 
            }
            // Rule E: Fallback - If it's a numbered line but didn't fit (shouldn't happen often with comprehensive rules)
            else if (is_current_line_numbered_any_format) {
                should_output_as_level1 = true; // Default to L1 for unhandled numbered lines
                current_processing_state = 'MAIN_LEVEL'; 
            }
            // Rule F: If not numbered at all (in two-level mode with actual_two_level_conversion_needed) -> it should be L1.
            else {
                should_output_as_level1 = true; // Any non-numbered line in this mode gets L1
                current_processing_state = 'MAIN_LEVEL'; // Unnumbered lines break sub-section mode
            }

            // Apply numbering/formatting based on determined level
            if (should_output_as_level1) {
                const final_content = standardize_end_punctuation_for_numbered_items(cleaned_content_for_numbering); // Apply period, preserve colon if exists
                result_lines.push(`（${current_num_level1}）${final_content}`);
                current_num_level1 += 1;
                current_num_level2 = 1; 
                console.log(`Output as L1: (${current_num_level1-1}). Next L1: ${current_num_level1}. Next L2: ${current_num_level2}. State: ${current_processing_state}`);
            } else if (should_output_as_level2) {
                const circled_num = current_num_level2 <= 20 ? String.fromCharCode(0x2460 + current_num_level2 - 1) : `[${current_num_level2}]`;
                const indent_string = current_indent > 0 ? ' '.repeat(current_indent) : '  '; 
                const final_content = standardize_end_punctuation_for_numbered_items(cleaned_content_for_numbering);
                result_lines.push(`${indent_string}${circled_num}${final_content}`);
                current_num_level2 += 1;
                console.log(`Output as L2: ${circled_num}. Next L2: ${current_num_level2}. State: ${current_processing_state}`);
           } else {
                console.warn(`Unhandled logical path for line ${i+1} in two-level mode (actual_two_level_conversion_needed is true); this should not happen. Adding as plain text: ${original_line}`);
                result_lines.push(processed_line_content_standardized); // Fallback for safety
            }

        } else { // Single level numbering (either single-level tab OR two-level tab that fell back to single-level)
            // For these modes, all content lines (other than the special first title if applicable) should get a number.
            const final_content = standardize_end_punctuation_for_numbered_items(cleaned_content_for_numbering); // Apply period, preserve colon if exists
            
            if (number_format_type === 'level1') {
                result_lines.push(`（${current_num_level1}）${final_content}`);
                current_num_level1 += 1;
                console.log(`Output as single L1: (${current_num_level1-1}).`);
            } else if (number_format_type === 'level2') {
                const circled_num = current_num_level1 <= 20 ? String.fromCharCode(0x2460 + current_num_level1 - 1) : `[${current_num_level1}]`;
                result_lines.push(`${circled_num}${final_content}`);
                current_num_level1 += 1;
                console.log(`Output as single L2: ${circled_num}.`);
            } else {
                console.warn(`Unexpected number_format_type or unhandled path in single-level mode: ${number_format_type}. Line ${i+1} added as plain: ${original_line}`);
                result_lines.push(processed_line_content_standardized);
            }
        }
        console.groupEnd(); // End group for this line
    }
    return result_lines.join('\n');
}

// 一级序号转换：转换为（1）（2）…格式
function convert_level1_numbers(text) {
    return process_numbered_list(text, 'level1', false); // Not two-level requested
}

// 二级序号转换：转换为①②③…格式
function convert_level2_numbers(text) {
    return process_numbered_list(text, 'level2', false); // Not two-level requested
}

// 两级序号转换：一级（1）（2）...，二级①②...
function convert_two_level_numbers(text) {
    // Pass 'level1' as default number_format_type for fallback, and true for is_two_level_requested
    return process_numbered_list(text, 'level1', true); 
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
            let cleaned_line_content = remove_leading_patterns_and_standardize_spaces_smart(stripped_line);
            // 删除序号功能中，不需要句末加句号，也不需要保留冒号，所以直接移除所有常见标点
            // 保留原始冒号，仅移除句号、问号、叹号、分号，和英文对应的标点
            cleaned_line_content = cleaned_line_content.replace(/[.,;!?。？！；]/g, ''); 
            // 确保没有多余的空格在句末
            processed_lines.push(cleaned_line_content.trim());
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
            // 此功能不移除行首的序号或前缀，只确保句末有中文句号（或保持冒号），然后追加 <br>
            // 注意：这里不能调用 remove_leading_patterns_and_standardize_spaces_smart，因为此功能不应移除序号或年份
            const processed_sentence = standardize_end_punctuation_for_numbered_items(stripped_line); // 确保句末有句号
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
    // 检查处理后的文本中是否包含任何识别的序号或年份前缀
    const has_prefixes = original_lines.some(line => line.trim() && (LEADING_NUMBER_PATTERN_WITH_ANCHOR_REGEX.test(line) || LEADING_YEAR_PATTERN_REGEX.test(line)));

    if (has_prefixes) {
        // 场景 A: 输入文本含有序号或年份前缀
        // 目标：对全文进行彻底去空格和换行，并根据原有序号（或年份）和句末标点进行分段，保留原有序号/年份，每段独立一行，并确保句末有句号。
        
        // 1. 将所有非空行合并成一个字符串，并彻底去除所有空白（包括单词间的）
        let flattened_text_all_whitespace_removed = remove_all_internal_whitespace(
            original_lines.filter(line => line.trim()).map(line => line.trim()).join('')
        );

        // 2. 定义分段的正则表达式。
        // 分段点：在句号、问号、叹号、分号或冒号之后，如果紧跟着可选空白和一个序号模式（包括年份模式），则在此处分段。
        const smart_segment_split_regex = new RegExp(
            `(?<=[。？！；：])${OPTIONAL_WHITESPACE_STR}(?=${LEADING_NUMBER_PATTERN_BASE}|20\\d{2}[年年度])`, 'g'
        );

        let segments = flattened_text_all_whitespace_removed.split(smart_segment_split_regex);
        
        const result_segments = [];
        for (let segment of segments) {
            segment = segment.trim();
            if (segment) {
                // For smart processing, ensure numbered segments end with a period (unless it's a colon-ending title).
                // Non-numbered segments also attempt to end with a period.
                const is_segment_numbered = LEADING_NUMBER_PATTERN_WITH_ANCHOR_REGEX.test(segment) || LEADING_YEAR_PATTERN_REGEX.test(segment);
                if (is_segment_numbered || !/[。？！；：.]$/.test(segment)) { // If numbered, or if not ending with common punctuation
                    result_segments.push(standardize_end_punctuation_for_numbered_items(segment));
                } else {
                    result_segments.push(segment); // Already ends with punctuation, keep as is
                }
            }
        }
        return result_segments.join('\n'); // 最终用换行符连接，使每个分段独立成行
    } else {
        // 场景 B: 输入文本不含序号或年份前缀
        // 目标：对全文进行彻底去空格和换行，将所有内容合并为一行，不修改标点（因为标点转换已在上一步完成）。
        
        // 1. 将所有非空行合并成一个字符串，并彻底去除所有空白（包括单词间的）
        let full_text_single_line = remove_all_internal_whitespace(original_lines.filter(line => line.trim()).map(line => line.trim()).join(''));
        
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
