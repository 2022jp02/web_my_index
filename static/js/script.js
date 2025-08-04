/*
 * script.js - 前端逻辑文件
 * 所有后端文本处理逻辑已迁移至此
 * 已修复序号移除和标点符号问题
 * 已修复删除序号功能保留空行的问题
 * 已修复加换行符功能保持原有行结构的问题
 * 已修复文本分段功能在行内多个句子分段的问题，并保留原有序号
 * 已修复更彻底的全局空格清理问题
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

// ---- 文本处理功能函数 (从 app.py 移植到 JavaScript，并修复问题) ----

// 更全面的空白字符匹配，包括常见的 Unicode 空白
const WHITESPACE_REGEX = /[\s\uFEFF\xA0\u2000-\u200A\u202F\u205F\u3000]/g;

// 辅助函数：移除行开头可能存在的旧序号和多余空格
// 这个函数用于那些需要彻底移除旧序号的功能
function remove_leading_patterns(line) {
    // 匹配并移除以下模式：
    // 1. 数字序号，带括号或不带，带点或不带，后跟空格 (e.g., "1.", "(1)", "（1）", "1 ")
    // 2. 带圈数字序号，后跟空格 (e.g., "①", "② ")
    // 3. 字母序号，带点或不带，后跟空格 (e.g., "a.", "b ")
    // 4. "第X条" 形式的序号 (e.g., "第1条", "第 2 条")
    const pattern = new RegExp(`^${WHITESPACE_REGEX.source}*[\(\（]?\\d+[\)\）]?\\.?${WHITESPACE_REGEX.source}*|^${WHITESPACE_REGEX.source}*[\u2460-\u2473\u24EB-\u24F4]${WHITESPACE_REGEX.source}*|^${WHITESPACE_REGEX.source}*[a-zA-Z]\\.?${WHITESPACE_REGEX.source}*|^${WHITESPACE_REGEX.source}*第${WHITESPACE_REGEX.source}*\\d+${WHITESPACE_REGEX.source}*条?${WHITESPACE_REGEX.source}*`);
    return line.replace(pattern, '').replace(WHITESPACE_REGEX, ' ').trim(); // 替换所有空白为单个空格，然后trim
}

// 辅助函数：确保字符串以中文句号“。”结尾
function ensure_chinese_period(text) {
    text = text.trim();
    if (!text) return ''; // 如果是空字符串，直接返回空

    // 移除字符串末尾可能存在的任何英文或中文句末标点符号
    text = text.replace(/[.,;!?。？！；]$/, '');
    // 添加中文句号
    text += '。';
    return text;
}

// 辅助函数：标准化文本中的所有空白字符为单个空格，并移除首尾空格
// 此函数用于一般性的文本清理，不移除序号
function standardize_internal_whitespace(text) {
    return text.replace(WHITESPACE_REGEX, ' ').trim();
}


// 一级序号转换：转换为（1）（2）…格式
function convert_level1_numbers(text) {
    const lines = text.split('\n');
    const result_lines = [];
    let current_num = 1;
    for (let line of lines) {
        let stripped_line = standardize_internal_whitespace(line); // 先标准化空格
        if (stripped_line) {
            // 1. 移除行开头可能存在的旧序号和多余空格
            let cleaned_line = remove_leading_patterns(stripped_line);
            // 2. 确保行末有句号
            cleaned_line = ensure_chinese_period(cleaned_line);
            result_lines.push(`（${current_num}）${cleaned_line}`);
            current_num += 1;
        }
    }
    return result_lines.join('\n');
}

// 二级序号转换：转换为①②③…格式
function convert_level2_numbers(text) {
    const lines = text.split('\n');
    const result_lines = [];
    let current_num = 1;
    for (let line of lines) {
        let stripped_line = standardize_internal_whitespace(line); // 先标准化空格
        if (stripped_line) {
            // 1. 移除行开头可能存在的旧序号和多余空格
            let cleaned_line = remove_leading_patterns(stripped_line);
            // 2. 确保行末有句号
            cleaned_line = ensure_chinese_period(cleaned_line);

            // 3. 添加新的带圈数字序号
            const circled_num = current_num <= 20 ? String.fromCharCode(0x2460 + current_num - 1) : `[${current_num}]`; // Unicode 带圈数字
            result_lines.push(`${circled_num}${cleaned_line}`);
            current_num += 1;
        }
    }
    return result_lines.join('\n');
}

// 两级序号转换：一级（1）（2）...，二级①②...
function convert_two_level_numbers(text) {
    const lines = text.split('\n');
    const result_lines = [];
    let level1_num = 1;
    let level2_num = 1;
    let last_indent = 0; // 用于判断缩进级别

    for (let line of lines) {
        let standardized_line = standardize_internal_whitespace(line); // 先标准化空格
        const current_indent_match = line.match(/^\s*/); // 匹配原始行的缩进
        const current_indent = current_indent_match ? current_indent_match[0].length : 0;
        const stripped_line_for_content = standardized_line; // 已经标准化过空格的行

        if (!stripped_line_for_content) {
            continue;
        }

        // 移除行开头可能存在的旧序号和多余空格，以获取纯净内容用于序号添加
        let cleaned_content = remove_leading_patterns(stripped_line_for_content);
        // 确保行末有句号
        cleaned_content = ensure_chinese_period(cleaned_content);

        if (current_indent === 0) { // 一级标题 (无缩进)
            result_lines.push(`（${level1_num}）${cleaned_content}`);
            level1_num += 1;
            level2_num = 1; // 重置二级序号
        } else if (current_indent > last_indent) { // 二级标题 (比上一行缩进更深)
            const circled_num = level2_num <= 20 ? String.fromCharCode(0x2460 + level2_num - 1) : `[${level2_num}]`;
            result_lines.push(`${' '.repeat(current_indent)}${circled_num}${cleaned_content}`);
            level2_num += 1;
        } else { // 同级或回退 (如果缩进相同或减少，但不是0，则认为是二级序号)
            const circled_num = level2_num <= 20 ? String.fromCharCode(0x2460 + level2_num - 1) : `[${level2_num}]`;
            result_lines.push(`${' '.repeat(current_indent)}${circled_num}${cleaned_content}`);
            level2_num += 1;
        }
        last_indent = current_indent; // 更新上一次的缩进值
    }
    return result_lines.join('\n');
}

