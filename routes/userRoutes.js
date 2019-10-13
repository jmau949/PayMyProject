// Import bcrypt for password hashing
const bcrypt = require("bcrypt");
const usersUtil = require("../misc/usersUtil.js");
const saltRounds = 10;

module.exports = function (app, db) {
    app.post('/create', (req, res) => {
        db.Project.create({
            name: req.body.proName,
            desc: req.body.proDesc,
            img: req.body.proImg,
            UserId: req.session.userID
        }).then(function (result) {
            return res.redirect('/')
        }).catch(function (err) {
            res.json(err)
        });
    });
    app.post('/following', (req, res) => {
        db.Following.create({
            UserId: req.session.userID,
            ProjectId: req.body.upvote,
        }).then(function (result) {
            return res.redirect('/following')
        }).catch(function(err) {
            res.json(err)
        });
    });

    app.get("/logout", function (req, res) {
        req.session.destroy(function (err) {
            if (err) throw err;

            return res.redirect("/");
        });
    });

    app.post("/login", function (req, res) {
        // Obtain user inputs
        let username = ("" + req.body.loginName).trim().toLowerCase();
        let password = ("" + req.body.loginPassword).trim();

        // Find a matching entry
        db.User.findOne({
            where: {
                uName: username
            }
        }).then(function (user) {
            if (user == undefined || user == null) {
                console.log("Could not login user: " + username);
                return res.render('login', {
                    loggedIn: false,
                    error: true,
                    msg: `Username/password incorrect`
                })

            }

            // Compare passwords
            bcrypt.compare(password, user.pass, function (err, result) {
                if (err) throw err;

                if (result) {
                    console.log("Successful login: " + username);

                    // Set session variables
                    req.session.userID = user.id;

                    // Reload homepage with user logged in
                    return res.redirect("/");
                } else {
                    console.log("Could not login user: " + username);

                    return res.render('login', {
                        loggedIn: false,
                        error: true,
                        msg: `Username/password incorrect`
                    });
                }
            });
        });
    });

    app.post("/register", function (req, res) {
        // Obtain user input values
        const newUser = {
            uName: ("" + req.body.username).trim().toLowerCase(),
            pass: ("" + req.body.password).trim(),
            email: ("" + req.body.email).trim().toLowerCase()
        };

        console.log(newUser);

        const passwordVerify = ("" + req.body.passwordVerify).trim();

        // console.log("Validating username");

        // Validate username
        if (!validateUsername(newUser.uName)) {
            return res.render("registration", {
                loggedIn: false,
                error: true,
                msg: `Username does not meet length requirements or contains special characters.`
            });
        }

        // console.log("Validating email");

        // Validate email
        if (!validateEmail(newUser.email)) {
            return res.render("registration", {
                loggedIn: false,
                error: true,
                msg: `Email address does not meet length requirements or is not a valid email format.`
            });
        }

        // console.log("Validating password");

        // Validate password
        if (!validatePassword(newUser.pass, passwordVerify)) {
            return res.render("registration", {
                loggedIn: false,
                error: true,
                msg: `Password does not meet 8 letter requirements or does not match with the password confirmation.`
            });
        }

        // Validate username is not already in database
        usernameExists(newUser.uName, function (usernameTaken) {
            // console.log("Validating username taken");

            if (usernameTaken) {
                console.log("Registration Error: username taken");

                return res.render("registration", {
                    loggedIn: false,
                    error: true,
                    msg: `Username already in use.`
                });
            } else {
                // Validate email is not already in database
                emailExists(newUser.email, function (emailTaken) {
                    // console.log("Validating username taken");

                    if (emailTaken) {
                        console.log("Registration Error: email taken");

                        return res.render("registration", {
                            loggedIn: false,
                            error: true,
                            msg: `Email already in use.`
                        });
                    } else {
                        try {
                            // Hash user password
                            bcrypt.hash(newUser.pass, saltRounds, function (err, hash) {
                                // console.log("Hashing password");

                                if (err) throw err;

                                newUser.pass = hash;

                                // Insert new user into the database
                                db.User.create(newUser).then(function (result) {
                                    // Log db record to server console
                                    console.log("New user registered", newUser.uName, newUser.email);

                                    req.session.userID = result.id;

                                    // Return success status to client
                                    return res.redirect("/");
                                });
                            });
                        } catch (error) {
                            console.log(error);

                            return res.render("registration", {
                                loggedIn: false,
                                error: true,
                                msg: `Server Error: Could not register new user.`
                            });
                        }
                    }
                });
            }
        });
    });







    function validateUsername(username) {
        return (username.length > usersUtil.nameMinLength ||
            username.length < usersUtil.nameMaxLength) &&
            !(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(username));
    }

    function validateEmail(email) {
        return (email.length > usersUtil.emailMinLength ||
            email.length < usersUtil.emailMaxLength) &&
            (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email));
    }

    function validatePassword(password, passwordVerify) {
        return (password.length > usersUtil.passMinLength ||
            password.length < usersUtil.passMaxLength) &&
            (password === passwordVerify);
    }

    function usernameExists(username, cb) {
        db.User.findOne({
            where: {
                uName: username
            }
        }).then(function (result) {
            console.log(result);
            cb(result !== null);
        });
    }

    function emailExists(email, cb) {
        db.User.findOne({
            where: {
                email: email
            }
        }).then(function (result) {
            console.log(result);
            cb(result !== null);
        });
    }
};