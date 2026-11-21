import type { ChallengeCheck, Chapter, Level, LevelTask } from '@/types';

interface ChoiceSeed {
  q: string;
  options: string[];
  answer: number;
  explain: string;
  hint?: string;
}

interface FillSeed {
  q: string;
  answer: string;
  explain: string;
  hint?: string;
}

interface OrderSeed {
  q: string;
  lines: string[];
  explain: string;
  hint?: string;
}

interface ChallengeSeed {
  q: string;
  starter: string;
  expected: string;
  solution: string;
  explain: string;
  hint?: string;
  terms?: string[];
  executable?: boolean;
}

interface LevelSeed {
  title: string;
  summary: string;
  concept: string;
  code?: string;
  bullets?: string[];
  choice: ChoiceSeed;
  fill: FillSeed;
  order: OrderSeed;
  challenge: ChallengeSeed;
}

interface ChapterSeed {
  title: string;
  summary: string;
  color: string;
  levels: LevelSeed[];
}

const CHAPTERS: ChapterSeed[] = [
  {
    title: '变量与数据类型',
    summary: '先学会把数据放进变量，再让程序把它说人话。',
    color: '#4d8dff',
    levels: [
      {
        title: '变量赋值',
        summary: '用名字接住一个值。',
        concept: '变量是贴了名字的盒子。等号右边先算出结果，再放进左边这个名字里。之后每次叫这个名字，拿到的都是盒子里的值。',
        code: 'name = "小明"\nprint(name)',
        choice: {
          q: '下面哪一行正确创建了变量 age，并把它设为 18？',
          options: ['age = 18', '18 = age', 'var age = 18', 'let age: 18'],
          answer: 0,
          explain: 'Python 的赋值写法是“变量名 = 值”，变量名在左，值在右。',
        },
        fill: {
          q: '补全变量赋值，让 name 保存字符串“小明”。\nname = ___',
          answer: '"小明"',
          explain: '字符串要放在引号里；中文内容同样需要引号。',
        },
        order: {
          q: '把代码排成“先存名字，再打印”的顺序。',
          lines: ['name = "小明"', 'print(name)'],
          explain: '先赋值，后使用；顺序反过来会报 NameError。',
        },
        challenge: {
          q: '定义变量 city 并赋值为“杭州”，然后打印它。',
          starter: '# 在这里写代码\n',
          expected: '杭州',
          solution: 'city = "杭州"\nprint(city)',
          explain: '先赋值，再把变量交给 print。',
          terms: ['city', 'print', '杭州'],
        },
      },
      {
        title: '字符串与数字',
        summary: '文本和数字是两种不同的类型。',
        concept: '字符串用引号包起来，数字直接写。print 可以一次输出多个值，默认用空格隔开。',
        code: 'age = 18\nprint("我今年", age)',
        choice: {
          q: 'print("1 + 1") 会输出什么？',
          options: ['2', '1 + 1', '报错', '11'],
          answer: 1,
          explain: '引号里的内容是字符串，不会参与计算，所以原样输出 1 + 1。',
        },
        fill: {
          q: '补全代码，让输出为 我今年 18 岁。\nprint("我今年", ___, "岁")',
          answer: 'age',
          explain: 'age 是变量名，直接放进去即可；不要再加引号。',
        },
        order: {
          q: '把代码排成正确顺序。',
          lines: ['age = 18', 'print("我今年", age, "岁")'],
          explain: '先有变量，再使用变量。',
        },
        challenge: {
          q: '定义 age = 18，用 print 输出：我今年 18 岁。',
          starter: 'age = 18\n# 补全 print\n',
          expected: '我今年 18 岁',
          solution: 'age = 18\nprint("我今年", age, "岁")',
          explain: 'print 的多个参数默认用空格分隔，正好拼出这句话。',
          terms: ['age', 'print'],
        },
      },
      {
        title: '类型转换',
        summary: '字符串和数字之间要显式换乘。',
        concept: 'int() 把内容转成整数，float() 转成小数，str() 转成字符串。从 input 拿到的内容永远是字符串。',
        code: 'num = int("18")\nprint(num + 1)',
        choice: {
          q: '表达式 int("18") 的结果是什么？',
          options: ['字符串 "18"', '整数 18', '小数 18.0', '报错'],
          answer: 1,
          explain: 'int() 会把可解析的字符串转成整数。',
        },
        fill: {
          q: '把字符串 "3.14" 转成小数，补全函数名。\npi = ___("3.14")',
          answer: 'float',
          explain: '带小数点的内容用 float() 转换。',
        },
        order: {
          q: '把“读取字符串、转成整数、加一、打印”排好。',
          lines: ['text = "41"', 'number = int(text)', 'result = number + 1', 'print(result)'],
          explain: '先转换再计算，否则字符串加法会拼接而不是相加。',
        },
        challenge: {
          q: '把字符串 "3.14" 转成小数，存进 pi，再打印 pi。',
          starter: 'text = "3.14"\n# 转成小数并打印\n',
          expected: '3.14',
          solution: 'text = "3.14"\npi = float(text)\nprint(pi)',
          explain: 'float() 把字符串转成小数。',
          terms: ['float', 'print', 'pi'],
        },
      },
      {
        title: '布尔与 None',
        summary: 'True / False 表示判断结果，None 表示“还没有值”。',
        concept: '布尔值只有 True 和 False，注意首字母大写。None 是一个特殊的空值，常用来表示“暂时没有结果”。',
        code: 'is_ready = True\nprint(is_ready)\nprint(None)',
        choice: {
          q: '下面哪个是合法的布尔值？',
          options: ['true', 'False', 'FALSE', '"False"'],
          answer: 1,
          explain: 'Python 的布尔值首字母大写：True / False。',
        },
        fill: {
          q: '把 0 转成布尔值，补全函数名。\nresult = ___(0)',
          answer: 'bool',
          explain: 'bool(0) 的结果是 False，bool(1) 是 True。',
        },
        order: {
          q: '把代码排成“先判断、再输出”的顺序。',
          lines: ['score = 90', 'passed = score >= 60', 'print(passed)'],
          explain: '比较运算会先得到布尔值，再交给 print。',
        },
        challenge: {
          q: '定义 score = 90，判断它是否大于等于 60，把结果存进 passed 并打印。',
          starter: 'score = 90\n# 判断并打印\n',
          expected: 'True',
          solution: 'score = 90\npassed = score >= 60\nprint(passed)',
          explain: '>= 用来判断“大于或等于”，结果是布尔值。',
          terms: ['score', '>=', 'print', 'passed'],
        },
      },
      {
        title: '综合输出',
        summary: '把变量、类型和格式化串起来。',
        concept: 'f-string 用 f 开头，在字符串里用花括号直接放变量，读起来最接近自然语言。',
        code: 'name = "小明"\nage = 18\nprint(f"姓名：{name} | 年龄：{age}")',
        choice: {
          q: '下面哪种写法能正确输出变量 name 的值？',
          options: ['print("name")', 'print(f"{name}")', 'print({name})', 'print(name())'],
          answer: 1,
          explain: 'f-string 里的 {name} 会被替换成变量的值；print("name") 只会输出单词 name。',
        },
        fill: {
          q: '补全 f-string 的前缀，让变量被替换。\nprint(___"你好，{name}")',
          answer: 'f',
          explain: '字符串前加 f 才会启用花括号插值。',
        },
        order: {
          q: '排好“定义两个变量、再格式化输出”的顺序。',
          lines: ['name = "小明"', 'age = 18', 'print(f"{name} 今年 {age} 岁")'],
          explain: '先准备变量，再格式化输出。',
        },
        challenge: {
          q: '定义 name = "小明"、age = 18，用 f-string 输出：姓名：小明 | 年龄：18。',
          starter: 'name = "小明"\nage = 18\n# 用 f-string 输出\n',
          expected: '姓名：小明 | 年龄：18',
          solution: 'name = "小明"\nage = 18\nprint(f"姓名：{name} | 年龄：{age}")',
          explain: 'f-string 把变量直接嵌进字符串，注意冒号和竖线的位置。',
          terms: ['f"', 'name', 'age', 'print'],
        },
      },
    ],
  },
  {
    title: '运算符与表达式',
    summary: '让程序会算、会比、会组合条件。',
    color: '#6ee7f9',
    levels: [
      {
        title: '算术运算',
        summary: '加减乘除之外，还有整除、取余和幂。',
        concept: '// 是整除，% 是取余，** 是幂。它们经常一起用来做分页、奇偶判断和单位换算。',
        code: 'print(7 // 2)\nprint(7 % 2)\nprint(2 ** 3)',
        choice: {
          q: '7 // 2 的结果是什么？',
          options: ['3.5', '3', '4', '1'],
          answer: 1,
          explain: '// 向下取整，7 除以 2 的整数部分是 3。',
        },
        fill: {
          q: '判断 7 是奇数还是偶数，需要取余数。补全运算符。\nremainder = 7 ___ 2',
          answer: '%',
          explain: '% 返回余数，7 % 2 等于 1。',
        },
        order: {
          q: '排好“计算平均分并打印”的顺序。',
          lines: ['total = 270', 'count = 3', 'average = total / count', 'print(average)'],
          explain: '先准备总量和数量，再做除法。',
        },
        challenge: {
          q: '计算 17 除以 5 的整数商和余数，分别存进 q 和 r，并打印。',
          starter: '# 补全计算\n',
          expected: '3\n2',
          solution: 'q = 17 // 5\nr = 17 % 5\nprint(q)\nprint(r)',
          explain: '// 得整数商，% 得余数。',
          terms: ['//', '%', 'print', 'q', 'r'],
        },
      },
      {
        title: '比较运算',
        summary: '比较的结果永远是 True 或 False。',
        concept: '== 判断相等，!= 判断不等，>、<、>=、<= 比较大小。注意 = 是赋值，== 才是比较。',
        code: 'age = 18\nprint(age == 18)\nprint(age != 20)',
        choice: {
          q: '判断变量 a 是否等于 10，应该写？',
          options: ['a = 10', 'a == 10', 'a === 10', 'a equals 10'],
          answer: 1,
          explain: '== 才是比较，= 会把 10 赋给 a。',
        },
        fill: {
          q: '补全“不等于”运算符，让表达式为 True。\nprint(18 ___ 20)',
          answer: '!=',
          explain: '!= 表示不等于。',
        },
        order: {
          q: '排好“比较两个分数并打印结果”的顺序。',
          lines: ['a = 90', 'b = 85', 'result = a > b', 'print(result)'],
          explain: '先有值，再比较，最后输出。',
        },
        challenge: {
          q: '定义 a = 10、b = 20，判断 a 是否小于 b，把结果存进 result 并打印。',
          starter: 'a = 10\nb = 20\n# 比较并打印\n',
          expected: 'True',
          solution: 'a = 10\nb = 20\nresult = a < b\nprint(result)',
          explain: '< 表示小于，结果是布尔值。',
          terms: ['<', 'result', 'print'],
        },
      },
      {
        title: '逻辑运算',
        summary: '用 and、or、not 组合多个条件。',
        concept: 'and 要求两边都为真，or 只要一边为真，not 把真假反过来。它们常和比较运算一起使用。',
        code: 'age = 20\nhas_ticket = True\nprint(age >= 18 and has_ticket)',
        choice: {
          q: '表达式 True and False 的结果是？',
          options: ['True', 'False', '报错', 'None'],
          answer: 1,
          explain: 'and 需要两边都为 True，结果才是 True。',
        },
        fill: {
          q: '补全逻辑运算符：年龄满 18 且已购票才允许入场。\nallowed = age >= 18 ___ has_ticket',
          answer: 'and',
          explain: '两个条件都要满足，用 and。',
        },
        order: {
          q: '排好“判断能否入场”的代码顺序。',
          lines: ['age = 20', 'has_ticket = True', 'allowed = age >= 18 and has_ticket', 'print(allowed)'],
          explain: '先准备两个条件，再组合判断。',
        },
        challenge: {
          q: '定义 score = 85、attendance = 0.9，判断“分数大于 80 且出勤率不低于 0.8”，存进 passed 并打印。',
          starter: 'score = 85\nattendance = 0.9\n# 组合判断\n',
          expected: 'True',
          solution: 'score = 85\nattendance = 0.9\npassed = score > 80 and attendance >= 0.8\nprint(passed)',
          explain: '两个条件用 and 连接。',
          terms: ['and', 'score', 'attendance', 'print'],
        },
      },
      {
        title: '优先级',
        summary: '括号最优先，其次是乘除，最后加减。',
        concept: '2 + 3 * 4 先算乘法。拿不准时直接加括号，代码可读性比“背优先级”更重要。',
        code: 'print(2 + 3 * 4)\nprint((2 + 3) * 4)',
        choice: {
          q: '2 + 3 * 4 的结果是？',
          options: ['20', '14', '24', '9'],
          answer: 1,
          explain: '乘法优先，先算 3 * 4 = 12，再加 2。',
        },
        fill: {
          q: '补全括号，让结果变成 20。\nprint((2 + 3) ___ 4)',
          answer: '*',
          explain: '(2 + 3) 先算得 5，再乘 4。',
        },
        order: {
          q: '排好“先算括号、再平方”的顺序。',
          lines: ['base = 2 + 3', 'result = base ** 2', 'print(result)'],
          explain: '先算出 base，再对 base 求平方。',
        },
        challenge: {
          q: '计算 (8 + 2) * 3 的结果并打印。',
          starter: '# 计算并打印\n',
          expected: '30',
          solution: 'print((8 + 2) * 3)',
          explain: '括号先算，10 * 3 = 30。',
          terms: ['(', ')', '*', 'print'],
        },
      },
      {
        title: '复合赋值',
        summary: '用 +=、-= 让累加更短。',
        concept: 'total += 5 等价于 total = total + 5。还有 -=、*=、/= 等写法，适合循环累加。',
        code: 'total = 0\ntotal += 5\ntotal += 3\nprint(total)',
        choice: {
          q: 'x = 10 后执行 x += 5，x 的值是？',
          options: ['5', '10', '15', '105'],
          answer: 2,
          explain: 'x += 5 等价于 x = x + 5。',
        },
        fill: {
          q: '补全复合赋值，让 total 增加 10。\ntotal ___ 10',
          answer: '+=',
          explain: '+= 表示在原值基础上累加。',
        },
        order: {
          q: '排好“从 0 开始累加到 6”的顺序。',
          lines: ['total = 0', 'total += 3', 'total += 3', 'print(total)'],
          explain: '每次 += 都在前一次结果上累加。',
        },
        challenge: {
          q: '从 total = 0 开始，依次累加 5、10、15，最后打印 total。',
          starter: 'total = 0\n# 三次累加\n',
          expected: '30',
          solution: 'total = 0\ntotal += 5\ntotal += 10\ntotal += 15\nprint(total)',
          explain: '三次 += 后 total 为 30。',
          terms: ['total', '+=', 'print'],
        },
      },
    ],
  },
  {
    title: '条件分支',
    summary: '让程序根据情况走不同的路。',
    color: '#ffc44d',
    levels: [
      {
        title: 'if 基础',
        summary: '满足条件才执行。',
        concept: 'if 后面跟一个布尔表达式，冒号表示“下面开始一个代码块”，代码块要缩进 4 个空格。',
        code: 'score = 90\nif score >= 60:\n    print("及格")',
        choice: {
          q: 'Python 中 if 语句末尾必须加什么？',
          options: ['分号 ;', '冒号 :', '括号 ()', '花括号 {}'],
          answer: 1,
          explain: 'if 条件后面要加冒号，下一行开始缩进。',
        },
        fill: {
          q: '补全条件：分数大于等于 60 时打印“及格”。\nif score ___ 60:\n    print("及格")',
          answer: '>=',
          explain: '“大于等于”用 >=。',
        },
        order: {
          q: '排好“判断并打印”的代码顺序。',
          lines: ['score = 90', 'if score >= 60:', '    print("及格")'],
          explain: '先赋值，再判断；print 要缩进在 if 里面。',
        },
        challenge: {
          q: '定义 score = 75，如果 score 大于等于 60，打印“通过”。',
          starter: 'score = 75\n# 条件判断\n',
          expected: '通过',
          solution: 'score = 75\nif score >= 60:\n    print("通过")',
          explain: '条件成立才执行缩进的 print。',
          terms: ['if', '>=', 'print'],
        },
      },
      {
        title: 'if / else',
        summary: '两条路，必走其一。',
        concept: 'else 表示“否则”。它不写条件，和最近的 if 配对，二者只会执行一个分支。',
        code: 'score = 55\nif score >= 60:\n    print("及格")\nelse:\n    print("不及格")',
        choice: {
          q: 'else 后面需要写条件吗？',
          options: ['需要，写 else score < 60:', '不需要，直接 else:', '需要写 else if:', '可写可不写'],
          answer: 1,
          explain: 'else 表示其余所有情况，不带条件。',
        },
        fill: {
          q: '补全“否则”关键字。\nif ok:\n    print("通过")\n___:\n    print("重试")',
          answer: 'else',
          explain: 'else 处理条件不成立的情况。',
        },
        order: {
          q: '排好一个完整的 if / else。',
          lines: ['age = 16', 'if age >= 18:', '    print("成年")', 'else:', '    print("未成年")'],
          explain: 'if 和 else 各自带一个缩进代码块。',
        },
        challenge: {
          q: '定义 n = 7，如果 n 是偶数打印“偶数”，否则打印“奇数”。',
          starter: 'n = 7\n# 判断奇偶\n',
          expected: '奇数',
          solution: 'n = 7\nif n % 2 == 0:\n    print("偶数")\nelse:\n    print("奇数")',
          explain: 'n % 2 == 0 是偶数条件，else 处理奇数。',
          terms: ['if', 'else', '%', 'print'],
        },
      },
      {
        title: 'elif 多分支',
        summary: '三个以上分支，用 elif 串起来。',
        concept: 'elif 是 else if 的缩写。条件从上到下依次判断，命中一个就不再往下走。',
        code: 'score = 85\nif score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelse:\n    print("C")',
        choice: {
          q: 'score = 85 时，上面代码输出什么？',
          options: ['A', 'B', 'C', '什么都不输出'],
          answer: 1,
          explain: '85 不满足 >= 90，但满足 >= 80，所以输出 B。',
        },
        fill: {
          q: '补全多分支关键字。\nif score >= 90:\n    print("A")\n___ score >= 80:\n    print("B")',
          answer: 'elif',
          explain: 'elif 用来继续判断下一个条件。',
        },
        order: {
          q: '排好成绩分档的代码。',
          lines: ['score = 72', 'if score >= 90:', '    print("A")', 'elif score >= 60:', '    print("B")', 'else:', '    print("C")'],
          explain: '条件从高到低排列，else 兜底。',
        },
        challenge: {
          q: '定义 score = 82，按 >=90 输出 A、>=60 输出 B、其余输出 C 的规则打印等级。',
          starter: 'score = 82\n# 分档输出\n',
          expected: 'B',
          solution: 'score = 82\nif score >= 90:\n    print("A")\nelif score >= 60:\n    print("B")\nelse:\n    print("C")',
          explain: '82 命中第二个分支。',
          terms: ['if', 'elif', 'else', 'print'],
        },
      },
      {
        title: '嵌套条件',
        summary: '条件里面还可以再套条件。',
        concept: '当判断需要分两层时，可以在 if 代码块里再写 if。缩进层级越深，越要考虑能不能提前返回或合并条件。',
        code: 'age = 20\nhas_ticket = True\nif age >= 18:\n    if has_ticket:\n        print("入场")',
        choice: {
          q: '内层 if 应该缩进几格？',
          options: ['0 格', '2 格', '4 格', '8 格'],
          answer: 2,
          explain: 'Python 约定每个代码块缩进 4 个空格。',
        },
        fill: {
          q: '补全内层判断：年龄满 18 且已购票才入场。\nif age >= 18:\n    ___ has_ticket:\n        print("入场")',
          answer: 'if',
          explain: '内层仍然使用 if。',
        },
        order: {
          q: '排好嵌套判断的代码。',
          lines: ['age = 20', 'has_ticket = True', 'if age >= 18:', '    if has_ticket:', '        print("入场")'],
          explain: '外层判断年龄，内层判断票。',
        },
        challenge: {
          q: '定义 age = 20、vip = False，如果成年且是 VIP，打印“贵宾通道”，否则打印“普通通道”。',
          starter: 'age = 20\nvip = False\n# 嵌套判断\n',
          expected: '普通通道',
          solution: 'age = 20\nvip = False\nif age >= 18:\n    if vip:\n        print("贵宾通道")\n    else:\n        print("普通通道")\nelse:\n    print("未满 18 岁")',
          explain: '外层判断成年，内层判断 VIP。',
          terms: ['if', 'else', 'vip', 'print'],
        },
      },
      {
        title: '条件表达式',
        summary: '一行写完简单的二选一。',
        concept: '值1 if 条件 else 值2 是条件表达式，适合简单二选一；复杂分支还是用 if / else 更清楚。',
        code: 'age = 20\nlabel = "成年" if age >= 18 else "未成年"\nprint(label)',
        choice: {
          q: '下面哪个是条件表达式的正确写法？',
          options: ['"A" if ok else "B"', 'if ok "A" else "B"', '"A" ? "B" : ok', 'ok ? "A" : "B"'],
          answer: 0,
          explain: 'Python 的条件表达式是 值1 if 条件 else 值2。',
        },
        fill: {
          q: '补全条件表达式，让 n 为偶数时取“偶”，否则取“奇”。\nlabel = "偶" ___ n % 2 == 0 else "奇"',
          answer: 'if',
          explain: '条件表达式中间用 if，后面用 else。',
        },
        order: {
          q: '排好“用条件表达式生成标签”的代码。',
          lines: ['score = 58', 'label = "通过" if score >= 60 else "重试"', 'print(label)'],
          explain: '先定义条件，再生成标签。',
        },
        challenge: {
          q: '定义 n = 5，用条件表达式把“奇数”或“偶数”存进 label 并打印。',
          starter: 'n = 5\n# 条件表达式\n',
          expected: '奇数',
          solution: 'n = 5\nlabel = "偶数" if n % 2 == 0 else "奇数"\nprint(label)',
          explain: 'n % 2 == 0 为假，所以取 else 分支。',
          terms: ['if', 'else', 'label', 'print'],
        },
      },
    ],
  },
  {
    title: '循环结构',
    summary: '把重复的事交给 for 和 while。',
    color: '#3ddc97',
    levels: [
      {
        title: 'for 与 range',
        summary: '按次数重复，最常用。',
        concept: 'range(n) 生成 0 到 n-1 的整数序列。for 会依次取出每个值，执行一次缩进代码块。',
        code: 'for i in range(3):\n    print(i)',
        choice: {
          q: 'range(3) 会依次产生哪些数？',
          options: ['1, 2, 3', '0, 1, 2', '0, 1, 2, 3', '3'],
          answer: 1,
          explain: 'range 从 0 开始，到 n-1 结束。',
        },
        fill: {
          q: '补全循环，让 i 依次取 0 到 4。\nfor i in range(___):\n    print(i)',
          answer: '5',
          explain: '要包含 4，range 的参数写 5。',
        },
        order: {
          q: '排好“循环打印 3 次”的代码。',
          lines: ['for i in range(3):', '    print("第", i, "次")'],
          explain: 'for 行以冒号结尾，循环体缩进。',
        },
        challenge: {
          q: '用 for 循环打印 1 到 5（包含 5），每行一个数字。',
          starter: '# 用 for range 输出 1..5\n',
          expected: '1\n2\n3\n4\n5',
          solution: 'for i in range(1, 6):\n    print(i)',
          explain: 'range(1, 6) 从 1 到 5。',
          terms: ['for', 'range', 'print'],
        },
      },
      {
        title: 'while 循环',
        summary: '条件为真就一直做。',
        concept: 'while 先判断条件，再执行循环体。循环体里一定要更新条件变量，否则会死循环。',
        code: 'count = 0\nwhile count < 3:\n    print(count)\n    count += 1',
        choice: {
          q: 'while 循环最容易出现什么问题？',
          options: ['语法错误', '死循环', '自动排序', '类型自动转换'],
          answer: 1,
          explain: '如果条件一直为真且没有更新，循环不会停止。',
        },
        fill: {
          q: '补全循环条件：count 小于 3 时继续。\nwhile count ___ 3:\n    count += 1',
          answer: '<',
          explain: 'count < 3 表示小于 3。',
        },
        order: {
          q: '排好 while 循环的代码。',
          lines: ['count = 0', 'while count < 3:', '    print(count)', '    count += 1'],
          explain: '初始化、判断、循环体、更新变量，缺一不可。',
        },
        challenge: {
          q: '用 while 循环打印 3、2、1，然后打印“发射”。',
          starter: 'n = 3\n# while 倒计时\n',
          expected: '3\n2\n1\n发射',
          solution: 'n = 3\nwhile n > 0:\n    print(n)\n    n -= 1\nprint("发射")',
          explain: '每次循环把 n 减 1，减到 0 时退出。',
          terms: ['while', 'print', '-='],
        },
      },
      {
        title: 'break 与 continue',
        summary: '提前结束，或跳过本次。',
        concept: 'break 立即结束整个循环，continue 跳过本次剩余代码、直接进入下一轮。它们通常和 if 配合。',
        code: 'for i in range(10):\n    if i == 3:\n        break\n    print(i)',
        choice: {
          q: 'break 的作用是？',
          options: ['跳过本次循环', '结束整个循环', '重新开始循环', '暂停程序'],
          answer: 1,
          explain: 'break 直接跳出当前循环。',
        },
        fill: {
          q: '补全关键字：遇到 5 就跳过本次。\nif i == 5:\n    ___',
          answer: 'continue',
          explain: 'continue 跳过本次循环剩余部分。',
        },
        order: {
          q: '排好“找到 3 就停止”的循环。',
          lines: ['for i in range(10):', '    if i == 3:', '        break', '    print(i)'],
          explain: 'break 位于 if 内，遇到 3 时跳出。',
        },
        challenge: {
          q: '用 for 循环打印 1 到 9，但遇到 5 时跳过，不打印 5。',
          starter: '# 打印 1..9，跳过 5\n',
          expected: '1\n2\n3\n4\n6\n7\n8\n9',
          solution: 'for i in range(1, 10):\n    if i == 5:\n        continue\n    print(i)',
          explain: 'continue 跳过 5 这一轮。',
          terms: ['for', 'if', 'continue', 'print'],
        },
      },
      {
        title: '嵌套循环',
        summary: '外层走一次，内层走一轮。',
        concept: '嵌套循环里，外层每取一个值，内层都会完整执行一遍。常用于打印表格、矩阵和乘法表。',
        code: 'for i in range(1, 3):\n    for j in range(1, 3):\n        print(i, j)',
        choice: {
          q: '两层各循环 3 次，内层代码总共执行多少次？',
          options: ['3', '6', '9', '12'],
          answer: 2,
          explain: '外层 3 次，每次内层 3 次，共 9 次。',
        },
        fill: {
          q: '补全内层循环，让 j 取 1 到 3。\nfor j in range(1, ___):',
          answer: '4',
          explain: 'range(1, 4) 产生 1、2、3。',
        },
        order: {
          q: '排好打印 2×2 组合的嵌套循环。',
          lines: ['for i in range(2):', '    for j in range(2):', '        print(i, j)'],
          explain: '内层缩进比外层多 4 格。',
        },
        challenge: {
          q: '用嵌套循环打印 1×1 到 2×2 的乘法组合，每行“i*j=结果”。',
          starter: '# 嵌套循环\n',
          expected: '1*1=1\n1*2=2\n2*1=2\n2*2=4',
          solution: 'for i in range(1, 3):\n    for j in range(1, 3):\n        print(f"{i}*{j}={i * j}")',
          explain: '外层 i 从 1 到 2，内层 j 从 1 到 2。',
          terms: ['for', 'range', 'print'],
        },
      },
      {
        title: '循环累加',
        summary: '用一个变量把每次结果攒起来。',
        concept: '累加前先把变量初始化为 0，再在循环里 +=。这是求和、计数、拼接字符串的通用套路。',
        code: 'total = 0\nfor i in range(1, 6):\n    total += i\nprint(total)',
        choice: {
          q: '累加之前，total 应该先设成？',
          options: ['1', '0', 'None', 'i'],
          answer: 1,
          explain: '加法单位元是 0；设成 1 会多算一次。',
        },
        fill: {
          q: '补全累加语句。\ntotal = 0\nfor i in range(1, 6):\n    total ___ i',
          answer: '+=',
          explain: '每次把 i 加到 total 上。',
        },
        order: {
          q: '排好“求 1 到 4 的和”的代码。',
          lines: ['total = 0', 'for i in range(1, 5):', '    total += i', 'print(total)'],
          explain: '初始化、循环、累加、输出。',
        },
        challenge: {
          q: '用循环计算 1 到 10 的和，存进 total 并打印。',
          starter: 'total = 0\n# 循环累加 1..10\n',
          expected: '55',
          solution: 'total = 0\nfor i in range(1, 11):\n    total += i\nprint(total)',
          explain: 'range(1, 11) 覆盖 1 到 10。',
          terms: ['for', 'range', '+=', 'print'],
        },
      },
    ],
  },
  {
    title: '字符串处理',
    summary: '文本不只是打印，还能切片、清洗和格式化。',
    color: '#ff8fb3',
    levels: [
      {
        title: '索引与切片',
        summary: '字符串是有顺序的字符序列。',
        concept: '索引从 0 开始，-1 表示最后一个字符。切片 s[start:end] 取到 end 之前一位，省略表示从头或到尾。',
        code: 's = "workshop"\nprint(s[0])\nprint(s[-1])\nprint(s[0:4])',
        choice: {
          q: 's = "python"，s[1:3] 的结果是？',
          options: ['py', 'yt', 'yth', 'th'],
          answer: 1,
          explain: '从索引 1 开始，取到索引 3 之前，即 y、t。',
        },
        fill: {
          q: '取字符串的最后一个字符。\nlast = s[___]',
          answer: '-1',
          explain: '负数索引从末尾开始，-1 是最后一个。',
        },
        order: {
          q: '排好“取前三个字符并打印”的代码。',
          lines: ['text = "workshop"', 'head = text[:3]', 'print(head)'],
          explain: '切片 [:3] 表示从开头到索引 3 之前。',
        },
        challenge: {
          q: '定义 text = "code-workshop"，打印前 4 个字符和最后 4 个字符。',
          starter: 'text = "code-workshop"\n# 切片输出\n',
          expected: 'code\nshop',
          solution: 'text = "code-workshop"\nprint(text[:4])\nprint(text[-4:])',
          explain: '[:4] 取前四个，[-4:] 取后四个。',
          terms: ['text[:4]', 'text[-4:]', 'print'],
        },
      },
      {
        title: '常用方法',
        summary: '大小写、去空格、查找、替换。',
        concept: '字符串方法返回新字符串，不会修改原值。常用 upper、lower、strip、replace、find。',
        code: 's = "  Hello Python  "\nprint(s.strip())\nprint(s.strip().lower())\nprint(s.replace("Python", "Workshop"))',
        choice: {
          q: 's = " Hi "，s.strip() 的结果是？',
          options: ['" Hi "', '"Hi"', '"hi"', '报错'],
          answer: 1,
          explain: 'strip() 去掉两端空白，不改变大小写。',
        },
        fill: {
          q: '把字符串全部转成小写。\nprint(s.___())',
          answer: 'lower',
          explain: 'lower() 返回全小写的新字符串。',
        },
        order: {
          q: '排好“去空格、转小写、打印”的代码。',
          lines: ['raw = "  PYTHON  "', 'clean = raw.strip().lower()', 'print(clean)'],
          explain: '方法可以链式调用。',
        },
        challenge: {
          q: '把 "  Code Workshop  " 去掉两端空格并转成小写，存进 clean 后打印。',
          starter: 'raw = "  Code Workshop  "\n# 清洗并打印\n',
          expected: 'code workshop',
          solution: 'raw = "  Code Workshop  "\nclean = raw.strip().lower()\nprint(clean)',
          explain: 'strip 去空格，lower 转小写。',
          terms: ['strip', 'lower', 'print', 'clean'],
        },
      },
      {
        title: '字符串格式化',
        summary: '把变量嵌进句子里。',
        concept: 'f-string 是最直观的格式化方式。可以在花括号里直接写表达式，也可以控制小数位，如 {score:.1f}。',
        code: 'name = "小明"\nscore = 92.5\nprint(f"{name} 的成绩是 {score:.1f}")',
        choice: {
          q: 'f"{score:.1f}" 会把 92.56 格式化成？',
          options: ['92', '92.5', '92.6', '92.56'],
          answer: 2,
          explain: '.1f 保留一位小数并四舍五入。',
        },
        fill: {
          q: '补全格式化前缀。\nprint(___"{name} 考了 {score} 分")',
          answer: 'f',
          explain: 'f 前缀启用花括号插值。',
        },
        order: {
          q: '排好“定义变量并格式化输出”的代码。',
          lines: ['name = "小明"', 'score = 92.5', 'print(f"{name}: {score:.1f}")'],
          explain: '先定义变量，再格式化。',
        },
        challenge: {
          q: '定义 name = "小明"、score = 92.56，用 f-string 输出“小明：92.6 分”。',
          starter: 'name = "小明"\nscore = 92.56\n# 保留一位小数\n',
          expected: '小明：92.6 分',
          solution: 'name = "小明"\nscore = 92.56\nprint(f"{name}：{score:.1f} 分")',
          explain: '{score:.1f} 保留一位小数并四舍五入。',
          terms: ['print', '.1f', 'name'],
        },
      },
      {
        title: '分割与连接',
        summary: '在字符串和列表之间来回转换。',
        concept: 'split(sep) 按分隔符切成列表，sep.join(list) 用分隔符把列表拼回字符串。处理 CSV、标签、路径时非常常用。',
        code: 'tags = "python,web,ai".split(",")\nprint(tags)\nprint(" | ".join(tags))',
        choice: {
          q: '"a,b,c".split(",") 的结果是？',
          options: ['"a b c"', '["a", "b", "c"]', '("a", "b", "c")', '报错'],
          answer: 1,
          explain: 'split 返回列表。',
        },
        fill: {
          q: '用逗号把列表拼成字符串。\nprint(",".___(items))',
          answer: 'join',
          explain: 'join 是字符串的方法，参数是列表。',
        },
        order: {
          q: '排好“切分、去空格、再拼接”的代码。',
          lines: ['raw = "a, b, c"', 'parts = [x.strip() for x in raw.split(",")]', 'print(" | ".join(parts))'],
          explain: '先 split，再逐项 strip，最后 join。',
        },
        challenge: {
          q: '把 "python,web,ai" 按逗号切分，再用 " / " 连接并打印。',
          starter: 'raw = "python,web,ai"\n# 切分并连接\n',
          expected: 'python / web / ai',
          solution: 'raw = "python,web,ai"\nparts = raw.split(",")\nprint(" / ".join(parts))',
          explain: 'split 得到列表，join 用新分隔符拼回。',
          terms: ['split', 'join', 'print'],
        },
      },
      {
        title: '综合清洗',
        summary: '把脏文本变成可用的数据。',
        concept: '真实输入常有空格、大小写和多余分隔符。清洗顺序通常是：去两端空白 → 统一大小写 → 分割 → 去空项 → 去重。',
        code: 'raw = "  Python, python , AI ,"\nparts = [p.strip().lower() for p in raw.split(",") if p.strip()]\nprint(parts)',
        choice: {
          q: '清洗用户输入时，下面哪一步最应该先做？',
          options: ['直接比较', '去掉两端空白', '转成整数', '排序'],
          answer: 1,
          explain: '先 trim 能避免空格导致的误判。',
        },
        fill: {
          q: '过滤掉切分后的空字符串。\nparts = [p for p in raw.split(",") if p.___()]',
          answer: 'strip',
          explain: 'strip() 后为空字符串即假值，可被过滤。',
        },
        order: {
          q: '排好“切分、清洗、去重、输出”的代码。',
          lines: ['raw = "a, A, b, B"', 'parts = [p.strip().lower() for p in raw.split(",")]', 'unique = list(dict.fromkeys(parts))', 'print(unique)'],
          explain: '清洗后去重，保留首次出现的顺序。',
        },
        challenge: {
          q: '把 "  Python, python , AI ," 清洗成 ["python", "ai"] 并打印。',
          starter: 'raw = "  Python, python , AI ,"\n# 清洗、去重\n',
          expected: "['python', 'ai']",
          solution: 'raw = "  Python, python , AI ,"\nparts = [p.strip().lower() for p in raw.split(",") if p.strip()]\nunique = list(dict.fromkeys(parts))\nprint(unique)',
          explain: '先清洗再按首次出现去重。',
          terms: ['strip', 'lower', 'split', 'print'],
        },
      },
    ],
  },
  {
    title: '列表与元组',
    summary: '把一组数据放在一起，做增删改查和变换。',
    color: '#a78bfa',
    levels: [
      {
        title: '列表增删改查',
        summary: '列表是可变的顺序容器。',
        concept: 'append 追加、insert 插入、remove 按值删除、pop 按索引取出。列表用方括号表示，元素可重复。',
        code: 'items = ["a", "b"]\nitems.append("c")\nitems[0] = "A"\nprint(items)',
        choice: {
          q: '向列表末尾追加一个元素，用哪个方法？',
          options: ['push', 'append', 'add', 'insert'],
          answer: 1,
          explain: 'Python 列表用 append 追加到末尾。',
        },
        fill: {
          q: '删除列表中的 "b"。\nitems.___("b")',
          answer: 'remove',
          explain: 'remove 按值删除第一个匹配项。',
        },
        order: {
          q: '排好“创建、追加、修改、打印”的代码。',
          lines: ['items = ["a", "b"]', 'items.append("c")', 'items[0] = "A"', 'print(items)'],
          explain: '列表可变，修改会直接影响原列表。',
        },
        challenge: {
          q: '创建列表 fruits = ["apple", "banana"]，追加 "cherry"，把第一项改成 "pear"，打印列表。',
          starter: 'fruits = ["apple", "banana"]\n# 追加并修改\n',
          expected: "['pear', 'banana', 'cherry']",
          solution: 'fruits = ["apple", "banana"]\nfruits.append("cherry")\nfruits[0] = "pear"\nprint(fruits)',
          explain: 'append 追加，索引赋值修改。',
          terms: ['append', 'fruits[0]', 'print'],
        },
      },
      {
        title: '列表切片',
        summary: '一次取一段，而不是一个。',
        concept: '切片 list[start:end:step] 返回新列表，不修改原列表。省略 start/end 表示从头/到尾，step 为负可倒序。',
        code: 'nums = [0, 1, 2, 3, 4, 5]\nprint(nums[1:4])\nprint(nums[::-1])',
        choice: {
          q: 'nums = [0,1,2,3,4]，nums[1:4] 是？',
          options: ['[0,1,2,3]', '[1,2,3]', '[1,2,3,4]', '[2,3,4]'],
          answer: 1,
          explain: '包含起始索引 1，不包含结束索引 4。',
        },
        fill: {
          q: '取列表的最后两个元素。\nlast_two = nums[___]',
          answer: '-2:',
          explain: '[-2:] 从倒数第二个取到末尾。',
        },
        order: {
          q: '排好“取中间段并倒序”的代码。',
          lines: ['nums = [1, 2, 3, 4, 5]', 'middle = nums[1:4]', 'reversed_middle = middle[::-1]', 'print(reversed_middle)'],
          explain: '先切片，再对切片结果倒序。',
        },
        challenge: {
          q: '定义 nums = [0,1,2,3,4,5]，打印索引 2 到 4（不含 5）的切片，再打印整个列表的倒序。',
          starter: 'nums = [0, 1, 2, 3, 4, 5]\n# 切片输出\n',
          expected: '[2, 3, 4]\n[5, 4, 3, 2, 1, 0]',
          solution: 'nums = [0, 1, 2, 3, 4, 5]\nprint(nums[2:5])\nprint(nums[::-1])',
          explain: '[2:5] 取索引 2、3、4；[::-1] 倒序。',
          terms: ['nums[2:5]', 'nums[::-1]', 'print'],
        },
      },
      {
        title: '排序与反转',
        summary: '原地排序和返回新列表要分清。',
        concept: 'list.sort() 原地排序，返回 None；sorted(list) 返回新列表。reverse=True 表示降序。',
        code: 'nums = [3, 1, 2]\nprint(sorted(nums))\nnums.sort(reverse=True)\nprint(nums)',
        choice: {
          q: 'nums.sort() 的返回值是？',
          options: ['排序后的新列表', 'None', '原列表', '布尔值'],
          answer: 1,
          explain: 'sort 原地修改，返回 None；需要新列表用 sorted。',
        },
        fill: {
          q: '让 sorted 按降序排列。\nprint(sorted(nums, reverse=___))',
          answer: 'True',
          explain: 'reverse=True 表示降序。',
        },
        order: {
          q: '排好“复制后排序、不影响原列表”的代码。',
          lines: ['nums = [3, 1, 2]', 'asc = sorted(nums)', 'print(asc)', 'print(nums)'],
          explain: 'sorted 返回新列表，原列表不变。',
        },
        challenge: {
          q: '定义 nums = [3, 1, 2]，用 sorted 得到降序列表 desc 并打印，再打印原列表。',
          starter: 'nums = [3, 1, 2]\n# 降序副本\n',
          expected: '[3, 2, 1]\n[3, 1, 2]',
          solution: 'nums = [3, 1, 2]\ndesc = sorted(nums, reverse=True)\nprint(desc)\nprint(nums)',
          explain: 'sorted 不修改原列表。',
          terms: ['sorted', 'reverse=True', 'print'],
        },
      },
      {
        title: '元组与解包',
        summary: '不可变的小容器，适合成组返回。',
        concept: '元组用圆括号，创建后不能修改。解包可以把元组或列表一次赋给多个变量，函数返回多值时很常用。',
        code: 'point = (3, 5)\nx, y = point\nprint(x, y)',
        choice: {
          q: '元组和列表最主要的区别是？',
          options: ['元组能排序', '元组不可变', '元组只能放数字', '元组不能遍历'],
          answer: 1,
          explain: '元组创建后不能增删改元素。',
        },
        fill: {
          q: '把元组 (1, 2) 解包给 a 和 b。\na, b = ___',
          answer: '(1, 2)',
          explain: '等号右边有几个值，左边就写几个变量。',
        },
        order: {
          q: '排好“解包并交换变量”的代码。',
          lines: ['a = 1', 'b = 2', 'a, b = b, a', 'print(a, b)'],
          explain: 'Python 可以一行完成交换。',
        },
        challenge: {
          q: '定义 point = (3, 5)，解包成 x、y，打印 x 和 y。',
          starter: 'point = (3, 5)\n# 解包并打印\n',
          expected: '3 5',
          solution: 'point = (3, 5)\nx, y = point\nprint(x, y)',
          explain: '解包后 x=3、y=5。',
          terms: ['x, y', 'point', 'print'],
        },
      },
      {
        title: '列表推导式',
        summary: '一行完成“遍历 + 过滤 + 变换”。',
        concept: '[表达式 for 变量 in 可迭代对象 if 条件] 是列表推导式。适合简单变换；逻辑复杂时还是写普通循环更清楚。',
        code: 'nums = [1, 2, 3, 4]\nsquares = [n * n for n in nums]\nevens = [n for n in nums if n % 2 == 0]\nprint(squares, evens)',
        choice: {
          q: '[n * 2 for n in [1, 2, 3]] 的结果是？',
          options: ['[1, 2, 3]', '[2, 4, 6]', '[1, 4, 9]', '报错'],
          answer: 1,
          explain: '对每个 n 计算 n * 2。',
        },
        fill: {
          q: '只保留偶数。\n[i for i in nums if i ___ 2 == 0]',
          answer: '%',
          explain: '% 取余，余数为 0 即偶数。',
        },
        order: {
          q: '排好“生成平方列表并打印”的代码。',
          lines: ['nums = [1, 2, 3]', 'squares = [n * n for n in nums]', 'print(squares)'],
          explain: '推导式写在方括号里。',
        },
        challenge: {
          q: '用列表推导式把 [1,2,3,4,5] 中的偶数平方，结果存进 result 并打印。',
          starter: 'nums = [1, 2, 3, 4, 5]\n# 偶数平方\n',
          expected: '[4, 16]',
          solution: 'nums = [1, 2, 3, 4, 5]\nresult = [n * n for n in nums if n % 2 == 0]\nprint(result)',
          explain: '先过滤偶数，再平方。',
          terms: ['for', 'if', 'print', 'n * n'],
        },
      },
    ],
  },
  {
    title: '字典与集合',
    summary: '用键值对描述对象，用集合做去重与集合运算。',
    color: '#ffb86b',
    levels: [
      {
        title: '字典读写',
        summary: '通过 key 快速找到 value。',
        concept: '字典用花括号和 key: value 表示。d[key] 读取，d[key] = value 写入；key 必须可哈希，通常是字符串或数字。',
        code: 'user = {"name": "小明", "age": 18}\nprint(user["name"])\nuser["age"] = 19\nprint(user)',
        choice: {
          q: '向字典写入 age 为 18，正确写法是？',
          options: ['user.age = 18', 'user["age"] = 18', 'user(age) = 18', 'user.append("age", 18)'],
          answer: 1,
          explain: '字典用方括号和 key 写入。',
        },
        fill: {
          q: '读取字典里的 name。\nprint(user[___])',
          answer: '"name"',
          explain: 'key 是字符串，要加引号。',
        },
        order: {
          q: '排好“创建字典、修改、读取”的代码。',
          lines: ['user = {"name": "小明"}', 'user["age"] = 18', 'print(user["name"])'],
          explain: '先创建，再补充键值。',
        },
        challenge: {
          q: '创建字典 user，包含 name="小明"、age=18，打印 name 的值，再把 age 改成 19 并打印整个字典。',
          starter: 'user = {"name": "小明", "age": 18}\n# 读取与修改\n',
          expected: '小明\n{\'name\': \'小明\', \'age\': 19}',
          solution: 'user = {"name": "小明", "age": 18}\nprint(user["name"])\nuser["age"] = 19\nprint(user)',
          explain: '读取用 user["name"]，修改用赋值。',
          terms: ['user["name"]', 'user["age"] = 19', 'print'],
        },
      },
      {
        title: '字典遍历',
        summary: '拿 key、拿 value、或同时拿两者。',
        concept: 'for key in d 遍历 key；d.values() 遍历值；d.items() 同时拿到 key 和 value。顺序是插入顺序。',
        code: 'scores = {"math": 90, "english": 85}\nfor subject, score in scores.items():\n    print(subject, score)',
        choice: {
          q: '同时遍历 key 和 value，用哪个方法？',
          options: ['keys()', 'values()', 'items()', 'pairs()'],
          answer: 2,
          explain: 'items() 返回 (key, value) 对。',
        },
        fill: {
          q: '遍历字典的所有值。\nfor v in d.___():\n    print(v)',
          answer: 'values',
          explain: 'values() 只遍历值。',
        },
        order: {
          q: '排好“遍历字典并打印键值”的代码。',
          lines: ['d = {"a": 1, "b": 2}', 'for k, v in d.items():', '    print(k, v)'],
          explain: 'items 返回键值对，解包给 k、v。',
        },
        challenge: {
          q: '遍历字典 {"a": 1, "b": 2}，每行打印“key=value”。',
          starter: 'd = {"a": 1, "b": 2}\n# 遍历输出\n',
          expected: 'a=1\nb=2',
          solution: 'd = {"a": 1, "b": 2}\nfor k, v in d.items():\n    print(f"{k}={v}")',
          explain: 'items() 配合 f-string 输出。',
          terms: ['items', 'for', 'print'],
        },
      },
      {
        title: 'get 与默认值',
        summary: 'key 不存在时，别让程序崩。',
        concept: 'd.get(key, default) 在 key 不存在时返回默认值，不会抛 KeyError。d[key] 在 key 不存在时会报错。',
        code: 'd = {"a": 1}\nprint(d.get("b", 0))\nprint(d.get("a", 0))',
        choice: {
          q: 'd = {"a": 1}，d.get("b", 0) 的结果是？',
          options: ['报错', 'None', '0', '1'],
          answer: 2,
          explain: 'key 不存在，返回给定的默认值 0。',
        },
        fill: {
          q: '读取 count，不存在时返回 0。\ncount = d.___("count", 0)',
          answer: 'get',
          explain: 'get 提供安全的默认值读取。',
        },
        order: {
          q: '排好“安全统计词频”的代码。',
          lines: ['counts = {}', 'for word in ["a", "b", "a"]:', '    counts[word] = counts.get(word, 0) + 1', 'print(counts)'],
          explain: '每次用 get 取旧值，再加 1。',
        },
        challenge: {
          q: '统计列表 ["a","b","a"] 中每个元素出现次数，存进 counts 并打印。',
          starter: 'items = ["a", "b", "a"]\ncounts = {}\n# 统计\n',
          expected: "{'a': 2, 'b': 1}",
          solution: 'items = ["a", "b", "a"]\ncounts = {}\nfor item in items:\n    counts[item] = counts.get(item, 0) + 1\nprint(counts)',
          explain: 'get 取旧值，不存在从 0 开始。',
          terms: ['get', 'for', 'print', 'counts'],
        },
      },
      {
        title: '集合去重',
        summary: '集合里的元素唯一且无序。',
        concept: 'set(list) 可以快速去重。集合支持 | 并集、& 交集、- 差集。注意集合没有下标，不能 set[0]。',
        code: 'nums = [1, 2, 2, 3]\nunique = set(nums)\nprint(unique)\nprint({1, 2} & {2, 3})',
        choice: {
          q: 'set([1, 2, 2, 3]) 的结果有几个元素？',
          options: ['4', '3', '2', '报错'],
          answer: 1,
          explain: '集合自动去重，剩下 1、2、3。',
        },
        fill: {
          q: '把列表转成集合去重。\nunique = ___(nums)',
          answer: 'set',
          explain: 'set() 创建集合。',
        },
        order: {
          q: '排好“去重并求交集”的代码。',
          lines: ['a = [1, 2, 2, 3]', 'b = [2, 3, 4]', 'common = set(a) & set(b)', 'print(common)'],
          explain: '& 求两个集合的交集。',
        },
        challenge: {
          q: '把 [1,2,2,3,3,3] 去重成集合 unique，再打印它与 {2,3,4} 的交集。',
          starter: 'nums = [1, 2, 2, 3, 3, 3]\n# 去重与交集\n',
          expected: '{2, 3}',
          solution: 'nums = [1, 2, 2, 3, 3, 3]\nunique = set(nums)\nprint(unique & {2, 3, 4})',
          explain: '& 求交集。',
          terms: ['set', '&', 'print'],
        },
      },
      {
        title: '综合计数',
        summary: '字典 + 循环 = 最常用的统计套路。',
        concept: '统计出现次数时，用字典保存“元素 → 次数”。遍历数据，用 get 取旧值加一，最后按值排序可得到 Top N。',
        code: 'words = ["py", "ai", "py"]\ncounts = {}\nfor w in words:\n    counts[w] = counts.get(w, 0) + 1\nprint(sorted(counts.items(), key=lambda x: -x[1]))',
        choice: {
          q: '按值从大到小排序字典项，key 应该写成？',
          options: ['key=lambda x: x[0]', 'key=lambda x: -x[1]', 'key=lambda x: x[1]', 'reverse="value"'],
          answer: 1,
          explain: 'x[1] 是值，取负号实现降序。',
        },
        fill: {
          q: '补全取旧值的默认值 0。\ncounts[w] = counts.___(w, 0) + 1',
          answer: 'get',
          explain: 'get 安全地取旧计数。',
        },
        order: {
          q: '排好“统计并输出最高频元素”的代码。',
          lines: ['words = ["a", "b", "a"]', 'counts = {}', 'for w in words:', '    counts[w] = counts.get(w, 0) + 1', 'top = max(counts, key=counts.get)', 'print(top)'],
          explain: 'max 的 key 参数按字典值比较。',
        },
        challenge: {
          q: '统计 ["a","b","a","c","a"]，打印出现次数最多的元素。',
          starter: 'words = ["a", "b", "a", "c", "a"]\n# 统计并找出最高频\n',
          expected: 'a',
          solution: 'words = ["a", "b", "a", "c", "a"]\ncounts = {}\nfor w in words:\n    counts[w] = counts.get(w, 0) + 1\ntop = max(counts, key=counts.get)\nprint(top)',
          explain: 'max 按 counts 的值取最大。',
          terms: ['get', 'max', 'print'],
        },
      },
    ],
  },
  {
    title: '函数定义与调用',
    summary: '把一段逻辑封装成可复用的名字。',
    color: '#6ee7f9',
    levels: [
      {
        title: 'def 与 return',
        summary: '定义函数，把结果交回去。',
        concept: 'def 定义函数，return 返回结果并立即结束函数。没有 return 时函数返回 None。',
        code: 'def add(a, b):\n    return a + b\n\nprint(add(2, 3))',
        choice: {
          q: '函数没有写 return，调用后返回什么？',
          options: ['0', 'None', '报错', '空字符串'],
          answer: 1,
          explain: 'Python 函数默认返回 None。',
        },
        fill: {
          q: '补全函数定义关键字。\n___ greet(name):\n    return "Hi " + name',
          answer: 'def',
          explain: '定义函数用 def。',
        },
        order: {
          q: '排好“定义函数并调用”的代码。',
          lines: ['def square(n):', '    return n * n', '', 'print(square(4))'],
          explain: '函数定义后，用函数名加括号调用。',
        },
        challenge: {
          q: '定义函数 add(a, b) 返回两数之和，调用 add(2, 3) 并打印结果。',
          starter: '# 定义 add 并调用\n',
          expected: '5',
          solution: 'def add(a, b):\n    return a + b\n\nprint(add(2, 3))',
          explain: 'return 把结果交回调用处。',
          terms: ['def add', 'return', 'print'],
        },
      },
      {
        title: '默认参数',
        summary: '调用时可以省略有默认值的参数。',
        concept: 'def greet(name, prefix="Hi") 中 prefix 有默认值。默认参数要放在无默认参数后面。',
        code: 'def greet(name, prefix="Hi"):\n    return f"{prefix}, {name}"\n\nprint(greet("小明"))\nprint(greet("小明", "Hello"))',
        choice: {
          q: '默认参数应该放在参数列表的什么位置？',
          options: ['最前面', '无默认参数后面', '任意位置', '只能单独一个'],
          answer: 1,
          explain: 'Python 要求默认参数在有默认值的参数之后。',
        },
        fill: {
          q: '给 prefix 一个默认值 "Hi"。\ndef greet(name, prefix=___):',
          answer: '"Hi"',
          explain: '默认值写在等号右边。',
        },
        order: {
          q: '排好“定义带默认参数的函数并调用”的代码。',
          lines: ['def greet(name, prefix="Hi"):', '    return f"{prefix}, {name}"', 'print(greet("小明"))', 'print(greet("小明", "Hello"))'],
          explain: '第二次调用覆盖默认值。',
        },
        challenge: {
          q: '定义 greet(name, prefix="Hi")，返回格式化问候；调用 greet("小明") 并打印。',
          starter: '# 定义 greet\n',
          expected: 'Hi, 小明',
          solution: 'def greet(name, prefix="Hi"):\n    return f"{prefix}, {name}"\n\nprint(greet("小明"))',
          explain: '不传 prefix 时使用默认值。',
          terms: ['def greet', 'prefix="Hi"', 'print'],
        },
      },
      {
        title: '关键字参数',
        summary: '按名字传参，顺序不再重要。',
        concept: '调用时写 add(b=3, a=2) 就是关键字参数。参数多时更易读；位置参数必须在关键字参数之前。',
        code: 'def create_user(name, age):\n    return {"name": name, "age": age}\n\nprint(create_user(age=18, name="小明"))',
        choice: {
          q: 'add(b=3, a=2) 这种写法叫？',
          options: ['位置参数', '关键字参数', '默认参数', '可变参数'],
          answer: 1,
          explain: '按参数名传值就是关键字参数。',
        },
        fill: {
          q: '用关键字参数传入 age=18。\ncreate_user(name="小明", ___)',
          answer: 'age=18',
          explain: '关键字参数写成 名称=值。',
        },
        order: {
          q: '排好“定义并关键字调用”的代码。',
          lines: ['def area(width, height):', '    return width * height', 'print(area(height=3, width=4))'],
          explain: '关键字参数顺序可以与定义不同。',
        },
        challenge: {
          q: '定义 area(width, height) 返回面积，用关键字参数调用 area(height=3, width=4) 并打印。',
          starter: '# 定义 area\n',
          expected: '12',
          solution: 'def area(width, height):\n    return width * height\n\nprint(area(height=3, width=4))',
          explain: '关键字参数按名字匹配。',
          terms: ['def area', 'height=3', 'width=4', 'print'],
        },
      },
      {
        title: '作用域',
        summary: '函数里能看见什么，不能改什么。',
        concept: '函数内部定义的变量是局部变量，函数外看不到。读取全局变量可以，直接修改全局变量需要 global（但不推荐）。',
        code: 'count = 1\n\ndef show():\n    local = 2\n    print(count, local)\n\nshow()',
        choice: {
          q: '函数内部定义的变量，函数外能直接访问吗？',
          options: ['能', '不能', '只能读不能写', '取决于类型'],
          answer: 1,
          explain: '局部变量只在函数内部有效。',
        },
        fill: {
          q: '补全函数定义，让变量只在函数内部存在。\ndef f():\n    ___ = 1',
          answer: 'local',
          explain: '函数内赋值的变量默认是局部变量。',
        },
        order: {
          q: '排好“全局变量 + 函数读取”的代码。',
          lines: ['count = 1', 'def show():', '    print(count)', 'show()'],
          explain: '函数可以读取外层的全局变量。',
        },
        challenge: {
          q: '定义全局 count = 1，函数 show() 打印 count，调用 show()。',
          starter: 'count = 1\n# 定义 show 并调用\n',
          expected: '1',
          solution: 'count = 1\n\ndef show():\n    print(count)\n\nshow()',
          explain: '函数内部可以读取全局变量。',
          terms: ['def show', 'print', 'show()'],
        },
      },
      {
        title: '拆分函数',
        summary: '一个函数只做一件事。',
        concept: '把长逻辑拆成小函数，每个函数有清晰的输入输出。这样更容易测试、复用和定位问题。',
        code: 'def normalize(text):\n    return text.strip().lower()\n\ndef is_valid(text):\n    return len(normalize(text)) > 0\n\nprint(is_valid("  Py "))',
        choice: {
          q: '拆分函数时，最重要的原则是？',
          options: ['函数越长越好', '一个函数只做一件事', '所有函数都不带参数', '函数必须返回字符串'],
          answer: 1,
          explain: '单一职责让函数更容易理解和测试。',
        },
        fill: {
          q: '补全函数调用：先清洗再判断。\nprint(is_valid(___("  Py ")))',
          answer: 'normalize',
          explain: 'is_valid 内部调用 normalize 复用清洗逻辑。',
        },
        order: {
          q: '排好“先定义清洗函数，再定义判断函数”的代码。',
          lines: ['def normalize(text):', '    return text.strip().lower()', '', 'def is_valid(text):', '    return len(normalize(text)) > 0'],
          explain: '被调用的函数要先定义。',
        },
        challenge: {
          q: '定义 normalize(text) 去空格转小写，定义 is_valid(text) 判断清洗后是否非空，打印 is_valid("  Py ")。',
          starter: '# 两个函数\n',
          expected: 'True',
          solution: 'def normalize(text):\n    return text.strip().lower()\n\ndef is_valid(text):\n    return len(normalize(text)) > 0\n\nprint(is_valid("  Py "))',
          explain: '小函数组合出清晰流程。',
          terms: ['def normalize', 'def is_valid', 'return', 'print'],
        },
      },
    ],
  },
  {
    title: '模块与包',
    summary: '站在标准库和别人的肩膀上写代码。',
    color: '#f9a8d4',
    levels: [
      {
        title: 'import 模块',
        summary: '导入整个模块，用点号访问。',
        concept: 'import math 后，用 math.sqrt(16) 调用。模块是 .py 文件，包是带 __init__.py 的目录。',
        code: 'import math\nprint(math.sqrt(16))\nprint(math.pi)',
        choice: {
          q: 'import math 后，求平方根应该写？',
          options: ['sqrt(16)', 'math.sqrt(16)', 'math->sqrt(16)', 'import sqrt'],
          answer: 1,
          explain: '导入模块后，用 模块名.函数名 访问。',
        },
        fill: {
          q: '导入 math 模块。\n___ math',
          answer: 'import',
          explain: 'import 导入整个模块。',
        },
        order: {
          q: '排好“导入模块并计算平方根”的代码。',
          lines: ['import math', 'result = math.sqrt(25)', 'print(result)'],
          explain: '先导入，再调用。',
        },
        challenge: {
          q: '导入 math，计算 81 的平方根并打印。',
          starter: '# 导入 math 并计算\n',
          expected: '9.0',
          solution: 'import math\nprint(math.sqrt(81))',
          explain: 'math.sqrt 返回浮点数。',
          terms: ['import math', 'sqrt', 'print'],
        },
      },
      {
        title: 'from import',
        summary: '只拿需要的名字。',
        concept: 'from math import sqrt 后可以直接写 sqrt(16)。名字冲突时可以用 as 起别名。',
        code: 'from math import sqrt, pi\nprint(sqrt(16))\nprint(pi)',
        choice: {
          q: 'from math import sqrt 后，正确调用是？',
          options: ['math.sqrt(16)', 'sqrt(16)', 'math(16).sqrt', 'import.sqrt(16)'],
          answer: 1,
          explain: 'from import 把名字直接引入当前命名空间。',
        },
        fill: {
          q: '从 math 只导入 sqrt。\nfrom math ___ sqrt',
          answer: 'import',
          explain: 'from 模块 import 名字。',
        },
        order: {
          q: '排好“只导入 sqrt 并计算”的代码。',
          lines: ['from math import sqrt', 'result = sqrt(49)', 'print(result)'],
          explain: '导入后直接使用 sqrt。',
        },
        challenge: {
          q: '从 math 导入 sqrt，计算 64 的平方根并打印。',
          starter: '# from import\n',
          expected: '8.0',
          solution: 'from math import sqrt\nprint(sqrt(64))',
          explain: '导入后无需模块前缀。',
          terms: ['from math import sqrt', 'print'],
        },
      },
      {
        title: 'random 模块',
        summary: '生成随机数，做小游戏和抽样。',
        concept: 'random.randint(a, b) 生成包含两端的随机整数；random.choice(list) 随机取一个；random.shuffle(list) 原地打乱。',
        code: 'import random\nprint(random.randint(1, 6))\nprint(random.choice(["石头", "剪刀", "布"]))',
        choice: {
          q: '生成 1 到 6（含）的随机整数，用？',
          options: ['random.random(1, 6)', 'random.randint(1, 6)', 'random.choice(1, 6)', 'random.range(1, 6)'],
          answer: 1,
          explain: 'randint 包含两端。',
        },
        fill: {
          q: '从列表中随机取一个元素。\npick = random.___(options)',
          answer: 'choice',
          explain: 'choice 从序列中随机选一个。',
        },
        order: {
          q: '排好“导入 random 并掷骰子”的代码。',
          lines: ['import random', 'roll = random.randint(1, 6)', 'print(roll)'],
          explain: '先导入，再调用。',
        },
        challenge: {
          q: '导入 random，生成 1 到 6 的随机整数存进 roll 并打印。',
          starter: 'import random\n# 掷骰子\n',
          expected: '1 到 6 之间的整数',
          solution: 'import random\nroll = random.randint(1, 6)\nprint(roll)',
          explain: 'randint(1, 6) 包含 1 和 6。',
          terms: ['random', 'randint', 'print'],
          executable: false,
        },
      },
      {
        title: '__name__ 入口',
        summary: '让文件既能被导入，也能直接运行。',
        concept: 'if __name__ == "__main__": 下面的代码只在直接运行文件时执行；被 import 时不会执行。',
        code: 'def main():\n    print("running")\n\nif __name__ == "__main__":\n    main()',
        choice: {
          q: 'if __name__ == "__main__": 的作用是？',
          options: ['定义主函数', '只在直接运行时执行', '导入模块', '捕获异常'],
          answer: 1,
          explain: '它把“直接运行”和“被导入”区分开。',
        },
        fill: {
          q: '补全判断，让入口只在直接运行时执行。\nif __name__ == ___:',
          answer: '"__main__"',
          explain: '直接运行时 __name__ 的值是 "__main__"。',
        },
        order: {
          q: '排好“定义 main + 入口判断”的代码。',
          lines: ['def main():', '    print("run")', '', 'if __name__ == "__main__":', '    main()'],
          explain: '入口判断放最后。',
        },
        challenge: {
          q: '定义 main() 打印“run”，并用 __name__ 入口调用它。',
          starter: '# 入口写法\n',
          expected: 'run',
          solution: 'def main():\n    print("run")\n\nif __name__ == "__main__":\n    main()',
          explain: '直接运行文件时入口成立。',
          terms: ['def main', '__name__', '__main__', 'main()'],
        },
      },
      {
        title: '自定义模块',
        summary: '把可复用函数放进单独文件。',
        concept: '新建 utils.py，在里面写函数；另一个文件用 from utils import normalize 使用。模块名就是文件名（不带 .py）。',
        code: '# utils.py\ndef normalize(text):\n    return text.strip().lower()\n\n# main.py\nfrom utils import normalize\nprint(normalize("  Py "))',
        choice: {
          q: '文件 utils.py 被导入时，模块名是？',
          options: ['utils.py', 'utils', './utils', 'py.utils'],
          answer: 1,
          explain: '导入时写文件名去掉 .py。',
        },
        fill: {
          q: '从 utils 模块导入 normalize。\nfrom utils ___ normalize',
          answer: 'import',
          explain: 'from 模块 import 名字。',
        },
        order: {
          q: '排好“定义 normalize 并调用”的代码。',
          lines: ['def normalize(text):', '    return text.strip().lower()', 'print(normalize("  Py "))'],
          explain: '同一文件内先定义后调用。',
        },
        challenge: {
          q: '定义 normalize(text) 去空格转小写，调用 normalize("  Py ") 并打印。',
          starter: '# 定义并调用\n',
          expected: 'py',
          solution: 'def normalize(text):\n    return text.strip().lower()\n\nprint(normalize("  Py "))',
          explain: '函数封装后可以跨文件复用。',
          terms: ['def normalize', 'strip', 'lower', 'print'],
        },
      },
    ],
  },
  {
    title: '文件读写',
    summary: '把数据存到磁盘，再读回来。',
    color: '#fbbf24',
    levels: [
      {
        title: '读取文件',
        summary: '打开、读取、关闭。',
        concept: 'open(path, "r", encoding="utf-8") 打开文件，read() 一次读全部，readlines() 读成列表。记得关闭文件。',
        code: 'with open("notes.txt", "r", encoding="utf-8") as f:\n    content = f.read()\nprint(content)',
        choice: {
          q: '以只读方式打开文件，mode 应该写？',
          options: ['"w"', '"r"', '"a"', '"x"'],
          answer: 1,
          explain: 'r 表示 read，只读。',
        },
        fill: {
          q: '补全文件打开模式：只读。\nwith open(path, ___, encoding="utf-8") as f:',
          answer: '"r"',
          explain: '只读模式是 "r"。',
        },
        order: {
          q: '排好“打开、读取、打印”的代码。',
          lines: ['with open("notes.txt", "r", encoding="utf-8") as f:', '    content = f.read()', 'print(content)'],
          explain: 'with 会自动关闭文件。',
        },
        challenge: {
          q: '用 with open 以只读方式打开 notes.txt（utf-8），读取内容存进 content 并打印。',
          starter: '# 读取 notes.txt\n',
          expected: '文件内容',
          solution: 'with open("notes.txt", "r", encoding="utf-8") as f:\n    content = f.read()\nprint(content)',
          explain: 'with 负责自动关闭文件。',
          terms: ['open', '"r"', 'read', 'print'],
          executable: false,
        },
      },
      {
        title: '写入文件',
        summary: '覆盖写和追加写要分清。',
        concept: '"w" 会清空原文件再写，"a" 会追加到末尾。写入字符串用 write()，不会自动换行。',
        code: 'with open("notes.txt", "w", encoding="utf-8") as f:\n    f.write("hello\\n")\n    f.write("world\\n")',
        choice: {
          q: '以 "w" 模式打开已有文件，会发生什么？',
          options: ['追加内容', '清空后写入', '只读', '报错'],
          answer: 1,
          explain: 'w 会截断文件。',
        },
        fill: {
          q: '补全追加模式。\nwith open(path, ___, encoding="utf-8") as f:',
          answer: '"a"',
          explain: 'a 表示 append 追加。',
        },
        order: {
          q: '排好“写入两行文本”的代码。',
          lines: ['with open("notes.txt", "w", encoding="utf-8") as f:', '    f.write("hello\\n")', '    f.write("world\\n")'],
          explain: 'write 不会自动换行，需要自己加 \\n。',
        },
        challenge: {
          q: '用 with open 以写模式打开 out.txt（utf-8），写入 "hello\\n" 和 "world\\n"。',
          starter: '# 写入 out.txt\n',
          expected: 'hello\nworld',
          solution: 'with open("out.txt", "w", encoding="utf-8") as f:\n    f.write("hello\\n")\n    f.write("world\\n")',
          explain: 'w 模式覆盖写入。',
          terms: ['open', '"w"', 'write'],
          executable: false,
        },
      },
      {
        title: 'with 上下文',
        summary: '让关闭文件变成自动的。',
        concept: 'with 会在代码块结束时自动关闭文件，即使中途异常也会关闭。优于手动 open/close。',
        code: 'with open("notes.txt", "r", encoding="utf-8") as f:\n    for line in f:\n        print(line.strip())',
        choice: {
          q: 'with open(...) 的主要好处是？',
          options: ['自动关闭文件', '自动创建文件', '自动加密', '自动排序'],
          answer: 0,
          explain: 'with 保证退出代码块时关闭文件。',
        },
        fill: {
          q: '补全上下文关键字。\n___ open(path, "r", encoding="utf-8") as f:',
          answer: 'with',
          explain: 'with 管理上下文资源。',
        },
        order: {
          q: '排好“逐行读取并打印”的代码。',
          lines: ['with open("notes.txt", "r", encoding="utf-8") as f:', '    for line in f:', '        print(line.strip())'],
          explain: '文件对象可以直接逐行遍历。',
        },
        challenge: {
          q: '用 with open 逐行读取 notes.txt，去掉每行两端空白后打印。',
          starter: '# 逐行读取\n',
          expected: '每行内容',
          solution: 'with open("notes.txt", "r", encoding="utf-8") as f:\n    for line in f:\n        print(line.strip())',
          explain: 'for line in f 逐行读取，strip 去换行。',
          terms: ['with open', 'for line', 'strip', 'print'],
          executable: false,
        },
      },
      {
        title: '逐行处理',
        summary: '大文件不要一次读进内存。',
        concept: '文件对象可以直接 for 循环逐行读取。统计行数、过滤关键字、清洗数据都适合逐行处理。',
        code: 'count = 0\nwith open("app.log", "r", encoding="utf-8") as f:\n    for line in f:\n        if "ERROR" in line:\n            count += 1\nprint(count)',
        choice: {
          q: '逐行读取大文件，推荐哪种方式？',
          options: ['read() 一次读完', 'for line in f', 'readlines() 再遍历', 'open 两次'],
          answer: 1,
          explain: '逐行迭代不会一次性把整个文件读进内存。',
        },
        fill: {
          q: '判断当前行是否包含 ERROR。\nif "ERROR" ___ line:',
          answer: 'in',
          explain: 'in 判断子串是否存在。',
        },
        order: {
          q: '排好“统计日志中 ERROR 行数”的代码。',
          lines: ['count = 0', 'with open("app.log", "r", encoding="utf-8") as f:', '    for line in f:', '        if "ERROR" in line:', '            count += 1', 'print(count)'],
          explain: '先初始化计数，再逐行判断累加。',
        },
        challenge: {
          q: '逐行读取 app.log，统计包含 "ERROR" 的行数并打印。',
          starter: 'count = 0\n# 逐行统计 ERROR\n',
          expected: 'ERROR 行数',
          solution: 'count = 0\nwith open("app.log", "r", encoding="utf-8") as f:\n    for line in f:\n        if "ERROR" in line:\n            count += 1\nprint(count)',
          explain: '逐行判断并累加。',
          terms: ['for line', 'if', 'in', 'count += 1', 'print'],
          executable: false,
        },
      },
      {
        title: '综合日志统计',
        summary: '读文件、解析、统计、输出。',
        concept: '把文件读取、字符串 split、字典计数组合起来，就能从日志里提取有用的信息。先小步验证，再逐步扩展。',
        code: 'counts = {}\nwith open("app.log", "r", encoding="utf-8") as f:\n    for line in f:\n        level = line.split()[0]\n        counts[level] = counts.get(level, 0) + 1\nprint(counts)',
        choice: {
          q: 'line.split()[0] 取到的是？',
          options: ['整行', '按空白切分后的第一段', '最后一个字符', '行号'],
          answer: 1,
          explain: 'split() 默认按空白切分，[0] 取第一段。',
        },
        fill: {
          q: '按空白切分当前行。\nparts = line.___()',
          answer: 'split',
          explain: 'split() 默认按任意空白切分。',
        },
        order: {
          q: '排好“按日志级别计数”的代码。',
          lines: ['counts = {}', 'with open("app.log", "r", encoding="utf-8") as f:', '    for line in f:', '        level = line.split()[0]', '        counts[level] = counts.get(level, 0) + 1', 'print(counts)'],
          explain: '每行取第一个字段作为级别，再累加。',
        },
        challenge: {
          q: '读取 app.log，按每行第一个字段统计出现次数，存进 counts 并打印。',
          starter: 'counts = {}\n# 按首字段统计\n',
          expected: '统计结果',
          solution: 'counts = {}\nwith open("app.log", "r", encoding="utf-8") as f:\n    for line in f:\n        level = line.split()[0]\n        counts[level] = counts.get(level, 0) + 1\nprint(counts)',
          explain: 'split 取首字段，get 累加。',
          terms: ['split', 'get', 'for line', 'print'],
          executable: false,
        },
      },
    ],
  },
];

