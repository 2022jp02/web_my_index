// features/level2.js - 二级序号转换功能

// 二级序号转换：转换为①②③…格式
// 这个函数依赖于 utils.js 中的 process_numbered_list 函数
function convert_level2_numbers(text) {
    return process_numbered_list(text, 'level2', false); 
}