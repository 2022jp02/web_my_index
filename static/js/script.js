/*
 * script.js - 前端逻辑文件
 * 所有后端文本处理逻辑已迁移至此
 *
 * 核心修复点：
 * 1. 彻底解决一级/二级/两级序号功能中，首行以冒号结尾的“标题行”不加序号并保留冒号的问题。
 * 2. 彻底解决所有带序号功能中，输入文本原有序号未被移除导致双重序号的问题。
 * 3. 再次全面加强所有功能中的空格清理，涵盖所有已知Unicode空白字符。
 * 4. 再次优化文本分段功能，确保一行内多序号分段的正确性，并保留原有序号。
 * 5. 确保各功能函数间文本预处理（空格标准化）逻辑的一致性和精确性。
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

// 显示 Toast 通知
function showNotification(message) {
    const toastLiveExample = document.getElementById('liveToast');
    const toastMessageElement = document.getElementById('toast-message');
    toastMessageElement.textContent = message;
    const toast = new bootstrap.Toast(toastLiveExample);
    toast.show();
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

// 复制输出结果
function copyOutput(tabId) {
    const outputTextarea = document.getElementById(`output_text_${tabId}`);
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

// ---- 文本处理功能函数 ----

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
// 匹配: 1., (1), （1）, ①, a., 第1条
const LEADING_NUMBER_PATTERN_BASE = '[\(\（]?\\d+[\\)\）]?\\.?|[\\u2460-\\u2473\\u24EB-\\u24F4]|[a-zA-Z]\\.?|第\\s*\\d+\\s*条?';
// 全局定义用于匹配行首序号的完整正则表达式（带行首锚点和可选空白），用于删除或判断
const LEADING_NUMBER_PATTERN_WITH_ANCHOR_REGEX = new RegExp(`^${OPTIONAL_WHITESPACE_STR}(${LEADING_NUMBER_PATTERN_BASE})${OPTIONAL_WHITESPACE_STR}`);


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

// 辅助函数：移除行开头可能存在的旧序号和多余空格，并标准化剩余内容中的空格为单个空格
function remove_leading_patterns_and_standardize_spaces(line) {
    // 移除行开头的模式，并替换掉匹配到的部分
    // 注意：这里使用replace而非replaceall，因为我们只关心行首的第一个匹配
    let cleaned_line = line.replace(LEADING_NUMBER_PATTERN_WITH_ANCHOR_REGEX, '');
    // 对剩余部分进行内部空格标准化和两端去空白
    return standardize_internal_whitespace_to_single(cleaned_line);
}

// 辅助函数：确保字符串以中文句号“。”结尾，并移除已存在的常见句末标点（包括冒号、分号）
function ensure_chinese_period(text) {
    text = text.trim();
    if (!text) return '';

    // 移除字符串末尾可能存在的任何英文或中文句末标点符号，包括冒号和分号
    text = text.replace(/[.,;!?。？！；：]$/, '');
    // 添加中文句号
    text += '。';
    return text;
}


// 统一处理带序号列表的辅助函数
function process_numbered_list(text, number_format_type, is_two_level = false) {
    const lines = text.split('\n');
    const result_lines = [];
    let current_num_level1 = 1;
    let current_num_level2 = 1;
    let last_indent = 0; // 用于两级序号
    let is_first_actual_content_line_checked = false; // 标记是否已经检查过第一个非空行是否为标题行

    for (let line of lines) {
        let original_line_for_indent = line; // 保留原始行用于计算缩进
        // 对当前行进行初步的空格标准化
        let processed_line_content_standardized = standardize_internal_whitespace_to_single(line);

        if (!processed_line_content_standardized) {
            continue; // 跳过空行（标准化后仍为空的行）
        }

        // --- 首行特殊处理逻辑 (仅在第一次遇到非空行时执行) ---
        if (!is_first_actual_content_line_checked) {
            // 先尝试移除该行可能带有的（如“（1）”）序号，得到一个“更纯净”的内容来判断是否为标题行
            let content_without_leading_num_for_check = remove_leading_patterns_and_standardize_spaces(processed_line_content_standardized);
            
            // 如果这个“更纯净”的内容以中文冒号‘：’结尾（且长度大于1，避免只有冒号的空行），
            // 并且原始行（或其标准化版本）不以可识别的序号开头 (避免把1.标题：当成标题行)
            // 注意：这里需要检查原始行是否以序号开头，以区分“联系方式：”和“1.标题：”
            let starts_with_recognizable_number = LEADING_NUMBER_PATTERN_WITH_ANCHOR_REGEX.test(processed_line_content_standardized);

            if (!starts_with_recognizable_number && content_without_leading_num_for_check.endsWith('：') && content_without_leading_num_for_check.length > 1) {
                // 这是一个符合条件的“标题行”
                result_lines.push(processed_line_content_standardized); // 直接添加，保留原有冒号，不加新序号
                is_first_actual_content_line_checked = true; // 标记已处理第一个有内容的行
                continue; // 跳过此行的序号添加逻辑
            }
            is_first_actual_content_line_checked = true; // 如果不是标题行，也标记已检查，后续正常编号
        }

        // --- 正常编号逻辑 (适用于非标题行或首行非标题行) ---
        // 移除行开头可能存在的旧序号和多余空格，并标准化内部空格
        let cleaned_content_for_numbering = remove_leading_patterns_and_standardize_spaces(processed_line_content_standardized);
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
            last_indent = current_indent; // 更新上一次的缩进值
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
            // 移除序号和行首空格，并标准化内部空格
            let cleaned_line = remove_leading_patterns_and_standardize_spaces(stripped_line);
            processed_lines.push(cleaned_line);
        }
    }
    // 使用双换行符连接，以在每段之间创建空行
    return processed_lines.join('\n\n');
}

// 加换行符：在每句话末尾添加<br>标签，并保持原有行结构
function add_br_tags(text) {
    const lines = text.split('\n'); // 按照原始换行符分割
    const result_lines = [];
    for (let line of lines) {
        // 对当前行进行初步的空格标准化
        let stripped_line = standardize_internal_whitespace_to_single(line);
        if (stripped_line) { // 只处理非空行
            // 确保句末有中文句号，然后追加 <br>
            // 此功能不移除行首的序号或前缀，因为用户示例中要求保留原始行结构和内容
            const processed_sentence = ensure_chinese_period(stripped_line);
            result_lines.push(processed_sentence + '<br>');
        }
    }
    // 使用原始换行符连接结果，以保持每行之间的换行
    return result_lines.join('\n');
}


// 文本分段：根据句末标点和/或序号模式分段，并保留原始序号
function segment_text(text) {
    // 1. 将所有换行符替换为单个空格，并彻底标准化所有空白字符为单个空格
    // 这一步是为了将所有文本视为一个长字符串，以便进行基于正则表达式的精确分段
    let cleaned_text_for_segmenting = text.replace(/[\n\r]+/g, ' ').replace(WHITESPACE_TO_SINGLE_SPACE_REGEX, ' ').trim();

    if (!cleaned_text_for_segmenting) {
        return '';
    }

    // 2. 定义分段的正则表达式：
    // 在句号、问号、叹号、分号或冒号之后，如果紧跟着可选空白和一个序号模式，则在此处分段。
    // 使用Lookbehind (?<=[。？！；：]) 确保标点留在前一个句子中。
    // 使用Lookahead (?=${OPTIONAL_WHITESPACE_STR}${LEADING_NUMBER_PATTERN_BASE}) 确保序号模式是分段的依据，但序号本身不被分割掉。
    const segment_split_regex = new RegExp(
        `(?<=[。？！；：])${OPTIONAL_WHITESPACE_STR}(?=${LEADING_NUMBER_PATTERN_BASE})`, 'g'
    );

    let segments = cleaned_text_for_segmenting.split(segment_split_regex);
    const result_segments = [];

    for (let segment of segments) {
        // 对每个分段再次进行空格标准化，以防 split 产生额外的空白
        segment = standardize_internal_whitespace_to_single(segment); 
        if (segment) {
            // 对于每个分段，确保其以中文句号结尾
            result_segments.push(ensure_chinese_period(segment));
        }
    }
    // 使用 \n 连接，使每个分段独立成行
    return result_segments.join('\n');
}


// 智能处理：根据文本特征自动清理和格式化
function smart_process_text(text) {
    const lines = text.split('\n');
    const processed_lines = [];

    // 检查文本中是否包含任何识别的序号或前缀
    const has_prefixes = lines.some(line => line.trim() && LEADING_NUMBER_PATTERN_WITH_ANCHOR_REGEX.test(line));

    if (has_prefixes) {
        // 包含序号：逐行处理，移除旧序号，添加标准化的（1）（2）…序号，并统一句末句号
        let current_num = 1;
        for (let line of lines) {
            // 先对输入行进行初步的空格标准化
            let cleaned_line_for_processing = standardize_internal_whitespace_to_single(line);
            if (!cleaned_line_for_processing) {
                continue;
            }
            // 1. 移除行开头可能存在的旧序号和多余空格，并标准化内部空格
            let cleaned_content = remove_leading_patterns_and_standardize_spaces(cleaned_line_for_processing); 
            // 2. 添加新的（N）序号
            let standardized_line = `（${current_num}）${cleaned_content}`;
            // 3. 确保行末是中文句号
            standardized_line = ensure_chinese_period(standardized_line);
            processed_lines.push(standardized_line);
            current_num += 1;
        }
    } else {
        // 不包含序号：将所有内容视为一个连续段落，全局去除非必要空格（彻底移除），按句子分割，并统一句末句号
        // 1. 将所有非空行合并成一个字符串，并彻底去除所有空白（包括单词间的）
        let full_text = lines.filter(line => line.trim()).map(line => line.trim()).join(''); // 合并时直接不留空格
        full_text = remove_all_internal_whitespace(full_text); // 再次确保彻底移除所有空白

        // 2. 按中文句号、问号、叹号、分号分割句子，并保留分隔符
        const sentences = full_text.split(/(?<=[。？！；])/g);

        for (let sentence of sentences) {
            sentence = sentence.trim();
            if (sentence) {
                // 确保每句话以中文句号结尾
                sentence = ensure_chinese_period(sentence);
                processed_lines.push(sentence);
            }
        }
    }
    return processed_lines.join('\n');
}


// 处理文本转换的通用函数
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
            case 'segment':
                result = segment_text(inputText);
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
        showNotification('转换成功！');
    } catch (error) {
        console.error('处理失败:', error); // 打印详细错误信息到控制台
        showNotification('处理失败，请检查输入格式或联系开发者。');
    }
}
