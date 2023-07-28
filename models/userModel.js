/** User class for message.ly */

const db = require("../db");
const bcrypt = require("bcrypt");
const ExpressError = require("../expressError");

const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config");


/** User of the site. */

class User {

  /** register new user - inserts a new user in users table
   * 
   *  returns {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 
      //  hash the password entered in the body of the request
      const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
      // insert a new user and their info into users table with 'hashedPassword' replacing  'password'
      const result = await db.query(
        `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
        VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username, password, first_name, last_name, phone`,
        [username, hashedPassword, first_name, last_name, phone]);

      return result.rows[0];
  };

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    const result = await db.query (
      "SELECT username, password FROM users WHERE username = $1",
      [username]);
    let user = result.rows[0];
    // compare password form request body ('password') with hashed password ('user.password') in database to see if they are the same
    let status = await bcrypt.compare(password, user.password);
   
    return status
   
  }
  

  /** Update last_login_at for user by setting last_login_at to current_timestamp*/

  static async updateLoginTimestamp(username) { 
    const result = await db.query(
      `UPDATE users
         SET last_login_at = current_timestamp
         WHERE username = $1
         RETURNING username`,
      [username]);

    if (!result.rows[0]) {
      throw new ExpressError(`No such user: ${username}`, 404);
    }
  }

  /** Get:  get basic info on all users:
   * returns [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const result = await db.query(
      `SELECT username, first_name, last_name, phone FROM users`);
    return result.rows;
  }



  /** Get: get user by username in request URL. Toekn required in request body
   *
   * {_token} => {username,
   *             first_name,
   *             last_name,
   *             phone,
   *             join_at,
   *             last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at 
      FROM users
      WHERE username = $1`,
      [username]);

    if (result.rows.length === 0) {
      throw new ExpressError (`No such user: ${username}`, 404);
    }  

    return result.rows[0];
   }



  /** Return messages from this user. Token required in request body
   *
   * {_token} => [{id, to_username, body, sent_at, read_at}]
   * 
   * where to_username is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    // get all messages from username
    const msgResult = await db.query(
        `SELECT id, to_username, body, sent_at, read_at from messages
        WHERE from_username =$1`,
        [username]);

    // assign 'messages' to 'msgResult.rows' - an array of objects with each object containing all the messages username sent to other users 

    // msgResults.rows = [
    //   {
    //     id: 18,
    //     to_username: 'PercPerc',
    //     body: 'I miss playing with you!',
    //     sent_at: 2023-07-28T15:22:21.620Z,
    //     read_at: null
    //   },
    //   {
    //     id: 19,
    //     to_username: 'PercPerc',
    //     body: 'I hope to see you soon!',
    //     sent_at: 2023-07-28T15:25:03.655Z,
    //     read_at: null
    //   }
    // ]
    const messages = msgResult.rows;

    // map over the 'messages' array and get the details of the user the message was sent to ('to_username'). 
    // For each iteration ('msg'), replace 'username' with the 'username of the user that specific message ('msg') was sent to ('to_username').  
    const message = await Promise.all(messages.map(async(msg) => {
        const userResult = await db.query(
          `SELECT username, first_name, last_name, phone from users 
          WHERE username = $1`,
          [msg.to_username]);

        // replace msg.to_username with the results of the user query 'userResult.rows' so to_username will contain an array of the object that contains all that user's details {username, firstName, lastName and phone} 
        msg.to_username = userResult.rows  
    }
    ));

    return messages
  
   };

    //              - OR -
    //       another way of doing it 

    //   const result = await db.query(
    //     `SELECT m.id,
    //             m.to_username,
    //             u.first_name,
    //             u.last_name,
    //             u.phone,
    //             m.body,
    //             m.sent_at,
    //             m.read_at
    //       FROM messages AS m
    //         JOIN users AS u ON m.to_username = u.username
    //       WHERE from_username = $1`,
    //     [username]);

    // return result.rows.map(m => ({
    //   id: m.id,
    //   to_user: {
    //     username: m.to_username,
    //     first_name: m.first_name,
    //     last_name: m.last_name,
    //     phone: m.phone
    //   },
    //   body: m.body,
    //   sent_at: m.sent_at,
    //   read_at: m.read_at
    // }));


  /** Return messages to this user. Token assigned to msg.from_username is required in request body
   *
   * {_token} => [{id, from_username, body, sent_at, read_at}]
   *
   * where from_username is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    // get all messages to username
    const msgResult = await db.query(
      `SELECT id, from_username, body, sent_at, read_at from messages
      WHERE to_username =$1`,
      [username]);

    // assign 'messages' to 'msgResult.rows' - an array of objects with each object containing all the messages username received from  other users 

    // msgResults.rows = [
    //   {
    //     id: 18,
    //     to_username: 'PercPerc',
    //     body: 'I miss playing with you!',
    //     sent_at: 2023-07-28T15:22:21.620Z,
    //     read_at: null
    //   },
    //   {
    //     id: 19,
    //     to_username: 'PercPerc',
    //     body: 'I hope to see you soon!',
    //     sent_at: 2023-07-28T15:25:03.655Z,
    //     read_at: null
    //   }
    // ] 

    const messages = msgResult.rows;

    const message = await Promise.all(messages.map(async(msg) => {
      const userResult = await db.query(
        `SELECT username, first_name, last_name, phone from users 
        WHERE username = $1`,
        [msg.from_username]);

      // replace msg.to_username with the results of the user query 'userResult.rows' so to_username will contain an array of the object that contains all that user's details {username, firstName, lastName and phone} 
      msg.from_username = userResult.rows  
    }
    ));

    return messages
   };

    //             - OR -
    //       another way of doing it 
     
    //    const result = await db.query(
    //     `SELECT m.id,
    //             m.from_username,
    //             u.first_name,
    //             u.last_name,
    //             u.phone,
    //             m.body,
    //             m.sent_at,
    //             m.read_at
    //       FROM messages AS m
    //        JOIN users AS u ON m.from_username = u.username
    //       WHERE to_username = $1`,
    //     [username]);

    // return result.rows.map(m => ({
    //   id: m.id,
    //   from_user: {
    //     username: m.from_username,
    //     first_name: m.first_name,
    //     last_name: m.last_name,
    //     phone: m.phone,
    //   },
    //   body: m.body,
    //   sent_at: m.sent_at,
    //   read_at: m.read_at
    // }));
    // }
}


module.exports = User;