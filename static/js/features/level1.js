// features/level1.js - 一级序号转换功能

// 一级序号转换：转换为（1）（2）…格式
// 这个函数依赖于 utils.js 中的 process_numbered_list 函数
function convert_level1_numbers(text) {
    return process_numbered_list(text, 'level1', false); 
}