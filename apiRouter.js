var express = require("express");
const couponsController = require("./routes/couponsController");
const productsController = require("./routes/productsController");
var usersController = require("./routes/usersController");

exports.router = (function(){
    var apiRouter = express.Router();

    // Route User
    apiRouter.route("/users/register/").post(usersController.register);
    apiRouter.route("/users/login/").post(usersController.login);
    apiRouter.route("/users/me/").get(usersController.getUserProfile);
    apiRouter.route("/users/me/").put(usersController.updateUserProfile);

    // Route Product
    apiRouter.route("/product/create/").post(productsController.createProduct);
    apiRouter.route("/product/update/").put(productsController.updateProduct);
    apiRouter.route("/product/getall/").get(productsController.everyProduct);
    apiRouter.route("/product/get/").get(productsController.oneProduct);

    // Route Coupon
    apiRouter.route("/coupon/create/").post(couponsController.createCoupon);
    //apiRouter.route("/coupon/getall/").get(couponsController.everyCoupon);
    apiRouter.route("/coupon/get/").get(couponsController.oneCoupon);

    // Association UsersCoupons
    apiRouter.route("/coupon/getall/").get(couponsController.everyCouponsUsers);
    apiRouter.route("/coupon/createAssociation/").post(couponsController.createAssociation);
    apiRouter.route("/coupon/getcouponproduct/").get(couponsController.everyCouponsProduct);   
    return apiRouter;
}) ();