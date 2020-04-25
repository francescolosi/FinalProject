var express = require('express');
var app = express();
let {PythonShell}=require('python-shell')
var path=require('path')
const csv=require('csv-parser')
const fs=require('fs')
var mongo = require('mongodb')
var mysql=require('mysql')
var bodyParser= require('body-parser');
const multer =require("multer");
var dataService= require("./dataService.js")
var MongoClient=require('mongodb').MongoClient;
var url="mongodb+srv://frenchie789:simbas123@btsserver-phalw.mongodb.net/test?retryWrites=true&w=majority"
var PORT=10000
const clientSession=require("client-sessions")
var exphbs = require("express-handlebars")

var data=[]
const storage= multer.diskStorage({
  destination: "./userCSV",
  filename:function(req,file,cb){
    cb(null,Date.now()+path.extname(file.originalname))
  }
})
const upload=multer({storage:storage})
app.use(clientSession({
  cookieName:"session",
  secret: "stockbackchecker_BTS_SenecaCollege",
  duration: 2*60*1000,
  activeDuration:1000*60
}))

app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("./userCSV"))
app.engine(".hbs",exphbs(
  {extname:'.hbs',
  defaultLayout:'main'
}))
app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});
app.set('view engine', '.hbs')
app.get("/",function(req,res){
  res.render('home')
})
app.get('/home', function (req, res) { 
  res.render('index')
});

app.get("/passRecov",function(req,res){
  res.render('passRecov')
})

app.get("/logout",function(req,res){
  req.session.reset();
  res.redirect("/home")
})

app.get('/charts',ensureLogin,function(req,res){
  res.render('charts')
})

app.get('/changePass',function(req,res){
  res.render('passChange')
})


app.get('/register',function(req,res){
  res.render('register')
})

app.get('/login',function(req,res){
  res.render('login')
})

app.get('/backtesterinput',ensureLogin,function(req,res){
  res.render('backtesterinput')
})

app.post('/passChange',(req,res)=>{
  req.body.userAgent=req.get("User-Agent")
  dataService.passwordChange(req.body,req.session.user.userName)
  .then(()=>{
    res.render('passChange',{successMessage:"Passowrd Changed"})
  })
  .catch((err)=>{
    res.render("passChange",{errorMessage:err})
  })
})

app.post('/passRecov',function(req,res){
  const email=req.body.email
  dataService.passwordRecovery(req.body).then(()=>{
    res.render('login')
  })
  .catch((err)=>{
    console.log(err)
  })
})
app.post("/login",(req,res)=>{
  req.body.userAgent=req.get("User-Agent")
  dataService.checkUser(req.body).then((user)=>{
    console.log("making cookie")
    req.session.user={
      userName: user.userName
    }
    console.log("Redirectring to charts")
    res.render('charts')
  })
  .catch((err)=>{
    res.render("login",{errorMessage:err, userName:req.body.userName})
  })
})

app.post('/sendFields',(req,res)=>{
  dataService.runPyScript(req.body)
  .then((results)=>{
    res.render("charts",{scriptResults:results})
  })
  .catch((err)=>{
    console.log(err)
  })

})
app.post('/register',(req,res)=>{
  dataService.registerUser(req.body)
  .then(()=>{
   res.render('register', {successMessage:"User Created login through login page"})
  })
  .catch((err)=>{
    res.render("register",{errorMessage:err,userName:req.body.userName})
  })
})

dataService.initialize()
.then(dataService.initialize)
.then(function(){
  app.listen(PORT,function(){
    console.log("app listening on: " + PORT)
  })
}).catch(function(err){
  console.log("unable to start server: "+err)
})

function ensureLogin(req,res,next){
  if (!req.session.user){
    res.redirect("/login");
  }else{
    next()
  }
}
 
