const asyncLib = require("async");
const jwtUtils = require("../utils/jwt.utils");
const models = require("../models");

const ITEMS_LIMIT = 50;

module.exports = {
  createCoupon (req, res) {
    // Get l'authentification du Header
    const headerAuth = req.headers.authorization;
    const userId = jwtUtils.getUserId(headerAuth);

    // Paramètres
    const {code} = req.body;
    const {dateDebut} = req.body;
    const {dateExpiration} = req.body;
    const {productId} = req.body;
    const {reduction} = req.body;
    const {condition} = req.body;

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
          .then((userFound) => {
            done(null, userFound);
          })
          .catch((err) => res
              .status(500)
              .json({
                error:
                  "Impossible de vérifier lutilisateur ou vous n'êtes pas connecté",
              }));
      },
      // Vérifie si le produit entré existe
      function (userFound, done) {
        if (userFound) {
          console.log("connexion vérifié");
          models.Product.findOne({
            where: { id: productId },
          })
            .then((productFound) => {
              done(null, productFound);
            })
            .catch((err) => res
                .status(500)
                .json({ error: "Impossible de trouver le produit identifié" }));
        } else {
          return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
      },
      // Vérifie que le coupon n'existe pas déjà via le code
      function (productFound, done) {
        if (productFound) {
          models.Coupon.findOne({
            where: { code },
          })
            .then((couponFound) => {
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
            .catch((err) => res
                .status(500)
                .json({
                  error: `Impossible de trouver le coupon identifié${  err}`,
                }));
        } else {
          return res.status(404).json({ error: "Produit non trouvé" });
        }
      },
      function (couponFound, done) {
        if (couponFound == null) {
          models.Coupon.create({
            code,
            dateDebut,
            dateExpiration,
            productId,
            reduction,
            condition,
          }).then((newCoupon) => {
            done(null, newCoupon);
          });
        } else {
          return res.status(404).json({ error: "Coupon non trouvé" });
        }
      },
      function (newCoupon, done) {
        if (newCoupon) {
          return res.status(201).json(newCoupon);
        }
          return res
            .status(500)
            .json({ error: "Impossible de créer le coupon" });

      },
    ]);
  },
  oneCoupon (req, res) {
    // Get l'authentification du Header
    const headerAuth = req.headers.authorization;
    const userId = jwtUtils.getUserId(headerAuth);
    const {code} = req.query;
    asyncLib.waterfall([
      function (done) {
        models.User.findOne({
          where: { id: userId },
        })
          .then((userFound) => {
            console.log(userFound);
            done(null, userFound);
          })
          .catch((err) => res.status(500).json({
              error:
                `Impossible de vérifier lutilisateur ou non connecté${  err}`,
            }));
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
            where: { code },
            include: [
              {
                model: models.Product,
                attributes: ["nom"],
              },
            ],
            truncate: true,
          })
            .then((couponFound) => {
              if (couponFound) {
                res.status(200).json(couponFound);
              } else {
                res.status(404).json({ error: "Coupon Non trouvé" });
              }
            })
            .catch((err) => {
              console.log(err);
              res.status(500).json({ error: `Champs Invalide : ${  err}` });
            });
        } else {
          return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
      },
    ]);
  },
  everyCouponsUsers (req, res) {
    // Get l'authentification du Header
    const headerAuth = req.headers.authorization;
    const userId = jwtUtils.getUserId(headerAuth);

    const {fields} = req.query;
    let limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offset);
    const {order} = req.query;
    if (limit > ITEMS_LIMIT) {
      limit = ITEMS_LIMIT;
    }

    asyncLib.waterfall([
      function (done) {
        models.User.findOne({
          where: { id: userId },
        })
          .then((userFound) => {
            done(null, userFound);
          })
          .catch((err) => res
              .status(500)
              .json({ error: "Impossible de vérifier lutilisateur" }));
      },
      function (userFound, done) {
        if (userFound) {
          models.UsersCoupons.findAll({
            where: { userId },
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
            // order: [order != null ? order.split(":") : ["code", "ASC"]],
            // attributes:
            // fields !== "*" && fields != null ? fields.split(",") : null,
            // limit: !isNaN(limit) ? limit : null,
            // offset: !isNaN(offset) ? offset : null,
            // include: [{
            //   model: models.Product,
            //   attributes: ['nom']
            //  }],
          })
            .then((messages) => {
              if (messages) {
                res.status(200).json(messages);
              } else {
                res.status(404).json({ error: "Coupon Non trouvé" });
              }
            })
            .catch((err) => {
              console.log(err);
              res.status(500).json({ error: `Champs Invalide ${  err}` });
            });
        } else {
          return res
            .status(404)
            .json({ error: "Utilisateur non trouvé ou non connecté" });
        }
      },
    ]);
  },
  createAssociation (req, res) {
    // Get l'authentification du Header
    const headerAuth = req.headers.authorization;
    const userId = jwtUtils.getUserId(headerAuth);

    // Paramètres
    const {code} = req.body;
    let couponId = null;

    if (code.length == null) {
      return res.status(400).json({ error: "Paramètres manquant" });
    }

    asyncLib.waterfall([
      // Vérifie si l'utilisateur est connecté et existant
      function (done) {
        models.User.findOne({
          where: { id: userId },
        })
          .then((userFound) => {
            done(null, userFound);
          })
          .catch((err) => res
              .status(500)
              .json({
                error:
                  `Impossible de vérifier lutilisateur ou vous n'êtes pas connecté${ 
                  err}`,
              }));
      },
      // Vérifie que le coupon existe via le code
      function (userFound, done) {
        if (userFound) {
          models.Coupon.findOne({
            where: { code },
          })
            .then((couponFound) => {
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
            .catch((err) => res
                .status(500)
                .json({
                  error: `Impossible de trouver le coupon identifié${  err}`,
                }));
        } else {
          return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
      },
      function (couponFound, done) {
        if (couponFound != null) {
          couponId = couponFound.id
          models.UsersCoupons.findOne({
            where: { userId,
              couponId },
          })
            .then((userscouponsFound) => {
              done(null, userscouponsFound);
            })
            .catch((err) => res
                .status(500)
                .json({
                  error:
                    `Impossible de vérifier la table UsersCoupons${ 
                    err}`,
                }));
        } else {
          return res.status(404).json({ error: "Coupon non trouvé" });
        }
      },
      function (userscouponsFound, done) {
        if (userscouponsFound == null) {
          models.UsersCoupons.create({
            userId,
            couponId,
          }).then((newUserCoupon) => {
            done(null, newUserCoupon);
          });
        } else {
          return res.status(404).json({ error: "Association déjà existante" });
        }
      },
      function (newUserCoupon, done) {
        if (newUserCoupon) {
          return res.status(201).json(newUserCoupon);
        }
          return res
            .status(500)
            .json({
              error:
                "Impossible de créer l'association coupon pour l'utilisateur",
            });

      },
    ]);
  },
  everyCouponsProduct (req, res) {
    // Get l'authentification du Header
    const headerAuth = req.headers.authorization;
    const userId = jwtUtils.getUserId(headerAuth);
    const {productId} = req.query;

    asyncLib.waterfall([
      function (done) {
        models.User.findOne({
          where: { id: userId },
        })
          .then((userFound) => {
            done(null, userFound);
          })
          .catch((err) => res
              .status(500)
              .json({ error: "Impossible de vérifier lutilisateur" }));
      },
      function (userFound, done) {
        if (userFound) {
          models.Coupon.findAll({
            where: { productId },
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
            .then((messages) => {
              if (messages) {
                res.status(200).json(messages);
              } else {
                res.status(404).json({ error: "Coupon Non trouvé" });
              }
            })
            .catch((err) => {
              console.log(err);
              res.status(500).json({ error: `Champs Invalide ${  err}` });
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