// 删除序号：移除所有序号和行首空格，并确保每段之间空一行
function delete_numbers(text) {
    let lines = text.split('\n');
    const processed_lines = [];
    for (let line of lines) {
        let stripped_line = standardize_internal_whitespace(line); // 先标准化空格
        if (stripped_line) { // 只处理非空行
            let cleaned_line = remove_leading_patterns(stripped_line);
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
        let stripped_line = standardize_internal_whitespace(line); // 先标准化空格
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
    // 1. 先将所有换行符替换为空格，并彻底标准化所有空白字符为单个空格
    let cleaned_text = text.replace(/[\n\r]+/g, ' ').replace(WHITESPACE_REGEX, ' ').trim();

    if (!cleaned_text) {
        return '';
    }

    // 2. 定义用于识别序号的正则表达式（与remove_leading_patterns中的模式相同，但这里用于匹配而非替换）
    const leading_number_pattern_for_split = /[\(\（]?\d+[\)\）]?\.?|[\u2460-\u2473\u24EB-\u24F4]|[a-zA-Z]\.?|第\s*\d+\s*条?/;

    // 3. 定义分段的正则表达式：在句号、问号、叹号、分号之后，如果紧跟着一个序号模式，则在此处分段
    // 使用lookbehind确保标点留在前一个句子中
    // 使用lookahead确保序号模式是分段的依据，但序号本身不被分割掉
    const segment_split_regex = new RegExp(`(?<=[。？！；])${WHITESPACE_REGEX.source}*(?=${leading_number_pattern_for_split.source})`, 'g');

    let segments = cleaned_text.split(segment_split_regex);
    const result_segments = [];

    for (let segment of segments) {
        segment = segment.trim();
        if (segment) {
            // 对于每个分段，确保其以中文句号结尾
            result_segments.push(ensure_chinese_period(segment));
        }
    }
    return result_segments.join('\n');
}


// 智能处理：根据文本特征自动清理和格式化
function smart_process_text(text) {
    const lines = text.split('\n');
    const processed_lines = [];

    // 检查文本中是否包含任何识别的序号或前缀
    const leading_number_pattern_test = new RegExp(`^${WHITESPACE_REGEX.source}*[\(\（]?\\d+[\)\）]?\\.?${WHITESPACE_REGEX.source}*|^${WHITESPACE_REGEX.source}*[\u2460-\u2473\u24EB-\u24F4]${WHITESPACE_REGEX.source}*|^${WHITESPACE_REGEX.source}*[a-zA-Z]\\.?${WHITESPACE_REGEX.source}*|^${WHITESPACE_REGEX.source}*第${WHITESPACE_REGEX.source}*\\d+${WHITESPACE_REGEX.source}*条?${WHITESPACE_REGEX.source}*`);
    const has_prefixes = lines.some(line => line.trim() && leading_number_pattern_test.test(line));

    if (has_prefixes) {
        // 包含序号：逐行处理，移除旧序号，添加标准化的（1）（2）…序号，并统一句末句号
        let current_num = 1;
        for (let line of lines) {
            // 统一行内空白，并移除行首尾空白
            let cleaned_line_for_processing = line.replace(WHITESPACE_REGEX, ' ').trim(); 
            if (!cleaned_line_for_processing) {
                continue;
            }
            // 1. 移除行开头可能存在的旧序号和多余空格
            let cleaned_content = remove_leading_patterns(cleaned_line_for_processing); 
            // 2. 添加新的（N）序号
            let standardized_line = `（${current_num}）${cleaned_content}`;
            // 3. 确保行末是中文句号
            standardized_line = ensure_chinese_period(standardized_line);
            processed_lines.push(standardized_line);
            current_num += 1;
        }
    } else {
        // 不包含序号：将所有内容视为一个连续段落，全局去除非必要空格，按句子分割，并统一句末句号
        // 1. 将所有非空行合并成一个字符串，并去除所有空白
        let full_text = lines.filter(line => line.trim()).map(line => line.trim()).join(''); // 合并时直接不留空格
        // 2. 移除字符串中所有剩余的空白字符（包括各种Unicode空白），使其紧密排列
        full_text = full_text.replace(WHITESPACE_REGEX, '').trim(); 

        // 3. 按中文句号、问号、叹号、分号分割句子，并保留分隔符
        // 这里只是为了将文本按照中文句末标点拆分，以便每个“句子”都能被 ensure_chinese_period 处理
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


// 处理文本转换的通用函数 (现在直接调用本地JS函数，不再发送网络请求)
function processText(tabId) {
    const inputTextarea = document.getElementById(`input_text_${tabId}`);
    const outputTextarea = document.getElementById(`output_text_${tabId}`);
    let inputText = inputTextarea.value;

    // 如果当前显示的是 placeholder 文本，则不提交
    if (inputTextarea.classList.contains('placeholder-active')) {
        inputText = ''; // 清空placeholder内容，避免处理
    }

    let result = '';
    let success = true;
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
                success = false;
                break;
        }
        if (success) {
            outputTextarea.value = result;
            showNotification('转换成功！');
        } else {
            showNotification(result); // 显示未知功能提示
        }
    } catch (error) {
        console.error('处理失败:', error);
        showNotification('处理失败，请检查输入格式。');
        success = false;
    }
}
