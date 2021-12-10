var jwtUtils = require("../utils/jwt.utils");
var models = require("../models");
var asyncLib = require("async");
const ITEMS_LIMIT = 50;

module.exports = {
  createCoupon: function (req, res) {
    // Get l'authentification du Header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);

    // Paramètres
    var code = req.body.code;
    var dateDebut = req.body.dateDebut;
    var dateExpiration = req.body.dateExpiration;
    var productId = req.body.productId;
    var reduction = req.body.reduction;
    var condition = req.body.condition;

    if (
      code.length == null ||
      reduction == null ||
      dateDebut == null ||
      dateExpiration == null ||
      productId == null ||
      condition.length == null
    ) {
      return res.status(400).json({ error: "Paramètres manquant" });
    }

    asyncLib.waterfall([
      // Vérifie si l'utilisateur est connecté et existant
      function (done) {
        models.User.findOne({
          where: { id: userId },
        })
          .then(function (userFound) {
            done(null, userFound);
          })
          .catch(function (err) {
            return res
              .status(500)
              .json({
                error:
                  "Impossible de vérifier lutilisateur ou vous n'êtes pas connecté",
              });
          });
      },
      // Vérifie si le produit entré existe
      function (userFound, done) {
        if (userFound) {
          console.log("connexion vérifié");
          models.Product.findOne({
            where: { id: productId },
          })
            .then(function (productFound) {
              done(null, productFound);
            })
            .catch(function (err) {
              return res
                .status(500)
                .json({ error: "Impossible de trouver le produit identifié" });
            });
        } else {
          return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
      },
      // Vérifie que le coupon n'existe pas déjà via le code
      function (productFound, done) {
        if (productFound) {
          models.Coupon.findOne({
            where: { code: code },
          })
            .then(function (couponFound) {
              if (couponFound == null) {
                done(null, couponFound);
              } else {
                return res
                  .status(403)
                  .json({
                    error: "Le coupon que vous scanné a déjà été scanné",
                  });
              }
            })
            .catch(function (err) {
              return res
                .status(500)
                .json({
                  error: "Impossible de trouver le coupon identifié" + err,
                });
            });
        } else {
          return res.status(404).json({ error: "Produit non trouvé" });
        }
      },
      function (couponFound, done) {
        if (couponFound == null) {
          models.Coupon.create({
            code: code,
            dateDebut: dateDebut,
            dateExpiration: dateExpiration,
            productId: productId,
            reduction: reduction,
            condition: condition,
          }).then(function (newCoupon) {
            done(null, newCoupon);
          });
        } else {
          return res.status(404).json({ error: "Coupon non trouvé" });
        }
      },
      function (newCoupon, done) {
        if (newCoupon) {
          return res.status(201).json(newCoupon);
        } else {
          return res
            .status(500)
            .json({ error: "Impossible de créer le coupon" });
        }
      },
    ]);
  },
  oneCoupon: function (req, res) {
    // Get l'authentification du Header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);
    var code = req.query.code;
    asyncLib.waterfall([
      function (done) {
        models.User.findOne({
          where: { id: userId },
        })
          .then(function (userFound) {
            console.log(userFound);
            done(null, userFound);
          })
          .catch(function (err) {
            return res.status(500).json({
              error:
                "Impossible de vérifier lutilisateur ou non connecté" + err,
            });
          });
      },
      function (userFound, done) {
        if (userFound) {
          models.Coupon.findOne({
            attributes: [
              "code",
              "dateDebut",
              "dateExpiration",
              "reduction",
              "condition",
            ],
            where: { code: code },
            include: [
              {
                model: models.Product,
                attributes: ["nom"],
              },
            ],
            truncate: true,
          })
            .then(function (couponFound) {
              if (couponFound) {
                res.status(200).json(couponFound);
              } else {
                res.status(404).json({ error: "Coupon Non trouvé" });
              }
            })
            .catch(function (err) {
              console.log(err);
              res.status(500).json({ error: "Champs Invalide : " + err });
            });
        } else {
          return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
      },
    ]);
  },
  everyCouponsUsers: function (req, res) {
    // Get l'authentification du Header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);

    var fields = req.query.fields;
    var limit = parseInt(req.query.limit);
    var offset = parseInt(req.query.offset);
    var order = req.query.order;
    if (limit > ITEMS_LIMIT) {
      limit = ITEMS_LIMIT;
    }

    asyncLib.waterfall([
      function (done) {
        models.User.findOne({
          where: { id: userId },
        })
          .then(function (userFound) {
            done(null, userFound);
          })
          .catch(function (err) {
            return res
              .status(500)
              .json({ error: "Impossible de vérifier lutilisateur" });
          });
      },
      function (userFound, done) {
        if (userFound) {
          models.UsersCoupons.findAll({
            where: { userId: userId },
            attributes: [],
            include: [
              {
                model: models.Coupon,
                attributes: [
                  "code",
                  "dateDebut",
                  "dateExpiration",
                  "reduction",
                  "condition",
                ],
                include: [
                  {
                    model: models.Product,
                    attributes: ["nom","prix"]
                  },
                ],
              },
            ],
            //order: [order != null ? order.split(":") : ["code", "ASC"]],
            //attributes:
            //fields !== "*" && fields != null ? fields.split(",") : null,
            //limit: !isNaN(limit) ? limit : null,
            //offset: !isNaN(offset) ? offset : null,
            // include: [{
            //   model: models.Product,
            //   attributes: ['nom']
            //  }],
          })
            .then(function (messages) {
              if (messages) {
                res.status(200).json(messages);
              } else {
                res.status(404).json({ error: "Coupon Non trouvé" });
              }
            })
            .catch(function (err) {
              console.log(err);
              res.status(500).json({ error: "Champs Invalide " + err });
            });
        } else {
          return res
            .status(404)
            .json({ error: "Utilisateur non trouvé ou non connecté" });
        }
      },
    ]);
  },
  createAssociation: function (req, res) {
    // Get l'authentification du Header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);

    // Paramètres
    var code = req.body.code;
    var couponId = null;

    if (code.length == null) {
      return res.status(400).json({ error: "Paramètres manquant" });
    }

    asyncLib.waterfall([
      // Vérifie si l'utilisateur est connecté et existant
      function (done) {
        models.User.findOne({
          where: { id: userId },
        })
          .then(function (userFound) {
            done(null, userFound);
          })
          .catch(function (err) {
            return res
              .status(500)
              .json({
                error:
                  "Impossible de vérifier lutilisateur ou vous n'êtes pas connecté" +
                  err,
              });
          });
      },
      // Vérifie que le coupon existe via le code
      function (userFound, done) {
        if (userFound) {
          models.Coupon.findOne({
            where: { code: code },
          })
            .then(function (couponFound) {
              if (couponFound != null) {
                done(null, couponFound);
              } else {
                return res
                  .status(403)
                  .json({
                    error: "Le coupon que vous avez scanné n'est pas reconnu",
                  });
              }
            })
            .catch(function (err) {
              return res
                .status(500)
                .json({
                  error: "Impossible de trouver le coupon identifié" + err,
                });
            });
        } else {
          return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
      },
      function (couponFound, done) {
        if (couponFound != null) {
          couponId = couponFound.id
          models.UsersCoupons.findOne({
            where: { userId: userId,
              couponId: couponId },
          })
            .then(function (userscouponsFound) {
              done(null, userscouponsFound);
            })
            .catch(function (err) {
              return res
                .status(500)
                .json({
                  error:
                    "Impossible de vérifier la table UsersCoupons" +
                    err,
                });
            });
        } else {
          return res.status(404).json({ error: "Coupon non trouvé" });
        }
      },
      function (userscouponsFound, done) {
        if (userscouponsFound == null) {
          models.UsersCoupons.create({
            userId: userId,
            couponId: couponId,
          }).then(function (newUserCoupon) {
            done(null, newUserCoupon);
          });
        } else {
          return res.status(404).json({ error: "Association déjà existante" });
        }
      },
      function (newUserCoupon, done) {
        if (newUserCoupon) {
          return res.status(201).json(newUserCoupon);
        } else {
          return res
            .status(500)
            .json({
              error:
                "Impossible de créer l'association coupon pour l'utilisateur",
            });
        }
      },
    ]);
  },
  everyCouponsProduct: function (req, res) {
    // Get l'authentification du Header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);
    var productId = req.query.productId;

    asyncLib.waterfall([
      function (done) {
        models.User.findOne({
          where: { id: userId },
        })
          .then(function (userFound) {
            done(null, userFound);
          })
          .catch(function (err) {
            return res
              .status(500)
              .json({ error: "Impossible de vérifier lutilisateur" });
          });
      },
      function (userFound, done) {
        if (userFound) {
          models.Coupon.findAll({
            where: { productId: productId },
            attributes: [
              "code",
              "dateDebut",
              "dateExpiration",
              "reduction",
              "condition",
            ],
            include: [
              {
                model: models.Product,
                attributes: ["nom", "prix"]
              },
            ],
          })
            .then(function (messages) {
              if (messages) {
                res.status(200).json(messages);
              } else {
                res.status(404).json({ error: "Coupon Non trouvé" });
              }
            })
            .catch(function (err) {
              console.log(err);
              res.status(500).json({ error: "Champs Invalide " + err });
            });
        } else {
          return res
            .status(404)
            .json({ error: "Utilisateur non trouvé ou non connecté" });
        }
      },
    ]);
  },
};
