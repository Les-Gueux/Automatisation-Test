var bcrypt = require("bcrypt");
var jwtUtils = require('../utils/jwt.utils');
var models = require("../models");
var asyncLib  = require('async');
//const user = require("../models/user");

//Constante
//Rejette tout les mails foireux
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const PASSWORD_REGEX = /^(?=.*\d).{4,8}$/;

module.exports = {
    register: function(req, res) {
    
        var nom = req.body.nom; 
        var prenom = req.body.prenom; 
        var email = req.body.email; 
        var password = req.body.password; 
        
        if (email == null || nom == null || prenom == null || password == null) {
            return res.status(400).json({"error": "Paramètres Manquant"});
        }

        if (nom.length >= 13 || nom.length <= 2 ) {
            return res.status(400).json({"error": "Le Nom d'utilisateur doit être compris entre 3 et 12 caractères"});
        }

        if (prenom.length >= 13 || prenom.length <= 2 ) {
          return res.status(400).json({"error": "Le Prénom de l'utilisateur doit être compris entre 3 et 12 caractères"});
      }

        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({"error": "Email Non Valide"});           
        }

        if (!PASSWORD_REGEX.test(password)) {
            return res.status(400).json({"error": "Mot de Passe Non Valide"});           
        }  

        asyncLib.waterfall([
            function(done) {
              models.User.findOne({
                attributes: ['email'],
                where: { email: email }
              })
              .then(function(userFound) {
                done(null, userFound);
              })
              .catch(function(err,userFound) {
                return res.status(500).json({ 'error': "Impossible de vérifier l'utilisateur : " + err + "and function userFound : " + userFound });
              });
            },
            function(userFound, done) {
              if (!userFound) {
                bcrypt.genSalt(10, function(err, salt) {
                  bcrypt.hash(password, salt, function( err, bcryptedPassword ) {
                    done(null, userFound, bcryptedPassword);
                });
              });
              } else {
                return res.status(409).json({ 'error': 'Utilisateur déjà existant' });
              }
            },
            function(userFound, bcryptedPassword, done) {
              var newUser = models.User.create({
                email: email,
                nom: nom,
                prenom: prenom,
                password: bcryptedPassword,
              })
              .then(function(newUser) {
                done(newUser);
              })
              .catch(function(err) {
                return res.status(500).json({ 'error': 'cannot add user 1, err : ' +err });
              });
            }
          ], function(newUser) {
            if (newUser) {
              return res.status(201).json({
                'userId': newUser.id
              });
            } else {
              return res.status(500).json({ 'error': 'cannot add user 2, err : ' +err  });
            }
          });
        },
        login: function(req, res) {
          
          // Params
          var email    = req.body.email;
          var password = req.body.password;
      
          if (email == null ||  password == null) {
            return res.status(400).json({ 'error': 'Paramètres manquant' });
          }
      
          asyncLib.waterfall([
            function(done) {
              models.User.findOne({
                where: { email: email }
              })
              .then(function(userFound) {
                done(null, userFound);
              })
              .catch(function(err) {
                return res.status(500).json({ 'error': "Impossible de vérifier l'utilisateur" + err });
              });
            },
            function(userFound, done) {
              if (userFound) {
                bcrypt.compare(password, userFound.password, function(errBycrypt, resBycrypt) {
                  done(null, userFound, resBycrypt);
                });
              } else {
                return res.status(404).json({ 'error': 'Utilisateur inexistant sur la BDD' });
              }
            },
            function(userFound, resBycrypt, done) {
              if(resBycrypt) {
                done(userFound);
              } else {
                return res.status(403).json({ 'error': 'Mot De Passe Invalide' });
              }
            }
          ], function(userFound) {
            if (userFound) {
              return res.status(201).json({
                'userId': userFound.id,
                'token': jwtUtils.generateTokenForUser(userFound)
              });
            } else {
              return res.status(500).json({ 'error': 'Impossible de se connecter sur cet utilisateur' });
            }
          });
        },
        getUserProfile: function(req, res) {
          // Get l'authentification du Header
          var headerAuth  = req.headers['authorization'];
          var userId      = jwtUtils.getUserId(headerAuth);
      
          if (userId < 0)
            return res.status(400).json({ 'error': 'mauvais token' });
      
          models.User.findOne({
            attributes: [ 'id', 'email', 'nom', 'prenom','createdAt','updatedAt' ],
            where: { id: userId }
          }).then(function(user) {
            if (user) {
              res.status(201).json(user);
            } else {
              res.status(404).json({ 'error': 'Utilisateur non trouvé' });
            }
          }).catch(function(err) {
            res.status(500).json({ 'error': 'cannot fetch user' });
          });
        },
        deleteUser: function(req, res){
          var headerAuth  = req.headers['authorization'];
          var userId      = jwtUtils.getUserId(headerAuth);
          var banHammer   = req.body.idDelet;
  
          asyncLib.waterfall([
            function(done) {
              models.User.findOne({
                where: { id: userId},
                truncate: true
            })
            .then(function(userAdminFound) {
                console.log("Id Utilisateur conecté : " + userAdminFound.id);
                // if (userAdminFound.isAdmin == 1){}
                // else{return res.status(500).json({ 'error': "l'utilisateur connecté n'est pas Admin" });}
                done(null);
            })
            .catch(function(err) {
                return res.status(500).json({ 'error': "Impossible de trouver l'utilisateur connecté ou vous n'avez pas les droits nécéssaire" });
            });
          },
              function(done){
                
                  models.User.findOne({
                      where: { id: banHammer},
                      truncate: true
                  })
                  .then(function(UserFound) {
                      console.log("id de l'utilisateur à supprimer : " + UserFound.id);
                      done(null, UserFound);
                  })
                  .catch(function(err) {
                      return res.status(500).json({ 'error': "Impossible de trouver l'utilisateur à supprimer, err : " + err });
                  });
              },
              function(UserFound, done) {
                  if (UserFound) {
                      models.User.destroy({
                          where: { id: banHammer }
                      })
                      .then(function (deleteUser) {
                          done(deleteUser);
                      });
                  
                  } else {
                      return res.status(404).json({ 'error': "L'utilisateur à supprimer n'a pas été trouvé" });
                  }
              },
          ], function(deleteUser){
                  if (deleteUser) {
                      return res.status(201).json(deleteUser);
                  }
                  else {
                      return res.status(500).json({"error": "Impossible de supprimer l'utilisateur"});
                  }
          });
      },
        updateUserProfile: function(req, res) {
          // Getting auth header
          var headerAuth  = req.headers['authorization'];
          var userId      = jwtUtils.getUserId(headerAuth);
      
          // Params
          var nom = req.body.nom;
          var prenom = req.body.prenom;
      
          asyncLib.waterfall([
            function(done) {
              models.User.findOne({
                attributes: ['id', 'nom','prenom'],
                where: { id: userId }
              }).then(function (userFound) {
                done(null, userFound);
              })
              .catch(function(err) {
                return res.status(500).json({ 'error': 'Impossible de vérifier lutilisateur' });
              });
            },
            function(userFound, done) {
              if(userFound) {
                userFound.update({
                  nom: (nom ? nom : userFound.nom),
                  prenom: (prenom ? prenom : userFound.prenom),
                }).then(function() {
                  done(userFound);
                }).catch(function(err) {
                  res.status(500).json({ 'error': 'Impossible de mettre à jour lutilisateur' });
                });
              } else {
                res.status(404).json({ 'error': 'Utilisateur non trouvé' });
              }
            },
          ], function(userFound) {
            if (userFound) {
              return res.status(201).json(userFound);
            } else {
              return res.status(500).json({ 'error': 'Impossible de mettre à jour le profil de lutilisateur' });
            }
          });
        }
      }
