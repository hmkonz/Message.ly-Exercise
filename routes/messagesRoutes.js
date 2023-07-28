const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const {ensureLoggedIn, ensureCorrectUser} = require("../middleware/authMiddleware");

const Message = require("../models/messageModel");


/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", ensureLoggedIn, async function(req, res, next) {
    try{
        let message = await Message.get(req.params.id);
        // {
        //     "message": {
        //         "id": 16,
        //         "body": "I sort of miss you?",
        //         "sent_at": "2023-07-28T15:19:51.219Z",
        //         "read_at": null,
        //         "from_user": {
        //             "username": "PercPerc",
        //             "first_name": "Percy",
        //             "last_name": "Konz",
        //             "phone": "555-555-5555"
        //         },
        //         "to_user": {
        //             "username": "BlossBloss",
        //             "first_name": "Blossom",
        //             "last_name": "Konz",
        //             "phone": "555-555-5555"
        //         }
        //     }
        // }
    
        return res.json({message: message});
    } 
    
    catch (err) {
      return next(err)  
    }
});


/** POST / - post message. Token sent in request body is the one assigned to the user 'from_user'
 *
 * {from_username, to_username, body, _token} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", ensureCorrectUser, async function(req, res, next) {
    // since an object is passed into 'create' method on Messages class, need to pass in an object to Message.create with key/value pairs
    try {
        // assign message to the object containing {from_user, to_user, body} from the body of the request 
        let message = await Message.create({ 
            from_username: req.body.from_username, 
            to_username: req.body.to_username, 
            body: req.body.body});
        
        // {
           // "message": {
                // 	"id": 22,
                // 	"from_username": "PercPerc",
                // 	"to_username": "BlossBloss",
                // 	"body": "How are you likeing SF?",
                // 	"sent_at": "2023-07-28T20:25:23.791Z"
            // }
        // }
        return res.json({message: message});  

    } catch(err) {
      return next(err)
    }
});




/** POST/:id/read - mark message as read. Token sent in request body is the one assigned to the user 'to_user'
 *
 * {from_username, to_username, body, _token} => {message: {id, read_at}}
 * 
 *
 * Make sure that only the intended recipient ('to_user') can mark as read.
 *
 **/

router.post("/:id/read", ensureLoggedIn, async function(req, res, next) {
    try {
        // assign 'username' to the logged in user's username (determined by the specific token sent in request body)
        let username = req.user.username;
        // get a specific message with the id sent along with the request as a parameter (found in the request url)
        let msg = await Message.get(req.params.id);
        // example: 
            // msg: {
                //   id: 22,
                //   body: 'How are you likeing SF?',
                //   sent_at: 2023-07-28T20:25:23.791Z,
                //   read_at: 2023-07-28T20:54:19.356Z,
                //   from_user: {
                //     username: 'PercPerc',
                //     first_name: 'Percy',
                //     last_name: 'Konz',
                //     phone: '555-555-5555'
                //   },
                //   to_user: {
                //     username: 'BlossBloss',
                //     first_name: 'Blossom',
                //     last_name: 'Konz',
                //     phone: '555-555-5555'
                //   }
            // }
       
        // if the username in msg.to_user.username does not equal the username logged in using their specific token sent along with in the request body, return an error; otherwise, continue to next line of code   
        if (msg.to_user.username !== username) {
            throw new ExpressError("Cannot set this message to read", 401);
        }
        // assign 'message' to the object returned from markRead method on Message class with the id found in tthe URL of the request. 
        // message = { id: 22, read_at: 2023-07-28T21:13:46.788Z }
        let message = await Message.markRead(req.params.id);
       
        return res.json({message: message});
    } 
    
    catch (err) {
      return next(err)  
    }
});

         

module.exports = router;