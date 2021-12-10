'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Coupon extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Coupon.belongsTo(models.Product,{
        through: 'Product',
        foreignkey:'productId',
        //as: 'Product'
      });
      //Coupon.belongsToMany(models.User, { through: 'UsersCoupons',foreignkey:'couponId',onDelete: 'CASCADE' });
      Coupon.hasMany(models.UsersCoupons, { foreignkey:'couponId' });
    }
  };
  Coupon.init({
    code: DataTypes.STRING,
    dateDebut: DataTypes.DATE,
    dateExpiration: DataTypes.DATE,
    productId: DataTypes.INTEGER,
    reduction: DataTypes.FLOAT,
    condition: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Coupon',
  });
  return Coupon;
};