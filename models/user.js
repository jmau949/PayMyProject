const usersUtil = require("../misc/usersUtil.js");

module.exports = function (sequelize, DataTypes) {
    let User = sequelize.define('User', {
        uName: {
            type: DataTypes.STRING,
            notNull: true,
            notEmpty: true,
            unique: true,
            validation: {
                len: [usersUtil.nameMinLength, usersUtil.nameMaxLength]
            }
        },
        pass: {
            type: DataTypes.STRING.BINARY,
            notNull: true,
            notEmpty: true,
            validation: {
                len: [usersUtil.passMinLength, usersUtil.passMaxLength]
            }
        },
        email: {
            type: DataTypes.STRING,
            notNull: true,
            notEmpty: true,
            unique: true,
            validation: {
                len: [usersUtil.emailMinLength, usersUtil.emailMaxLength],
                isEmail: true
            }
        }
    });

    User.associate = function (models) {
        User.hasMany(models.Project, {
            onDelete: "cascade"
        });

        User.hasMany(models.Following, {
            onDelete: "cascade"
        });
    };

    return User;
};