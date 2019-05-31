
var express = require('express');
var fs = require('fs');
var router = express.Router();
const bodyParser = require('body-parser');
var validator = require('express-validator');
var mysql = require('mysql');
const SendOtp = require('sendotp');
const sendOtp = new SendOtp('243104AV2DT5I255bc6162c','Your OTP for AutoAd.com is {{otp}}.');
//-----------body parsing(needs to be done before validatior middleware-----------------
router.use(bodyParser.urlencoded({
		extended:true
	}));
router.use(bodyParser.json());
//--------------------------------------------------------------------------------------

//-------------------Database connection--------------
var con = mysql.createConnection({
  host:'127.0.0.1',
  user:'root',
  password:'mysqldb',
  database:'auto_business'
})
//----------------------------------------------------

router.use(validator({
	customValidators:{
		phoneCheck:function(input){   //custom validation function(must return true or false)
			var len = input.length;
			var no = parseInt(input);
			no = Math.floor(no/1000000000);
			if(len==10&&(no==6||no==7||no==8||no==9)){
				return true;
			}
			else
			{
				return false;
			}
		},

		dobCheck:function(input){
			var year = parseInt(input.slice(0,4));
			nowYear = new Date().getFullYear()-year;  
			if(nowYear>=15&&nowYear<=100){
				return true;
			}
			else{
				return false;
			}
		},

		pinCheck:function(input){
			var len = input.length;
			var no = parseInt(input);
			no=Math.floor(no/100000);
			if(len==6&&no!=0){
				return true;
			}
			else{
				return false;
			}
		}
	}
}));
//-----------Forgot pass && reset pass---------
router.get('/forgot_pass',function(req,res){
    fs.readFile('./LoginFiles/forgot_pass.html',function(err,data){
        res.writeHead(200,{'Content-Type':'text/html'});
        res.write(data);
        return res.end();
    });
});

router.post('/forgot_pass_verify',function(req,res){
    var mob = req.body.otp;
    sendOtp.send(mob,611332,function(err,data){
         res.render('otp',{
         changer:'_fpass',
         user:{ph:mob,str:'Enter OTP sent to your provided phone no.'}
         });
         router.post('/verify_otp_fpass',function(req,res){
         var verify_otp = req.body.otp;
         var mob = req.body.mob;        
         console.log(verify_otp);
         console.log(mob);
         sendOtp.verify(mob,verify_otp,function(err,data){
		     if(data.type == 'success'){
		     	res.render('pass_reset',{
		     		mob
		     	})
		     	  router.post('/reset_pass',function(req,res){
                     var pass = req.body.pass;
                     let insert = 'UPDATE users SET pass=? WHERE phone=?';
                     con.query(insert,[pass,mob],function(err,result){
                     	 if(err) throw err;
                         res.render('db_submit',{
        	                    msg:'Your new password has been updated successfully.'
        	                 });
                         return res.end();
                     });    
                  })
               /*  fs.readFile('./LoginFiles/pass_reset.html',function(err,data){
                     if(err) throw err;
                     res.writeHead(200,{'Content-Type':'text/html'});
                     res.write(data);
                     return res.end();
                
                 });*/	              
             }
		     else{
		           res.render('otp',{
		           	 changer:'_fpass',
		             user:{ph:mob,str:'Enter OTP sent to your provided phone no.',msg:'Incorrect OTP1 Try again'}
		            })
		           res.end();
		         };
	                     
	    });    
}); 	
   });
});     

//-------------

//------------initial HTML and CSS get requests-------------- 
router.get('/',function(req,res){
    fs.readFile('./LoginFiles/index.html',function(err,data){
    	if(err) throw err;
    	res.writeHead(200,{'Content-Type':'text/html'});
        res.write(data);
        return res.end();
    });
});

router.get('/util-css',function(req,res){
	fs.readFile('./LoginFiles/css/util.css',function(err,data){
		if(err) throw err;
		res.writeHead(200,{'Content-Type':'text/css'});
		res.write(data);
		return res.end();
	});
});

router.get('/main-css',function(req,res){
	fs.readFile('./LoginFiles/css/main.css',function(err,data){
		if(err) throw err;
		res.writeHead(200,{'Content-Type':'text/css'});
		res.write(data);
		return res.end();
	});
});

//------------------html get requests ends-----------------

