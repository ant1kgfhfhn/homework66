const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const User = require("../models/User");

function configurePassport(passport) {
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await User.findOne({
            email: email.trim().toLowerCase(),
          });

          if (!user) {
            return done(null, false);
          }

          const passwordMatches = await bcrypt.compare(password, user.password);

          if (!passwordMatches) {
            return done(null, false);
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id).select("-password");

      if (!user) {
        return done(null, false);
      }

      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

module.exports = configurePassport;
