import { market_abi, HOP_abi, batch_abi, market_address, HOP_address, batch_address} from "./address.js"
import { OrderMap } from "./utils.js"

window.onload = async () => {
    window.app = {};
    window.app.oMap = new OrderMap()

    bind()
    u("#network").on("click", start)
    await start()
}

function bind() {
    u("#save-change").on("click", saveChange)
    u("#add-button").on("click", popAdd)
    u("#approve-button").on("click", approve)
    u("#charge").on("click", batchCharge)
}

function showMsgSimple(str) {
    if (typeof imtoken == 'undefined') {
        alert(str)
    } else {
        imToken.callAPI('native.alert', str)
    }
}

function jumpToEtherscan(address) {
    showMsgSimple("redirecting to etherscan")
    setTimeout(() => {
        window.location = 'https://cn.etherscan.com/address/' + address + '#transactions'
    }, 2000)
}

async function start() {
    // Modern dApp browsers...
    if (window.ethereum) {
        u("#broswer_type").html("modern")
        window.web3 = new Web3(ethereum)
        try {
            // await ethereum.enable()
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        } catch (error) {
            showMsgSimple(error.message)
            return
        }
    }
    // Legacy dApp browsers...
    else if (window.web3) {
        window.web3 = new Web3(web3.currentProvider)
    }
    // Non-dApp browsers...
    else {
        showMsgSimple("this is not a DApp browser")
        return
    }


    window.BN = web3.utils.BN
    let accounts = await web3.eth.getAccounts();
    u("#user_address").html(accounts[0]);
    window.app.current_account = accounts[0];

    let network = await web3.eth.net.getNetworkType();
    u("#network").html(network).toggleClass("uk-label-success uk-label-danger")

    window.app.hop = new web3.eth.Contract(HOP_abi, HOP_address)
    window.app.market = new web3.eth.Contract(market_abi, market_address)
    window.app.batch = new web3.eth.Contract(batch_abi, batch_address)

    getBalance()
    getAllPools()

    window.app.hop.methods.allowance(window.app.current_account, batch_address).call().then(d => {
        if(d < 200000000000000000000){
            u("#approve-button").removeClass("hide")
        }else{
            window.app.approved = true
        }
    })
}

async function getBalance() {
    let account = window.app.current_account
    web3.eth.getBalance(account).then(function (d) {
        u("#eth-balance").html((d / 1e18).toFixed(5))
    })
    window.app.hop.methods.balanceOf(account).call().then(function (d) {
        u("#hop-balance").html((d / 1e18).toFixed(5))
    })
}

async function getAllPools() {

    window.app.poolList = await window.app.market.methods.getPoolList().call()

    let pools = [{ "name": "bear", "address": "0xd926548A6eb9A77471Db11833753C7371643a211" },
    { "name": "HK_HOP", "address": "0xfa0628a247e35ba340Eb1D4A058AB8a9755DD044" },
    { "name": "Dragon", "address": "0x5A610EB7123A9822ecD7a114C715c17156617a04" },
    { "name": "jpv2_gr", "address": "0xA5226f019847fAac5bcdce67667E1d8f61e8Eac1" },
    { "name": "india 007", "address": "0x4e19D99eeB2f8b9FDa699340B80455106FDECD95" },
    { "name": "freenet1011", "address": "0xfb0b71a86018559dAA4f5C97b2503d93d898FC83" },
    { "name": "Wonderland", "address": "0x7A8125B5FB3334f01EF79aEe42c4073aCAe2C799"}]
    window.app.pools = pools.reduce(function(a,b) {
        a[b.name] = b.address
        return a
    },{})
    u("#pool-list").html("").append(pool => `<option addr=${pool.address}>${pool.name}</option>`, pools)


}

function popAdd() {
    let account = document.getElementById("account-to-add").value
    if (!web3.utils.isAddress(account)) {
        showMsgSimple("invalid address")
        return
    }
    u("#charge-address").html(account)
    UIkit.modal("#choose-pool").show();
}

function saveChange() {

    let selected = u("#pool-list").children().filter(pool => pool.selected).first()
    let user_address = u("#charge-address").html()
    let name = selected.value

    let number = document.getElementById("charge-number").value
    if (!number > 0) {
        showMsgSimple("invalid charge number")
        return
    }

    let c = window.app.oMap
    if (c.find(user_address) == -1) {
        c.add(user_address, new OrderMap())
    }

    c.get(user_address).addOrChange(name, number)

    updateOMap()
}

function updateOMap() {
    u("#display-list").html("")
    let c = window.app.oMap

    for (let _i of c.keys()) {
        let _li = u(`<li>`)
        u("#display-list").append(_li)
        _li.append(`<span>${_i}</span>`)
            .append(u(`<span uk-icon="trash" class="offset-small"></span>`).on("click", function (e) {
                c.remove(_i)
                updateOMap()
            }))
        for (let _j of c.get(_i).keys()) {
            let _div = u(`<div>`)
            _li.append(_div)
            _div.append(`<span uk-icon="arrow-right"></span>`)
                .append(`<span>${_j}</span>`)
                .append(`<span class="uk-badge offset-small">${c.get(_i).get(_j)}</span>`)
                .append(u(`<span uk-icon="trash" class="offset-small"></span>`).on("click", function (e) {
                    c.get(_i).remove(_j)
                    if (c.get(_i).size == 0) {
                        c.remove(_i)
                    }
                    updateOMap()
                }))
        }
    }

    u("#address-count").html(c.size)
    let hops = c.flatten().map(e => parseFloat(e.value)).reduce((a, b) => a + b)
    u("#hop-count").html(hops)
}

async function approve() {
    try {
        await window.app.hop.methods.approve(batch_address, "420000000000000000000000000")
            .send({ from: window.app.current_account })
        showMsgSimple("approve success")
    } catch (error) {
        if (error.code != 4001) {
            jumpToEtherscan(window.app.current_account)
        }
    }
}

async function batchCharge(){

    if(!window.app.approved){
        showMsgSimple("please approve token first")
        return
    }

    let pools = window.app.pools
    let list = window.app.poolList
    let _user = []
    let _number = []
    let _pool = []
    let _index = []
    let o = window.app.oMap
    for(let u of o.keys()){
        let plist = o.get(u)
        for (let p of plist.keys()){
            _user.push(u)
            _number.push(new BN(plist.get(p) *1e9 ).mul(new BN(1e9)).toString())
            _pool.push(pools[p])
            _index.push(list.indexOf(pools[p]))
        }
    }
    try {
        await window.app.batch.methods.batchCharge(_user, _number, _pool, _index)
                    .send({from : window.app.current_account})
        showMsgSimple("charge success")
    }catch (error) {
        if (error.code != 4001) {
            jumpToEtherscan(window.app.current_account)
        }
    }
    
}