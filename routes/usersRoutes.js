const express = require("express");
const router = new express.Router();
const User = require("../models/userModel");
const {ensureCorrectUser} = require("../middleware/authMiddleware");

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get("/", async function(req, res, next) {
  try {
    let users = await User.all();
    // {
    //   "users": [
    //     {
    //       "username": "BlossBloss",
    //       "first_name": "Blossom",
    //       "last_name": "Konz",
    //       "phone": "555-555-5555"
    //     },
    //     {
    //       "username": "PercPerc",
    //       "first_name": "Percy",
    //       "last_name": "Konz",
    //       "phone": "555-555-5555"
    //     }
    //   ]
    // }
    return res.json({users});
  } 
  
  catch(err){
    return next(err)
  }
  });


/** GET /:username - get detail of user. 
 *  
 * {_token} =>
 *       {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/

router.get("/:username", ensureCorrectUser, async function(req, res, next) {
    try{
        let user = await User.get(req.params.username);
        // {
        //   "user": {
        //     "username": "BlossBloss",
        //     "first_name": "Blossom",
        //     "last_name": "Konz",
        //     "phone": "555-555-5555",
        //     "join_at": "2023-07-26T23:44:28.721Z",
        //     "last_login_at": "2023-07-27T22:56:04.746Z"
        //   }
        // }
    
        return res.json({user: user});
    } 
    
    catch (err) {
      return next(err)  
    }
});



/** GET /:username/to - get messages to the user. Token sent in body of request is of the user messages are being sent to ('to_username;)
 * 
 * {_token} =>
 *     {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get("/:username/to", ensureCorrectUser, async function(req, res, next) {
  try{
      let messages = await User.messagesTo(req.params.username);
      // {
      // 	"messages": [
      // 		{
      // 			"id": 16,
      // 			"from_username": [
      // 				{
      // 					"username": "PercPerc",
      // 					"first_name": "Percy",
      // 					"last_name": "Konz",
      // 					"phone": "555-555-5555"
      // 				}
      // 			],
      // 			"body": "I sort of miss you?",
      // 			"sent_at": "2023-07-28T15:19:51.219Z",
      // 			"read_at": null
      // 		},
      // 		{
      // 			"id": 22,
      // 			"from_username": [
      // 				{
      // 					"username": "PercPerc",
      // 					"first_name": "Percy",
      // 					"last_name": "Konz",
      // 					"phone": "555-555-5555"
      // 				}
      // 			],
      // 			"body": "How are you likeing SF?",
      // 			"sent_at": "2023-07-28T20:25:23.791Z",
      // 			"read_at": "2023-07-28T21:19:23.579Z"
      // 		}
      // 	]
      // }
    
      return res.json({messages: messages});
  } 
  
  catch (err) {
    return next(err)  
  }
});


/** GET /:username/from - get messages from user. Token sent in body of request is of the user messages are being sent from ('from_username;)
 * 
 *  {_token}  => {messages: [{id,
 *                          to_username: [{username, first_name, last_name, phone}],
 *                          body,
 *                          sent_at,
 *                          read_at}]
 *              }
 *
 **/

router.get("/:username/from", ensureCorrectUser, async function (req, res, next) {
  try {
    // get messages from user with username 'req.params.username' sent along with request
      let messages = await User.messagesFrom(req.params.username);
      // {
      //   "messages": [
      //     {
      //       "id": 16,
      //       "to_username": [
      //         {
      //           "username": "BlossBloss",
      //           "first_name": "Blossom",
      //           "last_name": "Konz",
      //           "phone": "555-555-5555"
      //         }
      //       ],
      //       "body": "I sort of miss you?",
      //       "sent_at": "2023-07-28T15:19:51.219Z",
      //       "read_at": null
      //     },
      //     {
      //       "id": 22,
      //       "to_username": [
      //         {
      //           "username": "BlossBloss",
      //           "first_name": "Blossom",
      //           "last_name": "Konz",
      //           "phone": "555-555-5555"
      //         }
      //       ],
      //       "body": "How are you likeing SF?",
      //       "sent_at": "2023-07-28T20:25:23.791Z",
      //       "read_at": "2023-07-28T21:19:23.579Z"
      //     }
      //   ]
      // }
   
      return res.json({messages: messages});
  } 
  
  catch(err) {
    return next(err) 
  }
})

module.exports = router;