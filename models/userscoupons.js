'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UsersCoupons extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UsersCoupons.belongsTo(models.Coupon,{
        through: 'Coupon',
        foreignkey:'couponId',
      });
      UsersCoupons.belongsTo(models.User,{
        through: 'User',
        foreignkey:'userId',
      });

    }
  };
  UsersCoupons.init({
    userId: DataTypes.INTEGER,
    couponId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'UsersCoupons',
  });
  return UsersCoupons;
};