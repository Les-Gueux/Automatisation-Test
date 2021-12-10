const jwt = require("jsonwebtoken");

const JWT_SIGN_SECRET = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'

module.exports =  {
    generateTokenForUser(userData){
        return jwt.sign({
            userId: userData.id,
        },
        JWT_SIGN_SECRET,
        {
            expiresIn: "24h"
        })
    },

    parseAuthorization(authorization) {
        return (authorization != null) ? authorization.replace('Bearer ', '') : null;
      },
      getUserId(authorization) {
        let userId = -1;
        const token = module.exports.parseAuthorization(authorization);
        if(token != null) {
          try {
            const jwtToken = jwt.verify(token, JWT_SIGN_SECRET);
            if(jwtToken != null)
              userId = jwtToken.userId;
          } catch(err) {
              console.log(err)
          }
        }
        return userId;
      }
}