router.get('/signup',function(req,res){
	fs.readFile('./LoginFiles/sign_up.html',function(err,data){
		if(err) throw err;
		res.writeHead(200,{'Content-Type':'text/html'});
		res.write(data);
		return res.end();
	});
});
//------OTP global var----
/*router.post('/verify_otp',function(req,res){
	verify_otp = req.body.otp;
})
*/
//---------------------------Sign Up validation---------------
router.post('/submit',function(req,res){
	req.checkBody("firstname","FirstName should have atleast 1 and not more than 20 characters.").isLength({min:1,max:20});
    req.checkBody("lastname","LastName should have atleast 1 and not more than 20 characters.").isLength({min:1,max:20});
    req.checkBody("email","Enter valid e-mail.").isEmail().isLength({min:1,max:60});
    req.checkBody("phone","Enter valid Phone no.").phoneCheck();
    req.checkBody("bdate","Enter valid Date of birth or you must be older than 14 years of age.").dobCheck();
    req.checkBody("pin","Enter valid PIN code.").pinCheck();
    req.checkBody("pass","Password should not exceed more than 24 characters.").isLength({min:1,max:24});
    
    var errors = req.validationErrors();//gives array of error objects
    var a = errors[0];
    var b = errors[1];
    var c = errors[2];
    var d = errors[3];
    var e = errors[4];
    var f = errors[5];
    var g = errors[6];
    if(errors){
    	res.render('signup',{
    		a,b,c,d,e,f,g
    	});
        res.end();
    }
    else{
    	/*con.connect(function(err){
    		if(err) throw err;
    		console.log("Connected to DB!");
    	});
     */
        let firstname = req.body.firstname.toLowerCase();
        let lastname = req.body.lastname.toLowerCase();
        let email = req.body.email;
        let phone = req.body.phone; 
        let mob = '91'+phone; //for otp global
        let bdate = req.body.bdate;
        let city = req.body.city.toLowerCase();
        let pin = req.body.pin;
        let pass = req.body.pass;
        let entry_check = 0;

        let check = "SELECT COUNT(email) AS check_unique FROM users WHERE email=?";
        con.query(check,[email],function(err,result){
        	entry_check = result[0].check_unique;
            if(entry_check==0){
                 
                   sendOtp.send(mob,611332,function(err,data){
            	 	res.render('otp',{
                       changer:'_signup',
                       user:{ph:phone,str:'Enter OTP sent to your provided phone no.'}
            	 	 });
            	   });	

            	   router.post('/verify_otp_signup',function(req,res){
                 	     var verify_otp = req.body.otp;
                 	     var present_otp = req.body.mob;
                 	     console.log(verify_otp);
                 	     console.log(mob);
                 	     sendOtp.verify(mob,verify_otp,function(err,data){
		                     if(data.type == 'success'){
                                 let insert = "INSERT INTO users(firstname,lastname,email,phone,bdate,city,pin,pass) VALUES(?,?,?,?,?,?,?,?)";
                                 con.query(insert,[firstname,lastname,email,phone,bdate,city,pin,pass],function(err){
        	                     if(err) throw err;
        	                     res.render('db_submit',{
        	                     	msg:'You have registered successfully.'
        	                     })
        	                     return res.end();
        	                    //res.send("Data entered into DB successfully");
                                 });
		                     }
		                     else{

		                     	res.render('otp',{
		                     		changer:'_signup',
		                     		user:{ph:phone,str:'Enter OTP sent to your provided phone no.',msg:'Incorrect OTP Try again'}
		                     	})
		                     	res.end();
		                     };
	                     
	                     })    
                    }) 
            } 
            else{                        	 
                 res.render('signup',{
               	 a:{msg:"The provided E-mail is already registered."} 
                })
              res.end();
            }
        })
    }
});
//---------------------------Validation Ends and DB entries end-----------------

//----After verification response page
router.get('/success_image',function(req,res){
    fs.readFile('./LoginFiles/images/icons/success_tick.gif',function(err,data){
    	if(err) throw err;
    	res.writeHead(200,{'Content-Type':'image/gif'});
        res.write(data);
        return res.end();
    });
});
//--------------------------------

router.post("/aju",function(req,res){

	res.send([
    {"id":1,"name":"Ahmedabad"},
    {"id":2,"name":"Bengaluru"},
    {"id":3,"name":"Chennai"},
    {"id":4,"name":"Dehradoon"},
    {"id":5,"name":"Delhi"},
    {"id":6,"name":"Gurugram"},
    {"id":7,"name":"Hyderabad"},
    {"id":8,"name":"Kolkata"},
    {"id":9,"name":"Mumbai"},
    {"id":10,"name":"Noida"},
    {"id":11,"name":"Lucknow"}
])
});

router.get("/region",function(req,res){
var city=req.query.city;
var query = `SELECT sublocality FROM ${city}`;
con.query(query,function(err,result){
	if(err) throw err;
	//console.log(result); 
	res.send(result);
})
})

router.post("/campaign_data",function(req,res){
	console.log(req.body);
	console.log(req.body.city[0]);
	console.log(req.body.city[1]);
	console.log(req.body.region[0]);
	console.log(req.body.region[1]);
  
})

module.exports = router;
