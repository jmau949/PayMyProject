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
            UserId: 1
        }).then(function (result) {
            return res.status(200).json({
                msg: "Success!"
            });
        }).catch(function (err) {
            console.log(err)
        });
    })


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
                return res.status(400);
            }

            // Compare passwords
            bcrypt.compare(password, user.pass, function (err, result) {
                if (err) throw err;

                if (result) {
                    console.log("Successful login!");

                    // Set session variables
                    req.session.userID = user.id;

                    // Reload homepage with user logged in
                    return res.redirect("/");
                }

                console.log("Could not login user: " + username);
                return res.status(400);
            });
        });
    });

    app.post("/register", function (req, res) {
        // Obtain user input values

        const newUser = {
            uName: ("" + req.body.name).trim().toLowerCase(),
            pass: ("" + req.body.password).trim(),
            email: ("" + req.body.email).trim().toLowerCase()
        };

        const passwordVerify = req.body.passwordVerify;

        let vFailed = false;

        // Validate username length
        if (newUser.uName.length < usersUtil.nameMinLength || newUser.uName.length > usersUtil.nameMaxLength) {
            vFailed = true;
            return res.json({
                msg: `Username must be between ${usersUtil.nameMinLength} and ${usersUtil.nameMaxLength} characters`
            });
        }

        // Validate username does not have special characters
        if (/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(newUser.uName)) {
            vFailed = true;
            return res.json({
                msg: `Username cannot contain any special characters`
            });
        }

        // Validate email length
        if (newUser.email.length < usersUtil.emailMinLength || newUser.email.length > usersUtil.emailMaxLength) {
            vFailed = true;
            return res.json({
                msg: `Email address must be between ${usersUtil.emailMinLength} and ${usersUtil.emailMaxLength} characters`
            });
        }

        // Validate email format
        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(newUser.email)) {
            vFailed = true;
            return res.json({
                msg: `Email address provided is not valid`
            });
        }

        // Validate password length
        if (newUser.pass.length < usersUtil.passMinLength || newUser.pass.length > usersUtil.passMaxLength) {
            vFailed = true;
            return res.json({
                msg: `Password must be between ${usersUtil.passMinLength} and ${usersUtil.passMaxLength} characters`
            });
        }

        // Validate password and password verification match
        if (newUser.pass !== passwordVerify) {
            vFailed = true;
            return res.json({
                msg: `Passwords do not match`
            });
        }

        // Validate username is not already in database
        db.User.count({
            where: {
                uName: newUser.uName
            }
        }).then(function (uCount) {
            if (uCount !== 0) {
                vFailed = true;
                return res.json({
                    msg: `Username already in use`
                });
            }

            // Validate email is not already in database
            db.User.count({
                where: {
                    email: newUser.email
                }
            }).then(function (eCount) {
                if (eCount !== 0) {
                    vFailed = true;
                    return res.json({
                        msg: `Email already in use`
                    });
                }

                // Create new user if no validations failed
                if (!vFailed) {
                    // Hash user password
                    bcrypt.hash(newUser.pass, saltRounds, function (err, hash) {
                        if (err) throw err;
                        newUser.pass = hash;
                        // Insert new user into the database
                        db.User.create(newUser).then(function (result) {
                            // Log db record to server console
                            console.log(result);
                            req.session.userID = result.id;
                            // Return success status to client
                            return res.redirect("/");
                        }).catch(function (err) {
                            console.log(err)
                        });
                    });
                }
            })
        })
    });
};