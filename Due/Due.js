function update () {
    console.log("修改Dom")
}

// 这里我在这个对象里面重写了一个get&set方法
let person = {
    // 这里要在前面加一个下划线,要不然外面掉一下执行get函数又会调用自己,就死循环了
    _name: "abc",
    get name() {
        return this._name
    },
    set name(n){
        update();
        this._name = n
    }
};

// 当我执行命令person.name的时候就执行了我重写的这个get方法,返回abc

// 理想状态下,我通过修改数据,调用我自己写的set方法,调用set里面的update方法,通过update方法修改dom

// 实现我上面的这句话

function Due (options) {
    this.el = options.el;
    this.data = options.data;
    this.vNode = null; // 虚拟dom树

    // 这里调用的时候把这个里面的this传进去,因为这个初始化函数还是会生成一个Due的属性
    initData.call(this, options.data);

    // 执行建立dom树的方法,就创建出来一个dom树
    // 我用我传进来的这个id值来捕获这个结点传到这个创建dom树的方法里面去
    let root = document.getElementById(this.el);
    // 把创建好的结点给vNode属性
    this.vNode =  buildVirtualNode(root);

    // 创建时候渲染他,把dom树传进去
    render.call(this, this.vNode);
}

// 我想在想要修改我这个Due的时候我能够知道
// 对这个数据进行初始化
function initData(data){

    let newObject = new Object();

    // 注意我里面一个函数,最后return的时候用到了这个key所以这个key要用let,如果用了var就闭包了,key的值永远是最后一个
    for (let key in data){

        // 这里需要一个嵌套,如果data[key]还是一个对象,那就的用一个新的对象里面的this去操作,因为我需要用另外一个对象去表示这个嵌套里面的对象(左这个嵌套里面的对象的getter和setter方法),所以要把这个新弄出来的temp对象call过去,用这个对象了里面的this,这里解释一遍到后来肯定还是看不懂,那就知道就行了
        let temp;
        if(typeof data[key] === "object"){
            temp = new Object();
            initData.call(temp, data[key]);
        }else{
            temp = data[key];
        }

        // 我通过defineProperty这个方法给data对象,里面的每一个key,添加属性以及get和set方法

        // 如果直接第一个参数传data这么写就又成死循环了,return data[key]的时候就又调了自己
        // 定义一个新的对象,去给newObject,里面去新添加东西

        Object.defineProperty(newObject, key, { // 第一个参数是哪个对象,第二个参数是里面的那个key,第三个参数添加什么
            // 这样设置了以后这个newObject里面只有x,y,z三个key,每一个key的value值就是getter和setter方法,这两个方法调用就返回x,y,z
            configurable: true,
            enumerable: true,
            get: function() {
                console.log("======");
                return temp;
            },
            set: function(n){
                console.log("++++++");
                temp = n;
            }
        });


        // 这个和上面那个是两个东西,这个是直接module.x调用的,上面那个是module.&data调用的
        // 这里这么写就是方便直接moudle.x这么调用就可以直接返回temp的值,如果x是一个对象,那么返回的也是我创造好的新对象
        Object.defineProperty(this, key, {
            configurable: true,
            enumerable: true,
            get: function() {
                console.log("======");
                return temp;
            },
            set: function(n){
                console.log("++++++");
                temp = n;
            }
        })
    }

    this.$data = newObject
}

// 这样就知道数据被修改了
// 最后把console.log("===") 和 console.log("+++")改成操作dom,就可以实现在修改数据的时候改变dom

// 写一个去掉花括号的方法
function dropBorder(text) {
    // substring方法截字符串
    let temp = text.substring(2, text.length);
    let result = temp.substring(0, temp.length - 2)
    return result;
}

// 写一个从Due当中取值的方法, 第一个是总的数据,第二个是字符串
function getValue(data, text) {
    let str = text.split("."); // 先把这个字符串用.拆分
    let result = data;
    for (let i = 0; i < str.length; i++){
        // 我这里需要用到总的数据来调原数据里面的值
        result = result[str[i]]; // 这样的话如果没有点,只有一个x,那就一圈,result赋值为x,如果有点.执行第二圈result赋值为a,所以这么来无论有没有第二层都能赋上值
    }
    return result;
}

// 这里来一个渲染的方法
function render(node) {
    // 判断一下传的是不是VNode结点
    if (!(node instanceof VNode)) {
        throw new Error("node is not instance of VNode");
    }
    // 如果传进来的是dom结点
    if (node.type === 1){
        for (var i = 0; i < node.childNodes.length; i++){
            render.call(this, node.childNodes[i])
        }
    }else{  // 如果传进来的是文本结点
        // 这是一个总的结果
        let tempResult = node.dom.nodeValue;

        // 如果是文字结点就把每一个模板拿出来
        for (let i = 0 ; i < node.template.length; i++){
            // 我要把里面的模板替换成数据
            // 拿出来每一个模板
            let reg = new RegExp("" + node.template[i] + ""); // g代表全局替换
            // 先把{{}}去掉,然后用自己写的getValue方法来获得到值
            let target = getValue(this, dropBorder(node.template[i]));
            // 把这个value里面的值替换成我们的目标
            tempResult = tempResult.replace(reg, target);
        }
        // 全部改完了以后修改结果
        node.dom.nodeValue = tempResult;
    }
}


// 这里来模拟一个虚拟DOM,这个DOM就是包含每一个结点以及这个结点里面的数据

function VNode (dom, type, value) {
    // 建立结点需要知道这个结点的结点名、类型、值、子节点
    this.dom = dom;
    this.type = type;
    this.value = value;
    this.childNodes = [];
    this.template = []; // 标签里面的{{}}模板语法

    // 一个添加结点的方法
    this.appendChild = function (node) {
        // 添加的如果不是VNode对象就错了
        if(!(node instanceof VNode)) {
            throw new Error("node is not instanceof of VNode")
        }
        this.childNodes.push(node);
    };

    // 调用这个方法就把我这个结点的模板语法就存在这了
    this.appendContentTemplate = function (templates) {
        this.template = templates;
    }
}

// 建立结点树的方法,用到了深度优先搜索, 传进来一个根节点

// 我需要分析我这每一个结点里面用到了什么数据,识别我这个使用数据的这个模板
// 用正则
function analysisContentTemplate(text){
    if(text === null){
        return []; // 因为我一个标签里面的数据有可能返回多个值,所以返回数组
    }
    // 这个是找到{{}}里面的东西
    let templateList = text.match(/{{[a-zA-z_]+[a-zA-Z0-9-.]*}}/g)
    // 如果没匹配到返回空,匹配到了返回数组
    return templateList == null ? [] : templateList;
}

function buildVirtualNode(node){
    // 建立结点传入当前结点的结点名,类型,值
    let temp = new VNode(node, node.nodeType, node.nodeValue);

    // 拿到value里面的模板
    let contentTemplate = analysisContentTemplate(node.nodeValue);
    // 调一下函数把模板存在相应的虚拟dom里面
    temp.appendContentTemplate(contentTemplate);

    for (let i = 0; i < node.childNodes.length; i ++){
        // 如果他的这个子节点得nodeType是1就说明他是一个dom结点,就还的往下分析
        if (node.childNodes[i].nodeType === 1){
            let child = buildVirtualNode(node.childNodes[i]);
            // 把他加到子节点中去
            temp.appendChild(child);
        }else if (node.childNodes[i].nodeType === 3){ // 如果是文本结点
            let child = buildVirtualNode(node.childNodes[i]);
            temp.appendChild(child);
        }else{
            continue;
        }
    }
    return temp
}




