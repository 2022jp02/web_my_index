// main.js - 主应用逻辑和事件处理

// 全局 Toast 实例
let liveToast;

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded event fired. Main script execution started.");

    // 初始化 Bootstrap Toast
    const toastLiveExample = document.getElementById('liveToast');
    if (toastLiveExample) {
        liveToast = new bootstrap.Toast(toastLiveExample, {
            autohide: true,
            delay: 3000 // 3秒后自动隐藏
        });
        console.log("Toast initialized.");
    } else {
        console.warn("Toast element not found.");
    }

    // 初始化 Bootstrap Tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    console.log("Bootstrap tooltips initialized.");

    // 激活第一个标签页
    const firstTabButton = document.querySelector('#v-pills-tab button:first-child');
    if (firstTabButton) {
        firstTabButton.click();
        console.log("First tab activated successfully.");
    } else {
        console.warn("First tab button not found.");
    }

    // 设置快捷复制内容
    setupQuickCopyArea();
    console.log("Quick copy area rendered.");

    // 设置输入框的 placeholder 文本，根据功能类型来显示
    setupPlaceholderText();
    console.log("Placeholder text setup complete.");

    // 确保按钮可点击
    console.log("Initial setup complete. Buttons should be clickable now.");
});

// 显示 Toast 消息
function showToast(message) {
    const toastMessageElement = document.getElementById('toast-message');
    if (toastMessageElement) {
        toastMessageElement.innerHTML = `<strong>${message}</strong>`;
        if (liveToast) {
            liveToast.show();
            console.log("Toast 已尝试显示。");
        } else {
            console.warn("Toast 实例未初始化，无法显示消息。");
        }
    } else {
        console.warn("Toast message element not found.");
    }
}

// 显示关键词提醒模态框
function showKeywordAlertModal(message) {
    const modalBody = document.getElementById('keywordAlertModalBody');
    if (modalBody) {
        modalBody.innerHTML = message;
        const keywordAlertModal = new bootstrap.Modal(document.getElementById('keywordAlertModal'));
        keywordAlertModal.show();
    } else {
        console.warn("Keyword alert modal body not found.");
    }
}

// 清空输入框和输出框
function clearInput(type) {
    document.getElementById(`input_text_${type}`).value = '';
    document.getElementById(`output_text_${type}`).value = '';
    showToast('已清空。');
}

// 复制输出框内容
function copyOutput(type) {
    const outputTextarea = document.getElementById(`output_text_${type}`);
    outputTextarea.select();
    outputTextarea.setSelectionRange(0, 99999); // For mobile devices
    try {
        document.execCommand('copy');
        showToast('复制成功！');
    } catch (err) {
        console.error('复制失败: ', err);
        showToast('复制失败，请手动复制。');
    }
}

// 根据当前活跃的标签页设置输入框的 placeholder 文本
function setupPlaceholderText() {
    const tabButtons = document.querySelectorAll('#v-pills-tab button');
    tabButtons.forEach(button => {
        button.addEventListener('shown.bs.tab', function (event) {
            const targetId = this.dataset.bsTarget; // e.g., "#v-pills-level1"
            const placeholderText = this.dataset.placeholder || '';
            const inputId = targetId.replace('#v-pills-', 'input_text_');
            const placeholderElement = document.getElementById(inputId);
            if (placeholderElement && placeholderText) {
                placeholderElement.setAttribute('placeholder', placeholderText);
            }
        });
    });
}

// 统一处理文本的函数，根据功能ID调用不同的处理逻辑
function processText(type) {
    const inputTextarea = document.getElementById(`input_text_${type}`);
    const outputTextarea = document.getElementById(`output_text_${type}`);
    const inputText = inputTextarea.value.trim();

    if (!inputText) {
        showToast('请输入内容！');
        return;
    }

    let processedText = '';
    let hasKeywords = false; // 用于标记是否发现关键词

    try {
        switch (type) {
            case 'level1':
                processedText = convert_level1_numbers(inputText);
                break;
            case 'level2':
                processedText = convert_level2_numbers(inputText);
                break;
            case 'twolevel':
                processedText = convert_two_level_numbers(inputText);
                break;
            case 'delete':
                processedText = remove_all_numbers(inputText);
                break;
            case 'addbr':
                processedText = add_br_tags_at_sentence_endings(inputText);
                break;
            case 'smart':
                processedText = smart_process_text(inputText);
                // 智能处理后检查关键词
                hasKeywords = checkAndAlertKeywords(processedText);
                break;
            default:
                showToast('未知的功能类型。');
                return;
        }
        outputTextarea.value = processedText;
        showToast('处理成功！');

        // 如果不是智能处理，但在其他功能中，也可以选择检查关键词
        // 例如，如果所有转换都需要检查：
        // if (!hasKeywords && type !== 'smart') { // 避免重复检查或只在特定模式检查
        //     checkAndAlertKeywords(processedText);
        // }

    } catch (error) {
        console.error(`处理失败: ${error.message}`);
        showToast('处理失败，请检查输入格式或联系开发者。详情请查看控制台。');
    }
}

// 快捷复制功能填充
function setupQuickCopyArea() {
    const quickCopyArea = document.getElementById('quick_copy_area');
    if (!quickCopyArea) {
        console.warn("Quick copy area not found.");
        return;
    }

    quickCopyArea.innerHTML = ''; // Clear existing content

    PRESET_QUICK_COPY_TEXTS.forEach(text => {
        const div = document.createElement('div');
        div.className = 'quick-copy-item mb-2 p-2 border rounded d-flex justify-content-between align-items-center';
        
        const span = document.createElement('span');
        span.textContent = text;
        span.style.wordBreak = 'break-all'; // 防止文本过长溢出
        span.style.marginRight = '10px'; // 与按钮保持距离

        const button = document.createElement('button');
        button.className = 'btn btn-sm btn-outline-primary';
        button.textContent = '复制';
        button.onclick = function() {
            copyTextToClipboard(text);
            showToast('已复制：“' + text + '”');
        };

        div.appendChild(span);
        div.appendChild(button);
        quickCopyArea.appendChild(div);
    });
    console.log("Quick copy items setup complete.");
}

// 辅助函数：将文本复制到剪贴板
function copyTextToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
    document.body.removeChild(textarea);
}
