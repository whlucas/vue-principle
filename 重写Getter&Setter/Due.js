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

    // 这里调用的时候把这个里面的this传进去,因为这个初始化函数还是会生成一个Due的属性
    initData.call(this, options.data);
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
