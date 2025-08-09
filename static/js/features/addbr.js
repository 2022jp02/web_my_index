// features/addbr.js - 加换行符功能

// 加换行符：在每句话末尾添加<br>标签，并保持原有行结构，不处理序号
// 这个函数依赖于 utils.js 中的辅助函数
function add_br_tags(text) {
    // 按原始换行符分割
    const lines = text.split('\n'); 
    const result_lines = [];
    for (let line of lines) {
        // 对当前行进行彻底的空白移除和首尾去空
        let processed_line = remove_all_internal_whitespace(line);
        if (!processed_line) { // 只处理非空行
            continue; 
        }
        // 此功能不移除行首的序号或前缀，不修改句末标点，只在行尾追加 <br>
        result_lines.push(processed_line + '<br>');
    }
    // 使用原始换行符连接结果，以保持每行之间的换行
    return result_lines.join('\n');
}