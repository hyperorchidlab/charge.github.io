//structure [{"k": k, "v": v}]
//this is implemented in O(n), do not use this for large dataset
export function OrderMap() {
    this._d = []
    this.size = 0
}

OrderMap.prototype = {
    find: function(key){
        if(this.size == 0){
            return -1
        }
        for(let index in this._d){
            if (this._d[index].k == key){
                return parseInt(index)
            }
        }
        return -1
    },
    keys: function(){
        let ks = []
        for(let index in this._d){
            ks.push(this._d[index].k)
        }
        return ks
    },
    add: function(key,value){
        if(this.find(key)!=-1){
            return false
        }else{
            this._d.push({"k":key, "v":value})
            this.size +=1
            return true
        }
    },
    remove: function(key){
        let index = this.find(key)
        if(index==-1){
            return false
        }else{
            this._d = this._d.slice(0,index).concat(this._d.slice(index+1))
            this.size -=1
            return true
        }
    },
    change: function(key, value){
        let index = this.find(key)
        if (index==-1){
            return false
        }else{
            this._d[index] = {"k": key, "v": value}
            return true
        }
    },
    get: function(key){
        let index = this.find(key)        
        if(index==-1){
            return null
        }else{
            return this._d[index].v
        }
    },
    addOrChange: function(key, value){
        if(this.add(key,value) || this.change(key, value)){
            return true
        }else{
            return false
        }
    },
    flatten: function(key){
        if(key==null){
            key = ""
        }
        let c = []
        for(let index in this._d){
            let o = this._d[index]
            if(o.v.flatten){
                let cc = o.v.flatten(o.k)
                c = c.concat(cc)
            }else{
                c.push({"key":key+o.k, "value":o.v})
            }
        }
        return c
    }
}