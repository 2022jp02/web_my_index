// features/twolevel.js - 两级序号转换功能

// 两级序号转换：一级（1）（2）...，二级①②...
// 这个函数依赖于 utils.js 中的 process_numbered_list 函数
function convert_two_level_numbers(text) {
    // 激活两级序号模式，`number_format_type`参数在此模式下被内部逻辑覆盖
    return process_numbered_list(text, 'two-level-specific', true); 
}