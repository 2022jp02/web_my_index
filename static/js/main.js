// main.js - 主应用逻辑和入口文件

console.log('Main script file loading...'); // Debug: Main script file is being parsed

// Global variables for GIF display, initialized here for clarity
let gifDisplayContainer = null;
let gifDisplayImage = null;
let currentTooltipInstance = null; // To store the currently active tooltip instance

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded event fired. Main script execution started.'); // Debug: DOM ready

    try {
        // 关键检查：确保 Bootstrap JavaScript 已经加载并可用
        if (typeof bootstrap === 'undefined' || typeof bootstrap.Tab === 'undefined' || typeof bootstrap.Toast === 'undefined' || typeof bootstrap.Modal === 'undefined') {
            console.error("错误：Bootstrap JavaScript 未加载或初始化成功。请检查 './static/js/bootstrap.bundle.min.js' 路径是否正确且文件未损坏。");
            showNotification("初始化失败：核心组件缺失。请检查浏览器控制台（F12）获取详情。");
            return; // 如果 Bootstrap 未正确加载，则停止进一步的脚本执行
        }
        
        // 初始化第一个Tab为激活状态
        var firstTabEl = document.querySelector('#v-pills-tab button:first-child')
        if (firstTabEl) {
            var firstTab = new bootstrap.Tab(firstTabEl)
            firstTab.show()
            console.log('First tab activated successfully.');
        } else {
            console.warn('警告：未找到第一个导航Tab按钮，可能导致页面初始化异常。');
        }

        // 初始化所有 Bootstrap Tooltip
        // 这会找到所有带有 data-bs-toggle="tooltip" 属性的元素，并为其初始化 tooltip
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        tooltipTriggerList.map(function (tooltipTriggerEl) {
          return new bootstrap.Tooltip(tooltipTriggerEl)
        })
        console.log('Bootstrap tooltips initialized.');

        // Initialize GIF display elements
        gifDisplayContainer = document.getElementById('gif-display-container');
        gifDisplayImage = document.getElementById('gif-display-image');

        // Add event listeners for GIF triggers
        // 这会找到所有带有 .gif-trigger 类的元素，并为其添加鼠标事件
        document.querySelectorAll('.gif-trigger').forEach(triggerEl => {
            triggerEl.addEventListener('mouseenter', handleGifMouseEnter);
            triggerEl.addEventListener('mouseleave', handleGifMouseLeave);
        });
        console.log('GIF triggers setup complete.');

        // 加载快捷复制文本
        renderQuickCopyArea(PRESET_QUICK_COPY_TEXTS); // PRESET_QUICK_COPY_TEXTS 来自 constants.js
        console.log('Quick copy area rendered.');

        // 初始化PlaceholderText
        document.querySelectorAll('.placeholder-text').forEach(textarea => {
            const placeholder = textarea.getAttribute('placeholder');
            // 只有当文本框为空时才设置placeholder样式和值
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
        console.log('Placeholder text setup complete.');
        console.log('Initial setup complete. Buttons should be clickable now.'); // Debug: Initial setup done

    } catch (e) {
        // 捕获 DOMContentLoaded 内部的任何错误
        console.error("JavaScript初始化过程中发生未捕获的错误：", e);
        showNotification("页面初始化检测到问题，请查看浏览器控制台（F12）获取详情。");
    }
});

// Event handler for mouse entering GIF trigger
function handleGifMouseEnter(event) {
    const triggerEl = event.currentTarget;
    const gifSrc = triggerEl.dataset.gifSrc;

    if (gifSrc && gifDisplayContainer && gifDisplayImage) {
        // Hide the tooltip temporarily if it's active for this element
        const tooltipInstance = bootstrap.Tooltip.getInstance(triggerEl);
        if (tooltipInstance && tooltipInstance._isShown()) {
            tooltipInstance.hide();
            currentTooltipInstance = tooltipInstance; // Store reference to hide it
        } else {
            currentTooltipInstance = null;
        }

        gifDisplayImage.src = gifSrc;
        gifDisplayContainer.style.display = 'block'; // Make it visible initially (opacity 0)
        gifDisplayContainer.classList.add('show-gif'); // Trigger fade-in

        // Position the GIF container
        // Get the bounding rectangle of the trigger element
        const rect = triggerEl.getBoundingClientRect();
        
        // Calculate desired position (e.g., to the right and slightly below the trigger)
        // Adjust these values as needed for optimal placement
        let posX = rect.right + 10; // 10px to the right of the trigger
        let posY = rect.top;       // Aligned with the top of the trigger

        // Adjust position to keep GIF within viewport
        // Check if GIF would go off screen to the right
        if (posX + gifDisplayContainer.offsetWidth > window.innerWidth) {
            posX = rect.left - gifDisplayContainer.offsetWidth - 10; // To the left
        }
        // Check if GIF would go off screen to the bottom
        if (posY + gifDisplayContainer.offsetHeight > window.innerHeight) {
            posY = window.innerHeight - gifDisplayContainer.offsetHeight - 10; // Align with bottom
        }
        // Ensure it doesn't go off screen to the top
        if (posY < 0) {
            posY = 10; // 10px from top
        }

        gifDisplayContainer.style.left = `${posX}px`;
        gifDisplayContainer.style.top = `${posY}px`;
    }
}

