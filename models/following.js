module.exports = function (sequelize, DataTypes) {
    let Following = sequelize.define('Following', {});

    Following.associate = function (models) {
        Following.belongsTo(models.User, {
            foreignKey: {
                allowNull: false
            }
        });

        Following.belongsTo(models.Project, {
            foreignKey: {
                allowNull: false
            }
        });
    };

    return Following;
};