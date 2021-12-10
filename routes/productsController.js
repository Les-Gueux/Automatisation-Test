var jwtUtils = require("../utils/jwt.utils");
var models = require("../models");
var asyncLib = require("async");
const ITEMS_LIMIT = 50;

module.exports = {
  createProduct: function (req, res) {
    // Get l'authentification du Header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);

    // Paramètres
    var nom = req.body.nom;
    var prix = req.body.prix;

    if (nom.length == null || prix == null) {
      return res.status(400).json({ error: "Paramètres manquant" });
    }

    if (nom.length <= 2) {
      return res.status(400).json({
        error: "Paramètres invalide \n Le nom doit faire plus de 2 caractères",
      });
    }
    asyncLib.waterfall(
      [
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
            models.Product.create({
              nom: nom,
              prix: prix,
            }).then(function (newProduct) {
              done(newProduct);
            });
          } else {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
          }
        },
      ],
      function (newProduct) {
        if (newProduct) {
          return res.status(201).json(newProduct);
        } else {
          return res
            .status(500)
            .json({ error: "Impossible de créer le produit" });
        }
      }
    );
  },
  everyProduct: function (req, res) {
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

    asyncLib.waterfall(
      [
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
            models.Product.findAll({
              order: [order != null ? order.split(":") : ["nom", "ASC"]],
              attributes:
                fields !== "*" && fields != null ? fields.split(",") : null,
              limit: !isNaN(limit) ? limit : null,
              offset: !isNaN(offset) ? offset : null,
            })
              .then(function (messages) {
                if (messages) {
                  res.status(200).json(messages);
                } else {
                  res.status(404).json({ error: "Produits Non trouvé" });
                }
              })
              .catch(function (err) {
                console.log(err);
                res.status(500).json({ error: "Champs Invalide" });
              });
          } else {
            return res.status(404).json({ error: "Utilisateur non trouvé ou non connecté" });
          }
        },
      ],
    );
  },
  oneProduct: function (req, res) {
    // Get l'authentification du Header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);
    var nom = req.query.nom;

    asyncLib.waterfall(
      [
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
                .json({ error: "Impossible de vérifier lutilisateur ou non connecté" });
            });
        },
        function (userFound, done) {
          if (userFound) {
            models.Product.findOne({
              attributes: ["id","nom", "prix"],
              where: { nom: nom},
              truncate: true,
            })
              .then(function (messages) {
                if (messages) {
                  res.status(200).json(messages);
                } else {
                  res.status(404).json({ error: "Produits Non trouvé" });
                }
              })
              .catch(function (err) {
                console.log(err);
                res.status(500).json({ error: "Champs Invalide" });
              });
          } else {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
          }
        },
      ],
    );
  },
  updateProduct: function (req, res) {
    var nom = req.body.nom;
    var prix = req.body.prix;
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);

    asyncLib.waterfall(
      [
        function (done) {
          models.User.findOne({
            where: { id: userId },
          })
            .then(function (userFound) {
              console.log(userFound)
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
          models.Product.findOne({
            attributes: ["id","nom", "prix"],
            where: { nom: nom},
            truncate: true,
          })
            .then(function (productFound) {
              console.log("productfound 2 : ")
              console.log(productFound);
              done(null, productFound);
            })
            .catch(function (err) {
              return res.status(500).json({
                error:
                  "Impossible de trouver le produit",
              });
            });
          } else {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
          }
        },
        function (productFound,done ) {
          console.log("productfound 3 : ")
          console.log(productFound)
          if (productFound) {
            productFound
              .update({
                prix: prix,
              })
              .then(function () {
                console.log("productfound 4 : ")
                console.log(productFound)
                done(productFound);
              })
              .catch(function (err) {
                res
                  .status(500)
                  .json({ error: "Impossible de mettre à jour le produit : " + err });
              });
          } else {
            return res.status(404).json({ error: "Produit non trouvé" });
          }      
        },
      ],
      function (updateProduct) {
        if (updateProduct) {
          return res.status(201).json(updateProduct);
        } else {
          return res
            .status(500)
            .json({ error: "Impossible de mettre à jour le produit" });
        }
      }
    );
  },
};