// Event handler for mouse leaving GIF trigger
function handleGifMouseLeave() {
    if (gifDisplayContainer) {
        gifDisplayContainer.classList.remove('show-gif'); // Trigger fade-out
        // Wait for transition to complete before hiding completely
        setTimeout(() => {
            gifDisplayContainer.style.display = 'none';
            gifDisplayImage.src = ''; // Clear src to stop playback and free memory
        }, 200); // Match CSS transition duration

        // Show the tooltip again if it was hidden
        if (currentTooltipInstance) {
            currentTooltipInstance.show();
            currentTooltipInstance = null;
        }
    }
}


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
    // 销毁旧实例并创建新实例，以确保每次都能显示
    const existingToast = bootstrap.Toast.getInstance(toastLiveExample);
    if (existingToast) {
        existingToast.dispose();
    }

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
    // 确保每次都创建一个新的 Modal 实例
    const keywordAlertModalElement = document.getElementById('keywordAlertModal');
    const keywordAlertModal = new bootstrap.Modal(keywordAlertModalElement);
    keywordAlertModal.show();
    console.log("关键字模态对话框已尝试显示。"); // Debug:确认 show() 被调用
}


// 清空输入和输出框
function clearInput(tabId) {
    const inputTextarea = document.getElementById(`input_text_${tabId}`);
    const outputTextarea = document.getElementById(`output_text_${tabId}`);

    if (inputTextarea) {
        inputTextarea.value = '';
        // 重新设置 placeholder 样式
        const placeholder = inputTextarea.getAttribute('placeholder');
        inputTextarea.value = placeholder;
        inputTextarea.classList.add('placeholder-active');
    } else {
        console.warn(`清空操作：未找到 id 为 input_text_${tabId} 的输入框`);
    }

    if (outputTextarea) {
        outputTextarea.value = '';
    } else {
        console.warn(`清空操作：未找到 id 为 output_text_${tabId} 的输出框`);
    }

    showNotification('已清空');
}

// 粘贴文本到输入框 (此功能未在index.html中使用，但保留)
async function pasteInput(tabId) {
    const inputTextarea = document.getElementById(`input_text_${tabId}`);
    if (!inputTextarea) {
        console.error(`粘贴失败：未找到 id 为 input_text_${tabId} 的输入框`);
        showNotification('粘贴失败：目标输入框不存在。');
        return;
    }
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
    
    if (!outputTextarea) {
        console.error(`复制失败：未找到 id 为 output_text_${tabId} 的输出框`);
        showNotification('复制失败：目标输出框不存在。');
        return;
    }

    let inputText = inputTextarea ? inputTextarea.value : ''; // 确保 inputTextarea 存在
    // 如果输入框当前显示的是 placeholder 文本，则不进行关键字检查
    if (inputTextarea && inputTextarea.classList.contains('placeholder-active')) {
        inputText = ''; 
    }

    // 在复制前检查原始输入文本是否含有关键字并给出提示
    if (inputText.trim() !== '') { // 只有当输入文本非空时才检查
        checkAndAlertKeywords(inputText); // checkAndAlertKeywords 来自 utils.js
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

// 快捷复制列表的渲染函数
function renderQuickCopyArea(texts) { // texts 来自 constants.js
    const quickCopyArea = document.getElementById('quick_copy_area');
    if (!quickCopyArea) {
        console.error("错误：未找到快捷复制区域元素！请检查 index.html 中是否存在 id为 'quick_copy_area' 的元素。");
        return;
    }
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

// 复制文本到剪贴板的通用函数
function copyToClipboard(text) {
    // 使用 Clipboard API 替代 execCommand，更现代且支持 promise
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('文本已复制！');
        }).catch(err => {
            console.error('复制到剪贴板失败:', err);
            // Fallback if writeText fails due to permissions or other issues
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed'; // Avoid scrolling to bottom
            textarea.style.opacity = '0'; // Make it invisible
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                showNotification('文本已复制！');
            } catch (execErr) {
                console.error('execCommand 复制失败:', execErr);
                showNotification('复制失败，请手动复制。');
            } finally {
                document.body.removeChild(textarea);
            }
        });
    } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showNotification('文本已复制！');
        } catch (execErr) {
            console.error('execCommand 复制失败:', execErr);
            showNotification('复制失败，请手动复制。');
        } finally {
            document.body.removeChild(textarea);
        }
    }
}


// 处理文本转换的通用函数 - 这是调度器
function processText(tabId) {
    const inputTextarea = document.getElementById(`input_text_${tabId}`);
    const outputTextarea = document.getElementById(`output_text_${tabId}`);

    if (!inputTextarea || !outputTextarea) {
        console.error(`处理失败：未找到 id 为 input_text_${tabId} 或 output_text_${tabId} 的文本区域。`);
        showNotification('处理失败：输入/输出框缺失。');
        return;
    }

    let inputText = inputTextarea.value;

    // 如果当前显示的是 placeholder 文本，则不提交
    if (inputTextarea.classList.contains('placeholder-active')) {
        inputText = ''; // 清空placeholder内容，避免处理
    } else if (!inputText.trim()) {
        showNotification('输入内容为空，无需转换。');
        outputTextarea.value = ''; // 清空输出
        return;
    }

    let result = '';
    try {
        switch (tabId) {
            case 'level1':
                result = convert_level1_numbers(inputText); // 调用 features/level1.js 中的函数
                break;
            case 'level2':
                result = convert_level2_numbers(inputText); // 调用 features/level2.js 中的函数
                break;
            case 'twolevel':
                result = convert_two_level_numbers(inputText); // 调用 features/twolevel.js 中的函数
                break;
            case 'delete':
                result = delete_numbers(inputText); // 调用 features/delete.js 中的函数
                break;
            case 'addbr':
                result = add_br_tags(inputText); // 调用 features/addbr.js 中的函数
                break;
            case 'smart':
                result = smart_process_text(inputText); // 调用 features/smart.js 中的函数
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
        showNotification('处理失败，请检查输入格式或联系开发者。详情请查看控制台。');
    }
}