module.exports = function (sequelize, DataTypes) {
  let Project = sequelize.define("Project", {
    name: {
      type: DataTypes.STRING,
      notNull: true,
      notEmpty: true,
      validation: {
        len: [2, 32]
      }
    },
    desc: {
      type: DataTypes.TEXT,
      notNull: true,
      validation: {
        len: [0, 250]
      }
    },
    img: {
      type: DataTypes.STRING,
      notNull: true
    }
  });

  Project.associate = function (models) {
    Project.belongsTo(models.User, {
      foreignKey: {
        allowNull: false
      }
    });
  };

  return Project;
};