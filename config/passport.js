const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: '/api/auth/google/callback'
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails[0].value;
                    
                    // Validate email domain - must be @nitj.ac.in
                    if (!email.toLowerCase().endsWith('@nitj.ac.in')) {
                        return done(new Error('Only NITJ college email addresses (@nitj.ac.in) are allowed'), null);
                    }
                    
                    // Check if user already exists
                    let user = await User.findOne({ email });

                    if (user) {
                        // User exists, return user
                        return done(null, user);
                    }

                    // Create new user
                    // Generate college ID from email
                    const emailPrefix = email.split('@')[0];
                    const collegeId = emailPrefix.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);

                    user = await User.create({
                        name: profile.displayName,
                        email: email,
                        collegeId: collegeId,
                        password: 'google-oauth-' + Math.random().toString(36).substring(7), // Random password
                        role: 'student', // Default role
                        googleId: profile.id,
                        avatar: profile.photos[0]?.value,
                        isActive: true
                    });

                    done(null, user);
                } catch (error) {
                    console.error('Google OAuth Error:', error);
                    done(error, null);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};