function makeLevel(chapterId: string, chapterIndex: number, levelIndex: number, seed: LevelSeed): Level {
  const base = `py-${chapterIndex + 1}-${levelIndex + 1}`;
  const checks: ChallengeCheck[] = (seed.challenge.terms ?? ['print']).map((term) => ({
    type: 'contains' as const,
    value: term,
    message: `代码中需要包含：${term}`,
  }));
  const tasks: LevelTask[] = [
    {
      id: `${base}-1`,
      kind: 'concept',
      title: seed.title,
      body: seed.concept,
      code: seed.code,
      bullets: seed.bullets,
    },
    {
      id: `${base}-2`,
      kind: 'choice',
      prompt: seed.choice.q,
      options: seed.choice.options,
      answer: seed.choice.answer,
      explanation: seed.choice.explain,
      hint: seed.choice.hint,
    },
    {
      id: `${base}-3`,
      kind: 'fill',
      prompt: seed.fill.q,
      answer: seed.fill.answer,
      explanation: seed.fill.explain,
      hint: seed.fill.hint,
    },
    {
      id: `${base}-4`,
      kind: 'order',
      prompt: seed.order.q,
      lines: seed.order.lines,
      explanation: seed.order.explain,
      hint: seed.order.hint,
    },
    {
      id: `${base}-5`,
      kind: 'challenge',
      prompt: seed.challenge.q,
      starter: seed.challenge.starter,
      expected: seed.challenge.expected,
      checks,
      solution: seed.challenge.solution,
      explanation: seed.challenge.explain,
      hint: seed.challenge.hint,
      executable: seed.challenge.executable !== false,
    },
  ];
  return {
    id: base,
    chapterId,
    index: levelIndex + 1,
    title: seed.title,
    summary: seed.summary,
    xp: 45 + levelIndex * 2,
    tasks,
  };
}

export const CURRICULUM: Chapter[] = CHAPTERS.map((chapter, chapterIndex) => {
  const chapterId = `py-${chapterIndex + 1}`;
  return {
    id: chapterId,
    index: chapterIndex + 1,
    title: chapter.title,
    summary: chapter.summary,
    color: chapter.color,
    levels: chapter.levels.map((seed, levelIndex) =>
      makeLevel(chapterId, chapterIndex, levelIndex, seed),
    ),
  };
});

export const ALL_LEVELS = CURRICULUM.flatMap((chapter) => chapter.levels);

export function findChapter(chapterId: string): Chapter | undefined {
  return CURRICULUM.find((chapter) => chapter.id === chapterId);
}

export function findLevel(chapterId: string, levelId: string): Level | undefined {
  return findChapter(chapterId)?.levels.find((level) => level.id === levelId);
}

export function chapterOfLevel(levelId: string): Chapter | undefined {
  return CURRICULUM.find((chapter) => chapter.levels.some((level) => level.id === levelId));
}
