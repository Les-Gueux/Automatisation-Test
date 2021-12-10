var server = require('./app.js')
var PORT = process.env.PORT || 5000;
// Lance le serveur
server.listen(PORT, function() {
    console.log('Serveur en route!');
});