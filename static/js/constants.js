// constants.js - 存放所有全局常量和正则表达式

// 全局定义更全面的空白字符集（用于字符类）
const ALL_WHITESPACE_CHARS_SET = '\\s\\u200B\\u200C\\u200D\\uFEFF\\u00A0\\u1680\\u2000-\\u200A\\u202F\\u205F\\u3000'; 

// 定义匹配零个或多个这类空白字符的字符串（用于构建正则表达式）
const OPTIONAL_WHITESPACE_STR = `[${ALL_WHITESPACE_CHARS_SET}]*`;
// 定义匹配一个或多个这类空白字符的字符串（用于构建正则表达式）
const MANDATORY_WHITESPACE_STR = `[${ALL_WHITESPACE_CHARS_SET}]+`;

// 全局正则表达式：用于替换一个或多个空白字符为单个空格 (此功能已不常用，但保留)
const WHITESPACE_TO_SINGLE_SPACE_REGEX = new RegExp(MANDATORY_WHITESPACE_STR, 'g');
// 全局正则表达式：用于彻底移除所有空白字符
const WHITESPACE_TO_REMOVE_REGEX_ALL = new RegExp(MANDATORY_WHITESPACE_STR, 'g');


// 全局定义用于识别行首序号的基础正则表达式（无锚点，方便在Lookahead中使用）
// 匹配您提供的八种格式，以及其他常见序号
// 注意：此正则不再匹配明确的年份格式，年份由 LEADING_YEAR_PATTERN_REGEX 独立处理
const LEADING_NUMBER_PATTERN_BASE = '(?:' +
    // (?!20\\d{2}[年年度]) 负向先行断言确保不是20XX年/年度开头的数字
    // \d+[.\uFF0E)））、]? 匹配数字后跟点、全角点、右括号、全角右括号、顿号
    '(?!20\\d{2}[年年度])\\d+[.\uFF0E)））、]?|' + 
    '[一二三四五六七八九十]+、|' + // 识别“一、二、”这种中文数字带顿号的序号
    '[\uFF08][\\d一二三四五六七八九十]{1,2}[\uFF09]、?|' + // (1)、（1）、(一)、（一） and their versions with trailing 、
    '[\u2460-\u2473\u24EB-\u24F4]|' + // circled numbers ①②③
    '[a-zA-Z][.\uFF0E)）]?|' + // a., A), (a) (simplified to match single letter with optional punctuation)
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
    /^\s*[\(（][\d一二三四五六七八九十]{1,2}[)）]/, // (1), （1）, (一), （一） - 注意这里的括号匹配，更通用
    /^\s*[a-zA-Z][.\uFF0E]/, // A. , a.
    /^\s*第\s*\d+\s*条/ // 第1条
];

const LEVEL2_CANDIDATE_PATTERNS = [
    /^\s*\d+[)）]/, // 1) , 1）
    /^\s*[\u2460-\u2473\u24EB-\u24F4]/, // ①
    /^\s*[a-zA-Z][)）]/ // a) , a）
];

// 特殊用于两级序号功能，精确匹配（数字）和 ① 的正则表达式
// 这些将用于判断原始行是否是指定格式的序号
const TWO_LEVEL_SPECIFIC_L1_INPUT_PATTERN = /^\s*[\(（]\d+[\)）]/; // 匹配 (1), （1）
const TWO_LEVEL_SPECIFIC_L2_INPUT_PATTERN = /^\s*[\u2460-\u2473\u24EB-\u24F4]/; // 匹配 ①

// 快捷复制的预设文本
const PRESET_QUICK_COPY_TEXTS = [
    "符合条件的申报主体认定为XXX。",
    "符合条件的专家纳入专家库。",
    "按有关规定给予补助。",
    "申报主体应为",
    "申报主体需符合以下条件：",
    "申报主体需符合以下条件之一：",
    "详见相关文件《》。",
	"详见本通知附件。",
    "按要求提供。",
    "加盖公章。",
    "具体包含以下材料：",
    "〔2025〕"
];