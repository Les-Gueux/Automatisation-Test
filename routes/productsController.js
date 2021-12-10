const asyncLib = require("async");
const jwtUtils = require("../utils/jwt.utils");
const models = require("../models");

const ITEMS_LIMIT = 50;

module.exports = {
  createProduct (req, res) {
    // Get l'authentification du Header
    const headerAuth = req.headers.authorization;
    const userId = jwtUtils.getUserId(headerAuth);

    // Paramètres
    const {nom} = req.body;
    const {prix} = req.body;

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
            .then((userFound) => {
              done(null, userFound);
            })
            .catch((err) => res
                .status(500)
                .json({ error: "Impossible de vérifier lutilisateur" }));
        },
        function (userFound, done) {
          if (userFound) {
            models.Product.create({
              nom,
              prix,
            }).then((newProduct) => {
              done(newProduct);
            });
          } else {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
          }
        },
      ],
      (newProduct) => {
        if (newProduct) {
          return res.status(201).json(newProduct);
        } 
          return res
            .status(500)
            .json({ error: "Impossible de créer le produit" });
        
      }
    );
  },
  everyProduct (req, res) {
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

    asyncLib.waterfall(
      [
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
            models.Product.findAll({
              order: [order != null ? order.split(":") : ["nom", "ASC"]],
              attributes:
                fields !== "*" && fields != null ? fields.split(",") : null,
              limit: !isNaN(limit) ? limit : null,
              offset: !isNaN(offset) ? offset : null,
            })
              .then((messages) => {
                if (messages) {
                  res.status(200).json(messages);
                } else {
                  res.status(404).json({ error: "Produits Non trouvé" });
                }
              })
              .catch((err) => {
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
  oneProduct (req, res) {
    // Get l'authentification du Header
    const headerAuth = req.headers.authorization;
    const userId = jwtUtils.getUserId(headerAuth);
    const {nom} = req.query;

    asyncLib.waterfall(
      [
        function (done) {
          models.User.findOne({
            where: { id: userId },
          })
            .then((userFound) => {
              done(null, userFound);
            })
            .catch((err) => res
                .status(500)
                .json({ error: "Impossible de vérifier lutilisateur ou non connecté" }));
        },
        function (userFound, done) {
          if (userFound) {
            models.Product.findOne({
              attributes: ["id","nom", "prix"],
              where: { nom},
              truncate: true,
            })
              .then((messages) => {
                if (messages) {
                  res.status(200).json(messages);
                } else {
                  res.status(404).json({ error: "Produits Non trouvé" });
                }
              })
              .catch((err) => {
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
  updateProduct (req, res) {
    const {nom} = req.body;
    const {prix} = req.body;
    const headerAuth = req.headers.authorization;
    const userId = jwtUtils.getUserId(headerAuth);

    asyncLib.waterfall(
      [
        function (done) {
          models.User.findOne({
            where: { id: userId },
          })
            .then((userFound) => {
              console.log(userFound)
              done(null, userFound);
            })
            .catch((err) => res
                .status(500)
                .json({ error: "Impossible de vérifier lutilisateur" }));
        },
        function (userFound, done) {
          if (userFound) {
          models.Product.findOne({
            attributes: ["id","nom", "prix"],
            where: { nom},
            truncate: true,
          })
            .then((productFound) => {
              console.log("productfound 2 : ")
              console.log(productFound);
              done(null, productFound);
            })
            .catch((err) => res.status(500).json({
                error:
                  "Impossible de trouver le produit",
              }));
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
                prix,
              })
              .then(() => {
                console.log("productfound 4 : ")
                console.log(productFound)
                done(productFound);
              })
              .catch((err) => {
                res
                  .status(500)
                  .json({ error: `Impossible de mettre à jour le produit : ${  err}` });
              });
          } else {
            return res.status(404).json({ error: "Produit non trouvé" });
          }      
        },
      ],
      (updateProduct) => {
        if (updateProduct) {
          return res.status(201).json(updateProduct);
        } 
          return res
            .status(500)
            .json({ error: "Impossible de mettre à jour le produit" });
        
      }
    );
  },
};
