var mongoose = require("mongoose");
var sys=require("sys")
let {PythonShell}=require('python-shell')
var Schema = mongoose.Schema;
var moment=require('moment')
var crypto=require('crypto')
var bcrypt=require("bcryptjs")
var userSchema= new Schema({
    "userName": {
        type: String,
        unique: true
    },
    "password": String,
    "email": String,
    "expire":String,
})
/*var forgotPassword= new Schema({
    "user":{
        type:String,
        unique:true
    },
    "resetPassToken":String,
    "expire":Number
})*/
let User;

module.exports.initialize=function(){
    return new Promise(function (resolve,reject){
        console.log("initializing db")
        let db= mongoose.createConnection("mongodb+srv://frenchie789:simbas123@btsserver-phalw.mongodb.net/test?retryWrites=true&w=majority")
        db.on('error',(err)=>{
            console.log("couldnt run mongo")
            reject(err)
        })
        db.once('open',()=>{
            User=db.model("users",userSchema)
            resolve();
        })       

    })
}
module.exports.runPyScript=function(userData){
    return new Promise(function(resolve,reject){
        var shortSMA=Number(userData.shortdatedSMA)
        var longSMA=Number(userData.longdated)
        var cash=Number(userData.startingCash)
        var stock=userData.ticker
        if (shortSMA>0 || longSMA>0 || cash>1 || stock.length>0){
        
            var spawn=require("child_process").spawn
            var process=spawn('python',['./valueGenerator.py',shortSMA,longSMA,cash,stock])
            process.stdout.on('data', function(data){
                var datain=data.toString()
                resolve(datain)
            })
            }else{
                reject("error running script")
        }
    })
}
module.exports.registerUser=function(userData){
    return new Promise(function(resolve,reject){
        if (userData.password.length==0 || userData.password2.length==0){
            reject("Passwords cannot be empty or whitespaces")
        }else {
            if (userData.password!=userData.password2){
                reject("Passwords must match")
            }
            else{
                bcrypt.genSalt(10,function(err,salt){
                    bcrypt.hash(userData.password,salt,function(err,hash){
                        userData.password=hash;
                        let newUser=new User(userData)
                        newUser.save((err)=>{
                            if (err){
                                if (err.code==11000){
                                    reject("Username taken")
                                }else if(err.code!=11000){
                                    reject("there was an error creating the user: "+err)
                                }
                            }else{
                                resolve()
                            }
                        })
                    })
                })
            }
        }
    })
}

module.exports.checkUser=function(userData){
    return new Promise (function(resolve,reject){
        User.findOne({userName:userData.userName})
            .exec()
            .then((foundUser)=>{
                if(!foundUser){
                    console.log("unable to find user")
                    reject("unable to find user: "+ userData.userName)
                }
                else{
                    bcrypt.compare(userData.password,foundUser.password).then((res)=>{
                        if (res==true){
                            console.log("user found")
                            resolve(foundUser)
                        } else if (res==false){
                            reject("Incorrect Password")
                        }
                    })
                }
            })
            .catch(()=>{
                reject("unable to find user")
            })
    })
}

module.exports.passwordRecovery=function(emailIn){
    console.log
    return new Promise(function(resolve,reject){
        emailIn.toString()
        User.findOne({email:emailIn.email})
            .exec()
            .then((foundUser)=>{
                if (!foundUser){
                    console.log("unable to find email")  
                    reject("unable to match email: "+ emailIn.email)
                }else{
                    console.log("email matches an email in db")
                    token=crypto.randomBytes(32).toString('hex')
                    foundUser.password=token
                        foundUser.updateOne((err)=>{
                            if (err){
                                if(err.code!=11000){
                                    reject("error recreating the user")
                                }
                            }else{
                                console.log("update success")
                                resolve()
                            }
                        })
                  
                }
            })
    })
}

module.exports.passwordChange=function(userData,searchUserName){
    return new Promise(function(resolve,reject){
        if (userData.newPass.length==0 || userData.newPass2.length==0){
            reject("Passwords cannot be empty or whitespaces")
        }else {
            if (userData.newPass!=userData.newPass2){
                reject("Passwords must match")
            }
            else{
                bcrypt.genSalt(10,function(err,salt){
                    bcrypt.hash(userData.newPass,salt,function(err,hash){
                        userData.newPass=hash;
                        User.findOne({userName:searchUserName})
                        .exec()
                        .then((foundUser)=>{
                            if (!foundUser){
                                reject("error finding user: "+ searchUserName)
                            }
                            else{
                                foundUser.password=userData.newPass
                                foundUser.save((err)=>{
                                    if (err){
                                        if (err.code==11000){
                                            reject("error saving unew pass")
                                        }else if(err.code!=11000){
                                            reject("there was an error creating the user: "+err)
                                        }
                                    }else{
                                        resolve()
                                    }
                                })
                            }
                        }) 
                    })
                })
            }
        }
    })
}
