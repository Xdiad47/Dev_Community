const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
//check the user email is correct or not
const config = require('config');
const { check, validationResult } = require('express-validator');
//json web token
const jwt = require('jsonwebtoken');
//User model
const User = require('../../models/User');
// @route    POST api/users
// @desc     Register User
// @access   Public
router.post(
  '/',
  [
    check('name', 'Name is requiqred').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    try {
      //see if user exists
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }
      //Get users gravatar
      const avatar = gravatar.url(email, {
        si: '200',
        reading: 'pg',
        def: 'mm',
      });

      user = new User({
        name,
        email,
        avatar,
        password,
      });
      // Encrypt Password
      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

      //Return jsonwebtoken

      const payload = {
        user: {
          id: user.id,
        },
      };
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error!');
    }
  }
);

module.exports = router;